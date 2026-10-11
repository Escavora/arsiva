"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  HourglassMedium,
  WarningCircle,
  CheckCircle,
  UploadSimple,
  FileArrowDown,
  ArrowRight,
  ArrowUpRight,
  FilePdf,
  CalendarBlank,
  Sparkle,
} from "@phosphor-icons/react";
import { useArsiva } from "@/components/arsiva/store";
import { Memuat } from "@/components/arsiva/kepala";
import { LabelKategori, useRonaKategori } from "@/components/arsiva/warna";
import { fmt, MONTHS, todayISO } from "@/lib/arsiva";

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

/** Angka yang "menghitung naik" ke nilai barunya (mis. 0 → 14 saat data selesai dimuat). */
function useHitung(target: number, durasi = 700) {
  const [nilai, setNilai] = React.useState(target);
  const dariRef = React.useRef(target);
  React.useEffect(() => {
    const dari = dariRef.current;
    dariRef.current = target;
    if (dari === target) return;
    const langsung = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mulai = performance.now();
    let id = 0;
    const langkah = (t: number) => {
      const p = langsung ? 1 : Math.min(1, (t - mulai) / durasi);
      setNilai(Math.round(dari + (target - dari) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) id = requestAnimationFrame(langkah);
    };
    id = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(id);
  }, [target, durasi]);
  return nilai;
}

/* ───────────────────────── Ilustrasi ───────────────────────── */

/** Tumpukan dokumen dengan lencana perisai — ilustrasi hero, murni SVG + token warna. */
function IlustrasiArsip() {
  const kertas = { fill: "var(--color-surface-2)", stroke: "color-mix(in srgb, var(--color-text) 18%, transparent)", strokeWidth: 1.5 };
  const garis = { stroke: "color-mix(in srgb, var(--color-text) 22%, transparent)", strokeWidth: 3, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 220 160" width="220" height="160" aria-hidden="true" className="dasbor-melayang" style={{ maxWidth: "100%", height: "auto" }}>
      <g transform="rotate(-9 90 90)"><rect x="40" y="26" width="92" height="112" rx="10" style={kertas} /></g>
      <g transform="rotate(5 110 86)"><rect x="66" y="20" width="92" height="112" rx="10" style={kertas} /></g>
      <g>
        <rect x="52" y="30" width="96" height="116" rx="11" style={{ ...kertas, fill: "var(--color-surface)" }} />
        <rect x="52" y="30" width="96" height="22" rx="11" style={{ fill: "var(--color-accent-800)" }} />
        <rect x="52" y="41" width="96" height="11" style={{ fill: "var(--color-accent-800)" }} />
        <circle cx="66" cy="41" r="4" style={{ fill: "var(--color-accent-400)" }} />
        <line x1="66" y1="68" x2="132" y2="68" style={garis} />
        <line x1="66" y1="82" x2="120" y2="82" style={garis} />
        <line x1="66" y1="96" x2="128" y2="96" style={garis} />
        <line x1="66" y1="110" x2="104" y2="110" style={garis} />
      </g>
      <g>
        <circle cx="152" cy="116" r="26" style={{ fill: "var(--color-ok-800)", stroke: "var(--color-ok)", strokeWidth: 2 }} />
        <path d="M152 101 l12 5 v9 c0 8 -5.5 13 -12 16 c-6.5 -3 -12 -8 -12 -16 v-9 z" style={{ fill: "var(--color-ok)" }} />
        <path d="M146.5 116.5 l4 4 l7.5 -8" style={{ fill: "none", stroke: "var(--color-ok-800)", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }} />
      </g>
      <circle cx="176" cy="38" r="5" style={{ fill: "var(--color-accent-2-500)" }} />
      <circle cx="30" cy="62" r="3.5" style={{ fill: "var(--color-accent-500)" }} />
      <circle cx="190" cy="80" r="2.5" style={{ fill: "var(--color-accent-300)" }} />
    </svg>
  );
}

/** Lingkaran lembut berikon untuk keadaan kosong. */
function Kosong({ ikon, judul, warna = "var(--color-ok)", children }: { ikon: React.ReactNode; judul: string; warna?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8, padding: "18px 8px" }}>
      <div className="dasbor-melayang" style={{ width: 56, height: 56, borderRadius: "50%", display: "grid", placeItems: "center", color: warna, background: `color-mix(in srgb, ${warna} 14%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${warna} 35%, transparent)` }}>
        {ikon}
      </div>
      <div style={{ fontSize: "var(--t-isi)" }}>{judul}</div>
      {children}
    </div>
  );
}

