# ARSIVA — Arsip Dokumen Legal

Aplikasi arsip dokumen legal bank untuk Credit Operations Department, RO BRI
Pekanbaru: unggah hasil scan, kategorikan, pantau masa berlaku dan kedaluwarsa,
kelola jadwal mitra notaris, dan bagikan dokumen ke pihak luar lewat tautan
yang berbatas waktu dan bisa dicabut.

- PRD: [`reference/Arsiva.md`](reference/Arsiva.md) · rancangan visual awal: [`reference/Arsiva.html`](reference/Arsiva.html)
- Konteks produk dan pengguna: [`PRODUCT.md`](PRODUCT.md)
- Catatan pemindahan stack dan keputusan teknis: [`MIGRASI.md`](MIGRASI.md)

## Status

| Tahap | Lingkup | Status |
| --- | --- | --- |
| 1 | Seluruh tampilan frontend | ✅ Selesai |
| 2 | Backend: database, autentikasi, API, storage, pengingat | ✅ Selesai |
| 2.5 | Email sungguhan (Resend) | ✅ Selesai |
| 3 | Pindah stack: Neon, Clerk, Cloudflare R2, build untuk Cloudflare Workers | ✅ Selesai (lihat [`MIGRASI.md`](MIGRASI.md)) |
| 3.5 | Penyempurnaan antarmuka: warna, tipografi, tata letak, gerak, adaptasi HP/tablet, performa, polish | ✅ Selesai |
| 4 | Deploy ke Cloudflare Workers dan penjadwalan pengingat | ⏳ Belum |

## Fitur

| Halaman | Rute | Untuk apa |
| --- | --- | --- |
| Dashboard | `/dashboard` | Ringkasan status arsip, kepatuhan, jatuh tempo, dan yang perlu ditindaklanjuti |
| Arsip Dokumen | `/arsip`, `/arsip/[id]` | Cari dan saring dokumen; detail, pratinjau berkas, ubah informasi, tandai diproses |
| Unggah Dokumen | `/unggah` | PDF/JPG/PNG/WebP, maksimal 20 MB, dengan jenis, tujuan, kategori, dan tanggal kedaluwarsa |
| Pengingat Kedaluwarsa | `/pengingat` | Dokumen dalam ambang pengingat (30/60/90 hari, per pengguna) |
| Bagikan Dokumen | `/bagikan` | Tautan berbatas waktu (3–30 hari) untuk notaris dan rekanan; dicabut kapan saja |
| Jadwal Notaris | `/notaris` | Mitra notaris dan catatan jadwal kerja samanya |
| Kategori & Jenis | `/kategori` | Master data kategori, jenis, dan tujuan dokumen (Admin) |
| Kelola Hak Akses | `/akses` | Pengguna, peran, dan kewenangan (Admin) |
| Penerima tautan | `/s/[token]` | Halaman publik untuk satu dokumen, tanpa akun |
| Lainnya | `/login`, `/sandi`, `/sso-callback` | Masuk (email + kata sandi atau Google), ganti kata sandi |

Status dokumen: **Aman**, **Segera kedaluwarsa**, **Kedaluwarsa**, **Diproses**.
Laporan ringkasan arsip bisa diunduh sebagai CSV dari dashboard.

## Tech Stack

| Lapisan | Teknologi |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Tampilan | Tailwind CSS v4, shadcn/ui (`@base-ui/react`), Phosphor Icons, sonner |
| Autentikasi | **Clerk** — peran, status aktif, dan batas idle dikelola di server |
| Database | **Neon** (Postgres) lewat `neon-http` + Drizzle ORM |
| Storage berkas | **Cloudflare R2** lewat binding Worker `FILES` (bucket private) |
| Email | Adapter `resend` / `smtp` / `log` + notifikasi in-app |
| Hosting | **Cloudflare Workers** lewat `@opennextjs/cloudflare` |

## Menjalankan di lokal

