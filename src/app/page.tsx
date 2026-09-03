import Link from "next/link";
import { Geist } from "next/font/google";
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

// Display face khusus landing page. Aplikasi tetap memakai Inter agar sistem
// desain produk (Nocturne) tidak berubah.
const geist = Geist({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata = {
  title: "ARSIVA - Arsip Dokumen Legal Bank",
  description:
    "Satu arsip digital untuk seluruh dokumen legal bank: unggah hasil scan, kategorikan, pantau masa berlaku, dan bagikan secara aman.",
};

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

/* ───────────────────────── Konten ───────────────────────── */

const FITUR = [
  { icon: Folders, judul: "Arsip terpusat", desk: "PKS, akta notaris, dan sertifikat agunan tersimpan di satu tempat dan mudah ditelusuri.", kelas: "md:col-span-7", sorot: true },
  { icon: UploadSimple, judul: "Unggah dan kategorikan", desk: "Simpan hasil scan lalu lengkapi jenis, tujuan, kategori, dan masa berlaku dalam satu langkah.", kelas: "md:col-span-5", sorot: false },
  { icon: BellRinging, judul: "Pengingat kadaluarsa", desk: "Notifikasi otomatis sebelum masa berlaku habis, pada ambang 30, 60, atau 90 hari.", kelas: "md:col-span-5", sorot: false },
  { icon: ShareNetwork, judul: "Berbagi berbatas waktu", desk: "Tautan aman untuk notaris atau rekanan, dan aksesnya dapat dicabut kapan pun.", kelas: "md:col-span-7", sorot: true },
  { icon: CalendarDots, judul: "Jadwal notaris", desk: "Mitra notaris beserta agenda kerja samanya tercatat dalam satu tempat.", kelas: "md:col-span-6", sorot: false },
  { icon: ShieldCheck, judul: "Hak akses berperan", desk: "Admin, Team Member, dan Pembaca dengan wewenang berbeda yang ditegakkan di sisi server.", kelas: "md:col-span-6", sorot: false },
];

// Status nyata yang diturunkan aplikasi dari tanggal kadaluarsa tiap dokumen.
// Titik warna di sini menyampaikan keadaan semantik, bukan hiasan.
const SIKLUS = [
  { label: "Masa berlaku aman", ket: "di luar ambang", warna: "var(--color-accent-500)" },
  { label: "Segera kadaluarsa", ket: "dalam ambang", warna: "var(--color-accent-2-500)" },
  { label: "Sudah kadaluarsa", ket: "lewat tanggal", warna: "var(--color-danger)" },
  { label: "Sudah diproses", ket: "ditindaklanjuti", warna: "var(--color-ok)" },
];

const LANGKAH = [
  { n: "01", judul: "Unggah", desk: "Pindai dokumen legal dan simpan berkasnya ke arsip." },
  { n: "02", judul: "Lengkapi", desk: "Pilih kategori, jenis, tujuan, dan tanggal kadaluarsa." },
  { n: "03", judul: "Pantau", desk: "Terima pengingat, tandai selesai, atau bagikan dengan aman." },
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
    <div
      className={geist.className}
      style={{
        // Aturan global h1..h6 memakai var(--font-heading); override di sini
        // agar Geist benar-benar terpakai tanpa mengubah sistem desain aplikasi.
        ["--font-heading" as string]: geist.style.fontFamily,
        ["--font-body" as string]: geist.style.fontFamily,
        background: "var(--color-bg)", color: "var(--color-text)", minHeight: "100dvh",
      }}
    >
      {/* Navigasi: satu baris, 66px */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 10,
          display: "flex", alignItems: "center", gap: 12,
          height: 66, padding: "0 24px",
          borderBottom: "1px solid var(--color-divider)",
          background: "color-mix(in srgb, var(--color-bg) 90%, transparent)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
          <div style={{ width: 32, height: 32, flex: "none", borderRadius: 8, background: "var(--color-section)", boxShadow: "inset 0 0 0 1px var(--color-accent-700)", display: "grid", placeItems: "center", color: "var(--color-accent-300)" }}>
            <Vault size={18} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}>ARSIVA</span>
        </div>
        <nav className="hidden md:flex" style={{ marginLeft: 36, gap: 24, alignItems: "center", fontSize: 14 }}>
          <a href="#fitur" style={{ color: muted(70), textDecoration: "none" }}>Fitur</a>
          <a href="#alur" style={{ color: muted(70), textDecoration: "none" }}>Cara kerja</a>
          <a href="#keamanan" style={{ color: muted(70), textDecoration: "none" }}>Keamanan</a>
        </nav>
        <Link href="/login" className="btn btn-primary" style={{ marginLeft: "auto", textDecoration: "none", whiteSpace: "nowrap", borderRadius: 8 }}>
          <SignIn size={16} />
          Masuk
        </Link>
      </header>

      {/* HERO - split asimetris 7/5, bukan satu kolom terpusat */}
      <section style={{ borderBottom: "1px solid var(--color-divider)" }}>
        <div
          className="grid grid-cols-1 lg:grid-cols-12"
          style={{ maxWidth: 1240, margin: "0 auto", minHeight: 520 }}
        >
          {/* Kolom teks */}
          <div
            className="lg:col-span-7"
            style={{ padding: "88px 24px 84px", display: "flex", flexDirection: "column", justifyContent: "center" }}
          >
            <div style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 999, fontSize: 11.5, letterSpacing: "0.02em", color: "var(--color-accent-100)", background: "var(--color-accent-800)", boxShadow: "inset 0 0 0 1px var(--color-accent-600)", marginBottom: 26 }}>
              <ShieldCheck size={13} />
              Credit Operations Department, RO BRI Pekanbaru
            </div>

            <h1
              style={{
                fontSize: "clamp(36px, 4.4vw, 54px)",
                lineHeight: 1.03,
                letterSpacing: "-0.035em",
                fontWeight: 600,
                margin: "0 0 20px",
                maxWidth: "17ch",
              }}
            >
              Arsip legal yang tidak kadaluarsa diam-diam.
            </h1>

            <p style={{ fontSize: 16.5, lineHeight: 1.6, color: muted(66), margin: "0 0 32px", maxWidth: 460 }}>
              Simpan, kategorikan, dan pantau masa berlaku dokumen legal bank dalam satu tempat.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/login" className="btn btn-primary" style={{ textDecoration: "none", minHeight: 46, paddingInline: 22, borderRadius: 8, whiteSpace: "nowrap" }}>
                <SignIn size={17} />
                Masuk
              </Link>
              <a href="#fitur" className="btn btn-secondary" style={{ textDecoration: "none", minHeight: 46, paddingInline: 22, borderRadius: 8, whiteSpace: "nowrap" }}>
                Lihat kemampuannya
                <ArrowRight size={16} />
              </a>
            </div>
          </div>

          {/* Panel visual - status nyata yang dipantau, bukan pratinjau produk palsu */}
          <div
            className="hidden lg:block lg:col-span-5"
            style={{
              position: "relative", overflow: "hidden",
              borderLeft: "1px solid var(--color-divider)",
              background: "linear-gradient(150deg, var(--color-section) 0%, var(--color-bg) 72%)",
            }}
          >
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 48px", gap: 2 }}>
              <div style={{ fontSize: 12, color: muted(42), marginBottom: 18 }}>
                Status yang dipantau otomatis
              </div>
              {SIKLUS.map((t, i) => (
                <div
                  key={t.label}
                  style={{
                    display: "flex", alignItems: "center", gap: 13,
                    padding: "15px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--color-divider)",
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", flex: "none", background: t.warna }} />
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{t.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12.5, color: muted(46) }}>{t.ket}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* KEMAMPUAN - bento asimetris 7/5, 5/7, 6/6. Enam item, enam sel. */}
      <section id="fitur" style={{ maxWidth: 1240, margin: "0 auto", padding: "82px 24px" }}>
        <h2 style={{ fontSize: "clamp(26px, 3vw, 34px)", fontWeight: 600, letterSpacing: "-0.03em", margin: "0 0 40px", maxWidth: 620 }}>
          Semua yang dibutuhkan tim legal, tanpa berpindah aplikasi.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12" style={{ gap: 14 }}>
          {FITUR.map((f) => (
            <div
              key={f.judul}
              className={f.kelas}
              style={{
                position: "relative", overflow: "hidden",
                padding: "26px 24px", borderRadius: 12,
                background: f.sorot
                  ? "linear-gradient(140deg, var(--color-section) 0%, var(--color-surface) 70%)"
                  : "var(--color-surface)",
                boxShadow: "inset 0 0 0 1px var(--color-divider)",
                minHeight: 158,
              }}
            >
              <div style={{ position: "relative" }}>
                <f.icon size={20} style={{ color: "var(--color-accent-300)" }} />
                <h3 style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.015em", margin: "14px 0 6px" }}>{f.judul}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: muted(58), margin: 0, maxWidth: "46ch" }}>{f.desk}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CARA KERJA - pita mendatar bernomor, keluarga tata letak berbeda */}
      <section id="alur" style={{ background: "var(--color-surface)", borderBlock: "1px solid var(--color-divider)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "70px 24px" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 0 }}>
            {LANGKAH.map((s, i) => (
              <div
                key={s.n}
                style={{
                  padding: "4px 28px 4px 0",
                  borderLeft: i === 0 ? "none" : "1px solid var(--color-divider)",
                  paddingLeft: i === 0 ? 0 : 28,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", color: "var(--color-accent-500)", marginBottom: 14 }}>{s.n}</div>
                <h3 style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 7px" }}>{s.judul}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: muted(58), margin: 0 }}>{s.desk}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KEAMANAN - pita bergambar di kiri, daftar baris di kanan */}
      <section id="keamanan" style={{ maxWidth: 1240, margin: "0 auto", padding: "82px 24px" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: 40 }}>
          <div className="lg:col-span-5">
            <div
              style={{
                position: "relative", overflow: "hidden", borderRadius: 12,
                height: "100%",
                background: "linear-gradient(150deg, var(--color-section) 0%, var(--color-surface) 74%)",
                boxShadow: "inset 0 0 0 1px var(--color-divider)",
              }}
            >
              <div style={{ position: "relative", padding: "30px 28px" }}>
                <h2 style={{ fontSize: "clamp(24px, 2.6vw, 31px)", fontWeight: 600, letterSpacing: "-0.03em", margin: "0 0 10px" }}>
                  Dokumen sensitif, dijaga sungguhan.
                </h2>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: muted(64), margin: 0, maxWidth: "34ch" }}>
                  Wewenang ditegakkan di server, sesi dibatasi, dan setiap aktivitas penting dicatat.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {KEAMANAN.map((k, i) => (
              <div
                key={k.judul}
                style={{
                  display: "flex", gap: 16, alignItems: "flex-start",
                  padding: "18px 0",
                  borderTop: i === 0 ? "none" : "1px solid var(--color-divider)",
                }}
              >
                <k.icon size={19} style={{ flex: "none", marginTop: 2, color: "var(--color-accent-400)" }} />
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: "-0.015em", margin: "0 0 4px" }}>{k.judul}</h3>
                  <p style={{ fontSize: 13.5, lineHeight: 1.55, color: muted(56), margin: 0 }}>{k.desk}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PENUTUP - pita penuh, judul kiri dan aksi rapat ke tepi kanan */}
      <section style={{ borderTop: "1px solid var(--color-divider)", background: "linear-gradient(165deg, var(--color-section) 0%, var(--color-bg) 82%)" }}>
        <div
          style={{
            maxWidth: 1240, margin: "0 auto", padding: "92px 24px",
            display: "flex", flexWrap: "wrap", gap: 36,
            alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                fontSize: "clamp(28px, 3.4vw, 42px)",
                fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.08,
                margin: "0 0 12px", maxWidth: "32ch",
              }}
            >
              Siap merapikan arsip legal Anda?
            </h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: muted(58), margin: 0, maxWidth: "46ch" }}>
              Belum punya akun? Hubungi Admin unit kerja Anda untuk didaftarkan.
            </p>
          </div>

          <Link
            href="/login"
            className="btn btn-primary"
            style={{
              textDecoration: "none", flex: "none",
              minHeight: 54, paddingInline: 34, borderRadius: 8,
              fontSize: 15.5, whiteSpace: "nowrap",
            }}
          >
            <SignIn size={18} />
            Masuk
          </Link>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--color-divider)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 9, alignItems: "center", fontSize: 13, color: muted(66) }}>
            <Tag size={14} style={{ color: "var(--color-accent-400)" }} />
            <strong style={{ color: "var(--color-text)", fontWeight: 600 }}>ARSIVA</strong>
            <span>Arsip Dokumen Legal</span>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 12, color: muted(44) }}>
            Credit Operations Department, RO BRI Pekanbaru
          </div>
        </div>
      </footer>
    </div>
  );
}
