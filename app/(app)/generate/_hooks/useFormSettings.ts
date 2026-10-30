"use client";

import { useRef, useState } from "react";
import type { AspectRatio } from "../../../types";
import { MAX_DURATION_SEC, MIN_DURATION_SEC } from "../_lib/constants";
import { secToMinText } from "../_lib/format";

/** State formulir generate: prompt + pengaturan video. */
export function useFormSettings() {
  const [prompt, setPrompt] = useState("");
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [durationSec, setDurationSec] = useState(45);
  const [durationMinText, setDurationMinText] = useState(secToMinText(45));
  const [style, setStyle] = useState("cinematic");
  const [voice, setVoice] = useState("female-id");
  const [model, setModel] = useState("studio-v1");

  /** Set durasi (detik) + sinkronkan input menit. */
  const setDuration = (sec: number) => {
    const clamped = Math.max(MIN_DURATION_SEC, Math.min(MAX_DURATION_SEC, Math.round(sec)));
    setDurationSec(clamped);
    setDurationMinText(secToMinText(clamped));
  };

  return {
    prompt, setPrompt, promptRef,
    aspectRatio, setAspectRatio,
    durationSec, setDurationSec, durationMinText, setDurationMinText, setDuration,
    style, setStyle, voice, setVoice, model, setModel,
  };
}

export type FormSettings = ReturnType<typeof useFormSettings>;
