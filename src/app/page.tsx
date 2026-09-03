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
  CheckCircle,
  Tag,
} from "@phosphor-icons/react/dist/ssr";

export const metadata = {
  title: "ARSIVA — Arsip Dokumen Legal Bank",
  description:
    "Satu arsip digital untuk seluruh dokumen legal bank: unggah hasil scan, kategorikan, pantau masa berlaku, dan bagikan secara aman.",
};

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

/* ───────────────────────── Data konten ───────────────────────── */

const FITUR = [
  { icon: Folders, judul: "Arsip terpusat", desk: "Semua dokumen legal — PKS, akta notaris, sertifikat agunan — tersimpan rapi di satu tempat, mudah dicari." },
  { icon: UploadSimple, judul: "Unggah & kategorikan", desk: "Simpan hasil scan lalu lengkapi jenis, tujuan, kategori, dan masa berlaku dalam satu langkah." },
  { icon: BellRinging, judul: "Pengingat kadaluarsa", desk: "Notifikasi otomatis sebelum dokumen habis masa berlaku, dengan ambang yang bisa Anda atur (30/60/90 hari)." },
  { icon: ShareNetwork, judul: "Berbagi aman", desk: "Buat tautan berbatas waktu untuk notaris atau rekanan, dan cabut aksesnya kapan pun." },
  { icon: CalendarDots, judul: "Jadwal notaris", desk: "Kelola mitra notaris beserta agenda kerja samanya dalam satu kalender terpadu." },
  { icon: ShieldCheck, judul: "Hak akses berperan", desk: "Admin, Team Member, dan Pembaca dengan wewenang berbeda — ditegakkan di sisi server." },
];

const LANGKAH = [
  { n: "01", judul: "Unggah dokumen", desk: "Pindai dokumen legal dan unggah berkasnya ke arsip." },
  { n: "02", judul: "Lengkapi informasi", desk: "Pilih kategori, jenis, tujuan, dan tanggal kadaluarsa." },
  { n: "03", judul: "Pantau & tindak lanjuti", desk: "Terima pengingat otomatis, tandai selesai, atau bagikan aman." },
];

const KEAMANAN = [
  { icon: LockKey, judul: "Peran dari sesi server", desk: "Wewenang tidak pernah ditentukan dari sisi klien — setiap aksi diperiksa ulang di server." },
  { icon: ClockCountdown, judul: "Sesi berbatas waktu", desk: "Sesi login berakhir otomatis setelah 30 menit tanpa aktivitas." },
  { icon: FileText, judul: "Jejak audit", desk: "Seluruh aktivitas penting terekam untuk keperluan kepatuhan." },
  { icon: ShareNetwork, judul: "Tautan token unik", desk: "Berbagi memakai token acak yang tidak bisa ditebak dan otomatis kadaluarsa." },
];

/* ───────────────────────── Halaman ───────────────────────── */

