import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";
import { cn } from "@/lib/utils";

export function EmptyState({ title, body, action, icon }: { title: string; body?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-muted text-fg-muted">{icon ?? <Inbox size={22} />}</span>
      <p className="font-display font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-xs text-sm text-fg-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-critical/40 bg-critical-soft p-4">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-critical-ink" />
      <div className="flex-1 text-sm">
        <p className="font-medium text-critical-ink">{message}</p>
        {onRetry && (
          <Button size="sm" variant="outline" className="mt-2" onClick={onRetry}>
            {t("common.retry")}
          </Button>
        )}
      </div>
    </div>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <Tooltip content={t("common.demoTip")}>
      <span tabIndex={0} className={cn("inline-flex items-center rounded border border-warning/50 bg-warning-soft px-1.5 py-px font-mono text-[10px] font-bold tracking-wider text-warning-ink", className)}>
        {t("common.demo")}
      </span>
    </Tooltip>
  );
}

export function PageTitle({ title, subtitle, back, right }: { title: string; subtitle?: string; back?: () => void; right?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="mb-4 flex items-center gap-1">
      {back && (
        <button type="button" onClick={back} aria-label={t("common.back")} className="-ml-2 grid h-11 w-11 place-items-center rounded-full hover:bg-muted">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-xl font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
