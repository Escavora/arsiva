"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Vault,
  SquaresFour,
  Folders,
  UploadSimple,
  BellRinging,
  ShareNetwork,
  CalendarDots,
  Tag,
  ShieldCheck,
  Key,
  SignOut,
  MagnifyingGlass,
  Bell,
  List,
  X,
  CheckCircle,
  type Icon,
} from "@phosphor-icons/react";
import { useArsiva } from "./store";

type NavItem = {
  href: string;
  label: string;
  icon: Icon;
  adminOnly?: boolean;
  badge?: boolean;
};

const OPERASIONAL: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/arsip", label: "Arsip Dokumen", icon: Folders },
  { href: "/unggah", label: "Unggah Dokumen", icon: UploadSimple },
  {
    href: "/pengingat",
    label: "Pengingat Kadaluarsa",
    icon: BellRinging,
    badge: true,
  },
  { href: "/bagikan", label: "Bagikan Dokumen", icon: ShareNetwork },
];
const MASTER: NavItem[] = [
  { href: "/notaris", label: "Jadwal Notaris", icon: CalendarDots },
  { href: "/kategori", label: "Kategori & Jenis", icon: Tag },
  {
    href: "/akses",
    label: "Kelola Hak Akses",
    icon: ShieldCheck,
    adminOnly: true,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/arsip")
    return pathname === "/arsip" || pathname.startsWith("/arsip/");
  return pathname === href;
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { me, counts, isAdmin, logout } = useArsiva();
  const router = useRouter();

  const renderItem = (item: NavItem) => {
    if (item.adminOnly && !isAdmin) return null;
    const on = isActive(pathname, item.href);
    const IconEl = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className="nav-item"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 12px",
          borderRadius: "var(--radius-md)",
          fontSize: 14,
          textDecoration: "none",
          color: on
            ? "var(--color-accent-200)"
            : "color-mix(in srgb, var(--color-text) 72%, transparent)",
          background: on
            ? "color-mix(in srgb, var(--color-accent) 14%, transparent)"
            : "transparent",
          boxShadow: on ? "inset 2px 0 0 var(--color-accent)" : "none",
        }}
      >
        <IconEl size={18} />
        {item.label}
        {item.badge && counts.perluAksi > 0 && (
          <span
            className="tag tag-warn"
            style={{ marginLeft: "auto", fontSize: 10, padding: "1px 7px" }}
          >
            {counts.perluAksi}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          padding: "18px 16px 14px",
          display: "flex",
          gap: 11,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            flex: "none",
            borderRadius: "var(--radius-md)",
            background: "var(--color-section)",
            boxShadow: "inset 0 0 0 1px var(--color-accent-700)",
            display: "grid",
            placeItems: "center",
            color: "var(--color-accent-300)",
          }}
        >
          <Vault size={19} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 15,
              letterSpacing: "-0.01em",
            }}
          >
            ARSIVA
          </div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: "color-mix(in srgb, var(--color-text) 45%, transparent)",
            }}
          >
            Arsip Dokumen Legal
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "6px 10px 0",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "color-mix(in srgb, var(--color-text) 38%, transparent)",
            padding: "10px 12px 6px",
          }}
        >
          Operasional
        </div>
        {OPERASIONAL.map(renderItem)}
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "color-mix(in srgb, var(--color-text) 38%, transparent)",
            padding: "16px 12px 6px",
          }}
        >
          Mitra &amp; Master Data
        </div>
        {MASTER.map(renderItem)}
      </div>

      <div
        style={{
          marginTop: "auto",
          padding: "14px 16px 16px",
          borderTop: "1px solid var(--color-divider)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              flex: "none",
              borderRadius: "50%",
              background: "var(--color-accent-800)",
              color: "var(--color-accent-200)",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              fontFamily: "var(--font-heading)",
            }}
          >
            {me.inisial}
          </div>
          <div style={{ minWidth: 0, lineHeight: 1.25 }}>
            <div
              style={{
                fontSize: 13,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {me.nama}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "color-mix(in srgb, var(--color-text) 45%, transparent)",
              }}
            >
              {me.peranText}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              onNavigate?.();
              router.push("/sandi");
            }}
            style={{ flex: 1, fontSize: 12 }}
          >
            <Key size={15} />
            Kata Sandi
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void logout()}
            style={{ flex: "none", fontSize: 12 }}
            title="Keluar akun"
          >
            <SignOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function RolePill({ peran }: { peran: string }) {
  return (
    <span
      title="Peran akun ini (ditentukan saat login)"
      style={{
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        padding: "5px 11px",
        borderRadius: 999,
        color: "var(--color-accent-200)",
        background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
        boxShadow: "inset 0 0 0 1px var(--color-accent-800)",
        whiteSpace: "nowrap",
      }}
    >
      <ShieldCheck size={13} />
      {peran}
    </span>
  );
}

