# ARSIVA — Arsip Dokumen Legal

Aplikasi arsip dokumen legal bank: unggah hasil scan, kategorikan, pantau masa
berlaku/kadaluarsa, kelola jadwal mitra notaris, dan bagikan dokumen secara aman.

Implementasi dari PRD di [`reference/Arsiva.md`](reference/Arsiva.md).
Rancangan visual acuan: [`reference/Arsiva.html`](reference/Arsiva.html).

## Status

| Tahap | Lingkup | Status |
| --- | --- | --- |
| **Tahap 1** | Seluruh tampilan frontend (data contoh) | ✅ Selesai |
| **Tahap 2** | Backend: database, autentikasi, API, storage, cron | ✅ Selesai |
| **Tahap 2.5** | Email sungguhan (Resend), database cloud (Turso), storage cloud (Vercel Blob) | ✅ Selesai |
| Tahap 3 | Deploy ke Vercel | ⏳ Belum |

## Menjalankan

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Buka http://localhost:3000 → diarahkan ke `/login`.

**Akun demo** (kata sandi semua: `arsiva123`):

| Peran | Email |
| --- | --- |
| Admin | `admin.cop@bri.co.id` |
| Team Member | `teammember.cop@bri.co.id` |
| Pembaca | `agus.nugroho@bank.co.id` |

## Tech Stack

| Lapisan | Teknologi |
| --- | --- |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui |
| Ikon & notifikasi | Phosphor Icons, sonner |
| Backend | Next.js API Routes |
| Autentikasi | Better Auth (email + kata sandi, sesi 30 menit) |
| Database | SQLite via libSQL + Drizzle ORM — **Turso** (cloud) aktif sekarang |
| Storage berkas | Adapter — **Vercel Blob** (private) aktif sekarang, driver `local` untuk dev |
| Email/notifikasi | Adapter — driver `log` / `resend` / `smtp` + notifikasi in-app |
| Pengingat | Cron endpoint `/api/cron/reminders` |

## Keamanan

Peran (**Admin / Team Member / Pembaca**) berasal dari **sesi server Better Auth**,
tidak pernah dari klien. Tidak ada tombol ganti peran di aplikasi — untuk berganti
peran, keluar lalu masuk sebagai akun lain.

- Setiap API route memanggil `requireUser` / `requireWriter` / `requireAdmin`
  ([`src/lib/guard.ts`](src/lib/guard.ts)). Pengecekan `isAdmin` di React hanya
  untuk UX (menyembunyikan menu) — **bukan** penjaga keamanan.
- `src/proxy.ts` hanya mengalihkan pengunjung tanpa cookie sesi ke `/login`;
  otorisasi sebenarnya tetap di API route.
- Berkas scan **tidak** disajikan sebagai file statis. Aksesnya lewat
  `/api/documents/[id]/file` yang wajib bersesi, atau `/s/[token]/file` yang
  memvalidasi token, masa berlaku, dan status pencabutan.
- Token berbagi = 256-bit acak (`randomBytes(32)`), tidak bisa ditebak.
- Admin tidak dapat menurunkan peran, menonaktifkan, atau menghapus akunnya
  sendiri (mencegah terkunci dari sistem).
- Pengguna yang masih memiliki dokumen tidak bisa dihapus — hanya dinonaktifkan,
  supaya arsip tidak kehilangan jejak kepemilikan.

## Struktur

```
src/
  app/
    (app)/            # halaman ber-sidebar (dashboard, arsip, unggah, dst.)
    api/              # API routes — semua bergerbang guard.ts
      auth/[...all]/  #   Better Auth
      documents/ categories/ types/ purposes/
      notaris/ schedules/ shares/ users/ me/ notifications/
      cron/reminders/ #   pengingat kadaluarsa terjadwal
    s/[token]/        # halaman publik tautan berbagi (tanpa login)
    login/
  components/arsiva/  # store (klien API) + shell (sidebar/topbar)
  db/                 # schema Drizzle, koneksi, skrip seed
  lib/                # auth, guard, storage, notify, dto, helper domain
  proxy.ts            # pengalihan rute belum-login
drizzle/              # berkas migrasi SQL
data/arsiva.db        # database SQLite (diabaikan git)
storage/uploads/      # berkas hasil scan (diabaikan git)
```

## Perintah

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Jalankan server pengembangan |
| `npm run build` | Build produksi |
| `npm run db:generate` | Buat migrasi dari perubahan schema |
| `npm run db:migrate` | Terapkan migrasi |
| `npm run db:seed` | Isi data contoh (idempoten) |
| `npm run db:studio` | Buka Drizzle Studio |
| `npm run db:reset` | Hapus database, migrasi ulang, seed ulang |
| `npm run email:test -- you@mail.com` | Kirim satu email uji sesuai `EMAIL_DRIVER` |

## Pengingat kadaluarsa (cron)

Endpoint dilindungi `CRON_SECRET`. Jalankan manual:

```bash
curl -H "Authorization: Bearer arsiva-cron-dev-secret" http://localhost:3000/api/cron/reminders
```

Mengirim notifikasi ke pemilik dokumen yang masuk ambang pengingatnya
(`reminder_threshold_days`, per pengguna: 30/60/90 hari), lalu mencatat
`document_reminders.notified_at` agar **tidak mengirim ganda**.

