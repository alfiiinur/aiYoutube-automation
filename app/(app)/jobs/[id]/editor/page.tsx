"use client";

import Timeline from "@/app/components/editor/Timeline";
import { useEditorPage } from "./_hooks/use-editor-page";
import EditorDropRoot from "./_components/editor-drop-root";
import EditorError from "./_components/editor-error";
import EditorExportDialog from "./_components/editor-export-dialog";
import EditorImportOverlay from "./_components/editor-import-overlay";
import EditorLoading from "./_components/editor-loading";
import EditorMainStage from "./_components/editor-main-stage";
import EditorToast from "./_components/editor-toast";
import EditorToolRail from "./_components/editor-tool-rail";
import EditorTopBar from "./_components/editor-topbar";

export default function VideoEditorPage() {
  const e = useEditorPage();

  if (e.loading) return <EditorLoading />;
  if (e.error || !e.job || !e.project) return <EditorError error={e.error} jobId={e.id} />;

  const { job, project } = e;

  return (
    <EditorDropRoot
      onFiles={(files) => void e.importFiles(files)}
      onDragActiveChange={e.setDragActive}
    >
      <EditorImportOverlay
        dragActive={e.dragActive}
        inputRef={e.importInputRef}
        onFiles={(files) => void e.importFiles(files)}
      />
      {/* top bar */}
      <EditorTopBar
        jobId={e.id}
        title={e.title}
        onTitleChange={e.updateTitle}
        steps={e.steps}
        saving={e.saving}
        dirty={e.dirty}
        savedAt={e.savedAt}
        onToggleMobilePanel={() => e.setMobilePanel((v) => !v)}
        onImportClick={() => e.importInputRef.current?.click()}
        importing={e.importing}
        onSave={e.save}
        onOpenExport={e.openExportDialog}
      />

      {/* workspace */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1">
          <EditorToolRail
            tool={e.tool}
            onChooseTool={e.chooseTool}
            sideTab={e.sideTab}
            onOpenAi={() => {
              e.setSideTab("chat");
              e.setMobilePanel(true);
            }}
          />

          <EditorMainStage
            job={job}
            project={project}
            playhead={e.playhead}
            playing={e.playing}
            selection={e.selection}
            sideTab={e.sideTab}
            thinking={e.thinking}
            mobilePanel={e.mobilePanel}
            importing={e.importing}
            onTogglePlay={e.togglePlay}
            onSeek={(t) => e.setPlayhead(t)}
            onPrev={e.prevClip}
            onNext={e.nextClip}
            onTabChange={e.setSideTab}
            onSend={e.sendChat}
            onUpdateMusic={e.updateMusic}
            onUpdateVoiceVolume={e.updateVoiceVolume}
            onUpdateClip={e.updateClip}
            onUpdateCaption={e.updateCaption}
            onUpdateOverlay={e.updateOverlay}
            onApplyMusicPreset={e.applyMusicPreset}
            onGenerateMusic={e.generateMusic}
            onSplit={e.splitSelected}
            onDelete={e.removeSelected}
            onToggleCaptions={e.toggleCaptions}
            onAddOverlay={e.addOverlay}
            onImportMedia={() => e.importInputRef.current?.click()}
          />
        </div>

        <Timeline
          project={project}
          playhead={e.playhead}
          playing={e.playing}
          selection={e.selection}
          tool={e.tool}
          onSelect={(sel) => {
            e.setSelection(sel);
            if (sel) e.setTool(sel.track === "music" ? "music" : sel.track === "caption" ? "caption" : sel.track === "overlay" ? "overlay" : "clip");
          }}
          onSeek={(t) => e.setPlayhead(t)}
          onUpdateClip={e.updateClip}
          onUpdateCaption={e.updateCaption}
          onUpdateOverlay={e.updateOverlay}
          onTrimClip={e.trimClip}
          onReorderClips={e.reorderClips}
          onSplit={e.splitSelected}
          onDelete={e.removeSelected}
          onAddOverlay={e.addOverlay}
          onOpenMusic={() => e.setSideTab("props")}
          onImport={() => e.importInputRef.current?.click()}
          onImportFiles={(files) => void e.importFiles(files)}
          importing={e.importing}
        />
      </div>

      {/* export modal */}
      <EditorExportDialog
        open={e.exportOpen}
        job={job}
        project={project}
        duration={e.duration}
        exporting={e.exporting}
        exportPct={e.exportPct}
        exportPhase={e.exportPhase}
        exportError={e.exportError}
        exportResult={e.exportResult}
        onClose={() => e.setExportOpen(false)}
        onStartExport={e.startExport}
      />

      {/* toast */}
      <EditorToast toast={e.toast} />
    </EditorDropRoot>
  );
}
