"use client";

import * as React from "react";
import { BATAS_IDLE_MS } from "@/lib/arsiva";

/** Seberapa sering aktivitas dilaporkan ke server (hanya bila pengguna memang aktif). */
const DENYUT_MS = 4 * 60 * 1000;
const CEK_MS = 15 * 1000;
const KUNCI = "arsiva:aktivitas-terakhir";
const PERISTIWA = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "wheel"] as const;

function bacaTersimpan(): number {
  try {
    return Number(window.localStorage.getItem(KUNCI)) || 0;
  } catch {
    return 0;
  }
}

/**
 * Keluarkan pengguna setelah 30 menit tanpa gerakan mouse/keyboard/scroll.
 *
 * Ini untuk kenyamanan (pengguna langsung diarahkan ke /login, tidak menunggu
 * error 401). Penegak aturan yang sebenarnya ada di server (src/lib/guard.ts),
 * yang menilai idle dari request terakhir. Karena server hanya tahu aktivitas
 * lewat request, hook ini mengirim "denyut" berkala selama pengguna aktif,
 * sehingga orang yang hanya membaca halaman tidak dianggap idle oleh server.
 *
 * Waktu aktivitas dibagi antar-tab lewat localStorage.
 */
export function useIdleTimeout(opts: { aktif: boolean; onIdle: () => void; onDenyut: () => void }) {
  const { aktif, onIdle, onDenyut } = opts;
  const idleRef = React.useRef(onIdle);
  const denyutRef = React.useRef(onDenyut);
  React.useEffect(() => {
    idleRef.current = onIdle;
    denyutRef.current = onDenyut;
  });

  React.useEffect(() => {
    if (!aktif) return;

    let terakhir = Date.now();
    let dicatat = 0;
    let denyutTerakhir = Date.now();
    let selesai = false;

    const catat = () => {
      const sekarang = Date.now();
      terakhir = sekarang;
      // Tulis ke localStorage paling sering tiap 5 detik.
      if (sekarang - dicatat > 5000) {
        dicatat = sekarang;
        try {
          window.localStorage.setItem(KUNCI, String(sekarang));
        } catch {
          // localStorage bisa tidak tersedia (mode privat) — timer per-tab tetap jalan.
        }
      }
    };

    const periksa = () => {
      if (selesai) return;
      const sekarang = Date.now();
      const aktivitas = Math.max(terakhir, bacaTersimpan());

      if (sekarang - aktivitas > BATAS_IDLE_MS) {
        selesai = true;
        idleRef.current();
        return;
      }
      // Laporkan ke server hanya bila pengguna aktif sejak denyut terakhir.
      if (sekarang - denyutTerakhir >= DENYUT_MS) {
        if (aktivitas > denyutTerakhir) denyutRef.current();
        denyutTerakhir = sekarang;
      }
    };

    const saatTampil = () => {
      if (document.visibilityState === "visible") periksa();
    };

    catat();
    for (const e of PERISTIWA) window.addEventListener(e, catat, { passive: true });
    document.addEventListener("visibilitychange", saatTampil);
    const timer = window.setInterval(periksa, CEK_MS);

    return () => {
      selesai = true;
      for (const e of PERISTIWA) window.removeEventListener(e, catat);
      document.removeEventListener("visibilitychange", saatTampil);
      window.clearInterval(timer);
    };
  }, [aktif]);
}
