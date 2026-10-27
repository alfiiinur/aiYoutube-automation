"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Send,
  CalendarClock,
  Link2,
  RefreshCw,
  ExternalLink,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
} from "lucide-react";
import { Card, PageHeader, EmptyState } from "../components/ui";
import type { SocialAccount, SocialPlatform, SocialPost, VideoJob } from "../types";

const PLATFORMS: { id: SocialPlatform; label: string }[] = [
  { id: "threads", label: "Threads" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
];

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  threads: "Threads",
  instagram: "Instagram",
  facebook: "Facebook",
};

export default function PublishPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  // account form
  const [accPlatform, setAccPlatform] = useState<SocialPlatform>("threads");
  const [accName, setAccName] = useState("");
  const [accToken, setAccToken] = useState("");
  const [accUserId, setAccUserId] = useState("");
  const [busyAcc, setBusyAcc] = useState(false);

  // post form
  const [jobId, setJobId] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform>("threads");
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [busyPost, setBusyPost] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = async () => {
    const r = await fetch("/api/social-accounts", { cache: "no-store" }).then((x) => x.json());
    setAccounts(r.accounts ?? []);
  };

  const loadJobs = async () => {
    const r = await fetch("/api/jobs", { cache: "no-store" }).then((x) => x.json());
    setJobs((r.jobs ?? []).filter((j: VideoJob) => j.status === "ready"));
  };

  const loadPosts = async () => {
    const r = await fetch("/api/posts", { cache: "no-store" }).then((x) => x.json());
    setPosts(r.posts ?? []);
  };

  const loadAll = async () => {
    await Promise.all([loadAccounts(), loadJobs(), loadPosts()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    const t = setInterval(loadAll, 5000);
    return () => clearInterval(t);
  }, []);

  const readyJobs = useMemo(() => jobs.filter((j) => j.status === "ready"), [jobs]);
  const selectedJob = readyJobs.find((j) => j.id === jobId);

  const onSelectJob = (id: string) => {
    setJobId(id);
    const job = readyJobs.find((j) => j.id === id);
    if (job) {
      setCaption(job.caption ?? "");
      setHashtags((job.hashtags ?? []).filter(Boolean).map((t) => t.replace(/^#/, "")).join(" "));
    }
  };

  const addAccount = async () => {
    if (accName.trim().length < 2) {
      setError("Nama akun minimal 2 karakter.");
      return;
    }
    setBusyAcc(true);
    setError(null);
    try {
      const res = await fetch("/api/social-accounts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          platform: accPlatform,
          accountName: accName.trim(),
          accessToken: accToken.trim() || undefined,
          userId: accUserId.trim() || undefined,
          enabled: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menambah akun");
      setAccName("");
      setAccToken("");
      setAccUserId("");
      await loadAccounts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menambah akun");
    } finally {
      setBusyAcc(false);
    }
  };

  const removeAccount = async (id: string) => {
    await fetch(`/api/social-accounts/${id}`, { method: "DELETE" });
    await loadAccounts();
  };

  const createPost = async (now = false) => {
    if (!jobId) {
      setError("Pilih job yang sudah Siap terlebih dahulu.");
      return;
    }

    const time = now ? new Date().toISOString() : scheduledAt;
    if (!time) {
      setError("Atur jadwal, atau gunakan tombol Post Sekarang.");
      return;
    }
    setBusyPost(true);
    setError(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jobId,
          platform,
          scheduledAt: new Date(time).toISOString(),
          caption,
          hashtags: hashtags.split(/\s+/).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat postingan");
      await loadPosts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat postingan");
    } finally {
      setBusyPost(false);
    }
  };

  const deletePost = async (id: string) => {
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    await loadPosts();
  };

  const statusStyle: Record<SocialPost["status"], string> = {
    scheduled: "bg-sky-500/15 text-sky-300",
    sent: "bg-lime-500/15 text-lime-300",
    failed: "bg-brand-500/15 text-brand-400",
  };

  const statusLabel: Record<SocialPost["status"], string> = {
    scheduled: "terjadwal",
    sent: "terkirim",
    failed: "gagal",
  };

  return (
    <div>
      <PageHeader
        title="Auto Post"
        subtitle="Hubungkan akun Threads, Instagram, dan Facebook, lalu jadwalkan konten dari video yang sudah siap dipublikasikan."
      />

      {error && (
        <div className="mb-4 rounded-xl border border-brand-500/30 bg-brand-500/8 px-4 py-3 text-xs text-brand-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1.2fr]">
        {/* Account manager */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-white/85">Akun terhubung</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-white/40">
            Token disimpan lokal di <code className="rounded bg-white/8 px-1">data/db.json</code>. Untuk produksi, isi access token dari Meta Graph API.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {accounts.length === 0 && (
              <p className="col-span-2 rounded-xl border border-dashed border-white/10 px-3 py-5 text-center text-xs text-white/35">
                Belum ada akun. Tambahkan akun pertama di bawah.
              </p>
            )}
            {accounts.map((a) => (
              <div key={a.id} className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white/85">@{a.accountName}</p>
                  <p className="mt-0.5 text-[11px] text-white/40">
                    {PLATFORM_LABEL[a.platform]} · {a.accessToken && a.userId ? "API siap" : "mode simulasi"}
                  </p>
                </div>
                <button
                  onClick={() => removeAccount(a.id)}
                  className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/8 hover:text-brand-400"
                  aria-label="Hapus akun"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <select value={accPlatform} onChange={(e) => setAccPlatform(e.target.value as SocialPlatform)} className="input-base">
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id} className="bg-ink-900">
                  {p.label}
                </option>
              ))}
            </select>
            <input value={accName} onChange={(e) => setAccName(e.target.value)} placeholder="Username / nama akun" className="input-base sm:col-span-3" />
            <input value={accUserId} onChange={(e) => setAccUserId(e.target.value)} placeholder="User ID / Page ID" className="input-base sm:col-span-2" />
            <input value={accToken} onChange={(e) => setAccToken(e.target.value)} placeholder="Access token (opsional)" className="input-base sm:col-span-2" />
          </div>
          <button
            onClick={addAccount}
            disabled={busyAcc}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10 disabled:opacity-50"
          >
            {busyAcc ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Tambah akun
          </button>
        </Card>

        {/* Composer */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-white/85">Buat postingan</h2>
          <p className="mt-1 text-[11px] text-white/40">Konten diambil dari job berstatus Siap.</p>

          <div className="mt-4 flex flex-col gap-3">
            <div>
              <label className="text-[11px] text-white/45">Job video</label>
              <select value={jobId} onChange={(e) => onSelectJob(e.target.value)} className="input-base mt-1.5">
                <option value="" className="bg-ink-900">
                  {readyJobs.length === 0 ? "Belum ada job siap" : "— pilih job —"}
                </option>
                {readyJobs.map((j) => (
                  <option key={j.id} value={j.id} className="bg-ink-900">
                    {j.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-white/45">Platform tujuan</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value as SocialPlatform)} className="input-base mt-1.5">
                  {PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id} className="bg-ink-900">
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-white/45">Jadwal tayang</label>
                <button
                  type="button"
                  onClick={() => setScheduleOpen(true)}
                  className="input-base mt-1.5 flex w-full items-center justify-between gap-2 text-left"
                >
                  <span className={scheduledAt ? "text-white/80" : "text-white/35"}>
                    {scheduledAt
                      ? new Date(scheduledAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
                      : "Pilih tanggal & jam"}
                  </span>
                  <CalendarDays className="size-4 shrink-0 text-white/35" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-white/45">Caption</label>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} placeholder="Caption akan terisi otomatis dari job terpilih." className="input-base mt-1.5 resize-y" />
            </div>

            <div>
              <label className="text-[11px] text-white/45">Hashtags (pisahkan dengan spasi)</label>
              <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="tips konten viral shorts" className="input-base mt-1.5" />
            </div>

            {selectedJob && (
              <p className="rounded-lg bg-white/4 px-2.5 py-1.5 text-[11px] text-white/35">
                Durasi {selectedJob.durationSec}s · {selectedJob.aspectRatio} · {selectedJob.style}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => createPost(false)}
                disabled={busyPost}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10 disabled:opacity-50"
              >
                {busyPost ? <Loader2 className="size-4 animate-spin" /> : <CalendarClock className="size-4" />}
                Jadwalkan
              </button>
              <button
                onClick={() => createPost(true)}
                disabled={busyPost}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {busyPost ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Post sekarang
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Postingan terjadwal */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/85">Konten terjadwal</h2>
          <button onClick={loadAll} className="inline-flex items-center gap-1.5 text-[11px] text-white/40 transition hover:text-white/80">
            <RefreshCw className="size-3" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/4" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            title="Belum ada konten terjadwal"
            hint="Buat postingan dari job Siap, atur jadwal, lalu lihat riwayatnya di sini."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link2 className="size-3.5 shrink-0 text-white/35" />
                      <p className="truncate text-sm font-medium text-white/90">{p.jobTitle}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${statusStyle[p.status]}`}>
                        {statusLabel[p.status]}
                        {p.simulated && p.status === "sent" ? " (simulasi)" : ""}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-white/40">{p.caption}</p>
                    <p className="mt-1 text-[10px] text-white/30">
                      {PLATFORM_LABEL[p.platform]} · tayang {new Date(p.scheduledAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      {p.publishedAt ? ` · dikirim ${new Date(p.publishedAt).toLocaleString("id-ID", { timeStyle: "short" })}` : ""}
                    </p>
                    {p.error && <p className="mt-1 text-[10px] text-brand-400">{p.error}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {p.postUrl && (
                      <a href={p.postUrl} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-white/35 transition hover:bg-white/8 hover:text-white/80" aria-label="Buka postingan">
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                    <button onClick={() => deletePost(p.id)} className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/8 hover:text-brand-400" aria-label="Hapus postingan">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ScheduleModal
        open={scheduleOpen}
        initial={scheduledAt || undefined}
        onClose={() => setScheduleOpen(false)}
        onSelect={(iso) => setScheduledAt(iso)}
      />
    </div>
  );
}