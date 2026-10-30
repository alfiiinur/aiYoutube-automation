"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { exportProjectToVideo } from "@/app/lib/export-video";
import type { EditorProject, VideoJob } from "@/app/types";
import type { EditorCoreState } from "./use-editor-state";

type ExportDeps = {
  job: VideoJob | null;
  project: EditorProject | null;
  dirty: boolean;
  save: () => Promise<void>;
  setToast: EditorCoreState["setToast"];
};

export type EditorExportResult = {
  extension: string;
  filename: string;
  url: string;
};

/** Export dialog state + video export. */
export function useEditorExport(deps: ExportDeps) {
  const { job, project, dirty, save, setToast } = deps;

  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportPct, setExportPct] = useState(0);
  const [exportPhase, setExportPhase] = useState("");
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<EditorExportResult | null>(null);
  const exportQueryHandled = useRef(false);

  const startExport = useCallback(async () => {
    if (!job || !project || exporting) return;
    if (dirty) await save();
    setExporting(true);
    setExportPct(1);
    setExportPhase("Menyiapkan aset…");
    setExportError(null);
    setExportResult(null);
    try {
      const result = await exportProjectToVideo({
        job,
        project,
        onProgress: (pct, phase) => {
          setExportPct(pct);
          setExportPhase(phase);
        },
      });
      setExportPct(100);
      setExportPhase("Selesai");
      setExportResult({ extension: result.extension, filename: result.filename, url: result.downloadUrl });
      setToast({
        text: result.warnings.length
          ? `Video terunduh (${result.filename}). Catatan: ${result.warnings[0]}`
          : `Video terunduh: ${result.filename}`,
        tone: "ok",
      });
    } catch (e) {
      setExportPct(0);
      setExportPhase("");
      const message = e instanceof Error ? e.message : "Gagal mengekspor video";
      setExportError(message);
      setToast({ text: message, tone: "error" });
    } finally {
      setExporting(false);
    }
  }, [dirty, exporting, job, project, save, setToast]);

  /* Tombol unduh di halaman job membuka editor dengan ?export=1. */
  useEffect(() => {
    if (exportQueryHandled.current || !job || !project) return;
    if (new URLSearchParams(window.location.search).get("export") !== "1") return;
    exportQueryHandled.current = true;
    setExportOpen(true);
  }, [job, project]);

  const openExportDialog = useCallback(() => {
    setExportPct(0);
    setExportPhase("");
    setExportError(null);
    setExportResult(null);
    setExportOpen(true);
  }, []);

  return {
    exportOpen,
    setExportOpen,
    exporting,
    exportPct,
    setExportPct,
    exportPhase,
    setExportPhase,
    exportError,
    setExportError,
    exportResult,
    setExportResult,
    startExport,
    openExportDialog,
  };
}
