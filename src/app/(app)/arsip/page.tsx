"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MagnifyingGlass,
  UploadSimple,
  ArrowCounterClockwise,
  FilePdf,
  CaretRight,
  FolderOpen,
} from "@phosphor-icons/react";
import { useArsiva } from "@/components/arsiva/store";

function chipStyle(active: boolean): React.CSSProperties {
  return active
    ? { color: "var(--color-accent-100)", background: "var(--color-accent-800)", boxShadow: "inset 0 0 0 1px var(--color-accent-600)" }
    : { color: "color-mix(in srgb, var(--color-text) 68%, transparent)", background: "transparent", boxShadow: "inset 0 0 0 1px var(--color-divider)" };
}

const STATUS_CHIPS: [string, string][] = [
  ["Semua", "Semua"],
  ["Aktif", "Aman"],
  ["Segera", "Segera kadaluarsa"],
  ["Kadaluarsa", "Kadaluarsa"],
  ["Diproses", "Diproses"],
];

export default function ArsipPage() {
  return (
    <React.Suspense fallback={null}>
      <ArsipInner />
    </React.Suspense>
  );
}

function ArsipInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { allDocs, state } = useArsiva();

  const [q, setQ] = React.useState(searchParams.get("q") ?? "");
  const [cat, setCat] = React.useState("Semua");
  const [status, setStatus] = React.useState("Semua");
  const [jenisF, setJenisF] = React.useState("Semua jenis");
  const [tujuanF, setTujuanF] = React.useState("Semua tujuan");

  React.useEffect(() => {
    const urlQ = searchParams.get("q") ?? "";
    setQ(urlQ);
  }, [searchParams]);

  const resetFilter = () => {
    setQ("");
    setCat("Semua");
    setStatus("Semua");
    setJenisF("Semua jenis");
    setTujuanF("Semua tujuan");
    router.replace("/arsip");
  };

  const rows = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    return allDocs.filter((r) => {
      if (query && !(r.n + " " + r.j + " " + r.t + " " + r.k).toLowerCase().includes(query)) return false;
      if (cat !== "Semua" && r.k !== cat) return false;
      if (jenisF !== "Semua jenis" && r.j !== jenisF) return false;
      if (tujuanF !== "Semua tujuan" && r.t !== tujuanF) return false;
      if (status === "Aktif" && r.status !== "Aktif") return false;
      if (status === "Segera" && r.status !== "Segera Kadaluarsa") return false;
      if (status === "Kadaluarsa" && r.status !== "Kadaluarsa") return false;
      if (status === "Diproses" && r.status !== "Diproses") return false;
      return true;
    });
  }, [allDocs, q, cat, status, jenisF, tujuanF]);

  const catChips = ["Semua", ...state.cats.map((c) => c.nama)];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: "0 0 4px" }}>Arsip Dokumen</h3>
          <div className="text-muted" style={{ fontSize: 13 }}>
            {rows.length} dari {allDocs.length} dokumen · diurutkan dari yang terbaru
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => router.push("/unggah")} style={{ marginLeft: "auto" }}>
          <UploadSimple size={16} />
          Unggah Dokumen
        </button>
      </div>

      <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-4)" }}>
        {/* search + selects */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
            <MagnifyingGlass size={15} style={{ position: "absolute", left: 10, top: 10, color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }} />
            <input className="input" placeholder="Cari nama dokumen, jenis, atau tujuan…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 31 }} />
          </div>
          <select className="input" value={jenisF} onChange={(e) => setJenisF(e.target.value)} style={{ width: 186 }}>
            <option>Semua jenis</option>
            {state.types.map((t) => <option key={t.id}>{t.nama}</option>)}
          </select>
          <select className="input" value={tujuanF} onChange={(e) => setTujuanF(e.target.value)} style={{ width: 170 }}>
            <option>Semua tujuan</option>
            {state.purposes.map((t) => <option key={t.id}>{t.nama}</option>)}
          </select>
          <button type="button" className="btn btn-secondary" onClick={resetFilter}>
            <ArrowCounterClockwise size={15} />
            Reset
          </button>
        </div>

        {/* chips */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 42%, transparent)", marginRight: 2 }}>Kategori</span>
            {catChips.map((c) => (
              <button key={c} type="button" onClick={() => setCat(c)} style={{ fontSize: 12, padding: "4px 11px", borderRadius: 999, cursor: "pointer", border: "none", ...chipStyle(cat === c) }}>{c}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginLeft: "auto" }}>
            <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 42%, transparent)", marginRight: 2 }}>Kondisi</span>
            {STATUS_CHIPS.map(([v, nama]) => (
              <button key={v} type="button" onClick={() => setStatus(v)} style={{ fontSize: 12, padding: "4px 11px", borderRadius: 999, cursor: "pointer", border: "none", ...chipStyle(status === v) }}>{nama}</button>
            ))}
          </div>
        </div>

        {/* table */}
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nama Dokumen</th>
                <th style={{ width: 150 }}>Kategori</th>
                <th style={{ width: 130 }}>Jenis</th>
                <th style={{ width: 112 }}>Tujuan</th>
                <th style={{ width: 118 }}>Kadaluarsa</th>
                <th style={{ width: 132 }}>Status</th>
                <th style={{ width: 76 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => router.push(`/arsip/${r.id}`)} style={{ cursor: "pointer" }}>
                  <td>
                    <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                      <FilePdf size={17} style={{ color: "var(--color-accent-400)", flex: "none" }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, maxWidth: 330, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.n}</div>
                        <div style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 42%, transparent)" }}>{r.o} · {r.s}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 12.5 }}>{r.k}</td>
                  <td style={{ fontSize: 12.5 }}>{r.j}</td>
                  <td style={{ fontSize: 12.5 }}>{r.t}</td>
                  <td style={{ fontSize: 12.5 }}>
                    {r.expText}
                    <div style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 42%, transparent)" }}>{r.sisa}</div>
                  </td>
                  <td><span className={`tag ${r.tag}`}>{r.status}</span></td>
                  <td style={{ textAlign: "right" }}><CaretRight size={15} style={{ color: "color-mix(in srgb, var(--color-text) 40%, transparent)" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div style={{ padding: "34px 0", textAlign: "center" }}>
            <FolderOpen size={30} style={{ color: "var(--color-neutral-700)", margin: "0 auto" }} />
            <div style={{ fontSize: 14, marginTop: 8 }}>Tidak ada dokumen yang cocok</div>
            <div className="text-muted" style={{ fontSize: 12.5 }}>Ubah kata kunci atau reset filter untuk melihat seluruh arsip.</div>
          </div>
        )}
      </div>
    </div>
  );
}
