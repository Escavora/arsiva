"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Vault, SignIn, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import { signIn } from "@/lib/auth-client";

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
      {/* panel kiri */}
      <div
        className="login-brand"
        style={{
          background: "linear-gradient(160deg, var(--color-section) 0%, var(--color-bg) 78%)",
          padding: "48px 52px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 17 }}>ARSIVA</div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.09em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
              Arsip Dokumen Legal
            </div>
          </div>
        </div>

        <div style={{ marginTop: "auto", maxWidth: 440 }}>
          <h2 style={{ margin: "0 0 12px", lineHeight: 1.1 }}>Satu arsip digital untuk seluruh dokumen legal bank.</h2>
          <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 68%, transparent)", margin: 0 }}>
            Perjanjian kerja sama, akta notaris, dan sertifikat agunan tersimpan rapi dengan kategori, masa berlaku, dan pengingat otomatis.
          </p>
          <div style={{ display: "flex", gap: 26, marginTop: 30, paddingTop: 22, borderTop: "1px solid var(--color-divider)" }}>
            {[["1.248", "Dokumen terarsip"], ["37", "Mitra notaris"], ["99,9%", "Ketersediaan layanan"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>{v}</div>
                <div style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 32, fontSize: 11, color: "color-mix(in srgb, var(--color-text) 40%, transparent)" }}>
          Akses terbatas untuk pegawai terdaftar · Seluruh aktivitas direkam pada audit log
        </div>
      </div>

      {/* panel form */}
      <div style={{ display: "grid", placeItems: "center", padding: 40 }}>
        <form onSubmit={doLogin} style={{ width: "min(376px, 100%)" }}>
          <h4 style={{ margin: "0 0 5px" }}>Masuk ke akun pegawai</h4>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 22 }}>
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
                onChange={(e) => setEmail(e.target.value)} style={{ minHeight: 42 }}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Kata sandi</label>
              <input
                id="password" className="input" type="password" autoComplete="current-password" required
                placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} style={{ minHeight: 42 }}
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

            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ minHeight: 44 }}>
              <SignIn size={16} />
              {loading ? "Memproses…" : "Masuk"}
            </button>

            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11.5, color: "color-mix(in srgb, var(--color-text) 50%, transparent)", marginTop: 2 }}>
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