export default function LandingPage() {
  return (
    <div style={{ background: "var(--color-bg)", color: "var(--color-text)", minHeight: "100vh" }}>
      {/* ── Top bar ── */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 10,
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 20px", borderBottom: "1px solid var(--color-divider)",
          background: "color-mix(in srgb, var(--color-bg) 88%, transparent)", backdropFilter: "blur(8px)",
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
        <div style={{ marginLeft: "auto" }}>
          <Link href="/login" className="btn btn-primary" style={{ textDecoration: "none" }}>
            <SignIn size={16} />
            Masuk
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: "relative", overflow: "hidden", background: "linear-gradient(160deg, var(--color-section) 0%, var(--color-bg) 70%)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 20px 64px", display: "grid", gap: 40 }} className="lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 999, fontSize: 12, color: "var(--color-accent-100)", background: "var(--color-accent-800)", boxShadow: "inset 0 0 0 1px var(--color-accent-600)", marginBottom: 20 }}>
              <ShieldCheck size={14} />
              Credit Operations Department · RO BRI Pekanbaru
            </div>
            <h1 style={{ fontSize: 46, lineHeight: 1.08, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              Satu arsip digital untuk seluruh dokumen legal bank.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: muted(70), margin: "0 0 28px", maxWidth: 520 }}>
              Perjanjian kerja sama, akta notaris, dan sertifikat agunan tersimpan rapi dengan
              kategori, masa berlaku, dan pengingat otomatis — aman dan mudah ditelusuri.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/login" className="btn btn-primary" style={{ textDecoration: "none", minHeight: 44, paddingInline: 20 }}>
                <SignIn size={17} />
                Masuk ke ARSIVA
              </Link>
              <a href="#fitur" className="btn btn-secondary" style={{ textDecoration: "none", minHeight: 44, paddingInline: 20 }}>
                Jelajahi fitur
                <ArrowRight size={16} />
              </a>
            </div>
            <div style={{ display: "flex", gap: 30, marginTop: 36, paddingTop: 24, borderTop: "1px solid var(--color-divider)", flexWrap: "wrap" }}>
              {[["1.248", "Dokumen terarsip"], ["37", "Mitra notaris"], ["99,9%", "Ketersediaan layanan"]].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 24 }}>{v}</div>
                  <div style={{ fontSize: 12, color: muted(55) }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup dashboard */}
          <div className="hidden lg:block" aria-hidden style={{ position: "relative" }}>
            <div className="card elev-lg" style={{ padding: 0, gap: 0, overflow: "hidden", transform: "perspective(1400px) rotateY(-9deg) rotateX(3deg)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 14px", borderBottom: "1px solid var(--color-divider)" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--color-danger)" }} />
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--color-accent-2-500)" }} />
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--color-ok)" }} />
                <span style={{ marginLeft: 10, fontSize: 11, color: muted(45) }}>arsiva.vercel.app/dashboard</span>
              </div>
              <div style={{ padding: 18, display: "grid", gap: 12 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>Selamat pagi, Rina</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    ["Total Dokumen", "14", "var(--color-neutral-400)"],
                    ["Masa Berlaku Aman", "7", "var(--color-accent-300)"],
                    ["Segera Kadaluarsa", "5", "var(--color-accent-2-400)"],
                    ["Sudah Kadaluarsa", "1", "var(--color-danger)"],
                  ].map(([l, v, c]) => (
                    <div key={l} className="card" style={{ padding: 12, gap: 6, background: "var(--color-surface-2)" }}>
                      <div style={{ fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: muted(45) }}>{l}</div>
                      <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, lineHeight: 1, color: c as string }}>{v}</div>
                      <div style={{ height: 3, borderRadius: 2, background: "var(--color-neutral-800)" }}>
                        <div style={{ height: 3, borderRadius: 2, width: "60%", background: c as string }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card" style={{ padding: 12, gap: 8, background: "var(--color-surface-2)" }}>
                  {["Perjanjian Kerja Sama Layanan Notaris", "Akta Jual Beli Agunan No. 214", "Perjanjian Kredit Modal Kerja"].map((n, i) => (
                    <div key={n} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <FileText size={15} style={{ color: "var(--color-accent-400)", flex: "none" }} />
                      <div style={{ fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{n}</div>
                      <span className={`tag ${i === 0 ? "tag-warn" : i === 2 ? "tag-danger" : "tag-accent"}`} style={{ fontSize: 9, padding: "1px 7px" }}>
                        {i === 0 ? "Segera" : i === 2 ? "Kadaluarsa" : "Aktif"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fitur ── */}
      <section id="fitur" style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 20px" }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 44px" }}>
          <div style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-accent-400)", marginBottom: 10 }}>Fitur</div>
          <h2 style={{ fontSize: 34, margin: "0 0 12px", letterSpacing: "-0.02em" }}>Semua yang dibutuhkan tim legal</h2>
          <p style={{ fontSize: 15, color: muted(65), margin: 0 }}>Dari mengunggah hingga menindaklanjuti — dalam satu alur kerja yang rapi.</p>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {FITUR.map((f) => (
            <div key={f.judul} className="card elev-sm" style={{ padding: "var(--space-6)", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--color-accent-900)", color: "var(--color-accent-300)", display: "grid", placeItems: "center", boxShadow: "inset 0 0 0 1px var(--color-accent-800)" }}>
                <f.icon size={21} />
              </div>
              <h3 style={{ fontSize: 17, margin: 0 }}>{f.judul}</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: muted(62), margin: 0 }}>{f.desk}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Alur kerja ── */}
      <section id="alur" style={{ background: "var(--color-surface)", borderBlock: "1px solid var(--color-divider)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 20px" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 44px" }}>
            <div style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-accent-400)", marginBottom: 10 }}>Cara kerja</div>
            <h2 style={{ fontSize: 34, margin: "0 0 12px", letterSpacing: "-0.02em" }}>Tiga langkah sederhana</h2>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {LANGKAH.map((s) => (
              <div key={s.n} className="card" style={{ padding: "var(--space-6)", gap: 10, background: "var(--color-bg)" }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 30, color: "var(--color-accent-600)", letterSpacing: "-0.02em" }}>{s.n}</div>
                <h3 style={{ fontSize: 17, margin: 0 }}>{s.judul}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: muted(62), margin: 0 }}>{s.desk}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Keamanan ── */}
      <section id="keamanan" style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 20px" }}>
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-accent-400)", marginBottom: 10 }}>Keamanan</div>
            <h2 style={{ fontSize: 34, margin: "0 0 14px", letterSpacing: "-0.02em" }}>Dirancang untuk standar perbankan</h2>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: muted(65), margin: "0 0 20px" }}>
              Dokumen legal bersifat sensitif. ARSIVA menegakkan wewenang di sisi server,
              membatasi sesi, dan mencatat setiap aktivitas penting.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Akses terbatas untuk pegawai terdaftar", "Berkas hanya dapat dibuka lewat sesi terverifikasi", "Tautan berbagi otomatis mati saat kadaluarsa"].map((t) => (
                <div key={t} style={{ display: "flex", gap: 9, alignItems: "center", fontSize: 14 }}>
                  <CheckCircle size={18} style={{ color: "var(--color-ok)", flex: "none" }} />
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {KEAMANAN.map((k) => (
              <div key={k.judul} className="card elev-sm" style={{ padding: "var(--space-4)", gap: 9 }}>
                <div style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", background: "var(--color-surface-2)", color: "var(--color-accent-300)", display: "grid", placeItems: "center", boxShadow: "inset 0 0 0 1px var(--color-divider)" }}>
                  <k.icon size={18} />
                </div>
                <h3 style={{ fontSize: 14.5, margin: 0 }}>{k.judul}</h3>
                <p style={{ fontSize: 12.5, lineHeight: 1.55, color: muted(58), margin: 0 }}>{k.desk}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA akhir ── */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "0 20px 80px" }}>
        <div className="card elev-md" style={{ padding: "52px 32px", gap: 18, textAlign: "center", alignItems: "center", background: "linear-gradient(160deg, var(--color-section) 0%, var(--color-surface) 75%)", boxShadow: "inset 0 0 0 1px var(--color-accent-800), var(--shadow-md)" }}>
          <div style={{ width: 46, height: 46, borderRadius: "var(--radius-md)", background: "color-mix(in srgb, var(--color-accent) 16%, transparent)", boxShadow: "inset 0 0 0 1px var(--color-accent-700)", display: "grid", placeItems: "center", color: "var(--color-accent-200)" }}>
            <Vault size={24} />
          </div>
          <h2 style={{ fontSize: 30, margin: 0, letterSpacing: "-0.02em" }}>Siap merapikan arsip legal Anda?</h2>
          <p style={{ fontSize: 15, color: muted(68), margin: 0, maxWidth: 480 }}>
            Masuk dengan akun pegawai untuk mulai mengelola dokumen, pengingat, dan berbagi aman.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ textDecoration: "none", minHeight: 46, paddingInline: 24, marginTop: 4 }}>
            <SignIn size={17} />
            Masuk ke ARSIVA
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--color-divider)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 28, height: 28, flex: "none", borderRadius: "var(--radius-sm)", background: "var(--color-section)", color: "var(--color-accent-300)", display: "grid", placeItems: "center" }}>
              <Tag size={15} />
            </div>
            <div style={{ fontSize: 13, color: muted(70) }}>
              <strong style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)", fontWeight: 500 }}>ARSIVA</strong> · Arsip Dokumen Legal
            </div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 12, color: muted(45) }}>
            Credit Operations Department — RO BRI Pekanbaru
          </div>
        </div>
      </footer>
    </div>
  );
}
