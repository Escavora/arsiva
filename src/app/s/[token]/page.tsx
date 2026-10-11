import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { fmt } from "@/lib/arsiva";
import { formatBytes } from "@/lib/dto";
import { Vault, LockKey, LinkBreak, ClockCountdown, FileText, Eye, DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

export const metadata = {
  title: "Dokumen Dibagikan — ARSIVA",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

/** Kerangka halaman penerima: merek ARSIVA di atas kartu, latar bercahaya halus seperti login. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh", display: "grid", placeItems: "center", padding: 24,
        background: "radial-gradient(ellipse 70% 55% at 50% 0%, var(--color-section) 0%, var(--color-bg) 70%)",
      }}
    >
      <div style={{ width: "min(560px, 100%)", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", background: "var(--color-section)", boxShadow: "inset 0 0 0 1px var(--color-accent-700)", color: "var(--color-accent-300)" }}>
            <Vault size={18} />
          </span>
          <span style={{ fontWeight: 600, letterSpacing: "-0.01em" }}>ARSIVA</span>
          <span style={{ fontSize: "var(--t-ket)", color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>Dokumen dibagikan kepada Anda</span>
        </div>
        <div className="card elev-md" style={{ padding: "var(--space-6)", gap: "var(--space-4)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Keadaan tautan tidak bisa dibuka: ikon besar berona keadaan, judul, dan langkah selanjutnya. */
function Pesan({ judul, isi, ikon: Ikon, rona }: { judul: string; isi: string; ikon: Icon; rona: string }) {
  return (
    <Shell>
      <span style={{ width: 60, height: 60, borderRadius: 16, display: "grid", placeItems: "center", color: rona, background: `color-mix(in srgb, ${rona} 16%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${rona} 45%, transparent)` }}>
        <Ikon size={30} weight="fill" />
      </span>
      <h3 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: "-0.025em" }}>{judul}</h3>
      <p style={{ fontSize: "var(--t-isi)", lineHeight: 1.6, margin: 0, color: "color-mix(in srgb, var(--color-text) 72%, transparent)" }}>
        {isi}
      </p>
    </Shell>
  );
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;

  const share = await db.query.documentShares.findFirst({
    where: eq(schema.documentShares.token, token),
    with: {
      dokumen: {
        with: {
          kategori: { columns: { nama: true } },
          jenis: { columns: { nama: true } },
        },
      },
    },
  });

  if (!share) {
    return <Pesan judul="Tautan tidak dikenal" ikon={LinkBreak} rona="var(--color-danger-text)" isi="Periksa kembali tautan yang Anda terima, atau hubungi pengirim dokumen." />;
  }
  if (share.revokedAt) {
    return <Pesan judul="Akses dicabut" ikon={LockKey} rona="var(--color-danger-text)" isi="Pemilik dokumen telah mencabut akses tautan ini." />;
  }
  // Server Component: dirender sekali per request, jadi "sekarang" memang harus dibaca di sini
  // (aturan kemurnian render ditujukan untuk komponen klien yang dirender ulang).
  // eslint-disable-next-line react-hooks/purity
  const kini = Date.now();
  if (share.expiresAt.getTime() < kini) {
    return <Pesan judul="Tautan kadaluarsa" ikon={ClockCountdown} rona="var(--color-neutral-400)" isi="Masa berlaku tautan sudah habis. Silakan minta tautan baru kepada pengirim." />;
  }

  const doc = share.dokumen!;
  const berlakuSampai = share.expiresAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Sisa masa berlaku tautan untuk cincin (motif yang sama dengan halaman Bagikan).
  const total = share.expiresAt.getTime() - share.createdAt.getTime();
  const sisaMs = share.expiresAt.getTime() - kini;
  const persen = total > 0 ? Math.max(3, Math.min(100, (sisaMs / total) * 100)) : 0;
  const sisaHari = Math.ceil(sisaMs / 86400000);

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div className="tautan-cincin tautan-cincin-masuk" style={{ ["--tautan-p" as string]: `${persen}%`, width: 64, height: 64 }} aria-hidden="true">
          <span className="tautan-cincin-isi" style={{ inset: 6, background: "var(--color-surface)" }}>
            <FileText size={22} weight="fill" style={{ color: "var(--color-accent-300)" }} />
          </span>
        </div>
        <div style={{ minWidth: 0 }}>
          <span className="tag tag-ok">Tautan aktif</span>
          <div style={{ fontSize: "var(--t-isi)", marginTop: 6 }}>
            <strong style={{ fontWeight: 600 }}>{sisaHari <= 1 ? "Berakhir hari ini" : `${sisaHari} hari lagi`}</strong>
            <span style={{ color: "color-mix(in srgb, var(--color-text) 66%, transparent)" }}> · berlaku s.d. {berlakuSampai}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ margin: "0 0 6px", fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 600, letterSpacing: "-0.025em", textWrap: "balance" }}>{doc.namaDokumen}</h3>
        <div className="text-muted" style={{ fontSize: "var(--t-ket)" }}>
          Dibagikan kepada {share.penerimaEmail} · {share.penerimaTipe}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", rowGap: 9, columnGap: 12, fontSize: "var(--t-ket)" }}>
        <div className="text-muted">Kategori</div>
        <div>{doc.kategori?.nama ?? "—"}</div>
        <div className="text-muted">Jenis dokumen</div>
        <div>{doc.jenis?.nama ?? "—"}</div>
        <div className="text-muted">Masa berlaku</div>
        <div>{fmt(doc.tanggalKadaluarsa)}</div>
        <div className="text-muted">Berkas</div>
        <div>
          {doc.fileName ?? "—"} {doc.fileSize ? `· ${formatBytes(doc.fileSize)}` : ""}
        </div>
      </div>

      {doc.filePath ? (
        <div style={{ display: "flex", gap: 8 }}>
          <a className="btn btn-secondary" href={`/s/${token}/file`} target="_blank" rel="noreferrer" style={{ flex: 1, minHeight: 44 }}>
            <Eye size={17} />
            Lihat Dokumen
          </a>
          <a className="btn btn-primary btn-solid" href={`/s/${token}/file?unduh=1`} style={{ flex: 1, minHeight: 44 }}>
            <DownloadSimple size={17} />
            Unduh
          </a>
        </div>
      ) : (
        <div className="text-muted" style={{ fontSize: "var(--t-ket)" }}>
          Berkas hasil scan belum tersedia untuk dokumen ini.
        </div>
      )}

      <div className="text-muted" style={{ fontSize: "var(--t-label)", borderTop: "1px solid var(--color-divider)", paddingTop: 12 }}>
        Tautan ini bersifat rahasia dan hanya untuk penerima yang dituju. Akses berakhir otomatis saat masa berlaku habis atau dicabut.
      </div>
    </Shell>
  );
}
