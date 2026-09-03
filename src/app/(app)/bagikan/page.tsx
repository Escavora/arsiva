"use client";

import * as React from "react";
import { LockKey, PaperPlaneTilt, Copy, ArrowSquareOut, Check, Info, Broom, WarningCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useArsiva } from "@/components/arsiva/store";
import { fmtShort } from "@/lib/arsiva";

/** Menyalin teks ke papan klip, dengan cadangan bila Clipboard API diblokir. */
async function salinTeks(teks: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(teks);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = teks;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function BagikanPage() {
  const { allDocs, state, canWrite, isAdmin, addShare, revokeShare, clearShares, say } = useArsiva();

  const [docId, setDocId] = React.useState("");
  const [tipe, setTipe] = React.useState<"Notaris" | "Rekanan">("Notaris");
  const [email, setEmail] = React.useState("");
  const [hari, setHari] = React.useState("7");
  const [kirim, setKirim] = React.useState(false);
  const [bersihOpen, setBersihOpen] = React.useState(false);
  const [membersihkan, setMembersihkan] = React.useState(false);

  // Tautan yang baru saja dibuat, ditampilkan agar bisa langsung disalin.
  const [hasil, setHasil] = React.useState<{
    url: string;
    email: string;
    terkirim: boolean;
    driver: string;
  } | null>(null);
  const [tersalin, setTersalin] = React.useState<string | null>(null);

  const salin = async (url: string, penanda: string) => {
    if (await salinTeks(url)) {
      setTersalin(penanda);
      toast.success("Tautan disalin ke papan klip.");
      setTimeout(() => setTersalin((v) => (v === penanda ? null : v)), 2000);
    } else {
      toast.error("Gagal menyalin. Salin manual dari kotak tautan.");
    }
  };

  /** URL publik sebuah tautan berbagi, dibangun dari token. */
  const urlTautan = (token: string) =>
    typeof window === "undefined" ? `/s/${token}` : `${window.location.origin}/s/${token}`;

  const shareRows = React.useMemo(
    () =>
      state.shares.map((s) => ({
        ...s,
        expText: fmtShort(s.exp.slice(0, 10)),
        dibuatText: fmtShort(s.dibuat.slice(0, 10)),
        tag: s.status === "Aktif" ? "tag-ok" : s.status === "Dicabut" ? "tag-danger" : "tag-neutral",
      })),
    [state.shares],
  );

  const aktifText = `${shareRows.filter((x) => x.status === "Aktif").length} tautan aktif`;
  const jumlahTidakAktif = shareRows.filter((x) => x.status !== "Aktif").length;

  const bersihkan = async () => {
    setMembersihkan(true);
    await clearShares();
    setMembersihkan(false);
    setBersihOpen(false);
  };

  const submit = async () => {
    if (!docId) return say("Pilih dokumen terlebih dahulu.");
    if (!email.trim()) return say("Isi email penerima.");
    setKirim(true);
    const res = await addShare({
      documentId: Number(docId),
      email: email.trim(),
      tipe,
      hari: Number(hari),
    });
    setKirim(false);
    if (res) {
      setHasil({
        url: res.url,
        email: email.trim(),
        terkirim: res.email.terkirim,
        driver: res.email.driver,
      });
      setDocId("");
      setEmail("");
    }
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 4px" }}>Bagikan Dokumen</h3>
      <div className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
        Buat tautan aman untuk rekanan atau notaris, dan cabut aksesnya kapan pun.
      </div>

      <div className="grid gap-4 items-start grid-cols-1 lg:grid-cols-[1fr_1.35fr]">
        {/* buat tautan */}
        <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-4)" }}>
          <h5 style={{ margin: 0 }}>Buat tautan baru</h5>

          <div className="field">
            <label>Dokumen</label>
            <select className="input" value={docId} onChange={(e) => setDocId(e.target.value)} disabled={!canWrite}>
              <option value="">Pilih dokumen…</option>
              {allDocs.map((d) => (
                <option key={d.id} value={String(d.id)}>{d.n}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Tipe penerima</label>
            <div style={{ display: "flex", gap: 16, paddingTop: 2 }}>
              <label className="radio">
                <input type="radio" name="tipe" checked={tipe === "Notaris"} onChange={() => setTipe("Notaris")} />
                <span className="dot" />
                Notaris
              </label>
              <label className="radio">
                <input type="radio" name="tipe" checked={tipe === "Rekanan"} onChange={() => setTipe("Rekanan")} />
                <span className="dot" />
                Rekanan
              </label>
            </div>
          </div>

          <div className="field">
            <label>Email penerima</label>
            <input
              className="input" type="email" placeholder="nama@kantornotaris.co.id"
              value={email} onChange={(e) => setEmail(e.target.value)} disabled={!canWrite}
            />
          </div>

          <div className="field">
            <label>Masa berlaku tautan</label>
            <select className="input" value={hari} onChange={(e) => setHari(e.target.value)} disabled={!canWrite}>
              <option value="3">3 hari</option>
              <option value="7">7 hari</option>
              <option value="14">14 hari</option>
              <option value="30">30 hari</option>
            </select>
          </div>

          <div style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 55%, transparent)", display: "flex", gap: 7 }}>
            <LockKey size={15} style={{ flex: "none", marginTop: 1 }} />
            <span>Tautan memakai token unik, hanya bisa dibuka oleh penerima, dan otomatis mati saat masa berlaku habis.</span>
          </div>

          <button type="button" className="btn btn-primary btn-block" onClick={() => void submit()} disabled={!canWrite || kirim}>
            <PaperPlaneTilt size={16} />
            {kirim ? "Membuat…" : "Buat Tautan Aman"}
          </button>

          {!canWrite && (
            <div className="text-muted" style={{ fontSize: 11.5 }}>
              Peran Pembaca tidak dapat membuat tautan berbagi.
            </div>
          )}

          {/* hasil: tautan siap disalin */}
          {hasil && (
            <div
              style={{
                display: "flex", flexDirection: "column", gap: 9,
                padding: "12px 13px", borderRadius: "var(--radius-md)",
                background: "var(--color-accent-900)",
                boxShadow: "inset 0 0 0 1px var(--color-accent-700)",
              }}
            >
              <div style={{ fontSize: 12.5, color: "var(--color-accent-100)" }}>
                {hasil.terkirim ? (
                  <>Tautan sudah <strong>dikirim ke email</strong> {hasil.email}.</>
                ) : (
                  <>Tautan untuk <strong>{hasil.email}</strong> sudah dibuat.</>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  className="input" readOnly value={hasil.url}
                  onFocus={(e) => e.currentTarget.select()}
                  style={{ fontSize: 12, fontFamily: "ui-monospace, monospace" }}
                />
                <button
                  type="button" className="btn btn-secondary" style={{ flex: "none" }}
                  onClick={() => void salin(hasil.url, "baru")} title="Salin tautan"
                >
                  {tersalin === "baru" ? <Check size={15} /> : <Copy size={15} />}
                </button>
                <a
                  className="btn btn-secondary" style={{ flex: "none" }}
                  href={hasil.url} target="_blank" rel="noreferrer" title="Buka tautan"
                >
                  <ArrowSquareOut size={15} />
                </a>
              </div>
              <div style={{ display: "flex", gap: 7, fontSize: 11.5, color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>
                <Info size={14} style={{ flex: "none", marginTop: 1 }} />
                <span>
                  {hasil.terkirim
                    ? "Penerima sudah mendapat email berisi tautan ini. Salin bila perlu mengirimnya ulang."
                    : hasil.driver === "log"
                      ? "Pengiriman email otomatis belum aktif — salin tautan ini dan kirim sendiri ke penerima."
                      : "Email gagal terkirim, tetapi tautannya tetap berlaku — salin dan kirim manual ke penerima."}
                  {" "}
                  {typeof window !== "undefined" && window.location.hostname === "localhost" &&
                    "Alamat localhost hanya bisa dibuka dari komputer ini."}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* riwayat */}
        <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <h5 style={{ margin: 0 }}>Riwayat tautan</h5>
            <span className="text-muted" style={{ marginLeft: "auto", fontSize: 12 }}>{aktifText}</span>
            {isAdmin && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setBersihOpen(true)}
                disabled={jumlahTidakAktif === 0}
                title={jumlahTidakAktif === 0 ? "Tidak ada tautan tidak aktif" : "Hapus tautan dicabut & kadaluarsa"}
                style={{ marginLeft: 12, fontSize: 12 }}
              >
                <Broom size={14} />
                Bersihkan
              </button>
            )}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Penerima</th>
                  <th style={{ width: 170 }}>Dokumen</th>
                  <th style={{ width: 100 }}>Berlaku s.d.</th>
                  <th style={{ width: 96 }}>Status</th>
                  <th style={{ width: 120 }} />
                </tr>
              </thead>
              <tbody>
                {shareRows.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontSize: 13 }}>{s.email}</div>
                      <div style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 42%, transparent)" }}>
                        {s.tipe} · dibuat {s.dibuatText}
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <div style={{ maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.doc}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{s.expText}</td>
                    <td><span className={`tag ${s.tag}`}>{s.status}</span></td>
                    <td style={{ textAlign: "right" }}>
                      {s.status === "Aktif" && (
                        <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                          <button
                            type="button" className="btn btn-ghost" style={{ fontSize: 12 }}
                            onClick={() => void salin(urlTautan(s.token), `row-${s.id}`)}
                            title="Salin tautan"
                          >
                            {tersalin === `row-${s.id}` ? <Check size={14} /> : <Copy size={14} />}
                            Salin
                          </button>
                          {canWrite && (
                            <button
                              type="button" className="btn btn-ghost"
                              onClick={() => void revokeShare(s.id)}
                              style={{ fontSize: 12, color: "var(--color-danger)" }}
                            >
                              Cabut
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {shareRows.length === 0 && (
            <div className="text-muted" style={{ fontSize: 12.5, padding: "16px 0", textAlign: "center" }}>
              Belum ada tautan berbagi yang dibuat.
            </div>
          )}
        </div>
      </div>

      {/* Dialog: konfirmasi bersihkan riwayat */}
      {bersihOpen && (
        <div className="dialog-backdrop" onClick={() => !membersihkan && setBersihOpen(false)}>
          <div className="dialog" style={{ width: "min(420px, 100%)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, flex: "none", borderRadius: "var(--radius-md)", background: "var(--color-danger-800)", color: "var(--color-danger-100)", display: "grid", placeItems: "center" }}>
                <WarningCircle size={19} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h5 style={{ margin: "0 0 4px" }}>Bersihkan riwayat tautan?</h5>
                <div className="text-muted" style={{ fontSize: 12.5 }}>
                  <strong style={{ color: "var(--color-text)" }}>{jumlahTidakAktif} tautan</strong> yang sudah dicabut atau kadaluarsa akan dihapus permanen dari riwayat. Tautan yang masih <strong style={{ color: "var(--color-text)" }}>aktif tetap dipertahankan</strong>.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 2 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setBersihOpen(false)} disabled={membersihkan}>Batal</button>
              <button type="button" className="btn btn-primary" onClick={() => void bersihkan()} disabled={membersihkan} style={{ color: "var(--color-danger)", borderColor: "var(--color-danger)" }}>
                <Broom size={15} />
                {membersihkan ? "Membersihkan…" : "Bersihkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
