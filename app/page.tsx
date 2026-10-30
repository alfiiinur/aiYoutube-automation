"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Clapperboard,
  ArrowRight,
  ArrowUpRight,
  Check,
  Plus,
  Minus,
  Menu,
  X,
  PenLine,
  LayoutGrid,
  CalendarClock,
  Send,
  Play,
} from "lucide-react";
import { useLandingFx } from "./components/landing/useLandingFx";

/* ---------------------------------- data ---------------------------------- */

const MARQUEE = [
  "YouTube Shorts",
  "TikTok",
  "Instagram Reels",
  "Script Otomatis",
  "Storyboard",
  "Auto Post",
  "Kalender Konten",
  "Analisis Referensi",
];

const STATS = [
  { value: 10, suffix: "×", label: "lebih cepat dari produksi manual" },
  { value: 38, suffix: " dtk", label: "rata-rata script pertama jadi" },
  { value: 4, suffix: "", label: "format rasio: 9:16, 16:9, 1:1, 4:5" },
  { value: 3, suffix: "", label: "kanal autopost terjadwal" },
];

const FEATURES = [
  {
    no: "01",
    title: "Generate dari prompt + referensi",
    desc: "Tulis ide dalam satu kalimat, tempel link YouTube atau TikTok sebagai acuan gaya. Sistem membaca pola hook dan pacing-nya, lalu menyusun video baru dari nol — bukan jiplakan.",
    points: ["Analisis metadata YouTube & Open Graph", "Pola hook, pacing, dan struktur terbaca otomatis"],
  },
  {
    no: "02",
    title: "Script, storyboard & caption sekaligus",
    desc: "Setiap job menghasilkan paket lengkap: hook 3 detik, naskah voiceover per scene, storyboard visual, ide thumbnail, caption, dan hashtag yang siap salin.",
    points: ["Storyboard 6+ scene dengan timecode", "Caption + hashtag per platform"],
  },
  {
    no: "03",
    title: "Editor timeline built-in",
    desc: "Susun klip, caption, overlay, musik, dan voiceover di timeline. Impor media sendiri atau pakai hasil generate — semua tersimpan per job dan bisa dibuka ulang.",
    points: ["Klip, caption, overlay, dan musik", "Chat editor untuk revisi cepat"],
  },
  {
    no: "04",
    title: "Automation & autopost terjadwal",
    desc: "Atur jadwal produksi harian dan antrean tayang. Job yang siap otomatis masuk kalender konten dan terkirim ke kanal yang terhubung — lengkap dengan notifikasi Telegram.",
    points: ["Cron produksi + kalender visual", "Notifikasi Telegram saat render selesai"],
  },
];

const STEPS = [
  {
    no: "Langkah 1",
    title: "Tulis prompt, tempel referensi",
    desc: "Ceritakan video yang Anda mau dalam bahasa sehari-hari. Tambahkan 1–3 link referensi agar gaya hook dan pacing-nya ketularan — tanpa meniru mentah-mentah.",
    tag: "30 detik",
  },
  {
    no: "Langkah 2",
    title: "Pipeline menyusun semuanya",
    desc: "Engine menganalisis referensi, menulis hook dan naskah, memecah storyboard per scene, lalu menyiapkan caption dan hashtag. Progresnya terlihat live di dashboard.",
    tag: "Otomatis",
  },
  {
    no: "Langkah 3",
    title: "Rapiin di editor timeline",
    desc: "Geser klip, poles caption, atur musik dan overlay. Semua perubahan tersimpan otomatis per job — buka lagi kapan pun tanpa kehilangan progres.",
    tag: "Fleksibel",
  },
  {
    no: "Langkah 4",
    title: "Jadwalkan & autopost",
    desc: "Seret ke kalender konten, pilih kanal, dan biarkan sistem mengirim sesuai jadwal. Anda fokus ke ide berikutnya, mesin yang mengantar tayang.",
    tag: "Terjadwal",
  },
];

