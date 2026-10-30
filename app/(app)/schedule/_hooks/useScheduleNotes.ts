"use client";

import { useState } from "react";
import type { NoteColor, ScheduleNote } from "../../../types";

export function useScheduleNotes(
  selectedDayStr: string,
  setNotes: React.Dispatch<React.SetStateAction<ScheduleNote[]>>,
) {
  const [noteText, setNoteText] = useState("");
  const [noteColor, setNoteColor] = useState<NoteColor>("yellow");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = noteText.trim();
    if (!text || noteSaving) return;
    setNoteSaving(true);
    setNoteError(null);
    try {
      const r = await fetch("/api/schedule-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: selectedDayStr, text, color: noteColor }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Gagal menambah catatan");
      setNotes((prev) => [...prev, d.note as ScheduleNote]);
      setNoteText("");
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Gagal menambah catatan");
    } finally {
      setNoteSaving(false);
    }
  };

  const deleteNote = async (id: string) => {
    setDeletingId(id);
    try {
      const r = await fetch(`/api/schedule-notes/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "Gagal menghapus catatan");
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Gagal menghapus catatan");
    } finally {
      setDeletingId(null);
    }
  };

  return {
    noteText,
    setNoteText,
    noteColor,
    setNoteColor,
    noteSaving,
    noteError,
    deletingId,
    addNote,
    deleteNote,
  };
}
