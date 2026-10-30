"use client";

import { useMemo, useState } from "react";
import type { PromptSkill } from "../../../types";

export type SkillGroup = { name: string | null; parts: PromptSkill[] };

export type PendingSeries = { series: string; part: number };

/** Skill prompt tersimpan: riwayat + pengelompokan serial. */
export function usePromptSkills() {
  const [skills, setSkills] = useState<PromptSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);

  const loadSkills = async () => {
    try {
      const r = await fetch("/api/prompt-skills", { cache: "no-store" }).then((x) => x.json());
      setSkills(r.skills ?? []);
    } catch {
      /* riwayat bersifat opsional — jangan blokir halaman kalau gagal dimuat */
    } finally {
      setSkillsLoading(false);
    }
  };

  const nextPartFor = (seriesName: string): number =>
    skills
      .filter((s) => s.series === seriesName)
      .reduce((max, s) => Math.max(max, s.part ?? 0), 0) + 1;

  const groups: SkillGroup[] = useMemo(() => {
    const named = new Map<string, PromptSkill[]>();
    const loose: PromptSkill[] = [];
    for (const s of skills) {
      if (s.series) {
        const list = named.get(s.series) ?? [];
        list.push(s);
        named.set(s.series, list);
      } else {
        loose.push(s);
      }
    }
    const byPart = (a: PromptSkill, b: PromptSkill) =>
      (a.part ?? Number.MAX_SAFE_INTEGER) - (b.part ?? Number.MAX_SAFE_INTEGER) ||
      b.createdAt - a.createdAt;
    const out: SkillGroup[] = [...named.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "id"))
      .map(([name, parts]) => ({ name, parts: parts.sort(byPart) }));
    if (loose.length > 0) {
      out.push({ name: null, parts: loose.sort((a, b) => b.createdAt - a.createdAt) });
    }
    return out;
  }, [skills]);

  const seriesNames = useMemo(
    () => groups.map((g) => g.name).filter((n): n is string => n !== null),
    [groups],
  );

  const deleteSkill = async (id: string) => {
    await fetch(`/api/prompt-skills/${id}`, { method: "DELETE" });
    setSkills((list) => list.filter((s) => s.id !== id));
  };

  return {
    skills, skillsLoading, loadSkills,
    groups, seriesNames, nextPartFor, deleteSkill,
  };
}

export type PromptSkills = ReturnType<typeof usePromptSkills>;
