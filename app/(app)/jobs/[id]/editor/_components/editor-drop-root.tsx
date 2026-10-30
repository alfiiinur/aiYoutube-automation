import type { ReactNode } from "react";

type Props = {
  onFiles: (files: FileList) => void;
  onDragActiveChange: (active: boolean) => void;
  children: ReactNode;
};

export default function EditorDropRoot({ onFiles, onDragActiveChange, children }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#08090d] text-white"      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          onDragActiveChange(true);
        }
      }}
      onDragLeave={(e) => {
        const next = e.relatedTarget as Node | null;
        if (!next || !e.currentTarget.contains(next)) onDragActiveChange(false);
      }}
      onDrop={(e) => {
        if (e.dataTransfer.files.length > 0) {
          e.preventDefault();
          onDragActiveChange(false);
          onFiles(e.dataTransfer.files);
        }
      }}
    >
      {children}
    </div>
  );
}
