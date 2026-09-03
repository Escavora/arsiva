"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react";
import { useArsiva } from "@/components/arsiva/store";

export default function PengingatPage() {
  const router = useRouter();
  const { allDocs, counts, threshold, setThreshold, tandai } = useArsiva();
  const th = threshold;

  const rows = React.useMemo(
    () => allDocs.filter((r) => r.dl <= th).sort((a, b) => a.dl - b.dl),
    [allDocs, th],
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: "0 0 4px" }}>Pengingat Kadaluarsa</h3>
          <div className="text-muted" style={{ fontSize: 13 }}>
            {counts.perluAksi} dokumen perlu ditindaklanjuti pada ambang {th} hari.
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span className="text-muted" style={{ fontSize: 12 }}>Ambang pengingat</span>
          <div className="seg">
            {[30, 60, 90].map((v) => (
              <label key={v} className="seg-opt">
                <input type="radio" name="amb" checked={th === v} onChange={() => void setThreshold(v)} />
                {v} hari
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 mb-4 grid-cols-1 md:grid-cols-3">
        <div className="card elev-sm" style={{ gap: 4, boxShadow: "inset 0 0 0 1px var(--color-danger-800), var(--shadow-sm)" }}>
          <div className="card-kicker" style={{ color: "var(--color-danger)" }}>Terlewat</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, lineHeight: 1.1, color: "var(--color-danger)" }}>{counts.kadaluarsa} dokumen</div>
          <div className="card-body">Masa berlaku sudah habis dan belum diperbarui.</div>
        </div>
        <div className="card elev-sm" style={{ gap: 4, boxShadow: "inset 0 0 0 1px var(--color-accent-2-800), var(--shadow-sm)" }}>
          <div className="card-kicker" style={{ color: "var(--color-accent-2)" }}>Dalam ambang</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, lineHeight: 1.1, color: "var(--color-accent-2-400)" }}>{counts.segera} dokumen</div>
          <div className="card-body">Akan kadaluarsa dalam {th} hari ke depan.</div>
        </div>
        <div className="card elev-sm" style={{ gap: 4 }}>
          <div className="card-kicker" style={{ color: "var(--color-ok)" }}>Sudah diproses</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, lineHeight: 1.1, color: "var(--color-ok)" }}>{counts.diproses} dokumen</div>
          <div className="card-body">Ditandai selesai diperbarui oleh tim legal.</div>
        </div>
      </div>

      <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Dokumen</th>
                <th style={{ width: 150 }}>Kategori</th>
                <th style={{ width: 120 }}>Kadaluarsa</th>
                <th style={{ width: 110 }}>Sisa waktu</th>
                <th style={{ width: 132 }}>Status</th>
                <th style={{ width: 150 }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td onClick={() => router.push(`/arsip/${r.id}`)} style={{ cursor: "pointer" }}>
                    <div style={{ fontSize: 13.5, maxWidth: 340, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.n}</div>
                    <div style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 42%, transparent)" }}>{r.j} · {r.o}</div>
                  </td>
                  <td style={{ fontSize: 12.5 }}>{r.k}</td>
                  <td style={{ fontSize: 12.5 }}>{r.expText}</td>
                  <td style={{ fontSize: 12.5, color: r.sisaC }}>{r.sisa}</td>
                  <td><span className={`tag ${r.tag}`}>{r.status}</span></td>
                  <td>
                    <button type="button" className="btn btn-ghost" onClick={() => void tandai(r.id, !r.p)} style={{ fontSize: 12 }}>
                      {r.p ? "Batalkan tanda" : "Tandai diproses"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div style={{ padding: "30px 0", textAlign: "center" }}>
            <CheckCircle size={28} style={{ color: "var(--color-ok)", margin: "0 auto" }} />
            <div style={{ fontSize: 14, marginTop: 8 }}>Tidak ada dokumen yang mendekati kadaluarsa</div>
            <div className="text-muted" style={{ fontSize: 12.5 }}>Semua dokumen berada di luar ambang {th} hari.</div>
          </div>
        )}
      </div>
    </div>
  );
}
