"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LockKey, CheckCircle, Minus, UserPlus, Key, PencilSimple, X, FloppyDisk } from "@phosphor-icons/react";
import { useArsiva, type ApiUser } from "@/components/arsiva/store";
import type { Role } from "@/lib/arsiva";

type Perm = { nama: string; a: boolean; s: boolean; p: boolean };
const MATRIX: Perm[] = [
  { nama: "Melihat arsip dokumen", a: true, s: true, p: true },
  { nama: "Mengunggah dokumen", a: true, s: true, p: false },
  { nama: "Mengubah master data", a: true, s: false, p: false },
  { nama: "Membuat tautan berbagi", a: true, s: true, p: false },
  { nama: "Mencabut akses tautan", a: true, s: true, p: false },
  { nama: "Mengelola hak akses", a: true, s: false, p: false },
];

function PermIcon({ on }: { on: boolean }) {
  return on
    ? <CheckCircle size={15} style={{ color: "var(--color-ok)" }} />
    : <Minus size={15} style={{ color: "var(--color-neutral-700)" }} />;
}

export default function AksesPage() {
  const router = useRouter();
  const { state, isAdmin, setUserPeran, toggleUser, removeUser, addUser, updateUser, say } = useArsiva();
  const isStaf = !isAdmin;

  const [nu, setNu] = React.useState<{ nama: string; email: string; unit: string; peran: Role }>({ nama: "", email: "", unit: "", peran: "Team Member" });

  const [editUser, setEditUser] = React.useState<ApiUser | null>(null);
  const [editForm, setEditForm] = React.useState({ nama: "", email: "", unit: "" });
  const [menyimpan, setMenyimpan] = React.useState(false);

  const userCountText = `${state.users.length} pengguna · ${state.users.filter((u) => u.aktif).length} aktif`;

  const tambah = async () => {
    if (await addUser(nu)) setNu({ nama: "", email: "", unit: "", peran: "Team Member" });
  };

  const bukaEditUser = (u: ApiUser) => {
    setEditUser(u);
    setEditForm({ nama: u.nama, email: u.email, unit: u.unit });
  };

  const simpanEditUser = async () => {
    if (!editUser) return;
    if (!editForm.nama.trim()) return say("Nama pengguna wajib diisi.");
    if (!editForm.email.trim()) return say("Email wajib diisi.");
    setMenyimpan(true);
    const ok = await updateUser(editUser.id, {
      nama: editForm.nama.trim(),
      email: editForm.email.trim(),
      unit: editForm.unit.trim(),
    });
    setMenyimpan(false);
    if (ok) setEditUser(null);
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 4px" }}>Kelola Hak Akses</h3>
      <div className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
        Pengguna terdaftar dan kewenangannya atas arsip dokumen.
      </div>

      {isStaf && (
        <div style={{ display: "flex", gap: 9, alignItems: "center", padding: "11px 14px", marginBottom: 16, borderRadius: "var(--radius-md)", background: "var(--color-danger-800)", boxShadow: "inset 0 0 0 1px var(--color-danger)", fontSize: 12.5 }}>
          <LockKey size={16} style={{ color: "var(--color-danger-100)", flex: "none" }} />
          Halaman ini hanya dapat diubah oleh Admin. Anda melihat dalam mode baca.
        </div>
      )}

      <div className="grid gap-4 items-start grid-cols-1 lg:grid-cols-[1.6fr_1fr]">
        {/* users */}
        <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <h5 style={{ margin: 0 }}>Pengguna</h5>
            <span className="text-muted" style={{ marginLeft: "auto", fontSize: 12 }}>{userCountText}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th style={{ width: 112 }}>Unit kerja</th>
                  <th style={{ width: 132 }}>Peran</th>
                  <th style={{ width: 96 }}>Status</th>
                  <th style={{ width: 178 }} />
                </tr>
              </thead>
              <tbody>
                {state.users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontSize: 13.5, maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.nama}</div>
                      <div style={{ fontSize: 11, maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "color-mix(in srgb, var(--color-text) 42%, transparent)" }}>{u.email}</div>
                    </td>
                    <td style={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.unit}</td>
                    <td>
                      <select
                        className="input"
                        value={u.peran}
                        onChange={(e) => void setUserPeran(u.id, e.target.value as Role)}
                        disabled={isStaf}
                        style={{ minHeight: 30, minWidth: 122, fontSize: 12.5, padding: "3px 8px" }}
                      >
                        <option>Admin</option>
                        <option>Team Member</option>
                        <option>Pembaca</option>
                      </select>
                    </td>
                    <td><span className={`tag ${u.aktif ? "tag-ok" : "tag-neutral"}`}>{u.aktif ? "Aktif" : "Nonaktif"}</span></td>
                    <td style={{ textAlign: "right" }}>
                      {isAdmin && (
                        <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                          <button type="button" className="btn btn-ghost btn-icon" onClick={() => bukaEditUser(u)} title="Ubah data pengguna" style={{ width: 26, height: 26 }}>
                            <PencilSimple size={13} />
                          </button>
                          <button type="button" className="btn btn-ghost" onClick={() => void toggleUser(u.id, !u.aktif)} style={{ fontSize: 11.5 }}>{u.aktif ? "Nonaktifkan" : "Aktifkan"}</button>
                          <button type="button" className="btn btn-ghost" onClick={() => void removeUser(u.id)} style={{ fontSize: 11.5, color: "var(--color-danger)" }}>Hapus</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-divider)" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 45%, transparent)", marginBottom: 10 }}>Tambah pengguna baru</div>
            <div className="grid gap-3 items-end grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1.1fr_1.3fr_1fr_118px_auto]">
              <div className="field" style={{ margin: 0 }}><label>Nama</label><input className="input" placeholder="Nama pegawai" value={nu.nama} onChange={(e) => setNu((v) => ({ ...v, nama: e.target.value }))} /></div>
              <div className="field" style={{ margin: 0 }}><label>Email korporat</label><input className="input" placeholder="nama@bank.co.id" value={nu.email} onChange={(e) => setNu((v) => ({ ...v, email: e.target.value }))} /></div>
              <div className="field" style={{ margin: 0 }}><label>Unit kerja</label><input className="input" placeholder="mis. Legal Kredit" value={nu.unit} onChange={(e) => setNu((v) => ({ ...v, unit: e.target.value }))} /></div>
              <div className="field" style={{ margin: 0 }}>
                <label>Peran</label>
                <select className="input" value={nu.peran} onChange={(e) => setNu((v) => ({ ...v, peran: e.target.value as Role }))}>
                  <option>Admin</option>
                  <option>Team Member</option>
                  <option>Pembaca</option>
                </select>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => void tambah()}>
                <UserPlus size={15} />
                Tambah
              </button>
            </div>
          </div>
        </div>

        {/* matrix + session */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
            <h5 style={{ margin: 0 }}>Kewenangan per peran</h5>
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Kewenangan</th>
                    <th style={{ width: 56 }}>Admin</th>
                    <th style={{ width: 66 }}>Tim</th>
                    <th style={{ width: 66 }}>Pembaca</th>
                  </tr>
                </thead>
                <tbody>
                  {MATRIX.map((m) => (
                    <tr key={m.nama}>
                      <td style={{ fontSize: 12.5 }}>{m.nama}</td>
                      <td><PermIcon on={m.a} /></td>
                      <td><PermIcon on={m.s} /></td>
                      <td><PermIcon on={m.p} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card elev-sm" style={{ padding: "var(--space-4)", gap: "var(--space-3)" }}>
            <h5 style={{ margin: 0 }}>Keamanan sesi</h5>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 11, columnGap: 12, fontSize: 12.5, alignItems: "center" }}>
              <span className="text-muted">Sesi login otomatis berakhir</span><span>30 menit</span>
              <span className="text-muted">Verifikasi dua langkah</span><span className="tag tag-ok">Aktif</span>
              <span className="text-muted">Catatan aktivitas (audit log)</span><span className="tag tag-ok">Direkam</span>
            </div>
            <button type="button" className="btn btn-secondary btn-block" onClick={() => router.push("/sandi")}>
              <Key size={15} />
              Ubah Kata Sandi Saya
            </button>
          </div>
        </div>
      </div>

      {/* Dialog: ubah data pengguna */}
      {editUser && (
        <div className="dialog-backdrop" onClick={() => !menyimpan && setEditUser(null)}>
          <div className="dialog" style={{ width: "min(440px, 100%)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <h5 style={{ margin: 0 }}>Ubah data pengguna</h5>
              <button type="button" className="btn btn-secondary btn-icon" onClick={() => setEditUser(null)} style={{ marginLeft: "auto" }} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>

            <div className="field">
              <label>Nama</label>
              <input className="input" value={editForm.nama} onChange={(e) => setEditForm((v) => ({ ...v, nama: e.target.value }))} />
            </div>
            <div className="field">
              <label>Email korporat</label>
              <input className="input" type="email" value={editForm.email} onChange={(e) => setEditForm((v) => ({ ...v, email: e.target.value }))} />
            </div>
            <div className="field">
              <label>Unit kerja</label>
              <input className="input" value={editForm.unit} onChange={(e) => setEditForm((v) => ({ ...v, unit: e.target.value }))} />
            </div>

            {editForm.email.trim().toLowerCase() !== editUser.email && (
              <div style={{ fontSize: 11.5, color: "color-mix(in srgb, var(--color-text) 55%, transparent)", display: "flex", gap: 7 }}>
                <LockKey size={14} style={{ flex: "none", marginTop: 1 }} />
                <span>Mengubah email berarti pengguna ini akan masuk memakai alamat baru mulai sekarang.</span>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 2 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditUser(null)} disabled={menyimpan}>Batal</button>
              <button type="button" className="btn btn-primary" onClick={() => void simpanEditUser()} disabled={menyimpan}>
                <FloppyDisk size={15} />
                {menyimpan ? "Menyimpan…" : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
