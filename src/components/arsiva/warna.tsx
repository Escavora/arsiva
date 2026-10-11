"use client";

import * as React from "react";
import { useArsiva } from "./store";

/**
 * Warna identitas kategori.
 *
 * Setiap kategori mendapat satu rona tetap dari palet --kat-* (globals.css) berdasarkan id-nya,
 * sehingga "Surat Kuasa" berwarna sama di Arsip, Pengingat, Dasbor, detail, dan Unggah.
 * Kategori baru otomatis mendapat rona berikutnya. Nama yang tidak (lagi) ada di master data
 * jatuh ke rona hasil hash nama, tetap stabil.
 *
 * Warna kategori selalu disertai nama kategorinya: warna tidak pernah menjadi satu-satunya kode.
 */

const PALET = ["ungu", "sian", "magenta", "kuning", "toska", "nila", "pasir", "limau"] as const;
export type Rona = (typeof PALET)[number];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function ronaDari(nama: string, cats: { id: number; nama: string }[]): Rona {
  const c = cats.find((x) => x.nama === nama);
  return c ? PALET[(c.id - 1 + PALET.length) % PALET.length] : PALET[hash(nama) % PALET.length];
}

/** Nilai CSS untuk satu rona: titik/isian, teks terbaca, dan latar tipis. */
export function gayaRona(r: Rona) {
  return {
    titik: `var(--kat-${r})`,
    teks: `var(--kat-${r}-teks)`,
    latar: `color-mix(in srgb, var(--kat-${r}) 22%, transparent)`,
    tepi: `color-mix(in srgb, var(--kat-${r}) 45%, transparent)`,
  };
}

export function useRonaKategori() {
  const { state } = useArsiva();
  const cats = state.cats;
  return React.useCallback((nama: string) => gayaRona(ronaDari(nama, cats)), [cats]);
}

/** Titik bulat kecil berwarna kategori. Dekoratif: nama kategori selalu ada di sebelahnya. */
export function TitikKategori({ nama, size = 8 }: { nama: string; size?: number }) {
  const rona = useRonaKategori()(nama);
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, flex: "none", borderRadius: "50%", background: rona.titik, display: "inline-block" }}
    />
  );
}

/** Tag kategori: bergaris tepi dengan titik, sengaja beda bentuk dari tag status yang berisi warna. */
export function TagKategori({ nama }: { nama: string }) {
  const rona = useRonaKategori()(nama);
  return (
    <span className="tag" style={{ gap: 6, color: rona.teks, boxShadow: `inset 0 0 0 1px ${rona.tepi}` }}>
      <TitikKategori nama={nama} size={7} />
      {nama}
    </span>
  );
}

/** Titik + nama kategori, untuk sel tabel dan baris ringkas. */
export function LabelKategori({ nama, fontSize = 12.5 }: { nama: string; fontSize?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize, minWidth: 0 }}>
      <TitikKategori nama={nama} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nama}</span>
    </span>
  );
}
