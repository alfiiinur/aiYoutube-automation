"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useJobDetail } from "./_hooks/useJobDetail";
import { JobHeader } from "./_components/JobHeader";
import { PipelineCard } from "./_components/PipelineCard";
import { ContentTabs } from "./_components/ContentTabs";
import { SummaryCard } from "./_components/SummaryCard";
import { ReferencesCard } from "./_components/ReferencesCard";
import { AssetsCard } from "./_components/AssetsCard";

export default function JobDetailPage() {
  const { job, refs, tab, setTab, error, retry, downloadSrt, downloadMd, updateThumbnail, savingThumbnail } =
    useJobDetail();

  if (error) {
    return (
      <div>
        <Link href="/jobs" className="inline-flex items-center gap-1.5 text-xs text-white/45 hover:text-white">
          <ArrowLeft className="size-3.5" /> Kembali
        </Link>
        <p className="mt-6 text-sm text-brand-400">{error}</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="grid place-items-center py-24 text-white/40">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <JobHeader job={job} onRetry={retry} />

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-4">
          <PipelineCard job={job} />
          <ContentTabs
            job={job}
            tab={tab}
            setTab={setTab}
            onDownloadSrt={downloadSrt}
            onDownloadMd={downloadMd}
            onSelectThumbnail={updateThumbnail}
            savingThumbnail={savingThumbnail}
          />
        </div>

        <div className="flex flex-col gap-4">
          <SummaryCard job={job} />
          <ReferencesCard refs={refs} />
          <AssetsCard job={job} />
        </div>
      </div>
    </div>
  );
}
