"use client";

import { useCallback, useEffect, useState } from "react";
import type { ContentAnalytics } from "../../../lib/analytics";
import type { ContentAdvice } from "../../../lib/advice";

export function useAnalyticsData() {
  const [analytics, setAnalytics] = useState<ContentAnalytics | null>(null);
  const [advice, setAdvice] = useState<ContentAdvice | null>(null);
  const [range, setRange] = useState<number>(14);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const loadAnalytics = useCallback(async (r: number) => {
    try {
      const res = await fetch(`/api/analytics?range=${r}`, { cache: "no-store" }).then((d) => d.json());
      setAnalytics(res.analytics ?? null);
    } catch {
      /* abaikan — panel lama tetap tampil */
    }
  }, []);

  const loadAdvice = useCallback(async (r: number) => {
    setLoadingAdvice(true);
    try {
      const res = await fetch(`/api/analytics/advice?range=${r}`, { cache: "no-store" }).then((d) =>
        d.json(),
      );
      setAdvice(res.advice ?? null);
    } catch {
      /* biarkan saran lama */
    } finally {
      setLoadingAdvice(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(range);
    loadAdvice(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  useEffect(() => {
    const t = setInterval(() => loadAnalytics(range), 15000);
    return () => clearInterval(t);
  }, [range, loadAnalytics]);

  return {
    analytics,
    advice,
    range,
    setRange,
    loadingAdvice,
    refreshAdvice: () => loadAdvice(range),
  };
}
