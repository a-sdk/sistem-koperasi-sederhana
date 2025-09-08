const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Hubungkan ke database.db. Jika file tidak ada, SQLite akan membuatnya
const dbPath = path.resolve(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error saat terhubung ke database:', err.message);
  } else {
    console.log('Terhubung ke database SQLite.');
    createTables();
  }
});

// Fungsi untuk membuat tabel jika belum ada
function createTables() {
  db.serialize(() => {
    // Tabel untuk data anggota
    db.run(`
      CREATE TABLE IF NOT EXISTS anggota (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        alamat TEXT,
        telepon TEXT
      )
    `);

    // Tabel untuk data tabungan anggota
    // KITA GANTI TABEL LAMA DENGAN TABEL BARU INI
    db.run(`
      CREATE TABLE IF NOT EXISTS tabungan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        anggota_id INTEGER,
        jenis_simpanan TEXT NOT NULL,
        saldo REAL NOT NULL DEFAULT 0,
        FOREIGN KEY (anggota_id) REFERENCES anggota(id)
      )
    `);

    // Tabel untuk mencatat pinjaman anggota
    db.run(`
      CREATE TABLE IF NOT EXISTS pinjaman (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        anggota_id INTEGER,
        tanggal_pinjam TEXT NOT NULL,
        jumlah_pinjam REAL NOT NULL,
        sisa_pinjam REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'belum_lunas',
        keterangan TEXT,
        FOREIGN KEY (anggota_id) REFERENCES anggota(id)
      )
    `);

    // Tabel untuk mencatat riwayat transaksi
    db.run(`
      CREATE TABLE IF NOT EXISTS transaksi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        anggota_id INTEGER,
        tanggal TEXT NOT NULL,
        jenis_transaksi TEXT NOT NULL,
        jenis_simpanan TEXT,
        jumlah REAL NOT NULL,
        keterangan TEXT,
        pinjaman_id INTEGER,
        FOREIGN KEY (anggota_id) REFERENCES anggota(id)
      )
    `);

    console.log('Tabel berhasil dibuat atau sudah ada.');
  });
}

module.exports = db; // Ekspor koneksi database untuk digunakan di server.js