/* ───────────────────────── Potongan ───────────────────────── */

type Ubin = { kunci: string; label: string; nilai: number; warna: string; teks: string; ikon: React.ReactNode };

function UbinStatus({ u, total, i }: { u: Ubin; total: number; i: number }) {
  const nilai = useHitung(u.nilai);
  const pct = total ? Math.round((u.nilai / total) * 100) : 0;
  return (
    <Link
      href={`/arsip?status=${u.kunci}`}
      className="card dasbor-ubin dasbor-muncul"
      aria-label={`${u.nilai} dokumen ${u.label.toLowerCase()} — lihat di arsip`}
      style={{
        animationDelay: `${80 + i * 60}ms`,
        ["--ubin-tepi" as string]: `color-mix(in srgb, ${u.warna} 55%, transparent)`,
        padding: "var(--space-4)", gap: 12,
        background: `linear-gradient(155deg, color-mix(in srgb, ${u.warna} 14%, var(--color-surface)) 0%, var(--color-surface) 70%)`,
        boxShadow: "inset 0 0 0 1px var(--color-divider)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", color: u.teks, background: `color-mix(in srgb, ${u.warna} 18%, transparent)` }}>
          {u.ikon}
        </span>
        <ArrowUpRight size={16} className="dasbor-panah" style={{ marginLeft: "auto", color: u.teks }} />
      </div>
      <div>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 34, lineHeight: 1, letterSpacing: "-0.03em", color: u.teks }}>{nilai}</div>
        <div style={{ fontSize: "var(--t-ket)", marginTop: 6, color: muted(78) }}>{u.label}</div>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "var(--color-neutral-800)", overflow: "hidden" }} title={`${pct}% dari seluruh arsip`}>
        <div className="dasbor-isi" style={{ animationDelay: `${300 + i * 60}ms`, height: "100%", width: `${pct}%`, borderRadius: 3, background: u.warna }} />
      </div>
    </Link>
  );
}

const R = 64;
const KELILING = 2 * Math.PI * R;

