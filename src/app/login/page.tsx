"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Geist } from "next/font/google";
import {
  Vault,
  SignIn,
  ShieldCheck,
  WarningCircle,
  ClockCountdown,
  FileText,
  ArrowLeft,
  GoogleLogo,
} from "@phosphor-icons/react";
import { useSignIn } from "@clerk/nextjs";

// Display face untuk headline panel brand, menyatu dengan landing page.
// Form tetap memakai font aplikasi (Inter) - ini permukaan produk, bukan marketing.
const geist = Geist({ subsets: ["latin"], weight: ["500", "600"] });

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

/** Kunci sessionStorage untuk mengingat tujuan setelah kembali dari Google (sama dengan src/app/sso-callback/page.tsx). */
const KUNCI_TUJUAN = "arsiva:tujuan-setelah-masuk";

const INFO_ALASAN: Record<string, string> = {
  idle: "Sesi berakhir karena tidak ada aktivitas selama 30 menit. Silakan masuk kembali.",
  "tidak-terdaftar": "Akun Google ini belum terdaftar di ARSIVA. Hubungi Admin untuk didaftarkan.",
  verifikasi: "Verifikasi tambahan diperlukan. Masuk dengan email dan kata sandi Anda.",
};

type GalatClerk = { code?: string; message?: string; longMessage?: string };

function pesanMasuk(err: GalatClerk): string {
  switch (err.code) {
    // Sengaja tidak membedakan "email tidak ada" dan "sandi salah".
    case "form_password_incorrect":
    case "form_identifier_not_found":
    case "strategy_for_user_invalid":
      return "Email atau kata sandi salah.";
    case "form_code_incorrect":
    case "verification_failed":
      return "Kode verifikasi salah. Periksa kembali.";
    default:
      return err.longMessage ?? err.message ?? "Gagal masuk. Coba lagi.";
  }
}

