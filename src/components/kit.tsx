import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { categoryLabel, type Category } from "@/lib/content/types";

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint, tone = "primary" }: { icon: LucideIcon; label: string; value: ReactNode; hint?: string; tone?: "primary" | "teal" | "amber" }) {
  const tones = { primary: "bg-primary-soft text-primary", teal: "bg-teal-soft text-teal", amber: "bg-amber-soft text-amber-ink" };
  return (
    <div className="surface flex items-start gap-3 p-4">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export function ProgressBar({ value, label, tone = "primary" }: { value: number; label: string; tone?: "primary" | "teal" | "amber" }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const fill = { primary: "bg-primary", teal: "bg-teal", amber: "bg-amber" }[tone];
  return (
    <div>
      <div className="mb-1.5 flex justify-between gap-3 text-sm">
        <span className="min-w-0 font-medium">{label}</span>
        <span className="shrink-0 font-semibold text-muted-foreground">{v}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full ${fill} transition-all`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, children }: { icon: LucideIcon; title: string; body: string; children?: ReactNode }) {
  return (
    <div className="surface flex flex-col items-center px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  const tone = { concepts: "bg-primary-soft text-primary", architecture: "bg-teal-soft text-teal", management: "bg-amber-soft text-amber-ink" }[category];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{categoryLabel(category)}</span>;
}

export function Callout({ tone = "amber", children }: { tone?: "amber" | "teal" | "primary"; children: ReactNode }) {
  const t = { amber: "bg-amber-soft text-amber-ink border-amber/40", teal: "bg-teal-soft text-teal border-teal/30", primary: "bg-primary-soft text-primary border-primary/20" }[tone];
  return <div className={`rounded-xl border p-4 text-sm ${t}`}>{children}</div>;
}
