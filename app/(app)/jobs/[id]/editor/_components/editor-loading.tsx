import { Loader2 } from "lucide-react";

export default function EditorLoading() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950">
      <div className="flex flex-col items-center gap-3 text-white/45">
        <Loader2 className="size-6 animate-spin text-brand-400" />
        <p className="text-xs">Membuka editor…</p>
      </div>
    </div>
  );
}
