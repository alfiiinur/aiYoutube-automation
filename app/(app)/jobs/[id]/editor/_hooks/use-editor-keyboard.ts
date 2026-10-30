"use client";

import { useEffect } from "react";

type KeyboardDeps = {
  save: () => void;
  togglePlay: () => void;
  removeSelected: () => void;
  splitSelected: () => void;
};

/** Global shortcuts: Ctrl/Cmd+S save, Space play, Delete remove, B split. */
export function useEditorKeyboard(deps: KeyboardDeps) {
  const { save, togglePlay, removeSelected, splitSelected } = deps;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
        return;
      }
      if (typing) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeSelected();
      } else if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        splitSelected();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save, togglePlay, removeSelected, splitSelected]);
}
