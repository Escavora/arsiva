import type { ReactNode } from "react";
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
  Check,
  LinkSimple,
} from "@phosphor-icons/react/dist/ssr";

// Display face khusus landing page. Aplikasi tetap memakai Inter agar sistem
// desain produk (Nocturne) tidak berubah.
const geist = Geist({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata = {
  title: "ARSIVA - Arsip Dokumen Legal Bank",
  description:
    "Satu arsip digital untuk seluruh dokumen legal bank: unggah hasil scan, kategorikan, pantau masa berlaku, dan bagikan secara aman.",
};

// Teks kecil (<14px) memakai minimal 58 agar kontrasnya ≥4.5:1 (WCAG AA) di semua latar halaman ini.
const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

/* ───────────────────────── Konten ───────────────────────── */

type Detail = "kategori" | "ambang" | "tautan";

const FITUR: { icon: typeof Folders; judul: string; desk: string; kelas: string; sorot: boolean; detail?: Detail }[] = [
  { icon: Folders, judul: "Arsip terpusat", desk: "PKS, akta notaris, dan sertifikat agunan tersimpan di satu tempat dan mudah ditelusuri.", kelas: "md:col-span-7", sorot: true, detail: "kategori" },
  { icon: UploadSimple, judul: "Unggah dan kategorikan", desk: "Simpan hasil scan lalu lengkapi jenis, tujuan, kategori, dan masa berlaku dalam satu langkah.", kelas: "md:col-span-5", sorot: false },
  { icon: BellRinging, judul: "Pengingat kadaluarsa", desk: "Notifikasi otomatis sebelum masa berlaku habis, pada ambang yang dipilih tiap pengguna.", kelas: "md:col-span-5", sorot: false, detail: "ambang" },
  { icon: ShareNetwork, judul: "Berbagi berbatas waktu", desk: "Tautan aman untuk notaris atau rekanan, dan aksesnya dapat dicabut kapan pun.", kelas: "md:col-span-7", sorot: true, detail: "tautan" },
  { icon: CalendarDots, judul: "Jadwal notaris", desk: "Mitra notaris beserta agenda kerja samanya tercatat dalam satu tempat.", kelas: "md:col-span-6", sorot: false },
  { icon: ShieldCheck, judul: "Hak akses berperan", desk: "Admin, Team Member, dan Pembaca dengan wewenang berbeda yang ditegakkan di sisi server.", kelas: "md:col-span-6", sorot: false },
];

// Kategori bawaan aplikasi (seedCats di src/lib/arsiva.ts).
const KATEGORI_CONTOH = ["Perjanjian Kerja Sama", "Akta Notaris", "Sertifikat Agunan", "Surat Kuasa"];

// Status nyata yang diturunkan aplikasi dari tanggal kadaluarsa tiap dokumen.
// Titik warna di sini menyampaikan keadaan semantik, bukan hiasan.
const SIKLUS = {
  aman: { label: "Masa berlaku aman", warna: "var(--color-accent-500)" },
  segera: { label: "Segera kadaluarsa", warna: "var(--color-accent-2-500)" },
  lewat: { label: "Sudah kadaluarsa", warna: "var(--color-danger)" },
  diproses: { label: "Sudah diproses", warna: "var(--color-ok)" },
};

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

const ANGKA_KEAMANAN = [
  { nilai: "30 mnt", ket: "batas sesi tanpa aktivitas" },
  { nilai: "256-bit", ket: "token acak tiap tautan berbagi" },
  { nilai: "3 peran", ket: "Admin, Team Member, Pembaca" },
];

/* ───────────────────────── Potongan kecil ───────────────────────── */

function MerekIkon({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size, height: size, flex: "none", borderRadius: size / 4,
        background: "var(--color-section)", boxShadow: "inset 0 0 0 1px var(--color-accent-700)",
        display: "grid", placeItems: "center", color: "var(--color-accent-300)",
      }}
    >
      <Vault size={Math.round(size * 0.56)} />
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 10px", borderRadius: 999, fontSize: 12, whiteSpace: "nowrap",
        color: muted(80), background: muted(6), boxShadow: "inset 0 0 0 1px var(--color-divider)",
      }}
    >
      {children}
    </span>
  );
}

/** Satu baris detail konkret di kartu fitur, memakai nilai yang memang ada di aplikasi. */
function DetailFitur({ jenis }: { jenis: Detail }) {
  if (jenis === "kategori") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {KATEGORI_CONTOH.map((k) => <Chip key={k}>{k}</Chip>)}
      </div>
    );
  }
  if (jenis === "ambang") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: muted(62), marginRight: 2 }}>Ambang</span>
        {["30 hari", "60 hari", "90 hari"].map((h) => <Chip key={h}>{h}</Chip>)}
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        padding: "9px 12px", borderRadius: 8, fontSize: 12.5,
        background: "color-mix(in srgb, var(--color-bg) 55%, transparent)",
        boxShadow: "inset 0 0 0 1px var(--color-divider)",
      }}
    >
      <LinkSimple size={15} style={{ color: "var(--color-accent-300)", flex: "none" }} />
      <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: muted(80) }}>…/s/••••••••</span>
      <span style={{ color: muted(62) }}>berlaku 7 hari</span>
      <span style={{ marginLeft: "auto", color: "var(--color-danger)", fontWeight: 500 }}>Cabut</span>
    </div>
  );
}

