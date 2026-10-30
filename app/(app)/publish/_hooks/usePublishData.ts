"use client";

import { useEffect, useState } from "react";
import type { SocialAccount, SocialPost, VideoJob } from "../../../types";

export function usePublishData() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

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

  return { accounts, jobs, posts, loading, loadAccounts, loadPosts, loadAll };
}
