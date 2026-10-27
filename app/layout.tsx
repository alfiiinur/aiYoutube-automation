import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata: Metadata = {
  title: "Studio — YT Automation & Video Generator",
  description: "Dashboard automation YouTube dan generator video berbasis prompt + referensi link.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 px-5 py-6 lg:px-9 lg:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}