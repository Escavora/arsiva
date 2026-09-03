"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileArrowUp, BellRinging, FloppyDisk } from "@phosphor-icons/react";
import { useArsiva } from "@/components/arsiva/store";

const kosong = { nama: "", typeId: "", purposeId: "", categoryId: "", exp: "", ket: "" };

export default function UnggahPage() {
  const router = useRouter();
  const { state, threshold, canWrite, addDoc, say } = useArsiva();
  const [up, setUp] = React.useState(kosong);
  const [file, setFile] = React.useState<File | null>(null);
  const [simpan, setSimpan] = React.useState(false);
  const inputFile = React.useRef<HTMLInputElement>(null);

  const pilihFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) setUp((v) => ({ ...v, nama: v.nama || f.name.replace(/\.[^.]+$/, "") }));
  };

  const bersihkan = () => {
    setUp(kosong);
    setFile(null);
    if (inputFile.current) inputFile.current.value = "";
  };

  const kirim = async () => {
    if (!up.nama.trim()) return say("Isi nama dokumen terlebih dahulu.");
    if (!up.typeId) return say("Pilih jenis dokumen.");
    if (!up.categoryId) return say("Pilih kategori dokumen.");
    if (!up.exp) return say("Isi tanggal kadaluarsa.");

    const fd = new FormData();
    fd.set("nama", up.nama.trim());
    fd.set("categoryId", up.categoryId);
    fd.set("typeId", up.typeId);
    if (up.purposeId) fd.set("purposeId", up.purposeId);
    fd.set("exp", up.exp);
    fd.set("ket", up.ket);
    if (file) fd.set("file", file);

    setSimpan(true);
    const ok = await addDoc(fd);
    setSimpan(false);
    if (ok) {
      bersihkan();
      router.push("/arsip");
    }
  };

  if (!canWrite) {
    return (
      <div style={{ maxWidth: 640 }}>
        <h3 style={{ margin: "0 0 4px" }}>Unggah Dokumen</h3>
        <div className="card elev-sm" style={{ padding: "var(--space-6)" }}>
          <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
            Peran Pembaca tidak memiliki wewenang mengunggah dokumen. Hubungi Admin bila Anda
            memerlukan akses ini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 880 }}>
      <h3 style={{ margin: "0 0 4px" }}>Unggah Dokumen</h3>
      <div className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
        Simpan hasil scan ke arsip dan lengkapi informasi pengelompokannya.
      </div>

      <div className="card elev-sm" style={{ padding: "var(--space-6)", gap: "var(--space-6)" }}>
        {/* langkah 1 */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 45%, transparent)", marginBottom: 9 }}>
            1 · Berkas hasil scan
          </div>
          <label className="upload-drop" style={{ display: "flex", gap: 14, alignItems: "center", padding: 18, borderRadius: "var(--radius-md)", border: "1px dashed var(--color-neutral-700)", cursor: "pointer", background: "var(--color-surface-2)" }}>
            <input
              ref={inputFile} type="file" onChange={pilihFile}
              accept="application/pdf,image/jpeg,image/png,image/webp"
              style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
            />
            <div style={{ width: 42, height: 42, flex: "none", borderRadius: "var(--radius-md)", background: "var(--color-accent-900)", color: "var(--color-accent-300)", display: "grid", placeItems: "center" }}>
              <FileArrowUp size={21} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14 }}>{file ? file.name : "Belum ada berkas dipilih"}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                PDF, JPG, atau PNG hasil scan · maksimal 20 MB per berkas
              </div>
            </div>
            <span className="btn btn-secondary" style={{ flex: "none" }}>Pilih File</span>
          </label>
        </div>

        {/* langkah 2 */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 45%, transparent)", marginBottom: 9 }}>
            2 · Informasi dokumen
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Nama dokumen</label>
              <input
                className="input" placeholder="mis. Perjanjian Kerja Sama Layanan Notaris — Wardhani & Rekan"
                value={up.nama} onChange={(e) => setUp((v) => ({ ...v, nama: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Jenis dokumen</label>
              <select className="input" value={up.typeId} onChange={(e) => setUp((v) => ({ ...v, typeId: e.target.value }))}>
                <option value="">Pilih jenis…</option>
                {state.types.map((t) => <option key={t.id} value={String(t.id)}>{t.nama}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Tujuan dokumen</label>
              <select className="input" value={up.purposeId} onChange={(e) => setUp((v) => ({ ...v, purposeId: e.target.value }))}>
                <option value="">Pilih tujuan…</option>
                {state.purposes.map((t) => <option key={t.id} value={String(t.id)}>{t.nama}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Kategori / label</label>
              <select className="input" value={up.categoryId} onChange={(e) => setUp((v) => ({ ...v, categoryId: e.target.value }))}>
                <option value="">Pilih kategori…</option>
                {state.cats.map((c) => <option key={c.id} value={String(c.id)}>{c.nama}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Tanggal kadaluarsa</label>
              <input className="input" type="date" value={up.exp} onChange={(e) => setUp((v) => ({ ...v, exp: e.target.value }))} />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Keterangan tambahan (opsional)</label>
              <textarea
                className="input" placeholder="Catatan singkat, nomor perjanjian, atau unit pemilik dokumen."
                value={up.ket} onChange={(e) => setUp((v) => ({ ...v, ket: e.target.value }))}
                style={{ minHeight: 74 }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: "var(--space-2)", borderTop: "1px solid var(--color-divider)", flexWrap: "wrap" }}>
          <div className="text-muted" style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <BellRinging size={14} />
            Pengingat otomatis dikirim {threshold} hari sebelum tanggal kadaluarsa.
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={bersihkan}>Kosongkan</button>
            <button type="button" className="btn btn-primary" onClick={() => void kirim()} disabled={simpan}>
              <FloppyDisk size={16} />
              {simpan ? "Menyimpan…" : "Simpan Dokumen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