/** Tahap pada kartu hero. "selesai" = sudah dilewati, "kini" = posisi dokumen sekarang. */
function Tahap({ warna, label, ket, keadaan }: { warna: string; label: string; ket: string; keadaan: "selesai" | "kini" }) {
  const kini = keadaan === "kini";
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 12px", borderRadius: 8,
        background: kini ? "color-mix(in srgb, var(--color-accent-2-500) 12%, transparent)" : "transparent",
        boxShadow: kini ? "inset 0 0 0 1px color-mix(in srgb, var(--color-accent-2-500) 45%, transparent)" : "none",
      }}
    >
      <span
        style={{
          width: 18, height: 18, borderRadius: "50%", flex: "none", display: "grid", placeItems: "center",
          background: kini ? warna : "transparent", boxShadow: `inset 0 0 0 2px ${warna}`, color: warna,
        }}
      >
        {!kini && <Check size={10} weight="bold" />}
      </span>
      <span style={{ fontSize: 14, fontWeight: kini ? 600 : 500, color: kini ? "var(--color-text)" : muted(78) }}>{label}</span>
      <span style={{ marginLeft: "auto", fontSize: 12, color: kini ? "var(--color-accent-2-300)" : muted(62), whiteSpace: "nowrap" }}>{ket}</span>
    </div>
  );
}

/**
 * Ilustrasi satu dokumen melewati siklus status di aplikasi. Bukan data asli:
 * diberi label "Contoh" dan hanya memakai perilaku yang memang ada (status,
 * ambang pengingat, notifikasi ke pemilik).
 */
