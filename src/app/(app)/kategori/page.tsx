"use client";

import * as React from "react";
import { Info, Plus, X } from "@phosphor-icons/react";
import { useArsiva } from "@/components/arsiva/store";

export default function KategoriPage() {
  const { state, isAdmin, addCategory, removeCategory, editCategory, addType, removeType, addPurpose, removePurpose } = useArsiva();
  const isStaf = !isAdmin;

  const [nc, setNc] = React.useState({ nama: "", desk: "" });
  const [newType, setNewType] = React.useState("");
  const [newPurpose, setNewPurpose] = React.useState("");

  const catRows = state.cats;

  const tambahKategori = async () => {
    if (!nc.nama.trim()) return;
    if (await addCategory(nc.nama.trim(), nc.desk)) setNc({ nama: "", desk: "" });
  };
  const tambahType = async () => {
    if (!newType.trim()) return;
    if (await addType(newType.trim())) setNewType("");
  };
  const tambahPurpose = async () => {
    if (!newPurpose.trim()) return;
    if (await addPurpose(newPurpose.trim())) setNewPurpose("");
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 4px" }}>Kategori &amp; Jenis/Tujuan</h3>
      <div className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
        Master data pengelompokan dokumen yang muncul pada form unggah.
      </div>

      {isStaf && (
        <div style={{ display: "flex", gap: 9, alignItems: "center", padding: "11px 14px", marginBottom: 16, borderRadius: "var(--radius-md)", background: "var(--color-accent-2-900)", boxShadow: "inset 0 0 0 1px var(--color-accent-2-800)", fontSize: 12.5 }}>
          <Info size={16} style={{ color: "var(--color-accent-2-400)", flex: "none" }} />
          Peran Staf Legal hanya dapat melihat master data. Hubungi Admin untuk perubahan kategori.
        </div>
      )}

      <div className="grid gap-4 items-start grid-cols-1 lg:grid-cols-[1.4fr_1fr]">
        {/* categories */}
        <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
          <h5 style={{ margin: 0 }}>Kategori dokumen</h5>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nama kategori</th>
                  <th>Keterangan</th>
                  <th style={{ width: 74 }}>Dokumen</th>
                  <th style={{ width: 112 }} />
                </tr>
              </thead>
              <tbody>
                {catRows.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontSize: 13.5 }}>{c.nama}</td>
                    <td style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>{c.desk}</td>
                    <td style={{ fontSize: 12.5 }}>{c.jumlah}</td>
                    <td style={{ textAlign: "right" }}>
                      {isAdmin && (
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          <button type="button" className="btn btn-ghost" onClick={() => editCategory(c.id)} style={{ fontSize: 12 }}>Ubah</button>
                          <button type="button" className="btn btn-ghost" onClick={() => void removeCategory(c.id)} style={{ fontSize: 12, color: "var(--color-danger)" }}>Hapus</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 items-end" style={{ gridTemplateColumns: "1fr 1.2fr auto", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-divider)" }}>
            <div className="field" style={{ margin: 0 }}><label>Kategori baru</label><input className="input" placeholder="mis. Perjanjian Sewa" value={nc.nama} onChange={(e) => setNc((v) => ({ ...v, nama: e.target.value }))} /></div>
            <div className="field" style={{ margin: 0 }}><label>Keterangan</label><input className="input" placeholder="Keterangan singkat" value={nc.desk} onChange={(e) => setNc((v) => ({ ...v, desk: e.target.value }))} /></div>
            <button type="button" className="btn btn-primary" onClick={() => void tambahKategori()} disabled={!isAdmin}>
              <Plus size={15} />
              Tambah
            </button>
          </div>
        </div>

        {/* types + purposes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
            <h5 style={{ margin: 0 }}>Jenis dokumen</h5>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {state.types.map((t) => (
                <span key={t.id} className="tag tag-neutral" style={{ gap: 7, padding: "5px 10px", fontSize: 12 }}>
                  {t.nama}
                  {isAdmin && (
                    <X size={12} role="button" tabIndex={0} onClick={() => void removeType(t.id)} style={{ cursor: "pointer", opacity: 0.6 }} />
                  )}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" placeholder="Tambah jenis…" value={newType} onChange={(e) => setNewType(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void tambahType(); }} />
              <button type="button" className="btn btn-secondary" onClick={() => void tambahType()} disabled={!isAdmin} style={{ flex: "none" }}><Plus size={15} /></button>
            </div>
          </div>
          <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
            <h5 style={{ margin: 0 }}>Tujuan dokumen</h5>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {state.purposes.map((t) => (
                <span key={t.id} className="tag tag-neutral" style={{ gap: 7, padding: "5px 10px", fontSize: 12 }}>
                  {t.nama}
                  {isAdmin && (
                    <X size={12} role="button" tabIndex={0} onClick={() => void removePurpose(t.id)} style={{ cursor: "pointer", opacity: 0.6 }} />
                  )}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" placeholder="Tambah tujuan…" value={newPurpose} onChange={(e) => setNewPurpose(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void tambahPurpose(); }} />
              <button type="button" className="btn btn-secondary" onClick={() => void tambahPurpose()} disabled={!isAdmin} style={{ flex: "none" }}><Plus size={15} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