const SHOWCASE = [
  {
    icon: PenLine,
    index: "A",
    title: "Dari prompt mentah…",
    desc: "\u201C5 kesalahan editing yang bikin retention drop\u201D — cukup satu kalimat itu. Tidak perlu outline, tidak perlu riset berjam-jam.",
    mock: "prompt" as const,
  },
  {
    icon: LayoutGrid,
    index: "B",
    title: "…jadi storyboard utuh",
    desc: "Enam scene lengkap dengan visual, teks layar, voiceover, dan timecode. Lengkap dengan ide thumbnail dan mood musik.",
    mock: "board" as const,
  },
  {
    icon: CalendarClock,
    index: "C",
    title: "…masuk kalender tayang",
    desc: "Video siap otomatis antre di kalender konten mingguan. Seret untuk mengatur ulang, klik untuk menjadwalkan.",
    mock: "cal" as const,
  },
  {
    icon: Send,
    index: "D",
    title: "…terkirim otomatis",
    desc: "Caption, hashtag, dan media terkirim ke kanal yang terhubung tepat waktu. Status setiap postingan terpantau.",
    mock: "sent" as const,
  },
];

const FAQS = [
  {
    q: "Apakah saya tetap butuh aplikasi editing lain?",
    a: "Untuk alur standar tidak. Script, storyboard, caption, timeline klip, musik, dan overlay semuanya ada di dalam BroTek Labs. Hasilnya bisa Anda ekspor dan poles lagi di CapCut atau Premiere kalau mau — file dan naskahnya milik Anda sepenuhnya.",
  },
  {
    q: "Dari mana sistem belajar gaya video saya?",
    a: "Dari link referensi yang Anda tempel. Sistem membaca metadata resmi (seperti oEmbed YouTube) dan pola struktur videonya — hook, pacing, transisi — lalu menerapkan polanya ke ide baru Anda. Aset visualnya selalu dibuat ulang dari nol, bukan mengunduh ulang konten orang.",
  },
  {
    q: "Platform apa saja yang didukung autopost?",
    a: "Saat ini Threads, Instagram, dan Facebook dengan antrean terjadwal dan status pengiriman per postingan. YouTube dan TikTok tersedia lewat pipeline automation dengan mode simulasi yang siap disambung ke API resmi saat kunci Anda terpasang.",
  },
  {
    q: "Apakah datanya aman dan milik saya?",
    a: "Ya. Akun dilindungi password ter-hash dan sesi bertanda tangan. Semua prompt, media, dan hasil render tersimpan di database Anda sendiri dan bisa dihapus permanen kapan pun dari dashboard.",
  },
  {
    q: "Bisa berhenti berlangganan kapan saja?",
    a: "Bisa. Paket turun ke Gratis di akhir periode berjalan tanpa penalti, dan semua video yang sudah jadi tetap bisa Anda akses, unduh, dan tayangkan ulang.",
  },
];
/* Isi `src` dengan URL embed YouTube (kind: "youtube") atau file mp4 (kind: "file")
   untuk mengaktifkan videonya. Selama src null, kartu tampil sebagai mock. */
const VIDEO_TESTIMONIALS: Array<{
  name: string;
  role: string;
  quote: string;
  platform: string;
  duration: string;
  initial: string;
  thumb: string;
  kind: "youtube" | "file";
  src: string | null;
}> = [
  {
    name: "Raka Pratama",
    role: "Kreator edukasi, 180 rb subscriber",
    quote: "Dulu satu Short butuh seharian. Sekarang 3 video sehari, sendirian.",
    platform: "YouTube Shorts",
    duration: "0:48",
    initial: "R",
    thumb: "from-violet-950/90 via-[#121214] to-black",
    kind: "youtube",
    src: null,
  },
  {
    name: "Nadia Safitri",
    role: "Social media specialist agensi",
    quote: "Tempel 3 video kompetitor, pola hook-nya langsung ketangkap.",
    platform: "Instagram Reels",
    duration: "1:12",
    initial: "N",
    thumb: "from-fuchsia-950/70 via-[#121214] to-black",
    kind: "youtube",
    src: null,
  },
  {
    name: "Bagas Wijaya",
    role: "Owner studio konten UMKM",
    quote: "Kalender konten + autopost ngegantiin kerjaan admin.",
    platform: "TikTok",
    duration: "0:59",
    initial: "B",
    thumb: "from-indigo-950/80 via-[#121214] to-black",
    kind: "youtube",
    src: null,
  },
];


