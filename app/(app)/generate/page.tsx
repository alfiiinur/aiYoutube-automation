"use client";

import { PanelLeft, PanelRight } from "lucide-react";
import { PageHeader } from "../../components/ui";
import { useGeneratePage } from "./_hooks/useGeneratePage";
import { ChatSidebar } from "./_components/ChatSidebar";
import { PromptCard } from "./_components/PromptCard";
import { SkillListCard } from "./_components/SkillListCard";
import { MediaImportCard } from "./_components/MediaImportCard";
import { ReferenceCard } from "./_components/ReferenceCard";
import { SettingsColumn } from "./_components/SettingsColumn";
import { SaveDialog } from "./_components/SaveDialog";

export default function GeneratePage() {
  const g = useGeneratePage();

  return (
    <div>
      <PageHeader
        title="Generate Video"
        subtitle="Tulis prompt, tempel link YouTube/Instagram sebagai referensi gaya, lalu jalankan pipeline produksi."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => g.setSidebarOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-[12px] text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <PanelLeft className="size-4" />
              {g.sidebarOpen ? "Sembunyikan chats" : "Tampilkan chats"}
            </button>
            <button
              onClick={() => g.setSettingsOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-[12px] text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <PanelRight className="size-4" />
              {g.settingsOpen ? "Sembunyikan pengaturan" : "Tampilkan pengaturan"}
            </button>
          </div>
        }
      />

      <div className="flex items-start gap-4">
        <ChatSidebar
          open={g.sidebarOpen}
          chats={g.chats}
          chatsLoading={g.chatsLoading}
          filteredChats={g.filteredChats}
          chatQuery={g.chatQuery}
          setChatQuery={g.setChatQuery}
          loadedJobId={g.loadedJobId}
          onNewChat={g.newChat}
          onLoadChat={g.loadChat}
          onDeleteChat={g.deleteChat}
          onClose={() => g.setSidebarOpen(false)}
        />

        <div className="grid min-w-0 flex-1 gap-4 xl:grid-cols-[1.55fr_1fr]">
          <div className="flex flex-col gap-4">
            <PromptCard
              prompt={g.prompt}
              setPrompt={g.setPrompt}
              promptRef={g.promptRef}
              onKeyDown={g.onPromptKeyDown}
              slashMode={g.slashMode}
              slashResults={g.slashResults}
              highlight={g.highlight}
              setHighlight={g.setHighlight}
              onApplySkill={g.applySkill}
              skillsCount={g.skills.length}
              pendingSeries={g.pendingSeries}
              onClearPendingSeries={() => g.setPendingSeries(null)}
            />
            <SkillListCard
              skillsLoading={g.skillsLoading}
              skillsCount={g.skills.length}
              groups={g.groups}
              nextPartFor={g.nextPartFor}
              onContinueSeries={g.continueSeries}
              onApplySkill={g.applySkill}
              onDeleteSkill={g.deleteSkill}
            />
            <MediaImportCard
              media={g.media}
              uploadingMedia={g.uploadingMedia}
              mediaError={g.mediaError}
              inputRef={g.mediaInputRef}
              onUpload={g.uploadMediaFiles}
              onRemove={g.removeMedia}
            />
            <ReferenceCard
              url={g.url}
              setUrl={g.setUrl}
              busyRef={g.busyRef}
              error={g.error}
              refs={g.refs}
              selected={g.selected}
              setSelected={g.setSelected}
              onAdd={g.addReference}
              onRemove={g.removeReference}
            />
          </div>

          <SettingsColumn
            settingsOpen={g.settingsOpen}
            aspectRatio={g.aspectRatio}
            setAspectRatio={g.setAspectRatio}
            durationSec={g.durationSec}
            setDurationSec={g.setDurationSec}
            durationMinText={g.durationMinText}
            setDurationMinText={g.setDurationMinText}
            setDuration={g.setDuration}
            style={g.style}
            setStyle={g.setStyle}
            voice={g.voice}
            setVoice={g.setVoice}
            model={g.model}
            setModel={g.setModel}
            submitting={g.submitting}
            onGenerate={g.openSave}
            selectedRefs={g.selectedRefs}
          />
        </div>
      </div>

      {g.saveOpen && (
        <SaveDialog
          prompt={g.prompt}
          saveSeries={g.saveSeries}
          setSaveSeries={g.setSaveSeries}
          newSeriesName={g.newSeriesName}
          setNewSeriesName={g.setNewSeriesName}
          savePart={g.savePart}
          setSavePart={g.setSavePart}
          saveError={g.saveError}
          seriesNames={g.seriesNames}
          submitting={g.submitting}
          nextPartFor={g.nextPartFor}
          onClose={() => g.setSaveOpen(false)}
          onGenerate={g.doGenerate}
        />
      )}
    </div>
  );
}
