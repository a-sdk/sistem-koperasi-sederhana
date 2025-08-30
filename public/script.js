// Dapatkan elemen form dan daftar dari HTML
const formAnggota = document.getElementById('formAnggota');
const formTransaksi = document.getElementById('formTransaksi');
const daftarAnggota = document.getElementById('daftarAnggota');
const jenisTransaksiSelect = document.getElementById('jenisTransaksi');
const jenisSimpananContainer = document.getElementById('jenisSimpananContainer');
const formCariAnggota = document.getElementById('formCariAnggota');
const daftarHasilPencarian = document.getElementById('daftarHasilPencarian');
const jumlahInput = document.getElementById('jumlah');
const jumlahPinjamanInput = document.getElementById('jumlahPinjaman');
const formPinjaman = document.getElementById('formPinjaman');
const daftarRiwayatPinjaman = document.getElementById('daftarRiwayatPinjaman');

// Fungsi untuk memformat angka menjadi format mata uang
jumlahInput.addEventListener('keyup', (event) => {
    let value = jumlahInput.value.replace(/[^0-9]/g, '');
    if (value) {
        jumlahInput.value = parseInt(value, 10).toLocaleString('id-ID');
    }
});
jumlahPinjamanInput.addEventListener('keyup', (event) => {
    let value = jumlahPinjamanInput.value.replace(/[^0-9]/g, '');
    if (value) {
        jumlahPinjamanInput.value = parseInt(value, 10).toLocaleString('id-ID');
    }
});

// Tampilkan atau sembunyikan dropdown jenis simpanan
jenisTransaksiSelect.addEventListener('change', (event) => {
    if (event.target.value === 'setoran') {
        jenisSimpananContainer.style.display = 'block';
    } else {
        jenisSimpananContainer.style.display = 'none';
    }
});

