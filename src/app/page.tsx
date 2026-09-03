import Link from "next/link";
import {
  Vault,
  SignIn,
  ArrowRight,
  Folders,
  UploadSimple,
  BellRinging,
  ShareNetwork,
  CalendarDots,
  ShieldCheck,
  LockKey,
  ClockCountdown,
  FileText,
  Tag,
} from "@phosphor-icons/react/dist/ssr";

export const metadata = {
  title: "ARSIVA - Arsip Dokumen Legal Bank",
  description:
    "Satu arsip digital untuk seluruh dokumen legal bank: unggah hasil scan, kategorikan, pantau masa berlaku, dan bagikan secara aman.",
};

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

/* ───────────────────────── Konten ───────────────────────── */

const FITUR = [
  { icon: Folders, judul: "Arsip terpusat", desk: "PKS, akta notaris, dan sertifikat agunan tersimpan di satu tempat dan mudah ditelusuri." },
  { icon: UploadSimple, judul: "Unggah dan kategorikan", desk: "Simpan hasil scan lalu lengkapi jenis, tujuan, kategori, dan masa berlaku dalam satu langkah." },
  { icon: BellRinging, judul: "Pengingat kadaluarsa", desk: "Notifikasi otomatis sebelum masa berlaku habis, dengan ambang 30, 60, atau 90 hari." },
  { icon: ShareNetwork, judul: "Berbagi berbatas waktu", desk: "Tautan aman untuk notaris atau rekanan, dan aksesnya dapat dicabut kapan pun." },
  { icon: CalendarDots, judul: "Jadwal notaris", desk: "Mitra notaris beserta agenda kerja samanya tercatat dalam satu tempat." },
  { icon: ShieldCheck, judul: "Hak akses berperan", desk: "Admin, Team Member, dan Pembaca dengan wewenang berbeda yang ditegakkan di sisi server." },
];

const LANGKAH = [
  { n: "1", judul: "Unggah", desk: "Pindai dokumen legal dan simpan berkasnya ke arsip." },
  { n: "2", judul: "Lengkapi", desk: "Pilih kategori, jenis, tujuan, dan tanggal kadaluarsa." },
  { n: "3", judul: "Pantau", desk: "Terima pengingat, tandai selesai, atau bagikan dengan aman." },
];

const KEAMANAN = [
  { icon: LockKey, judul: "Wewenang diperiksa di server", desk: "Peran diambil dari sesi login, bukan dari sisi klien." },
  { icon: ClockCountdown, judul: "Sesi berbatas waktu", desk: "Sesi berakhir otomatis setelah 30 menit tanpa aktivitas." },
  { icon: FileText, judul: "Berkas tidak terbuka bebas", desk: "Setiap berkas hanya tersalur lewat permintaan yang bersesi." },
  { icon: ShareNetwork, judul: "Tautan bertoken acak", desk: "Token berbagi tidak dapat ditebak dan mati saat masa berlaku habis." },
];

/* ───────────────────────── Halaman ───────────────────────── */

