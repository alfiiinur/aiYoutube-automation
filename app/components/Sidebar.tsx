"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Lightbulb,
  Link2,
  Film,
  CalendarClock,
  Settings,
  Clapperboard,
  Send,
  CalendarDays,
  Target,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/prompts", label: "Prompt Ideas", icon: Lightbulb },
  { href: "/generate", label: "Generate Video", icon: Sparkles },
  { href: "/references", label: "Referensi", icon: Link2 },
  { href: "/jobs", label: "Job & Render", icon: Film },
  { href: "/automations", label: "Automation", icon: CalendarClock },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/publish", label: "Auto Post", icon: Send },
  { href: "/schedule", label: "Kalender Konten", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive) setUser(d?.user ?? null);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  // Tutup drawer setiap pindah halaman.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Kunci scroll body + tombol Escape saat drawer mobile terbuka.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  const logout = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* abaikan — tetap keluar */
    }
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const renderNav = (mini: boolean) => (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            title={mini ? label : undefined}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
              mini ? "justify-center px-0" : ""
            } ${
              active
                ? "bg-white text-black"
                : "text-white/60 hover:bg-white/5 hover:text-white/90"
            }`}
          >
            <Icon className={`size-4 shrink-0 ${active ? "text-black" : "text-white/40 group-hover:text-white/70"}`} />
            {!mini && label}
          </Link>
        );
      })}
    </nav>
  );

  const userCard = (mini: boolean) =>
    user && (
      <div
        className={`flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 ${
          mini ? "flex-col justify-center px-0" : ""
        }`}
      >
        <div
          title={mini ? user.email : undefined}
          className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-black"
        >
          {(user.name || user.email).slice(0, 1).toUpperCase()}
        </div>
        {!mini && (
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-xs font-medium text-white/85">
              {user.name || user.email.split("@")[0]}
            </div>
            <div className="truncate text-[10px] text-white/40">{user.email}</div>
          </div>
        )}
        <button
          onClick={logout}
          disabled={leaving}
          title="Keluar"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-white/40 transition hover:bg-white/8 hover:text-white disabled:opacity-50"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    );

  const engineCard = (
    <div className="rounded-xl border border-white/8 bg-white/3 p-3">
      <div className="flex items-center gap-2 text-[11px] font-medium text-white">
        <span className="pulse-dot size-1.5 rounded-full bg-white" />
        Engine lokal aktif
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-white/40">
        Render berjalan di mesin ini. Hubungkan API key di Settings untuk produksi.
      </p>
    </div>
  );

  const brand = (mini: boolean) => (
    <div className={`flex items-center gap-2.5 px-2 ${mini ? "justify-center px-0" : ""}`}>
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-white">
        <Clapperboard className="size-5 text-black" />
      </div>
      {!mini && (
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">BroTek Labs</div>
          <div className="text-[11px] text-white/45">YT Automation Suite</div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Topbar mobile: fixed + tombol hamburger */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b border-white/8 bg-ink-950/90 px-3 backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu navigasi"
          className="grid size-10 place-items-center rounded-xl text-white/70 transition hover:bg-white/8 hover:text-white"
        >
          <Menu className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-white">
            <Clapperboard className="size-4 text-black" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">BroTek Labs</div>
            <div className="text-[10px] text-white/45">YT Automation Suite</div>
          </div>
        </div>
      </header>

      {/* Sidebar desktop: fixed + tombol hamburger untuk ciutkan/lebarkan */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden h-dvh flex-col border-r border-white/8 bg-ink-900/80 px-3 py-5 backdrop-blur-xl transition-[width] duration-200 md:flex ${
          collapsed ? "w-[4.75rem]" : "w-64"
        }`}
      >
        <div className={`flex items-center gap-2 pb-6 ${collapsed ? "flex-col justify-center" : "px-0"}`}>
          <div className={`min-w-0 flex-1 ${collapsed ? "flex-none" : ""}`}>{brand(collapsed)}</div>
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Bentangkan sidebar" : "Ciutkan sidebar"}
            title={collapsed ? "Bentangkan sidebar" : "Ciutkan sidebar"}
            className="grid size-9 shrink-0 place-items-center rounded-xl text-white/50 transition hover:bg-white/8 hover:text-white"
          >
            {collapsed ? <Menu className="size-5" /> : <PanelLeftClose className="size-5" />}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{renderNav(collapsed)}</div>
        <div className="flex flex-col gap-2 pt-3">
          {!collapsed && engineCard}
          {userCard(collapsed)}
        </div>
      </aside>

      {/* Overlay drawer mobile */}
      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer mobile: slide-in dari kiri */}
      <aside
        aria-label="Navigasi utama"
        aria-hidden={!open}
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col border-r border-white/8 bg-ink-900 px-3 py-5 transition-transform duration-200 ease-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between pb-6">
          <div className="flex-1">{brand(false)}</div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu navigasi"
            tabIndex={open ? 0 : -1}
            className="grid size-9 shrink-0 place-items-center rounded-xl text-white/60 transition hover:bg-white/8 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{renderNav(false)}</div>
        <div className="flex flex-col gap-2 pt-3">
          {engineCard}
          {userCard(false)}
        </div>
      </aside>
    </>
  );
}
