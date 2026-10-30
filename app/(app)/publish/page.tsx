"use client";

import { useState } from "react";
import { PageHeader } from "../../components/ui";
import ScheduleModal from "../../components/ScheduleModal";
import { usePublishData } from "./_hooks/usePublishData";
import { useAccountForm } from "./_hooks/useAccountForm";
import { usePostComposer } from "./_hooks/usePostComposer";
import { AccountManager } from "./_components/AccountManager";
import { PostComposer } from "./_components/PostComposer";
import { ScheduledList } from "./_components/ScheduledList";

export default function PublishPage() {
  const [error, setError] = useState<string | null>(null);
  const { accounts, jobs, posts, loading, loadAccounts, loadPosts, loadAll } = usePublishData();
  const accountForm = useAccountForm(loadAccounts, setError);
  const composer = usePostComposer(jobs, loadPosts, setError);

  return (
    <div>
      <PageHeader
        title="Auto Post"
        subtitle="Hubungkan akun Threads, Instagram, dan Facebook, lalu jadwalkan konten dari video yang sudah siap dipublikasikan."
      />

      {error && (
        <div className="mb-4 rounded-xl border border-brand-500/30 bg-brand-500/8 px-4 py-3 text-xs text-brand-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1.2fr]">
        {/* Account manager */}
        <AccountManager accounts={accounts} form={accountForm} />

        {/* Composer */}
        <PostComposer composer={composer} />
      </div>

      {/* Postingan terjadwal */}
      <ScheduledList posts={posts} loading={loading} onRefresh={loadAll} onDelete={composer.deletePost} />

      <ScheduleModal
        open={composer.scheduleOpen}
        initial={composer.scheduledAt || undefined}
        onClose={() => composer.setScheduleOpen(false)}
        onSelect={(iso) => composer.setScheduledAt(iso)}
      />
    </div>
  );
}
