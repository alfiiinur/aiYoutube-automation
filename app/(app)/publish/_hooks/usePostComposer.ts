"use client";

import { useMemo, useState } from "react";
import type { EditorMedia, SocialPlatform, VideoJob } from "../../../types";
import { uploadStockFiles } from "../../../lib/stock-upload";

export type ComposerMedia = Pick<EditorMedia, "url" | "name" | "kind" | "mime" | "size">;

export function usePostComposer(
  jobs: VideoJob[],
  loadPosts: () => Promise<void>,
  setError: (msg: string | null) => void,
) {
  const [jobId, setJobId] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform>("threads");
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [media, setMedia] = useState<ComposerMedia | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [busyPost, setBusyPost] = useState(false);

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

  /** Upload banyak file ke stock; yang pertama langsung dipasang di postingan. */
  const uploadMedia = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      const { uploaded } = await uploadStockFiles(list, null, setProgress);
      const first = uploaded[0];
      if (first) setMedia(first);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah media");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const createPost = async (now = false) => {
    if (!jobId && !caption.trim() && !media) {
      setError("Pilih job yang sudah Siap, atau isi caption/upload stock video.");
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
          jobId: jobId || undefined,
          platform,
          scheduledAt: new Date(time).toISOString(),
          caption,
          hashtags: hashtags.split(/\s+/).filter(Boolean),
          mediaUrl: media?.url,
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

  const retryPost = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ publishNow: true, scheduledAt: new Date().toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengirim ulang");
      await loadPosts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengirim ulang");
    }
  };

  const deletePost = async (id: string) => {
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    await loadPosts();
  };

  return {
    jobId,
    platform,
    setPlatform,
    scheduledAt,
    setScheduledAt,
    scheduleOpen,
    setScheduleOpen,
    caption,
    setCaption,
    hashtags,
    setHashtags,
    media,
    setMedia,
    uploading,
    progress,
    uploadMedia,
    busyPost,
    readyJobs,
    selectedJob,
    onSelectJob,
    createPost,
    retryPost,
    deletePost,
  };
}