export default function LandingPage() {
  return (
    <div style={{ background: "var(--color-bg)", color: "var(--color-text)", minHeight: "100dvh" }}>
      {/* Navigasi: satu baris, tinggi < 80px */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 10,
          display: "flex", alignItems: "center", gap: 12,
          height: 66, padding: "0 20px",
          borderBottom: "1px solid var(--color-divider)",
          background: "color-mix(in srgb, var(--color-bg) 90%, transparent)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
          <div style={{ width: 34, height: 34, flex: "none", borderRadius: "var(--radius-md)", background: "var(--color-section)", boxShadow: "inset 0 0 0 1px var(--color-accent-700)", display: "grid", placeItems: "center", color: "var(--color-accent-300)" }}>
            <Vault size={19} />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 15, letterSpacing: "-0.01em" }}>ARSIVA</div>
            <div style={{ fontSize: 10, letterSpacing: "0.09em", textTransform: "uppercase", color: muted(45) }}>Arsip Dokumen Legal</div>
          </div>
        </div>
        <nav className="hidden md:flex" style={{ marginLeft: 32, gap: 22, alignItems: "center", fontSize: 14 }}>
          <a href="#fitur" style={{ color: muted(72), textDecoration: "none" }}>Fitur</a>
          <a href="#alur" style={{ color: muted(72), textDecoration: "none" }}>Cara kerja</a>
          <a href="#keamanan" style={{ color: muted(72), textDecoration: "none" }}>Keamanan</a>
        </nav>
        <Link href="/login" className="btn btn-primary" style={{ marginLeft: "auto", textDecoration: "none", whiteSpace: "nowrap" }}>
          <SignIn size={16} />
          Masuk
        </Link>
      </header>

      {/* Hero: satu kolom, maksimal 4 elemen teks, tanpa pratinjau produk palsu */}
      <section style={{ background: "linear-gradient(170deg, var(--color-section) 0%, var(--color-bg) 62%)" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "84px 20px 78px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 999, fontSize: 12, color: "var(--color-accent-100)", background: "var(--color-accent-800)", boxShadow: "inset 0 0 0 1px var(--color-accent-600)", marginBottom: 22 }}>
            <ShieldCheck size={14} />
            Credit Operations Department, RO BRI Pekanbaru
          </div>

          <h1 style={{ fontSize: 44, lineHeight: 1.1, margin: "0 0 18px", letterSpacing: "-0.022em", maxWidth: 660 }}>
            Satu arsip digital untuk dokumen legal bank.
          </h1>

          <p style={{ fontSize: 16.5, lineHeight: 1.6, color: muted(68), margin: "0 0 30px", maxWidth: 560 }}>
            Simpan, kategorikan, dan pantau masa berlaku dokumen legal dalam satu tempat yang aman.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/login" className="btn btn-primary" style={{ textDecoration: "none", minHeight: 44, paddingInline: 22, whiteSpace: "nowrap" }}>
              <SignIn size={17} />
              Masuk ke ARSIVA
            </Link>
            <a href="#fitur" className="btn btn-secondary" style={{ textDecoration: "none", minHeight: 44, paddingInline: 22, whiteSpace: "nowrap" }}>
              Lihat kemampuannya
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Fitur: daftar dua kolom berjarak lega, bukan kartu seragam */}
      <section id="fitur" style={{ maxWidth: 1000, margin: "0 auto", padding: "78px 20px" }}>
        <h2 style={{ fontSize: 30, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Kemampuan</h2>
        <p style={{ fontSize: 15, color: muted(62), margin: "0 0 44px", maxWidth: 520 }}>
          Dari mengunggah sampai menindaklanjuti, dalam satu alur kerja yang rapi.
        </p>

        <div className="grid gap-x-14 gap-y-11 grid-cols-1 md:grid-cols-2">
          {FITUR.map((f) => (
            <div key={f.judul} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, flex: "none", marginTop: 2, borderRadius: "var(--radius-md)", background: "var(--color-surface-2)", color: "var(--color-accent-300)", display: "grid", placeItems: "center", boxShadow: "inset 0 0 0 1px var(--color-divider)" }}>
                <f.icon size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: 16, margin: "0 0 5px" }}>{f.judul}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: muted(60), margin: 0 }}>{f.desk}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cara kerja: urutan mendatar bernomor, keluarga tata letak berbeda */}
      <section id="alur" style={{ background: "var(--color-surface)", borderBlock: "1px solid var(--color-divider)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "70px 20px" }}>
          <h2 style={{ fontSize: 30, margin: "0 0 40px", letterSpacing: "-0.02em" }}>Cara kerja</h2>
          <div className="grid gap-10 grid-cols-1 sm:grid-cols-3">
            {LANGKAH.map((s) => (
              <div key={s.n}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: 15, color: "var(--color-accent-400)" }}>{s.n}</span>
                  <span style={{ height: 1, flex: 1, background: "var(--color-divider)" }} />
                </div>
                <h3 style={{ fontSize: 17, margin: "0 0 6px" }}>{s.judul}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: muted(60), margin: 0 }}>{s.desk}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Keamanan: judul kiri + daftar baris bergaris, keluarga tata letak berbeda lagi */}
      <section id="keamanan" style={{ maxWidth: 1000, margin: "0 auto", padding: "78px 20px" }}>
        <div className="grid gap-10 grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <h2 style={{ fontSize: 30, margin: "0 0 12px", letterSpacing: "-0.02em" }}>Keamanan</h2>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: muted(62), margin: 0, maxWidth: 380 }}>
              Dokumen legal bersifat sensitif. Wewenang ditegakkan di sisi server, sesi dibatasi, dan setiap aktivitas penting dicatat.
            </p>
          </div>

          <div>
            {KEAMANAN.map((k, i) => (
              <div
                key={k.judul}
                style={{
                  display: "flex", gap: 14, alignItems: "flex-start",
                  padding: "16px 0",
                  borderTop: i === 0 ? "none" : "1px solid var(--color-divider)",
                }}
              >
                <k.icon size={19} style={{ flex: "none", marginTop: 2, color: "var(--color-accent-400)" }} />
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: 15, margin: "0 0 4px" }}>{k.judul}</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.55, color: muted(58), margin: 0 }}>{k.desk}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Penutup: panel terpusat */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px 84px" }}>
        <div
          style={{
            padding: "48px 28px", textAlign: "center", borderRadius: "var(--radius-lg)",
            background: "linear-gradient(170deg, var(--color-section) 0%, var(--color-surface) 78%)",
            boxShadow: "inset 0 0 0 1px var(--color-accent-800)",
          }}
        >
          <h2 style={{ fontSize: 27, margin: "0 0 10px", letterSpacing: "-0.02em" }}>Siap merapikan arsip legal Anda?</h2>
          <p style={{ fontSize: 15, color: muted(66), margin: "0 auto 22px", maxWidth: 430 }}>
            Masuk dengan akun pegawai untuk mulai mengelola dokumen dan pengingat.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ textDecoration: "none", minHeight: 46, paddingInline: 24, whiteSpace: "nowrap" }}>
            <SignIn size={17} />
            Masuk ke ARSIVA
          </Link>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--color-divider)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "26px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 28, height: 28, flex: "none", borderRadius: "var(--radius-sm)", background: "var(--color-section)", color: "var(--color-accent-300)", display: "grid", placeItems: "center" }}>
              <Tag size={15} />
            </div>
            <div style={{ fontSize: 13, color: muted(70) }}>
              <strong style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)", fontWeight: 500 }}>ARSIVA</strong>, Arsip Dokumen Legal
            </div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 12, color: muted(45) }}>
            Credit Operations Department, RO BRI Pekanbaru
          </div>
        </div>
      </footer>
    </div>
  );
}
