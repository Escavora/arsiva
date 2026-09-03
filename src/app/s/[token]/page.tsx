import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { fmt } from "@/lib/arsiva";
import { formatBytes } from "@/lib/dto";

export const metadata = {
  title: "Dokumen Dibagikan — ARSIVA",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "var(--color-bg)" }}>
      <div className="card elev-md" style={{ width: "min(560px, 100%)", padding: "var(--space-6)", gap: "var(--space-4)" }}>
        {children}
      </div>
    </div>
  );
}

function Pesan({ judul, isi, tag }: { judul: string; isi: string; tag: string }) {
  return (
    <Shell>
      <span className={`tag ${tag}`} style={{ alignSelf: "flex-start" }}>
        {judul}
      </span>
      <h4 style={{ margin: 0 }}>{judul}</h4>
      <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
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
    return <Pesan judul="Tautan tidak dikenal" tag="tag-danger" isi="Periksa kembali tautan yang Anda terima, atau hubungi pengirim dokumen." />;
  }
  if (share.revokedAt) {
    return <Pesan judul="Akses dicabut" tag="tag-danger" isi="Pemilik dokumen telah mencabut akses tautan ini." />;
  }
  if (share.expiresAt.getTime() < Date.now()) {
    return <Pesan judul="Tautan kadaluarsa" tag="tag-neutral" isi="Masa berlaku tautan sudah habis. Silakan minta tautan baru kepada pengirim." />;
  }

  const doc = share.dokumen!;
  const berlakuSampai = share.expiresAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="tag tag-ok">Tautan aktif</span>
        <span className="text-muted" style={{ fontSize: 11.5, marginLeft: "auto" }}>
          Berlaku s.d. {berlakuSampai}
        </span>
      </div>

      <div>
        <h4 style={{ margin: "0 0 4px" }}>{doc.namaDokumen}</h4>
        <div className="text-muted" style={{ fontSize: 12.5 }}>
          Dibagikan kepada {share.penerimaEmail} · {share.penerimaTipe}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", rowGap: 9, columnGap: 12, fontSize: 13 }}>
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
          <a className="btn btn-secondary" href={`/s/${token}/file`} target="_blank" rel="noreferrer" style={{ flex: 1 }}>
            Lihat Dokumen
          </a>
          <a className="btn btn-primary" href={`/s/${token}/file?unduh=1`} style={{ flex: 1 }}>
            Unduh
          </a>
        </div>
      ) : (
        <div className="text-muted" style={{ fontSize: 12.5 }}>
          Berkas hasil scan belum tersedia untuk dokumen ini.
        </div>
      )}

      <div className="text-muted" style={{ fontSize: 11, borderTop: "1px solid var(--color-divider)", paddingTop: 12 }}>
        Tautan ini bersifat rahasia dan hanya untuk penerima yang dituju. Seluruh akses dicatat pada audit log ARSIVA.
      </div>
    </Shell>
  );
}
