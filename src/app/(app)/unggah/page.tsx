"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileArrowUp,
  BellRinging,
  FloppyDisk,
  FilePdf,
  FileImage,
  ArrowsClockwise,
  X,
  CheckCircle,
  Circle,
  ShieldCheck,
  HourglassMedium,
  WarningCircle,
  CalendarBlank,
  UploadSimple,
} from "@phosphor-icons/react";
import { KepalaHalaman, RONA_HALAMAN } from "@/components/arsiva/kepala";
import { useArsiva } from "@/components/arsiva/store";
import { TagKategori } from "@/components/arsiva/warna";
import { days, fmt } from "@/lib/arsiva";

const kosong = { nama: "", typeId: "", purposeId: "", categoryId: "", exp: "", ket: "" };

// Sama dengan assertUploadable() di src/lib/storage.ts — server tetap memeriksa ulang.
const MAKS_BYTE = 20 * 1024 * 1024;
const TIPE_BOLEH = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

function ukuran(b: number) {
  return b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
}

/** Tanggal ISO dikurangi n hari, dihitung di zona waktu lokal. */
function kurangiHari(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function UnggahPage() {
  const router = useRouter();
  const { state, threshold, canWrite, addDoc, say } = useArsiva();
  const [up, setUp] = React.useState(kosong);
  const [file, setFile] = React.useState<File | null>(null);
  const [urlPratinjau, setUrlPratinjau] = React.useState<string | null>(null);
  const [seret, setSeret] = React.useState(false);
  const [simpan, setSimpan] = React.useState(false);
  const inputFile = React.useRef<HTMLInputElement>(null);
  const urlRef = React.useRef<string | null>(null);

  // Lepaskan object URL pratinjau saat halaman ditinggalkan.
  React.useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const gantiBerkas = (f: File | null) => {
    if (f && !TIPE_BOLEH.includes(f.type)) return say("Format berkas harus PDF, JPG, PNG, atau WebP.");
    if (f && f.size > MAKS_BYTE) return say("Ukuran berkas melebihi 20 MB.");
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = f ? URL.createObjectURL(f) : null;
    setUrlPratinjau(urlRef.current);
    setFile(f);
    if (f) setUp((v) => ({ ...v, nama: v.nama || f.name.replace(/\.[^.]+$/, "") }));
    if (!f && inputFile.current) inputFile.current.value = "";
  };

  const bersihkan = () => {
    setUp(kosong);
    gantiBerkas(null);
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
        <KepalaHalaman ikon={UploadSimple} rona={RONA_HALAMAN.unggah} judul="Unggah Dokumen" />
        <div className="card elev-sm" style={{ padding: "var(--pad-kartu)" }}>
          <p className="text-muted" style={{ fontSize: "var(--t-ket)", margin: 0 }}>
            Peran Pembaca tidak memiliki wewenang mengunggah dokumen. Hubungi Admin bila Anda
            memerlukan akses ini.
          </p>
        </div>
      </div>
    );
  }

  /* ── pratinjau status: aturan yang sama dengan viewDoc() di arsiva.ts ── */
  const sisa = up.exp ? days(up.exp) : null;
  const status =
    sisa == null ? null
    : sisa < 0 ? { label: "Kadaluarsa", warna: "var(--color-danger)", teks: "var(--color-danger-text)", ikon: <WarningCircle size={18} weight="duotone" />, ket: `lewat ${Math.abs(sisa)} hari` }
    : sisa <= threshold ? { label: "Segera kadaluarsa", warna: "var(--color-accent-2-500)", teks: "var(--color-accent-2-300)", ikon: <HourglassMedium size={18} weight="duotone" />, ket: `${sisa} hari lagi` }
    : { label: "Aman", warna: "var(--color-accent-500)", teks: "var(--color-accent-200)", ikon: <ShieldCheck size={18} weight="duotone" />, ket: `${sisa} hari lagi` };
  const tglPengingat = up.exp ? kurangiHari(up.exp, threshold) : null;

  const nama = (id: string, daftar: { id: number; nama: string }[]) => daftar.find((x) => String(x.id) === id)?.nama;
  const periksa = [
    { label: "Nama dokumen", ok: !!up.nama.trim() },
    { label: "Jenis dokumen", ok: !!up.typeId },
    { label: "Kategori", ok: !!up.categoryId },
    { label: "Tanggal kadaluarsa", ok: !!up.exp },
    { label: "Berkas hasil scan", ok: !!file, opsional: true },
  ];
  const wajib = periksa.filter((p) => !p.opsional);
  const lengkap = wajib.filter((p) => p.ok).length;
  const siap = lengkap === wajib.length;
  const pdf = file?.type === "application/pdf";

  return (
    <div>
      <KepalaHalaman ikon={UploadSimple} rona={RONA_HALAMAN.unggah} judul="Unggah Dokumen" ket="Simpan hasil scan ke arsip dan lengkapi informasi pengelompokannya." />

      <div className="grid gap-4 items-start grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
        {/* ── KIRI: berkas ── */}
        <div className="lg:sticky" style={{ top: 84 }}>
          <input
            ref={inputFile} type="file" id="unggah-berkas"
            onChange={(e) => gantiBerkas(e.target.files?.[0] ?? null)}
            accept={TIPE_BOLEH.join(",")}
            style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
          />
          {!file ? (
            <label
              htmlFor="unggah-berkas"
              className="upload-drop dasbor-muncul"
              onDragOver={(e) => { e.preventDefault(); setSeret(true); }}
              onDragLeave={() => setSeret(false)}
              onDrop={(e) => { e.preventDefault(); setSeret(false); gantiBerkas(e.dataTransfer.files?.[0] ?? null); }}
              style={{
                minHeight: 460, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 14, padding: 28, textAlign: "center", cursor: "pointer", borderRadius: "var(--radius-lg)",
                border: `1.5px dashed ${seret ? "var(--color-accent)" : "var(--color-neutral-700)"}`,
                background: seret
                  ? "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface))"
                  : "radial-gradient(closest-side, color-mix(in srgb, var(--color-section-glow) 30%, transparent), transparent), var(--color-surface)",
                transition: "background 0.15s ease, border-color 0.15s ease",
              }}
            >
              <div className="dasbor-melayang" style={{ width: 84, height: 84, borderRadius: 24, display: "grid", placeItems: "center", color: "var(--color-accent-300)", background: "var(--color-accent-900)", boxShadow: "inset 0 0 0 1px var(--color-accent-800)" }}>
                <FileArrowUp size={40} weight="duotone" />
              </div>
              <div>
                <div style={{ fontSize: 16 }}>{seret ? "Lepaskan untuk mengunggah" : "Tarik berkas scan ke sini"}</div>
                <div style={{ fontSize: "var(--t-ket)", marginTop: 4, color: muted(62) }}>atau klik untuk memilih</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                {["PDF", "JPG", "PNG", "WebP", "≤ 20 MB"].map((t) => (
                  <span key={t} className="tag tag-neutral">{t}</span>
                ))}
              </div>
            </label>
          ) : (
            <div className="card elev-sm dasbor-muncul" style={{ padding: 0, gap: 0, overflow: "hidden" }}>
              <div style={{ height: 420, background: "var(--color-surface-2)", display: "grid", placeItems: "center" }}>
                {urlPratinjau && pdf ? (
                  <iframe src={`${urlPratinjau}#view=FitH`} title={`Pratinjau ${file.name}`} style={{ width: "100%", height: "100%", border: 0, background: "#fff" }} />
                ) : urlPratinjau ? (
                  // Pratinjau lokal (object URL) — belum diunggah ke mana pun.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urlPratinjau} alt={`Pratinjau ${file.name}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : null}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: "1px solid var(--color-divider)" }}>
                <span style={{ width: 36, height: 36, flex: "none", borderRadius: 10, display: "grid", placeItems: "center", background: "var(--color-accent-900)", color: "var(--color-accent-300)" }}>
                  {pdf ? <FilePdf size={19} /> : <FileImage size={19} />}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "var(--t-isi)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                  <div style={{ fontSize: "var(--t-ket)", color: muted(62) }}>{ukuran(file.size)} · siap diunggah</div>
                </div>
                <label htmlFor="unggah-berkas" className="btn btn-secondary btn-icon" title="Ganti berkas" aria-label="Ganti berkas" style={{ cursor: "pointer" }}>
                  <ArrowsClockwise size={16} />
                </label>
                <button type="button" className="btn btn-secondary btn-icon" onClick={() => gantiBerkas(null)} title="Hapus berkas" aria-label="Hapus berkas">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── KANAN: informasi + ringkasan ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card elev-sm dasbor-muncul" style={{ animationDelay: "80ms", padding: "var(--pad-kartu)", gap: "var(--space-4)" }}>
            <h5 style={{ margin: 0 }}>Informasi dokumen</h5>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="unggah-nama-dokumen">Nama dokumen</label>
                <input id="unggah-nama-dokumen"
                  className="input" placeholder="mis. Perjanjian Kerja Sama Layanan Notaris — Wardhani & Rekan"
                  value={up.nama} onChange={(e) => setUp((v) => ({ ...v, nama: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="unggah-jenis-dokumen">Jenis dokumen</label>
                <select id="unggah-jenis-dokumen" className="input" value={up.typeId} onChange={(e) => setUp((v) => ({ ...v, typeId: e.target.value }))}>
                  <option value="">Pilih jenis…</option>
                  {state.types.map((t) => <option key={t.id} value={String(t.id)}>{t.nama}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="unggah-tujuan-dokumen">Tujuan dokumen</label>
                <select id="unggah-tujuan-dokumen" className="input" value={up.purposeId} onChange={(e) => setUp((v) => ({ ...v, purposeId: e.target.value }))}>
                  <option value="">Pilih tujuan…</option>
                  {state.purposes.map((t) => <option key={t.id} value={String(t.id)}>{t.nama}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="unggah-kategori-label">Kategori / label</label>
                <select id="unggah-kategori-label" className="input" value={up.categoryId} onChange={(e) => setUp((v) => ({ ...v, categoryId: e.target.value }))}>
                  <option value="">Pilih kategori…</option>
                  {state.cats.map((c) => <option key={c.id} value={String(c.id)}>{c.nama}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="unggah-tanggal-kadaluarsa">Tanggal kadaluarsa</label>
                <input id="unggah-tanggal-kadaluarsa" className="input" type="date" value={up.exp} onChange={(e) => setUp((v) => ({ ...v, exp: e.target.value }))} />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="unggah-keterangan-tambahan-opsional">Keterangan tambahan (opsional)</label>
                <textarea id="unggah-keterangan-tambahan-opsional"
                  className="input" placeholder="Catatan singkat, nomor perjanjian, atau unit pemilik dokumen."
                  value={up.ket} onChange={(e) => setUp((v) => ({ ...v, ket: e.target.value }))}
                  style={{ minHeight: 74 }}
                />
              </div>
            </div>
          </div>

          {/* Pratinjau bagaimana dokumen akan tampil di arsip — dihitung dari isian, bukan disimpan */}
          <div className="card elev-sm dasbor-muncul" style={{ animationDelay: "160ms", padding: "var(--pad-kartu)", gap: "var(--space-4)" }}>
            <h5 style={{ margin: 0 }}>Pratinjau di arsip</h5>

            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ width: 40, height: 40, flex: "none", borderRadius: 12, display: "grid", placeItems: "center", color: status?.teks ?? muted(62), background: status ? `color-mix(in srgb, ${status.warna} 18%, transparent)` : "var(--color-surface-2)" }}>
                {status?.ikon ?? <CalendarBlank size={18} />}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "var(--t-isi)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: up.nama.trim() ? "var(--color-text)" : muted(55) }}>
                  {up.nama.trim() || "Nama dokumen"}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  {status && <span className="tag" style={{ background: `color-mix(in srgb, ${status.warna} 22%, transparent)`, color: status.teks }}>{status.label}</span>}
                  {nama(up.categoryId, state.cats) && <TagKategori nama={nama(up.categoryId, state.cats)!} />}
                  {nama(up.typeId, state.types) && <span className="tag tag-neutral">{nama(up.typeId, state.types)}</span>}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-surface-2)" }}>
                <div style={{ fontSize: "var(--t-ket)", color: muted(62) }}>Masa berlaku</div>
                <div style={{ fontSize: "var(--t-isi)", marginTop: 2, color: status?.teks }}>{status ? status.ket : "—"}</div>
              </div>
              <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-surface-2)" }} title={`Pengingat dikirim ${threshold} hari sebelum kadaluarsa`}>
                <div style={{ fontSize: "var(--t-ket)", color: muted(62), display: "flex", alignItems: "center", gap: 5 }}><BellRinging size={13} />Pengingat</div>
                {/* Sudah dalam ambang → cron mengirimnya pada jadwal berikutnya, bukan di tanggal yang telah lewat. */}
                <div style={{ fontSize: "var(--t-isi)", marginTop: 2 }}>
                  {!tglPengingat ? "—" : sisa != null && sisa <= threshold ? "Segera dikirim" : fmt(tglPengingat)}
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", fontSize: "var(--t-ket)", marginBottom: 6 }}>
                <span style={{ color: muted(70) }}>Kelengkapan</span>
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-heading)" }}>{lengkap}/{wajib.length}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--color-neutral-800)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(lengkap / wajib.length) * 100}%`, borderRadius: 3, background: siap ? "var(--color-ok)" : "var(--color-accent-500)", transition: "width 0.3s ease, background 0.3s ease" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", marginTop: 12 }}>
                {periksa.map((p) => (
                  <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "var(--t-ket)", color: p.ok ? "var(--color-text)" : muted(62) }}>
                    {p.ok ? <CheckCircle size={16} weight="fill" style={{ color: "var(--color-ok)", flex: "none" }} /> : <Circle size={16} style={{ flex: "none" }} />}
                    <span>
                      {p.label}
                      {p.opsional ? <span style={{ color: muted(55) }}> (opsional)</span> : null}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-divider)" }}>
              <button type="button" className="btn btn-secondary" onClick={bersihkan}>Kosongkan</button>
              <button type="button" className={`btn btn-primary${siap ? " btn-solid" : ""}`} onClick={() => void kirim()} disabled={simpan} style={{ flex: 1 }}>
                <FloppyDisk size={16} />
                {simpan ? "Menyimpan…" : "Simpan Dokumen"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
