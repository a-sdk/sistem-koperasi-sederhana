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
const riwayatTransaksiList = document.getElementById('riwayatTransaksiList');

const startDatePinjamanInput = document.getElementById('startDatePinjaman');
const endDatePinjamanInput = document.getElementById('endDatePinjaman');
const filterPinjamanBtn = document.getElementById('filterPinjamanBtn');

const startDateTransaksiInput = document.getElementById('startDateTransaksi');
const endDateTransaksiInput = document.getElementById('endDateTransaksi');
const filterTransaksiBtn = document.getElementById('filterTransaksiBtn');

const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const currentPageSpan = document.getElementById('currentPageSpan');

const rekapStartDateInput = document.getElementById('rekapStartDate');
const rekapEndDateInput = document.getElementById('rekapEndDate');
const rekapBtn = document.getElementById('rekapBtn');
const rekapTransaksiList = document.getElementById('rekapTransaksiList');
const rekapPinjamanList = document.getElementById('rekapPinjamanList');

// Variabel untuk menyimpan ID anggota yang sedang dicari
let currentAnggotaId = null;

// Variabel untuk pagination
let currentPage = 1;
const membersPerPage = 10;
let totalMembers = 0;

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

// Fungsi untuk mengambil, menampilkan, dan menghapus daftar anggota dengan pagination
async function fetchAnggota() {
    try {
        const offset = (currentPage - 1) * membersPerPage;
        const countResponse = await fetch('/api/anggota/count');
        const countData = await countResponse.json();
        totalMembers = countData.count;

        const response = await fetch(`/api/anggota?limit=${membersPerPage}&offset=${offset}`);
        const anggota = await response.json();

        daftarAnggota.innerHTML = '';

        if (anggota.length === 0) {
            daftarAnggota.innerHTML = '<li>Tidak ada anggota.</li>';
        } else {
            anggota.forEach(anggotaItem => {
                const li = document.createElement('li');
                const totalSaldo = (anggotaItem.saldo_pokok + anggotaItem.saldo_wajib + anggotaItem.saldo_sukarela).toLocaleString('id-ID');
                li.innerHTML = `
                    <strong>${anggotaItem.nama} (ID: ${anggotaItem.id})</strong><br>
                    Total Saldo: Rp. ${totalSaldo}
                    (Pokok: Rp. ${anggotaItem.saldo_pokok.toLocaleString('id-ID')}, Wajib: Rp. ${anggotaItem.saldo_wajib.toLocaleString('id-ID')}, Sukarela: Rp. ${anggotaItem.saldo_sukarela.toLocaleString('id-ID')})
                `;

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Hapus';
                deleteButton.style.marginLeft = '10px';
                
                deleteButton.addEventListener('click', async () => {
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
        }
        
        currentPageSpan.textContent = `Halaman ${currentPage} dari ${Math.ceil(totalMembers / membersPerPage)}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage * membersPerPage >= totalMembers;

    } catch (error) {
        console.error('Gagal mengambil data anggota:', error);
    }
}

// Event listener untuk pagination
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        fetchAnggota();
    }
});
nextPageBtn.addEventListener('click', () => {
    if (currentPage * membersPerPage < totalMembers) {
        currentPage++;
        fetchAnggota();
    }
});

// Fungsi untuk mengambil dan menampilkan riwayat pinjaman
async function fetchRiwayatPinjaman(anggotaId, startDate, endDate) {
    try {
        let url = `/api/pinjaman/${anggotaId}`;
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        const response = await fetch(url);
        const pinjaman = await response.json();

        daftarRiwayatPinjaman.innerHTML = '';

        if (pinjaman.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Tidak ada riwayat pinjaman.';
            daftarRiwayatPinjaman.appendChild(li);
        } else {
            pinjaman.forEach(pinjamanItem => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>ID Pinjaman: ${pinjamanItem.id}</strong><br>
                    Tanggal Pinjam: ${new Date(pinjamanItem.tanggal_pinjam).toLocaleString('id-ID')}<br>
                    Jumlah Pinjaman: Rp. ${pinjamanItem.jumlah_pinjam.toLocaleString('id-ID')}<br>
                    Sisa Pinjaman: Rp. ${pinjamanItem.sisa_pinjam.toLocaleString('id-ID')}<br>
                    Status: ${pinjamanItem.status}<br>
                    Keterangan: ${pinjamanItem.keterangan || ''}<br>
                `;
                daftarRiwayatPinjaman.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Gagal mengambil riwayat pinjaman:', error);
    }
}

// Fungsi untuk mengambil dan menampilkan riwayat transaksi
async function fetchRiwayatTransaksi(anggotaId, startDate, endDate) {
    try {
        let url = `/api/transaksi/${anggotaId}`;
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        const response = await fetch(url);
        const transaksi = await response.json();
        
        riwayatTransaksiList.innerHTML = '';

        if (transaksi.length === 0) {
            riwayatTransaksiList.innerHTML = '<li>Tidak ada riwayat transaksi.</li>';
        } else {
            transaksi.forEach(transaksiItem => {
                const li = document.createElement('li');
                const tanggalLokal = new Date(transaksiItem.tanggal).toLocaleString('id-ID');
                li.innerHTML = `
                    Tanggal: ${tanggalLokal}<br>
                    Jenis: ${transaksiItem.jenis_transaksi} (${transaksiItem.jenis_simpanan || ''})<br>
                    Jumlah: Rp. ${transaksiItem.jumlah.toLocaleString('id-ID')}<br>
                    Keterangan: ${transaksiItem.keterangan || ''}
                `;
                riwayatTransaksiList.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Gagal mengambil riwayat transaksi:', error);
    }
}

// Fungsi untuk mengambil dan menampilkan rekapitulasi data
async function fetchRekapData(startDate, endDate) {
    try {
        // Fetch rekapitulasi transaksi
        let urlTransaksi = `/api/rekap/transaksi?startDate=${startDate}&endDate=${endDate}`;
        const responseTransaksi = await fetch(urlTransaksi);
        const rekapTransaksi = await responseTransaksi.json();
        if (startDate && endDate) {
    
            rekapTransaksiList.innerHTML = '';
            rekapTransaksi.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `${item.jenis_transaksi} (${item.jenis_simpanan || 'N/A'}): Rp. ${item.total.toLocaleString('id-ID')}`;
                rekapTransaksiList.appendChild(li);
            });
        }
        if (rekapTransaksi.length === 0) {
            rekapTransaksiList.innerHTML = '<li>Tidak ada data rekap transaksi.</li>'
        }

        // Fetch rekapitulasi pinjaman
        let urlPinjaman = `/api/rekap/pinjaman?startDate=${startDate}&endDate=${endDate}`;
        const responsePinjaman = await fetch(urlPinjaman);
        const rekapPinjaman = await responsePinjaman.json();
        if (startDate && endDate) {
            
            rekapPinjamanList.innerHTML = '';
            rekapPinjaman.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `Status ${item.status}: Total Pinjaman Rp. ${item.total_pinjam.toLocaleString('id-ID')} (Sisa: Rp. ${item.total_sisa.toLocaleString('id-ID')})`;
                rekapPinjamanList.appendChild(li);
            });
        }
        if (rekapPinjaman.length === 0) {
            rekapPinjamanList.innerHTML = '<li>Tidak ada data rekap pinjaman.</li>'
        }

    } catch (error) {
        console.error('Gagal mengambil data rekapitulasi:', error);
        alert('Terjadi kesalahan saat mengambil rekapitulasi data.', error);
    }
}

// Event listener untuk form anggota 
formAnggota.addEventListener('submit', async (event) => {
  event.preventDefault(); 
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
    console.log('Tombol Cari ditekan! Memulai proses...');
    const cariNama = document.getElementById('cariNama').value;

    try {
        const response = await fetch(`/api/anggota/cari?nama=${cariNama}`);
        const hasil = await response.json();

        daftarHasilPencarian.innerHTML = '';
        daftarRiwayatPinjaman.innerHTML = '';
        riwayatTransaksiList.innerHTML = '';
        currentAnggotaId = null;

        if (hasil.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Tidak ada anggota ditemukan.';
            daftarHasilPencarian.appendChild(li);
        } else {
            hasil.forEach(anggota => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>${anggota.nama} (ID: ${anggota.id})</strong><br>
                    Total Saldo: Rp. ${(anggota.saldo_pokok + anggota.saldo_wajib + anggota.saldo_sukarela).toLocaleString('id-ID')}
                    (Pokok: Rp. ${anggota.saldo_pokok.toLocaleString('id-ID')}, Wajib: Rp. ${anggota.saldo_wajib.toLocaleString('id-ID')}, Sukarela: Rp. ${anggota.saldo_sukarela.toLocaleString('id-ID')})<br>
                    Total Pinjaman: Rp. ${anggota.total_pinjaman.toLocaleString('id-ID')}
                `;
                daftarHasilPencarian.appendChild(li);
                
                currentAnggotaId = anggota.id;

                fetchRiwayatPinjaman(anggota.id);
                fetchRiwayatTransaksi(anggota.id);
            });
        }
    } catch (error) {
        console.error('Gagal melakukan pencarian:', error);
        alert('Terjadi kesalahan saat mencari anggota.');
    }
});

// Event listener untuk tombol filter pinjaman
filterPinjamanBtn.addEventListener('click', () => {
    const startDate = startDatePinjamanInput.value;
    const endDate = endDatePinjamanInput.value;
    
    if (currentAnggotaId) {
        fetchRiwayatPinjaman(currentAnggotaId, startDate, endDate);
    } else {
        alert('Harap cari anggota terlebih dahulu.');
    }
});

// Event listener untuk tombol filter transaksi
filterTransaksiBtn.addEventListener('click', () => {
    const startDate = startDateTransaksiInput.value;
    const endDate = endDateTransaksiInput.value;
    
    if (currentAnggotaId) {
        fetchRiwayatTransaksi(currentAnggotaId, startDate, endDate);
    } else {
        alert('Harap cari anggota terlebih dahulu.');
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
  console.log('Tombol Catat Transaksi ditekan! Memulai proses...');

  const anggota_id = document.getElementById('anggotaId').value;
  const pinjaman_id = document.getElementById('pinjamanId').value;
  const jenis_transaksi = jenisTransaksiSelect.value;
  const jumlahValue = document.getElementById('jumlah').value.replace(/[^0-9]/g, '');
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
      pinjaman_id,
      jenis_transaksi,
      jenis_simpanan,
      jumlah: parseInt(jumlahValue),
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
formPinjaman.addEventListener('submit', async (event) => {
    event.preventDefault();
    console.log('Tombol Catat Pinjaman ditekan! Memulai proses...');

    const anggota_id = document.getElementById('pinjamanAnggotaId').value;
    const jumlahPinjamanValue = document.getElementById('jumlahPinjaman').value.replace(/[^0-9]/g, '');
    const keteranganPinjaman = document.getElementById('keteranganPinjaman').value;

    if (!jumlahPinjamanValue || isNaN(parseInt(jumlahPinjamanValue))) {
        alert('Jumlah pinjaman tidak valid. Harap masukkan angka.');
        return;
    }
    const newPinjaman = {
      anggota_id,
      jumlah: parseInt(jumlahPinjamanValue),
      keterangan: keteranganPinjaman
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

// Event listener untuk tombol Rekapitulasi
rekapBtn.addEventListener('click', () => {
    const startDate = rekapStartDateInput.value;
    const endDate = rekapEndDateInput.value;

    // Panggil fungsi rekap yang sudah ada
    fetchRekapData(startDate, endDate);
});


// Fungsi untuk membuka tab
function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tab");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tab-link");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

// Set tab default saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    fetchAnggota();
    const defaultTab = document.querySelector('.tab-link.active');
    if (defaultTab) {
        openTab({ currentTarget: defaultTab }, 'tabAnggota');
    }
});