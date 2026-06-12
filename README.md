# SIMMA — Sistem Manajemen Aset Sekolah

SIMMA (Sistem Manajemen Aset Sekolah) adalah platform berbasis web terintegrasi yang dirancang khusus untuk memfasilitasi pendataan, pelacakan, peminjaman, dan pengelolaan aset di lingkungan sekolah (seperti **SMKN 1 Percut Sei Tuan**). 

Aplikasi ini menggunakan teknologi Next.js, Tailwind CSS (estetika modern glassmorphism gelap yang dikunci), Drizzle ORM, dan PostgreSQL untuk memberikan performa tinggi, data terisolasi per jurusan, dan rekam audit transparan (*audit trail*).

---

## 📌 Daftar Isi
1. [Hak Akses Pengguna (Role-Based Access Control)](#-hak-akses-pengguna-role-based-access-control)
2. [Panduan Penggunaan — Administrator (Sarpras/Sekretaris)](#1-panduan-penggunaan--administrator-sarprassekretaris)
   - [Pembuatan Akun Pengguna](#a-pembuatan-akun-pengguna)
   - [Manajemen Lokasi & Jurusan](#b-manajemen-lokasi--jurusan)
   - [Registrasi & Manajemen Aset](#c-registrasi--manajemen-aset)
   - [Persetujuan Peminjaman](#d-persetujuan-peminjaman)
3. [Panduan Penggunaan — Ketua Jurusan (Kajur)](#2-panduan-penggunaan--ketua-jurusan-kajur)
   - [Pencarian & Pengajuan Peminjaman](#a-pencarian--pengajuan-peminjaman)
   - [Proses Pengembalian dengan Bukti Visual](#b-proses-pengembalian-dengan-bukti-visual-foto)
4. [Panduan Penggunaan — Viewer (Kepala Sekolah/Bendahara)](#3-panduan-penggunaan--viewer-kepala-sekolahbendahara)
   - [Dashboard Statistik & Audit Trail](#a-dashboard-statistik--audit-trail)
   - [Laporan Transaksi & Katalog Aset](#b-laporan-transaksi--katalog-aset)
5. [Struktur Bisnis & Validasi Sistem](#-struktur-bisnis--validasi-sistem)
6. [Instruksi Pengoperasian Pengembang (Setup & Run)](#-instruksi-pengoperasian-pengembang-setup--run)

---

## 👥 Hak Akses Pengguna (Role-Based Access Control)

SIMMA menerapkan pembagian peran yang ketat untuk menjamin keamanan data inventaris sekolah:

| Fitur | ADMIN (Sarpras) | KAJUR (Ketua Jurusan) | VIEWER (Kepsek/Bendahara) |
| :--- | :---: | :---: | :---: |
| **Dashboard Ringkasan** | Kontrol Penuh | Scoped (Jurusan Terkait) | Read-Only (Semua) |
| **Manajemen Pengguna** | Ya (Buat/Hapus) | Tidak | Tidak |
| **Manajemen Lokasi & Jurusan** | Ya (Tambah/Hapus) | Tidak | Tidak |
| **Registrasi Aset** | Ya (Tambah/Edit/Hapus) | Tidak | Tidak |
| **Pengajuan Peminjaman** | Tidak | Ya (Maks 30 Hari) | Tidak |
| **Persetujuan Peminjaman** | Ya (Setuju/Tolak) | Tidak | Tidak |
| **Pengembalian Aset** | Konfirmasi Visual | Ya (Upload Foto Bukti) | Tidak |
| **Rekam Aktivitas (Audit Log)** | Ya (Semua) | Tidak | Ya (Lihat) |

---

## 1. Panduan Penggunaan — Administrator (Sarpras/Sekretaris)

Admin memiliki wewenang penuh atas konfigurasi awal SIMMA, pengelolaan akun, inventarisasi, dan persetujuan transaksi peminjaman.

### a. Pembuatan Akun Pengguna
Sistem SIMMA **tidak menyediakan registrasi mandiri** di halaman publik demi menjaga integritas data. Semua akun baru dibuat secara terpusat oleh Admin:
1. Masuk ke sidebar menu **Master Data -> Pengguna**.
2. Masukkan **Nama Lengkap**, **Email**, **Password**, dan pilih **Role** (`KAJUR`, `VIEWER`, atau `ADMIN`).
3. Khusus untuk role **KAJUR**, centang satu atau lebih jurusan yang akan dikelola oleh akun tersebut (mendukung multi-jurusan).
4. Klik **Buat Pengguna**. Kredensial ini dapat langsung digunakan untuk masuk.

### b. Manajemen Lokasi & Jurusan
Sebelum menginput aset, tentukan lokasi fisik dan jurusan di sekolah:
* **Lokasi** (Master Data -> Lokasi): Masukkan nama ruangan/tempat penempatan aset (contoh: *Lab Komputer RPL*, *Gedung Teori A*).
* **Jurusan** (Master Data -> Jurusan): Masukkan nama kompetensi keahlian pemilik aset (contoh: *Rekayasa Perangkat Lunak*, *Teknik Kendaraan Ringan*).

### c. Registrasi & Manajemen Aset
Aset dikelompokkan ke dalam dua jenis:
* **Fixed Asset (Aset Tetap)**: Barang yang memerlukan peminjaman fisik dan harus dikembalikan (meja, laptop, proyektor).
* **Consumable (Barang Habis Pakai)**: Barang habis pakai yang stoknya berkurang permanen tanpa proses pengembalian (sabun, sapu, semen).

**Cara Registrasi Aset Baru**:
1. Buka menu **Inventory -> Aset** dan klik tombol **+ Registrasi Aset** di kanan atas.
2. Isi formulir informasi aset:
   - Nama Barang, Kode Inventaris/Plat.
   - Pilih tipe (`FIXED` atau `CONSUMABLE`).
   - Kategori KIB (Kartu Inventaris Barang: A, B, atau C) beserta properti khususnya (seperti Luas, Merk/Bahan, atau Konstruksi Tingkat).
   - Jumlah (stok awal), Harga, Asal Usul, Kondisi, Lokasi Penempatan, dan Jurusan Pemilik.
   - Unggah foto fisik dokumentasi awal aset.
3. Klik **Simpan Aset**.

*Catatan: Admin dapat menambah stok (khusus consumable), mengedit data aset, mengunggah foto tambahan, atau menghapus aset (soft-delete).*

### d. Persetujuan Peminjaman
Setiap pengajuan dari Kajur akan masuk ke antrean persetujuan Admin:
1. Buka menu **Transactions -> Peminjaman**.
2. Di bawah tab **Menunggu Persetujuan**, tinjau detail pengajuan (Nama Aset, Qty, Tanggal Pengajuan, dan Batas Waktu Pengembalian).
3. Klik **Setujui** untuk meminjamkan barang (stok `AVAILABLE` akan otomatis berkurang), atau klik **Tolak** dengan menyertakan alasan.

---

## 2. Panduan Penggunaan — Ketua Jurusan (Kajur)

Ketua Jurusan ditugaskan mengelola aset pada jurusan masing-masing dan mengajukan peminjaman aset antardepartemen.

### a. Pencarian & Pengajuan Peminjaman
1. Di halaman **Dashboard**, gunakan kotak pencarian cepat (*Quick Search*) untuk mengecek ketersediaan aset di sekolah (*First Win*).
2. Atau buka menu **Operations -> Cari Aset**. Daftar aset terurut rapi secara alfabetis A-Z.
3. Pilih aset yang ingin dipinjam, pastikan statusnya `AVAILABLE` dan stok mencukupi.
4. Klik tombol **Ajukan Peminjaman**.
5. Isi formulir peminjaman:
   - **Jurusan Pemohon** (jika memegang lebih dari 1 jurusan).
   - **Jumlah Unit** yang dipinjam.
   - **Batas Waktu Pengembalian** (sistem membatasi maksimal 30 hari secara ketat).
   - Catatan tambahan penggunaan.
6. Klik **Kirim Pengajuan**. Status pengajuan dapat dipantau di menu **Riwayat Peminjaman** (`PENDING` -> `APPROVED` / `REJECTED`).

### b. Proses Pengembalian dengan Bukti Visual (Foto)
Setelah durasi penggunaan selesai, Kajur wajib mengembalikan aset tetap melalui sistem:
1. Buka halaman **Dashboard** atau menu **Riwayat Peminjaman**.
2. Di bagian **Peminjaman Aktif**, temukan aset yang sedang dipinjam lalu klik tombol **Kembalikan**.
3. Pilih **Kondisi Pengembalian** saat ini (Baik, Kurang Baik, atau Rusak Berat).
4. Unggah foto bukti fisik kondisi aset saat ini ke zona *drag-and-drop* yang disediakan.
5. Klik **Konfirmasi Pengembalian**. Data akan disinkronkan ke server dan status stok akan dikembalikan secara otomatis.

---

## 3. Panduan Penggunaan — Viewer (Kepala Sekolah/Bendahara)

Viewer memiliki akses penuh untuk melakukan monitoring, audit, dan evaluasi inventaris sekolah secara *Read-Only* (tanpa hak mengubah data).

### a. Dashboard Statistik & Audit Trail
Setelah masuk, Viewer disajikan dengan visualisasi panel kontrol sekolah yang informatif:
* **Total Aset / Tersedia / Dipinjam**: Counter angka real-time jumlah aset di sekolah.
* **Aktivitas Terakhir**: Rekam histori log sistem secara kronologis (siapa melakukan registrasi, mutasi, approval, atau pengembalian).
* **Kalender Jadwal**: Tampilan kalender interaktif yang menandai tanggal batas waktu pengembalian transaksi aktif.
* **Jadwal Pengembalian**: Daftar antrean pengembalian aset beserta tanda status ("Besok", "Terlambat X hari", atau "Tepat waktu").

### b. Laporan Transaksi & Katalog Aset
Viewer dapat memonitor detail inventaris melalui sidebar menu:
* **Katalog Aset** (`/admin/assets`): Melihat seluruh data KIB A (Tanah), KIB B (Intra/Extra), dan KIB C (Gedung) terurut berdasarkan nama A-Z. Tombol tambah, edit, dan hapus tidak akan muncul. Viewer dapat masuk ke halaman **Detail** untuk melihat galeri foto aset dan histori pergerakan barang.
* **Histori Transaksi** (`/admin/requests`): Memantau daftar pengajuan aktif, aset yang sedang dipinjam, dan transaksi yang sudah selesai dikembalikan. Pada tab **Sudah Dikembalikan**, Viewer dapat mengklik tombol **Lihat Bukti** untuk meninjau foto fisik bukti pengembalian yang diunggah Kajur.

---

## ⚙️ Struktur Bisnis & Validasi Sistem

Untuk memastikan keamanan pengoperasian di lapangan, sistem SIMMA dibekali dengan aturan validasi otomatis:
1. **Aturan 30 Hari**: Sistem akan secara otomatis menolak formulir pengajuan peminjaman jika tanggal batas waktu melebihi 30 hari kalender sejak peminjaman dimulai.
2. **Validasi Ketersediaan Stok**: Jumlah barang yang dipinjam tidak boleh melebihi stok tersedia. Pada barang habis pakai (`CONSUMABLE`), stok akan dikurangi secara langsung tanpa memerlukan pengembalian.
3. **Isolasi Multi-Jurusan**: Kajur hanya diizinkan melihat katalog aset, mengajukan pinjaman, dan mengelola transaksi pada jurusan-jurusan yang diotorisasikan kepada akunnya di database (`userJurusan`).
4. **Enforcement Dark Mode**: Antarmuka SIMMA dirancang menggunakan arsitektur warna gelap (*dark mode*) yang dikunci secara permanen pada elemen root HTML untuk menjaga konsistensi visual modern dan mengurangi kelelahan mata saat pemakaian di lapangan.

---

## 💻 Instruksi Pengoperasian Pengembang (Setup & Run)

Jika Anda ingin menjalankan aplikasi SIMMA di lingkungan pengembangan lokal:

### 1. Prasyarat Sistem
* Node.js v18 atau v20 ke atas.
* Koneksi ke PostgreSQL Database aktif.

### 2. Konfigurasi Environment File
Buat file `.env` pada folder root project dan masukkan konfigurasi berikut:
```env
DATABASE_URL="postgresql://[username]:[password]@[host]:[port]/[database_name]?sslmode=require"
NEXTAUTH_SECRET="masukkan_random_hash_keamanan_disini"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Mengunduh Dependensi & Sinkronisasi Database
Jalankan perintah berikut di terminal:
```bash
# Menginstal semua paket dependensi
npm install

# Melakukan push skema database Drizzle ke PostgreSQL
npx drizzle-kit push
```

### 4. Menjalankan Server Pengembangan
Jalankan aplikasi di mode dev:
```bash
npm run dev
```
Aplikasi dapat diakses melalui browser pada alamat [http://localhost:3000](http://localhost:3000).

---
*SIMMA — Solusi Efisien dan Transparan untuk Tata Kelola Aset Sekolah Modern.*
