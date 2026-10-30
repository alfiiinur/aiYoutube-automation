"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScheduleNote, SocialPost } from "../../../types";
import { dayKey, startOfDay } from "../_lib/date";

export function useScheduleData() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [notes, setNotes] = useState<ScheduleNote[]>([]);

  useEffect(() => {
    const load = () => {
      fetch("/api/posts", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setPosts(d.posts ?? []))
        .catch(() => {});
      fetch("/api/schedule-notes", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setNotes(d.notes ?? []))
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  const postsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of posts) {
      const key = dayKey(startOfDay(new Date(p.scheduledAt)));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [posts]);

  const noteCountByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of notes) {
      map.set(n.day, (map.get(n.day) ?? 0) + 1);
    }
    return map;
  }, [notes]);

  return { posts, notes, setNotes, postsByDay, noteCountByDay };
}
