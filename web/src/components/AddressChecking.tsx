import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Ban, Check, ChevronLeft, Circle, Clock, Info, Loader2, Wallet, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CheckRecord, TierStatus } from "@/domain/types";
import type { CheckError } from "@/lib/api";
import type { CheckStatus } from "@/state/session";
import { DUR } from "@/lib/motion";
import { truncate } from "@/lib/address";
import { cn } from "@/lib/utils";

export type StepStatus = "pending" | "running" | "completed" | "failed" | "timeout" | "not_checked" | "hit";
type StepKey = "format" | "intel" | "onchain" | "community" | "policy";
const SHOWN = ["format", "intel", "onchain", "community"] as const;

const RANK: Record<TierStatus["status"], number> = { ok: 0, hit: 1, not_checked: 2, timeout: 3 };
const fromTier = (s: TierStatus["status"]): StepStatus => (s === "ok" ? "completed" : s);

/**
 * Derives step states honestly. Without backend progress events, every remote step shows "running"
 * until the result arrives; then each maps from the returned tier statuses.
 */
export function deriveSteps(status: CheckStatus, rec: CheckRecord | null, error: CheckError | null): Record<StepKey, StepStatus> {
  if (status === "checking" || (!rec && !error)) return { format: "completed", intel: "running", onchain: "running", community: "running", policy: "running" };
  if (!rec) {
    const s: StepStatus = error?.kind === "timeout" ? "timeout" : "failed";
    return { format: "completed", intel: s, onchain: s, community: s, policy: "not_checked" };
  }
  const tier = (t: string) => rec.result.tiers.find((x) => x.tier === t)?.status ?? "not_checked";
  const worst = (...ts: TierStatus["status"][]) => ts.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), "ok" as TierStatus["status"]);
  const hasReports = rec.result.evidence.some((e) => e.reporter_count != null);
  return {
    format: "completed",
    intel: fromTier(tier("T1")),
    onchain: fromTier(worst(tier("T2"), tier("T3"), tier("T4"))),
    community: hasReports ? "hit" : fromTier(tier("T1")),
    policy: "completed",
  };
}

const ICON: Record<StepStatus, { icon: typeof Check; cls: string }> = {
  pending: { icon: Circle, cls: "text-fg-muted" },
  running: { icon: Loader2, cls: "animate-spin text-primary-ink" },
  completed: { icon: Check, cls: "text-white bg-ok rounded-full p-0.5" },
  failed: { icon: X, cls: "text-critical-ink" },
  timeout: { icon: Clock, cls: "text-warning-ink" },
  not_checked: { icon: Ban, cls: "text-unknown" },
  hit: { icon: AlertTriangle, cls: "text-critical-ink" },
};

export function AddressChecking({ destination, status, rec, error, onCancel }: { destination: string; status: CheckStatus; rec: CheckRecord | null; error: CheckError | null; onCancel: () => void }) {
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion();
  const steps = deriveSteps(status, rec, error);
  const running = status === "checking";
  const other = i18n.getFixedT(i18n.language === "th" ? "en" : "th");
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checking-title"
      data-testid="address-checking"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DUR.standard }}
      className="fixed inset-0 z-50 overflow-y-auto bg-surface"
    >
      <div className="mx-auto flex min-h-full max-w-[480px] flex-col px-5 pb-8 pt-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onCancel} aria-label={t("checking.cancel")} className="-ml-2 grid h-11 w-11 place-items-center rounded-full hover:bg-muted" autoFocus>
            <ChevronLeft size={22} />
          </button>
          <button type="button" onClick={onCancel} aria-label={t("checking2.close")} className="-mr-2 grid h-11 w-11 place-items-center rounded-full hover:bg-muted">
            <X size={20} />
          </button>
        </div>
        <h1 id="checking-title" className="mt-3 text-center font-display text-[22px] font-semibold">
          {t("checking2.title")}
        </h1>
        <p className="mt-0.5 text-center text-sm text-fg-muted">{t("checking2.subtitle")}</p>
        <p className="mt-1 text-center font-mono text-xs text-fg-muted">{truncate(destination, 6, 4)}</p>
        <div className="relative mx-auto mt-6 grid h-48 w-48 place-items-center" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute rounded-full border border-primary/20"
              style={{ inset: i * 24 }}
              animate={reduce || !running ? undefined : { scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
          {!reduce && running && (
            <motion.span data-testid="orbit" className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}>
              <span className="absolute left-[18%] top-[14%] h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="absolute bottom-[12%] right-[22%] h-2 w-2 rounded-full bg-primary/70" />
              <span className="absolute right-[6%] top-[40%] h-1.5 w-1.5 rounded-full bg-primary/50" />
            </motion.span>
          )}
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary-ink">
            <Wallet size={26} />
          </span>
        </div>
        <ol className="mt-8 space-y-4" aria-live="polite">
          {SHOWN.map((k) => {
            const s = steps[k];
            const I = ICON[s];
            return (
              <li key={k} className="flex items-start gap-3" data-testid={`step-${k}`} data-status={s}>
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center">
                  <I.icon size={s === "completed" ? 18 : 20} className={I.cls} aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px]">{t(`checking.steps.${k}`)}</span>
                  <span className="block text-xs text-fg-muted">{other(`checking.steps.${k}`)}</span>
                </span>
                <span className={cn("pt-0.5 text-xs", I.cls.includes("text-white") ? "text-fg-muted" : I.cls.replace("animate-spin", ""))}>{t(`checking.status.${s}`)}</span>
              </li>
            );
          })}
        </ol>
        <div className="mt-8 flex items-start gap-3 rounded-2xl bg-muted p-4 text-sm">
          <Info size={18} className="mt-0.5 shrink-0 text-fg-muted" aria-hidden />
          <span>
            <span className="block">{t("checking2.wait")}</span>
            <span className="block text-xs text-fg-muted">{t("checking2.waitSub")}</span>
            <span className="mt-1 block text-[11px] text-fg-muted">{t("checking.generic")}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
