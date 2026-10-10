"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  analytics,
  computeCounts,
  initials,
  viewDoc,
  type Role,
  type ViewDoc,
} from "@/lib/arsiva";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useIdleTimeout } from "@/lib/use-idle-timeout";

/** Status pengiriman email dari API (cerminan HasilKirim di src/lib/notify.ts). */
export type HasilKirim = { terkirim: boolean; driver: string; error?: string };

/* ───────────────────────── Bentuk data dari API ───────────────────────── */

export type ApiDoc = {
  id: number; n: string; k: string; j: string; t: string;
  e: string; u: string; o: string; s: string; p: boolean;
  ket: string; hasFile: boolean; fileName: string | null;
  categoryId: number | null; typeId: number | null; purposeId: number | null;
};
export type ApiCat = { id: number; nama: string; desk: string; jumlah: number };
export type ApiNamed = { id: number; nama: string };
export type ApiNotaris = { id: number; nama: string; kantor: string; email: string; tel: string; jumlahJadwal: number };
export type ApiSchedule = {
  id: number; notarisId: number; notarisNama: string;
  agenda: string; tgl: string; jam: string;
  st: "Direncanakan" | "Selesai" | "Dibatalkan";
};
export type ApiShare = {
  id: number; documentId: number; doc: string; email: string;
  tipe: "Notaris" | "Rekanan"; token: string; exp: string; dibuat: string;
  status: "Aktif" | "Dicabut" | "Kadaluarsa"; bisaCabut: boolean;
};
export type ApiUser = { id: string; nama: string; email: string; unit: string; peran: Role; aktif: boolean };
export type ApiNotif = {
  id: number; judul: string; pesan: string; tipe: string;
  documentId: number | null; dibaca: boolean; createdAt: string;
};

type State = {
  docs: ApiDoc[];
  cats: ApiCat[];
  types: ApiNamed[];
  purposes: ApiNamed[];
  notaris: ApiNotaris[];
  schedules: ApiSchedule[];
  shares: ApiShare[];
  users: ApiUser[];
  notifications: ApiNotif[];
  notarisAktif: number | null; // id notaris terpilih
  loading: boolean;
};

const EMPTY: State = {
  docs: [], cats: [], types: [], purposes: [], notaris: [],
  schedules: [], shares: [], users: [], notifications: [],
  notarisAktif: null, loading: true,
};

type Me = { nama: string; panggilan: string; peran: Role; peranText: string; inisial: string; email: string };

/* ───────────────────────── Pemanggil API ───────────────────────── */

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body instanceof FormData ? init?.headers : { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) window.dispatchEvent(new Event(EVENT_SESI_BERAKHIR));
  if (!res.ok) throw new Error(data?.error ?? "Permintaan gagal.");
  return data as T;
}

/** Dipicu api() saat server menjawab 401 (sesi habis/dicabut), agar provider mengeluarkan pengguna. */
const EVENT_SESI_BERAKHIR = "arsiva:sesi-berakhir";

/** Profil pengguna dari GET /api/me — peran & unit dibaca server dari database, bukan dari token. */
type ApiMe = { id: string; nama: string; email: string; unit: string; peran: Role; threshold: number };

