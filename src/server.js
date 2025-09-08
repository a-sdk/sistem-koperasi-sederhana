const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

// Middleware untuk mem-parsing body request dalam format JSON
app.use(express.json());

// Endpoint untuk menambah anggota baru
app.post('/api/anggota', (req, res) => {
  const { nama, alamat, telepon } = req.body;
  if (!nama) {
    return res.status(400).json({ error: 'Nama anggota wajib diisi.' });
  }

  db.serialize(() => {
    const sqlAnggota = 'INSERT INTO anggota (nama, alamat, telepon) VALUES (?, ?, ?)';
    db.run(sqlAnggota, [nama, alamat, telepon], function(err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Gagal menambahkan anggota.' });
      }

      const newAnggotaId = this.lastID;
      const simpananTypes = ['pokok', 'wajib', 'sukarela'];
      let completedInserts = 0;

      simpananTypes.forEach(type => {
        const sqlTabungan = 'INSERT INTO tabungan (anggota_id, jenis_simpanan, saldo) VALUES (?, ?, 0)';
        db.run(sqlTabungan, [newAnggotaId, type], (err) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Gagal membuat akun tabungan.' });
          }
          completedInserts++;
          if (completedInserts === simpananTypes.length) {
            res.status(201).json({ id: newAnggotaId, message: 'Anggota dan akun tabungan berhasil ditambahkan.' });
          }
        });
      });
    });
  });
});

// Endpoint untuk mengambil semua anggota beserta saldonya (dengan pagination)
app.get('/api/anggota', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  const sql = `
    SELECT a.id, a.nama, a.alamat, a.telepon,
           COALESCE(t_pokok.saldo, 0) AS saldo_pokok,
           COALESCE(t_wajib.saldo, 0) AS saldo_wajib,
           COALESCE(t_sukarela.saldo, 0) AS saldo_sukarela,
           COALESCE(SUM(t_pokok.saldo + t_wajib.saldo + t_sukarela.saldo), 0) AS total_saldo
    FROM anggota a
    LEFT JOIN tabungan t_pokok ON a.id = t_pokok.anggota_id AND t_pokok.jenis_simpanan = 'pokok'
    LEFT JOIN tabungan t_wajib ON a.id = t_wajib.anggota_id AND t_wajib.jenis_simpanan = 'wajib'
    LEFT JOIN tabungan t_sukarela ON a.id = t_sukarela.anggota_id AND t_sukarela.jenis_simpanan = 'sukarela'
    GROUP BY a.id
    LIMIT ? OFFSET ?
  `;
  db.all(sql, [limit, offset], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Gagal mengambil data anggota.' });
    }
    res.status(200).json(rows);
  });
});

// Endpoint baru untuk mendapatkan total jumlah anggota
app.get('/api/anggota/count', (req, res) => {
    const sql = `SELECT COUNT(*) AS count FROM anggota`;
    db.get(sql, [], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Gagal menghitung jumlah anggota.' });
        }
        res.status(200).json(row);
    });
});

