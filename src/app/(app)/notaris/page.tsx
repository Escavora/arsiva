"use client";

import * as React from "react";
import { CalendarCheck, Phone, Trash, CalendarPlus, UserPlus } from "@phosphor-icons/react";
import { useArsiva, type ApiSchedule } from "@/components/arsiva/store";
import { fmt, initials } from "@/lib/arsiva";

function schedView(x: ApiSchedule) {
  return {
    ...x,
    tglText: fmt(x.tgl),
    tag: x.st === "Selesai" ? "tag-ok" : x.st === "Dibatalkan" ? "tag-danger" : "tag-accent",
    status: x.st,
    bisaBatal: x.st === "Direncanakan",
  };
}

export default function NotarisPage() {
  const { state, isAdmin, canWrite, setNotarisAktif, addNotaris, removeNotaris, addSchedule, cancelSchedule } = useArsiva();
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

  const schedAll = state.schedules.map(schedView);
  const jadwalRows = schedAll
    .filter((x) => x.notarisId === notarisAktif?.id)
    .sort((a, b) => (a.tgl < b.tgl ? 1 : -1));
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
      <h3 style={{ margin: "0 0 4px" }}>Jadwal Notaris</h3>
      <div className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
        Rekanan mitra notaris dan catatan jadwal kerja samanya.
      </div>

      {/* notaris cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(232px, 1fr))", gap: 12, marginBottom: 18 }}>
        {cards.map((n) => (
          <div
            key={n.id}
            role="button"
            tabIndex={0}
            onClick={() => setNotarisAktif(n.id)}
            className="card"
            style={{ gap: 7, cursor: "pointer", boxShadow: n.id === aktif ? "inset 0 0 0 1px var(--color-accent)" : "var(--shadow-sm)" }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 32, height: 32, flex: "none", borderRadius: "50%", background: "var(--color-accent-900)", color: "var(--color-accent-200)", display: "grid", placeItems: "center", fontSize: 12, fontFamily: "var(--font-heading)" }}>{n.inisial}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.nama}</div>
                <div style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 45%, transparent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.kantor}</div>
              </div>
            </div>
            <div className="card-meta" style={{ gap: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><CalendarCheck size={13} />{n.jumlahText}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Phone size={13} />{n.tel}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: "var(--space-2)", borderTop: "1px solid var(--color-divider)" }}>
              <span style={{ fontSize: 11, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "color-mix(in srgb, var(--color-text) 48%, transparent)" }}>{n.email}</span>
              {isAdmin && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={(e) => { e.stopPropagation(); void removeNotaris(n.id); }}
                  style={{ marginLeft: "auto", flex: "none", fontSize: 11.5, color: "var(--color-danger)" }}
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

      <div className="grid gap-4 items-start grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
        {/* jadwal table */}
        <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
            <h5 style={{ margin: 0 }}>Jadwal kerja sama — {notarisAktif?.nama}</h5>
            <span className="text-muted" style={{ marginLeft: "auto", fontSize: 12 }}>{notarisAktif?.kantor}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 118 }}>Tanggal</th>
                  <th>Agenda</th>
                  <th style={{ width: 124 }}>Status</th>
                  <th style={{ width: 92 }} />
                </tr>
              </thead>
              <tbody>
                {jadwalRows.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontSize: 12.5 }}>
                      {s.tglText}
                      <div style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 42%, transparent)" }}>{s.jam}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{s.agenda}</td>
                    <td><span className={`tag ${s.tag}`}>{s.status}</span></td>
                    <td style={{ textAlign: "right" }}>
                      {s.bisaBatal && (
                        <button type="button" className="btn btn-ghost" onClick={() => void cancelSchedule(s.id)} style={{ fontSize: 12, color: "var(--color-danger)" }}>Batalkan</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {jadwalRows.length === 0 && (
            <div className="text-muted" style={{ fontSize: 12.5, padding: "16px 0", textAlign: "center" }}>Belum ada jadwal kerja sama dengan mitra ini.</div>
          )}
        </div>

        {/* add schedule + add notaris + riwayat */}
        <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-4)" }}>
          <h5 style={{ margin: 0 }}>Tambah jadwal</h5>
          <div className="field">
            <label>Mitra notaris</label>
            <select className="input" value={sc.notarisId} onChange={(e) => setSc((v) => ({ ...v, notarisId: e.target.value }))}>
              {state.notaris.map((n) => <option key={n.id} value={String(n.id)}>{n.nama}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Agenda kerja sama</label>
            <input className="input" placeholder="mis. Penandatanganan akta fidusia" value={sc.agenda} onChange={(e) => setSc((v) => ({ ...v, agenda: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 108px", gap: "var(--space-3)" }}>
            <div className="field"><label>Tanggal</label><input className="input" type="date" value={sc.tanggal} onChange={(e) => setSc((v) => ({ ...v, tanggal: e.target.value }))} /></div>
            <div className="field"><label>Waktu</label><input className="input" type="time" value={sc.jam} onChange={(e) => setSc((v) => ({ ...v, jam: e.target.value }))} /></div>
          </div>
          <button type="button" className="btn btn-primary btn-block" onClick={() => void simpanJadwal()} disabled={!canWrite}>
            <CalendarPlus size={16} />
            Simpan Jadwal
          </button>

          <div style={{ paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-divider)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div>
              <h5 style={{ margin: "0 0 2px" }}>Tambah mitra notaris</h5>
              <div className="text-muted" style={{ fontSize: 12 }}>Daftarkan rekanan baru agar bisa dijadwalkan.</div>
            </div>
            <div className="field" style={{ margin: 0 }}><label>Nama notaris</label><input className="input" placeholder="mis. Farid Hakim, S.H., M.Kn." value={nn.nama} onChange={(e) => setNn((v) => ({ ...v, nama: e.target.value }))} /></div>
            <div className="field" style={{ margin: 0 }}><label>Kantor / wilayah</label><input className="input" placeholder="mis. Hakim & Rekan · Pekanbaru" value={nn.kantor} onChange={(e) => setNn((v) => ({ ...v, kantor: e.target.value }))} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
              <div className="field" style={{ margin: 0 }}><label>Email</label><input className="input" placeholder="nama@kantor.co.id" value={nn.email} onChange={(e) => setNn((v) => ({ ...v, email: e.target.value }))} /></div>
              <div className="field" style={{ margin: 0 }}><label>No. telepon</label><input className="input" placeholder="0761-xxx-xxx" value={nn.tel} onChange={(e) => setNn((v) => ({ ...v, tel: e.target.value }))} /></div>
            </div>
            <button type="button" className="btn btn-secondary btn-block" onClick={() => void simpanNotaris()} disabled={!isAdmin} style={{ margin: 0 }}>
              <UserPlus size={16} />
              Tambah Mitra
            </button>
          </div>

          <div style={{ paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-divider)" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 45%, transparent)", marginBottom: 8 }}>Riwayat kerja sama</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {riwayatJadwal.map((h) => (
                <div key={h.id} style={{ display: "flex", gap: 8, fontSize: 12, alignItems: "baseline" }}>
                  <span style={{ color: "color-mix(in srgb, var(--color-text) 45%, transparent)", flex: "none", width: 74 }}>{h.tglText}</span>
                  <span style={{ minWidth: 0 }}>{h.agenda}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