// Jaminan keamanan yang benar-benar berlaku di aplikasi - bukan angka karangan.
const JAMINAN = [
  { icon: ShieldCheck, teks: "Wewenang ditegakkan di sisi server, bukan dari sisi klien." },
  { icon: ClockCountdown, teks: "Sesi berakhir otomatis setelah 30 menit tanpa aktivitas." },
  { icon: FileText, teks: "Setiap aktivitas penting terekam pada audit log." },
];

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginForm />
    </React.Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useSignIn();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [kode, setKode] = React.useState("");
  // "kode": Clerk meminta kode email (perangkat baru / verifikasi tambahan).
  const [tahap, setTahap] = React.useState<"kredensial" | "kode">("kredensial");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const alasan = params.get("reason");
  const info = alasan ? (INFO_ALASAN[alasan] ?? null) : null;
  const next = params.get("next");
  const tujuan = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  /** Selesaikan sign-in yang sudah lengkap: buat sesi lalu pindah ke tujuan. */
  const selesaikan = async () => {
    const { error: err } = await signIn.finalize({
      navigate: ({ decorateUrl }) => {
        const url = decorateUrl(tujuan);
        if (url.startsWith("http")) window.location.href = url;
        else router.push(url);
      },
    });
    if (err) throw err;
  };

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (tahap === "kode") {
        const { error: err } = await signIn.mfa.verifyEmailCode({ code: kode.trim() });
        if (err) return setError(pesanMasuk(err));
        return await selesaikan();
      }

      const { error: err } = await signIn.password({ identifier: email.trim(), password });
      if (err) return setError(pesanMasuk(err));

      if (signIn.status === "complete") return await selesaikan();

      if (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor") {
        const { error: kirimErr } = await signIn.mfa.sendEmailCode();
        if (kirimErr) return setError(pesanMasuk(kirimErr));
        setTahap("kode");
        return;
      }
      setError("Langkah verifikasi tambahan ini belum didukung. Hubungi Admin.");
    } catch (err) {
      setError(pesanMasuk(err as GalatClerk));
    } finally {
      setLoading(false);
    }
  };

  const masukDenganGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      window.sessionStorage.setItem(KUNCI_TUJUAN, tujuan);
    } catch {
      // sessionStorage tidak tersedia — setelah Google tetap diarahkan ke dashboard.
    }
    const { error: err } = await signIn.sso({
      strategy: "oauth_google",
      redirectUrl: tujuan,
      redirectCallbackUrl: "/sso-callback",
    });
    if (err) {
      setLoading(false);
      setError(pesanMasuk(err));
    }
  };

  return (
    <div
      className="login-grid"
      style={{ position: "fixed", inset: 0, display: "grid", background: "var(--color-bg)", fontFamily: "var(--font-body)" }}
    >
      {/* ── Panel brand (kiri) ── */}
      <div
        className="login-brand"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(158deg, var(--color-section) 0%, var(--color-bg) 76%)",
          borderRight: "1px solid var(--color-divider)",
          padding: "44px 52px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <a href="/" style={{ display: "flex", gap: 12, alignItems: "center", textDecoration: "none", alignSelf: "flex-start" }}>
          <div
            style={{
              width: 38, height: 38, borderRadius: "var(--radius-md)",
              background: "color-mix(in srgb, var(--color-accent) 16%, transparent)",
              boxShadow: "inset 0 0 0 1px var(--color-accent-700)",
              display: "grid", placeItems: "center", color: "var(--color-accent-200)",
            }}
          >
            <Vault size={21} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-0.01em", color: "var(--color-text)" }}>ARSIVA</div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.09em", textTransform: "uppercase", color: muted(52) }}>
              Arsip Dokumen Legal
            </div>
          </div>
        </a>

        <div style={{ marginTop: "auto", maxWidth: 460 }}>
          <h2
            className={geist.className}
            style={{ fontFamily: geist.style.fontFamily, fontSize: "clamp(26px, 2.6vw, 34px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 14px" }}
          >
            Arsip legal bank, terjaga dan tertata.
          </h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: muted(66), margin: "0 0 30px", maxWidth: "42ch" }}>
            Perjanjian kerja sama, akta notaris, dan sertifikat agunan tersimpan rapi dengan kategori, masa berlaku, dan pengingat otomatis.
          </p>

          <ul style={{ listStyle: "none", margin: 0, padding: "22px 0 0", borderTop: "1px solid var(--color-divider)", display: "flex", flexDirection: "column", gap: 14 }}>
            {JAMINAN.map((j) => (
              <li key={j.teks} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <j.icon size={18} style={{ flex: "none", marginTop: 1, color: "var(--color-accent-300)" }} />
                <span style={{ fontSize: 13.5, lineHeight: 1.5, color: muted(72) }}>{j.teks}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: 32, fontSize: 11.5, color: muted(42) }}>
          Akses terbatas untuk pegawai terdaftar, Credit Operations Department RO BRI Pekanbaru.
        </div>
      </div>

      {/* ── Panel form (kanan) ── */}
      <div style={{ position: "relative", display: "grid", placeItems: "center", padding: 40 }}>
        {/* tautan kembali - hanya tampil saat panel brand tersembunyi (mobile) */}
        <a
          href="/"
          className="login-back"
          style={{
            position: "absolute", top: 24, left: 24,
            display: "none", alignItems: "center", gap: 6,
            fontSize: 13, color: muted(64), textDecoration: "none",
          }}
        >
          <ArrowLeft size={15} />
          Beranda
        </a>

        <form className="login-form" onSubmit={doLogin} style={{ width: "min(432px, 100%)" }}>
          <h4 style={{ margin: "0 0 7px", fontSize: 26, letterSpacing: "-0.025em" }}>Masuk ke akun pegawai</h4>
          <p className="text-muted" style={{ fontSize: 14.5, marginBottom: 30 }}>
            {tahap === "kode"
              ? `Kami mengirim kode verifikasi ke ${email.trim()}. Masukkan kodenya di bawah.`
              : "Gunakan email korporat dan kata sandi internal Anda."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            {info && !error && (
              <div
                role="status"
                style={{
                  display: "flex", gap: 8, alignItems: "center", fontSize: 12.5,
                  padding: "10px 12px", borderRadius: "var(--radius-md)",
                  background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                  boxShadow: "inset 0 0 0 1px var(--color-accent-700)",
                  color: "var(--color-accent-100)",
                }}
              >
                <ClockCountdown size={16} style={{ flex: "none" }} />
                {info}
              </div>
            )}
            {error && (
              <div
                role="alert"
                style={{
                  display: "flex", gap: 8, alignItems: "center", fontSize: 12.5,
                  padding: "10px 12px", borderRadius: "var(--radius-md)",
                  background: "var(--color-danger-800)",
                  boxShadow: "inset 0 0 0 1px var(--color-danger)",
                  color: "var(--color-danger-100)",
                }}
              >
                <WarningCircle size={16} style={{ flex: "none" }} />
                {error}
              </div>
            )}

            {tahap === "kode" ? (
              <div className="field">
                <label htmlFor="kode">Kode verifikasi</label>
                <input
                  id="kode" className="input" inputMode="numeric" autoComplete="one-time-code" required
                  placeholder="123456" value={kode} autoFocus
                  onChange={(e) => setKode(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="email">Email korporat</label>
                  <input
                    id="email" className="input" type="email" autoComplete="username" required
                    placeholder="nama@bank.co.id" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="password">Kata sandi</label>
                  <input
                    id="password" className="input" type="password" autoComplete="current-password" required
                    placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <label className="radio">
                    <input type="checkbox" />
                    <span className="dot" />
                    Ingat perangkat ini
                  </label>
                  <a href="#" onClick={(e) => e.preventDefault()} style={{ marginLeft: "auto", fontSize: 12.5 }}>
                    Lupa kata sandi?
                  </a>
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              <SignIn size={17} />
              {loading ? "Memproses…" : tahap === "kode" ? "Verifikasi" : "Masuk"}
            </button>

            {tahap === "kredensial" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: muted(46) }}>
                  <span style={{ flex: 1, height: 1, background: "var(--color-divider)" }} />
                  atau
                  <span style={{ flex: 1, height: 1, background: "var(--color-divider)" }} />
                </div>
                <button
                  type="button" className="btn btn-secondary btn-block" disabled={loading}
                  onClick={() => void masukDenganGoogle()}
                >
                  <GoogleLogo size={17} weight="bold" />
                  Masuk dengan Google
                </button>
              </>
            )}

            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, lineHeight: 1.5, color: muted(52), marginTop: 2 }}>
              <ShieldCheck size={16} style={{ flex: "none", marginTop: 1 }} />
              <span>
                Sesi berakhir otomatis setelah 30 menit tanpa aktivitas. Jangan bagikan kredensial Anda kepada pihak ketiga.
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
