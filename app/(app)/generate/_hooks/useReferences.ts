"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { ReferenceSource } from "../../../types";

/** Referensi link: tambah/hapus via /api/references + seleksi. */
export function useReferences(setError: Dispatch<SetStateAction<string | null>>) {
  const [url, setUrl] = useState("");
  const [refs, setRefs] = useState<ReferenceSource[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busyRef, setBusyRef] = useState(false);

  const loadRefs = async () => {
    const r = await fetch("/api/references", { cache: "no-store" }).then((x) => x.json());
    setRefs(r.references ?? []);
  };

  const addReference = async () => {
    if (!url.trim()) return;
    setBusyRef(true);
    setError(null);
    try {
      const res = await fetch("/api/references", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menganalisis link");
      await loadRefs();
      setSelected((s) => (s.includes(data.reference.id) ? s : [...s, data.reference.id]));
      setUrl("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setBusyRef(false);
    }
  };

  const removeReference = async (id: string) => {
    await fetch(`/api/references/${id}`, { method: "DELETE" });
    setSelected((s) => s.filter((x) => x !== id));
    await loadRefs();
  };

  const selectedRefs = useMemo(() => refs.filter((r) => selected.includes(r.id)), [refs, selected]);

  return {
    url, setUrl, refs, selected, setSelected, busyRef,
    loadRefs, addReference, removeReference, selectedRefs,
  };
}

export type References = ReturnType<typeof useReferences>;
