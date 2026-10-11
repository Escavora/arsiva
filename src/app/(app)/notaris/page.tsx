"use client";

import * as React from "react";
import {
  CalendarCheck,
  Phone,
  Trash,
  CalendarPlus,
  UserPlus,
  CalendarDots,
} from "@phosphor-icons/react";
import { KepalaHalaman, RONA_HALAMAN } from "@/components/arsiva/kepala";
import { useArsiva, type ApiSchedule } from "@/components/arsiva/store";
import { useKonfirmasi } from "@/components/arsiva/konfirmasi";
import { fmt, initials, todayISO } from "@/lib/arsiva";

function schedView(x: ApiSchedule, hariIni: string) {
  // Jadwal "Direncanakan" yang tanggalnya sudah lewat belum diperbarui siapa pun: tandai agar terlihat.
  const terlewat = x.st === "Direncanakan" && x.tgl < hariIni;
  return {
    ...x,
    tglText: fmt(x.tgl),
    tag: terlewat ? "tag-warn" : x.st === "Selesai" ? "tag-ok" : x.st === "Dibatalkan" ? "tag-danger" : "tag-accent",
    status: terlewat ? "Terlewat" : x.st,
    akanDatang: x.st === "Direncanakan" && !terlewat,
    bisaBatal: x.st === "Direncanakan",
  };
}

