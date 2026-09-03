// Laporan arsip dalam format CSV (dapat langsung dibuka di Excel).
//
// Sengaja CSV, bukan XLSX: tidak menambah dependensi, ringan, dan tetap terbuka
// rapi di Excel berkat baris petunjuk "sep=;" + BOM UTF-8 di awal berkas
// (Excel dengan locale Indonesia memakai ";" sebagai pemisah kolom).

import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser, HttpError } from "@/lib/guard";
import { docWith, mapDoc } from "@/lib/dto";
import { days, fmt, todayISO } from "@/lib/arsiva";

/** Bungkus satu sel CSV: kutip ganda + escape kutip di dalamnya. */
function sel(v: string | number | null | undefined): string {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function baris(...kolom: (string | number | null | undefined)[]): string {
  return kolom.map(sel).join(";");
}

export async function GET() {
  try {
    const user = await requireUser();
    const ambang = (user.reminderThresholdDays as number) ?? 60;

    const rows = await db.query.documents.findMany({
      with: docWith,
      orderBy: [desc(schema.documents.createdAt)],
    });
    const docs = rows.map(mapDoc);

    // Turunkan status memakai aturan yang sama dengan tampilan aplikasi.
    const denganStatus = docs.map((d) => {
      const sisa = days(d.e);
      const status = d.p
        ? "Diproses"
        : sisa < 0
          ? "Kadaluarsa"
          : sisa <= ambang
            ? "Segera Kadaluarsa"
            : "Aktif";
      return { ...d, sisa, status };
    });

    const hitung = (s: string) => denganStatus.filter((d) => d.status === s).length;

    const L: string[] = [];
    L.push("sep=;");
    L.push(baris("LAPORAN ARSIP DOKUMEN LEGAL — ARSIVA"));
    L.push(baris("Credit Operations Department - RO BRI Pekanbaru"));
    L.push(baris("Tanggal laporan", fmt(todayISO())));
    L.push(baris("Dibuat oleh", user.name, user.email));
    L.push(baris("Ambang pengingat", `${ambang} hari`));
    L.push("");

    L.push(baris("RINGKASAN"));
    L.push(baris("Keterangan", "Jumlah"));
    L.push(baris("Total dokumen", denganStatus.length));
    L.push(baris("Masa berlaku aman", hitung("Aktif")));
    L.push(baris("Segera kadaluarsa", hitung("Segera Kadaluarsa")));
    L.push(baris("Sudah kadaluarsa", hitung("Kadaluarsa")));
    L.push(baris("Sudah diproses", hitung("Diproses")));
    L.push(baris("Perlu tindak lanjut", hitung("Segera Kadaluarsa") + hitung("Kadaluarsa")));
    L.push("");

    // Sebaran per kategori
    const perKategori = new Map<string, number>();
    denganStatus.forEach((d) => perKategori.set(d.k, (perKategori.get(d.k) ?? 0) + 1));
    L.push(baris("SEBARAN KATEGORI"));
    L.push(baris("Kategori", "Jumlah dokumen"));
    [...perKategori.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([nama, n]) => L.push(baris(nama, n)));
    L.push("");

    L.push(baris("DAFTAR DOKUMEN"));
    L.push(
      baris(
        "No",
        "Nama Dokumen",
        "Kategori",
        "Jenis",
        "Tujuan",
        "Pemilik",
        "Tanggal Unggah",
        "Tanggal Kadaluarsa",
        "Sisa Hari",
        "Status",
        "Ukuran Berkas",
        "Berkas Scan",
      ),
    );
    denganStatus.forEach((d, i) =>
      L.push(
        baris(
          i + 1,
          d.n,
          d.k,
          d.j,
          d.t,
          d.o,
          fmt(d.u),
          fmt(d.e),
          d.sisa,
          d.status,
          d.s,
          d.hasFile ? "Ada" : "Belum ada",
        ),
      ),
    );

    // BOM agar Excel membaca UTF-8 dengan benar (nama dengan é, —, dsb.)
    const csv = "﻿" + L.join("\r\n");
    const namaFile = `laporan-arsiva-${todayISO()}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${namaFile}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Gagal membuat laporan.";
    return Response.json({ error: message }, { status });
  }
}
