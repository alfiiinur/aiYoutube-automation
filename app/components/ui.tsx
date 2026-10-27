import type { JobStatus } from "@/app/types";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`card ${className}`}>{children}</div>;
}

const STATUS_STYLES: Record<JobStatus, { label: string; cls: string; dot: string }> = {
  queued: { label: "Antre", cls: "bg-white/8 text-white/60", dot: "bg-white/40" },
  analyzing: { label: "Analisis", cls: "bg-sky-500/15 text-sky-300", dot: "bg-sky-400" },
  scripting: { label: "Scripting", cls: "bg-accent-500/15 text-accent-400", dot: "bg-accent-400" },
  rendering: { label: "Rendering", cls: "bg-amber-500/15 text-amber-300", dot: "bg-amber-400" },
  ready: { label: "Siap", cls: "bg-lime-500/15 text-lime-300", dot: "bg-lime-400" },
  failed: { label: "Gagal", cls: "bg-brand-500/15 text-brand-400", dot: "bg-brand-400" },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.queued;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${s.cls}`}>
      <span className={`size-1.5 rounded-full ${s.dot} ${status !== "ready" && status !== "failed" ? "pulse-dot" : ""}`} />
      {s.label}
    </span>
  );
}

export function ProgressBar({ value, tone = "brand" }: { value: number; tone?: "brand" | "lime" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
      <div
        className={`h-full rounded-full transition-all duration-700 ${
          tone === "lime" ? "bg-lime-400" : "bg-gradient-to-r from-brand-500 to-accent-500"
        }`}
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-white/45">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
      <p className="text-sm font-medium text-white/70">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs leading-relaxed text-white/35">{hint}</p>}
    </div>
  );
}