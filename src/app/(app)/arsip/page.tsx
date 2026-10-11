"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MagnifyingGlass,
  UploadSimple,
  ArrowCounterClockwise,
  FilePdf,
  CaretRight,
  FolderOpen,
  Folders,
} from "@phosphor-icons/react";
import { KepalaHalaman, RONA_HALAMAN } from "@/components/arsiva/kepala";
import { useArsiva } from "@/components/arsiva/store";
import { LabelKategori, TitikKategori, useRonaKategori } from "@/components/arsiva/warna";

function chipStyle(active: boolean): React.CSSProperties {
  return active
    ? { color: "var(--color-accent-100)", background: "var(--color-accent-800)", boxShadow: "inset 0 0 0 1px var(--color-accent-600)" }
    : { color: "color-mix(in srgb, var(--color-text) 68%, transparent)", background: "transparent", boxShadow: "inset 0 0 0 1px var(--color-divider)" };
}

const STATUS_CHIPS: [string, string][] = [
  ["Semua", "Semua"],
  ["Aman", "Aman"],
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
  // ?status= dari ubin dashboard (Aman | Segera | Kadaluarsa | Diproses).
  const [status, setStatus] = React.useState(() => {
    const s = searchParams.get("status");
    return s && STATUS_CHIPS.some(([v]) => v === s) ? s : "Semua";
  });
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
      if (status === "Aman" && r.status !== "Aman") return false;
      if (status === "Segera" && r.status !== "Segera kadaluarsa") return false;
      if (status === "Kadaluarsa" && r.status !== "Kadaluarsa") return false;
      if (status === "Diproses" && r.status !== "Diproses") return false;
      return true;
    });
  }, [allDocs, q, cat, status, jenisF, tujuanF]);

  const catChips = ["Semua", ...state.cats.map((c) => c.nama)];
  const rona = useRonaKategori();

  return (
    <div>
      <KepalaHalaman
        ikon={Folders}
        rona={RONA_HALAMAN.arsip}
        judul="Arsip Dokumen"
        ket={<><strong style={{ color: "var(--color-text)", fontWeight: 600 }}>{rows.length}</strong> dari {allDocs.length} dokumen · diurutkan dari yang terbaru</>}
        aksi={
          <Link className="btn btn-primary btn-solid" href="/unggah">
            <UploadSimple size={16} />
            Unggah Dokumen
          </Link>
        }
      />

      <div className="card elev-sm" style={{ padding: "var(--pad-kartu)", gap: "var(--space-4)" }}>
        {/* search + selects */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
            <MagnifyingGlass size={15} style={{ position: "absolute", left: 10, top: 10, color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }} />
            <input className="input" aria-label="Cari dokumen" placeholder="Cari nama dokumen, jenis, atau tujuan…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 31 }} />
          </div>
          <select className="input" aria-label="Filter jenis dokumen" value={jenisF} onChange={(e) => setJenisF(e.target.value)} style={{ width: 186 }}>
            <option>Semua jenis</option>
            {state.types.map((t) => <option key={t.id}>{t.nama}</option>)}
          </select>
          <select className="input" aria-label="Filter tujuan dokumen" value={tujuanF} onChange={(e) => setTujuanF(e.target.value)} style={{ width: 170 }}>
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
          <div className="chip-baris" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "var(--t-label)", letterSpacing: "0.08em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 62%, transparent)", marginRight: 2 }}>Kategori</span>
            {catChips.map((c) => (
              <button
                key={c}
                type="button"
                className="chip-saring"
                aria-pressed={cat === c}
                onClick={() => setCat(c)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: "var(--t-ket)", padding: "4px 11px", borderRadius: 999, cursor: "pointer", border: "none",
                  ...chipStyle(cat === c),
                  // chip kategori yang aktif memakai rona kategorinya sendiri
                  ...(cat === c && c !== "Semua" ? { color: rona(c).teks, background: rona(c).latar, boxShadow: `inset 0 0 0 1px ${rona(c).tepi}` } : null),
                }}
              >
                {c !== "Semua" && <TitikKategori nama={c} size={7} />}
                {c}
              </button>
            ))}
          </div>
          <div className="chip-baris" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginLeft: "auto" }}>
            <span style={{ fontSize: "var(--t-label)", letterSpacing: "0.08em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 62%, transparent)", marginRight: 2 }}>Status</span>
            {STATUS_CHIPS.map(([v, nama]) => (
              <button key={v} type="button" className="chip-saring" onClick={() => setStatus(v)} style={{ fontSize: "var(--t-ket)", padding: "4px 11px", borderRadius: 999, cursor: "pointer", border: "none", ...chipStyle(status === v) }}>{nama}</button>
            ))}
          </div>
        </div>

        {/* table */}
        <div style={{ overflowX: "auto" }}>
          <table className="table table-kartu">
            <thead>
              <tr>
                <th>Nama Dokumen</th>
                <th className="hidden md:table-cell" style={{ width: 178 }}>Kategori</th>
                <th className="hidden xl:table-cell" style={{ width: 130 }}>Jenis</th>
                <th className="hidden xl:table-cell" style={{ width: 112 }}>Tujuan</th>
                <th className="hidden md:table-cell" style={{ width: 118 }}>Kadaluarsa</th>
                <th style={{ width: 132 }}>Status</th>
                <th className="hidden md:table-cell" style={{ width: 76 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="baris-tautan">
                  <td className="sel-lentur">
                    <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                      {/* ubin berkas berona kategori: baris sekategori langsung terlihat berkelompok */}
                      <span title={r.k} style={{ width: 30, height: 30, flex: "none", borderRadius: 7, display: "grid", placeItems: "center", background: rona(r.k).latar, color: rona(r.k).teks }}>
                        <FilePdf size={16} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div className="judul-baris" style={{ fontSize: "var(--t-isi)", maxWidth: "min(330px, 40vw)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <Link href={`/arsip/${r.id}`} className="tautan-baris">{r.n}</Link>
                        </div>
                        <div style={{ fontSize: "var(--t-label)", color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>{r.o} · {r.s}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Kategori" className="hidden md:table-cell"><LabelKategori nama={r.k} /></td>
                  <td className="hidden xl:table-cell" style={{ fontSize: "var(--t-ket)" }}>{r.j}</td>
                  <td className="hidden xl:table-cell" style={{ fontSize: "var(--t-ket)" }}>{r.t}</td>
                  <td data-label="Kadaluarsa" className="hidden md:table-cell" style={{ fontSize: "var(--t-ket)" }}>
                    {r.expText}
                    <div style={{ fontSize: "var(--t-label)", color: r.sisaC === "inherit" ? "color-mix(in srgb, var(--color-text) 62%, transparent)" : r.sisaC }}>{r.sisa}</div>
                  </td>
                  <td data-label="Status"><span className={`tag ${r.tag}`}>{r.status}</span></td>
                  <td className="hidden md:table-cell" style={{ textAlign: "right" }}><CaretRight size={15} style={{ color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div style={{ padding: "34px 0", textAlign: "center" }}>
            <FolderOpen size={30} style={{ color: "var(--color-neutral-700)", margin: "0 auto" }} />
            <div style={{ fontSize: "var(--t-isi)", marginTop: 8 }}>Tidak ada dokumen yang cocok</div>
            <div className="text-muted" style={{ fontSize: "var(--t-ket)" }}>Ubah kata kunci atau reset filter untuk melihat seluruh arsip.</div>
          </div>
        )}
      </div>
    </div>
  );
}
