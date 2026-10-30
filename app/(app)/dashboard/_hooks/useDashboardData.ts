"use client";

import { useEffect, useState } from "react";
import type { GoalWithProgress, VideoJob } from "../../../types";

export interface Stats {
  totalJobs: number;
  ready: number;
  active: number;
  failed: number;
  references: number;
  automations: number;
  activeAutomations: number;
  byPlatform: Record<string, number>;
  totalSeconds: number;
}

export function useDashboardData() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [s, j, g] = await Promise.all([
        fetch("/api/stats", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/jobs", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/goals", { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (!alive) return;
      setStats(s.stats);
      setJobs(j.jobs.slice(0, 4));
      setGoals((g.goals ?? []).filter((goal: GoalWithProgress) => goal.completedAt == null));
    };
    load();
    const t = setInterval(load, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return { stats, jobs, goals };
}
