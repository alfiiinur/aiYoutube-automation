"use client";

import { Plus, Sparkles } from "lucide-react";
import { Card, PageHeader } from "../../components/ui";
import { CategoryPanel } from "./_components/category-panel";
import { GoalList } from "./_components/goal-list";
import { HistoryList } from "./_components/history-list";
import { LiveChatPane } from "./_components/live-chat-pane";
import { ReplayPane } from "./_components/replay-pane";
import { useGoalsPage } from "./_hooks/use-goals-page";

export default function GoalsPage() {
  const s = useGoalsPage();

  return (
    <div>
      <PageHeader
        title="Goals"
        subtitle="Susun goal lewat percakapan, ubah jadi rencana konten siap generate. Progres dihitung otomatis dari job dan postingan."
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/3 px-3 py-1.5 text-[11px] text-white/50">
            <span className="size-1.5 rounded-full bg-lime-400" />
            {s.activeCount} goal aktif
          </span>
        }
      />

      <div className="grid items-start gap-4 xl:grid-cols-[1.55fr_1fr]">
        {/* ---------------- chat builder ---------------- */}
        <Card className="flex h-[620px] flex-col overflow-hidden p-0 xl:h-[calc(100vh-11rem)] xl:min-h-[540px]">
          <div className="flex items-center justify-between gap-2 border-b border-white/8 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10">
                <Sparkles className="size-4 text-accent-400" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-[13px] font-semibold text-white/85">Goal assistant</h2>
                <p className="text-[10px] text-white/35">Percakapan singkat, goal langsung terlacak</p>
              </div>
            </div>
            <button
              onClick={s.resetFlow}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/4 px-2.5 py-1.5 text-[11px] text-white/60 transition hover:bg-white/8 hover:text-white"
            >
              <Plus className="size-3.5" />
              Goal baru
            </button>
          </div>

          <div className="flex min-h-0 flex-1">
            <aside className="hidden w-52 shrink-0 flex-col border-r border-white/8 md:flex">
              <HistoryList
                chats={s.chats}
                loading={s.chatsLoading}
                activeId={s.view.kind === "replay" ? s.view.id : null}
                liveId={s.liveChatId}
                onSelect={s.selectChat}
                onNew={s.newChat}
                onDelete={(id) => void s.deleteChat(id)}
              />
            </aside>
            {s.view.kind === "live" ? (
              <LiveChatPane
                chatScrollRef={s.chatScrollRef}
                category={s.category}
                customStart={s.customStart}
                step={s.step}
                outcome={s.outcome}
                goalTarget={s.goalTarget}
                deadlineChoice={s.deadlineChoice}
                created={s.created}
                error={s.error}
                draft={s.draft}
                setDraft={s.setDraft}
                placeholder={s.placeholder}
                CategoryIcon={s.CategoryIcon}
                busy={s.busy}
                onSubmit={s.onSubmit}
                onReset={s.resetFlow}
                onChooseCategory={s.chooseCategory}
                onChooseOutcome={s.chooseOutcome}
                onChooseTarget={s.chooseTarget}
                onChooseDeadline={s.chooseDeadline}
                onCreateGoal={() => void s.createGoal()}
              />
            ) : s.activeChat ? (
              <ReplayPane
                chat={s.activeChat}
                goalTitle={s.goals.find((g) => g.id === s.activeChat?.goalId)?.title ?? null}
                onBack={() => s.setView({ kind: "live" })}
                onContinue={() => s.continueChat(s.activeChat!)}
                onDelete={() => void s.deleteChat(s.activeChat!.id)}
              />
            ) : null}
          </div>
        </Card>

        {/* ---------------- kategori ---------------- */}
        <CategoryPanel categoryId={s.categoryId} onChoose={s.chooseCategory} />
      </div>

      {/* ---------------- daftar goal ---------------- */}
      <GoalList
        loading={s.loading}
        sorted={s.sorted}
        activeCount={s.activeCount}
        totalCount={s.goals.length}
        onToggleComplete={(g) => void s.toggleComplete(g)}
        onRemove={(id) => void s.remove(id)}
        onPlanUpdate={s.updatePlan}
      />
    </div>
  );
}
