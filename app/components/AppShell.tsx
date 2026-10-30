"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("sidebar-collapsed") === "1") setCollapsed(true);
    } catch {
      /* abaikan — pakai default */
    }
  }, []);

  const toggle = () => {
    setCollapsed((v) => {
      try {
        localStorage.setItem("sidebar-collapsed", v ? "0" : "1");
      } catch {
        /* abaikan */
      }
      return !v;
    });
  };

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      {/* Offset konten mengikuti lebar sidebar desktop (w-64 / w-[4.75rem]).
          pt-14 di mobile memberi ruang untuk topbar fixed + hamburger. */}
      <div className={`transition-[padding] duration-200 ${collapsed ? "md:pl-[4.75rem]" : "md:pl-64"}`}>
        <main className="mx-auto min-w-0 w-full max-w-7xl px-4 pt-[4.5rem] pb-6 sm:px-5 md:px-9 md:pt-8 md:pb-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