// Endpoint untuk transaksi
app.post('/api/transaksi', (req, res) => {
  const { anggota_id, jenis_transaksi, jenis_simpanan, jumlah, keterangan, pinjaman_id } = req.body;
  const tanggal = new Date().toISOString();

  if (!anggota_id || !jenis_transaksi || !jumlah) {
    return res.status(400).json({ error: 'Data transaksi tidak lengkap.' });
  }
  if (isNaN(jumlah)) {
      return res.status(400).json({ error: 'Jumlah harus berupa angka.' });
  }

  db.serialize(() => {
    const sqlTransaksi = `
      INSERT INTO transaksi (anggota_id, tanggal, jenis_transaksi, jenis_simpanan, jumlah, keterangan)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.run(sqlTransaksi, [anggota_id, tanggal, jenis_transaksi, jenis_simpanan, jumlah, keterangan], function(err) {
      if (err) {
        console.error('KESALAHAN SAAT MENAMBAHKAN TRANSAKSI:');
        console.error(err);
        return res.status(500).json({ error: 'Gagal mencatat transaksi.' });
      }

      if (jenis_transaksi === 'pembayaran_pinjaman') {
        if (!pinjaman_id) {
          return res.status(400).json({ error: 'ID pinjaman harus disertakan.' });
        }
        db.run(
          'UPDATE pinjaman SET sisa_pinjam = sisa_pinjam - ?, status = CASE WHEN sisa_pinjam - ? <= 0 THEN "lunas" ELSE "belum_lunas" END WHERE id = ?',
          [jumlah, jumlah, pinjaman_id],
          function(err) {
            if (err) {
              console.error('KESALAHAN SAAT MEMPERBARUI PINJAMAN:');
              console.error(err);
              return res.status(500).json({ error: 'Gagal memperbarui pinjaman.' });
            }
          }
        );
      }
      
      // Update saldo berdasarkan jenis simpanan
      if (jenis_transaksi === 'setoran') {
          const sqlSaldo = `UPDATE tabungan SET saldo = saldo + ? WHERE anggota_id = ? AND jenis_simpanan = ?`;
          db.run(sqlSaldo, [jumlah, anggota_id, jenis_simpanan], function(err) {
              if (err) {
                  console.error('KESALAHAN SAAT MEMPERBARUI SALDO:');
                  console.error(err);
                  return res.status(500).json({ error: 'Gagal memperbarui saldo.' });
              }
          });
      } else if (jenis_transaksi === 'penarikan') {
          const sqlSaldo = `UPDATE tabungan SET saldo = saldo - ? WHERE anggota_id = ? AND jenis_simpanan = 'sukarela'`;
          db.run(sqlSaldo, [jumlah, anggota_id], function(err) {
              if (err) {
                  console.error('KESALAHAN SAAT MEMPERBARUI SALDO:');
                  console.error(err);
                  return res.status(500).json({ error: 'Gagal memperbarui saldo.' });
              }
          });
      }

      res.status(201).json({ message: 'Transaksi berhasil dicatat.', transaksi_id: this.lastID });
    });
  });
});

// Endpoint untuk mencatat pinjaman baru
app.post('/api/pinjaman', (req, res) => {
    const { anggota_id, jumlah, keterangan } = req.body;
    const tanggal_pinjam = new Date().toISOString();
    if (!anggota_id || !jumlah) {
        return res.status(400).json({ error: 'Data pinjaman tidak lengkap.' });
    }
    db.run(
        'INSERT INTO pinjaman (anggota_id, tanggal_pinjam, jumlah_pinjam, sisa_pinjam, keterangan) VALUES (?, ?, ?, ?, ?)',
        [anggota_id, tanggal_pinjam, jumlah, jumlah, keterangan],
        function(err) {
            if (err) {
                console.error('KESALAHAN SAAT MENCATAT PINJAMAN:');
                console.error(err);
                return res.status(500).json({ error: 'Gagal mencatat pinjaman.' });
            }
            res.status(201).json({ message: 'Pinjaman berhasil dicatat.', pinjaman_id: this.lastID });
        }
    );
});

// Endpoint untuk mengambil daftar pinjaman berdasarkan ID anggota
app.get('/api/pinjaman/:anggota_id', (req, res) => {
    const anggotaId = req.params.anggota_id;

    const sql = `
        SELECT id, tanggal_pinjam, jumlah_pinjam, sisa_pinjam, status, keterangan
        FROM pinjaman
        WHERE anggota_id = ?
        ORDER BY tanggal_pinjam DESC
    `;
    
    db.all(sql, [anggotaId], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Gagal mengambil data pinjaman.' });
        }
        res.status(200).json(rows);
    });
});

// Endpoint untuk mengambil daftar transaksi berdasarkan ID anggota
app.get('/api/transaksi/:anggota_id', (req, res) => {
    const anggotaId = req.params.anggota_id;

    const sql = `
        SELECT *
        FROM transaksi
        WHERE anggota_id = ?
        ORDER BY tanggal DESC
    `;
    let params = [anggotaId];

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Gagal mengambil data transaksi.' });
        }
        res.status(200).json(rows);
    });
});

// Endpoint untuk hapus anggota
app.delete('/api/anggota/:id', (req, res) => {
    const anggotaId = req.params.id;

    db.serialize(() => {
        db.run('DELETE FROM transaksi WHERE anggota_id = ?', [anggotaId], (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Gagal menghapus transaksi terkait.' });
            }

            db.run('DELETE FROM tabungan WHERE anggota_id = ?', [anggotaId], (err) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'Gagal menghapus saldo anggota.' });
                }

                db.run('DELETE FROM pinjaman WHERE anggota_id = ?', [anggotaId], (err) => {
                    if (err) {
                        console.error(err.message);
                        return res.status(500).json({ error: 'Gagal menghapus pinjaman terkait.' });
                    }

                    db.run('DELETE FROM anggota WHERE id = ?', [anggotaId], function(err) {
                        if (err) {
                            console.error(err.message);
                            return res.status(500).json({ error: 'Gagal menghapus anggota.' });
                        }
                        if (this.changes === 0) {
                            return res.status(404).json({ error: 'Anggota tidak ditemukan.' });
                        }
                        res.status(200).json({ message: 'Anggota, saldo, transaksi, dan pinjaman terkait berhasil dihapus.' });
                    });
                });
            });
        });
    });
});

// Endpoint untuk mencari anggota berdasarkan nama
app.get('/api/anggota/cari', (req, res) => {
    const namaAnggota = req.query.nama;
    if (!namaAnggota) {
        return res.status(400).json({ error: 'Nama anggota wajib diisi untuk pencarian.' });
    }
    const sql = `
        SELECT a.id, a.nama, a.alamat, a.telepon,
           COALESCE(t_pokok.saldo, 0) AS saldo_pokok,
           COALESCE(t_wajib.saldo, 0) AS saldo_wajib,
           COALESCE(t_sukarela.saldo, 0) AS saldo_sukarela,
           COALESCE(SUM(t_pokok.saldo + t_wajib.saldo + t_sukarela.saldo), 0) AS total_saldo,
           SUM(COALESCE(p.sisa_pinjam, 0)) AS total_pinjaman
        FROM anggota a
        LEFT JOIN tabungan t_pokok ON a.id = t_pokok.anggota_id AND t_pokok.jenis_simpanan = 'pokok'
        LEFT JOIN tabungan t_wajib ON a.id = t_wajib.anggota_id AND t_wajib.jenis_simpanan = 'wajib'
        LEFT JOIN tabungan t_sukarela ON a.id = t_sukarela.anggota_id AND t_sukarela.jenis_simpanan = 'sukarela'
        LEFT JOIN pinjaman p ON a.id = p.anggota_id AND p.status = 'belum_lunas'
        WHERE a.nama LIKE ?
        GROUP BY a.id
        LIMIT 10
    `;
    const searchTerm = `%${namaAnggota}%`;
    db.all(sql, [searchTerm], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Gagal mencari anggota.' });
        }
        res.status(200).json(rows);
    });
});

// Endpoint untuk mengambil riwayat pinjaman dengan filter tanggal
app.get('/api/pinjaman/:anggota_id', (req, res) => {
    const anggotaId = req.params.anggota_id;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let sql = `
        SELECT id, tanggal_pinjam, jumlah_pinjam, sisa_pinjam, status, keterangan
        FROM pinjaman
        WHERE anggota_id = ?
    `;
    let params = [anggotaId];

    if (startDate && endDate) {
        const fullEndDate = endDate + 'T23:59:59.999Z';
        sql += ` AND tanggal_pinjam BETWEEN ? AND ?`;
        params.push(startDate, fullEndDate);
    }
    sql += ` ORDER BY tanggal_pinjam DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Gagal mengambil data pinjaman.' });
        }
        res.status(200).json(rows);
    });
});

