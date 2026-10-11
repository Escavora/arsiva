"use client";

import * as React from "react";
import { WarningCircle } from "@phosphor-icons/react";

type Permintaan = {
  judul: string;
  isi: React.ReactNode;
  /** Label tombol aksi, mis. "Hapus Permanen". */
  tombol: string;
  /** Dijalankan setelah pengguna menekan tombol aksi; dialog menunggu sampai selesai. */
  aksi: () => Promise<unknown>;
};

/**
 * Dialog konfirmasi untuk aksi yang merusak atau sulit dibatalkan.
 *
 *   const { minta, dialog } = useKonfirmasi();
 *   <button onClick={() => minta({ judul, isi, tombol: "Hapus", aksi: () => removeX(id) })}>Hapus</button>
 *   {dialog}
 *
 * Fokus awal ada di "Batal" agar Enter yang tidak disengaja tidak menjalankan aksi.
 */
export function useKonfirmasi() {
  const [permintaan, setPermintaan] = React.useState<Permintaan | null>(null);
  const [sedang, setSedang] = React.useState(false);
  const batalRef = React.useRef<HTMLButtonElement>(null);
  const judulId = React.useId();

  const tutup = React.useCallback(() => {
    if (!sedang) setPermintaan(null);
  }, [sedang]);

  React.useEffect(() => {
    if (!permintaan) return;
    batalRef.current?.focus();
    const saatTombol = (e: KeyboardEvent) => { if (e.key === "Escape") tutup(); };
    window.addEventListener("keydown", saatTombol);
    return () => window.removeEventListener("keydown", saatTombol);
  }, [permintaan, tutup]);

  const jalankan = async () => {
    if (!permintaan) return;
    setSedang(true);
    try {
      await permintaan.aksi();
    } finally {
      setSedang(false);
      setPermintaan(null);
    }
  };

  const dialog = permintaan && (
    <div className="dialog-backdrop" onClick={tutup}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={judulId}
        style={{ width: "min(420px, 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ width: 36, height: 36, flex: "none", borderRadius: "var(--radius-md)", background: "var(--color-danger-800)", color: "var(--color-danger-100)", display: "grid", placeItems: "center" }}>
            <WarningCircle size={19} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h5 id={judulId} style={{ margin: "0 0 4px" }}>{permintaan.judul}</h5>
            <div className="text-muted" style={{ fontSize: "var(--t-ket)" }}>{permintaan.isi}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 2 }}>
          <button ref={batalRef} type="button" className="btn btn-secondary" onClick={tutup} disabled={sedang}>Batal</button>
          <button type="button" className="btn btn-danger" onClick={() => void jalankan()} disabled={sedang}>
            {sedang ? "Memproses…" : permintaan.tombol}
          </button>
        </div>
      </div>
    </div>
  );

  return { minta: setPermintaan, dialog };
}