type Ctx = {
  state: State;
  me: Me;
  isAdmin: boolean;
  canWrite: boolean;
  threshold: number;
  allDocs: (ApiDoc & ViewDoc)[];
  counts: ReturnType<typeof computeCounts>;
  stats: ReturnType<typeof analytics>;
  refresh: () => Promise<void>;
  setThreshold: (t: number) => Promise<void>;
  // dokumen
  tandai: (id: number, sudah: boolean) => Promise<void>;
  addDoc: (form: FormData) => Promise<boolean>;
  updateDoc: (id: number, fields: {
    nama: string; ket: string; exp: string;
    categoryId: number | null; typeId: number | null; purposeId: number | null;
  }) => Promise<boolean>;
  removeDoc: (id: number) => Promise<boolean>;
  // master data
  addCategory: (nama: string, desk: string) => Promise<boolean>;
  removeCategory: (id: number) => Promise<void>;
  updateCategory: (id: number, fields: { nama: string; desk: string }) => Promise<boolean>;
  addType: (nama: string) => Promise<boolean>;
  removeType: (id: number) => Promise<void>;
  addPurpose: (nama: string) => Promise<boolean>;
  removePurpose: (id: number) => Promise<void>;
  // notaris
  setNotarisAktif: (id: number) => void;
  addNotaris: (n: { nama: string; kantor: string; email: string; tel: string }) => Promise<boolean>;
  removeNotaris: (id: number) => Promise<void>;
  addSchedule: (s: { notarisId: number; agenda: string; tgl: string; jam: string }) => Promise<boolean>;
  cancelSchedule: (id: number) => Promise<void>;
  // berbagi
  /** Mengembalikan tautan yang dibuat + status pengiriman email, atau null bila gagal. */
  addShare: (s: {
    documentId: number; email: string; tipe: "Notaris" | "Rekanan"; hari: number;
  }) => Promise<{ url: string; email: HasilKirim } | null>;
  revokeShare: (id: number) => Promise<void>;
  clearShares: () => Promise<void>;
  // pengguna
  setUserPeran: (id: string, peran: Role) => Promise<void>;
  toggleUser: (id: string, aktif: boolean) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  addUser: (u: { nama: string; email: string; unit: string; peran: Role }) => Promise<boolean>;
  updateUser: (id: string, fields: { nama: string; email: string; unit: string }) => Promise<boolean>;
  // lain-lain
  markNotificationsRead: () => Promise<void>;
  logout: () => Promise<void>;
  say: (msg: string) => void;
};

const ArsivaContext = React.createContext<Ctx | null>(null);

