"use client";

import { useEffect, useMemo, useState } from "react";
import type { GoalPlan, GoalWithProgress } from "../../../types";

export function useGoalsData() {
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await fetch("/api/goals", { cache: "no-store" }).then((x) => x.json());
      setGoals(r.goals ?? []);
    } catch {
      /* daftar goal opsional — jangan blokir halaman */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const sorted = useMemo(
    () =>
      [...goals].sort((a, b) => {
        const ac = a.completedAt ? 1 : 0;
        const bc = b.completedAt ? 1 : 0;
        if (ac !== bc) return ac - bc;
        return b.createdAt - a.createdAt;
      }),
    [goals],
  );

  const activeCount = goals.filter((g) => g.completedAt == null).length;

  const toggleComplete = async (goal: GoalWithProgress) => {
    await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: goal.completedAt ? "reopen" : "complete" }),
    });
    await load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    setGoals((list) => list.filter((g) => g.id !== id));
  };

  const updatePlan = (goalId: string, plan: GoalPlan) =>
    setGoals((list) => list.map((x) => (x.id === goalId ? { ...x, plan } : x)));

  return {
    goals,
    loading,
    sorted,
    activeCount,
    load,
    toggleComplete,
    remove,
    updatePlan,
  };
}

export type GoalsDataState = ReturnType<typeof useGoalsData>;
