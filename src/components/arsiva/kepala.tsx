"use client";

import * as React from "react";
import type { Icon } from "@phosphor-icons/react";

/**
 * Rona penunjuk arah tiap halaman. Satu sumber untuk sidebar (shell.tsx) dan kepala halaman,
 * sehingga warna menu yang diklik sama dengan warna pita di halaman yang terbuka.
 */
export const RONA_HALAMAN = {
  dashboard: "var(--color-accent-500)",
  arsip: "var(--kat-sian)",
  unggah: "var(--kat-toska)",
  pengingat: "var(--color-accent-2-500)", // sama dengan rona "Segera kadaluarsa"
  bagikan: "var(--kat-ungu)",
  notaris: "var(--kat-nila)",
  kategori: "var(--kat-magenta)",
  akses: "var(--color-ok)",
} as const;

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

/**
 * Kepala halaman: bahasa yang sama dengan pita sapaan di dasbor (gradien dari rona ke permukaan,
 * judul besar, aksi di kanan), diberi rona halaman masing-masing. Ikon besar yang samar di tepi
 * kanan menggemakan ilustrasi dasbor tanpa menambah elemen baru.
 */
export function KepalaHalaman({
  ikon: Ikon,
  rona,
  judul,
  ket,
  atas,
  aksi,
  children,
}: {
  ikon: Icon;
  rona: string;
  judul: React.ReactNode;
  /** satu baris keterangan di bawah judul */
  ket?: React.ReactNode;
  /** baris kecil di atas judul (mis. tag status) */
  atas?: React.ReactNode;
  /** tombol atau kontrol di sisi kanan */
  aksi?: React.ReactNode;
  /** isi tambahan di bawah, di dalam pita (mis. ringkasan) */
  children?: React.ReactNode;
}) {
  return (
    <section
      className="card dasbor-muncul kepala-halaman"
      style={{
        position: "relative", overflow: "hidden", isolation: "isolate",
        padding: "var(--space-6)", gap: 18, marginBottom: "var(--jarak-kepala)",
        background: `linear-gradient(125deg, color-mix(in srgb, ${rona} 20%, var(--color-bg)) 0%, var(--color-surface) 58%)`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${rona} 26%, var(--color-divider))`,
      }}
    >
      <Ikon
        aria-hidden="true"
        size={190}
        weight="thin"
        className="kepala-hantu"
        style={{ position: "absolute", right: -22, top: -34, zIndex: -1, color: rona, opacity: 0.13, pointerEvents: "none" }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <span
          aria-hidden="true"
          className="kepala-ikon"
          style={{
            width: 54, height: 54, flex: "none", borderRadius: 14, display: "grid", placeItems: "center",
            color: rona, background: `color-mix(in srgb, ${rona} 18%, var(--color-bg))`,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${rona} 45%, transparent)`,
          }}
        >
          <Ikon size={27} weight="fill" />
        </span>

        <div style={{ minWidth: 0, flex: "1 1 0" }}>
          {atas && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>{atas}</div>}
          <h3 style={{ margin: 0, fontSize: "clamp(24px, 2.4vw, 30px)", fontWeight: 600, letterSpacing: "-0.025em", textWrap: "balance" }}>{judul}</h3>
          {ket && <div style={{ fontSize: "var(--t-isi)", lineHeight: 1.5, color: muted(70), marginTop: 5, maxWidth: "64ch", textWrap: "pretty" }}>{ket}</div>}
        </div>

        {aksi && <div className="kepala-aksi" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginLeft: "auto" }}>{aksi}</div>}
      </div>

      {children}
    </section>
  );
}

/**
 * Angka yang berhitung ke nilai barunya (mis. saat ambang pengingat diganti), sehingga
 * perubahan terbaca sebagai akibat dari aksi tadi. Nilai akhir selalu persis `nilai`;
 * dengan prefers-reduced-motion angka langsung berganti.
 */
export function AngkaNaik({ nilai }: { nilai: number }) {
  const [tampil, setTampil] = React.useState(nilai);
  const dari = React.useRef(nilai);

  React.useEffect(() => {
    const awal = dari.current;
    if (awal === nilai || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dari.current = nilai;
      setTampil(nilai);
      return;
    }
    const mulai = performance.now();
    const lama = 600;
    let id = 0;
    const langkah = (t: number) => {
      const p = Math.min(1, (t - mulai) / lama);
      const nilaiSaatIni = Math.round(awal + (nilai - awal) * (1 - Math.pow(1 - p, 3)));
      dari.current = nilaiSaatIni;
      setTampil(nilaiSaatIni);
      if (p < 1) id = requestAnimationFrame(langkah);
    };
    id = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(id);
  }, [nilai]);

  return <>{tampil}</>;
}
