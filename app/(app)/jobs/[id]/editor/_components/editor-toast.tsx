import { showToastStyle, type Toast } from "../_lib/editor-page-utils";

export default function EditorToast({ toast }: { toast: Toast | null }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed bottom-5 left-1/2 z-[80] -translate-x-1/2 rounded-xl border px-4 py-2 text-[11px] shadow-2xl backdrop-blur ${showToastStyle(
        toast.tone,
      )}`}
    >
      {toast.text}
    </div>
  );
}