Saat di-deploy ke Vercel, jadwalkan lewat `vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/reminders", "schedule": "0 1 * * *" }] }
```

## Konfigurasi (.env)

`.env` sudah dibuat untuk pengembangan lokal (dan diabaikan git). Yang penting:

- `DATABASE_URL` + `DATABASE_AUTH_TOKEN` — **Turso** (cloud) sekarang aktif.
  Bisa dikembalikan ke SQLite lokal (`file:./data/arsiva.db`, tanpa token)
  untuk pengembangan offline. Lihat bagian **Database** di bawah.
- `BETTER_AUTH_SECRET` — **wajib diganti** dengan string acak di produksi
- `STORAGE_DRIVER` + `BLOB_READ_WRITE_TOKEN` — **`blob`** (Vercel Blob,
  private) sekarang aktif. `local` tersedia untuk dev offline, tapi TIDAK
  bisa dipakai saat di-deploy (filesystem Vercel sementara).
- `EMAIL_DRIVER` — `log` (cetak ke console), `resend`, atau `smtp`. Lihat
  bagian **Email** di bawah.
- `CRON_SECRET` — token untuk endpoint cron

### Catatan lingkungan (mesin ini)

Drive **C: penuh (0 byte)**, proyek ada di **D:**. Agar npm/Node tidak menulis ke C::

```bash
TEMP=D:\_tmp TMP=D:\_tmp npm_config_cache=D:\_npmcache npm run build
```

`.claude/launch.json` sudah dikonfigurasi begitu. Sebaiknya kosongkan sebagian
ruang di C: untuk kesehatan mesin.

## Database

Driver database ditentukan otomatis dari bentuk `DATABASE_URL` (lihat
[`src/db/index.ts`](src/db/index.ts) dan [`drizzle.config.ts`](drizzle.config.ts)):

| `DATABASE_URL` diawali | Server | `DATABASE_AUTH_TOKEN` |
| --- | --- | --- |
| `file:` | SQLite lokal di komputer ini | tidak dipakai |
| `libsql:` | **Turso** (cloud) | wajib |

Client-nya sama persis (`@libsql/client`) untuk keduanya — tidak ada
penggantian pustaka, hanya penggantian nilai `.env`. Perintah `db:migrate` /
`db:seed` / `db:studio` otomatis menjangkau server mana pun yang aktif.

## Storage

Driver berkas ditentukan oleh `STORAGE_DRIVER` (lihat [`src/lib/storage.ts`](src/lib/storage.ts)):

| Driver | Kredensial | Kegunaan |
| --- | --- | --- |
| `local` | Tidak | Disk di komputer ini — untuk dev offline |
| `blob` | `BLOB_READ_WRITE_TOKEN` | **Vercel Blob, mode private** — aktif sekarang |

Store Blob dikonfigurasi **private**, bukan public: URL blob tidak bisa
diakses siapa pun tanpa token, sama seperti driver `local`. Kunci yang
disimpan di `documents.file_path` adalah *pathname* blob (bukan URL publik).
Aplikasi selalu menyalurkan berkas lewat endpoint sendiri
(`/api/documents/[id]/file`, `/s/[token]/file`) yang memverifikasi
sesi/token dulu, baru mengambil isi blob di server — URL blob mentah tidak
pernah dikirim ke browser.

## Email

Tiga driver tersedia di [`src/lib/notify.ts`](src/lib/notify.ts), dipilih lewat
`EMAIL_DRIVER` di `.env`:

| Driver | Perlu kredensial | Kegunaan |
| --- | --- | --- |
| `log` | Tidak | Email dicetak ke console server — untuk pengembangan |
| `resend` | `RESEND_API_KEY` | Kirim sungguhan lewat Resend HTTP API |
| `smtp` | `SMTP_HOST/USER/PASS` | Kirim sungguhan lewat SMTP (Gmail, Mailtrap) |

Uji konfigurasi tanpa membuka aplikasi:

```bash
npm run email:test -- nama@domain.com
```

**Batas Resend tanpa domain terverifikasi:** hanya bisa mengirim ke alamat email
pemilik akun Resend, dan `EMAIL_FROM` harus `onboarding@resend.dev`. Untuk
mengirim ke notaris/rekanan sungguhan, verifikasi domain di
resend.com/domains lalu ubah `EMAIL_FROM` ke alamat domain tersebut.

**Kegagalan email tidak membatalkan aksi.** Bila pengiriman gagal, tautan berbagi
dan pengingat tetap tersimpan; UI memberi tahu agar tautannya disalin manual.
Ini disengaja supaya masalah kredensial tidak sampai menghilangkan data.

> Catatan: tautan berisi `NEXT_PUBLIC_APP_URL`. Selama masih `localhost:3000`,
> penerima di luar komputer ini tidak akan bisa membukanya — ganti ke domain
> publik setelah deploy.

## Tahap berikutnya

- **Deploy ke Vercel.** Database (Turso) dan storage (Vercel Blob) sudah siap
  menampung produksi — tinggal push kode dan salin variabel `.env` ke
  pengaturan Environment Variables Vercel (jangan commit `.env` itu sendiri).
- Verifikasi domain di Resend agar bisa mengirim ke penerima mana pun.
- Form "Ubah informasi dokumen" dan "Ubah kategori" (API `PATCH` sudah tersedia).
- Verifikasi dua langkah & audit log persisten.
