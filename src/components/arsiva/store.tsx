"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  analytics,
  computeCounts,
  initials,
  viewDoc,
  type Role,
  type ViewDoc,
} from "@/lib/arsiva";
import { useSession } from "@/lib/auth-client";

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
  if (!res.ok) throw new Error(data?.error ?? "Permintaan gagal.");
  return data as T;
}

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
  editCategory: (id: number) => void;
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
  // pengguna
  setUserPeran: (id: string, peran: Role) => Promise<void>;
  toggleUser: (id: string, aktif: boolean) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  addUser: (u: { nama: string; email: string; unit: string; peran: Role }) => Promise<boolean>;
  // lain-lain
  markNotificationsRead: () => Promise<void>;
  logout: () => Promise<void>;
  say: (msg: string) => void;
};

const ArsivaContext = React.createContext<Ctx | null>(null);

export function ArsivaProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [state, setState] = React.useState<State>(EMPTY);

  const sessionUser = session?.user;
  const peran = (sessionUser?.peran as Role) ?? "Pembaca";
  const threshold = (sessionUser?.reminderThresholdDays as number) ?? 60;

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
        // Perbarui sesi agar reminderThresholdDays yang baru terbaca.
        router.refresh();
        window.location.reload();
      } catch (e) {
        fail(e);
      }
    },
    [fail, router],
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
  const editCategory = React.useCallback(
    (id: number) => {
      const c = state.cats.find((x) => x.id === id);
      toast(`Form ubah kategori "${c?.nama ?? ""}" akan tersedia pada tahap berikutnya.`);
    },
    [state.cats],
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

  const markNotificationsRead = React.useCallback(
    async () => { await run(() => api("/api/notifications", { method: "PATCH" })); },
    [run],
  );

  const logout = React.useCallback(async () => {
    const { signOut } = await import("@/lib/auth-client");
    await signOut();
    router.push("/login");
  }, [router]);

  const value: Ctx = {
    state, me, threshold,
    isAdmin: peran === "Admin",
    canWrite: peran === "Admin" || peran === "Team Member",
    allDocs, counts, stats,
    refresh, setThreshold,
    tandai, addDoc, updateDoc, removeDoc,
    addCategory, removeCategory, editCategory,
    addType, removeType, addPurpose, removePurpose,
    setNotarisAktif, addNotaris, removeNotaris, addSchedule, cancelSchedule,
    addShare, revokeShare,
    setUserPeran, toggleUser, removeUser, addUser,
    markNotificationsRead, logout, say,
  };

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
