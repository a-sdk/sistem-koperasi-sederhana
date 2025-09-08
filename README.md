# Sistem Database Koperasi Warga

## Deskripsi Proyek

Proyek ini adalah sistem database sederhana yang dirancang untuk mendigitalisasi proses pencatatan konvensional di sebuah koperasi warga. Sistem ini menyediakan antarmuka yang mudah digunakan bagi petugas koperasi untuk mengelola data anggota, tabungan, dan pinjaman secara efisien dan akurat.

## Fitur Utama

1. Manajemen Anggota: Menambah, mencari, dan menghapus data anggota.

2. Manajemen Tabungan: Mencatat transaksi setoran dan penarikan untuk setiap anggota.

3. Manajemen Pinjaman: Mencatat pinjaman baru dan melacak sisa pinjaman yang harus dibayar.

4. Pembayaran Pinjaman: Mengurangi sisa pinjaman dengan mencatat transaksi pembayaran, tanpa memengaruhi saldo tabungan.

5. Pencarian Anggota: Memudahkan petugas untuk mencari anggota berdasarkan nama dan mendapatkan ID serta data pinjaman mereka.

6. Validasi Data: Memastikan input yang dimasukkan valid sebelum disimpan ke database.

## Teknologi yang Digunakan

- Backend: Node.js, Express.js
- Database: SQLite3
- Frontend: HTML, CSS, JavaScript

## Panduan Instalasi dan Penggunaan

Ikuti langkah-langkah berikut untuk menjalankan proyek di komputer lokal Anda.

### Persyaratan

Pastikan Anda telah menginstal Node.js (disertai npm) di komputer Anda.

### Instalasi

Salin (clone) atau unduh repositori ini ke folder lokal Anda.

Buka terminal atau Command Prompt dan navigasi ke folder proyek.

Jalankan perintah berikut untuk menginstal semua dependensi yang diperlukan:

    npm install

Catatan: Pastikan `package.json` sudah ada di folder Anda.

### Menyiapkan Database

Karena skema database dibuat secara otomatis, Anda tidak perlu melakukan konfigurasi tambahan. Namun, jika ada perubahan pada file src/database.js, Anda harus menghapus file database.db yang ada dan menjalankan ulang server untuk menerapkan perubahan tersebut.

### Menjalankan Server

Jalankan perintah berikut di terminal Anda:

    node src/server.js

Server akan berjalan di http://localhost:3000.

### Menggunakan Aplikasi

Buka browser Anda dan kunjungi alamat http://localhost:3000. Anda dapat menggunakan formulir yang tersedia untuk mulai mencatat data koperasi.

## Struktur Proyek

    /koperasi_app
    ├── /public/                    # File-file frontend yang diakses browser
    │   ├── index.html              # Halaman utama aplikasi
    │   ├── style.css               # File styling
    │   └── script.js               # Logika frontend
    ├── /src/                       # Kode backend
    │   ├── database.js             # Skema dan koneksi database
    │   └── server.js               # Logika server dan API
    ├── package.json                # Metadata proyek & daftar dependensi
    └── database.db                 # File database SQLite (dihasilkan otomatis)


---

## Changelogs

### Versi 1.3 - 08 September 2025
* **Fitur Baru**:
    * Memngkategorikan ulang tab anggota, riwayat dan pencarian, serta transaksi.
    * Menambahkan tab untuk menampilkan rekapitulasi.
    * Menambhkan fungsi untuk menampilkan rekapitulasi transaksi pada rentang waktu tertentu.
    * Memisahkan saldo sesuai kategori (pokok, wajib, sukarela).
* **Perbaikan Bug**:
    * Memperbaiki bug API tidak dapat diakses.

### Versi 1.2 - 03 September 2025
* **Fitur Baru**:
    * Memisahkan formulir anggota, transaksi, dan pinjaman pada tab berbeda.
    * Menambahkan fungsi untuk melihat riwayat transaksi anggota.
    * Menambhkan filter tanggal pada hasil pencarian riwayat transaksi dan riwayat pinjaman anggota.
    * Menambahkan fungsi pagination untuk daftar anggota.
* **Perbaikan Bug**:
    * Memperbaiki bug filter tanggal yang tidak akurat.
    * Memperbaiki error 'Harap masukkan ID anggota'.

### Versi 1.1 - 30 Agustus 2025

* **Fitur Baru**:
    * Menambahkan kolom 'keterangan' pada formulir dan database pinjaman.
    * Menambahkan fungsi untuk melihat riwayat pinjaman anggota.
* **Perbaikan Bug**:
    * Memperbaiki bug di mana saldo tabungan bertambah saat ada pembayaran pinjaman.
    * Memperbaiki bug di mana total pinjaman tidak diperbarui setelah pembayaran.
    * Memperbaiki error 'ID pinjaman harus disertakan'.

### Versi 1.0 - [Tanggal Awal]

* Rilis awal sistem database koperasi.
* Fungsi dasar untuk manajemen anggota, tabungan, dan pinjaman.
