"use client";

import * as React from "react";
import { Info, Plus, X, FloppyDisk } from "@phosphor-icons/react";
import { useArsiva } from "@/components/arsiva/store";
import { useKonfirmasi } from "@/components/arsiva/konfirmasi";

export default function KategoriPage() {
  const { state, isAdmin, addCategory, removeCategory, updateCategory, addType, removeType, addPurpose, removePurpose, say } = useArsiva();
  const { minta, dialog: dialogKonfirmasi } = useKonfirmasi();
  const isStaf = !isAdmin;

  const [nc, setNc] = React.useState({ nama: "", desk: "" });
  const [newType, setNewType] = React.useState("");
  const [newPurpose, setNewPurpose] = React.useState("");

  const [editKat, setEditKat] = React.useState<{ id: number; nama: string; desk: string } | null>(null);
  const [menyimpan, setMenyimpan] = React.useState(false);

  const simpanEditKat = async () => {
    if (!editKat) return;
    if (!editKat.nama.trim()) return say("Nama kategori wajib diisi.");
    setMenyimpan(true);
    const ok = await updateCategory(editKat.id, { nama: editKat.nama.trim(), desk: editKat.desk.trim() });
    setMenyimpan(false);
    if (ok) setEditKat(null);
  };

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
      <h3 style={{ margin: "0 0 4px" }}>Kategori &amp; Jenis</h3>
      <div className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
        Master data kategori, jenis, dan tujuan dokumen yang muncul pada form unggah.
      </div>

      {isStaf && (
        <div style={{ display: "flex", gap: 9, alignItems: "center", padding: "11px 14px", marginBottom: 16, borderRadius: "var(--radius-md)", background: "var(--color-accent-2-900)", boxShadow: "inset 0 0 0 1px var(--color-accent-2-800)", fontSize: 12.5 }}>
          <Info size={16} style={{ color: "var(--color-accent-2-400)", flex: "none" }} />
          Peran Team Member hanya dapat melihat master data. Hubungi Admin untuk perubahan kategori.
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
                          <button type="button" className="btn btn-ghost" onClick={() => setEditKat({ id: c.id, nama: c.nama, desk: c.desk })} style={{ fontSize: 12 }}>Ubah</button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => minta({
                              judul: "Hapus kategori ini?",
                              isi: (
                                <>
                                  Kategori <strong style={{ color: "var(--color-text)" }}>{c.nama}</strong> akan dihapus.
                                  {c.jumlah > 0 ? ` ${c.jumlah} dokumen yang memakainya tidak ikut terhapus, tetapi akan menjadi tanpa kategori.` : ""}
                                </>
                              ),
                              tombol: "Hapus Kategori",
                              aksi: () => removeCategory(c.id),
                            })}
                            style={{ fontSize: 12, color: "var(--color-danger-text)" }}
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 items-end" style={{ gridTemplateColumns: "1fr 1.2fr auto", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-divider)" }}>
            <div className="field" style={{ margin: 0 }}><label htmlFor="kategori-kategori-baru">Kategori baru</label><input id="kategori-kategori-baru" className="input" placeholder="mis. Perjanjian Sewa" value={nc.nama} onChange={(e) => setNc((v) => ({ ...v, nama: e.target.value }))} /></div>
            <div className="field" style={{ margin: 0 }}><label htmlFor="kategori-keterangan">Keterangan</label><input id="kategori-keterangan" className="input" placeholder="Keterangan singkat" value={nc.desk} onChange={(e) => setNc((v) => ({ ...v, desk: e.target.value }))} /></div>
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
                    <button
                      type="button"
                      className="chip-hapus"
                      aria-label={`Hapus jenis ${t.nama}`}
                      title={`Hapus jenis ${t.nama}`}
                      onClick={() => minta({
                        judul: "Hapus jenis dokumen ini?",
                        isi: <>Jenis <strong style={{ color: "var(--color-text)" }}>{t.nama}</strong> akan dihapus. Dokumen yang memakainya tidak ikut terhapus, tetapi akan menjadi tanpa jenis.</>,
                        tombol: "Hapus Jenis",
                        aksi: () => removeType(t.id),
                      })}
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" aria-label="Nama jenis dokumen baru" placeholder="Tambah jenis…" value={newType} onChange={(e) => setNewType(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void tambahType(); }} />
              <button type="button" className="btn btn-secondary" onClick={() => void tambahType()} disabled={!isAdmin} style={{ flex: "none" }} aria-label="Tambah jenis dokumen" title="Tambah jenis dokumen"><Plus size={15} /></button>
            </div>
          </div>
          <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
            <h5 style={{ margin: 0 }}>Tujuan dokumen</h5>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {state.purposes.map((t) => (
                <span key={t.id} className="tag tag-neutral" style={{ gap: 7, padding: "5px 10px", fontSize: 12 }}>
                  {t.nama}
                  {isAdmin && (
                    <button
                      type="button"
                      className="chip-hapus"
                      aria-label={`Hapus tujuan ${t.nama}`}
                      title={`Hapus tujuan ${t.nama}`}
                      onClick={() => minta({
                        judul: "Hapus tujuan dokumen ini?",
                        isi: <>Tujuan <strong style={{ color: "var(--color-text)" }}>{t.nama}</strong> akan dihapus. Dokumen yang memakainya tidak ikut terhapus, tetapi akan menjadi tanpa tujuan.</>,
                        tombol: "Hapus Tujuan",
                        aksi: () => removePurpose(t.id),
                      })}
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" aria-label="Nama tujuan dokumen baru" placeholder="Tambah tujuan…" value={newPurpose} onChange={(e) => setNewPurpose(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void tambahPurpose(); }} />
              <button type="button" className="btn btn-secondary" onClick={() => void tambahPurpose()} disabled={!isAdmin} style={{ flex: "none" }} aria-label="Tambah tujuan dokumen" title="Tambah tujuan dokumen"><Plus size={15} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog: ubah kategori */}
      {editKat && (
        <div className="dialog-backdrop" onClick={() => !menyimpan && setEditKat(null)}>
          <div className="dialog" style={{ width: "min(440px, 100%)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <h5 style={{ margin: 0 }}>Ubah kategori</h5>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setEditKat(null)} style={{ marginLeft: "auto" }} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>

            <div className="field">
              <label htmlFor="kategori-nama-kategori">Nama kategori</label>
              <input id="kategori-nama-kategori"
                className="input"
                value={editKat.nama}
                onChange={(e) => setEditKat((v) => (v ? { ...v, nama: e.target.value } : v))}
              />
            </div>
            <div className="field">
              <label htmlFor="kategori-keterangan-2">Keterangan</label>
              <input id="kategori-keterangan-2"
                className="input"
                placeholder="Keterangan singkat"
                value={editKat.desk}
                onChange={(e) => setEditKat((v) => (v ? { ...v, desk: e.target.value } : v))}
              />
            </div>

            <div className="text-muted" style={{ fontSize: 11.5 }}>
              Dokumen yang sudah memakai kategori ini akan ikut memperlihatkan nama barunya.
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 2 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditKat(null)} disabled={menyimpan}>Batal</button>
              <button type="button" className="btn btn-primary" onClick={() => void simpanEditKat()} disabled={menyimpan}>
                <FloppyDisk size={15} />
                {menyimpan ? "Menyimpan…" : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {dialogKonfirmasi}
    </div>
  );
}
