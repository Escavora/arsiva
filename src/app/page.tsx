import { ViewTransition, type ReactNode } from "react";
import Link from "next/link";
import { Geist } from "next/font/google";
import { TautanHidup } from "./tautan-hidup";
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

type Detail = "kategori" | "ambang" | "tautan" | "format" | "peran";

const FITUR: { icon: typeof Folders; judul: string; desk: string; kelas: string; sorot: boolean; detail?: Detail }[] = [
  { icon: ShareNetwork, judul: "Berbagi berbatas waktu", desk: "Tautan aman untuk notaris atau rekanan, dan aksesnya dapat dicabut kapan pun.", kelas: "md:col-span-7", sorot: true, detail: "tautan" },
  { icon: Folders, judul: "Arsip terpusat", desk: "PKS, akta notaris, dan sertifikat agunan tersimpan di satu tempat dan mudah ditelusuri.", kelas: "md:col-span-5", sorot: false, detail: "kategori" },
  { icon: BellRinging, judul: "Pengingat kadaluarsa", desk: "Notifikasi otomatis sebelum masa berlaku habis, pada ambang yang dipilih tiap pengguna.", kelas: "md:col-span-5", sorot: false, detail: "ambang" },
  { icon: UploadSimple, judul: "Unggah dan kategorikan", desk: "Simpan hasil scan lalu lengkapi jenis, tujuan, kategori, dan masa berlaku dalam satu langkah.", kelas: "md:col-span-7", sorot: false, detail: "format" },
  { icon: CalendarDots, judul: "Jadwal notaris", desk: "Mitra notaris beserta agenda kerja samanya tercatat dalam satu tempat.", kelas: "md:col-span-5", sorot: false },
  { icon: ShieldCheck, judul: "Hak akses berperan", desk: "Admin, Team Member, dan Pembaca dengan wewenang berbeda yang ditegakkan di sisi server.", kelas: "md:col-span-7", sorot: false, detail: "peran" },
];

