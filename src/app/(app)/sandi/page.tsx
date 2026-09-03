"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Key, WarningCircle, ShieldCheck } from "@phosphor-icons/react";
import { toast } from "sonner";
import { changePassword } from "@/lib/auth-client";

const MIN = 8;

export default function SandiPage() {
  const router = useRouter();

  const [lama, setLama] = React.useState("");
  const [baru, setBaru] = React.useState("");
  const [ulang, setUlang] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [menyimpan, setMenyimpan] = React.useState(false);
  // Keluarkan sesi di perangkat lain — default aman untuk aplikasi perbankan.
  const [keluarkanLain, setKeluarkanLain] = React.useState(true);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!lama || !baru || !ulang) return setError("Semua kolom wajib diisi.");
    if (baru.length < MIN) return setError(`Kata sandi baru minimal ${MIN} karakter.`);
    if (baru !== ulang) return setError("Konfirmasi kata sandi tidak cocok dengan kata sandi baru.");
    if (baru === lama) return setError("Kata sandi baru harus berbeda dari kata sandi saat ini.");

    setMenyimpan(true);
    const { error: err } = await changePassword({
      currentPassword: lama,
      newPassword: baru,
      revokeOtherSessions: keluarkanLain,
    });
    setMenyimpan(false);

    if (err) {
      // Better Auth membalas 400/401 bila kata sandi saat ini salah.
      setError(
        err.status === 400 || err.status === 401
          ? "Kata sandi saat ini salah."
          : (err.message ?? "Gagal mengubah kata sandi. Coba lagi."),
      );
      return;
    }

    toast.success("Kata sandi berhasil diperbarui.");
    router.push("/dashboard");
  };

  return (
    <div style={{ maxWidth: 520 }}>
      <h3 style={{ margin: "0 0 4px" }}>Ubah Kata Sandi</h3>
      <div className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
        Gunakan kombinasi minimal {MIN} karakter dengan huruf, angka, dan simbol.
      </div>

      <form onSubmit={simpan} className="card elev-sm" style={{ padding: "var(--space-6)", gap: "var(--space-4)" }}>
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
          <label htmlFor="lama">Kata sandi saat ini</label>
          <input
            id="lama" className="input" type="password" autoComplete="current-password"
            placeholder="••••••••" value={lama} onChange={(e) => setLama(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="baru">Kata sandi baru</label>
          <input
            id="baru" className="input" type="password" autoComplete="new-password"
            placeholder="••••••••" value={baru} onChange={(e) => setBaru(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="ulang">Ulangi kata sandi baru</label>
          <input
            id="ulang" className="input" type="password" autoComplete="new-password"
            placeholder="••••••••" value={ulang} onChange={(e) => setUlang(e.target.value)}
          />
        </div>

        <label className="radio" style={{ alignItems: "flex-start" }}>
          <input type="checkbox" checked={keluarkanLain} onChange={(e) => setKeluarkanLain(e.target.checked)} />
          <span className="dot" style={{ marginTop: 2 }} />
          <span style={{ fontSize: 12.5, lineHeight: 1.5 }}>
            Keluarkan sesi di perangkat lain
            <span className="text-muted" style={{ display: "block", fontSize: 11.5 }}>
              Disarankan bila Anda menduga akun pernah diakses orang lain.
            </span>
          </span>
        </label>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11.5, color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
          <ShieldCheck size={15} style={{ flex: "none", marginTop: 1 }} />
          <span>Kata sandi disimpan dalam bentuk terenkripsi dan tidak pernah ditampilkan kembali.</span>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.push("/dashboard")} disabled={menyimpan}>
            Batal
          </button>
          <button type="submit" className="btn btn-primary" disabled={menyimpan}>
            <Key size={15} />
            {menyimpan ? "Menyimpan…" : "Simpan Kata Sandi"}
          </button>
        </div>
      </form>
    </div>
  );
}