/* --------------------------------- mocks ---------------------------------- */

function PromptMock() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Prompt Anda</p>
      <p className="mt-2 text-sm leading-relaxed text-white">
        “5 kesalahan editing yang bikin retention drop, gaya fast-cut untuk Shorts”
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {["9:16", "45 dtk", "fast-cut", "ID"].map((t) => (
          <span key={t} className="rounded-full border border-white/12 px-2.5 py-1 text-[10px] text-white/55">
            {t}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-xs font-medium text-black">
        Generate video <ArrowRight className="size-3.5" />
      </div>
    </div>
  );
}

function BoardMock() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-black p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-white">0{i}</span>
            <span className="font-mono text-[9px] text-white/30">0{i * 7}s</span>
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="h-1.5 w-11/12 rounded-full bg-white/25" />
            <div className="h-1.5 w-3/4 rounded-full bg-white/12" />
            <div className="h-1.5 w-5/6 rounded-full bg-white/12" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CalMock() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "S", "R", "K", "J", "S", "M"].map((d, i) => (
          <span key={i} className="pb-1 text-[9px] text-white/30">
            {d}
          </span>
        ))}
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className={`grid aspect-square place-items-center rounded-md text-[9px] ${
              [2, 4, 9, 11].includes(i) ? "bg-white font-semibold text-black" : "text-white/40"
            }`}
          >
            {i + 3}
          </span>
        ))}
      </div>
      <p className="mt-3 border-t border-white/8 pt-3 text-[11px] text-white/50">
        4 video terjadwal minggu ini
      </p>
    </div>
  );
}

