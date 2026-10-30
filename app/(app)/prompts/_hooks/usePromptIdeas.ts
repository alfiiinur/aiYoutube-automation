"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { PromptIdea, PromptIdeasResult } from "../../../lib/prompt-ideas";

export interface GeneratedSet {
  topic: string;
  count: number;
  ideas: PromptIdea[];
  source: PromptIdeasResult["source"];
  notice: string | null;
}

export function usePromptIdeas(onGenerated?: (set: GeneratedSet) => void) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [ideas, setIdeas] = useState<PromptIdea[]>([]);
  const [source, setSource] = useState<PromptIdeasResult["source"] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  /** Serial yang sedang dilanjutkan — dipakai saat menyimpan ide sebagai skill. */
  const [activeSeries, setActiveSeries] = useState<string | null>(null);
  const [savedTitles, setSavedTitles] = useState<string[]>([]);
  const [savingTitle, setSavingTitle] = useState<string | null>(null);

  const generate = useCallback(
    async (topicOverride?: string) => {
      const clean = (topicOverride ?? topic).trim();
      if (clean.length < 3 || loading) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/prompt-ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: clean, count }),
        });
        const data = (await res.json().catch(() => ({}))) as Partial<PromptIdeasResult> & { error?: string };
        if (!res.ok) throw new Error(data.error ?? `Gagal generate (${res.status})`);
        const list = Array.isArray(data.ideas) ? data.ideas : [];
        const src = data.source ?? "local";
        const note = data.notice ?? null;
        setTopic(clean);
        setIdeas(list);
        setSource(src);
        setNotice(note);
        onGenerated?.({ topic: clean, count, ideas: list, source: src, notice: note });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal generate ide");
      } finally {
        setLoading(false);
      }
    },
    [topic, count, loading, onGenerated],
  );

  const restore = useCallback((set: GeneratedSet) => {
    setTopic(set.topic);
    setCount(set.count);
    setIdeas(set.ideas);
    setSource(set.source);
    setNotice(set.notice);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setTopic("");
    setIdeas([]);
    setSource(null);
    setNotice(null);
    setError(null);
    setActiveSeries(null);
  }, []);

  const copyIdea = async (idea: PromptIdea) => {
    try {
      await navigator.clipboard.writeText(idea.prompt);
      setCopied(idea.title);
      setTimeout(() => setCopied((cur) => (cur === idea.title ? null : cur)), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };

  const useInGenerate = (idea: PromptIdea) => {
    router.push(`/generate?prompt=${encodeURIComponent(idea.prompt)}`);
  };

  /** Simpan ide sebagai skill (masuk serial aktif bila ada) agar bisa dilanjutkan. */
  const saveIdea = async (idea: PromptIdea) => {
    if (savingTitle) return;
    setSavingTitle(idea.title);
    try {
      const res = await fetch("/api/prompt-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: idea.prompt, ...(activeSeries ? { series: activeSeries } : {}) }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan skill");
      setSavedTitles((prev) => (prev.includes(idea.title) ? prev : [...prev, idea.title]));
    } catch {
      setError("Gagal menyimpan skill, coba lagi.");
    } finally {
      setSavingTitle(null);
    }
  };

  return {
    topic,
    setTopic,
    count,
    setCount,
    ideas,
    source,
    notice,
    loading,
    error,
    copied,
    activeSeries,
    setActiveSeries,
    savedTitles,
    savingTitle,
    generate,
    restore,
    reset,
    copyIdea,
    useInGenerate,
    saveIdea,
  };
}
