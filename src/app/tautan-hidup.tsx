"use client";

import * as React from "react";
import { FileText, LinkSimple, LockKey, ArrowCounterClockwise, ProhibitInset, CheckCircle } from "@phosphor-icons/react";

/**
 * Peragaan tautan berbagi di hero landing page.
 *
 * Bukan data asli: kartu diberi label "Contoh" dan memakai nilai yang memang berlaku di
 * aplikasi (tautan berbatas waktu 7 hari, tombol Cabut, halaman penerima "Akses dicabut").
 * Pengunjung bisa mencabut tautannya dan melihat apa yang akan dilihat penerima.
 *
 * Gerak: cincin sisa waktu menguras lewat @property (--tautan-p), token larut huruf demi
 * huruf. Semuanya CSS/transition; jadi mati otomatis oleh aturan prefers-reduced-motion
 * milik .landing, dan keadaan akhirnya tetap benar tanpa animasi.
 */

const TOTAL = 7 * 24 * 3600; // tautan berlaku 7 hari (default di halaman Bagikan)
const AWAL = TOTAL - 19; // seolah baru dibuat 19 detik lalu; nilai tetap agar SSR = klien

const TOKEN = "Vq3xT9kM2pLw"; // contoh, bukan token sungguhan

const dua = (n: number) => String(n).padStart(2, "0");
function format(detik: number) {
  const hari = Math.floor(detik / 86400);
  const sisa = detik % 86400;
  return `${hari} hari ${dua(Math.floor(sisa / 3600))}:${dua(Math.floor((sisa % 3600) / 60))}:${dua(sisa % 60)}`;
}

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

export function TautanHidup() {
  const [dicabut, setDicabut] = React.useState(false);
  const [detik, setDetik] = React.useState(AWAL);
  const [terlihat, setTerlihat] = React.useState(true);
  const akar = React.useRef<HTMLDivElement>(null);

  // Hitung mundur hanya berjalan selagi kartu terlihat dan tautan masih aktif.
  React.useEffect(() => {
    const el = akar.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setTerlihat(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    if (dicabut || !terlihat) return;
    const id = window.setInterval(() => setDetik((d) => Math.max(0, d - 1)), 1000);
    return () => window.clearInterval(id);
  }, [dicabut, terlihat]);

  const persen = dicabut ? 0 : Math.max(0, (detik / TOTAL) * 100);

  const ulang = () => {
    setDetik(AWAL);
    setDicabut(false);
  };

  return (
    <div
      ref={akar}
      className="landing-muncul"
      style={{
        animationDelay: "320ms",
        width: "100%", maxWidth: 460, borderRadius: 16, padding: 22,
        background: "var(--color-surface)", boxShadow: "var(--shadow-lg)",
        display: "flex", flexDirection: "column", gap: 18,
      }}
    >
      {/* kepala: label contoh + status */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, color: muted(62) }}>Contoh tautan berbagi</span>
        <span className={`tag ${dicabut ? "tag-danger" : "tag-ok"}`} style={{ marginLeft: "auto" }}>
          {dicabut ? "Dicabut" : "Aktif"}
        </span>
      </div>

      {/* dokumen */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ width: 40, height: 40, flex: "none", borderRadius: 10, display: "grid", placeItems: "center", background: "var(--color-accent-900)", color: "var(--color-accent-300)", boxShadow: "inset 0 0 0 1px var(--color-accent-800)" }}>
          <FileText size={20} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3 }}>Akta Pemberian Hak Tanggungan</div>
          <div style={{ fontSize: 12.5, color: muted(66), marginTop: 2 }}>Dibagikan ke notaris@contoh.co.id</div>
        </div>
      </div>

      {/* tautan + sisa waktu */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, borderRadius: 12, background: "var(--color-surface-2)", boxShadow: "inset 0 0 0 1px var(--color-divider)" }}>
        <div
          className={`tautan-cincin${dicabut ? " tautan-cincin-mati" : ""}`}
          style={{ ["--tautan-p" as string]: `${persen}%` }}
          role="img"
          aria-label={dicabut ? "Tautan sudah tidak berlaku" : `Sisa waktu ${format(detik)}`}
        >
          <span className="tautan-cincin-isi">
            {dicabut ? <LockKey size={22} weight="fill" style={{ color: "var(--color-danger-text)" }} /> : <span style={{ fontSize: 13, fontWeight: 600 }}>{Math.floor(detik / 86400)}h</span>}
          </span>
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, whiteSpace: "nowrap" }}>
            <LinkSimple size={15} style={{ flex: "none", color: dicabut ? muted(45) : "var(--color-accent-300)", transition: "color 0.4s ease" }} />
            <span style={{ color: muted(66) }}>…/s/</span>
            <span aria-hidden="true" style={{ display: "inline-flex" }}>
              {[...TOKEN].map((h, i) => (
                <span
                  key={i}
                  className={`tautan-huruf${dicabut ? " tautan-huruf-larut" : ""}`}
                  style={{ transitionDelay: `${dicabut ? i * 38 : (TOKEN.length - i) * 22}ms` }}
                >
                  {h}
                </span>
              ))}
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: muted(62) }}>{dicabut ? "Tautan tidak berlaku lagi" : "Sisa waktu"}</div>
          <div
            className="tautan-waktu"
            style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: dicabut ? muted(40) : "var(--color-text)" }}
          >
            {dicabut ? "—" : format(detik)}
          </div>
        </div>
      </div>

      {/* apa yang dilihat penerima */}
      <div>
        <div style={{ fontSize: 12, color: muted(62), marginBottom: 8 }}>Yang dilihat penerima</div>
        <div
          aria-live="polite"
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, minHeight: 64,
            background: dicabut ? "color-mix(in srgb, var(--color-danger) 12%, transparent)" : "color-mix(in srgb, var(--color-ok) 10%, transparent)",
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${dicabut ? "var(--color-danger)" : "var(--color-ok)"} 38%, transparent)`,
            transition: "background 0.5s ease, box-shadow 0.5s ease",
          }}
        >
          <span style={{ flex: "none", display: "grid", placeItems: "center", color: dicabut ? "var(--color-danger-text)" : "var(--color-ok)" }}>
            {dicabut ? <ProhibitInset size={22} weight="fill" /> : <CheckCircle size={22} weight="fill" />}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{dicabut ? "Akses dicabut" : "Dokumen dapat dibuka"}</div>
            <div style={{ fontSize: 12.5, color: muted(72), marginTop: 1 }}>
              {dicabut ? "Pemilik dokumen telah mencabut akses tautan ini." : "Penerima membuka berkasnya lewat tautan ini."}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 48 }}>
        {dicabut ? (
          <button type="button" className="btn btn-secondary" onClick={ulang} style={{ flex: "none", whiteSpace: "nowrap" }}>
            <ArrowCounterClockwise size={16} />
            Buat tautan lagi
          </button>
        ) : (
          <button type="button" className="btn btn-danger" onClick={() => setDicabut(true)} style={{ flex: "none", whiteSpace: "nowrap" }}>
            <LockKey size={16} />
            Cabut akses
          </button>
        )}
        <span style={{ fontSize: 12.5, color: muted(62), minWidth: 0 }}>
          {dicabut ? "Berlaku seketika, di sisi server." : "Coba klik. Ini hanya contoh."}
        </span>
      </div>
    </div>
  );
}
