"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Folders,
  ShieldCheck,
  HourglassMedium,
  WarningCircle,
  UploadSimple,
  FileArrowDown,
  BellRinging,
  ArrowRight,
  FilePdf,
} from "@phosphor-icons/react";
import { useArsiva } from "@/components/arsiva/store";
import { fmt, MONTHS, todayISO, type GroupBar } from "@/lib/arsiva";

function StatCard({
  label,
  value,
  labelColor,
  valueColor,
  icon,
  iconBg,
  iconColor,
  iconRing,
  barColor,
  barPct,
  meta,
  cardStyle,
}: {
  label: string;
  value: React.ReactNode;
  labelColor?: string;
  valueColor?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  iconRing: string;
  barColor: string;
  barPct: string;
  meta: string;
  cardStyle?: React.CSSProperties;
}) {
  return (
    <div className="card elev-sm" style={{ gap: 9, padding: "var(--space-4)", background: "linear-gradient(160deg, var(--color-surface-2) 0%, var(--color-surface) 62%)", ...cardStyle }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.09em", textTransform: "uppercase", color: labelColor ?? "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>{label}</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 32, lineHeight: 1.1, letterSpacing: "-0.02em", color: valueColor }}>{value}</div>
        </div>
        <div style={{ marginLeft: "auto", width: 32, height: 32, flex: "none", borderRadius: "var(--radius-sm)", display: "grid", placeItems: "center", background: iconBg, color: iconColor, boxShadow: `inset 0 0 0 1px ${iconRing}` }}>
          {icon}
        </div>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: "var(--color-neutral-800)" }}>
        <div style={{ height: 4, borderRadius: 2, background: barColor, width: barPct }} />
      </div>
      <div className="card-meta">{meta}</div>
    </div>
  );
}

