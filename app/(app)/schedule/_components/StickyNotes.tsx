"use client";

import { StickyNote, Trash2 } from "lucide-react";
import { NOTE_COLOR_IDS, type ScheduleNote } from "../../../types";
import { NOTE_STYLES, toDayString } from "../_lib/date";
import { useScheduleNotes } from "../_hooks/useScheduleNotes";

export function StickyNotes({
  selected,
  notes,
  setNotes,
}: {
  selected: Date;
  notes: ScheduleNote[];
  setNotes: React.Dispatch<React.SetStateAction<ScheduleNote[]>>;
}) {
  const selectedDayStr = toDayString(selected);
  const selectedNotes = notes
    .filter((n) => n.day === selectedDayStr)
    .sort((a, b) => a.createdAt - b.createdAt);

  const {
    noteText,
    setNoteText,
    noteColor,
    setNoteColor,
    noteSaving,
    noteError,
    deletingId,
    addNote,
    deleteNote,
  } = useScheduleNotes(selectedDayStr, setNotes);

  return (
    <div className="mt-2 border-t border-white/6 pt-4">
      <div className="mb-2 flex items-center gap-2">
        <StickyNote className="size-3.5 text-white/40" />
        <h2 className="text-sm font-semibold text-white/85">Sticky notes</h2>
        <span className="text-[11px] text-white/35">
          · {selectedNotes.length} catatan ·{" "}
          {selected.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
        </span>
      </div>

      {selectedNotes.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {selectedNotes.map((n) => (
            <div
              key={n.id}
              className={`relative rounded-lg p-2.5 text-[12px] leading-relaxed shadow-md ${NOTE_STYLES[n.color]?.card ?? NOTE_STYLES.yellow.card}`}
            >
              <p className="whitespace-pre-wrap break-words pr-7">{n.text}</p>
              <button
                onClick={() => deleteNote(n.id)}
                disabled={deletingId === n.id}
                aria-label="Hapus catatan"
                title="Hapus catatan"
                className="absolute right-1.5 top-1.5 rounded-md p-1.5 opacity-50 transition hover:bg-black/10 hover:opacity-100 disabled:opacity-30"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={addNote} className="mt-2">
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder={`Tulis catatan untuk ${selected.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}…`}
          className="input-base resize-none"
          aria-label="Isi catatan"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Warna catatan">
            {NOTE_COLOR_IDS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNoteColor(c)}
                aria-label={`Warna ${c}`}
                title={c}
                aria-pressed={noteColor === c}
                className={`size-5 rounded-full transition ${NOTE_STYLES[c].dot} ${
                  noteColor === c
                    ? "ring-2 ring-white/80 ring-offset-2 ring-offset-black"
                    : "opacity-50 hover:opacity-100"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] tabular-nums text-white/30">{noteText.trim().length}/500</span>
            <button
              type="submit"
              disabled={noteText.trim().length === 0 || noteSaving}
              className="rounded-xl bg-white px-3.5 py-2 text-xs font-medium text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {noteSaving ? "Menyimpan…" : "Tambah catatan"}
            </button>
          </div>
        </div>
        {noteError && <p className="mt-2 text-xs text-brand-400">{noteError}</p>}
      </form>
    </div>
  );
}
