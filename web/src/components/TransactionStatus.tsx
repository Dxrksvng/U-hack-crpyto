import { AlertTriangle, Check, Circle, CircleHelp, ExternalLink, Loader2, RotateCcw, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SendRecord } from "@/domain/types";
import { getChain } from "@/lib/chains";
import { TX_STEPS, canRetry, type TxStep } from "@/lib/txMachine";
import { cn } from "@/lib/utils";
import { Address } from "./Address";
import { Button } from "./ui/button";

type StepState = "done" | "active" | "failed" | "unknown" | "todo";

/** Where the lifecycle stands. A step is "done" only once the machine moved past it. */
function stepStates(tx: SendRecord): Record<TxStep, StepState> {
  const at = (i: number, special: StepState): Record<TxStep, StepState> =>
    Object.fromEntries(TX_STEPS.map((s, k) => [s, k < i ? "done" : k === i ? special : "todo"])) as Record<TxStep, StepState>;
  switch (tx.status) {
    case "confirmed":
      return at(TX_STEPS.length, "done");
    case "failed":
    case "rejected":
      return at(TX_STEPS.indexOf(tx.failedStep ?? "preparing"), "failed");
    case "confirmation_unknown":
    case "replaced":
      return at(TX_STEPS.indexOf("pending_confirmation"), "unknown");
    default:
      return at(TX_STEPS.indexOf(tx.status as TxStep), "active");
  }
}

const ICON = { done: Check, active: Loader2, failed: X, unknown: CircleHelp, todo: Circle };

export function TransactionStatus({ tx, onRetry }: { tx: SendRecord; onRetry?: () => void }) {
  const { t } = useTranslation();
  const chain = getChain(tx.chainId);
  const states = stepStates(tx);
  const bad = tx.status === "failed" || tx.status === "rejected";
  const link = tx.hash ? `${chain.explorer}/tx/${tx.hash}` : undefined;
  return (
    <section aria-live="polite" data-testid="tx-status" data-status={tx.status} data-failed-step={tx.failedStep} className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="mb-3 font-display text-base font-semibold">{t("tx.title")}</h2>
      <ol className="space-y-1">
        {TX_STEPS.map((s) => {
          const st = states[s];
          const Icon = ICON[st];
          return (
            <li
              key={s}
              data-testid={`tx-step-${s}`}
              data-state={st}
              aria-current={st === "active" ? "step" : undefined}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-lg px-2 text-sm",
                st === "todo" && "text-fg-muted",
                st === "active" && "bg-primary/10 font-medium text-primary-ink",
                st === "failed" && "bg-critical-soft font-medium text-critical-ink",
                st === "unknown" && "bg-warning-soft font-medium text-warning-ink",
              )}
            >
              <Icon size={16} className={cn("shrink-0", st === "active" && "animate-spin")} aria-hidden />
              <span className="flex-1">{t(`txStep.${s}`)}</span>
              <span className="sr-only">{t(`txState.${st}`)}</span>
            </li>
          );
        })}
      </ol>

      {(bad || tx.status === "confirmation_unknown" || tx.status === "replaced") && (
        <div role="alert" data-testid="tx-error" className={cn("mt-3 rounded-xl p-3 text-sm", bad ? "bg-critical-soft text-critical-ink" : "bg-warning-soft text-warning-ink")}>
          <p className="flex items-start gap-2 font-medium">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
            {tx.status === "rejected" ? t("tx.rejected") : tx.status === "failed" ? t(`txErr.${tx.errorKind ?? "unknown"}`) : t(`tx.${tx.status}`)}
          </p>
          {tx.status === "confirmation_unknown" && <p className="mt-1 text-xs">{t("tx.unknownAdvice")}</p>}
          {tx.details && (
            <details className="mt-2 text-xs text-fg">
              <summary className="cursor-pointer select-none text-fg-muted">{t("tx.technical")}</summary>
              <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-surface p-2 font-mono text-[11px]" data-testid="tx-details">
                {tx.details}
              </pre>
            </details>
          )}
        </div>
      )}

      {onRetry && canRetry(tx.status, tx.hash) && (
        <Button variant="outline" className="mt-3 w-full" onClick={onRetry} data-testid="tx-retry">
          <RotateCcw size={16} /> {t("tx.retry")}
        </Button>
      )}

      {tx.hash && link && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
          <span className="min-w-0 text-fg-muted">
            {t("tx.hash")} <Address value={tx.hash} />
          </span>
          <a href={link} target="_blank" rel="noopener noreferrer" data-testid="tx-explorer" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary-ink">
            {t("tx.view")} <ExternalLink size={13} />
          </a>
        </div>
      )}
    </section>
  );
}
