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
  status: "Aktif" | "Dicabut" | "Kedaluwarsa"; bisaCabut: boolean;
};
export type ApiUser = {
  id: string; nama: string; email: string; unit: string; peran: Role; aktif: boolean;
  /** Akun sudah tertaut ke Google; null bila tidak diketahui. Pengguna baru dari POST belum membawanya. */
  google?: boolean | null;
};
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
  /** bagian yang sudah selesai dimuat (berhasil atau gagal); sebelum itu, nol ≠ kosong */
  siap: Record<Bagian, boolean>;
};

const EMPTY: State = {
  docs: [], cats: [], types: [], purposes: [], notaris: [],
  schedules: [], shares: [], users: [], notifications: [],
  notarisAktif: null, loading: true,
  siap: {
    documents: false, categories: false, types: false, purposes: false, notaris: false,
    schedules: false, shares: false, users: false, notifications: false,
  },
};

type Me = { nama: string; panggilan: string; peran: Role; peranText: string; inisial: string; email: string };

/* ───────────────────────── Pemanggil API ───────────────────────── */

/** Batas tunggu satu permintaan; tanpa ini koneksi database yang tersendat bisa menggantung selamanya. */
const BATAS_TUNGGU_MS = 20_000;

/** Bagian data = nama endpoint /api/<bagian>, dipetakan ke kunci di State. */
type Bagian = "documents" | "categories" | "types" | "purposes" | "notaris" | "schedules" | "shares" | "users" | "notifications";
const KUNCI_STATE = {
  documents: "docs", categories: "cats", types: "types", purposes: "purposes", notaris: "notaris",
  schedules: "schedules", shares: "shares", users: "users", notifications: "notifications",
} as const satisfies Record<Bagian, string>;
const SEMUA_BAGIAN = Object.keys(KUNCI_STATE) as Bagian[];

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(BATAS_TUNGGU_MS),
      headers: init?.body instanceof FormData ? init?.headers : { "Content-Type": "application/json", ...init?.headers },
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") throw new Error("Server terlalu lama merespons. Coba lagi.");
    throw new Error("Tidak dapat terhubung ke server. Periksa koneksi Anda.");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) window.dispatchEvent(new Event(EVENT_SESI_BERAKHIR));
  // guard.ts menolak akun yang dinonaktifkan Admin dengan 403 + pesan ini.
  if (res.status === 403 && /dinonaktifkan/i.test(String(data?.error ?? ""))) window.dispatchEvent(new Event(EVENT_AKUN_NONAKTIF));
  if (!res.ok) throw new Error(data?.error ?? "Permintaan gagal.");
  return data as T;
}

