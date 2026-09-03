"use client";

import { useRouter } from "next/navigation";
import { useArsiva } from "@/components/arsiva/store";

export default function SandiPage() {
  const router = useRouter();
  const { say } = useArsiva();

  return (
    <div style={{ maxWidth: 520 }}>
      <h3 style={{ margin: "0 0 4px" }}>Ubah Kata Sandi</h3>
      <div className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
        Gunakan kombinasi minimal 10 karakter dengan huruf, angka, dan simbol.
      </div>
      <div className="card elev-sm" style={{ padding: "var(--space-6)", gap: "var(--space-4)" }}>
        <div className="field"><label>Kata sandi saat ini</label><input className="input" type="password" placeholder="••••••••" /></div>
        <div className="field"><label>Kata sandi baru</label><input className="input" type="password" placeholder="••••••••" /></div>
        <div className="field"><label>Ulangi kata sandi baru</label><input className="input" type="password" placeholder="••••••••" /></div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.push("/dashboard")}>Batal</button>
          <button type="button" className="btn btn-primary" onClick={() => { say("Kata sandi berhasil diperbarui."); router.push("/dashboard"); }}>Simpan Kata Sandi</button>
        </div>
      </div>
    </div>
  );
}
