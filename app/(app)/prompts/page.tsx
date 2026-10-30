"use client";

import { useEffect, useState } from "react";
import { Bookmark, Check, Clapperboard, Copy, Loader2, PanelLeft, Sparkles, X } from "lucide-react";
import { Card, PageHeader } from "../../components/ui";
import type { PromptSkill } from "../../types";
import { usePromptSkills } from "../generate/_hooks/usePromptSkills";
import { usePromptIdeas } from "./_hooks/usePromptIdeas";
import { usePromptHistory } from "./_hooks/usePromptHistory";
import type { PromptHistoryEntry } from "../../types";
import { HistorySidebar } from "./_components/HistorySidebar";
import { SkillContinueCard } from "./_components/SkillContinueCard";

export default function PromptsPage() {
  const history = usePromptHistory();
  const p = usePromptIdeas((set) => history.push(set));
  const skills = usePromptSkills();
  const [historyOpen, setHistoryOpen] = useState(true);

  useEffect(() => {
    skills.loadSkills();
    if (window.innerWidth < 1280) setHistoryOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const newChat = () => {
    history.setLoadedId(null);
    p.reset();
  };

  const loadEntry = (entry: PromptHistoryEntry) => {
    history.setLoadedId(entry.id);
    p.restore(entry);
  };

  const continueSeries = (name: string) => {
    p.setActiveSeries(name);
    void p.generate(name);
  };

  const topicFromSkill = (skill: PromptSkill) => {
    if (skill.series) p.setActiveSeries(skill.series);
    void p.generate(skill.prompt.slice(0, 120));
  };

  const saveIdea = async (idea: { title: string; prompt: string }) => {
    await p.saveIdea(idea);
    skills.loadSkills();
  };

  return (
    <div>
      <PageHeader
        title="Prompt Ideas"
        subtitle="Tulis topik, dapatkan daftar ide prompt video — lalu pakai langsung di Generate Video."
        action={
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-[12px] text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <PanelLeft className="size-4" />
            {historyOpen ? "Sembunyikan riwayat" : "Tampilkan riwayat"}
          </button>
        }
      />

      <div className="flex items-start gap-4">
        <HistorySidebar
          open={historyOpen}
          entries={history.entries}
          loadedId={history.loadedId}
          onNew={newChat}
          onLoad={loadEntry}
          onDelete={history.remove}
          onClose={() => setHistoryOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Card className="p-5">
            {p.activeSeries && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-3 py-1 text-[11px] text-accent-400">
                Melanjutkan serial: {p.activeSeries} · ide yang disimpan masuk part{" "}
                {skills.nextPartFor(p.activeSeries)}
                <button
                  onClick={() => p.setActiveSeries(null)}
                  className="rounded-full p-0.5 transition hover:bg-white/10"
                  aria-label="Batalkan serial aktif"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={p.topic}
                onChange={(e) => p.setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void p.generate();
                }}
                placeholder="Topik, mis. kopi susu gula aren untuk pemula…"
                maxLength={200}
                className="input-base flex-1"
              />
              <div className="flex gap-2">
                <select
                  value={p.count}
                  onChange={(e) => p.setCount(Number(e.target.value))}
                  className="input-base w-24"
                  aria-label="Jumlah ide"
                >
                  {[3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n} className="bg-ink-900">
                      {n} ide
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => void p.generate()}
                  disabled={p.loading || p.topic.trim().length < 3}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[12px] font-medium text-black transition hover:bg-white/85 disabled:opacity-50"
                >
                  {p.loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {p.loading ? "Menyusun…" : "Generate"}
                </button>
              </div>
            </div>

            {p.error && <p className="mt-3 text-[12px] text-brand-400">{p.error}</p>}
            {p.notice && !p.error && <p className="mt-3 text-[11.5px] leading-relaxed text-white/40">{p.notice}</p>}
          </Card>

          {p.ideas.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white/85">Hasil</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    p.source === "ai" ? "bg-lime-500/15 text-lime-300" : "bg-white/6 text-white/45"
                  }`}
                >
                  {p.source === "ai" ? "dibuat AI" : "peracik lokal"}
                </span>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {p.ideas.map((idea) => {
                  const saved = p.savedTitles.includes(idea.title);
                  const saving = p.savingTitle === idea.title;
                  return (
                    <Card key={idea.title} className="flex flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[13px] font-semibold leading-snug text-white/90">{idea.title}</h3>
                        {idea.angle && (
                          <span className="shrink-0 rounded-full bg-white/6 px-2 py-0.5 text-[10px] text-white/50">
                            {idea.angle}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 flex-1 text-[12px] leading-relaxed text-white/55">{idea.prompt}</p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => void p.copyIdea(idea)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/60 transition hover:bg-white/10 hover:text-white"
                        >
                          {p.copied === idea.title ? (
                            <Check className="size-3 text-lime-400" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                          {p.copied === idea.title ? "Tersalin" : "Salin"}
                        </button>
                        <button
                          onClick={() => void saveIdea(idea)}
                          disabled={saved || saving}
                          title={p.activeSeries ? `Simpan ke serial ${p.activeSeries}` : "Simpan sebagai skill"}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                        >
                          {saving ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : saved ? (
                            <Check className="size-3 text-lime-400" />
                          ) : (
                            <Bookmark className="size-3" />
                          )}
                          {saved ? "Tersimpan" : saving ? "Menyimpan…" : "Simpan"}
                        </button>
                        <button
                          onClick={() => p.useInGenerate(idea)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-medium text-black transition hover:bg-white/85"
                        >
                          <Clapperboard className="size-3" /> Pakai
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          <SkillContinueCard
            skillsLoading={skills.skillsLoading}
            skillsCount={skills.skills.length}
            groups={skills.groups}
            nextPartFor={skills.nextPartFor}
            activeSeries={p.activeSeries}
            onContinueSeries={continueSeries}
            onTopicFromSkill={topicFromSkill}
            onDeleteSkill={skills.deleteSkill}
          />
        </div>
      </div>
    </div>
  );
}
