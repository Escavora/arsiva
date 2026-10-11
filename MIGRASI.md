# Peta Migrasi Tech Stack — ARSIVA

Dokumen ini merangkum peta pemindahan ARSIVA dari stack lama ke stack baru.
Ditulis agar bisa dipakai sebagai konteks awal sesi Claude Code berikutnya.

## 1. Ringkasan aplikasi saat ini

**ARSIVA** adalah aplikasi web arsip dokumen legal bank (proyek PKL). PRD ada di
[`reference/Arsiva.md`](reference/Arsiva.md). Aplikasi ini monolit Next.js:
frontend, API, dan logika bisnis dalam satu repo, UI berbahasa Indonesia.

**Fitur:** arsip dokumen (cari, filter, detail), unggah scan (PDF/JPG/PNG/WebP,
maks 20 MB), kategori/jenis/tujuan, mitra dan jadwal notaris, pengingat
kedaluwarsa (cron + email + notifikasi in-app), berbagi dokumen lewat tautan
berbatas waktu yang bisa dicabut, manajemen pengguna dan peran
(Admin / Team Member / Pembaca).

**Status:** Tahap 1 (frontend), Tahap 2 (backend), dan Tahap 2.5 (email, DB cloud,
storage cloud) selesai. Sempat jalan di Vercel (lihat catatan "bug produksi
03/09/2026" di `src/lib/storage.ts`), tetapi datanya hanya data uji.

### Stack lama

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 16.3.4 (App Router), React 19, TypeScript |
| UI | Tailwind v4, shadcn/ui (base-nova, `@base-ui/react`), Phosphor + Lucide, sonner |
| Auth | Better Auth 1.7 (email + password, sesi 30 menit) |
| Database | SQLite via libSQL + Drizzle ORM, **Turso** (cloud) |
| Storage | Adapter: **Vercel Blob** (private) / disk lokal |
| Email | Adapter: Resend / SMTP (Nodemailer) / log |
| Cron | Vercel Cron, `GET /api/cron/reminders` (harian 01:00 UTC) |

## 2. Stack baru

| Kebutuhan | Teknologi baru |
|---|---|
| Hosting / tampilan web | **Cloudflare** (Pages/Workers) |
| Database | **Neon** (Postgres) |
| Login pengguna | **Clerk** |
| Email | **Resend** |
| Penyimpanan file dan gambar | **Cloudflare R2** |

Framework **tetap Next.js**, dijalankan di Cloudflare Workers lewat adapter
OpenNext. Semua layanan memakai **paket gratis**.

## 3. Peta pemindahan

| Sekarang | Baru | Beban | Yang berubah |
|---|---|---|---|
| Vercel | Cloudflare | Sedang | Build ke Workers runtime lewat adapter OpenNext |
| Turso (SQLite) | Neon (Postgres) | Sedang | Ganti dialect Drizzle, migrasi baru, pindah data |
| Better Auth | Clerk | **Tinggi** | Ganti lapisan login, peran, dan manajemen pengguna |
| Vercel Blob | R2 | Rendah | Tambah satu driver di `storage.ts` |
| Resend + SMTP + log | Resend (+ log untuk dev) | Sangat rendah | Hapus driver `smtp` dan `nodemailer` |
| Vercel Cron | Cron Triggers | Rendah-sedang | Jadwal pindah ke konfigurasi Wrangler |

## 4. Detail per komponen

### 4.1 Cloudflare (hosting)

- Next.js 16 tidak jalan di Pages begitu saja. Pendekatan yang diketahui:
  adapter **`@opennextjs/cloudflare`**. Cloudflare mulai mengarahkan proyek baru
  ke Workers (dengan static assets), bukan Pages murni. **Verifikasi dokumentasi
  terbaru sebelum memilih.**
- Wajib mengaktifkan flag `nodejs_compat`: kode memakai `node:crypto`
  (`randomBytes`, `randomUUID`).
- **Cron:** `vercel.json` diganti Cron Triggers. Trigger memanggil handler
  `scheduled`, bukan route HTTP. Pilihan: worker entry custom, atau handler yang
  `fetch` ke `/api/cron/reminders` dengan `CRON_SECRET`.
  **Diputuskan:** worker entry custom yang membungkus `.open-next/worker.js`;
  handler `scheduled` memanggil handler `fetch` worker itu sendiri dengan header
  `Authorization: Bearer $CRON_SECRET` (tanpa lewat jaringan publik).
- **Ukuran bundle:** Worker punya batas ukuran (sekitar 3 MB gzip di plan gratis,
  10 MB di berbayar). Cek setelah build pertama.
- **Subrequest per invocation** (paket gratis sekitar 50; cek angka terbaru).
  Dengan `neon-http`, setiap query = satu `fetch`. Cron sekarang memakai sekitar 3
  subrequest per dokumen (Resend + 2 insert), jadi perlu batch insert dan
  dibatasi jumlah dokumen per run.
- **`NEXT_PUBLIC_*`** (termasuk `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
  `NEXT_PUBLIC_APP_URL`) di-inline saat build, jadi harus tersedia di environment
  build, tidak cukup hanya sebagai secret Worker.
- **Risiko utama:** Next.js 16 `src/proxy.ts` berjalan di runtime Node. Pastikan
  `@opennextjs/cloudflare` mendukungnya, karena itu tujuan Langkah 0 (lihat §5).
- R2 binding di `next dev` butuh `initOpenNextCloudflareForDev()` di
  `next.config.ts` dan `getCloudflareContext()` untuk mengakses binding.
- Hapus `process.env.VERCEL` di `src/lib/storage.ts`. Env diambil dari secrets
  Cloudflare.

### 4.2 Neon (database)

- [`src/db/schema.ts`](src/db/schema.ts): `sqliteTable` menjadi `pgTable`.
  - `integer(... mode: "timestamp")` + `unixepoch()` menjadi `timestamp` + `defaultNow()`
  - `integer(... mode: "boolean")` menjadi `boolean`
  - `autoIncrement` menjadi `generatedAlwaysAsIdentity()`
  - Timestamp pakai `timestamp(..., { withTimezone: true })`
  - `documents.tanggalKadaluarsa` **dan** `schedules.tanggal` menjadi
    `date(..., { mode: "string" })`. Mode string wajib supaya nilainya tetap
    `"YYYY-MM-DD"` untuk `arsiva.ts` dan `hariMenuju` di cron.
- [`src/db/index.ts`](src/db/index.ts): pakai `@neondatabase/serverless` dengan
  **`neon-http`**. Jangan pakai `neon-serverless` (Pool/WebSocket): koneksinya
  tidak boleh dipakai lintas request di Workers. Hapus blok `mkdirSync` dan
  peringatan token Turso.
- [`drizzle.config.ts`](drizzle.config.ts): ganti seluruh percabangan turso/sqlite
  dengan dialect `postgresql`.
- [`src/lib/auth.ts`](src/lib/auth.ts): selama Better Auth masih dipakai,
  `drizzleAdapter` diganti `provider: "pg"`.
- Folder `drizzle/` dibuang dan migrasi dibuat ulang (SQL SQLite tidak kompatibel).
- **Data lama tidak dipindah.** Mulai dari seed baru.
- Skrip `db:reset` memakai `rmSync('./data')` khusus SQLite lokal: perlu diganti.

### 4.3 Clerk (login), bagian terberat

Ini perubahan desain, bukan sekadar ganti library.

- **Tabel `user`:** tidak lagi dikelola auth. **Diputuskan:** tabel profil lokal
  (`users`) dengan **primary key lokal + kolom `clerk_id` unik**. Foreign key dari
  `documents`, `notifications`, dan `document_shares` tidak berubah, dan
  `guard.ts` mencari pengguna berdasarkan `clerk_id`. Tabel `session`, `account`,
  `verification` dibuang.
- **Peran** (Admin / Team Member / Pembaca): **DB lokal adalah sumber kebenaran.**
  Setiap kali peran berubah, nilainya disalin ke Clerk `publicMetadata` (opsional
  dimasukkan ke session claims agar `guard.ts` tidak query tiap request).
- **`aktif`:** dipetakan ke ban/unban user di Clerk, sekaligus tetap dicek lokal.
- **Admin menambah pengguna** (`POST /api/users`): buat user lewat Clerk Backend
  API, lalu sisipkan baris lokal di request yang sama. **Webhook tidak perlu**,
  karena sign-up publik dimatikan dan user hanya dibuat lewat `/akses` atau seed.
- **Admin mengubah nama/email** (`PATCH /api/users/[id]`): nama cukup lewat
  `updateUser`. Email di Clerk butuh alur sendiri (buat email address baru, set
  primary, hapus yang lama).
- **Admin menghapus pengguna** (`DELETE /api/users/[id]`): hapus juga di Clerk.
- **Matikan sign-up publik** di dashboard Clerk. PRD mensyaratkan hanya karyawan
  berwenang; default Clerk membolehkan siapa pun mendaftar.
- **Password lama tidak bisa dibawa.** Hash Better Auth memakai format scrypt
  sendiri yang, setahu penulis, tidak didukung import Clerk. Pengguna perlu reset
  password. Akun demo cukup di-seed ulang.
- **Sesi 30 menit tanpa aktivitas** (syarat PRD): cek dulu apakah Clerk free
  punya pengaturan inactivity timeout. Kalau tidak ada, pakai idle-timer di klien
  yang memanggil `signOut()`.
- **Halaman login** (baru di-redesign, commit `d5c9c6a`/`812bc28`): pertahankan
  desainnya. Pakai custom flow `useSignIn`, bukan komponen `<SignIn/>`.
- `reminderThresholdDays` dan `unit` tetap di tabel lokal.

File yang terdampak:

| File | Perubahan |
|---|---|
| `src/lib/auth.ts`, `src/lib/auth-client.ts` | Dihapus |
| `src/app/api/auth/[...all]/route.ts` | Dihapus |
| `src/proxy.ts` | Jadi `clerkMiddleware` |
| `src/lib/guard.ts` | Baca dari `auth()` Clerk; `HttpError` dan `handle` dipertahankan |
| `src/app/login/page.tsx` | Flow custom `useSignIn`, desain dipertahankan |
| `src/app/api/users/route.ts`, `users/[id]/route.ts` | Buat/ubah/hapus lewat Clerk Backend API + tabel lokal |
| `src/app/(app)/sandi/page.tsx` | Komponen Clerk atau flow custom |
| `src/app/(app)/akses/page.tsx` | Pakai Clerk Backend API |
| `src/components/arsiva/shell.tsx`, `store.tsx` | `useSession` Better Auth diganti hook Clerk |
| `src/db/seed.ts` | Sesuaikan: user dibuat lewat Clerk |

### 4.4 Cloudflare R2 (file dan gambar)

- Tambah driver `r2` dengan interface yang sama (`put/get/delete`) di
  [`src/lib/storage.ts`](src/lib/storage.ts). Pilihan:
  - **R2 binding**: tanpa kredensial, natural di Workers. **Direkomendasikan.**
  - **S3 API**: butuh `@aws-sdk/client-s3`, bundle lebih besar.
- Bucket tetap **private**. Berkas tetap disalurkan lewat
  `/api/documents/[id]/file` dan `/s/[token]/file` yang memeriksa sesi/token dulu.
  URL storage mentah tidak pernah dikirim ke browser.
- Dengan binding, hasil `get` bisa di-**stream** langsung ke response. Ini
  **mengubah interface**: `get()` mengembalikan `ReadableStream` + `size`, bukan
  `Buffer`. Dua route berkas (`api/documents/[id]/file`, `s/[token]/file`) ikut
  disesuaikan.
- Nama asli dan tipe berkas disimpan di `httpMetadata`/`customMetadata` R2,
  menggantikan sidecar `.meta.json`.
- Hapus driver `local` dan `blob` serta dependensi `@vercel/blob`.
- Data lama tidak dipindah (mulai dari seed).
- Aplikasi hanya menyimpan scan dokumen. Aset gambar lain (logo, avatar) belum
  ada dan akan menjadi fitur baru.

### 4.5 Resend (email)

- Driver `resend` di [`src/lib/notify.ts`](src/lib/notify.ts) sudah memakai
  `fetch`, jadi jalan di Workers tanpa perubahan.
- Hapus driver `smtp`, dependensi `nodemailer` dan `@types/nodemailer`.
  Driver `log` dipertahankan untuk dev lokal.
- Default `from()` (`no-reply@arsiva.local`) pasti ditolak Resend. Jadikan
  `EMAIL_FROM` wajib saat driver `resend`.
- Batas Resend tanpa domain terverifikasi: hanya bisa kirim ke email pemilik
  akun, dan `EMAIL_FROM` harus `onboarding@resend.dev`. Verifikasi domain agar
  bisa kirim ke notaris/rekanan sungguhan.

## 5. Urutan pengerjaan yang disarankan

0. **Spike Cloudflare.** Pasang `@opennextjs/cloudflare` + `wrangler.jsonc`, lalu
   build dan preview aplikasi apa adanya (DB tetap Turso). Tujuannya membuktikan
   Next.js 16 + `proxy.ts` jalan di Workers dan bundle muat di batas gratis.
   Kalau gagal, rencana hosting harus ditinjau ulang sebelum lanjut.
1. **Neon + Drizzle.** Dialect baru, migrasi baru, seed ulang. Aplikasi masih
   memakai Better Auth (`provider: "pg"`).
2. **R2.** Driver binding, memakai setup dev OpenNext dari langkah 0.
3. **Clerk.** Bagian paling invasif; dikerjakan setelah data dan file aman.
4. **Cron Triggers + deploy final.** Cron dibuat hemat subrequest.
5. **Bersih-bersih.** Hapus `better-auth`, `@libsql/client`, `@vercel/blob`,
   `nodemailer`, `vercel.json`; update `README.md` dan `.env.example`.

### Hasil Langkah 0 (spike Cloudflare, 2026-10-10)

Aplikasi yang sekarang (DB Turso, Better Auth) berhasil dibuild dengan
`@opennextjs/cloudflare` 1.20.10 dan dijalankan di runtime Workers lokal.

- **Next.js harus ≥ 16.3.8** (peer dependency OpenNext). Dinaikkan dari 16.3.4.
- **`src/proxy.ts` (runtime Node) diganti `src/middleware.ts` (edge).** Middleware
  Node masih eksperimental di Cloudflare dan membuat bundle membengkak: 3,52 MB
  gzip, di atas batas 3 MB paket gratis. Dengan edge middleware: **2,25 MB gzip**.
  Next 16 menandai nama `middleware` sebagai deprecated (hanya peringatan), tapi
  panduan upgrade resminya justru menyarankan tetap memakai `middleware` bila
  butuh runtime edge (`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`).
  Saat Clerk masuk (Langkah 3), `clerkMiddleware` memang berjalan di edge.
- **Memori build:** `next build` lewat OpenNext kehabisan memori dengan jumlah
  worker default. `experimental.cpus: 4` di `next.config.ts` menyelesaikannya.
- **Turbopack menelusuri seluruh proyek** karena akses filesystem dinamis di
  `storage.ts` (driver `local`). Akibatnya `.env`, `data/`, dan `storage/uploads/`
  ikut tersalin ke `.open-next/`. Diperbaiki dengan `/*turbopackIgnore: true*/` dan
  `outputFileTracingExcludes`. Driver `local` dihapus di Langkah 2, tapi
  `outputFileTracingExcludes` sebaiknya tetap dipertahankan.
- **Terverifikasi di preview Workers:** halaman publik, redirect middleware ke
  `/login`, 401 untuk API tanpa sesi, login Better Auth, `/api/me`, dan
  `/api/documents` (membaca dari Turso lewat libSQL).
- **Gagal, sesuai dugaan:** baca berkas dari Vercel Blob (`/api/documents/[id]/file`
  → 404). SDK `@vercel/blob` memakai opsi TLS `ALPNProtocols` yang belum
  diimplementasikan workerd. Ini terselesaikan dengan pindah ke R2 (Langkah 2).
- **Belum diuji:** unggah berkas (bergantung pada Blob), cron/email (akan
  mengirim email sungguhan), dan deploy ke akun Cloudflare.
- OpenNext memperingatkan bahwa Windows tidak sepenuhnya didukung. Build lokal
  berhasil, tetapi untuk deploy lebih aman lewat WSL atau build di Cloudflare
  (terhubung ke GitHub).
- `wrangler.jsonc` dan `open-next.config.ts` memakai konfigurasi minimal: tanpa
  cache incremental R2 dan tanpa binding gambar (tidak memakai `next/image`).

### Hasil Langkah 1 (Neon, 2026-10-10)

- Schema dikonversi ke `pg-core` tanpa mengubah nama tabel atau kolom. Tipe data
  timestamp → `timestamptz`, boolean → `boolean`, dan kedua kolom tanggal →
  `date` (mode string). Koneksi memakai `neon-http`; `@libsql/client` dihapus.
- `drizzle/` dibuat ulang (satu migrasi Postgres). `drizzle.config.ts` otomatis
  memakai host langsung (tanpa `-pooler`) untuk migrasi.
- `db:reset` sekarang memakai `scripts/reset-db.ts`, yang menghapus schema
  `public` dan `drizzle` di Neon. **Menghapus semua data.**
- Better Auth: `drizzleAdapter` memakai `provider: "pg"`.
- **Terverifikasi di preview Workers + Neon:** login ketiga peran; akun nonaktif →
  403; Pembaca → 403 untuk operasi tulis; semua endpoint GET 200 dengan tanggal
  tetap `"YYYY-MM-DD"`; Admin/Team Member bisa membuat dan menghapus kategori dan
  dokumen. Seed tetap idempoten.
- Catatan kecil: `onConflictDoUpdate` di seed menghabiskan nomor identity walau
  barisnya tidak bertambah, jadi id bisa melompat (mis. kategori baru id 15).
  Tidak berpengaruh ke fungsi.
- Bundle Worker naik ke **2,60 MB gzip** (batas 3 MB). Pantau terus; membuang
  Better Auth di Langkah 3 akan mengurangi ukurannya.

### Hasil Langkah 2 (R2, 2026-10-10)

- `src/lib/storage.ts` kini hanya berisi driver R2 lewat binding `FILES`
  (`wrangler.jsonc`, bucket `arsiva-files`). Driver `local`, driver `blob`, dan
  `@vercel/blob` dihapus. Tidak ada variabel `.env` untuk storage.
- `get()` mengembalikan `ReadableStream` + `size` (bukan `Buffer`), dan kedua route
  berkas mengalirkannya langsung. Nama asli berkas disimpan di `customMetadata`
  R2 (di-encode URI), tipe MIME di `httpMetadata`.
- Tipe binding R2 didefinisikan minimal di `storage.ts`. **Jangan pakai
  `wrangler types`**: tipe runtime Workers menimpa tipe DOM proyek dan membuat
  `Request.json()` bertipe `unknown` di semua route.
- `initOpenNextCloudflareForDev()` di `next.config.ts`, supaya `npm run dev` juga
  memakai bucket simulasi Wrangler (`.wrangler/state`, sudah di-ignore).
- Bundle **turun ke 2,16 MB gzip**, karena SDK Vercel Blob ikut keluar.
- **Terverifikasi di preview Workers dan `next dev`:** unggah PDF/PNG; tipe lain
  ditolak; nama berkas Unicode utuh; isi unduhan identik byte per byte; 401 tanpa
  sesi; tautan berbagi bisa diakses tanpa login; tautan yang dicabut → 403;
  token palsu → 404; hapus dokumen ikut menghapus objek R2 (bucket kembali 0).
- Respons berkas memakai `Transfer-Encoding: chunked` tanpa `Content-Length`
  (OpenNext mengalirkan respons stream). Unduhan tetap utuh, hanya browser tidak
  menampilkan persentase progres.
- Sebelum deploy: buat bucket sungguhan dengan `npx wrangler r2 bucket create arsiva-files`.

### Hasil Langkah 3 (Clerk, 2026-10-10)

**Desain akhir** (menyimpang sedikit dari rencana awal, lihat alasannya):

- Better Auth dihapus total (`auth.ts`, `auth-client.ts`, route `/api/auth/*`, tabel
  `session`/`account`/`verification`, kolom `email_verified`/`image`). Dua migrasi baru:
  `0001` (tambah `clerk_id`, `last_active_at`, `last_session_id`; hapus tabel auth) dan
  `0002` (hapus dua kolom lama). Dipecah karena `drizzle-kit` bertanya "rename atau
  bukan?" secara interaktif bila kolom ditambah dan dihapus sekaligus.
- **Peran, unit, dan status aktif tetap di tabel lokal `user`** dan dibaca server di setiap
  request (`guard.ts`); tidak disalin ke Clerk `publicMetadata` (dibatalkan: tidak ada
  manfaatnya, dan menambah risiko dua sumber kebenaran yang tidak sinkron).
- PK lokal dipertahankan; `clerk_id` menautkan ke Clerk. Profil tanpa `clerk_id` ditautkan
  otomatis lewat email **yang sudah terverifikasi** di Clerk.
- **Tanpa webhook.** Akun hanya dibuat Admin (`POST /api/users`) atau seed; keduanya
  membuat akun Clerk dan baris lokal sekaligus. Bila baris lokal gagal dibuat, akun Clerk
  dibatalkan. Akun Clerk tanpa profil lokal → 403 "belum terdaftar".
- `src/lib/clerk-users.ts`: buat akun, ubah nama, ubah email (tambah alamat baru
  terverifikasi lalu hapus yang lama), ban/unban, hapus. `PATCH`/`DELETE` pengguna
  mengubah Clerk lebih dulu, baru database.
- `src/middleware.ts` memakai `clerkMiddleware` (edge). Matcher mencakup `/api/*` karena
  `auth()` di route handler mensyaratkannya.
- **Batas idle 30 menit** (Clerk gratis: *Maximum lifetime* dan *Inactivity timeout* berlabel
  Pro). Ditegakkan di server (`guard.ts`): `last_active_at` dicatat paling sering sekali per
  menit; bila sesi yang sama diam >30 menit, sesi Clerk dicabut dan request dijawab 401.
  `last_session_id` mencegah login baru dianggap idle karena aktivitas kemarin. Di browser,
  `use-idle-timeout.ts` mengeluarkan pengguna dan mengirim "denyut" ke `/api/me` tiap 4
  menit selama pengguna aktif, supaya orang yang hanya membaca tidak dianggap idle server.
- Login memakai *custom flow* Clerk (`useSignIn`) sehingga desain halaman login tetap.
  Tambahan: tombol "Masuk dengan Google" + `/sso-callback`, langkah input kode email
  (untuk Client Trust), dan banner alasan keluar (`?reason=idle`).
- `/sandi` memakai `user.updatePassword`; akun Google-saja (tanpa kata sandi) diberi
  penjelasan. Bundle Worker: **2,29 MB gzip**.

**Terverifikasi** (preview Workers + Neon + instance Clerk development, 42 pengecekan
otomatis): sesi per peran, semua endpoint GET, 403 untuk peran yang tidak berwenang, 401
untuk token sampah/tanpa token, idle >30 menit → 401 + sesi dicabut, sesi baru tidak
dianggap idle, 29 menit masih diterima, penautan otomatis lewat email, akun asing → 403,
dan seluruh siklus Admin kelola pengguna (buat, nama, email, ban/unban, peran, hapus) yang
tercermin di Clerk. Akun nonaktif (ban) tidak bisa membuat sesi sama sekali.

**Belum teruji** (butuh browser, tidak tersedia di sesi pengembangan): klik form login,
tombol Google dan `/sso-callback`, timer idle di browser, halaman `/sandi`, tombol
Keluar. Sudah dipastikan hanya: lolos typecheck, ter-build, dan kodenya ada di bundle klien.

**Temuan: Client Trust Clerk aktif.** Login dengan kata sandi benar tetap berstatus
`needs_client_trust` (kode email di perangkat baru). Email akun demo (`@bri.co.id`)
fiktif, sehingga kode tidak pernah sampai dan akun demo **tidak bisa masuk** selama fitur
ini aktif. Matikan di dashboard Clerk untuk development, atau pakai email nyata. Untuk
production dengan email kantor sungguhan, fitur ini layak dibiarkan menyala (verifikasi
perangkat baru), dan form login sudah menyediakan langkah input kodenya.

**Tindak lanjut (uji browser, 2026-10-10):**
- *Device Trust* (nama baru Client Trust; Protect → Protections) dimatikan untuk
  development. Login akun demo berhasil di browser.
- Pesan error Clerk sempat tampil berbahasa Inggris: kode aslinya ada di
  `errors[0].code`, bukan `code` (yang selalu `api_response_error`). Sekarang semua
  diterjemahkan lewat `src/lib/pesan-clerk.ts` (login, `/sandi`, `clerk-users.ts`);
  kode yang tidak dikenal jatuh ke pesan umum berbahasa Indonesia.
- Panjang minimum kata sandi di Clerk diturunkan dari 15 ke 8, sama dengan teks `/sandi`.
- Teruji di browser: login benar/salah, dashboard + semua API, `/sandi` (sandi lama
  salah, konfirmasi beda, terlalu pendek, berhasil). Kata sandi demo kemudian diganti frasa
  sandi acak lewat `npm run sandi:demo` dan tidak lagi dicantumkan di repo.
- Juga teruji: timer idle (jam browser dimajukan 31 menit → keluar dalam ≤15 detik ke
  `/login?reason=idle` dengan banner; sesi Clerk benar-benar dicabut, `/api/me` 401),
  tombol Keluar (sesi dicabut, `/dashboard` dialihkan), tombol Google (sampai di halaman
  masuk Google).
- `/sso-callback` yang dibuka tanpa alur Google sempat menampilkan layar kosong selamanya:
  `HandleSSOCallback` tidak berpindah halaman bila status sign-in tidak cocok dengan
  cabangnya. Kini ada teks tunggu dan tautan "Kembali ke halaman masuk" setelah 8 detik
  (bukan pengalihan otomatis, supaya captcha Clerk tidak terpotong).
- Belum teruji: menyelesaikan login Google sampai dashboard, dan akun Google yang belum
  terdaftar (`?reason=tidak-terdaftar`) — butuh akun Google sungguhan.

**Catatan:**
- Kata sandi awal pengguna baru tetap `arsiva123` bila Admin tidak mengisinya (perilaku
  lama, tertulis di pesan UI). Dibuat dengan `skipPasswordChecks` karena Clerk menolaknya
  sebagai kata sandi lemah/bocor. Pertimbangkan kata sandi acak per pengguna.
- "Lupa kata sandi?" dan "Ingat perangkat ini" di halaman login masih tombol kosong
  (sudah begitu sebelum migrasi).
- Domain `.test` ditolak Clerk sebagai email; pakai `example.com` untuk akun uji.
- Waktu development pakai kredensial Google bersama milik Clerk; production butuh OAuth
  client sendiri di Google Cloud Console.

## 6. Bagian yang tidak perlu diubah

- **Logika domain:** `src/lib/arsiva.ts`, `dto.ts`, `master-crud.ts`.
- **Pola API:** `handle` + `HttpError` di `guard.ts`.
- **Adapter storage dan email:** interface tetap, hanya driver yang diganti.
- **UI:** halaman di `src/app/(app)/`, kecuali bagian yang menyentuh sesi/auth.
- **Kontrak keamanan:** peran dari sesi server (bukan klien), token berbagi
  256-bit acak, berkas hanya lewat endpoint yang memverifikasi.

## 7. Utang teknis yang layak dirapikan selama migrasi

- `GET /api/documents` mengembalikan semua dokumen tanpa pagination, dan
  pencarian/filter dilakukan di klien (`store.tsx`). Tidak akan skala bila arsip
  membesar.
- Dua pustaka ikon sekaligus (`lucide-react` dan `@phosphor-icons/react`).
- Belum ada test otomatis.
- Footer email menyebut "audit log ARSIVA", padahal fitur audit log belum ada.
- Fitur yang masih tertunda (dari README): form ubah dokumen dan ubah kategori
  (API `PATCH` sudah ada), verifikasi dua langkah, audit log persisten.
- `.env` berisi kredensial ada di folder proyek (di-ignore git). Jangan ikut
  terbawa saat copy folder. **Rotasi** token Turso, Blob, Resend, dan
  `BETTER_AUTH_SECRET` setelah migrasi selesai.

## 8. Keputusan (2026-10-10)

1. Framework **tetap Next.js** lewat `@opennextjs/cloudflare`.
2. **Workers** (dengan static assets), bukan Pages. Dibuktikan di Langkah 0.
3. Semua layanan memakai **paket gratis**. Batas sesi 30 menit memakai pengaturan
   Clerk kalau tersedia di paket gratis, kalau tidak lewat idle-timer di klien.
4. Data Turso dan Blob **tidak dipindah**. Mulai dari seed baru.
5. R2 lewat **binding**.
6. Tabel pengguna: **PK lokal + `clerk_id`**. DB lokal jadi sumber kebenaran peran.
7. Desain halaman login **dipertahankan** (custom flow Clerk).