// Endpoint untuk mengambil riwayat transaksi dengan filter tanggal
app.get('/api/transaksi/:anggota_id', (req, res) => {
    const anggotaId = req.params.anggota_id;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let sql = `
        SELECT *
        FROM transaksi
        WHERE anggota_id = ?
    `;
    let params = [anggotaId];

    if (startDate && endDate) {
        const fullEndDate = endDate + 'T23:59:59.999Z';
        sql += ` AND tanggal BETWEEN ? AND ?`;
        params.push(startDate, fullEndDate);
    }
    sql += ` ORDER BY tanggal DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Gagal mengambil data transaksi.' });
        }
        res.status(200).json(rows);
    });
});

// Endpoint untuk rekapitulasi transaksi
app.get('/api/rekap/transaksi', (req, res) => {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let sql = `
        SELECT jenis_transaksi, jenis_simpanan, SUM(jumlah) AS total
        FROM transaksi
    `;
    let params = [];

    if (startDate && endDate) {
        const fullEndDate = endDate + 'T23:59:59.999Z';
        sql += ` WHERE tanggal BETWEEN ? AND ?`;
        params.push(startDate, fullEndDate);
    }
    
    sql += ` GROUP BY jenis_transaksi, jenis_simpanan`;

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Gagal mengambil rekapitulasi transaksi.' });
        }
        res.status(200).json(rows);
    });
});

// Endpoint untuk rekapitulasi pinjaman
app.get('/api/rekap/pinjaman', (req, res) => {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let sql = `
        SELECT status, SUM(jumlah_pinjam) AS total_pinjam, SUM(sisa_pinjam) AS total_sisa
        FROM pinjaman
    `;
    let params = [];

    if (startDate && endDate) {
        const fullEndDate = endDate + 'T23:59:59.999Z';
        sql += ` WHERE tanggal_pinjam BETWEEN ? AND ?`;
        params.push(startDate, fullEndDate);
    }

    sql += ` GROUP BY status`;
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Gagal mengambil rekapitulasi pinjaman.' });
        }
        res.status(200).json(rows);
    });
});

// Contoh endpoint API sederhana untuk pengujian
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Server berhasil berjalan!' });
});

// Middleware untuk menyajikan file statis dari folder 'public'
app.use(express.static(path.join(__dirname, '..', 'public')));

// Mulai server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});