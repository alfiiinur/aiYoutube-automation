"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PageHeader } from "../../components/ui";
import { useDashboardData } from "./_hooks/useDashboardData";
import { useAnalyticsData } from "./_hooks/useAnalyticsData";
import { StatTiles } from "./_components/StatTiles";
import { AnalyticsPanel } from "./_components/AnalyticsPanel";
import { AdvicePanel } from "./_components/AdvicePanel";
import { GoalsStrip } from "./_components/GoalsStrip";
import { RecentJobs } from "./_components/RecentJobs";
import { SideCards } from "./_components/SideCards";

export default function DashboardPage() {
  const { stats, jobs, goals } = useDashboardData();
  const { analytics, advice, range, setRange, loadingAdvice, refreshAdvice } = useAnalyticsData();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan pipeline produksi: job render, referensi yang sudah dianalisis, dan jadwal automation."
        action={
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/85"
          >
            <Sparkles className="size-4" /> Generate video
          </Link>
        }
      />

      <StatTiles stats={stats} />

      {/* ------------------------- analisis konten ------------------------- */}
      <AnalyticsPanel analytics={analytics} advice={advice} range={range} setRange={setRange} />

      {/* ------------------------- saran AI ------------------------- */}
      <AdvicePanel advice={advice} loadingAdvice={loadingAdvice} onRefresh={refreshAdvice} />

      <GoalsStrip goals={goals} />

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <RecentJobs jobs={jobs} />
        <SideCards stats={stats} />
      </div>
    </div>
  );
}
