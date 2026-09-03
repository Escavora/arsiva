// ARSIVA — mock data + domain helpers, ported from the approved design canvas.
// Tahap 1 (frontend): this is the in-memory source of truth. In later phases it
// will be replaced by Drizzle/SQLite queries + API routes.

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
] as const;

/** Tengah malam hari ini (waktu lokal) — dasar semua hitungan sisa masa berlaku. */
export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Tanggal hari ini dalam format "YYYY-MM-DD". */
export function todayISO(): string {
  const d = today();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type Role = "Admin" | "Team Member" | "Pembaca";

export type Category = { nama: string; desk: string };

export type Doc = {
  n: string; // nama dokumen
  k: string; // kategori
  j: string; // jenis
  t: string; // tujuan
  e: string; // tanggal kadaluarsa (ISO)
  u: string; // tanggal unggah (ISO)
  o: string; // owner
  s: string; // ukuran file
  p?: boolean; // sudah diproses
};

export type Notaris = {
  nama: string;
  kantor: string;
  tel: string;
  email: string;
};

export type Schedule = {
  ni: number; // notaris index
  agenda: string;
  tgl: string; // ISO
  jam: string;
  st: "Direncanakan" | "Selesai" | "Dibatalkan";
};

export type Share = {
  di: number; // doc index
  email: string;
  tipe: "Notaris" | "Rekanan";
  dibuat: string; // ISO
  exp: string; // ISO
  revoked?: boolean;
};

export type User = {
  nama: string;
  email: string;
  unit: string;
  peran: Role;
  aktif: boolean;
};

export const seedCats: Category[] = [
  { nama: "Perjanjian Kerja Sama", desk: "PKS dengan mitra dan vendor" },
  { nama: "Perjanjian Kredit", desk: "Dokumen fasilitas pembiayaan" },
  { nama: "Akta Jual Beli", desk: "AJB agunan dan aset bank" },
  { nama: "Akta Notaris", desk: "Akta pendirian, fidusia, pernyataan" },
  { nama: "Surat Kuasa", desk: "Kuasa penandatanganan dan roya" },
  { nama: "Sertifikat Agunan", desk: "SHM, HGB, dan hak tanggungan" },
  { nama: "Dokumen Legal Lain", desk: "SK, berita acara, korespondensi" },
];

export const seedTypes: string[] = [
  "Surat Perjanjian", "Akta Notaris", "Surat Keputusan",
  "Surat Kuasa", "Sertifikat", "Berita Acara",
];

export const seedPurposes: string[] = [
  "Kerja Sama", "Pengesahan", "Pendaftaran",
  "Pembiayaan", "Agunan", "Legalitas",
];

export const seedDocs: Doc[] = [
  { n: "Perjanjian Kerja Sama Layanan Notaris — Wardhani & Rekan", k: "Perjanjian Kerja Sama", j: "Surat Perjanjian", t: "Kerja Sama", e: "2026-09-11", u: "2024-09-12", o: "Rina Astuti", s: "3,2 MB" },
  { n: "Akta Jual Beli Agunan No. 214/AJB/IX/2023", k: "Akta Jual Beli", j: "Akta Notaris", t: "Pengesahan", e: "2026-09-24", u: "2023-09-25", o: "Rina Astuti", s: "5,8 MB" },
  { n: "Perjanjian Kredit Modal Kerja — PT Sentosa Bumi Raya", k: "Perjanjian Kredit", j: "Surat Perjanjian", t: "Pembiayaan", e: "2026-10-05", u: "2025-10-06", o: "Dimas Prakoso", s: "2,4 MB" },
  { n: "Sertifikat Hak Tanggungan — SHM 4471 Bekasi", k: "Sertifikat Agunan", j: "Sertifikat", t: "Agunan", e: "2026-10-19", u: "2024-04-02", o: "Dimas Prakoso", s: "7,1 MB" },
  { n: "Surat Kuasa Penandatanganan Akta — Cabang Surabaya", k: "Surat Kuasa", j: "Surat Kuasa", t: "Legalitas", e: "2026-08-21", u: "2025-08-22", o: "Hendra Wijaya", s: "1,1 MB", p: true },
  { n: "Perjanjian Kerja Sama Notaris — Halim & Partners", k: "Perjanjian Kerja Sama", j: "Surat Perjanjian", t: "Kerja Sama", e: "2026-08-06", u: "2024-08-07", o: "Rina Astuti", s: "2,9 MB" },
  { n: "Akta Pendirian Koperasi Mitra Usaha Tani", k: "Akta Notaris", j: "Akta Notaris", t: "Pendaftaran", e: "2027-02-14", u: "2026-02-15", o: "Sari Melati", s: "4,3 MB" },
  { n: "Berita Acara Serah Terima Dokumen Agunan Q2", k: "Dokumen Legal Lain", j: "Berita Acara", t: "Legalitas", e: "2027-06-30", u: "2026-07-01", o: "Sari Melati", s: "0,9 MB" },
  { n: "SK Penunjukan Notaris Rekanan Wilayah Jawa Barat", k: "Dokumen Legal Lain", j: "Surat Keputusan", t: "Kerja Sama", e: "2026-11-30", u: "2025-12-01", o: "Hendra Wijaya", s: "1,6 MB" },
  { n: "Perjanjian Kredit Investasi — CV Anugerah Logistik", k: "Perjanjian Kredit", j: "Surat Perjanjian", t: "Pembiayaan", e: "2027-01-18", u: "2026-01-19", o: "Dimas Prakoso", s: "3,7 MB" },
  { n: "Akta Fidusia Kendaraan Operasional 2026", k: "Akta Notaris", j: "Akta Notaris", t: "Agunan", e: "2026-12-09", u: "2025-12-10", o: "Rina Astuti", s: "2,2 MB" },
  { n: "Surat Kuasa Roya Hak Tanggungan — Cabang Medan", k: "Surat Kuasa", j: "Surat Kuasa", t: "Legalitas", e: "2026-09-30", u: "2026-03-31", o: "Hendra Wijaya", s: "1,0 MB" },
  { n: "Perjanjian Kerja Sama Penyimpanan Arsip Eksternal", k: "Perjanjian Kerja Sama", j: "Surat Perjanjian", t: "Kerja Sama", e: "2027-09-01", u: "2026-08-28", o: "Sari Melati", s: "2,0 MB" },
  { n: "Sertifikat Agunan Gudang — HGB 1182 Cikarang", k: "Sertifikat Agunan", j: "Sertifikat", t: "Agunan", e: "2028-03-15", u: "2026-08-30", o: "Dimas Prakoso", s: "6,4 MB" },
];

export const seedNotaris: Notaris[] = [
  { nama: "Amelia Wardhani, S.H., M.Kn.", kantor: "Wardhani & Rekan · Jakarta Selatan", tel: "021-7250-118", email: "amelia@wardhanirekan.co.id" },
  { nama: "Bambang Setiawan, S.H.", kantor: "Kantor Notaris B. Setiawan · Bandung", tel: "022-4109-772", email: "bambang@notarisbs.co.id" },
  { nama: "Christine Halim, S.H., M.Kn.", kantor: "Halim & Partners · Surabaya", tel: "031-5528-940", email: "christine@halimpartners.co.id" },
  { nama: "Dwi Purnomo, S.H.", kantor: "Notaris Dwi Purnomo · Semarang", tel: "024-3311-206", email: "dwi.purnomo@notaris.id" },
  { nama: "Ratna Kusumaningrum, S.H., M.Kn.", kantor: "Kusuma Legal Office · Medan", tel: "061-4577-301", email: "ratna@kusumalegal.co.id" },
];

export const seedSchedules: Schedule[] = [
  { ni: 0, agenda: "Penandatanganan perpanjangan PKS layanan notaris", tgl: "2026-09-08", jam: "09:30", st: "Direncanakan" },
  { ni: 0, agenda: "Legalisasi akta fidusia kendaraan operasional", tgl: "2026-09-22", jam: "13:00", st: "Direncanakan" },
  { ni: 0, agenda: "Review klausul PKS tahun anggaran 2026", tgl: "2026-06-11", jam: "10:00", st: "Selesai" },
  { ni: 1, agenda: "Pengesahan akta jual beli agunan Bandung", tgl: "2026-09-15", jam: "11:00", st: "Direncanakan" },
  { ni: 1, agenda: "Pendampingan roya hak tanggungan", tgl: "2026-05-28", jam: "14:30", st: "Selesai" },
  { ni: 2, agenda: "Rapat evaluasi kerja sama semester I", tgl: "2026-09-29", jam: "15:00", st: "Direncanakan" },
  { ni: 2, agenda: "Penandatanganan akta pendirian koperasi", tgl: "2026-04-17", jam: "09:00", st: "Dibatalkan" },
  { ni: 3, agenda: "Verifikasi dokumen agunan gudang Cikarang", tgl: "2026-10-02", jam: "10:30", st: "Direncanakan" },
  { ni: 4, agenda: "Legalisasi surat kuasa cabang Medan", tgl: "2026-07-09", jam: "13:30", st: "Selesai" },
];

export const seedShares: Share[] = [
  { di: 0, email: "amelia@wardhanirekan.co.id", tipe: "Notaris", dibuat: "2026-08-26", exp: "2026-09-09" },
  { di: 2, email: "legal@sentosabumiraya.co.id", tipe: "Rekanan", dibuat: "2026-08-30", exp: "2026-09-06" },
  { di: 3, email: "christine@halimpartners.co.id", tipe: "Notaris", dibuat: "2026-08-14", exp: "2026-08-28" },
  { di: 6, email: "sekretariat@mitrausahatani.id", tipe: "Rekanan", dibuat: "2026-08-20", exp: "2026-09-20", revoked: true },
];

export const seedUsers: User[] = [
  { nama: "Rina Astuti", email: "admin.cop@bri.co.id", unit: "Legal Korporasi", peran: "Admin", aktif: true },
  { nama: "Dimas Prakoso", email: "teammember.cop@bri.co.id", unit: "Legal Kredit", peran: "Team Member", aktif: true },
  { nama: "Hendra Wijaya", email: "hendra.wijaya@bank.co.id", unit: "Kepatuhan", peran: "Team Member", aktif: true },
  { nama: "Sari Melati", email: "sari.melati@bank.co.id", unit: "Sekretariat Perusahaan", peran: "Team Member", aktif: true },
  { nama: "Agus Nugroho", email: "agus.nugroho@bank.co.id", unit: "Audit Internal", peran: "Pembaca", aktif: true },
  { nama: "Yuni Kartika", email: "yuni.kartika@bank.co.id", unit: "Legal Kredit", peran: "Pembaca", aktif: false },
];

// ── date helpers ──
export function fmt(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtShort(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

export function days(iso: string | undefined): number {
  if (!iso) return 9999;
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return 9999;
  return Math.round((d.getTime() - today().getTime()) / 86400000);
}

export type DocStatus = "Aktif" | "Segera Kadaluarsa" | "Kadaluarsa" | "Diproses";

export type ViewDoc = Doc & {
  id: number;
  status: DocStatus;
  tag: string;
  dl: number;
  sisa: string;
  expText: string;
  upText: string;
  sisaC: string;
  kode: string;
  file: string;
};

/**
 * Menurunkan status tampilan dari satu dokumen.
 * `id` adalah id dokumen di database (dipakai untuk rute /arsip/[id]).
 */
export function viewDoc<T extends Doc & { id: number }>(d: T, th: number): T & ViewDoc {
  const i = d.id;
  const dl = days(d.e);
  let status: DocStatus = "Aktif";
  let tag = "tag-accent";
  if (d.p) {
    status = "Diproses";
    tag = "tag-ok";
  } else if (dl < 0) {
    status = "Kadaluarsa";
    tag = "tag-danger";
  } else if (dl <= th) {
    status = "Segera Kadaluarsa";
    tag = "tag-warn";
  }
  const sisa = dl < 0 ? `lewat ${Math.abs(dl)} hari` : `${dl} hari lagi`;
  return {
    ...d,
    id: i,
    status,
    tag,
    dl,
    sisa,
    expText: fmt(d.e),
    upText: fmt(d.u),
    sisaC:
      dl < 0
        ? "var(--color-danger)"
        : dl <= th
        ? "var(--color-accent-2-400)"
        : "inherit",
    kode: `ARS-${2026 - (i % 3)}-${1180 + i * 7}`,
    file: `scan-${1180 + i * 7}.pdf`,
  };
}

export type Counts = {
  total: number;
  aktif: number;
  segera: number;
  kadaluarsa: number;
  diproses: number;
  perluAksi: number;
};

export function computeCounts(all: ViewDoc[]): Counts {
  const aktif = all.filter((r) => r.status === "Aktif").length;
  const segera = all.filter((r) => r.status === "Segera Kadaluarsa").length;
  const kadaluarsa = all.filter((r) => r.status === "Kadaluarsa").length;
  const diproses = all.filter((r) => r.status === "Diproses").length;
  return {
    total: all.length,
    aktif,
    segera,
    kadaluarsa,
    diproses,
    perluAksi: segera + kadaluarsa,
  };
}

// ── analytics (dashboard) ──
const C_AMAN = "var(--color-accent-600)";
const C_SEGERA = "var(--color-accent-2-500)";
const C_KADAL = "var(--color-danger)";
const C_PROSES = "var(--color-ok)";

export type BarSeg = { fill: string; h: string; v: number };
export type BarCol = {
  label: string;
  total: number;
  totalText: string;
  h: string;
  segs: BarSeg[];
  labelC: string;
  markC: string;
};
export type GridLine = { b: string; lb: string; label: string };
export type LegendItem = { nama: string; v: number; fill: string; pctText: string; w: string };
export type GroupBar = { nama: string; jumlah: number; w: string };

export type Analytics = {
  bulan: { cols: BarCol[]; grid: GridLine[]; puncakText: string; avgText: string };
  donut: { conic: string; legend: LegendItem[]; pct: string };
  katBars: GroupBar[];
  jenisBars: GroupBar[];
  ownerBars: GroupBar[];
  kpi: {
    aktifPct: string; aktifText: string;
    segeraPct: string; segeraText: string;
    kadalPct: string; kadalText: string;
    prosesPct: string; prosesText: string;
    bulanIniText: string;
  };
};

export function analytics(all: ViewDoc[], th: number, counts: Counts): Analytics {
  // Lima bulan ke depan terhitung dari bulan berjalan.
  const base = today();
  const monthKeys: { y: number; m: number; label: string }[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
    monthKeys.push({ y: d.getFullYear(), m: d.getMonth(), label: MONTHS[d.getMonth()] });
  }
  const mk = () => ({ aman: 0, segera: 0, kadal: 0, proses: 0 });
  type Bucket = { label: string; y?: number; m?: number; aman: number; segera: number; kadal: number; proses: number };
  const last = monthKeys[monthKeys.length - 1];
  const sisaLabel = `${last.m === 11 ? last.y + 1 : last.y}+`;
  const buckets: Bucket[] = [
    { label: "Terlewat", ...mk() },
    ...monthKeys.map((k) => ({ label: k.label, y: k.y, m: k.m, ...mk() })),
    { label: sisaLabel, ...mk() },
  ];
  all.forEach((r) => {
    const d = new Date(r.e + "T00:00:00");
    let bi: number;
    if (r.dl < 0) bi = 0;
    else {
      const idx = monthKeys.findIndex((k) => k.y === d.getFullYear() && k.m === d.getMonth());
      bi = idx < 0 ? buckets.length - 1 : idx + 1;
    }
    const key =
      r.status === "Diproses" ? "proses"
      : r.status === "Kadaluarsa" ? "kadal"
      : r.status === "Segera Kadaluarsa" ? "segera"
      : "aman";
    buckets[bi][key]++;
  });

  const totals = buckets.map((b) => b.aman + b.segera + b.kadal + b.proses);
  const niceMax = Math.max(2, Math.ceil(Math.max(...totals) / 2) * 2);
  const COL_H = 158;
  const order: [keyof Bucket, string][] = [
    ["kadal", C_KADAL], ["segera", C_SEGERA], ["proses", C_PROSES], ["aman", C_AMAN],
  ];

  const cols: BarCol[] = buckets.map((b, i) => {
    const total = totals[i];
    const segs = order
      .filter(([k]) => (b[k] as number) > 0)
      .map(([k, fill]) => ({ fill, h: (((b[k] as number) / total) * 100).toFixed(2) + "%", v: b[k] as number }));
    return {
      label: b.label,
      total,
      totalText: total ? String(total) : "·",
      h: Math.round((total / niceMax) * COL_H) + "px",
      segs,
      labelC: i === 1 ? "var(--color-accent-200)" : "color-mix(in srgb, var(--color-text) 50%, transparent)",
      markC: i === 1 ? "var(--color-accent)" : "transparent",
    };
  });
  const grid: GridLine[] = [0, 0.5, 1].map((f) => ({
    b: Math.round(COL_H * f) + "px",
    lb: Math.round(COL_H * f) - 6 + "px",
    label: String(Math.round(niceMax * f)),
  }));

  let pi = 0;
  totals.forEach((t, i) => { if (t > totals[pi]) pi = i; });
  const puncakText = `${buckets[pi].label} · ${totals[pi]} dokumen`;
  const aktifDl = all.filter((r) => r.dl >= 0).map((r) => r.dl);
  const avgText = aktifDl.length
    ? Math.round(aktifDl.reduce((a, b) => a + b, 0) / aktifDl.length) + " hari"
    : "—";

  const dcounts = [
    { nama: "Masa berlaku aman", v: counts.aktif, fill: C_AMAN },
    { nama: "Segera kadaluarsa", v: counts.segera, fill: C_SEGERA },
    { nama: "Sudah kadaluarsa", v: counts.kadaluarsa, fill: C_KADAL },
    { nama: "Sudah diproses", v: counts.diproses, fill: C_PROSES },
  ];
  const legend: LegendItem[] = dcounts.map((d) => ({
    ...d,
    pctText: Math.round((d.v / Math.max(1, counts.total)) * 100) + "%",
    w: Math.round((d.v / Math.max(1, counts.total)) * 100) + "%",
  }));
  let cum2 = 0;
  const stops = dcounts
    .filter((d) => d.v > 0)
    .map((d) => {
      const from = (cum2 / counts.total) * 100;
      cum2 += d.v;
      return `${d.fill} ${from.toFixed(2)}% ${((cum2 / counts.total) * 100).toFixed(2)}%`;
    });
  const conic = `conic-gradient(from -90deg, ${stops.join(", ")})`;

  const grp = (key: keyof Doc): GroupBar[] => {
    const m: Record<string, number> = {};
    all.forEach((r) => { const v = r[key] as string; m[v] = (m[v] || 0) + 1; });
    const arr = Object.entries(m)
      .map(([nama, jumlah]) => ({ nama, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah);
    const mx = Math.max(1, ...arr.map((a) => a.jumlah));
    return arr.map((a) => ({ ...a, w: Math.round((a.jumlah / mx) * 100) + "%" }));
  };

  const pct = (v: number) => Math.round((v / Math.max(1, counts.total)) * 100);
  return {
    bulan: { cols, grid, puncakText, avgText },
    donut: {
      conic,
      legend,
      pct: Math.round(((counts.aktif + counts.diproses) / Math.max(1, counts.total)) * 100) + "%",
    },
    katBars: grp("k"),
    jenisBars: grp("j"),
    ownerBars: grp("o"),
    kpi: {
      aktifPct: pct(counts.aktif) + "%", aktifText: pct(counts.aktif) + "% dari total arsip",
      segeraPct: pct(counts.segera) + "%", segeraText: pct(counts.segera) + "% dari total arsip",
      kadalPct: pct(counts.kadaluarsa) + "%", kadalText: pct(counts.kadaluarsa) + "% dari total arsip",
      prosesPct: pct(counts.diproses) + "%", prosesText: pct(counts.diproses) + "% dari total arsip",
      bulanIniText: cols[1] ? `${cols[1].total} dokumen jatuh tempo bulan ini` : "—",
    },
  };
}

export function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("");
}