export function ArsivaProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [state, setState] = React.useState<State>(EMPTY);
  const [profil, setProfil] = React.useState<ApiMe | null>(null);
  const [akunError, setAkunError] = React.useState<string | null>(null);

  const sessionUser = React.useMemo(
    () =>
      profil && {
        name: profil.nama,
        email: profil.email,
        unit: profil.unit,
        peran: profil.peran,
        reminderThresholdDays: profil.threshold,
      },
    [profil],
  );
  const peran: Role = sessionUser?.peran ?? "Pembaca";
  const threshold = sessionUser?.reminderThresholdDays ?? 60;
  const isPending = !isLoaded || (isSignedIn === true && !profil && !akunError);

  /* ── profil pengguna (peran & unit dari server) ── */
  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let batal = false;
    api<{ me: ApiMe }>("/api/me")
      .then((r) => { if (!batal) setProfil(r.me); })
      .catch((e) => { if (!batal) setAkunError(e instanceof Error ? e.message : "Gagal memuat akun."); });
    return () => { batal = true; };
  }, [isLoaded, isSignedIn]);

  /* ── keluar: manual, sesi habis, atau idle 30 menit ── */
  const keluar = React.useCallback(
    async (alasan?: "idle") => {
      const tujuan = alasan ? `/login?reason=${alasan}` : "/login";
      try {
        await signOut({ redirectUrl: tujuan });
      } catch {
        // Sesi mungkin sudah dicabut server — tetap arahkan ke halaman masuk.
        window.location.href = tujuan;
      }
    },
    [signOut],
  );

  React.useEffect(() => {
    const saatBerakhir = () => void keluar("idle");
    window.addEventListener(EVENT_SESI_BERAKHIR, saatBerakhir);
    return () => window.removeEventListener(EVENT_SESI_BERAKHIR, saatBerakhir);
  }, [keluar]);

  useIdleTimeout({
    aktif: isLoaded && isSignedIn === true && !!profil,
    onIdle: () => void keluar("idle"),
    // Denyut: server hanya tahu aktivitas lewat request, jadi lapor berkala.
    onDenyut: () => void api("/api/me").catch(() => {}),
  });

  const say = React.useCallback((msg: string) => toast(msg), []);
  const fail = React.useCallback((e: unknown) => {
    toast.error(e instanceof Error ? e.message : "Terjadi kesalahan.");
  }, []);

  /* ── memuat seluruh data ── */
  const refresh = React.useCallback(async () => {
    try {
      const [d, c, t, p, n, s, sh, u, nt] = await Promise.all([
        api<{ docs: ApiDoc[] }>("/api/documents"),
        api<{ cats: ApiCat[] }>("/api/categories"),
        api<{ types: ApiNamed[] }>("/api/types"),
        api<{ purposes: ApiNamed[] }>("/api/purposes"),
        api<{ notaris: ApiNotaris[] }>("/api/notaris"),
        api<{ schedules: ApiSchedule[] }>("/api/schedules"),
        api<{ shares: ApiShare[] }>("/api/shares"),
        api<{ users: ApiUser[] }>("/api/users"),
        api<{ notifications: ApiNotif[] }>("/api/notifications"),
      ]);
      setState((prev) => ({
        docs: d.docs, cats: c.cats, types: t.types, purposes: p.purposes,
        notaris: n.notaris, schedules: s.schedules, shares: sh.shares,
        users: u.users, notifications: nt.notifications,
        notarisAktif:
          prev.notarisAktif && n.notaris.some((x) => x.id === prev.notarisAktif)
            ? prev.notarisAktif
            : (n.notaris[0]?.id ?? null),
        loading: false,
      }));
    } catch (e) {
      setState((prev) => ({ ...prev, loading: false }));
      fail(e);
    }
  }, [fail]);

  React.useEffect(() => {
    if (sessionUser) void refresh();
  }, [sessionUser, refresh]);

  /* ── data turunan ── */
  const me: Me = React.useMemo(() => {
    const nama = sessionUser?.name ?? "—";
    return {
      nama,
      panggilan: nama.split(" ")[0] ?? nama,
      peran,
      peranText: `${peran} · ${sessionUser?.unit ?? "Divisi Legal"}`,
      inisial: initials(nama),
      email: sessionUser?.email ?? "",
    };
  }, [sessionUser, peran]);

  const allDocs = React.useMemo(
    () => state.docs.map((d) => viewDoc(d, threshold)),
    [state.docs, threshold],
  );
  const counts = React.useMemo(() => computeCounts(allDocs), [allDocs]);
  const stats = React.useMemo(() => analytics(allDocs, threshold, counts), [allDocs, threshold, counts]);

  /* ── helper mutasi ── */
  const run = React.useCallback(
    async (fn: () => Promise<unknown>, pesanSukses?: string): Promise<boolean> => {
      try {
        await fn();
        await refresh();
        if (pesanSukses) toast.success(pesanSukses);
        return true;
      } catch (e) {
        fail(e);
        return false;
      }
    },
    [refresh, fail],
  );

  /* ── aksi ── */
  const setThreshold = React.useCallback(
    async (t: number) => {
      try {
        await api("/api/me", { method: "PATCH", body: JSON.stringify({ threshold: t }) });
        setProfil((p) => (p ? { ...p, threshold: t } : p));
      } catch (e) {
        fail(e);
      }
    },
    [fail],
  );

  const tandai = React.useCallback(
    async (id: number, sudah: boolean) => {
      await run(
        () => api(`/api/documents/${id}`, { method: "PATCH", body: JSON.stringify({ p: sudah }) }),
        sudah ? "Dokumen ditandai sudah diproses." : 'Penandaan "diproses" dibatalkan.',
      );
    },
    [run],
  );

  const addDoc = React.useCallback(
    (form: FormData) => run(() => api("/api/documents", { method: "POST", body: form }), "Dokumen tersimpan di arsip."),
    [run],
  );

  const updateDoc = React.useCallback(
    (id: number, fields: {
      nama: string; ket: string; exp: string;
      categoryId: number | null; typeId: number | null; purposeId: number | null;
    }) =>
      run(
        () => api(`/api/documents/${id}`, { method: "PATCH", body: JSON.stringify(fields) }),
        "Informasi dokumen diperbarui.",
      ),
    [run],
  );

  const removeDoc = React.useCallback(
    (id: number) => run(() => api(`/api/documents/${id}`, { method: "DELETE" }), "Dokumen dihapus dari arsip."),
    [run],
  );

  const addCategory = React.useCallback(
    (nama: string, desk: string) =>
      run(() => api("/api/categories", { method: "POST", body: JSON.stringify({ nama, desk }) }), `Kategori "${nama}" ditambahkan.`),
    [run],
  );
  const removeCategory = React.useCallback(
    async (id: number) => { await run(() => api(`/api/categories/${id}`, { method: "DELETE" }), "Kategori dihapus."); },
    [run],
  );
  const updateCategory = React.useCallback(
    (id: number, fields: { nama: string; desk: string }) =>
      run(
        () => api(`/api/categories/${id}`, { method: "PATCH", body: JSON.stringify(fields) }),
        `Kategori "${fields.nama}" diperbarui.`,
      ),
    [run],
  );

  const addType = React.useCallback(
    (nama: string) => run(() => api("/api/types", { method: "POST", body: JSON.stringify({ nama }) }), `Jenis "${nama}" ditambahkan.`),
    [run],
  );
  const removeType = React.useCallback(
    async (id: number) => { await run(() => api(`/api/types/${id}`, { method: "DELETE" }), "Jenis dokumen dihapus."); },
    [run],
  );
  const addPurpose = React.useCallback(
    (nama: string) => run(() => api("/api/purposes", { method: "POST", body: JSON.stringify({ nama }) }), `Tujuan "${nama}" ditambahkan.`),
    [run],
  );
  const removePurpose = React.useCallback(
    async (id: number) => { await run(() => api(`/api/purposes/${id}`, { method: "DELETE" }), "Tujuan dokumen dihapus."); },
    [run],
  );

  const setNotarisAktif = React.useCallback((id: number) => setState((s) => ({ ...s, notarisAktif: id })), []);
  const addNotaris = React.useCallback(
    (n: { nama: string; kantor: string; email: string; tel: string }) =>
      run(() => api("/api/notaris", { method: "POST", body: JSON.stringify(n) }), `Mitra notaris "${n.nama}" ditambahkan.`),
    [run],
  );
  const removeNotaris = React.useCallback(
    async (id: number) => { await run(() => api(`/api/notaris/${id}`, { method: "DELETE" }), "Mitra notaris dihapus beserta jadwalnya."); },
    [run],
  );
  const addSchedule = React.useCallback(
    (s: { notarisId: number; agenda: string; tgl: string; jam: string }) =>
      run(() => api("/api/schedules", { method: "POST", body: JSON.stringify(s) }), "Jadwal kerja sama tersimpan."),
    [run],
  );
  const cancelSchedule = React.useCallback(
    async (id: number) => {
      await run(() => api(`/api/schedules/${id}`, { method: "PATCH", body: JSON.stringify({ st: "Dibatalkan" }) }), "Jadwal dibatalkan.");
    },
    [run],
  );

  const addShare = React.useCallback(
    async (s: { documentId: number; email: string; tipe: "Notaris" | "Rekanan"; hari: number }) => {
      try {
        const res = await api<{ url: string; email: HasilKirim }>("/api/shares", {
          method: "POST",
          body: JSON.stringify(s),
        });
        await refresh();
        if (res.email.terkirim) {
          toast.success(`Tautan dikirim ke ${s.email}.`);
        } else if (res.email.driver === "log") {
          toast.success(`Tautan aman dibuat untuk ${s.email}.`);
        } else {
          // Tautan tetap tersimpan; hanya pengiriman emailnya yang gagal.
          toast.warning(`Tautan dibuat, tetapi email gagal terkirim. Salin tautannya secara manual.`);
        }
        return res;
      } catch (e) {
        fail(e);
        return null;
      }
    },
    [refresh, fail],
  );
  const revokeShare = React.useCallback(
    async (id: number) => { await run(() => api(`/api/shares/${id}`, { method: "DELETE" }), "Akses tautan dicabut."); },
    [run],
  );

  const clearShares = React.useCallback(async () => {
    try {
      const res = await api<{ dihapus: number }>("/api/shares", { method: "DELETE" });
      await refresh();
      toast.success(
        res.dihapus > 0
          ? `${res.dihapus} tautan tidak aktif dihapus dari riwayat.`
          : "Tidak ada tautan tidak aktif untuk dibersihkan.",
      );
    } catch (e) {
      fail(e);
    }
  }, [refresh, fail]);

  const setUserPeran = React.useCallback(
    async (id: string, p: Role) => {
      await run(() => api(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify({ peran: p }) }), `Peran diubah menjadi ${p}.`);
    },
    [run],
  );
  const toggleUser = React.useCallback(
    async (id: string, aktif: boolean) => {
      await run(() => api(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify({ aktif }) }), aktif ? "Pengguna diaktifkan." : "Pengguna dinonaktifkan.");
    },
    [run],
  );
  const removeUser = React.useCallback(
    async (id: string) => { await run(() => api(`/api/users/${id}`, { method: "DELETE" }), "Pengguna dihapus."); },
    [run],
  );
  const addUser = React.useCallback(
    (u: { nama: string; email: string; unit: string; peran: Role }) =>
      run(() => api("/api/users", { method: "POST", body: JSON.stringify(u) }), `Pengguna ${u.nama} ditambahkan (kata sandi awal: arsiva123).`),
    [run],
  );
  const updateUser = React.useCallback(
    (id: string, fields: { nama: string; email: string; unit: string }) =>
      run(() => api(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(fields) }), "Data pengguna diperbarui."),
    [run],
  );

  const markNotificationsRead = React.useCallback(
    async () => { await run(() => api("/api/notifications", { method: "PATCH" })); },
    [run],
  );

  const logout = React.useCallback(() => keluar(), [keluar]);

  const value: Ctx = {
    state, me, threshold,
    isAdmin: peran === "Admin",
    canWrite: peran === "Admin" || peran === "Team Member",
    allDocs, counts, stats,
    refresh, setThreshold,
    tandai, addDoc, updateDoc, removeDoc,
    addCategory, removeCategory, updateCategory,
    addType, removeType, addPurpose, removePurpose,
    setNotarisAktif, addNotaris, removeNotaris, addSchedule, cancelSchedule,
    addShare, revokeShare, clearShares,
    setUserPeran, toggleUser, removeUser, addUser, updateUser,
    markNotificationsRead, logout, say,
  };

  // Akun Clerk valid tetapi ditolak ARSIVA (nonaktif / belum terdaftar).
  if (akunError) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, color: "var(--color-text)" }}>
        <div className="card elev-sm" style={{ maxWidth: 420, padding: "var(--space-6)", display: "grid", gap: 16 }}>
          <h4 style={{ margin: 0 }}>Akses ditolak</h4>
          <div className="text-muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>{akunError}</div>
          <button type="button" className="btn btn-secondary" onClick={() => void keluar()}>Keluar</button>
        </div>
      </div>
    );
  }

  // Selama sesi masih diperiksa, jangan render isi aplikasi (mencegah kedipan).
  if (isPending) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--color-text)" }}>
        <div className="text-muted" style={{ fontSize: 13 }}>Memuat…</div>
      </div>
    );
  }

  return <ArsivaContext.Provider value={value}>{children}</ArsivaContext.Provider>;
}

export function useArsiva(): Ctx {
  const ctx = React.useContext(ArsivaContext);
  if (!ctx) throw new Error("useArsiva harus dipakai di dalam ArsivaProvider");
  return ctx;
}

export { initials };
