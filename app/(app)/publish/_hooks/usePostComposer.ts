"use client";

import { useMemo, useState } from "react";
import type { SocialPlatform, VideoJob } from "../../../types";

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
    busyPost,
    readyJobs,
    selectedJob,
    onSelectJob,
    createPost,
    deletePost,
  };
}
