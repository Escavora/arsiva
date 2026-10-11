"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle, BellRinging } from "@phosphor-icons/react";
import { KepalaHalaman, RONA_HALAMAN, AngkaNaik } from "@/components/arsiva/kepala";
import { useArsiva } from "@/components/arsiva/store";
import { LabelKategori } from "@/components/arsiva/warna";

export default function PengingatPage() {
  const { allDocs, counts, threshold, setThreshold, tandai } = useArsiva();
  const th = threshold;

  const rows = React.useMemo(
    () => allDocs.filter((r) => r.dl <= th).sort((a, b) => a.dl - b.dl),
    [allDocs, th],
  );

  return (
    <div>
      <KepalaHalaman
        ikon={BellRinging}
        rona={RONA_HALAMAN.pengingat}
        judul="Pengingat Kadaluarsa"
        ket={`${counts.perluAksi} dokumen perlu ditindaklanjuti pada ambang ${th} hari.`}
        aksi={
          <>
            <span style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--color-text) 66%, transparent)" }}>Ambang pengingat</span>
            <div className="seg" style={{ background: "var(--color-bg)" }}>
              {[30, 60, 90].map((v) => (
                <label key={v} className="seg-opt">
                  <input type="radio" name="amb" checked={th === v} onChange={() => void setThreshold(v)} />
                  {v} hari
                </label>
              ))}
            </div>
          </>
        }
      >
        {/* Papan ringkasan di dalam pita: angka besar berwarna status, yang terlewat paling menonjol */}
        <div className="papan-pengingat">
          {[
            { n: counts.kadaluarsa, label: "Terlewat", ket: "Masa berlaku habis, belum diperbarui.", warna: "var(--color-danger-text)", besar: true },
            { n: counts.segera, label: "Dalam ambang", ket: `Kadaluarsa dalam ${th} hari ke depan.`, warna: "var(--color-accent-2-400)", besar: false },
            { n: counts.diproses, label: "Sudah diproses", ket: "Ditandai selesai oleh tim legal.", warna: "var(--color-ok)", besar: false },
          ].map((p) => (
            <div key={p.label} className="papan-pengingat-sel">
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px 10px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 0.9, fontSize: p.besar ? 56 : 40, color: p.warna, fontVariantNumeric: "tabular-nums" }}><AngkaNaik nilai={p.n} /></span>
                <span style={{ fontSize: 15, fontWeight: 500, color: p.warna }}>{p.label}</span>
              </div>
              <div className="papan-pengingat-ket" style={{ fontSize: 12.5, marginTop: 8, color: "color-mix(in srgb, var(--color-text) 66%, transparent)" }}>{p.ket}</div>
            </div>
          ))}
        </div>
      </KepalaHalaman>

      <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Dokumen</th>
                <th className="hidden md:table-cell" style={{ width: 178 }}>Kategori</th>
                <th className="hidden sm:table-cell" style={{ width: 120 }}>Kadaluarsa</th>
                <th style={{ width: 110 }}>Sisa waktu</th>
                <th className="hidden sm:table-cell" style={{ width: 132 }}>Status</th>
                <th style={{ width: 150 }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="baris-tautan">
                  <td>
                    <div style={{ fontSize: 13.5, maxWidth: "min(340px, 46vw)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <Link href={`/arsip/${r.id}`} className="tautan-baris">{r.n}</Link>
                    </div>
                    <div style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>{r.j} · {r.o}</div>
                  </td>
                  <td className="hidden md:table-cell"><LabelKategori nama={r.k} /></td>
                  <td className="hidden sm:table-cell" style={{ fontSize: 12.5 }}>{r.expText}</td>
                  <td style={{ fontSize: 12.5, color: r.sisaC }}>{r.sisa}</td>
                  <td className="hidden sm:table-cell"><span className={`tag ${r.tag}`}>{r.status}</span></td>
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
