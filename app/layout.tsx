import type { Metadata } from "next";
import { Anton, Bebas_Neue, Inter, Montserrat, Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
/* Sidebar hanya dirender oleh app/(app)/layout.tsx. */

/* Font caption editor video (dipakai lewat CSS variable, lihat app/lib/caption-fonts.ts). */
const capPoppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-cap-poppins",
  display: "swap",
});
const capMontserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-cap-montserrat",
  display: "swap",
});
const capAnton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-cap-anton", display: "swap" });
const capBebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-cap-bebas", display: "swap" });
const capInter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-cap-inter",
  display: "swap",
});
const capPlayfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-cap-playfair",
  display: "swap",
});
const captionFontVars = [
  capPoppins.variable,
  capMontserrat.variable,
  capAnton.variable,
  capBebas.variable,
  capInter.variable,
  capPlayfair.variable,
].join(" ");

export const metadata: Metadata = {
  title: "BroTek Labs — AI Video Automation & Generator",
  description: "Ubah satu prompt menjadi video siap tayang: script, storyboard, caption, jadwal, dan autopost.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={captionFontVars}>
      <body className="min-h-screen">
        <>{/* Sidebar + padding hanya untuk route group (app) */}
          {children}
          {null}
        </>
      </body>
    </html>
  );
}