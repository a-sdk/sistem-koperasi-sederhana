const express = require('express');
const path = require('path');
const db = require('./database'); // Impor koneksi database dari file yang kita buat

const app = express();
const PORT = 3000;

// Middleware untuk menyajikan file statis dari folder 'public'
app.use(express.static(path.join(__dirname, '..', 'public')));

// Middleware untuk mem-parsing body request dalam format JSON
app.use(express.json());

// Endpoint untuk menambah anggota baru
app.post('/api/anggota', (req, res) => {
  const { nama, alamat, telepon } = req.body;
  if (!nama) {
    return res.status(400).json({ error: 'Nama anggota wajib diisi.' });
  }

  // Gunakan serialize untuk menjalankan dua perintah secara berurutan
  db.serialize(() => {
    // 1. Masukkan data ke tabel anggota
    const sqlAnggota = 'INSERT INTO anggota (nama, alamat, telepon) VALUES (?, ?, ?)';
    db.run(sqlAnggota, [nama, alamat, telepon], function(err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Gagal menambahkan anggota.' });
      }

      const newAnggotaId = this.lastID;

      // 2. Buat entri di tabel tabungan untuk anggota baru
      const sqlTabungan = 'INSERT INTO tabungan (anggota_id, saldo) VALUES (?, 0)';
      db.run(sqlTabungan, [newAnggotaId], function(err) {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: 'Gagal membuat akun tabungan.' });
        }
        res.status(201).json({ id: newAnggotaId, message: 'Anggota dan akun tabungan berhasil ditambahkan.' });
      });
    });
  });
});

// Endpoint untuk mengambil semua anggota beserta saldonya
app.get('/api/anggota', (req, res) => {
  const sql = `
    SELECT a.*, COALESCE(t.saldo, 0) AS saldo
    FROM anggota a
    LEFT JOIN tabungan t ON a.id = t.anggota_id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Gagal mengambil data anggota.' });
    }
    res.status(200).json(rows);
  });
});

// Endpoint untuk transaksi
app.post('/api/transaksi', (req, res) => {
  const { anggota_id, jenis_transaksi, jenis_simpanan, jumlah, keterangan, pinjaman_id } = req.body;
  const tanggal = new Date().toISOString();

  // Validasi dasar
  if (!anggota_id || !jenis_transaksi || !jumlah) {
    return res.status(400).json({ error: 'Data transaksi tidak lengkap.' });
  }
  // Validasi tambahan: Pastikan jumlah adalah angka yang valid
  if (isNaN(jumlah)) {
      return res.status(400).json({ error: 'Jumlah harus berupa angka.' });
  }

  // Gunakan database serialize untuk memastikan semua perintah berjalan berurutan
  db.serialize(() => {
    // 1. Tambahkan data transaksi ke tabel 'transaksi'
    const sqlTransaksi = `
      INSERT INTO transaksi (anggota_id, tanggal, jenis_transaksi, jenis_simpanan, jumlah, keterangan, pinjaman_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(sqlTransaksi, [anggota_id, tanggal, jenis_transaksi, jenis_simpanan, jumlah, keterangan, pinjaman_id], function(err) {
      if (err) {
        console.error('KESALAHAN SAAT MENAMBAHKAN TRANSAKSI:');
        console.error(err);
        return res.status(500).json({ error: 'Gagal mencatat transaksi.' });
      }

      // 2. Perbarui sisa pinjaman jika jenis transaksi adalah pembayaran pinjaman
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
      
      // 3. Hanya perbarui saldo di tabel 'tabungan' jika jenis transaksi adalah 'setoran' atau 'penarikan'
      if (jenis_transaksi === 'setoran' || jenis_transaksi === 'penarikan') {
          let sqlSaldo;
          if (jenis_transaksi === 'setoran') {
              sqlSaldo = `UPDATE tabungan SET saldo = saldo + ? WHERE anggota_id = ?`;
          } else if (jenis_transaksi === 'penarikan') {
              sqlSaldo = `UPDATE tabungan SET saldo = saldo - ? WHERE anggota_id = ?`;
          }

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

// Endpoint untuk hapus anggota
app.delete('/api/anggota/:id', (req, res) => {
    const anggotaId = req.params.id;

    // Gunakan serialize untuk memastikan penghapusan berurutan
    db.serialize(() => {
        // Hapus semua transaksi terkait terlebih dahulu untuk menghindari kesalahan foreign key
        db.run('DELETE FROM transaksi WHERE anggota_id = ?', [anggotaId], (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Gagal menghapus transaksi terkait.' });
            }

            // Hapus saldo anggota
            db.run('DELETE FROM tabungan WHERE anggota_id = ?', [anggotaId], (err) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'Gagal menghapus saldo anggota.' });
                }

                // Hapus semua pinjaman terkait
                db.run('DELETE FROM pinjaman WHERE anggota_id = ?', [anggotaId], (err) => {
                    if (err) {
                        console.error(err.message);
                        return res.status(500).json({ error: 'Gagal menghapus pinjaman terkait.' });
                    }

                    // Hapus anggota
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
        SELECT a.id, a.nama, COALESCE(t.saldo, 0) AS saldo, SUM(COALESCE(p.sisa_pinjam, 0)) AS total_pinjaman
        FROM anggota a
        LEFT JOIN tabungan t ON a.id = t.anggota_id
        LEFT JOIN pinjaman p ON a.id = p.anggota_id AND p.status = 'belum_lunas'
        WHERE a.nama LIKE ?
        GROUP BY a.id, a.nama
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

// Contoh endpoint API sederhana untuk pengujian
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Server berhasil berjalan!' });
});

// Mulai server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});