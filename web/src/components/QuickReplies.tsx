import { useTranslation } from "react-i18next";

export type QuickKey = "why" | "explain" | "continue" | "verify" | "poisoning" | "report" | "whyNone" | "sources" | "limits" | "checkMore" | "wrongSend";

export function QuickReplies({ keys, onPick, disabled, variant = "chip" }: { keys: QuickKey[]; onPick: (k: QuickKey) => void; disabled?: boolean; variant?: "chip" | "pill" }) {
  const { t } = useTranslation();
  return (
    <div className={variant === "pill" ? "flex flex-col items-center gap-2" : "flex flex-wrap gap-2"} data-testid="quick-replies">
      {keys.map((k) => (
        <button key={k} type="button" disabled={disabled} onClick={() => onPick(k)} className={variant === "pill" ? "min-h-10 rounded-full border border-primary/50 bg-surface px-4 text-[13px] text-primary-ink transition-colors hover:bg-primary/5 disabled:opacity-50" : "min-h-11 rounded-[10px] border border-border bg-surface px-3 text-[13px] text-fg shadow-sm transition-colors hover:bg-muted disabled:opacity-50"}>
          {t(`consult.quick.${k}`)}
        </button>
      ))}
    </div>
  );
}