function KartuDokumen() {
  return (
    <div
      style={{
        width: "100%", maxWidth: 420, borderRadius: 14, padding: 20,
        background: "var(--color-surface)", boxShadow: "var(--shadow-lg)",
        display: "flex", flexDirection: "column", gap: 16,
      }}
    >
      <div style={{ fontSize: 12, color: muted(62) }}>Contoh alur satu dokumen</div>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            width: 38, height: 38, flex: "none", borderRadius: 8, display: "grid", placeItems: "center",
            background: "var(--color-accent-900)", color: "var(--color-accent-300)",
            boxShadow: "inset 0 0 0 1px var(--color-accent-800)",
          }}
        >
          <FileText size={19} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.35 }}>
            Akta Pemberian Hak Tanggungan
          </div>
          <div style={{ fontSize: 12.5, color: muted(66), marginTop: 3 }}>
            Akta Notaris · berakhir 60 hari lagi
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Tahap warna={SIKLUS.aman.warna} label={SIKLUS.aman.label} ket="di luar ambang" keadaan="selesai" />
        <Tahap warna={SIKLUS.segera.warna} label={SIKLUS.segera.label} ket="ambang 60 hari" keadaan="kini" />
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px 0", fontSize: 12, color: muted(62) }}>
          lalu salah satu:
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "0 12px" }}>
          {[SIKLUS.diproses, SIKLUS.lewat].map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: muted(78) }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", flex: "none", background: s.warna }} />
              {s.label}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "10px 12px", borderRadius: 8, fontSize: 12.5,
          color: "var(--color-accent-2-200)",
          background: "color-mix(in srgb, var(--color-accent-2-500) 10%, transparent)",
        }}
      >
        <BellRinging size={16} style={{ flex: "none", color: "var(--color-accent-2-400)" }} />
        Pengingat H-60 terkirim ke pemilik dokumen
      </div>
    </div>
  );
}

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
          <MerekIkon />
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}>ARSIVA</span>
        </div>
        <nav className="hidden md:flex" style={{ marginLeft: 36, gap: 24, alignItems: "center", fontSize: 14 }}>
          <a href="#fitur" style={{ color: muted(70), textDecoration: "none" }}>Fitur</a>
          <a href="#alur" style={{ color: muted(70), textDecoration: "none" }}>Cara kerja</a>
          <a href="#keamanan" style={{ color: muted(70), textDecoration: "none" }}>Keamanan</a>
        </nav>
        <Link href="/login" className="btn btn-primary btn-solid" style={{ marginLeft: "auto", textDecoration: "none", whiteSpace: "nowrap", borderRadius: 8 }}>
          <SignIn size={16} />
          Masuk
        </Link>
      </header>

      {/* HERO - split asimetris 7/5; di bawah lg kartu turun ke bawah teks */}
      <section style={{ borderBottom: "1px solid var(--color-divider)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12" style={{ maxWidth: 1240, margin: "0 auto", minHeight: 520 }}>
          {/* Kolom teks */}
          <div
            className="lg:col-span-7 px-6 pt-16 pb-12 lg:pt-[88px] lg:pb-[84px]"
            style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}
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
              <Link href="/login" className="btn btn-primary btn-solid" style={{ textDecoration: "none", minHeight: 46, paddingInline: 22, borderRadius: 8, whiteSpace: "nowrap" }}>
                <SignIn size={17} />
                Masuk
              </Link>
              <a href="#fitur" className="btn btn-secondary" style={{ textDecoration: "none", minHeight: 46, paddingInline: 22, borderRadius: 8, whiteSpace: "nowrap" }}>
                Lihat kemampuannya
                <ArrowRight size={16} />
              </a>
            </div>
          </div>

          {/* Panel visual - ilustrasi berlabel, bukan pratinjau produk palsu.
              Cahaya radial, bukan gradien kolom, agar tidak ada tepi keras di batas kontainer. */}
          <div
            className="lg:col-span-5 px-6 pt-4 pb-16 lg:px-10 lg:py-12"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "radial-gradient(closest-side, color-mix(in srgb, var(--color-section-glow) 55%, transparent), transparent)",
            }}
          >
            <KartuDokumen />
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
                display: "flex", flexDirection: "column", gap: 18,
                padding: "26px 24px", borderRadius: 12,
                background: f.sorot
                  ? "linear-gradient(140deg, color-mix(in srgb, var(--color-section) 85%, var(--color-section-glow)) 0%, var(--color-surface) 75%)"
                  : "var(--color-surface)",
                boxShadow: "inset 0 0 0 1px var(--color-divider)",
                minHeight: 158,
              }}
            >
              <div>
                <f.icon size={20} style={{ color: "var(--color-accent-300)" }} />
                <h3 style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.015em", margin: "14px 0 6px" }}>{f.judul}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: muted(62), margin: 0, maxWidth: "46ch" }}>{f.desk}</p>
              </div>
              {f.detail && (
                <div style={{ marginTop: "auto" }}>
                  <DetailFitur jenis={f.detail} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CARA KERJA - pita bernomor; di HP bertumpuk dengan garis atas, mulai sm berjajar dengan garis kiri */}
      <section id="alur" style={{ background: "var(--color-surface)", borderBlock: "1px solid var(--color-divider)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "70px 24px" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3">
            {LANGKAH.map((s) => (
              <div
                key={s.n}
                className="py-6 border-t first:pt-0 first:border-t-0 sm:py-1 sm:pr-7 sm:pl-7 sm:border-t-0 sm:border-l sm:first:pt-1 sm:first:pl-0 sm:first:border-l-0"
                style={{ borderColor: "var(--color-divider)" }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", color: "var(--color-accent-500)", marginBottom: 14 }}>{s.n}</div>
                <h3 style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 7px" }}>{s.judul}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: muted(62), margin: 0 }}>{s.desk}</p>
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
              <div style={{ position: "relative", padding: "30px 28px", height: "100%", display: "flex", flexDirection: "column", gap: 28 }}>
                <div>
                  <h2 style={{ fontSize: "clamp(24px, 2.6vw, 31px)", fontWeight: 600, letterSpacing: "-0.03em", margin: "0 0 10px" }}>
                    Dokumen sensitif, dijaga sungguhan.
                  </h2>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: muted(66), margin: 0, maxWidth: "34ch" }}>
                    Wewenang ditegakkan di server, sesi dibatasi, dan berkas hanya terbuka lewat akses yang sah.
                  </p>
                </div>

                {/* Angka nyata dari kode (BATAS_IDLE_MS, randomBytes(32) di api/shares, tiga peran) */}
                <dl className="grid grid-cols-3" style={{ marginTop: "auto", marginBottom: 0, paddingTop: 20, borderTop: "1px solid var(--color-divider)", gap: 12 }}>
                  {ANGKA_KEAMANAN.map((a) => (
                    <div key={a.ket} style={{ minWidth: 0 }}>
                      <dt style={{ fontSize: "clamp(22px, 2.2vw, 28px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{a.nilai}</dt>
                      <dd style={{ margin: "6px 0 0", fontSize: 12.5, lineHeight: 1.45, color: muted(66) }}>{a.ket}</dd>
                    </div>
                  ))}
                </dl>
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
                  <p style={{ fontSize: 13.5, lineHeight: 1.55, color: muted(62), margin: 0 }}>{k.desk}</p>
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
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: muted(66), margin: 0, maxWidth: "46ch" }}>
              Belum punya akun? Hubungi Admin unit kerja Anda untuk didaftarkan.
            </p>
          </div>

          <Link
            href="/login"
            className="btn btn-primary btn-solid"
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
            <MerekIkon size={24} />
            <strong style={{ color: "var(--color-text)", fontWeight: 600 }}>ARSIVA</strong>
            <span>Arsip Dokumen Legal</span>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 12, color: muted(60) }}>
            Credit Operations Department, RO BRI Pekanbaru
          </div>
        </div>
      </footer>
    </div>
  );
}
