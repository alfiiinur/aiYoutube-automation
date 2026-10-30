import PreviewStage from "@/app/components/editor/PreviewStage";
import SidePanel, { type SideTab } from "@/app/components/editor/SidePanel";
import type {
  EditorCaption,
  EditorClip,
  EditorMusic,
  EditorOverlay,
  EditorProject,
  EditorSelection,
  VideoJob,
} from "@/app/types";
import type { MUSIC_PRESETS } from "@/app/lib/editor";

type Props = {
  job: VideoJob;
  project: EditorProject;
  playhead: number;
  playing: boolean;
  selection: EditorSelection | null;
  sideTab: SideTab;
  thinking: boolean;
  mobilePanel: boolean;
  importing: boolean;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onTabChange: (tab: SideTab) => void;
  onSend: (text: string) => void;
  onUpdateMusic: (patch: Partial<EditorMusic>) => void;
  onUpdateVoiceVolume: (value: number) => void;
  onUpdateClip: (clipId: string, patch: Partial<EditorClip>) => void;
  onUpdateCaption: (captionId: string, patch: Partial<EditorCaption>) => void;
  onUpdateOverlay: (overlayId: string, patch: Partial<EditorOverlay>) => void;
  onApplyMusicPreset: (key: keyof typeof MUSIC_PRESETS) => void;
  onGenerateMusic: () => void;
  onSplit: () => void;
  onDelete: () => void;
  onToggleCaptions: () => void;
  onAddOverlay: () => void;
  onImportMedia: () => void;
};

export default function EditorMainStage({
  job,
  project,
  playhead,
  playing,
  selection,
  sideTab,
  thinking,
  mobilePanel,
  importing,
  onTogglePlay,
  onSeek,
  onPrev,
  onNext,
  onTabChange,
  onSend,
  onUpdateMusic,
  onUpdateVoiceVolume,
  onUpdateClip,
  onUpdateCaption,
  onUpdateOverlay,
  onApplyMusicPreset,
  onGenerateMusic,
  onSplit,
  onDelete,
  onToggleCaptions,
  onAddOverlay,
  onImportMedia,
}: Props) {
  return (
    <main className="flex min-h-0 min-w-0 flex-1">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[radial-gradient(900px_500px_at_50%_-10%,rgba(255,255,255,0.07),transparent_60%)]">
        <PreviewStage
          job={job}
          project={project}
          playhead={playhead}
          playing={playing}
          onTogglePlay={onTogglePlay}
          onSeek={onSeek}
          onPrev={onPrev}
          onNext={onNext}
        />
      </section>

      <div
        className={`${
          mobilePanel
            ? "fixed inset-y-14 right-0 z-40 flex max-w-[90vw] shadow-2xl shadow-black/60"
            : "hidden"
        } lg:relative lg:inset-auto lg:z-auto lg:flex lg:h-full lg:min-h-0 lg:max-w-none lg:shadow-none`}
      >
        <SidePanel
          job={job}
          project={project}
          selection={selection}
          tab={sideTab}
          setTab={onTabChange}
          thinking={thinking}
          onSend={onSend}
          onUpdateMusic={onUpdateMusic}
          onUpdateVoiceVolume={onUpdateVoiceVolume}
          onUpdateClip={onUpdateClip}
          onUpdateCaption={onUpdateCaption}
          onUpdateOverlay={onUpdateOverlay}
          onApplyMusicPreset={onApplyMusicPreset}
          onGenerateMusic={onGenerateMusic}
          onSplit={onSplit}
          onDelete={onDelete}
          onToggleCaptions={onToggleCaptions}
          onAddOverlay={onAddOverlay}
          onImportMedia={onImportMedia}
          importing={importing}
        />
      </div>
    </main>
  );
}
