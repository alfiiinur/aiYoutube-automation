"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import type { AspectRatio, EditorMedia } from "../../../types";
import type { PendingSeries } from "./usePromptSkills";

/** Nilai terkini yang dibutuhkan dialog simpan + generate. */
export type SaveDialogContext = {
  prompt: string;
  pendingSeries: PendingSeries | null;
  seriesNames: string[];
  nextPartFor: (seriesName: string) => number;
  aspectRatio: AspectRatio;
  durationSec: number;
  style: string;
  voice: string;
  model: string;
  selected: string[];
  media: EditorMedia[];
  setError: Dispatch<SetStateAction<string | null>>;
};

/** Dialog simpan skill + submit generate job. */
export function useSaveDialog(ctx: SaveDialogContext) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveSeries, setSaveSeries] = useState("none");
  const [newSeriesName, setNewSeriesName] = useState("");
  const [savePart, setSavePart] = useState(1);
  const [saveError, setSaveError] = useState<string | null>(null);

  const openSave = () => {
    if (ctx.prompt.trim().length < 8) {
      ctx.setError("Prompt minimal 8 karakter.");
      return;
    }
    ctx.setError(null);
    setSaveError(null);
    if (ctx.pendingSeries && ctx.seriesNames.includes(ctx.pendingSeries.series)) {
      setSaveSeries(ctx.pendingSeries.series);
      setNewSeriesName("");
      setSavePart(ctx.nextPartFor(ctx.pendingSeries.series));
    } else if (ctx.pendingSeries) {
      setSaveSeries("__new");
      setNewSeriesName(ctx.pendingSeries.series);
      setSavePart(ctx.pendingSeries.part);
    } else {
      setSaveSeries("none");
      setNewSeriesName("");
      setSavePart(1);
    }
    setSaveOpen(true);
  };

  const doGenerate = async (withSave: boolean) => {
    setSaveError(null);
    let series: string | undefined;
    let part: number | undefined;
    if (withSave) {
      if (saveSeries === "__new") {
        const name = newSeriesName.trim();
        if (!name) {
          setSaveError("Nama serial baru wajib diisi.");
          return;
        }
        series = name;
      } else if (saveSeries !== "none") {
        series = saveSeries;
      }
      if (series) {
        if (!Number.isInteger(savePart) || savePart < 1) {
          setSaveError("Nomor part minimal 1.");
          return;
        }
        part = savePart;
      }
    }

    setSubmitting(true);
    try {
      if (withSave) {
        const res = await fetch("/api/prompt-skills", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            prompt: ctx.prompt.trim(),
            series,
            part,
            aspectRatio: ctx.aspectRatio,
            durationSec: ctx.durationSec,
            style: ctx.style,
            voice: ctx.voice,
            model: ctx.model,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan skill");
      }
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: ctx.prompt.trim(), referenceIds: ctx.selected, aspectRatio: ctx.aspectRatio, durationSec: ctx.durationSec, style: ctx.style, voice: ctx.voice, model: ctx.model, media: ctx.media }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat job");
      router.push(`/jobs/${data.job.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan";
      if (saveOpen) setSaveError(msg);
      else ctx.setError(msg);
      setSubmitting(false);
    }
  };

  return {
    submitting, openSave, doGenerate,
    saveOpen, setSaveOpen, saveSeries, setSaveSeries,
    newSeriesName, setNewSeriesName, savePart, setSavePart, saveError,
  };
}

export type SaveDialog = ReturnType<typeof useSaveDialog>;
