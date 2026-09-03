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
} from "@phosphor-icons/react";
import { signIn } from "@/lib/auth-client";

// Display face untuk headline panel brand, menyatu dengan landing page.
// Form tetap memakai font aplikasi (Inter) - ini permukaan produk, bukan marketing.
const geist = Geist({ subsets: ["latin"], weight: ["500", "600"] });

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

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
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: err } = await signIn.email({ email: email.trim(), password });

    if (err) {
      setLoading(false);
      setError(
        err.status === 401 || err.status === 403
          ? "Email atau kata sandi salah."
          : (err.message ?? "Gagal masuk. Coba lagi."),
      );
      return;
    }

    const next = params.get("next");
    router.push(next && next.startsWith("/") ? next : "/dashboard");
    router.refresh();
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

        <form onSubmit={doLogin} style={{ width: "min(376px, 100%)" }}>
          <h4 style={{ margin: "0 0 5px", fontSize: 20, letterSpacing: "-0.02em" }}>Masuk ke akun pegawai</h4>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 24 }}>
            Gunakan email korporat dan kata sandi internal Anda.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
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

            <div className="field">
              <label htmlFor="email">Email korporat</label>
              <input
                id="email" className="input" type="email" autoComplete="username" required
                placeholder="nama@bank.co.id" value={email}
                onChange={(e) => setEmail(e.target.value)} style={{ minHeight: 44 }}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Kata sandi</label>
              <input
                id="password" className="input" type="password" autoComplete="current-password" required
                placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} style={{ minHeight: 44 }}
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

            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ minHeight: 46 }}>
              <SignIn size={16} />
              {loading ? "Memproses…" : "Masuk"}
            </button>

            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11.5, color: muted(50), marginTop: 2 }}>
              <ShieldCheck size={15} style={{ flex: "none", marginTop: 1 }} />
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