// Kategori bawaan aplikasi (seedCats di src/lib/arsiva.ts).
const KATEGORI_CONTOH = ["Perjanjian Kerja Sama", "Akta Notaris", "Sertifikat Agunan", "Surat Kuasa"];


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
  if (jenis === "format" || jenis === "peran") {
    const isi = jenis === "format" ? ["PDF", "JPG", "PNG", "WebP", "≤ 20 MB"] : ["Admin", "Team Member", "Pembaca"];
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {isi.map((t) => <Chip key={t}>{t}</Chip>)}
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

/* ───────────────────────── Halaman ───────────────────────── */

// Arah transisi halaman: ke login = maju (geser ke kiri), kembali ke beranda = mundur.
// Navigasi tanpa tipe (tombol Back peramban, refresh) tidak menggeser apa pun.
const ARAH = { maju: "halaman-maju", mundur: "halaman-mundur", default: "none" };

export default function LandingPage() {
  return (
    <ViewTransition enter={ARAH} exit={ARAH} default="none">
    <div
      className={`${geist.className} landing`}
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
          borderBottom: "1px solid var(--color-divider)",
          background: "color-mix(in srgb, var(--color-bg) 90%, transparent)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", gap: 12, height: 66, padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
          {/* Pasangan transisi dengan merek di halaman login: ikon "berpindah", bukan berganti */}
          <ViewTransition name="arsiva-merek" share="merek" default="none">
            <MerekIkon />
          </ViewTransition>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}>ARSIVA</span>
        </div>
        <nav className="hidden md:flex landing-nav" style={{ marginLeft: 36, gap: 24, alignItems: "center", fontSize: 14 }}>
          <a href="#fitur">Fitur</a>
          <a href="#alur">Cara kerja</a>
          <a href="#keamanan">Keamanan</a>
        </nav>
        <Link href="/login" transitionTypes={["maju"]} className="btn btn-primary btn-solid" style={{ marginLeft: "auto", textDecoration: "none", whiteSpace: "nowrap", borderRadius: 8 }}>
          <SignIn size={16} />
          Masuk
        </Link>
        </div>
      </header>

      {/* HERO - split asimetris 7/5; di bawah lg kartu turun ke bawah teks */}
      <section style={{ borderBottom: "1px solid var(--color-divider)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12" style={{ maxWidth: 1240, margin: "0 auto", minHeight: 620 }}>
          {/* Kolom teks */}
          <div
            className="lg:col-span-7 px-6 pt-16 pb-12 lg:pt-[112px] lg:pb-[104px]"
            style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}
          >
            <h1
              className="landing-muncul"
              style={{
                animationDelay: "80ms",
                fontSize: "clamp(44px, 6.4vw, 88px)",
                lineHeight: 0.98,
                letterSpacing: "-0.04em",
                fontWeight: 700,
                margin: "0 0 28px",
                maxWidth: "13ch",
                textWrap: "balance",
              }}
            >
              Arsip legal yang tidak kadaluarsa{" "}
              <span style={{ color: "var(--color-accent-2-400)" }}>diam-diam.</span>
            </h1>

            <p className="landing-muncul" style={{ animationDelay: "160ms", fontSize: 18, lineHeight: 1.55, color: muted(72), margin: "0 0 36px", maxWidth: 480 }}>
              Simpan, kategorikan, dan pantau masa berlaku dokumen legal bank dalam satu tempat.
            </p>

            <div className="landing-muncul" style={{ animationDelay: "240ms", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/login" transitionTypes={["maju"]} className="btn btn-primary btn-solid" style={{ textDecoration: "none", minHeight: 54, paddingInline: 30, fontSize: 16, borderRadius: 10, whiteSpace: "nowrap" }}>
                <SignIn size={18} />
                Masuk
              </Link>
              <a href="#fitur" className="btn btn-secondary" style={{ textDecoration: "none", minHeight: 54, paddingInline: 26, fontSize: 16, borderRadius: 10, whiteSpace: "nowrap" }}>
                Lihat kemampuannya
                <ArrowRight size={16} className="landing-panah" />
              </a>
            </div>

            {/* Atribusi instansi: sebelumnya lencana di atas judul; teksnya sama. */}
            <div className="landing-muncul" style={{ animationDelay: "320ms", display: "inline-flex", alignItems: "center", gap: 8, marginTop: 36, fontSize: 13, color: muted(66) }}>
              <ShieldCheck size={15} style={{ color: "var(--color-accent-400)", flex: "none" }} />
              Credit Operations Department, RO BRI Pekanbaru
            </div>
          </div>

          {/* Panel visual - ilustrasi berlabel, bukan pratinjau produk palsu.
              Cahaya radial (.landing-cahaya), bukan gradien kolom, agar tidak ada tepi keras di batas kontainer. */}
          <div
            className="lg:col-span-5 px-6 pt-4 pb-16 lg:px-10 lg:py-12 landing-cahaya"
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <TautanHidup />
          </div>
        </div>
      </section>

      {/* KEMAMPUAN - bento asimetris 7/5, 5/7, 6/6. Enam item, enam sel. */}
      <section id="fitur" style={{ maxWidth: 1240, margin: "0 auto", padding: "112px 24px 96px" }}>
        <h2 className="landing-gulir" style={{ fontSize: "clamp(32px, 4.6vw, 60px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.02, margin: "0 0 56px", maxWidth: "16ch", textWrap: "balance" }}>
          Semua yang dibutuhkan tim legal, tanpa berpindah aplikasi.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12" style={{ gap: 14 }}>
          {FITUR.map((f) => (
            <div
              key={f.judul}
              // Tepi kartu ada di .landing-kartu (globals.css) agar bisa menyala saat hover.
              className={`${f.kelas} landing-kartu landing-gulir`}
              style={{
                display: "flex", flexDirection: "column", gap: 18,
                padding: "26px 24px", borderRadius: 12,
                background: f.sorot
                  ? "linear-gradient(140deg, color-mix(in srgb, var(--color-section) 85%, var(--color-section-glow)) 0%, var(--color-surface) 75%)"
                  : "var(--color-surface)",
                minHeight: f.detail ? 158 : undefined,
              }}
            >
              <div>
                <span className="landing-kartu-ikon">
                  <f.icon size={20} />
                </span>
                <h3 style={{ fontSize: f.sorot ? 24 : 17, fontWeight: 600, letterSpacing: f.sorot ? "-0.025em" : "-0.015em", margin: "14px 0 6px" }}>{f.judul}</h3>
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

      {/* CARA KERJA - gulir bercerita: rel terisi mengikuti gulir dan tiap langkah menyala saat
          rel mencapainya (.alur-*). Di HP bertumpuk dengan garis atas, rel disembunyikan. */}
      <section id="alur" className="alur" style={{ background: "var(--color-surface)", borderBlock: "1px solid var(--color-divider)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "104px 24px" }}>
          <div style={{ position: "relative" }}>
          <div className="alur-rel hidden sm:block" aria-hidden="true" />
          <div className="grid grid-cols-1 sm:grid-cols-3">
            {LANGKAH.map((s, i) => (
              <div
                key={s.n}
                className="landing-gulir py-6 border-t first:pt-0 first:border-t-0 sm:py-0 sm:pr-10 sm:border-t-0"
                style={{ borderColor: "var(--color-divider)", ["--i" as string]: i }}
              >
                <span className="alur-simpul" aria-hidden="true" />
                <div className="alur-angka" aria-hidden="true" style={{ fontSize: "clamp(64px, 8vw, 96px)", fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 0.85, marginBottom: 22 }}>{s.n}</div>
                <h3 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.03em", margin: "0 0 8px" }}>{s.judul}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: muted(68), margin: 0, maxWidth: "30ch" }}>{s.desk}</p>
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* KEAMANAN - pita bergambar di kiri, daftar baris di kanan */}
      <section id="keamanan" style={{ maxWidth: 1240, margin: "0 auto", padding: "104px 24px" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: 40 }}>
          <div className="lg:col-span-5 landing-gulir">
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
                  <h2 style={{ fontSize: "clamp(28px, 3.4vw, 44px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.04, margin: "0 0 14px", textWrap: "balance" }}>
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
                      <dt style={{ fontSize: "clamp(24px, 2.5vw, 34px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.05 }}>{a.nilai}</dt>
                      <dd style={{ margin: "6px 0 0", fontSize: 12.5, lineHeight: 1.45, color: muted(66) }}>{a.ket}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            {KEAMANAN.map((k, i) => (
              <div
                key={k.judul}
                className="landing-baris landing-gulir"
                style={{
                  display: "flex", gap: 16, alignItems: "flex-start",
                  padding: "18px 0",
                  borderTop: i === 0 ? "none" : "1px solid var(--color-divider)",
                }}
              >
                <k.icon size={19} className="landing-baris-ikon" style={{ flex: "none", marginTop: 2 }} />
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
      <section style={{ borderTop: "1px solid var(--color-divider)", background: "radial-gradient(60% 90% at 85% 50%, color-mix(in srgb, var(--color-section-glow) 45%, transparent), transparent), linear-gradient(165deg, var(--color-section) 0%, var(--color-bg) 82%)" }}>
        <div
          className="landing-gulir"
          style={{
            maxWidth: 1240, margin: "0 auto", padding: "136px 24px",
            display: "flex", flexDirection: "column", gap: 40,
            alignItems: "flex-start",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                fontSize: "clamp(38px, 6vw, 84px)",
                fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 0.98,
                margin: "0 0 20px", maxWidth: "13ch", textWrap: "balance",
              }}
            >
              Siap merapikan arsip legal Anda?
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: muted(70), margin: 0, maxWidth: "46ch" }}>
              Belum punya akun? Hubungi Admin unit kerja Anda untuk didaftarkan.
            </p>
          </div>

          <Link
            href="/login" transitionTypes={["maju"]}
            className="btn btn-primary btn-solid"
            style={{
              textDecoration: "none", flex: "none",
              minHeight: 68, paddingInline: 48, borderRadius: 12,
              fontSize: 19, whiteSpace: "nowrap",
            }}
          >
            <SignIn size={22} />
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
    </ViewTransition>
  );
}
