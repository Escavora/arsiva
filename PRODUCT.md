# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Staf legal dan operasional di Credit Operations Department, RO BRI Pekanbaru. Mereka bekerja di meja kerja (desktop) untuk mengunggah hasil scan, mencari dokumen, dan menindaklanjuti dokumen yang mendekati masa berlaku. Tiga peran: **Admin** (kelola pengguna, master data, semua dokumen), **Team Member** (unggah dan bagikan dokumen), **Pembaca** (hanya melihat, mis. unit Audit Internal). Penerima tautan berbagi (notaris dan rekanan) adalah audiens luar yang hanya membuka satu dokumen lewat tautan, tanpa akun.

## Product Purpose

Satu arsip digital untuk dokumen legal bank (perjanjian kerja sama, akta notaris, sertifikat agunan, surat kuasa) yang selama ini tersebar di banyak tempat sehingga sulit dicari dan masa berlakunya terlewat. Sukses berarti dokumen mudah ditemukan, tidak ada yang kadaluarsa tanpa diketahui, dan dokumen dapat dibagikan ke pihak luar tanpa kehilangan kendali atas aksesnya.

## Positioning

Berbagi dokumen ke notaris dan rekanan dengan aman: tautan bertoken acak 256-bit, berbatas waktu (3 sampai 30 hari), dan dapat dicabut kapan saja. Folder bersama biasa tidak memberi kendali akses sehalus itu. (Pengingat kadaluarsa otomatis, jadwal notaris, dan hak akses per peran adalah kemampuan pendukung, tetapi bukan jawaban yang dipilih sebagai pembeda utama.)

## Operating Context

Alur kerja nyata: dokumen dipindai, diunggah dengan jenis, tujuan, kategori, dan tanggal kadaluarsa; sistem menandai status (Aman, Segera kadaluarsa, Kadaluarsa, Diproses) berdasarkan ambang pengingat per pengguna (30, 60, atau 90 hari) dan mengirim pengingat sekali ke pemilik dokumen. Sesi login berakhir otomatis setelah 30 menit tanpa aktivitas. Pengguna dibuat oleh Admin; tidak ada pendaftaran publik. Masuk dengan email dan kata sandi, atau dengan akun Google yang emailnya sudah didaftarkan Admin.

## Capabilities and Constraints

- Fitur yang ada: arsip dan pencarian, unggah (PDF, JPG, PNG, WebP, maksimal 20 MB), pratinjau berkas, kategori/jenis/tujuan, jadwal dan mitra notaris, pengingat kadaluarsa (in-app dan email), tautan berbagi, kelola hak akses, laporan unduhan (CSV), dasbor.
- Stack: Next.js (App Router), Postgres (Neon) lewat Drizzle, Clerk untuk autentikasi, Cloudflare R2 untuk berkas, Resend untuk email; target hosting Cloudflare Workers.
- Klaim keamanan di antarmuka hanya boleh yang benar-benar ada di kode. **Belum ada** audit log dan verifikasi dua langkah; keduanya sengaja dihapus dari teks.
- Istilah baku di antarmuka: status dokumen "Aman", "Segera kadaluarsa", "Kadaluarsa", "Diproses"; ejaan yang dipakai "kadaluarsa" (bukan "kedaluwarsa").
- Belum diputuskan: standar aksesibilitas formal (pekerjaan saat ini memakai WCAG AA sebagai pedoman, tetapi bukan persyaratan yang ditetapkan pemilik produk); apakah aplikasi dipakai nyata atau terutama untuk demo PKL.

## Brand Commitments

Semua teks antarmuka berbahasa Indonesia baku dengan nada formal-ramah; hindari jargon dan istilah asing yang tidak perlu. Nama produk: ARSIVA, "Arsip Dokumen Legal". Unit: Credit Operations Department, RO BRI Pekanbaru. Tidak ada logo atau aset merek resmi BRI di repositori; identitas visual saat ini dibuat sendiri dan tidak boleh diklaim sebagai merek resmi.

## Evidence on Hand

- PRD: `reference/Arsiva.md`; acuan visual awal: `reference/Arsiva.html`.
- Data contoh (seed) untuk 14 dokumen, 7 kategori, 5 mitra notaris, dan pengguna demo; seluruhnya fiktif.
- Tidak ada testimoni, nama pelanggan, benchmark, atau angka penggunaan nyata. Jangan dikarang.

## Product Principles

1. **Kendali atas dokumen sensitif lebih penting daripada kemudahan semata.** Akses dibatasi di server, tautan berbatas waktu, dan semua klaim keamanan harus benar.
2. **Jujur tentang keadaan.** Status, sisa hari, dan pengingat menampilkan keadaan sebenarnya, bukan hiasan; keadaan kosong dan gagal dinyatakan apa adanya.
3. **Tindakan yang merusak selalu dikonfirmasi.** Menghapus pengguna, mitra, kategori, atau dokumen tidak pernah terjadi dalam satu klik.
4. **Cepat dipahami staf yang sibuk.** Informasi terpenting (apa yang perlu ditindaklanjuti sekarang) terlihat tanpa membaca paragraf.
5. **Peran menentukan apa yang terlihat dan bisa dilakukan**, dan itu ditegakkan di server, bukan hanya disembunyikan di antarmuka.
