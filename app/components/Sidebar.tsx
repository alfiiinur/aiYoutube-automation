"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Link2,
  Film,
  CalendarClock,
  Settings,
  Clapperboard,
  Send,
  CalendarDays,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/generate", label: "Generate Video", icon: Sparkles },
  { href: "/references", label: "Referensi", icon: Link2 },
  { href: "/jobs", label: "Job & Render", icon: Film },
  { href: "/automations", label: "Automation", icon: CalendarClock },
  { href: "/publish", label: "Auto Post", icon: Send },
  { href: "/schedule", label: "Kalender Konten", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/8 bg-ink-900/60 px-3 py-5 backdrop-blur-xl">
      <div className="flex items-center gap-2.5 px-2 pb-6">
        <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg shadow-brand-500/25">
          <Clapperboard className="size-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">Studio AI</div>
          <div className="text-[11px] text-white/45">YT Automation Suite</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-white/10 text-white shadow-inner shadow-white/5"
                  : "text-white/60 hover:bg-white/5 hover:text-white/90"
              }`}
            >
              <Icon className={`size-4 ${active ? "text-brand-400" : "text-white/40 group-hover:text-white/70"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-white/8 bg-white/3 p-3">
        <div className="flex items-center gap-2 text-[11px] font-medium text-lime-400">
          <span className="pulse-dot size-1.5 rounded-full bg-lime-400" />
          Engine lokal aktif
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-white/40">
          Render berjalan di mesin ini. Hubungkan API key di Settings untuk produksi.
        </p>
      </div>
    </aside>
  );
}