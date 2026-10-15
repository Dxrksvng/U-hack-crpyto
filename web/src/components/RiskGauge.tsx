import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { Verdict } from "@/domain/types";
import { VERDICT_STYLE } from "@/lib/verdict";
import { DUR } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Semicircle gauge colored by VERDICT, not by score. UNKNOWN renders greyed with no number. */
export function RiskGauge({ score, verdict, size = "sm" }: { score: number | null; verdict: Verdict; size?: "sm" | "lg" }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const noData = verdict === "UNKNOWN" || score == null;
  const len = Math.PI * 80;
  const frac = noData ? 0 : Math.max(0, Math.min(100, score ?? 0)) / 100;
  return (
    <div className="flex flex-col items-center" data-testid="risk-gauge">
      <svg viewBox="0 0 200 116" className={cn("shrink-0", size === "lg" ? "w-56" : "w-32")} role="img" aria-label={`${t("consult.score")}: ${noData ? (verdict === "UNKNOWN" ? t("consult.scoreNoData") : t("consult.scoreNone")) : `${score}/100`}`}>
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="var(--muted)" strokeWidth={14} strokeLinecap="round" strokeDasharray={noData ? "4 8" : undefined} />
        <motion.path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke={VERDICT_STYLE[verdict].stroke}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={len}
          initial={{ strokeDashoffset: len }}
          animate={{ strokeDashoffset: len * (1 - frac) }}
          transition={{ duration: reduce ? 0 : DUR.gauge, ease: "easeOut" }}
        />
        <text x="100" y="88" textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize={noData ? 18 : 36} fontWeight={600} fill={noData ? "var(--unknown)" : VERDICT_STYLE[verdict].stroke}>
          {noData ? "—" : score}
        </text>
        <text x="100" y="110" textAnchor="middle" fontSize={11} fill="var(--fg-muted)">
          /100
        </text>
      </svg>
      <p className="mt-0.5 max-w-[11rem] text-center text-[10.5px] leading-tight text-fg-muted">{verdict === "UNKNOWN" ? t("consult.scoreNoData") : score == null ? t("consult.scoreNone") : t("consult.scoreNote")}</p>
    </div>
  );
}
