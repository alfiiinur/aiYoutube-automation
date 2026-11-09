"use client";

import { useRef, useState, type DragEvent } from "react";

type DropHandlers = {
  onDragEnter: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
};

/** Terima drop file dari Explorer/Finder ke elemen mana pun. */
export function useDropFiles(onFiles: (files: FileList) => void) {
  const [dragging, setDragging] = useState(false);
  const counter = useRef(0);

  const handlers: DropHandlers = {
    onDragEnter: (e) => {
      e.preventDefault();
      counter.current += 1;
      setDragging(true);
    },
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: (e) => {
      e.preventDefault();
      counter.current -= 1;
      if (counter.current <= 0) {
        counter.current = 0;
        setDragging(false);
      }
    },
    onDrop: (e) => {
      e.preventDefault();
      counter.current = 0;
      setDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFiles(e.dataTransfer.files);
      }
    },
  };

  return { dragging, handlers };
}
