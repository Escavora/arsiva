"use client";

import * as React from "react";
import {
  LockKey,
  PaperPlaneTilt,
  Copy,
  ArrowSquareOut,
  Check,
  Info,
  Broom,
  WarningCircle,
  ShareNetwork,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { KepalaHalaman, Memuat, RONA_HALAMAN } from "@/components/arsiva/kepala";
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

/**
 * Cincin sisa masa berlaku: motif yang sama dengan peragaan tautan di landing page.
 * Aktif = sisa waktu nyata (dibuat → kadaluarsa); dicabut = merah kosong; kadaluarsa = kosong.
 */
function CincinSisa({ status, persen }: { status: string; persen: number }) {
  const mati = status === "Dicabut";
  return (
    <div
      aria-hidden="true"
      className={`tautan-cincin tautan-cincin-kecil tautan-cincin-masuk${mati ? " tautan-cincin-mati" : ""}`}
      style={{ ["--tautan-p" as string]: `${status === "Aktif" ? Math.max(3, persen) : 0}%` }}
    >
      <span className="tautan-cincin-isi">
        {status === "Aktif" ? <ShareNetwork size={14} weight="fill" style={{ color: "var(--kat-ungu-teks)" }} /> : <LockKey size={13} weight="fill" style={{ color: mati ? "var(--color-danger-text)" : "var(--color-neutral-600)" }} />}
      </span>
    </div>
  );
}

// useSearchParams perlu batas Suspense agar halaman tetap bisa di-prerender.
export default function BagikanPage() {
  return (
    <React.Suspense fallback={null}>
      <BagikanIsi />
    </React.Suspense>
  );
}

function BagikanIsi() {
  const { allDocs, state, canWrite, isAdmin, addShare, revokeShare, clearShares, say } = useArsiva();
  const params = useSearchParams();

  // ?doc=<id> dari tombol "Bagikan" di halaman detail langsung memilih dokumennya.
  const [docId, setDocId] = React.useState(() => params.get("doc") ?? "");
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

  // Satu titik waktu per kunjungan halaman, cukup untuk menghitung sisa hari.
  const [kini] = React.useState(() => Date.now());
  const shareRows = React.useMemo(
    () =>
      state.shares.map((s) => {
        const mulai = new Date(s.dibuat).getTime();
        const akhir = new Date(s.exp).getTime();
        const sisaHari = Math.max(0, Math.ceil((akhir - kini) / 86400000));
        return {
        ...s,
        persen: akhir > mulai ? ((akhir - kini) / (akhir - mulai)) * 100 : 0,
        sisaText: s.status === "Aktif" ? (sisaHari <= 1 ? "berakhir hari ini" : `${sisaHari} hari lagi`) : s.status === "Dicabut" ? "akses dicabut" : "masa berlaku habis",
        expText: fmtShort(s.exp.slice(0, 10)),
        dibuatText: fmtShort(s.dibuat.slice(0, 10)),
        tag: s.status === "Aktif" ? "tag-ok" : s.status === "Dicabut" ? "tag-danger" : "tag-neutral",
        };
      }),
    [state.shares, kini],
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
      <KepalaHalaman ikon={ShareNetwork} rona={RONA_HALAMAN.bagikan} judul="Bagikan Dokumen" ket="Buat tautan aman untuk rekanan atau notaris, dan cabut aksesnya kapan pun." />

      <div className="grid gap-4 items-start grid-cols-1 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)]">
        {/* buat tautan */}
        <div className="card elev-sm" style={{ padding: "var(--pad-kartu)", gap: "var(--space-4)" }}>
          <h5 style={{ margin: 0, minHeight: 36, display: "flex", alignItems: "center" }}>Buat tautan baru</h5>

          <div className="field">
            <label htmlFor="bagikan-dokumen">Dokumen</label>
            <select id="bagikan-dokumen" className="input" value={docId} onChange={(e) => setDocId(e.target.value)} disabled={!canWrite}>
              <option value="">Pilih dokumen…</option>
              {allDocs.map((d) => (
                <option key={d.id} value={String(d.id)}>{d.n}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label id="bagikan-tipe-penerima">Tipe penerima</label>
            <div role="radiogroup" aria-labelledby="bagikan-tipe-penerima" style={{ display: "flex", gap: 16, paddingTop: 2 }}>
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
            <label htmlFor="bagikan-email-penerima">Email penerima</label>
            <input id="bagikan-email-penerima"
              className="input" type="email" placeholder="nama@kantornotaris.co.id"
              value={email} onChange={(e) => setEmail(e.target.value)} disabled={!canWrite}
            />
          </div>

          <div className="field">
            <label htmlFor="bagikan-masa-berlaku-tautan">Masa berlaku tautan</label>
            <select id="bagikan-masa-berlaku-tautan" className="input" value={hari} onChange={(e) => setHari(e.target.value)} disabled={!canWrite}>
              <option value="3">3 hari</option>
              <option value="7">7 hari</option>
              <option value="14">14 hari</option>
              <option value="30">30 hari</option>
            </select>
          </div>

          <div style={{ fontSize: "var(--t-ket)", color: "color-mix(in srgb, var(--color-text) 62%, transparent)", display: "flex", gap: 7 }}>
            <LockKey size={15} style={{ flex: "none", marginTop: 1 }} />
            <span>Tautan memakai token acak yang tidak bisa ditebak dan otomatis mati saat masa berlaku habis. Siapa pun yang memegang tautan dapat membukanya, jadi kirim hanya ke penerima yang dituju.</span>
          </div>

          <button type="button" className="btn btn-primary btn-solid btn-block" onClick={() => void submit()} disabled={!canWrite || kirim} style={{ minHeight: 42 }}>
            <PaperPlaneTilt size={16} />
            {kirim ? "Membuat…" : "Buat Tautan Aman"}
          </button>

          {!canWrite && (
            <div className="text-muted" style={{ fontSize: "var(--t-label)" }}>
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
              <div style={{ fontSize: "var(--t-ket)", color: "var(--color-accent-100)" }}>
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
                  style={{ fontSize: "var(--t-ket)", fontFamily: "ui-monospace, monospace" }}
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
              <div style={{ display: "flex", gap: 7, fontSize: "var(--t-label)", color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>
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
        <div className="card elev-sm" style={{ padding: "var(--pad-kartu)", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", minHeight: 36 }}>
            <h5 style={{ margin: 0 }}>Riwayat tautan</h5>
            <span className="text-muted" style={{ marginLeft: "auto", fontSize: "var(--t-ket)" }}>{aktifText}</span>
            {isAdmin && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setBersihOpen(true)}
                disabled={jumlahTidakAktif === 0}
                title={jumlahTidakAktif === 0 ? "Tidak ada tautan tidak aktif" : "Hapus tautan dicabut & kadaluarsa"}
                style={{ marginLeft: 12, fontSize: "var(--t-ket)" }}
              >
                <Broom size={14} />
                Bersihkan
              </button>
            )}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table table-kartu">
              <thead>
                <tr>
                  <th>Penerima</th>
                  <th style={{ width: 150 }}>Dokumen</th>
                  <th style={{ width: 180 }}>Masa berlaku</th>
                  <th style={{ width: 120 }} />
                </tr>
              </thead>
              <tbody>
                {shareRows.map((s) => (
                  <tr key={s.id}>
                    <td className="sel-lentur">
                      <div title={s.email} style={{ fontSize: "var(--t-ket)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.email}</div>
                      <div style={{ fontSize: "var(--t-label)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>
                        {s.tipe} · dibuat {s.dibuatText}
                      </div>
                    </td>
                    <td data-label="Dokumen" style={{ fontSize: "var(--t-ket)" }}>
                      <div style={{ maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.doc}</div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <CincinSisa status={s.status} persen={s.persen} />
                        <div style={{ minWidth: 0 }}>
                          <span className={`tag ${s.tag}`}>{s.status}</span>
                          <div style={{ fontSize: "var(--t-label)", marginTop: 3, color: s.status === "Aktif" ? "var(--color-text)" : "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>
                            {s.sisaText} · s.d. {s.expText}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {s.status === "Aktif" && (
                        <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                          <button
                            type="button" className="btn btn-ghost" style={{ fontSize: "var(--t-ket)" }}
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
                              style={{ fontSize: "var(--t-ket)", color: "var(--color-danger-text)" }}
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
          {!state.siap.shares && <Memuat teks="Memuat riwayat tautan…" />}
          {state.siap.shares && shareRows.length === 0 && (
            <div className="text-muted" style={{ fontSize: "var(--t-ket)", padding: "16px 0", textAlign: "center" }}>
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
                <div className="text-muted" style={{ fontSize: "var(--t-ket)" }}>
                  <strong style={{ color: "var(--color-text)" }}>{jumlahTidakAktif} tautan</strong> yang sudah dicabut atau kadaluarsa akan dihapus permanen dari riwayat. Tautan yang masih <strong style={{ color: "var(--color-text)" }}>aktif tetap dipertahankan</strong>.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 2 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setBersihOpen(false)} disabled={membersihkan}>Batal</button>
              <button type="button" className="btn btn-danger" onClick={() => void bersihkan()} disabled={membersihkan}>
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