Butuh akun gratis di Neon dan Clerk. Berkas scan di lokal disimulasikan Wrangler
(`.wrangler/state`), jadi tidak butuh akun Cloudflare untuk pengembangan.

```bash
npm install
cp .env.example .env     # lalu isi nilainya (lihat "Konfigurasi")
npm run db:migrate
npm run db:seed
npm run dev
```

Buka http://localhost:3000 → diarahkan ke `/login`.

**Akun demo** (dibuat `db:seed`, baik di basis data maupun di Clerk):

| Peran | Email |
| --- | --- |
| Admin | `admin.cop@bri.co.id` |
| Team Member | `sari.melati@bank.co.id` |
| Pembaca | `agus.nugroho@bank.co.id` |

Kata sandi **tidak** dicantumkan di repo. `npm run db:seed` membuat frasa sandi
acak untuk akun yang baru dibuat dan mencetaknya **sekali** di terminal. Untuk
akun demo yang sudah ada, `npm run sandi:demo` menggantinya dengan frasa baru,
mengeluarkan sesi lamanya, lalu mencetaknya sekali. Kata sandi disimpan di Clerk,
bukan di database; panjang minimal 8 karakter.

## Konfigurasi

Salin [`.env.example`](.env.example) ke `.env` (berkas `.env` diabaikan git).

| Variabel | Fungsi |
| --- | --- |
| `DATABASE_URL` | Connection string Neon. Pakai yang *pooled*; migrasi otomatis memakai host langsung (tanpa `-pooler`), atau timpa dengan `DATABASE_URL_UNPOOLED` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Kunci dari dashboard Clerk |
| `NEXT_PUBLIC_APP_URL` | Alamat publik aplikasi, dipakai untuk tautan `/s/<token>` di email |
| `EMAIL_DRIVER` | `resend`, `smtp`, atau `log` (cetak ke konsol) |
| `EMAIL_FROM`, `RESEND_API_KEY` | Pengirim dan kunci Resend |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Hanya bila `EMAIL_DRIVER=smtp` |
| `CRON_SECRET` | Rahasia untuk memanggil `/api/cron/reminders` |

Dua hal yang perlu diatur di dashboard **Clerk**:

- **Sign-up mode = Restricted** (Configure → Restrictions), agar hanya akun buatan
  Admin yang bisa masuk.
- Untuk akun demo beremail fiktif, matikan *Device Trust* (Protect → Protections);
  kode verifikasi perangkat baru tidak akan pernah sampai ke email fiktif.

`NEXT_PUBLIC_*` tertanam saat build. Setelah mengubahnya, build ulang.

## Perintah

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` / `npm start` | Build dan jalankan produksi (Node) |
| `npm run lint` | ESLint |
| `npm run preview` | Build dengan OpenNext lalu jalankan di runtime Workers lokal |
| `npm run deploy` | Build dengan OpenNext lalu deploy ke Cloudflare |
| `npm run db:generate` | Buat migrasi dari perubahan schema |
| `npm run db:migrate` | Terapkan migrasi ke Neon |
| `npm run db:push` | Dorong schema langsung (hanya untuk pengembangan) |
| `npm run db:seed` | Isi data contoh (idempoten) |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:reset` | **Hapus semua data** di database, migrasi ulang, seed ulang |
| `npm run sandi:demo` | Ganti kata sandi akun demo dengan frasa acak |
| `npm run email:test -- nama@domain.com` | Kirim satu email uji sesuai `EMAIL_DRIVER` |

## Keamanan

- **Peran** (Admin / Team Member / Pembaca), status aktif, dan unit disimpan di
  tabel `user` lokal dan dibaca server pada **setiap request** — tidak pernah dari
  klien. Tidak ada tombol ganti peran; untuk berganti peran, keluar lalu masuk
  sebagai akun lain.
- Setiap API route memanggil `requireUser` / `requireWriter` / `requireAdmin`
  ([`src/lib/guard.ts`](src/lib/guard.ts)). Pengecekan `isAdmin` di React hanya
  untuk UX (menyembunyikan menu), **bukan** penjaga keamanan.
