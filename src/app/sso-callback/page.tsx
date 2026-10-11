"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HandleSSOCallback } from "@clerk/nextjs";

/** Kunci yang sama dengan KUNCI_TUJUAN di src/app/login/page.tsx. */
const KUNCI_TUJUAN = "arsiva:tujuan-setelah-masuk";

/** Setelah selang ini tanpa pengalihan, tampilkan jalan keluar manual. */
const BATAS_TUNGGU_MS = 8000;

function tujuanTersimpan(): string {
  try {
    const t = window.sessionStorage.getItem(KUNCI_TUJUAN);
    window.sessionStorage.removeItem(KUNCI_TUJUAN);
    if (t && t.startsWith("/") && !t.startsWith("//")) return t;
  } catch {
    // sessionStorage tidak tersedia
  }
  return "/dashboard";
}

/**
 * Tempat Google mengembalikan pengguna. Pendaftaran publik dimatikan di Clerk
 * (mode Restricted), jadi akun Google yang belum dibuatkan Admin tidak akan
 * pernah punya sesi — mereka diarahkan kembali ke /login dengan penjelasan.
 *
 * HandleSSOCallback tidak berpindah halaman bila status sign-in tidak cocok
 * dengan cabang mana pun (mis. halaman dibuka langsung tanpa alur Google), dan
 * tidak menampilkan apa-apa. Karena itu ada teks tunggu dan, setelah beberapa
 * detik, tautan kembali. Sengaja bukan pengalihan otomatis: komponen ini bisa
 * menampilkan captcha yang sedang diisi pengguna.
 */
export default function SsoCallbackPage() {
  const router = useRouter();
  const [lama, setLama] = React.useState(false);

  React.useEffect(() => {
    const t = window.setTimeout(() => setLama(true), BATAS_TUNGGU_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed", inset: 0, display: "grid", placeItems: "center",
        background: "var(--color-bg)", fontFamily: "var(--font-body)", padding: 24,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
        <p className="text-muted" style={{ margin: 0, fontSize: "var(--t-isi)" }} role="status">
          Menyelesaikan masuk dengan Google…
        </p>
        {lama && (
          <a href="/login" style={{ fontSize: "var(--t-ket)" }}>
            Kembali ke halaman masuk
          </a>
        )}
        <HandleSSOCallback
          navigateToApp={({ decorateUrl }) => {
            const url = decorateUrl(tujuanTersimpan());
            if (url.startsWith("http")) window.location.href = url;
            else router.push(url);
          }}
          navigateToSignIn={() => router.replace("/login?reason=verifikasi")}
          navigateToSignUp={() => router.replace("/login?reason=tidak-terdaftar")}
        />
      </div>
    </div>
  );
}
