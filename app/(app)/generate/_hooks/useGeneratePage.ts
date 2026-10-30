"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import type { PromptSkill, VideoJob } from "../../../types";
import { useFormSettings } from "./useFormSettings";
import { usePromptSkills, type PendingSeries } from "./usePromptSkills";
import { useSlashSearch } from "./useSlashSearch";
import { useChatHistory } from "./useChatHistory";
import { useMediaImport } from "./useMediaImport";
import { useReferences } from "./useReferences";
import { useSaveDialog } from "./useSaveDialog";

export type { SkillGroup, PendingSeries } from "./usePromptSkills";

/** Fasad halaman Generate: merangkai hook-hook fokus + aksi lintas-hook. */
export function useGeneratePage() {
  const form = useFormSettings();
  const skillStore = usePromptSkills();
  const chatStore = useChatHistory();
  const mediaStore = useMediaImport();
  const [error, setError] = useState<string | null>(null);
  const refStore = useReferences(setError);

  const [highlight, setHighlight] = useState(0);
  const [pendingSeries, setPendingSeries] = useState<PendingSeries | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const { slashMode, slashResults } = useSlashSearch(form.prompt, skillStore.skills);

  const saveStore = useSaveDialog({
    prompt: form.prompt,
    pendingSeries,
    seriesNames: skillStore.seriesNames,
    nextPartFor: skillStore.nextPartFor,
    aspectRatio: form.aspectRatio,
    durationSec: form.durationSec,
    style: form.style,
    voice: form.voice,
    model: form.model,
    selected: refStore.selected,
    media: mediaStore.media,
    setError,
  });

  useEffect(() => {
    refStore.loadRefs();
    skillStore.loadSkills();
    chatStore.loadChats();
    if (window.innerWidth < 1280) setSidebarOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applySkill = (skill: PromptSkill) => {
    form.setPrompt(skill.prompt);
    form.setAspectRatio(skill.aspectRatio);
    form.setDuration(skill.durationSec);
    form.setStyle(skill.style);
    form.setVoice(skill.voice);
    form.setModel(skill.model);
    setPendingSeries(null);
    setHighlight(0);
    fetch(`/api/prompt-skills/${skill.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "used" }),
    }).catch(() => undefined);
    form.promptRef.current?.focus();
  };

  const onPromptKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!slashMode) return;
    if (e.key === "ArrowDown" && slashResults.length > 0) {
      e.preventDefault();
      setHighlight((h) => (h + 1) % slashResults.length);
    } else if (e.key === "ArrowUp" && slashResults.length > 0) {
      e.preventDefault();
      setHighlight((h) => (h - 1 + slashResults.length) % slashResults.length);
    } else if (e.key === "Enter" && !e.shiftKey && slashResults.length > 0) {
      e.preventDefault();
      applySkill(slashResults[Math.min(highlight, slashResults.length - 1)]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      form.setPrompt(form.prompt.trimStart().slice(1).trimStart());
    }
  };

  const continueSeries = (name: string) => {
    setPendingSeries({ series: name, part: skillStore.nextPartFor(name) });
    form.promptRef.current?.focus();
  };

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1280) setSidebarOpen(false);
  };

  const loadChat = (chat: VideoJob) => {
    form.setPrompt(chat.prompt);
    form.setAspectRatio(chat.aspectRatio);
    form.setDuration(chat.durationSec);
    form.setStyle(chat.style);
    form.setVoice(chat.voice);
    form.setModel(chat.model);
    refStore.setSelected(chat.referenceIds.filter((rid) => refStore.refs.some((r) => r.id === rid)));
    mediaStore.setMedia(chat.media ?? []);
    setPendingSeries(null);
    chatStore.setLoadedJobId(chat.id);
    setHighlight(0);
    setError(null);
    closeSidebarOnMobile();
    form.promptRef.current?.focus();
  };

  const newChat = () => {
    form.setPrompt("");
    mediaStore.setMedia([]);
    refStore.setSelected([]);
    setPendingSeries(null);
    chatStore.setLoadedJobId(null);
    setHighlight(0);
    setError(null);
    closeSidebarOnMobile();
    form.promptRef.current?.focus();
  };

  return {
    prompt: form.prompt, setPrompt: form.setPrompt, promptRef: form.promptRef, onPromptKeyDown,
    slashMode, slashResults, highlight, setHighlight, applySkill,
    pendingSeries, setPendingSeries,
    skills: skillStore.skills, skillsLoading: skillStore.skillsLoading,
    groups: skillStore.groups, seriesNames: skillStore.seriesNames,
    nextPartFor: skillStore.nextPartFor, continueSeries, deleteSkill: skillStore.deleteSkill,
    media: mediaStore.media, uploadingMedia: mediaStore.uploadingMedia,
    mediaError: mediaStore.mediaError, mediaInputRef: mediaStore.mediaInputRef,
    uploadMediaFiles: mediaStore.uploadMediaFiles, removeMedia: mediaStore.removeMedia,
    url: refStore.url, setUrl: refStore.setUrl, refs: refStore.refs,
    selected: refStore.selected, setSelected: refStore.setSelected,
    busyRef: refStore.busyRef, error,
    addReference: refStore.addReference, removeReference: refStore.removeReference,
    selectedRefs: refStore.selectedRefs,
    aspectRatio: form.aspectRatio, setAspectRatio: form.setAspectRatio,
    durationSec: form.durationSec, setDurationSec: form.setDurationSec,
    durationMinText: form.durationMinText, setDurationMinText: form.setDurationMinText,
    setDuration: form.setDuration,
    style: form.style, setStyle: form.setStyle,
    voice: form.voice, setVoice: form.setVoice, model: form.model, setModel: form.setModel,
    submitting: saveStore.submitting, openSave: saveStore.openSave, doGenerate: saveStore.doGenerate,
    saveOpen: saveStore.saveOpen, setSaveOpen: saveStore.setSaveOpen,
    saveSeries: saveStore.saveSeries, setSaveSeries: saveStore.setSaveSeries,
    newSeriesName: saveStore.newSeriesName, setNewSeriesName: saveStore.setNewSeriesName,
    savePart: saveStore.savePart, setSavePart: saveStore.setSavePart, saveError: saveStore.saveError,
    chats: chatStore.chats, chatsLoading: chatStore.chatsLoading,
    chatQuery: chatStore.chatQuery, setChatQuery: chatStore.setChatQuery,
    filteredChats: chatStore.filteredChats,
    loadedJobId: chatStore.loadedJobId, loadChat, newChat, deleteChat: chatStore.deleteChat,
    sidebarOpen, setSidebarOpen, settingsOpen, setSettingsOpen,
  };
}

export type GeneratePageState = ReturnType<typeof useGeneratePage>;
