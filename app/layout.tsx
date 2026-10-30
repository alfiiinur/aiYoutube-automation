import type { Metadata } from "next";
import "./globals.css";
/* Sidebar hanya dirender oleh app/(app)/layout.tsx. */

export const metadata: Metadata = {
  title: "Studio — AI Video Automation & Generator",
  description: "Ubah satu prompt menjadi video siap tayang: script, storyboard, caption, jadwal, dan autopost.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen">
        <>{/* Sidebar + padding hanya untuk route group (app) */}
          {children}
          {null}
        </>
      </body>
    </html>
  );
}