"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { ReferenceSource, VideoJob } from "../../../../types";
import { downloadTextFile, jobToCaptionMd, jobToSrt, slugify } from "../../../../lib/job-export";

export type JobTab = "script" | "storyboard" | "caption";

export function useJobDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [job, setJob] = useState<VideoJob | null>(null);
  const [refs, setRefs] = useState<ReferenceSource[]>([]);
  const [tab, setTab] = useState<JobTab>("script");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
    if (!res.ok) {
      setError("Job tidak ditemukan");
      return;
    }
    const data = await res.json();
    setJob(data.job);
    setRefs(data.references ?? []);
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "script" || hash === "storyboard" || hash === "caption") setTab(hash);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const retry = async () => {
    await fetch(`/api/jobs/${id}/retry`, { method: "POST" });
    load();
  };

  const downloadSrt = () => {
    if (!job || job.scenes.length === 0) return;
    downloadTextFile(`${slugify(job.title)}-script.srt`, jobToSrt(job), "application/x-subrip");
  };

  const downloadMd = () => {
    if (!job) return;
    downloadTextFile(`${slugify(job.title)}-caption.md`, jobToCaptionMd(job), "text/markdown");
  };

  return { job, refs, tab, setTab, error, retry, downloadSrt, downloadMd };
}