function CincinKepatuhan({ segmen, pct }: { segmen: { nama: string; v: number; fill: string }[]; pct: string }) {
  const total = segmen.reduce((a, s) => a + s.v, 0);
  const aktif = segmen.filter((s) => s.v > 0);
  const celah = aktif.length > 1 ? 3 : 0;
  let kumulatif = 0;
  return (
    <div style={{ position: "relative", width: 172, height: 172, flex: "none" }}>
      <svg viewBox="0 0 172 172" width="172" height="172" style={{ transform: "rotate(-90deg)" }} role="img" aria-label={`Kepatuhan arsip ${pct}`}>
        <circle cx="86" cy="86" r={R} fill="none" strokeWidth="16" style={{ stroke: "var(--color-neutral-800)" }} />
        {total > 0 && aktif.map((s, i) => {
          const panjang = (s.v / total) * KELILING;
          const el = (
            <circle
              key={s.nama}
              className="dasbor-cincin"
              cx="86" cy="86" r={R} fill="none" strokeWidth="16" strokeLinecap="butt"
              strokeDasharray={`${Math.max(0, panjang - celah)} ${KELILING}`}
              strokeDashoffset={-kumulatif}
              style={{ stroke: s.fill, ["--keliling" as string]: `${KELILING}`, animationDelay: `${200 + i * 140}ms` }}
            />
          );
          kumulatif += panjang;
          return el;
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 34, lineHeight: 1, letterSpacing: "-0.03em" }}>{pct}</div>
          <div style={{ fontSize: "var(--t-label)", marginTop: 4, color: muted(66) }}>terkendali</div>
        </div>
      </div>
    </div>
  );
}

const LABEL_PENDEK: Record<string, string> = {
  "Masa berlaku aman": "Aman",
  "Segera kadaluarsa": "Segera",
  "Sudah kadaluarsa": "Lewat",
  "Sudah diproses": "Diproses",
};

/* ───────────────────────── Halaman ───────────────────────── */

type Tab = "kategori" | "jenis" | "pengelola";

export default function DashboardPage() {
  const { me, counts, stats, allDocs, state, threshold } = useArsiva();
  // Sebelum dokumen tiba, angka nol bukan "arsip kosong". Bagian berbasis data baru dipasang
  // setelah siap, sehingga animasi masuknya (cincin, batang, ubin) berjalan dengan data sungguhan.
  const siap = state.siap.documents;
  const th = threshold;
  const [tab, setTab] = React.useState<Tab>("kategori");

  // Sama dengan counts.perluAksi: dalam ambang dan belum ditandai diproses.
  const prioritas = allDocs.filter((r) => r.dl <= th && r.status !== "Diproses").sort((a, b) => a.dl - b.dl).slice(0, 5);
  const terbaru = [...allDocs].sort((a, b) => (a.u < b.u ? 1 : -1)).slice(0, 4);
  const hariIni = todayISO();
  const jadwalDekat = state.schedules
    .filter((x) => x.st === "Direncanakan" && x.tgl >= hariIni)
    .sort((a, b) => (a.tgl < b.tgl ? -1 : 1))
    .slice(0, 3)
    .map((x) => {
      const d = new Date(x.tgl + "T00:00:00");
      return { ...x, hari: d.getDate(), bulan: MONTHS[d.getMonth()] };
    });

  const ubin: Ubin[] = [
    { kunci: "Aman", label: "Aman", nilai: counts.aktif, warna: "var(--color-accent-500)", teks: "var(--color-accent-200)", ikon: <ShieldCheck size={18} weight="duotone" /> },
    { kunci: "Segera", label: "Segera kadaluarsa", nilai: counts.segera, warna: "var(--color-accent-2-500)", teks: "var(--color-accent-2-300)", ikon: <HourglassMedium size={18} weight="duotone" /> },
    { kunci: "Kadaluarsa", label: "Kadaluarsa", nilai: counts.kadaluarsa, warna: "var(--color-danger)", teks: "var(--color-danger-text)", ikon: <WarningCircle size={18} weight="duotone" /> },
    { kunci: "Diproses", label: "Diproses", nilai: counts.diproses, warna: "var(--color-ok)", teks: "var(--color-ok-100)", ikon: <CheckCircle size={18} weight="duotone" /> },
  ];

  const rona = useRonaKategori();
  const sebaran = tab === "kategori" ? stats.katBars : tab === "jenis" ? stats.jenisBars : stats.ownerBars;
  const warnaUrgensi = (dl: number) => (dl < 0 ? "var(--color-danger)" : "var(--color-accent-2-500)");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--jarak-blok)" }}>
      {/* HERO */}
      <section
        className="card dasbor-muncul"
        style={{
          padding: "var(--space-6)", flexDirection: "row", alignItems: "center", gap: 24, overflow: "hidden",
          background: "linear-gradient(130deg, var(--color-section) 0%, var(--color-surface) 62%)",
          boxShadow: "inset 0 0 0 1px var(--color-divider)",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <span className="tag tag-accent">{fmt(hariIni)}</span>
            {siap && <span className="tag tag-neutral">{counts.total} dokumen di arsip</span>}
          </div>
          <h3 style={{ margin: "0 0 10px", fontSize: "clamp(24px, 2.4vw, 30px)" }}>Halo, {me.panggilan}</h3>
          {!siap ? (
            <Memuat teks="Memuat ringkasan arsip…" ringkas />
          ) : counts.perluAksi > 0 ? (
            <Link href="/pengingat" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: "var(--t-bacaan)", color: "var(--color-text)", textDecoration: "none" }}>
              <span className="dasbor-denyut" style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-accent-2-500)", flex: "none" }} />
              <span><strong style={{ color: "var(--color-accent-2-300)" }}>{counts.perluAksi} dokumen</strong> perlu tindakan</span>
              <ArrowRight size={15} style={{ color: "var(--color-accent-2-300)" }} />
            </Link>
          ) : (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: "var(--t-bacaan)" }}>
              <CheckCircle size={18} weight="fill" style={{ color: "var(--color-ok)" }} />
              Semua dokumen terkendali
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
            <Link className="btn btn-primary btn-solid" href="/unggah">
              <UploadSimple size={16} />
              Unggah
            </Link>
            <a className="btn btn-secondary" href="/api/laporan" download title="Unduh laporan ringkasan arsip (CSV)">
              <FileArrowDown size={16} />
              Laporan
            </a>
          </div>
        </div>
        <div className="hidden sm:block" style={{ flex: "none", width: 220 }}>
          <IlustrasiArsip />
        </div>
      </section>

      {siap && (
      <>
      {/* UBIN STATUS */}
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        {ubin.map((u, i) => <UbinStatus key={u.kunci} u={u} total={counts.total} i={i} />)}
      </div>

      {/* KEPATUHAN + JATUH TEMPO */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-stretch">
        <div className="card elev-sm dasbor-muncul" style={{ animationDelay: "320ms", padding: "var(--pad-kartu)", gap: "var(--space-4)", alignItems: "center" }}>
          <h5 style={{ margin: 0, alignSelf: "flex-start" }}>Kepatuhan</h5>
          <CincinKepatuhan segmen={stats.donut.legend} pct={stats.donut.pct} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", width: "100%" }}>
            {stats.donut.legend.map((l) => (
              <div key={l.nama} title={`${l.nama}: ${l.v} dokumen (${l.pctText})`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--t-ket)" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", flex: "none", background: l.fill }} />
                <span style={{ color: muted(70) }}>{LABEL_PENDEK[l.nama] ?? l.nama}</span>
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-heading)" }}>{l.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card elev-sm dasbor-muncul" style={{ animationDelay: "380ms", padding: "var(--pad-kartu)", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h5 style={{ margin: 0 }}>Jatuh tempo</h5>
            <Link href="/pengingat" className="tag tag-warn" style={{ textDecoration: "none" }} title="Atur ambang pengingat">
              ambang {th} hari
            </Link>
            <div style={{ marginLeft: "auto", display: "flex", gap: 12, flexWrap: "wrap" }}>
              {stats.donut.legend.map((l) => (
                <span key={l.nama} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "var(--t-label)", color: muted(66) }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: l.fill }} />
                  {LABEL_PENDEK[l.nama] ?? l.nama}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 190, paddingTop: 8, borderBottom: "1px solid var(--color-divider)" }}>
            {stats.bulan.cols.map((c, i) => (
              <div key={c.label} title={`${c.label}: ${c.total} dokumen`} style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "var(--t-ket)", fontFamily: "var(--font-heading)", color: c.total ? muted(85) : muted(40) }}>{c.total || ""}</span>
                <div
                  className="dasbor-batang"
                  style={{ animationDelay: `${420 + i * 70}ms`, width: "100%", maxWidth: 44, height: c.h, display: "flex", flexDirection: "column-reverse", gap: 2, borderRadius: "6px 6px 2px 2px", overflow: "hidden" }}
                >
                  {c.segs.map((sg, k) => <div key={k} style={{ height: sg.h, background: sg.fill }} />)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: -6 }}>
            {stats.bulan.cols.map((c, i) => (
              <div key={c.label} style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
                <span
                  style={{
                    display: "inline-block", fontSize: "var(--t-label)", padding: "2px 8px", borderRadius: 999,
                    color: i === 1 ? "var(--color-accent-100)" : muted(66),
                    background: i === 1 ? "var(--color-accent-800)" : "transparent",
                  }}
                >
                  {c.label === "Terlewat" ? "Lewat" : c.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PERLU TINDAKAN + SAMPING */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
        <div className="card elev-sm dasbor-muncul" style={{ animationDelay: "440ms", padding: "var(--pad-kartu)", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <h5 style={{ margin: 0 }}>Perlu tindakan</h5>
            <Link className="btn btn-ghost" href="/pengingat" style={{ marginLeft: "auto", fontSize: "var(--t-ket)" }}>Semua<ArrowRight size={14} /></Link>
          </div>
          {prioritas.length === 0 ? (
            <Kosong ikon={<Sparkle size={26} weight="duotone" />} judul="Semua beres">
              <div style={{ fontSize: "var(--t-ket)", color: muted(66) }}>Tidak ada dokumen dalam ambang {th} hari.</div>
            </Kosong>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {prioritas.map((r) => {
                const w = warnaUrgensi(r.dl);
                return (
                  <div
                    key={r.id}
                    className="baris-tautan row-hover"
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-surface-2)" }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "var(--t-isi)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <Link href={`/arsip/${r.id}`} className="tautan-baris">{r.n}</Link>
                      </div>
                      <div style={{ color: muted(66), marginTop: 2 }}><LabelKategori nama={r.k} fontSize={12} /></div>
                    </div>
                    <span
                      style={{
                        flex: "none", fontSize: "var(--t-ket)", padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap",
                        // Teks pil lebih terang dari --color-danger-text karena latarnya sudah kemerahan (kontras >=4.5).
                        color: r.dl < 0 ? "color-mix(in srgb, var(--color-danger-text) 70%, white)" : "var(--color-accent-2-300)",
                        background: `color-mix(in srgb, ${w} 16%, transparent)`,
                      }}
                    >
                      {r.sisa}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card elev-sm dasbor-muncul" style={{ animationDelay: "500ms", padding: "var(--pad-kartu)", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <h5 style={{ margin: 0 }}>Jadwal notaris</h5>
              <Link className="btn btn-ghost" href="/notaris" style={{ marginLeft: "auto", fontSize: "var(--t-ket)" }}>Kelola</Link>
            </div>
            {!state.siap.schedules ? (
              <Memuat teks="Memuat jadwal…" ringkas />
            ) : jadwalDekat.length === 0 ? (
              <Kosong ikon={<CalendarBlank size={24} weight="duotone" />} judul="Belum ada jadwal mendatang" warna="var(--color-accent-500)" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {jadwalDekat.map((s) => (
                  <div key={s.id} style={{ display: "flex", gap: 11, alignItems: "center" }}>
                    <div style={{ flex: "none", width: 46, textAlign: "center", padding: "6px 0", borderRadius: "var(--radius-md)", background: "var(--color-accent-900)", boxShadow: "inset 0 0 0 1px var(--color-accent-800)" }}>
                      <div style={{ fontFamily: "var(--font-heading)", fontSize: 17, lineHeight: 1, color: "var(--color-accent-100)" }}>{s.hari}</div>
                      <div style={{ fontSize: "var(--t-label)", marginTop: 2, color: "var(--color-accent-300)" }}>{s.bulan}</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "var(--t-ket)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.agenda}</div>
                      <div style={{ fontSize: "var(--t-ket)", color: muted(62) }}>{s.jam} · {s.notarisNama}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card elev-sm dasbor-muncul" style={{ animationDelay: "560ms", padding: "var(--pad-kartu)", gap: "var(--space-3)" }}>
            <h5 style={{ margin: 0 }}>Terbaru</h5>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {terbaru.map((r) => (
                <div key={r.id} className="baris-tautan row-hover" style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 8px", margin: "0 -8px", borderRadius: "var(--radius-sm)" }}>
                  <span style={{ width: 30, height: 30, flex: "none", borderRadius: 8, display: "grid", placeItems: "center", background: rona(r.k).latar, color: rona(r.k).teks }}>
                    <FilePdf size={16} />
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: "var(--t-ket)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <Link href={`/arsip/${r.id}`} className="tautan-baris">{r.n}</Link>
                    </div>
                    <div style={{ fontSize: "var(--t-ket)", color: muted(62) }}>{r.o} · {r.upText}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SEBARAN */}
      <div className="card elev-sm dasbor-muncul" style={{ animationDelay: "620ms", padding: "var(--pad-kartu)", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h5 style={{ margin: 0 }}>Sebaran</h5>
          <div role="tablist" aria-label="Pilih sebaran" style={{ marginLeft: "auto", display: "flex", gap: 2, padding: 3, borderRadius: 999, background: "var(--color-surface-2)" }}>
            {([["kategori", "Kategori"], ["jenis", "Jenis"], ["pengelola", "Pengelola"]] as [Tab, string][]).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} className="dasbor-tab" onClick={() => setTab(k)}>{label}</button>
            ))}
          </div>
        </div>
        {/* key memutar ulang animasi batang setiap ganti tab */}
        <div key={tab} role="tabpanel" className="grid gap-x-8 gap-y-3 grid-cols-1 md:grid-cols-2">
          {sebaran.map((b, i) => (
            <div key={b.nama}>
              <div style={{ display: "flex", gap: 8, fontSize: "var(--t-ket)", marginBottom: 5 }}>
                {tab === "kategori" ? (
                  <span style={{ minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", color: muted(78) }}><LabelKategori nama={b.nama} fontSize={13} /></span>
                ) : (
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: muted(78) }}>{b.nama}</span>
                )}
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-heading)", flex: "none" }}>{b.jumlah}</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "var(--color-neutral-800)", overflow: "hidden" }}>
                <div className="dasbor-isi" style={{ animationDelay: `${i * 50}ms`, height: "100%", width: b.w, borderRadius: 4, background: tab === "kategori" ? rona(b.nama).titik : "linear-gradient(90deg, var(--color-accent-700), var(--color-accent-500))" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
