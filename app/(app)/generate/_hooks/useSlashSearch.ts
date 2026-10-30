"use client";

import { useMemo } from "react";
import type { PromptSkill } from "../../../types";

/** Pencarian skill via prefiks "/" di awal prompt. */
export function useSlashSearch(prompt: string, skills: PromptSkill[]) {
  const slashMode = prompt.trimStart().startsWith("/");
  const slashQuery = slashMode ? prompt.trimStart().slice(1).trim().toLowerCase() : "";
  const slashResults = useMemo(() => {
    if (!slashMode) return [];
    const q = slashQuery;
    return skills
      .filter(
        (s) =>
          !q ||
          s.prompt.toLowerCase().includes(q) ||
          (s.series ?? "").toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [skills, slashMode, slashQuery]);

  return { slashMode, slashQuery, slashResults };
}

export type SlashSearch = ReturnType<typeof useSlashSearch>;
