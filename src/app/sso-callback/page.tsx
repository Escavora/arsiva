"use client";

import { useRouter } from "next/navigation";
import { HandleSSOCallback } from "@clerk/nextjs";

/** Kunci yang sama dengan KUNCI_TUJUAN di src/app/login/page.tsx. */
const KUNCI_TUJUAN = "arsiva:tujuan-setelah-masuk";

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
 */
export default function SsoCallbackPage() {
  const router = useRouter();

  return (
    <HandleSSOCallback
      navigateToApp={({ decorateUrl }) => {
        const url = decorateUrl(tujuanTersimpan());
        if (url.startsWith("http")) window.location.href = url;
        else router.push(url);
      }}
      navigateToSignIn={() => router.replace("/login?reason=verifikasi")}
      navigateToSignUp={() => router.replace("/login?reason=tidak-terdaftar")}
    />
  );
}