/** Dipicu api() saat server menjawab 401 (sesi habis/dicabut), agar provider mengeluarkan pengguna. */
const EVENT_SESI_BERAKHIR = "arsiva:sesi-berakhir";
/** Dipicu api() saat server menyatakan akun dinonaktifkan Admin. */
const EVENT_AKUN_NONAKTIF = "arsiva:akun-nonaktif";

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
  // true selama keluar() berjalan, agar pengalihan tanpa alasan tidak menimpa ?reason=…
  const sedangKeluar = React.useRef(false);
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

  // Sesi Clerk hilang saat pengguna masih di dalam aplikasi (mis. akunnya dinonaktifkan
  // Admin: ban mencabut semua sesinya). Tanpa ini halaman tetap tampil kosong.
  // Di /login, Clerk akan menolak akun yang diblokir dan menampilkan pop-up penjelasan.
  React.useEffect(() => {
    if (isLoaded && !isSignedIn && !sedangKeluar.current) window.location.replace("/login");
  }, [isLoaded, isSignedIn]);

  /* ── keluar: manual, sesi habis, atau idle 30 menit ── */
  const keluar = React.useCallback(
    async (alasan?: "idle" | "nonaktif") => {
      sedangKeluar.current = true;
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
    const saatNonaktif = () => void keluar("nonaktif");
    window.addEventListener(EVENT_SESI_BERAKHIR, saatBerakhir);
    window.addEventListener(EVENT_AKUN_NONAKTIF, saatNonaktif);
    return () => {
      window.removeEventListener(EVENT_SESI_BERAKHIR, saatBerakhir);
      window.removeEventListener(EVENT_AKUN_NONAKTIF, saatNonaktif);
    };
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

  /* ── memuat data ── */
  // Tiap bagian dimuat terpisah dan langsung ditampilkan begitu tiba: halaman tidak menunggu
  // endpoint paling lambat (mis. /api/users yang bertanya ke Clerk) untuk menampilkan dokumen.
  // Bagian yang gagal mempertahankan data sebelumnya. `bagian` membatasi apa yang dimuat ulang
  // setelah sebuah aksi; tanpa argumen, semuanya dimuat.
  const refresh = React.useCallback(async (bagian: readonly Bagian[] = SEMUA_BAGIAN) => {
    let gagalPertama: unknown;
    await Promise.all(
      bagian.map((b) =>
        api<Record<string, unknown>>(`/api/${b}`)
          .then((r) => {
            setState((prev) => {
              const next = { ...prev, [KUNCI_STATE[b]]: r[KUNCI_STATE[b]], siap: { ...prev.siap, [b]: true } } as State;
              if (b === "documents") next.loading = false;
              if (b === "notaris") {
                next.notarisAktif =
                  prev.notarisAktif && next.notaris.some((x) => x.id === prev.notarisAktif)
                    ? prev.notarisAktif
                    : (next.notaris[0]?.id ?? null);
              }
              return next;
            });
          })
          .catch((e) => {
            gagalPertama ??= e;
            setState((prev) => ({ ...prev, siap: { ...prev.siap, [b]: true }, loading: b === "documents" ? false : prev.loading }));
          }),
      ),
    );
    if (gagalPertama) fail(gagalPertama);
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
    async (fn: () => Promise<unknown>, pesanSukses: string | undefined, bagian: readonly Bagian[]): Promise<boolean> => {
      try {
        await fn();
        await refresh(bagian);
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
        ["documents"],
      );
    },
    [run],
  );

  const addDoc = React.useCallback(
    (form: FormData) => run(() => api("/api/documents", { method: "POST", body: form }), "Dokumen tersimpan di arsip.", ["documents", "categories", "notifications"]),
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
        ["documents", "categories"],
      ),
    [run],
  );

  const removeDoc = React.useCallback(
    (id: number) => run(() => api(`/api/documents/${id}`, { method: "DELETE" }), "Dokumen dihapus dari arsip.", ["documents", "categories", "shares", "notifications"]),
    [run],
  );

  const addCategory = React.useCallback(
    (nama: string, desk: string) =>
      run(() => api("/api/categories", { method: "POST", body: JSON.stringify({ nama, desk }) }), `Kategori "${nama}" ditambahkan.`, ["categories"]),
    [run],
  );
  const removeCategory = React.useCallback(
    async (id: number) => { await run(() => api(`/api/categories/${id}`, { method: "DELETE" }), "Kategori dihapus.", ["categories", "documents"]); },
    [run],
  );
  const updateCategory = React.useCallback(
    (id: number, fields: { nama: string; desk: string }) =>
      run(
        () => api(`/api/categories/${id}`, { method: "PATCH", body: JSON.stringify(fields) }),
        `Kategori "${fields.nama}" diperbarui.`,
        ["categories", "documents"],
      ),
    [run],
  );

  const addType = React.useCallback(
    (nama: string) => run(() => api("/api/types", { method: "POST", body: JSON.stringify({ nama }) }), `Jenis "${nama}" ditambahkan.`, ["types"]),
    [run],
  );
  const removeType = React.useCallback(
    async (id: number) => { await run(() => api(`/api/types/${id}`, { method: "DELETE" }), "Jenis dokumen dihapus.", ["types", "documents"]); },
    [run],
  );
  const addPurpose = React.useCallback(
    (nama: string) => run(() => api("/api/purposes", { method: "POST", body: JSON.stringify({ nama }) }), `Tujuan "${nama}" ditambahkan.`, ["purposes"]),
    [run],
  );
  const removePurpose = React.useCallback(
    async (id: number) => { await run(() => api(`/api/purposes/${id}`, { method: "DELETE" }), "Tujuan dokumen dihapus.", ["purposes", "documents"]); },
    [run],
  );

  const setNotarisAktif = React.useCallback((id: number) => setState((s) => ({ ...s, notarisAktif: id })), []);
  const addNotaris = React.useCallback(
    (n: { nama: string; kantor: string; email: string; tel: string }) =>
      run(() => api("/api/notaris", { method: "POST", body: JSON.stringify(n) }), `Mitra notaris "${n.nama}" ditambahkan.`, ["notaris"]),
    [run],
  );
  const removeNotaris = React.useCallback(
    async (id: number) => { await run(() => api(`/api/notaris/${id}`, { method: "DELETE" }), "Mitra notaris dihapus beserta jadwalnya.", ["notaris", "schedules"]); },
    [run],
  );
  const addSchedule = React.useCallback(
    (s: { notarisId: number; agenda: string; tgl: string; jam: string }) =>
      run(() => api("/api/schedules", { method: "POST", body: JSON.stringify(s) }), "Jadwal kerja sama tersimpan.", ["schedules", "notaris"]),
    [run],
  );
  const cancelSchedule = React.useCallback(
    async (id: number) => {
      await run(() => api(`/api/schedules/${id}`, { method: "PATCH", body: JSON.stringify({ st: "Dibatalkan" }) }), "Jadwal dibatalkan.", ["schedules", "notaris"]);
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
        await refresh(["shares"]);
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
    async (id: number) => { await run(() => api(`/api/shares/${id}`, { method: "DELETE" }), "Akses tautan dicabut.", ["shares"]); },
    [run],
  );

  const clearShares = React.useCallback(async () => {
    try {
      const res = await api<{ dihapus: number }>("/api/shares", { method: "DELETE" });
      await refresh(["shares"]);
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
      await run(() => api(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify({ peran: p }) }), `Peran diubah menjadi ${p}.`, ["users"]);
    },
    [run],
  );
  const toggleUser = React.useCallback(
    async (id: string, aktif: boolean) => {
      await run(() => api(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify({ aktif }) }), aktif ? "Pengguna diaktifkan." : "Pengguna dinonaktifkan.", ["users"]);
    },
    [run],
  );
  const removeUser = React.useCallback(
    async (id: string) => { await run(() => api(`/api/users/${id}`, { method: "DELETE" }), "Pengguna dihapus.", ["users"]); },
    [run],
  );
  const addUser = React.useCallback(
    (u: { nama: string; email: string; unit: string; peran: Role }) =>
      run(() => api("/api/users", { method: "POST", body: JSON.stringify(u) }), `Pengguna ${u.nama} ditambahkan (kata sandi awal: arsiva123).`, ["users"]),
    [run],
  );
  const updateUser = React.useCallback(
    (id: string, fields: { nama: string; email: string; unit: string }) =>
      run(() => api(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(fields) }), "Data pengguna diperbarui.", ["users", "documents"]),
    [run],
  );

  const markNotificationsRead = React.useCallback(
    async () => { await run(() => api("/api/notifications", { method: "PATCH" }), undefined, ["notifications"]); },
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
          <div className="text-muted" style={{ fontSize: "var(--t-isi)", lineHeight: 1.6 }}>{akunError}</div>
          <button type="button" className="btn btn-secondary" onClick={() => void keluar()}>Keluar</button>
        </div>
      </div>
    );
  }

  // Selama sesi masih diperiksa, jangan render isi aplikasi (mencegah kedipan).
  if (isPending) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--color-text)" }}>
        <div className="text-muted" style={{ fontSize: "var(--t-ket)" }}>Memuat…</div>
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
