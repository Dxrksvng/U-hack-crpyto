import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { CheckRecord } from "@/domain/types";
import { VERDICT_STYLE } from "@/lib/verdict";
import { Sheet } from "./ui/sheet";
import { Button } from "./ui/button";
import { BrandLogo } from "./BrandLogo";
import { DemoBadge } from "./States";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  rec: CheckRecord;
  onCancel: () => void;
  onContinue: () => void;
  onShowMore: () => void;
  /** Why the primary action cannot proceed yet (NO_KNOWN_RISK only). Shown under the buttons, never silent. */
  blockedReason?: string;
};

/**
 * Shown inside BridgeSecur BEFORE the wallet is invoked. Warn-only: Continue is never removed.
 * CRITICAL requires an explicit acknowledgement first.
 */
export function PreSendAlertSheet({ open, onOpenChange, rec, onCancel, onContinue, onShowMore, blockedReason }: Props) {
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion();
  const [ack, setAck] = useState(false);
  const other = i18n.getFixedT(i18n.language === "th" ? "en" : "th");
  useEffect(() => {
    if (open) setAck(false);
  }, [open]);
  const r = rec.result;
  const critical = r.verdict === "CRITICAL";
  const st = VERDICT_STYLE[r.verdict];
  const th = i18n.language === "th";
  const key = r.evidence[0];
  const title = critical ? t("alert.criticalTitle") : t("alert.warningTitle");
  const blocked = critical && !ack;

  if (r.verdict === "NO_KNOWN_RISK")
    return (
      <Sheet open={open} onOpenChange={onOpenChange} title={t("verdict.NO_KNOWN_RISK.title")} hideTitle closeLabel={t("alert2.close")} testId="presend-alert">
        <div className="flex flex-col items-center pt-3 text-center" data-verdict="NO_KNOWN_RISK">
          <motion.span initial={reduce ? false : { scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.22 }} className={cn("grid h-14 w-14 place-items-center rounded-full", st.soft, st.text)} aria-hidden>
            <st.icon size={30} />
          </motion.span>
          <BrandLogo size="md" className="mt-3" />
          <p className={cn("mt-4 font-display text-[18px] font-semibold", st.text)} aria-live="polite" data-testid="alert-title">
            {t("verdict.NO_KNOWN_RISK.title")}
          </p>
          <p className="mt-1.5 max-w-[330px] text-[13.5px] leading-snug text-fg">{t("nkr.popupBody")}</p>
          <p className="mt-1 max-w-[330px] text-xs text-fg-muted">{t("verdict.notSafe")}</p>
          <p className="mt-2 flex items-center gap-2 text-xs" data-testid="alert-mode">
            {rec.demo ? <DemoBadge /> : <span className="rounded border border-border px-1.5 py-px font-mono text-[10px] font-bold tracking-wider">{t("common.live")}</span>}
            {rec.demo && <span className="text-fg-muted">{t("nkr.simulated")}</span>}
          </p>
        </div>
        <Button size="lg" className="mt-4 h-auto min-h-14 w-full rounded-[12px] py-2" onClick={onContinue} autoFocus aria-disabled={Boolean(blockedReason)} data-testid="alert-continue">
          {t("nkr.review")}
        </Button>
        <Button variant="secondary" size="lg" className="mt-2.5 min-h-12 w-full rounded-[12px]" onClick={onShowMore} data-testid="alert-details">
          {t("nkr.details")}
        </Button>
        <Button variant="ghost" size="lg" className="mt-1 min-h-12 w-full rounded-[12px]" onClick={onCancel} data-testid="alert-cancel">
          {t("nkr.cancel")}
        </Button>
        {blockedReason && (
          <p className="mt-2 text-center text-xs text-fg-muted" data-testid="alert-blocked">
            {blockedReason}
          </p>
        )}
      </Sheet>
    );

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} hideTitle closeLabel={t("alert2.close")} testId="presend-alert">
      <div className="flex flex-col items-center pt-3 text-center">
        <span className={cn("grid h-14 w-14 place-items-center rounded-full", st.soft, st.text)} aria-hidden>
          <st.icon size={30} />
        </span>
        <BrandLogo size="md" className="mt-3" />
        <p className={cn("mt-4 font-display text-[15px] font-semibold uppercase tracking-wide", st.text)} aria-live="assertive" data-testid="alert-title">
          {title}
        </p>
        <p className="mt-1 max-w-[330px] font-display text-[13.5px] leading-snug text-fg">
          {th ? r.summary_th : r.summary_en}
          {key && (
            <>
              {" "}
              <strong className="font-semibold">
                {th ? key.fact_th : key.fact_en} ({key.source})
              </strong>
            </>
          )}
        </p>
        {rec.demo && <DemoBadge className="mt-2" />}
        <button type="button" onClick={onShowMore} className="mt-3 min-h-11 font-display text-[13px] underline underline-offset-4">
          {t("alert.showMore")}
        </button>
      </div>
      {critical && (
        <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm">
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="h-5 w-5 shrink-0 accent-[var(--critical)]" data-testid="ack-checkbox" />
          {t("alert.understand")}
        </label>
      )}
      <Button size="lg" className={cn("mt-4 h-auto min-h-14 w-full flex-col gap-0 rounded-[12px] py-2", critical ? "bg-critical text-white hover:bg-critical-ink" : "")} onClick={onCancel} autoFocus data-testid="alert-cancel">
        <span>{t("alert.cancel")}</span>
        <span className="text-[12px] font-normal text-white">{t("alert.cancelSub")}</span>
      </Button>
      <Button
        variant="secondary"
        size="lg"
        className={cn("mt-2.5 h-auto min-h-14 w-full flex-col gap-0 rounded-[12px] py-2 font-medium", blocked && "opacity-55")}
        aria-disabled={blocked}
        data-testid="alert-continue"
        onClick={() => {
          if (blocked) return;
          onContinue();
        }}
      >
        <span>{critical ? t("alert.continueRisk") : t("alert.continue")}</span>
        <span className="text-[12px] font-normal text-fg-muted">{other(critical ? "alert.continueRisk" : "alert.continue")}</span>
      </Button>
      <p className="mt-3 text-center text-xs text-fg-muted">{t("alert.beforeWallet")}</p>
    </Sheet>
  );
}