/** Jadwal mendatang lebih dulu (terdekat di atas), lalu sisanya dari yang terbaru. */
function urutJadwal(a: { tgl: string; akanDatang: boolean }, b: { tgl: string; akanDatang: boolean }) {
  if (a.akanDatang !== b.akanDatang) return a.akanDatang ? -1 : 1;
  return a.akanDatang ? a.tgl.localeCompare(b.tgl) : b.tgl.localeCompare(a.tgl);
}

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** Ubin tanggal (bahasa yang sama dengan Jadwal di dasbor), berona status jadwalnya. */
function UbinTanggal({ iso, status, label }: { iso: string; status: string; label: string }) {
  const [th, bl, hr] = iso.slice(0, 10).split("-");
  const rona =
    status === "Terlewat" ? "var(--color-accent-2-500)"
    : status === "Selesai" ? "var(--color-ok)"
    : status === "Dibatalkan" ? "var(--color-danger)"
    : RONA_HALAMAN.notaris;
  return (
    <div
      title={label}
      style={{
        width: 52, textAlign: "center", padding: "6px 0", borderRadius: "var(--radius-md)",
        background: `color-mix(in srgb, ${rona} 16%, var(--color-surface))`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${rona} 42%, transparent)`,
        opacity: status === "Dibatalkan" ? 0.7 : 1,
      }}
    >
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 600, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{Number(hr)}</div>
      <div style={{ fontSize: "var(--t-label)", marginTop: 3, color: "color-mix(in srgb, var(--color-text) 78%, transparent)" }}>{BULAN[Number(bl) - 1]} {th.slice(2)}</div>
    </div>
  );
}

export default function NotarisPage() {
  const { state, isAdmin, canWrite, setNotarisAktif, addNotaris, removeNotaris, addSchedule, cancelSchedule } = useArsiva();
  const { minta, dialog: dialogKonfirmasi } = useKonfirmasi();
  const aktif = state.notarisAktif;

  const [sc, setSc] = React.useState({ notarisId: "", agenda: "", tanggal: "", jam: "10:00" });
  const [nn, setNn] = React.useState({ nama: "", kantor: "", email: "", tel: "" });

  // Selaraskan pilihan mitra pada form dengan kartu yang sedang aktif.
  React.useEffect(() => {
    if (aktif != null) setSc((v) => ({ ...v, notarisId: String(aktif) }));
  }, [aktif]);

  const cards = state.notaris.map((n) => ({
    ...n,
    inisial: initials(n.nama),
    jumlahText: `${n.jumlahJadwal} jadwal`,
  }));

  const notarisAktif = state.notaris.find((n) => n.id === aktif) ?? state.notaris[0];

  const hariIni = todayISO();
  const schedAll = state.schedules.map((x) => schedView(x, hariIni));
  const jadwalRows = schedAll
    .filter((x) => x.notarisId === notarisAktif?.id)
    .sort(urutJadwal);
  const riwayatJadwal = schedAll
    .filter((x) => x.st !== "Direncanakan")
    .sort((a, b) => (a.tgl < b.tgl ? 1 : -1))
    .slice(0, 4);

  const simpanJadwal = async () => {
    const nid = Number(sc.notarisId || notarisAktif?.id);
    if (!nid) return;
    const ok = await addSchedule({ notarisId: nid, agenda: sc.agenda, tgl: sc.tanggal, jam: sc.jam || "09:00" });
    if (ok) {
      setNotarisAktif(nid);
      setSc((v) => ({ ...v, agenda: "" }));
    }
  };

  const simpanNotaris = async () => {
    if (await addNotaris(nn)) setNn({ nama: "", kantor: "", email: "", tel: "" });
  };

  return (
    <div>
      <KepalaHalaman ikon={CalendarDots} rona={RONA_HALAMAN.notaris} judul="Jadwal Notaris" ket="Rekanan mitra notaris dan catatan jadwal kerja samanya." />

      {/* notaris cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: "var(--jarak-blok)" }}>
        {cards.map((n) => (
          <div
            key={n.id}
            role="button"
            tabIndex={0}
            aria-pressed={n.id === aktif}
            onClick={() => setNotarisAktif(n.id)}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return; // jangan bajak Enter pada tombol Hapus di dalamnya
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setNotarisAktif(n.id); }
            }}
            className="card"
            style={{ gap: 7, cursor: "pointer", boxShadow: n.id === aktif ? "inset 0 0 0 1px var(--color-accent)" : "var(--shadow-sm)" }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 32, height: 32, flex: "none", borderRadius: "50%", background: "var(--color-accent-900)", color: "var(--color-accent-200)", display: "grid", placeItems: "center", fontSize: "var(--t-ket)", fontFamily: "var(--font-heading)" }}>{n.inisial}</div>
              <div style={{ minWidth: 0 }}>
                <div title={n.nama} style={{ fontSize: "var(--t-isi)", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{n.nama}</div>
                <div style={{ fontSize: "var(--t-label)", color: "color-mix(in srgb, var(--color-text) 62%, transparent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.kantor}</div>
              </div>
            </div>
            <div className="card-meta" style={{ gap: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><CalendarCheck size={13} />{n.jumlahText}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Phone size={13} />{n.tel}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto", paddingTop: "var(--space-2)", borderTop: "1px solid var(--color-divider)" }}>
              <span title={n.email} style={{ fontSize: "var(--t-label)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>{n.email}</span>
              {isAdmin && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    minta({
                      judul: "Hapus mitra notaris ini?",
                      isi: (
                        <>
                          <strong style={{ color: "var(--color-text)" }}>{n.nama}</strong>
                          {n.jumlahJadwal > 0 ? ` beserta ${n.jumlahJadwal} jadwal kerja samanya` : ""} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                        </>
                      ),
                      tombol: "Hapus Mitra",
                      aksi: () => removeNotaris(n.id),
                    });
                  }}
                  style={{ marginLeft: "auto", flex: "none", fontSize: "var(--t-label)", color: "var(--color-danger-text)" }}
                  title="Hapus mitra notaris"
                >
                  <Trash size={13} />
                  Hapus
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 items-start grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* jadwal table */}
        <div className="card elev-sm" style={{ padding: "var(--pad-kartu)", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
            <h5 style={{ margin: 0 }}>Jadwal kerja sama — {notarisAktif?.nama}</h5>
            <span className="text-muted" style={{ marginLeft: "auto", fontSize: "var(--t-ket)" }}>{notarisAktif?.kantor}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table table-kartu table-kartu-jadwal">
              <thead>
                <tr>
                  <th style={{ width: 84 }}>Tanggal</th>
                  <th>Agenda</th>
                  <th style={{ width: 124 }}>Status</th>
                  <th style={{ width: 92 }} />
                </tr>
              </thead>
              <tbody>
                {jadwalRows.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <UbinTanggal iso={s.tgl} status={s.status} label={s.tglText} />
                    </td>
                    <td>
                      <div style={{ fontSize: "var(--t-isi)" }}>{s.agenda}</div>
                      <div style={{ fontSize: "var(--t-ket)", marginTop: 2, color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>{s.tglText} · pukul {s.jam}</div>
                    </td>
                    <td data-label="Status"><span className={`tag ${s.tag}`}>{s.status}</span></td>
                    <td style={{ textAlign: "right" }}>
                      {s.bisaBatal && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => minta({
                            judul: "Batalkan jadwal ini?",
                            isi: (
                              <>
                                <strong style={{ color: "var(--color-text)" }}>{s.agenda}</strong> pada {s.tglText} pukul {s.jam} akan ditandai Dibatalkan dan tidak bisa diaktifkan kembali.
                              </>
                            ),
                            tombol: "Batalkan Jadwal",
                            aksi: () => cancelSchedule(s.id),
                          })}
                          style={{ fontSize: "var(--t-ket)", color: "var(--color-danger-text)" }}
                        >
                          Batalkan
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {jadwalRows.length === 0 && (
            <div className="text-muted" style={{ fontSize: "var(--t-ket)", padding: "16px 0", textAlign: "center" }}>Belum ada jadwal kerja sama dengan mitra ini.</div>
          )}
          {riwayatJadwal.length > 0 && (
            <div style={{ paddingTop: "var(--space-4)", borderTop: "1px solid var(--color-divider)" }}>
              <div style={{ fontSize: "var(--t-label)", letterSpacing: "0.08em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 62%, transparent)", marginBottom: 8 }}>Riwayat kerja sama</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {riwayatJadwal.map((h) => (
                  <div key={h.id} style={{ display: "flex", gap: 8, fontSize: "var(--t-ket)", alignItems: "baseline" }}>
                    <span style={{ color: "color-mix(in srgb, var(--color-text) 62%, transparent)", flex: "none", width: 74 }}>{h.tglText}</span>
                    <span style={{ minWidth: 0 }}>{h.agenda}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* kanan: dua tugas terpisah, tiap tugas satu kartu */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--jarak-blok)" }}>
        <div className="card elev-sm" style={{ padding: "var(--pad-kartu)", gap: "var(--space-4)" }}>
          <h5 style={{ margin: 0 }}>Tambah jadwal</h5>
          <div className="field">
            <label htmlFor="notaris-mitra-notaris">Mitra notaris</label>
            <select id="notaris-mitra-notaris" className="input" value={sc.notarisId} onChange={(e) => setSc((v) => ({ ...v, notarisId: e.target.value }))}>
              {state.notaris.map((n) => <option key={n.id} value={String(n.id)}>{n.nama}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="notaris-agenda-kerja-sama">Agenda kerja sama</label>
            <input id="notaris-agenda-kerja-sama" className="input" placeholder="mis. Penandatanganan akta fidusia" value={sc.agenda} onChange={(e) => setSc((v) => ({ ...v, agenda: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 108px", gap: "var(--space-3)" }}>
            <div className="field"><label htmlFor="notaris-tanggal">Tanggal</label><input id="notaris-tanggal" className="input" type="date" value={sc.tanggal} onChange={(e) => setSc((v) => ({ ...v, tanggal: e.target.value }))} /></div>
            <div className="field"><label htmlFor="notaris-waktu">Waktu</label><input id="notaris-waktu" className="input" type="time" value={sc.jam} onChange={(e) => setSc((v) => ({ ...v, jam: e.target.value }))} /></div>
          </div>
          <button type="button" className="btn btn-primary btn-block" onClick={() => void simpanJadwal()} disabled={!canWrite}>
            <CalendarPlus size={16} />
            Simpan Jadwal
          </button>
        </div>

        <div className="card elev-sm" style={{ padding: "var(--pad-kartu)", gap: "var(--space-3)" }}>
            <div>
              <h5 style={{ margin: "0 0 2px" }}>Tambah mitra notaris</h5>
              <div className="text-muted" style={{ fontSize: "var(--t-ket)" }}>Daftarkan rekanan baru agar bisa dijadwalkan.</div>
            </div>
            <div className="field" style={{ margin: 0 }}><label htmlFor="notaris-nama-notaris">Nama notaris</label><input id="notaris-nama-notaris" className="input" placeholder="mis. Farid Hakim, S.H., M.Kn." value={nn.nama} onChange={(e) => setNn((v) => ({ ...v, nama: e.target.value }))} /></div>
            <div className="field" style={{ margin: 0 }}><label htmlFor="notaris-kantor-wilayah">Kantor / wilayah</label><input id="notaris-kantor-wilayah" className="input" placeholder="mis. Hakim & Rekan · Pekanbaru" value={nn.kantor} onChange={(e) => setNn((v) => ({ ...v, kantor: e.target.value }))} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
              <div className="field" style={{ margin: 0 }}><label htmlFor="notaris-email">Email</label><input id="notaris-email" className="input" placeholder="nama@kantor.co.id" value={nn.email} onChange={(e) => setNn((v) => ({ ...v, email: e.target.value }))} /></div>
              <div className="field" style={{ margin: 0 }}><label htmlFor="notaris-no-telepon">No. telepon</label><input id="notaris-no-telepon" className="input" placeholder="0761-xxx-xxx" value={nn.tel} onChange={(e) => setNn((v) => ({ ...v, tel: e.target.value }))} /></div>
            </div>
            <button type="button" className="btn btn-secondary btn-block" onClick={() => void simpanNotaris()} disabled={!isAdmin} style={{ margin: 0 }}>
              <UserPlus size={16} />
              Tambah Mitra
            </button>
          </div>
        </div>
      </div>

      {dialogKonfirmasi}
    </div>
  );
}
