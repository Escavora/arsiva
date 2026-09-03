"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShareNetwork,
  DownloadSimple,
  FileText,
  ArrowsOut,
  Printer,
  PencilSimple,
  CheckSquareOffset,
  LinkSimple,
} from "@phosphor-icons/react";
import { useArsiva } from "@/components/arsiva/store";
import { fmt, fmtShort } from "@/lib/arsiva";

export default function DetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { allDocs, state, threshold, tandai, say } = useArsiva();

  const id = Number(params.id);
  const cur = allDocs.find((d) => d.id === id) ?? allDocs[0];

  const curShares = React.useMemo(() => {
    if (!cur) return [];
    return state.shares
      .filter((x) => x.documentId === cur.id)
      .map((x) => ({
        ...x,
        expText: fmtShort(x.exp.slice(0, 10)),
        tag:
          x.status === "Aktif" ? "tag-ok" : x.status === "Dicabut" ? "tag-danger" : "tag-neutral",
      }));
  }, [state.shares, cur]);

  const riwayat = React.useMemo(() => {
    if (!cur) return [];
    return [
      { teks: `Dokumen diunggah ke arsip oleh ${cur.o}`, waktu: fmt(cur.u), dot: "var(--color-accent)" },
      { teks: "Informasi kategori dan masa berlaku dilengkapi", waktu: fmt(cur.u), dot: "var(--color-neutral-600)" },
      {
        teks: curShares.length ? `Tautan berbagi dibuat untuk ${curShares.length} penerima` : "Belum pernah dibagikan ke pihak eksternal",
        waktu: curShares.length ? fmtShort(curShares[0].dibuat.slice(0, 10)) : "—",
        dot: "var(--color-neutral-600)",
      },
      {
        teks:
          cur.status === "Diproses"
            ? "Ditandai sudah diproses oleh tim legal"
            : `Pengingat kadaluarsa aktif pada ambang ${threshold} hari`,
        waktu: cur.status === "Diproses" ? "Sudah ditindaklanjuti" : "Terjadwal",
        dot: cur.status === "Diproses" ? "var(--color-ok)" : "var(--color-accent-2)",
      },
    ];
  }, [cur, curShares, threshold]);

  return (
    <div>
      <button type="button" className="btn btn-ghost" onClick={() => router.push("/arsip")} style={{ marginBottom: 12, fontSize: 12.5 }}>
        <ArrowLeft size={14} />
        Kembali ke arsip
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span className={`tag ${cur.tag}`}>{cur.status}</span>
            <span className="tag tag-neutral">{cur.k}</span>
          </div>
          <h3 style={{ margin: "0 0 4px", maxWidth: 760 }}>{cur.n}</h3>
          <div className="text-muted" style={{ fontSize: 13 }}>Diunggah {cur.upText} oleh {cur.o} · No. arsip {cur.kode}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flex: "none" }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.push("/bagikan")}>
            <ShareNetwork size={16} />
            Bagikan
          </button>
          <a className="btn btn-primary" href={cur.hasFile ? `/api/documents/${cur.id}/file?unduh=1` : undefined}
            onClick={(e) => { if (!cur.hasFile) { e.preventDefault(); say("Belum ada berkas scan untuk dokumen ini."); } }}>
            <DownloadSimple size={16} />
            Unduh Scan
          </a>
        </div>
      </div>

      <div className="grid gap-4 items-start grid-cols-1 lg:grid-cols-[1fr_1.05fr]">
        {/* preview */}
        <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <h5 style={{ margin: 0 }}>Pratinjau hasil scan</h5>
            <span className="text-muted" style={{ marginLeft: "auto", fontSize: 11.5 }}>{cur.s} · PDF</span>
          </div>
          <div style={{ borderRadius: "var(--radius-md)", background: "var(--color-surface-2)", boxShadow: "inset 0 0 0 1px var(--color-divider)", height: 352, display: "grid", placeItems: "center", textAlign: "center", padding: 20 }}>
            <div>
              <FileText size={38} style={{ color: "var(--color-neutral-600)", margin: "0 auto" }} />
              <div style={{ fontSize: 13, marginTop: 10 }}>{cur.file}</div>
              <div className="text-muted" style={{ fontSize: 11.5, maxWidth: 280, margin: "4px auto 0" }}>Berkas hasil scan tersimpan di penyimpanan dokumen; pratinjau ditampilkan pada halaman ini.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a className="btn btn-secondary" href={cur.hasFile ? `/api/documents/${cur.id}/file` : undefined} target="_blank" rel="noreferrer"
              onClick={(e) => { if (!cur.hasFile) { e.preventDefault(); say("Belum ada berkas scan untuk dokumen ini."); } }} style={{ flex: 1 }}>
              <ArrowsOut size={15} />
              Buka layar penuh
            </a>
            <button type="button" className="btn btn-secondary" onClick={() => say("Dokumen dikirim ke antrian cetak.")} style={{ flex: 1 }}>
              <Printer size={15} />
              Cetak
            </button>
          </div>
        </div>

        {/* info + shares + history */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
            <h5 style={{ margin: 0 }}>Informasi dokumen</h5>
            <div style={{ display: "grid", gridTemplateColumns: "132px 1fr", rowGap: 11, columnGap: 14, fontSize: 13 }}>
              <div className="text-muted">Jenis dokumen</div><div>{cur.j}</div>
              <div className="text-muted">Tujuan</div><div>{cur.t}</div>
              <div className="text-muted">Kategori</div><div>{cur.k}</div>
              <div className="text-muted">Tanggal unggah</div><div>{cur.upText}</div>
              <div className="text-muted">Tanggal kadaluarsa</div><div>{cur.expText} <span className="text-muted">({cur.sisa})</span></div>
              <div className="text-muted">Ambang pengingat</div><div>{threshold} hari sebelum kadaluarsa</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
              <button type="button" className="btn btn-secondary" onClick={() => say("Form ubah informasi dokumen dibuka.")}>
                <PencilSimple size={15} />
                Ubah informasi
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => void tandai(cur.id, cur.status !== "Diproses")}>
                <CheckSquareOffset size={15} />
                {cur.status === "Diproses" ? "Batalkan tanda" : "Tandai diproses"}
              </button>
            </div>
          </div>

          <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <h5 style={{ margin: 0 }}>Tautan berbagi aktif</h5>
              <button type="button" className="btn btn-ghost" onClick={() => router.push("/bagikan")} style={{ marginLeft: "auto", fontSize: 12 }}>Buat tautan</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {curShares.map((s) => (
                <div key={s.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <LinkSimple size={16} style={{ color: "var(--color-accent-400)", flex: "none" }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12.5 }}>{s.email}</div>
                    <div style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>{s.tipe} · berlaku s.d. {s.expText}</div>
                  </div>
                  <span className={`tag ${s.tag}`}>{s.status}</span>
                </div>
              ))}
              {curShares.length === 0 && (
                <div className="text-muted" style={{ fontSize: 12.5 }}>Belum ada tautan berbagi untuk dokumen ini.</div>
              )}
            </div>
          </div>

          <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
            <h5 style={{ margin: 0 }}>Riwayat dokumen</h5>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {riwayat.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: "none", width: 8, height: 8, marginTop: 6, borderRadius: "50%", background: h.dot }} />
                  <div>
                    <div style={{ fontSize: 12.5 }}>{h.teks}</div>
                    <div style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>{h.waktu}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