/** Ubah timestamp ISO jadi keterangan relatif singkat ("3 jam lalu"). */
function waktuRelatif(iso: string): string {
  const detik = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (detik < 60) return "baru saja";
  const menit = Math.floor(detik / 60);
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 30) return `${hari} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const WARNA_TIPE: Record<string, string> = {
  kadaluarsa: "var(--color-accent-2)",
  berbagi: "var(--color-accent)",
  sistem: "var(--color-neutral-500)",
};

/** Lonceng notifikasi + panel daftar notifikasi in-app. */
function LoncengNotifikasi() {
  const { state, markNotificationsRead } = useArsiva();
  const router = useRouter();
  const [buka, setBuka] = React.useState(false);
  const wadah = React.useRef<HTMLDivElement>(null);

  const notif = state.notifications;
  const belumDibaca = notif.filter((n) => !n.dibaca).length;

  // Tutup saat klik di luar panel.
  React.useEffect(() => {
    if (!buka) return;
    const onClick = (e: MouseEvent) => {
      if (wadah.current && !wadah.current.contains(e.target as Node)) setBuka(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [buka]);

  const bukaPanel = () => {
    setBuka((v) => !v);
  };

  const klikNotif = (documentId: number | null) => {
    setBuka(false);
    if (documentId) router.push(`/arsip/${documentId}`);
  };

  return (
    <div ref={wadah} style={{ position: "relative", flex: "none" }}>
      <button
        type="button"
        className="btn btn-secondary btn-icon"
        onClick={bukaPanel}
        style={{ position: "relative" }}
        title="Notifikasi"
        aria-label={`Notifikasi${belumDibaca ? ` (${belumDibaca} belum dibaca)` : ""}`}
      >
        <Bell size={17} />
        {belumDibaca > 0 && (
          <span
            style={{
              position: "absolute", top: -5, right: -5, minWidth: 17, height: 17,
              padding: "0 4px", borderRadius: 999,
              background: "var(--color-accent-2)", color: "#1a1200",
              fontSize: 10, fontWeight: 700, lineHeight: "17px", textAlign: "center",
              boxShadow: "0 0 0 2px var(--color-bg)",
            }}
          >
            {belumDibaca > 9 ? "9+" : belumDibaca}
          </span>
        )}
      </button>

      {buka && (
        <div
          className="card elev-lg"
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 30,
            width: "min(360px, calc(100vw - 32px))", padding: 0, gap: 0, overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderBottom: "1px solid var(--color-divider)" }}>
            <h5 style={{ margin: 0, fontSize: 14 }}>Notifikasi</h5>
            <span className="text-muted" style={{ fontSize: 11.5 }}>
              {belumDibaca > 0 ? `${belumDibaca} belum dibaca` : "semua terbaca"}
            </span>
            {belumDibaca > 0 && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void markNotificationsRead()}
                style={{ marginLeft: "auto", fontSize: 11.5 }}
              >
                Tandai dibaca
              </button>
            )}
          </div>

          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {notif.length === 0 && (
              <div style={{ padding: "28px 14px", textAlign: "center" }}>
                <CheckCircle size={26} style={{ color: "var(--color-neutral-700)", margin: "0 auto" }} />
                <div className="text-muted" style={{ fontSize: 12.5, marginTop: 8 }}>Belum ada notifikasi.</div>
              </div>
            )}
            {notif.map((n) => (
              <div
                key={n.id}
                role={n.documentId ? "button" : undefined}
                tabIndex={n.documentId ? 0 : undefined}
                onClick={() => klikNotif(n.documentId)}
                className={n.documentId ? "row-hover" : undefined}
                style={{
                  display: "flex", gap: 10, padding: "11px 14px",
                  borderBottom: "1px solid var(--color-divider)",
                  cursor: n.documentId ? "pointer" : "default",
                  background: n.dibaca ? "transparent" : "color-mix(in srgb, var(--color-accent) 7%, transparent)",
                }}
              >
                <span
                  style={{
                    width: 7, height: 7, borderRadius: "50%", flex: "none", marginTop: 5,
                    background: WARNA_TIPE[n.tipe] ?? WARNA_TIPE.sistem,
                  }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.4, fontWeight: n.dibaca ? 400 : 600 }}>{n.judul}</div>
                  <div
                    className="text-muted"
                    style={{
                      fontSize: 11.5, lineHeight: 1.45, marginTop: 2,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}
                  >
                    {n.pesan}
                  </div>
                  <div style={{ fontSize: 10.5, marginTop: 4, color: "color-mix(in srgb, var(--color-text) 40%, transparent)" }}>
                    {waktuRelatif(n.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => { setBuka(false); router.push("/pengingat"); }}
            style={{ width: "100%", borderRadius: 0, padding: "10px", fontSize: 12, borderTop: "1px solid var(--color-divider)" }}
          >
            Lihat pengingat kadaluarsa
          </button>
        </div>
      )}
    </div>
  );
}

function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { me } = useArsiva();
  const router = useRouter();
  const [q, setQ] = React.useState("");

  const submitSearch = (value: string) => {
    setQ(value);
    router.push(value ? `/arsip?q=${encodeURIComponent(value)}` : "/arsip");
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 20px",
        borderBottom: "1px solid var(--color-divider)",
        position: "sticky",
        top: 0,
        background: "color-mix(in srgb, var(--color-bg) 92%, transparent)",
        backdropFilter: "blur(8px)",
        zIndex: 5,
      }}
    >
      <button
        type="button"
        className="btn btn-secondary btn-icon lg:!hidden"
        onClick={onOpenMenu}
        title="Menu"
        aria-label="Buka menu"
      >
        <List size={18} />
      </button>
      <div
        className="hidden md:block"
        style={{
          fontSize: 11,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          color: "color-mix(in srgb, var(--color-text) 48%, transparent)",
        }}
      >
        CREDIT OPERATIONS DEPARTMENT - RO BRI PEKANBARU
      </div>
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          className="hidden sm:block"
          style={{ position: "relative", width: 268 }}
        >
          <MagnifyingGlass
            size={15}
            style={{
              position: "absolute",
              left: 10,
              top: 10,
              color: "color-mix(in srgb, var(--color-text) 45%, transparent)",
            }}
          />
          <input
            className="input"
            placeholder="Cari nama, jenis, atau tujuan…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitSearch(q);
            }}
            style={{ paddingLeft: 31 }}
          />
        </div>
        <RolePill peran={me.peran} />
        <LoncengNotifikasi />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--color-bg)",
      }}
    >
      {/* desktop sidebar */}
      <aside
        className="hidden lg:flex"
        style={{
          width: 252,
          flex: "none",
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-divider)",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <SidebarNav />
      </aside>

      {/* mobile drawer */}
      {menuOpen && (
        <div
          className="lg:hidden"
          style={{ position: "fixed", inset: 0, zIndex: 50 }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
            }}
            onClick={() => setMenuOpen(false)}
          />
          <aside
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: 264,
              background: "var(--color-surface)",
              borderRight: "1px solid var(--color-divider)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              onClick={() => setMenuOpen(false)}
              style={{ position: "absolute", top: 12, right: 12 }}
              aria-label="Tutup menu"
            >
              <X size={16} />
            </button>
            <SidebarNav onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main
          style={{ flex: 1, padding: "24px 20px 60px" }}
          className="md:!px-7"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