function SentMock() {
  return (
    <div className="flex flex-col gap-2">
      {[
        ["Reels — Tips editing #12", "Terkirim 19.00"],
        ["Shorts — Retention drop", "Terkirim 12.00"],
        ["TikTok — Setup 2 juta", "Antre 19.00"],
      ].map(([t, s], i) => (
        <div key={t} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black px-3.5 py-3">
          <span className={`grid size-6 shrink-0 place-items-center rounded-full ${i < 2 ? "bg-white" : "border border-white/25"}`}>
            {i < 2 && <Check className="size-3 text-black" strokeWidth={3} />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white">{t}</p>
            <p className="text-[10px] text-white/40">{s}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ShowcaseMock({ kind }: { kind: "prompt" | "board" | "cal" | "sent" }) {
  if (kind === "prompt") return <PromptMock />;
  if (kind === "board") return <BoardMock />;
  if (kind === "cal") return <CalMock />;
  return <SentMock />;
}
function VideoTestimonialPlayer({ t }: { t: (typeof VIDEO_TESTIMONIALS)[number] }) {
  if (t.src && t.kind === "youtube") {
    return (
      <div className="aspect-video w-full bg-black">
        <iframe
          src={t.src}
          title={`Testimoni ${t.name}`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="size-full border-0"
        />
      </div>
    );
  }
  if (t.src) {
    return <video src={t.src} controls preload="metadata" playsInline className="aspect-video w-full bg-black" />;
  }
  return (
    <div className={`relative aspect-video w-full overflow-hidden bg-gradient-to-br ${t.thumb}`}>
      <span aria-hidden className="absolute inset-0 grid place-items-center text-8xl font-semibold text-white/[0.07]">
        {t.initial}
      </span>
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-14 place-items-center rounded-full bg-violet-500 text-white shadow-[0_0_45px_-8px_rgba(139,92,246,0.8)] transition-transform duration-300 group-hover:scale-110">
          <Play className="ml-0.5 size-6 fill-current" />
        </span>
      </span>
      <span className="absolute bottom-3 left-3 rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white/80">
        {t.platform}
      </span>
      <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 font-mono text-[10px] text-white/80">
        {t.duration}
      </span>
    </div>
  );
}


/* --------------------------------- page ----------------------------------- */

export default function LandingPage() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [faq, setFaq] = useState<number | null>(0);
  useLandingFx(root);

  return (
    <main ref={root} className="scroll-smooth bg-[#0a0a0b] text-white antialiased">
      {/* ------------------------------- nav ------------------------------- */}
      <div data-nav className="landing-nav fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-white">
              <Clapperboard className="size-4 text-black" />
            </span>
            <span className="text-sm font-semibold tracking-tight">BroTek Labs</span>
          </Link>
          <nav className="hidden items-center gap-7 text-[13px] text-white/55 md:flex">
            <a href="#fitur" className="transition hover:text-white">Fitur</a>
            <a href="#cara-kerja" className="transition hover:text-white">Cara kerja</a>
            <a href="#showcase" className="transition hover:text-white">Hasil</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="rounded-xl px-3.5 py-2 text-[13px] font-medium text-white/70 transition hover:bg-white/8 hover:text-white"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[13px] font-medium text-black transition hover:bg-white/85"
            >
              Mulai gratis <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className="grid size-9 place-items-center rounded-lg text-white/70 transition hover:bg-white/8 md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {open && (
          <div className="border-t border-white/8 bg-[#0a0a0b]/95 px-5 pb-5 pt-2 backdrop-blur-xl md:hidden">
            {[
              ["#fitur", "Fitur"],
              ["#cara-kerja", "Cara kerja"],
              ["#showcase", "Hasil"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-2 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                {label}
              </a>
            ))}
            <div className="mt-2 flex gap-2">
              <Link
                href="/login"
                className="flex-1 rounded-xl border border-white/12 px-3.5 py-2.5 text-center text-sm font-medium text-white"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="flex-1 rounded-xl bg-white px-3.5 py-2.5 text-center text-sm font-medium text-black"
              >
                Mulai gratis
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------- hero ------------------------------ */}
      <section data-hero className="relative overflow-hidden pt-32 lg:pt-40">
      {/* ambient ungu: glow futuristik */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-[-8%] size-[36rem] rounded-full bg-violet-600/25 blur-[160px]" />
        <div className="absolute left-[-10%] top-1/4 size-[28rem] rounded-full bg-fuchsia-600/15 blur-[160px]" />
      </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 80% 65% at 50% 0%, black 25%, transparent 78%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 lg:grid-cols-[1.05fr_1fr] lg:px-8">
          <div>
            <p
              data-hero-item
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/70"
            >
              <span className="size-1.5 rounded-full bg-white" />
              Pipeline video AI end-to-end — prompt sampai tayang
            </p>
            <h1 data-hero-item className="mt-6 text-5xl font-semibold leading-[1.02] tracking-tight lg:text-7xl">
              Satu prompt menjadi video siap tayang.
            </h1>
            <p data-hero-item className="mt-6 max-w-lg text-[15px] leading-relaxed text-white/55">
              BroTek Labs menulis script, menyusun storyboard, menyiapkan caption, menjadwalkan,
              dan mengirim video Anda — otomatis. Anda cukup bawa ide; mesin yang mengantar
              sampai layar penonton.
            </p>
            <div data-hero-item className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/85 shadow-[0_0_50px_-12px_rgba(139,92,246,0.55)]"
              >
                Mulai gratis <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/8"
              >
                Masuk dashboard
              </Link>
            </div>
            <div data-hero-item className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/40">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-white" strokeWidth={3} /> Tanpa kartu kredit
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-white" strokeWidth={3} /> Script pertama dalam semenit
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-white" strokeWidth={3} /> Batal kapan saja
              </span>
            </div>
          </div>

          {/* visual 3D */}
          <div data-hero-item data-tilt-stage className="relative [perspective:1400px]">
            <div data-hero-visual data-tilt-card className="relative [transform-style:preserve-3d]">
              <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#111113] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
                <div className="flex items-center gap-1.5 border-b border-white/8 px-4 py-3">
                  <span className="size-2.5 rounded-full bg-white/20" />
                  <span className="size-2.5 rounded-full bg-white/20" />
                  <span className="size-2.5 rounded-full bg-white/60" />
                  <span className="ml-3 rounded-md bg-white/6 px-2 py-0.5 font-mono text-[10px] text-white/40">
                    brotek.ai/dashboard
                  </span>
                </div>
                <div className="grid grid-cols-[52px_1fr] gap-4 p-4">
                  <div className="flex flex-col gap-2">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-9 rounded-lg ${i === 0 ? "bg-white" : "bg-white/6"}`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="rounded-xl border border-white/8 bg-black/40 p-3.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-medium text-white">Render: retention-drop.mp4</p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold text-black">
                          82%
                        </span>
                      </div>
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[82%] rounded-full bg-white" />
                      </div>
                      <div className="mt-2.5 flex gap-1.5">
                        {["Analisis", "Scripting", "Rendering", "Siap"].map((s, i) => (
                          <span
                            key={s}
                            className={`rounded-md px-1.5 py-1 text-[8.5px] ${i < 3 ? "bg-white/12 text-white" : "bg-white/5 text-white/35"}`}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-black/40 p-3.5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Hook — detik 0–3</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-white/80">
                        “Retention kamu drop bukan karena algoritma — tapi 3 detik pertama…”
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {["Storyboard", "Caption", "Jadwal"].map((t) => (
                        <div key={t} className="rounded-xl border border-white/8 bg-black/40 p-2.5">
                          <div className="h-1.5 w-4/5 rounded-full bg-white/25" />
                          <div className="mt-1.5 h-1.5 w-3/5 rounded-full bg-white/10" />
                          <p className="mt-2 text-[9px] text-white/40">{t}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* chip melayang: parallax + kedalaman 3D */}
              <div data-chip className="absolute -left-4 top-16 lg:-left-10">
                <div data-float className="flex items-center gap-2 rounded-xl border border-white/12 bg-[#17171a] px-3 py-2 text-[11px] shadow-xl [transform:translateZ(70px)]">
                  <span className="grid size-5 place-items-center rounded-full bg-white">
                    <Check className="size-3 text-black" strokeWidth={3} />
                  </span>
                  Script jadi • 38 dtk
                </div>
              </div>
              <div data-chip className="absolute -right-3 top-1/3 lg:-right-8">
                <div className="rounded-xl border border-white/12 bg-[#17171a] px-3 py-2 text-[11px] shadow-xl [transform:translateZ(110px)]">
                  Storyboard • 6 scene
                </div>
              </div>
              <div data-chip className="absolute -bottom-4 left-10">
                <div data-float className="flex items-center gap-2 rounded-xl border border-white/12 bg-[#17171a] px-3 py-2 text-[11px] shadow-xl [transform:translateZ(50px)]">
                  <span className="size-1.5 animate-pulse rounded-full bg-white" />
                  Terjadwal • 19.00 WIB
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* marquee */}
        <div className="relative border-y border-white/8 bg-white/[0.015] py-4">
          <div className="marquee flex w-max items-center gap-10 pr-10">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap text-[13px] font-medium uppercase tracking-[0.14em] text-white/40">
                {m} <span className="size-1 rounded-full bg-white/25" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------- stats ------------------------------ */}
      <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-[#0d0d0f] p-6 lg:p-8">
              <p data-count={s.value} data-suffix={s.suffix} className="text-3xl font-semibold tracking-tight tabular-nums lg:text-4xl">
                0{s.suffix}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/45">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------ fitur ------------------------------- */}
      <section id="fitur" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-24 lg:px-8">
        <div data-rise className="max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Kenapa BroTek Labs</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight lg:text-5xl">
            Semua alat produksi, satu alur tanpa pindah aplikasi.
          </h2>
        </div>
        <div className="mt-12 grid gap-4 [perspective:1600px] lg:grid-cols-2">
          {FEATURES.map((f) => (
            <article
              key={f.no}
              data-flip
              className="group rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition-colors hover:bg-white/[0.04] lg:p-9"
            >
              <div className="flex items-start justify-between">
                <span className="text-5xl font-semibold tracking-tight text-white/12 transition-colors group-hover:text-white/25 lg:text-6xl">
                  {f.no}
                </span>
                <span className="grid size-10 place-items-center rounded-xl border border-white/10 transition group-hover:bg-white group-hover:text-black">
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-white/55">{f.desc}</p>
              <ul className="mt-5 flex flex-col gap-2 border-t border-white/8 pt-5">
                {f.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-[13px] text-white/65">
                    <Check className="size-3.5 shrink-0 text-white" strokeWidth={3} /> {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------- cara kerja ----------------------------- */}
      <section id="cara-kerja" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-28 lg:px-8">
        <div data-rise className="max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Cara kerja</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight lg:text-5xl">
            Dari ide di kepala sampai tayang, empat langkah.
          </h2>
        </div>
        <div className="mt-12 flex flex-col gap-5 [perspective:1200px]">
          {STEPS.map((s, i) => (
            <article
              key={s.no}
              data-stack
              style={{ top: `${88 + i * 20}px` }}
              className="sticky grid gap-5 rounded-2xl border border-white/10 bg-[#121214] p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] lg:grid-cols-[1fr_1.4fr] lg:items-center lg:p-10"
            >
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">{s.no}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight lg:text-3xl">{s.title}</h3>
              </div>
              <div>
                <p className="text-sm leading-relaxed text-white/55">{s.desc}</p>
                <span className="mt-4 inline-block rounded-full border border-white/12 px-3 py-1 text-[11px] font-medium text-white/70">
                  {s.tag}
                </span>
              </div>
              <span className="pointer-events-none absolute bottom-4 right-6 text-7xl font-semibold text-white/[0.05] lg:text-8xl">
                {i + 1}
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* ----------------------------- showcase ------------------------------ */}
      <section id="showcase" data-hwrap className="relative scroll-mt-24 overflow-hidden border-y border-white/8 bg-white/[0.015] lg:h-screen lg:overflow-visible">
        <div className="mx-auto max-w-6xl px-5 pt-20 lg:hidden">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Hasil nyata</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Satu ide, empat wujud — tanpa sentuh timeline manual.
          </h2>
        </div>
        <div data-htrack className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-14 lg:h-screen lg:w-max lg:flex-row lg:items-center lg:gap-6 lg:px-8 lg:py-0">
          <div className="hidden w-[26rem] shrink-0 lg:block">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Hasil nyata</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
              Satu ide, empat wujud — tanpa sentuh timeline manual.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
              Geser ke bawah dan ikuti perjalanan satu prompt dari teks mentah sampai status
              “terkirim” di kanal Anda.
            </p>
          </div>
          {SHOWCASE.map((s) => (
            <article
              key={s.index}
              data-hpanel
              className="w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#101012] p-6 lg:w-[30rem] lg:p-8"
            >
              <div data-hinner>
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-white">
                    <s.icon className="size-5 text-black" />
                  </span>
                  <span className="text-5xl font-semibold text-white/10">{s.index}</span>
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{s.desc}</p>
                <div className="mt-5">
                  <ShowcaseMock kind={s.mock} />
                </div>
      {/* ------------------------- testimoni video ---------------------------- */}
      <section id="testimoni" className="relative scroll-mt-24 overflow-hidden border-y border-white/8 bg-white/[0.015]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-30%] size-[38rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[160px]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 py-24 lg:px-8">
          <div data-rise className="max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-violet-300/80">Testimoni video</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight lg:text-5xl">
              Kreator yang tayangnya tidak pernah bolong, cerita sendiri.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/50">
              Testimoni video dari kreator dan studio yang produksi harian dengan BroTek Labs.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {VIDEO_TESTIMONIALS.map((t) => (
              <article
                key={t.name}
                data-rise
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#101012] transition-colors hover:border-violet-400/40"
              >
                <VideoTestimonialPlayer t={t} />
                <div className="p-5">
                  <p className="text-sm leading-relaxed text-white/80">“{t.quote}”</p>
                  <div className="mt-4 flex items-center gap-3 border-t border-white/8 pt-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-violet-500/20 text-xs font-semibold text-violet-200">
                      {t.initial}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="truncate text-xs text-white/45">{t.role}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

              </div>
            </article>
          ))}
        </div>
      </section>

      {/* -------------------------------- faq -------------------------------- */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-5 pb-24 lg:px-8">
        <div data-rise className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight lg:text-4xl">
            Pertanyaan yang sering masuk.
          </h2>
        </div>
        <div className="mt-10 flex flex-col gap-2.5">
          {FAQS.map((f, i) => {
            const isOpen = faq === i;
            return (
              <div
                key={f.q}
                className={`overflow-hidden rounded-2xl border transition-colors ${isOpen ? "border-white/20 bg-white/[0.04]" : "border-white/10 bg-white/[0.015]"}`}
              >
                <button
                  onClick={() => setFaq(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium lg:px-6"
                >
                  {f.q}
                  <span className={`grid size-7 shrink-0 place-items-center rounded-full border transition ${isOpen ? "border-white bg-white text-black" : "border-white/15 text-white/60"}`}>
                    {isOpen ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
                  </span>
                </button>
                {isOpen && (
                  <p className="px-5 pb-5 text-sm leading-relaxed text-white/55 lg:px-6">{f.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* -------------------------------- cta -------------------------------- */}
      <section data-cta className="relative overflow-hidden border-t border-white/8 bg-white/[0.015]">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 size-[42rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-violet-600/20 blur-[160px]" />
        <div className="relative mx-auto max-w-6xl overflow-hidden px-5 py-24 text-center lg:px-8 lg:py-32">
          <div className="overflow-hidden">
            <p data-cta-line className="text-4xl font-semibold tracking-tight lg:text-6xl">
              Ide berikutnya layak tayang
            </p>
          </div>
          <div className="overflow-hidden">
            <p data-cta-line className="text-4xl font-semibold tracking-tight text-white/35 lg:text-6xl">
              minggu ini juga.
            </p>
          </div>
          <p data-cta-line className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/50">
            Daftar dalam 30 detik, tempel referensi pertama, dan lihat script jadi sebelum
            kopi Anda dingin.
          </p>
          <div data-cta-line className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/85 shadow-[0_0_50px_-12px_rgba(139,92,246,0.55)]"
            >
              Buat akun gratis <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/8"
            >
              Masuk dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------- footer ------------------------------ */}
      <footer className="border-t border-white/8">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-white">
                <Clapperboard className="size-4 text-black" />
              </span>
              <span className="text-sm font-semibold tracking-tight">BroTek Labs</span>
            </div>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-white/40">
              Pipeline video AI end-to-end: generate, storyboard, jadwal, dan autopost dari
              satu dashboard.
            </p>
          </div>
          {[
            ["Produk", ["Fitur", "Cara kerja", "Hasil"]],
            ["Bantuan", ["FAQ", "Masuk", "Daftar", "Dashboard"]],
            ["Legal", ["Privasi", "Syarat layanan", "Keamanan", "Kontak"]],
          ].map(([title, links]) => (
            <div key={title as string}>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">{title}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {(links as string[]).map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[13px] text-white/55 transition hover:text-white">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-[11px] text-white/35 lg:px-8">
            <span>© 2026 BroTek Labs. Seluruh hak cipta dilindungi.</span>
            <span>Dibuat untuk kreator Indonesia.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

