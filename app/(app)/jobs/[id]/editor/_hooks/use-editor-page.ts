"use client";

import { useParams } from "next/navigation";
import { useEditorState } from "./use-editor-state";
import { useEditorJob } from "./use-editor-job";
import { useEditorMutations } from "./use-editor-mutate";
import { useEditorPlayback } from "./use-editor-playback";
import { useEditorClips } from "./use-editor-clips";
import { useEditorProps } from "./use-editor-props";
import { useEditorImport } from "./use-editor-import";
import { useEditorChat } from "./use-editor-chat";
import { useEditorExport } from "./use-editor-export";
import { useEditorKeyboard } from "./use-editor-keyboard";

/** Thin facade composing the focused editor hooks (page keeps one import). */
export function useEditorPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const s = useEditorState();
  const { save, updateTitle, steps } = useEditorJob(id, s);
  const { fitDuration, applyProject, mutateProject } = useEditorMutations(s);
  const { duration, togglePlay, prevClip, nextClip } = useEditorPlayback({
    project: s.project,
    job: s.job,
    playhead: s.playhead,
    setPlayhead: s.setPlayhead,
    playing: s.playing,
    setPlaying: s.setPlaying,
  });
  const clips = useEditorClips({
    project: s.project,
    selection: s.selection,
    playhead: s.playhead,
    setSelection: s.setSelection,
    setToast: s.setToast,
    mutateProject,
    applyProject,
  });
  const props = useEditorProps({
    project: s.project,
    playhead: s.playhead,
    setSelection: s.setSelection,
    setTool: s.setTool,
    setSideTab: s.setSideTab,
    setToast: s.setToast,
    mutateProject,
  });
  const { importInputRef, importing, dragActive, setDragActive, importFiles } = useEditorImport({
    projectRef: s.projectRef,
    setSelection: s.setSelection,
    setTool: s.setTool,
    setPlayhead: s.setPlayhead,
    setSideTab: s.setSideTab,
    setToast: s.setToast,
    applyProject,
  });
  const { thinking, sendChat } = useEditorChat({
    id,
    projectRef: s.projectRef,
    playheadRef: s.playheadRef,
    selectionRef: s.selectionRef,
    setProject: s.setProject,
    setDirty: s.setDirty,
    setSelection: s.setSelection,
    setTool: s.setTool,
    fitDuration,
  });
  const exp = useEditorExport({
    job: s.job,
    project: s.project,
    dirty: s.dirty,
    save,
    setToast: s.setToast,
  });
  useEditorKeyboard({
    save,
    togglePlay,
    removeSelected: clips.removeSelected,
    splitSelected: clips.splitSelected,
  });

  return {
    id,
    job: s.job,
    project: s.project,
    title: s.title,
    setTitle: s.setTitle,
    loading: s.loading,
    error: s.error,
    dirty: s.dirty,
    setDirty: s.setDirty,
    saving: s.saving,
    savedAt: s.savedAt,
    playhead: s.playhead,
    setPlayhead: s.setPlayhead,
    setPlaying: s.setPlaying,
    playing: s.playing,
    tool: s.tool,
    setTool: s.setTool,
    selection: s.selection,
    setSelection: s.setSelection,
    sideTab: s.sideTab,
    setSideTab: s.setSideTab,
    thinking,
    toast: s.toast,
    mobilePanel: s.mobilePanel,
    setMobilePanel: s.setMobilePanel,
    exportOpen: exp.exportOpen,
    setExportOpen: exp.setExportOpen,
    exporting: exp.exporting,
    exportPct: exp.exportPct,
    setExportPct: exp.setExportPct,
    exportPhase: exp.exportPhase,
    setExportPhase: exp.setExportPhase,
    exportError: exp.exportError,
    setExportError: exp.setExportError,
    exportResult: exp.exportResult,
    setExportResult: exp.setExportResult,
    importInputRef,
    importing,
    dragActive,
    setDragActive,
    duration,
    steps,
    togglePlay,
    prevClip,
    nextClip,
    updateClip: clips.updateClip,
    trimClip: clips.trimClip,
    reorderClips: clips.reorderClips,
    importFiles,
    updateCaption: props.updateCaption,
    updateOverlay: props.updateOverlay,
    updateMusic: props.updateMusic,
    updateVoiceVolume: props.updateVoiceVolume,
    applyMusicPreset: props.applyMusicPreset,
    generateMusic: props.generateMusic,
    toggleCaptions: props.toggleCaptions,
    addOverlay: props.addOverlay,
    splitSelected: clips.splitSelected,
    removeSelected: clips.removeSelected,
    chooseTool: props.chooseTool,
    sendChat,
    save,
    startExport: exp.startExport,
    updateTitle,
    openExportDialog: exp.openExportDialog,
  };
}

export type EditorPageState = ReturnType<typeof useEditorPage>;
