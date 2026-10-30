import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  error: string | null;
  jobId: string;
};

export default function EditorError({ error, jobId }: Props) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950 px-6">
      <div className="max-w-sm text-center">
        <p className="text-sm font-medium text-brand-400">{error ?? "Editor tidak tersedia"}</p>
        <Link
          href={`/jobs/${jobId}`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-3.5" /> Kembali ke job
        </Link>
      </div>
    </div>
  );
}