- [`src/middleware.ts`](src/middleware.ts) hanya mengalihkan pengunjung yang belum
  masuk ke `/login`. Otorisasi sebenarnya tetap di API route.
- **Batas idle 30 menit** ditegakkan di server: aktivitas dicatat paling sering
  sekali per menit, dan sesi yang diam lebih dari 30 menit dicabut di Clerk lalu
  ditolak (401). Di browser, pengguna yang hanya membaca tidak dianggap idle
  karena ada denyut berkala.
- Berkas scan tidak disajikan sebagai berkas statis, dan bucket R2 bersifat
  private. Aksesnya hanya lewat `/api/documents/[id]/file` (wajib bersesi) atau
  `/s/[token]/file` (memvalidasi token, masa berlaku, dan status pencabutan).
- Token berbagi adalah 256-bit acak (`randomBytes(32)`), tidak bisa ditebak.
- Admin tidak dapat menurunkan peran, menonaktifkan, atau menghapus akunnya sendiri.
- Pengguna yang masih memiliki dokumen tidak bisa dihapus, hanya dinonaktifkan,
  supaya arsip tidak kehilangan jejak kepemilikan.
- **Belum ada:** verifikasi dua langkah dan audit log persisten.

## Struktur

```
src/
  app/
    (app)/            # halaman ber-sidebar: dashboard, arsip, unggah, pengingat, bagikan, ...
    api/              # API routes — semua bergerbang guard.ts
      documents/ categories/ types/ purposes/ notaris/ schedules/
      shares/ users/ me/ notifications/ laporan/
      cron/reminders/ #   pengingat kedaluwarsa (dilindungi CRON_SECRET)
    s/[token]/        # halaman publik tautan berbagi (tanpa login)
    login/ sso-callback/
  components/arsiva/  # store (klien API), shell (sidebar/topbar), kepala halaman
  components/ui/      # komponen shadcn/ui
  db/                 # schema Drizzle, koneksi Neon, seed
  lib/                # guard, clerk-users, storage (R2), notify (email), dto, helper domain
  middleware.ts       # pengalihan rute belum-masuk (Clerk, edge)
drizzle/              # migrasi SQL (Postgres)
scripts/              # reset-db, sandi demo, uji email
reference/            # PRD dan rancangan visual awal
wrangler.jsonc        # konfigurasi Worker + binding R2 "FILES"
open-next.config.ts   # konfigurasi adapter OpenNext
```

## Email

Tiga driver di [`src/lib/notify.ts`](src/lib/notify.ts), dipilih lewat `EMAIL_DRIVER`:

| Driver | Kredensial | Kegunaan |
| --- | --- | --- |
| `log` | Tidak ada | Email dicetak ke konsol server — untuk pengembangan |
| `resend` | `RESEND_API_KEY` | Kirim lewat Resend (HTTP API; jalan di Workers) |
| `smtp` | `SMTP_HOST/USER/PASS` | Kirim lewat SMTP (mis. Gmail dengan *App password*) |

**Untuk deploy di Cloudflare Workers, pakai `resend`.** Driver `smtp` memakai
Nodemailer dan belum tentu berjalan di runtime Workers.

**Batas Resend tanpa domain terverifikasi:** hanya bisa mengirim ke alamat email
pemilik akun Resend, dan `EMAIL_FROM` harus `onboarding@resend.dev`. Untuk
mengirim ke notaris atau rekanan sungguhan, verifikasi domain di
resend.com/domains lalu ubah `EMAIL_FROM` ke alamat domain tersebut.

**Kegagalan email tidak membatalkan aksi.** Bila pengiriman gagal, tautan berbagi
dan pengingat tetap tersimpan, dan antarmuka meminta tautannya disalin manual.

## Pengingat kedaluwarsa (cron)

