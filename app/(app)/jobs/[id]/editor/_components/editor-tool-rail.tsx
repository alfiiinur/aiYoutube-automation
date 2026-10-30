import { Sparkles } from "lucide-react";
import type { SideTab } from "@/app/components/editor/SidePanel";
import type { EditorTool } from "@/app/types";
import { TOOL_ITEMS } from "../_lib/editor-page-utils";

type Props = {
  tool: EditorTool;
  onChooseTool: (tool: EditorTool) => void;
  sideTab: SideTab;
  onOpenAi: () => void;
};

export default function EditorToolRail({ tool, onChooseTool, sideTab, onOpenAi }: Props) {
  return (
    <aside className="hidden w-16 shrink-0 flex-col items-center gap-0.5 border-r border-white/8 bg-ink-900/60 py-2.5 sm:flex">
      {TOOL_ITEMS.map(({ id: toolId, label, icon: Icon }) => {
        const active = tool === toolId;
        return (
          <button
            key={toolId}
            onClick={() => onChooseTool(toolId)}
            className={`group flex w-[52px] flex-col items-center gap-1 rounded-xl border py-1.5 text-[9px] transition ${
              active
                ? "border-brand-500/30 bg-brand-500/10 text-brand-400"
                : "border-transparent text-white/40 hover:bg-white/5 hover:text-white/75"
            }`}
            title={label}
          >
            <Icon className={`size-4 ${active ? "text-brand-400" : "text-white/45 group-hover:text-white/75"}`} />
            {label}
          </button>
        );
      })}
      <div className="mt-auto">
        <button
          onClick={onOpenAi}
          className={`flex w-[52px] flex-col items-center gap-1 rounded-xl border py-1.5 text-[9px] transition ${
            sideTab === "chat"
              ? "border-accent-500/30 bg-accent-500/10 text-accent-400"
              : "border-transparent text-white/40 hover:bg-white/5 hover:text-white/75"
          }`}
          title="Chat AI"
        >
          <Sparkles className="size-4 text-accent-400" />
          AI
        </button>
      </div>
    </aside>
  );
}