function DistCard({ title, subtitle, bars, barColor }: { title: string; subtitle: string; bars: GroupBar[]; barColor: string }) {
  return (
    <div className="card elev-sm" style={{ padding: "var(--space-6)", gap: "var(--space-4)" }}>
      <div>
        <h5 style={{ margin: "0 0 2px" }}>{title}</h5>
        <div className="text-muted" style={{ fontSize: 12 }}>{subtitle}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {bars.map((b) => (
          <div key={b.nama}>
            <div style={{ display: "flex", gap: 8, fontSize: 12, marginBottom: 4 }}>
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "color-mix(in srgb, var(--color-text) 74%, transparent)" }}>{b.nama}</span>
              <span style={{ marginLeft: "auto", fontFamily: "var(--font-heading)", flex: "none" }}>{b.jumlah}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "var(--color-neutral-800)" }}>
              <div style={{ height: 6, borderRadius: 3, background: barColor, width: b.w }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { me, counts, stats, allDocs, state, threshold } = useArsiva();
  const th = threshold;

  const prioritas = React.useMemo(
    () => allDocs.filter((r) => r.dl <= th).sort((a, b) => a.dl - b.dl).slice(0, 5),
    [allDocs, th],
  );
  const terbaru = React.useMemo(
    () => [...allDocs].sort((a, b) => (a.u < b.u ? 1 : -1)).slice(0, 4),
    [allDocs],
  );
  const jadwalDekat = React.useMemo(() => {
    const mulai = todayISO();
    return state.schedules
      .filter((x) => x.st === "Direncanakan" && x.tgl >= mulai)
      .sort((a, b) => (a.tgl < b.tgl ? -1 : 1))
      .slice(0, 3)
      .map((x) => {
        const d = new Date(x.tgl + "T00:00:00");
        return { ...x, notaris: x.notarisNama, hari: d.getDate(), bulan: MONTHS[d.getMonth()] };
      });
  }, [state.schedules]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: "0 0 4px" }}>Selamat pagi, {me.panggilan}</h3>
          <div className="text-muted" style={{ fontSize: 13 }}>Ringkasan dan analitik arsip dokumen legal per {fmt(todayISO())}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flex: "none" }}>
          <a className="btn btn-secondary" href="/api/laporan" download>
            <FileArrowDown size={16} />
            Unduh Laporan
          </a>
          <button type="button" className="btn btn-primary" onClick={() => router.push("/unggah")}>
            <UploadSimple size={16} />
            Unggah Dokumen
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 mb-4 grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Dokumen"
          value={counts.total}
          icon={<Folders size={17} />}
          iconBg="var(--color-neutral-900)"
          iconColor="var(--color-neutral-400)"
          iconRing="var(--color-neutral-800)"
          barColor="var(--color-neutral-500)"
          barPct="100%"
          meta={`${state.cats.length} kategori aktif`}
        />
        <StatCard
          label="Masa Berlaku Aman"
          value={counts.aktif}
          labelColor="var(--color-accent-400)"
          valueColor="var(--color-accent-200)"
          icon={<ShieldCheck size={17} />}
          iconBg="var(--color-accent-900)"
          iconColor="var(--color-accent-300)"
          iconRing="var(--color-accent-800)"
          barColor="var(--color-accent)"
          barPct={stats.kpi.aktifPct}
          meta={stats.kpi.aktifText}
        />
        <StatCard
          label="Segera Kadaluarsa"
          value={counts.segera}
          labelColor="var(--color-accent-2-400)"
          valueColor="var(--color-accent-2-300)"
          icon={<HourglassMedium size={17} />}
          iconBg="var(--color-accent-2-900)"
          iconColor="var(--color-accent-2-300)"
          iconRing="var(--color-accent-2-800)"
          barColor="var(--color-accent-2)"
          barPct={stats.kpi.segeraPct}
          meta={`Dalam ambang ${th} hari`}
          cardStyle={{ background: "linear-gradient(160deg, var(--color-accent-2-900) 0%, var(--color-surface) 68%)", boxShadow: "inset 0 0 0 1px var(--color-accent-2-800), var(--shadow-sm)" }}
        />
        <StatCard
          label="Sudah Kadaluarsa"
          value={counts.kadaluarsa}
          labelColor="var(--color-danger)"
          valueColor="var(--color-danger)"
          icon={<WarningCircle size={17} />}
          iconBg="var(--color-danger-800)"
          iconColor="var(--color-danger-100)"
          iconRing="var(--color-danger-800)"
          barColor="var(--color-danger)"
          barPct={stats.kpi.kadalPct}
          meta={stats.kpi.bulanIniText}
        />
      </div>

      {/* projection + compliance */}
      <div className="grid gap-4 mb-4 grid-cols-1 lg:grid-cols-[1.62fr_1fr] items-stretch">
        <div className="card elev-sm" style={{ padding: "var(--space-6)", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div>
              <h5 style={{ margin: "0 0 2px" }}>Proyeksi jatuh tempo dokumen</h5>
              <div className="text-muted" style={{ fontSize: 12 }}>Jumlah dokumen menurut bulan masa berlaku berakhir · ambang pengingat {th} hari</div>
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => router.push("/pengingat")} style={{ marginLeft: "auto", fontSize: 12, flex: "none" }}>Atur ambang</button>
          </div>
          {/* legend */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            {stats.donut.legend.map((l) => (
              <div key={l.nama} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5 }}>
                <span style={{ width: 22, height: 3, borderRadius: 2, flex: "none", background: l.fill }} />
                <span style={{ color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>{l.nama.replace("Masa berlaku aman", "Masa berlaku aman")}</span>
                <span style={{ fontFamily: "var(--font-heading)", color: "color-mix(in srgb, var(--color-text) 88%, transparent)" }}>{l.v}</span>
              </div>
            ))}
          </div>
          {/* bars */}
          <div style={{ position: "relative", height: 158, marginTop: "var(--space-2)" }}>
            {stats.bulan.grid.map((g) => (
              <div key={"line" + g.b} style={{ position: "absolute", left: 26, right: 0, bottom: g.b, height: 1, background: "linear-gradient(to right, transparent, var(--color-divider) 44px, var(--color-divider) calc(100% - 44px), transparent)" }} />
            ))}
            {stats.bulan.grid.map((g) => (
              <div key={"lbl" + g.lb} style={{ position: "absolute", left: 0, width: 22, textAlign: "right", bottom: g.lb, fontSize: 10, color: "color-mix(in srgb, var(--color-text) 38%, transparent)" }}>{g.label}</div>
            ))}
            <div style={{ position: "absolute", left: 26, right: 0, bottom: 0, height: 158, display: "flex", alignItems: "flex-end", gap: 10 }}>
              {stats.bulan.cols.map((c, i) => (
                <div key={i} className="row-hover" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 6, height: "100%", borderRadius: "var(--radius-sm)", paddingBottom: 1 }}>
                  <div style={{ fontSize: 11.5, fontFamily: "var(--font-heading)", color: "color-mix(in srgb, var(--color-text) 80%, transparent)" }}>{c.totalText}</div>
                  <div style={{ width: "100%", maxWidth: 46, display: "flex", flexDirection: "column-reverse", gap: 1.5, borderRadius: 3, overflow: "hidden", height: c.h }}>
                    {c.segs.map((sg, k) => (
                      <div key={k} style={{ height: sg.h, background: sg.fill }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, paddingLeft: 26 }}>
            {stats.bulan.cols.map((c, i) => (
              <div key={i} style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
                <div style={{ height: 2, width: 22, margin: "0 auto 6px", borderRadius: 2, background: c.markC }} />
                <div style={{ fontSize: 10.5, color: c.labelC }}>{c.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 26, flexWrap: "wrap", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-divider)" }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.09em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 40%, transparent)" }}>Puncak jatuh tempo</div>
              <div style={{ fontSize: 13, fontFamily: "var(--font-heading)", marginTop: 2 }}>{stats.bulan.puncakText}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.09em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 40%, transparent)" }}>Rata-rata sisa masa berlaku</div>
              <div style={{ fontSize: 13, fontFamily: "var(--font-heading)", marginTop: 2 }}>{stats.bulan.avgText}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.09em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 40%, transparent)" }}>Perlu tindak lanjut</div>
              <div style={{ fontSize: 13, fontFamily: "var(--font-heading)", marginTop: 2, color: "var(--color-accent-2-400)" }}>{counts.perluAksi} dokumen</div>
            </div>
          </div>
        </div>

        {/* compliance donut */}
        <div className="card elev-sm" style={{ padding: "var(--space-6)", gap: "var(--space-4)" }}>
          <div>
            <h5 style={{ margin: "0 0 2px" }}>Kepatuhan arsip</h5>
            <div className="text-muted" style={{ fontSize: 12 }}>Porsi dokumen yang masih berlaku atau sudah ditindaklanjuti</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-2) 0" }}>
            <div style={{ position: "relative", width: 172, height: 172, flex: "none", borderRadius: "50%", background: stats.donut.conic }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-bg) 55%, transparent)" }} />
              <div style={{ position: "absolute", inset: 23, borderRadius: "50%", background: "var(--color-surface)", boxShadow: "inset 0 0 0 1px var(--color-divider)", display: "grid", placeItems: "center", textAlign: "center" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 34, lineHeight: 1, letterSpacing: "-0.02em" }}>{stats.donut.pct}</div>
                  <div style={{ fontSize: 9, letterSpacing: "0.12em", marginTop: 5, color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>TERKENDALI</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {stats.donut.legend.map((l) => (
              <div key={l.nama}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", flex: "none", background: l.fill }} />
                  <span style={{ minWidth: 0, flex: 1, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.nama}</span>
                  <span style={{ fontFamily: "var(--font-heading)", flex: "none" }}>{l.v}</span>
                  <span style={{ flex: "none", width: 34, textAlign: "right", color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>{l.pctText}</span>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: "var(--color-neutral-800)" }}>
                  <div style={{ height: 3, borderRadius: 2, background: l.fill, width: l.w }} />
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-secondary btn-block" onClick={() => router.push("/pengingat")} style={{ marginTop: "auto" }}>
            <BellRinging size={15} />
            Tindak lanjuti {counts.perluAksi} dokumen
          </button>
        </div>
      </div>

      {/* distributions */}
      <div className="grid gap-4 mb-4 grid-cols-1 md:grid-cols-3 items-start">
        <DistCard title="Sebaran kategori" subtitle="Kelompok dokumen terbanyak di arsip" bars={stats.katBars} barColor="var(--color-accent-600)" />
        <DistCard title="Sebaran jenis dokumen" subtitle="Komposisi master data jenis yang terpakai" bars={stats.jenisBars} barColor="var(--color-accent-700)" />
        <DistCard title="Beban pengelola" subtitle="Jumlah dokumen yang diunggah tiap staf" bars={stats.ownerBars} barColor="var(--color-neutral-500)" />
      </div>

      {/* priority + side */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1.55fr_1fr] items-start">
        <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <h5 style={{ margin: 0 }}>Prioritas tindak lanjut</h5>
            <button type="button" className="btn btn-ghost" onClick={() => router.push("/pengingat")} style={{ marginLeft: "auto", fontSize: 12 }}>Lihat semua<ArrowRight size={14} /></button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Dokumen</th>
                  <th style={{ width: 110 }}>Kadaluarsa</th>
                  <th style={{ width: 130 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {prioritas.map((r) => (
                  <tr key={r.id} onClick={() => router.push(`/arsip/${r.id}`)} style={{ cursor: "pointer" }}>
                    <td>
                      <div style={{ fontSize: 13, maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.n}</div>
                      <div style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>{r.k}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {r.expText}
                      <div style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>{r.sisa}</div>
                    </td>
                    <td><span className={`tag ${r.tag}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <h5 style={{ margin: 0 }}>Jadwal notaris terdekat</h5>
              <button type="button" className="btn btn-ghost" onClick={() => router.push("/notaris")} style={{ marginLeft: "auto", fontSize: 12 }}>Kelola</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {jadwalDekat.map((s) => (
                <div key={s.id} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                  <div style={{ flex: "none", width: 44, textAlign: "center", padding: "5px 0", borderRadius: "var(--radius-sm)", background: "var(--color-surface-2)", boxShadow: "inset 0 0 0 1px var(--color-divider)" }}>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: 15, lineHeight: 1 }}>{s.hari}</div>
                    <div style={{ fontSize: 10, textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>{s.bulan}</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13 }}>{s.agenda}</div>
                    <div style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 48%, transparent)" }}>{s.notaris} · {s.jam}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
            <h5 style={{ margin: 0 }}>Unggahan terbaru</h5>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {terbaru.map((r) => (
                <div key={r.id} onClick={() => router.push(`/arsip/${r.id}`)} style={{ display: "flex", gap: 9, alignItems: "center", cursor: "pointer" }}>
                  <FilePdf size={17} style={{ color: "var(--color-accent-400)", flex: "none" }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.n}</div>
                    <div style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>{r.o} · {r.upText}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