// Fungsi untuk mengambil, menampilkan, dan menghapus daftar anggota beserta saldonya
async function fetchAnggota() {
    try {
        const response = await fetch('/api/anggota');
        const anggota = await response.json();

        daftarAnggota.innerHTML = '';

        anggota.forEach(anggotaItem => {
            const li = document.createElement('li');
            li.textContent = `${anggotaItem.nama} (ID: ${anggotaItem.id})`;

            // Buat tombol hapus
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Hapus';
            deleteButton.style.marginLeft = '10px';
            
            // Tambahkan event listener untuk tombol hapus
            deleteButton.addEventListener('click', async () => {
                // Tambahkan baris ini untuk pengujian
                console.log('Tombol Hapus ditekan! Memulai proses...');
                if (confirm(`Apakah Anda yakin ingin menghapus ${anggotaItem.nama}?`)) {
                    try {
                        const response = await fetch(`/api/anggota/${anggotaItem.id}`, {
                            method: 'DELETE'
                        });

                        const result = await response.json();
                        if (response.ok) {
                            alert(result.message);
                            fetchAnggota();
                        } else {
                            alert(`Error: ${result.error}`);
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Terjadi kesalahan saat menghapus anggota.');
                    }
                }
            });

            li.appendChild(deleteButton);
            daftarAnggota.appendChild(li);
        });
    } catch (error) {
        console.error('Gagal mengambil data anggota:', error);
    }
}

// Fungsi untuk mengambil dan menampilkan riwayat pinjaman
async function fetchRiwayatPinjaman(anggotaId) {
    try {
        const response = await fetch(`/api/pinjaman/${anggotaId}`);
        const pinjaman = await response.json();

        daftarRiwayatPinjaman.innerHTML = ''; // Bersihkan daftar sebelumnya

        if (pinjaman.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Tidak ada riwayat pinjaman.';
            daftarRiwayatPinjaman.appendChild(li);
        } else {
            pinjaman.forEach(pinjamanItem => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>ID Pinjaman: ${pinjamanItem.id}</strong><br>
                    Jumlah Pinjaman: Rp. ${pinjamanItem.jumlah_pinjam.toLocaleString('id-ID')}<br>
                    Sisa Pinjaman: Rp. ${pinjamanItem.sisa_pinjam.toLocaleString('id-ID')}<br>
                    Status: ${pinjamanItem.status}<br>
                    Keterangan: ${pinjamanItem.keterangan}<br>
                `;
                daftarRiwayatPinjaman.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Gagal mengambil riwayat pinjaman:', error);
    }
}

// Event listener untuk form anggota 
formAnggota.addEventListener('submit', async (event) => {
  event.preventDefault(); 
  // Tambahkan baris ini untuk pengujian
  console.log('Tombol Simpan Anggota ditekan! Memulai proses...');

  const nama = document.getElementById('nama').value;
  const alamat = document.getElementById('alamat').value;
  const telepon = document.getElementById('telepon').value;
  const newMember = { nama, alamat, telepon };

  try {
    const response = await fetch('/api/anggota', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMember)
    });

    const result = await response.json();
    if (response.ok) {
      alert(result.message);
      formAnggota.reset();
      fetchAnggota();
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Terjadi kesalahan saat menyimpan data.');
  }
});

// Event listener untuk form pencarian anggota
formCariAnggota.addEventListener('submit', async (event) => {
    event.preventDefault();
    // Tambahkan baris ini untuk pengujian
    console.log('Tombol Cari ditekan! Memulai proses...');
    const cariNama = document.getElementById('cariNama').value;

    try {
        const response = await fetch(`/api/anggota/cari?nama=${cariNama}`);
        const hasil = await response.json();

        // Kosongkan daftar hasil pencarian sebelumnya
        daftarHasilPencarian.innerHTML = '';

        if (hasil.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Tidak ada anggota ditemukan.';
            daftarHasilPencarian.appendChild(li);
        } else {
            hasil.forEach(anggota => {
                const li = document.createElement('li');
                li.innerHTML = `${anggota.nama}
                                  (ID: ${anggota.id})</strong><br>
                                  <strong>Saldo: Rp. ${anggota.saldo.toLocaleString('id-ID')}</strong><br>
                                  <strong>Pinjaman: Rp. ${anggota.total_pinjaman.toLocaleString('id-ID')}</strong><br>`;
                daftarHasilPencarian.appendChild(li);
                // Panggil fungsi menampilkan riwayat pinjaman
                fetchRiwayatPinjaman(anggota.id);
            });
        }
    } catch (error) {
        console.error('Gagal melakukan pencarian:', error);
        alert('Terjadi kesalahan saat mencari anggota.');
    }
});

// Fungsi reset form transaksi
function resetFormTransaksi() {
    formTransaksi.reset();
    jenisTransaksiSelect.value = "";
    jenisSimpananContainer.style.display = 'none';
}

// Event listener untuk form transaksi
formTransaksi.addEventListener('submit', async (event) => {
  event.preventDefault();
  // Tambahkan baris ini untuk pengujian
  console.log('Tombol Catat Transaksi ditekan! Memulai proses...');

  const anggota_id = document.getElementById('anggotaId').value;
  // Perbaikan di sini: Ambil nilai pinjaman_id saat tombol ditekan
  const pinjaman_id = document.getElementById('pinjamanId').value;
  const jenis_transaksi = jenisTransaksiSelect.value;
  const jumlahValue = document.getElementById('jumlah').value.replace(/[^0-9]/g, ''); // Ambil nilai yang sudah diformat dan bersihkan
  const keterangan = document.getElementById('keterangan').value;
  let jenis_simpanan = null;
  
  if (!jumlahValue || isNaN(parseInt(jumlahValue))) {
      alert('Jumlah tidak valid. Harap masukkan angka.');
      return;
  }

  if (jenis_transaksi === 'setoran') {
      jenis_simpanan = document.getElementById('jenisSimpanan').value;
  }

  const newTransaction = {
      anggota_id,
      pinjaman_id, // Masukkan pinjaman_id ke objek transaksi
      jenis_transaksi,
      jenis_simpanan,
      jumlah: parseInt(jumlahValue), // Kirim jumlah sebagai angka murni
      keterangan
  };

  try {
      const response = await fetch('/api/transaksi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTransaction)
      });

      const result = await response.json();
      if (response.ok) {
          alert(result.message);
          resetFormTransaksi();
          fetchAnggota();
      } else {
          alert(`Error: ${result.error}`);
      }
  } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat mencatat transaksi.');
  }
});

// Event listener untuk form pinjaman
// Event listener untuk form pinjaman
formPinjaman.addEventListener('submit', async (event) => {
    event.preventDefault();
    console.log('Tombol Catat Pinjaman ditekan! Memulai proses...');

    const anggota_id = document.getElementById('pinjamanAnggotaId').value;
    const jumlahPinjamanValue = document.getElementById('jumlahPinjaman').value.replace(/[^0-9]/g, '');
    const keterangan = document.getElementById('keteranganPinjaman').value;
    
    // Validasi input jumlah pinjaman
    if (!jumlahPinjamanValue || isNaN(parseInt(jumlahPinjamanValue))) {
        alert('Jumlah pinjaman tidak valid. Harap masukkan angka.');
        return;
    }
    const newPinjaman = {
      anggota_id,
      jumlah: parseInt(jumlahPinjamanValue),
      keterangan
    };

    try {
        const response = await fetch('/api/pinjaman', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPinjaman)
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            formPinjaman.reset();
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat mencatat pinjaman.');
    }
});
// Jalankan saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', fetchAnggota);