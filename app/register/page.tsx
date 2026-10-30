"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clapperboard, Eye, EyeOff, Loader2, ArrowLeft, Check } from "lucide-react";

const POINTS = [
  "Generate video dari prompt + link referensi",
  "Storyboard, script, caption, dan hashtag otomatis",
  "Jadwal tayang dan autopost ke sosial media",
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gagal mendaftar");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/8 bg-white/[0.015] p-10 lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 90% 80% at 30% 20%, black 30%, transparent 75%)",
          }}
        />
        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-white">
            <Clapperboard className="size-5 text-black" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Studio AI</span>
        </Link>
        <div className="relative">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">
            Mulai gratis
          </p>
          <h1 className="mt-4 max-w-md text-4xl font-semibold leading-[1.05] tracking-tight text-white">
            Produksi video harian tanpa tim editing.
          </h1>
          <ul className="mt-6 flex flex-col gap-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-white/55">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white">
                  <Check className="size-3 text-black" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-[11px] text-white/30">
          Tanpa kartu kredit. Langsung bisa generate setelah daftar.
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/40 transition hover:text-white"
          >
            <ArrowLeft className="size-3.5" /> Kembali ke beranda
          </Link>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">Buat akun</h2>
          <p className="mt-1 text-sm text-white/45">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-medium text-white underline-offset-4 hover:underline">
              Masuk
            </Link>
          </p>

          <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/60">Nama</span>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Anda"
                className="input-base"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/60">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="input-base"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/60">
                Password <span className="font-normal text-white/35">(min. 8 karakter)</span>
              </span>
              <span className="relative block">
                <input
                  type={show ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-base pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-white/35 transition hover:bg-white/8 hover:text-white"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>

            {error && (
              <p className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/85 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {busy ? "Mendaftarkan…" : "Daftar dan buka dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