`GET /api/cron/reminders` memeriksa dokumen yang masuk ambang pengingat pemiliknya
(`reminder_threshold_days`: 30/60/90 hari), mengirim email dan notifikasi in-app,
lalu mencatat `document_reminders.notified_at` agar **tidak mengirim ganda**.
Endpoint ini mewajibkan header `Authorization: Bearer <CRON_SECRET>`.

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reminders
```

> **Belum terjadwal otomatis.** `vercel.json` adalah sisa dari hosting lama dan
> tidak dipakai di Cloudflare. Rencananya: Cron Triggers lewat worker entry yang
> membungkus `.open-next/worker.js`, dengan handler `scheduled` memanggil route ini
> (keputusan dan batasan subrequest ada di [`MIGRASI.md`](MIGRASI.md)). Sampai
> itu dipasang, jalankan pengingat dengan perintah di atas.

## Deploy ke Cloudflare Workers

Belum dikerjakan; langkah yang diperlukan:

1. Buat bucket: `npx wrangler r2 bucket create arsiva-files`.
2. Isi variabel produksi (`DATABASE_URL`, kunci Clerk, `NEXT_PUBLIC_APP_URL`,
   `EMAIL_DRIVER=resend`, `EMAIL_FROM`, `RESEND_API_KEY`, `CRON_SECRET`) sebagai
   secret/variabel Worker. `NEXT_PUBLIC_*` harus tersedia **saat build**.
3. `npm run deploy`. OpenNext belum sepenuhnya mendukung Windows; build di WSL atau
   di Cloudflare (terhubung ke GitHub) lebih aman.
4. Pasang penjadwalan pengingat (lihat bagian di atas).
5. Di Clerk, ganti ke instance produksi dan pasang OAuth client Google sendiri
   (di development Clerk memakai kredensial Google bersama).

Ukuran bundle Worker terakhir terukur sekitar 2,3 MB gzip (batas paket gratis 3 MB).

## Catatan pengembangan

- **Windows dengan drive C: penuh:** arahkan folder sementara ke D: agar npm/Node
  tidak menulis ke C:, mis. di PowerShell
  `$env:TEMP='D:\_tmp'; $env:TMP='D:\_tmp'; $env:npm_config_cache='D:\_npmcache'`.
- **Bahasa dan ejaan:** semua teks antarmuka berbahasa Indonesia baku dengan ejaan
  KBBI, mis. "kedaluwarsa" (bukan "kadaluarsa"). Nama kolom database dan properti
  kode lama (`tanggal_kadaluarsa`, `tanggalKadaluarsa`) sengaja tidak diubah agar
  migrasi dan data tetap utuh.
- **Tipografi dan jarak:** ukuran huruf aplikasi memakai empat token (`--t-label`,
  `--t-ket`, `--t-isi`, `--t-bacaan`), dan jarak halaman memakai `--jarak-kepala`,
  `--jarak-blok`, `--pad-kartu` di [`src/app/globals.css`](src/app/globals.css).
- **Data dimuat bertahap:** `store.tsx` menampilkan tiap bagian begitu tiba dan
  menandainya di `state.siap`; halaman memakai komponen `Memuat` agar data yang
  belum tiba tidak terbaca sebagai arsip kosong. Setelah aksi, hanya data yang
  berubah yang dimuat ulang.

## Yang belum dikerjakan

- Deploy ke Cloudflare Workers dan penjadwalan pengingat.
- Verifikasi domain di Resend agar bisa mengirim ke penerima mana pun.
- Kata sandi awal pengguna baru masih `arsiva123` bila Admin tidak mengisinya;
  sebaiknya diganti acak per pengguna.
- Uji menyelesaikan login Google dengan akun sungguhan.
- Verifikasi dua langkah dan audit log persisten.
- Tombol "Lupa kata sandi?" dan "Ingat perangkat ini" di halaman login belum berfungsi.
- `GET /api/documents` mengembalikan semua dokumen tanpa paginasi; pencarian dan
  penyaringan dilakukan di klien.
- Belum ada tes otomatis.
