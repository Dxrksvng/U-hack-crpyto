import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BarChart3, Lightbulb, Search, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CheckRecord } from "@/domain/types";
import { isRisky } from "@/domain/types";
import { VERDICT_STYLE } from "@/lib/verdict";
import { DUR } from "@/lib/motion";
import { EvidenceList, SourceList, TierStatusStrip } from "./Evidence";
import { RiskGauge } from "./RiskGauge";
import { WhyVerdictDialog } from "./Dialogs";
import { DemoBadge } from "./States";
import { cn } from "@/lib/utils";

function Section({ icon: Icon, iconClass, title, children }: { icon: LucideIcon; iconClass: string; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border px-4 py-4 first:border-t-0">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Icon size={16} className={iconClass} /> {title}
      </h3>
      {children}
    </section>
  );
}

export function VerdictBanner({ rec, className }: { rec: CheckRecord; className?: string }) {
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion();
  const r = rec.result;
  const st = VERDICT_STYLE[r.verdict];
  const th = i18n.language === "th";
  return (
    <motion.header
      key={rec.id}
      data-testid="verdict-banner"
      data-verdict={r.verdict}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      animate={
        r.verdict === "CRITICAL" && !reduce
          ? { opacity: 1, scale: 1, boxShadow: ["0 0 0 0 rgba(217,59,59,0)", "0 0 0 5px rgba(217,59,59,0.22)", "0 0 0 0 rgba(217,59,59,0)"] }
          : { opacity: 1, scale: 1 }
      }
      transition={{ duration: DUR.standard, boxShadow: { duration: 1.4, delay: 0.3 } }}
      className={cn("rounded-xl border px-4 py-3", st.soft, r.verdict === "UNKNOWN" ? "border-dashed border-unknown" : r.verdict === "CRITICAL" ? "border-critical/30" : "border-transparent", className)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn("flex items-center gap-2 text-[17px] font-medium", st.text)}>
          <st.icon size={20} aria-hidden />
          {t(`verdict.${r.verdict}.title`)}
        </p>
        {rec.demo && <DemoBadge />}
      </div>
      <p className="mt-1 pl-7 text-[13px] text-fg">{r.verdict === "NO_KNOWN_RISK" ? t("nkr.support") : th ? r.summary_th : r.summary_en}</p>
      {isRisky(r.verdict) && <p className="mt-1 pl-7 text-[13px] text-fg">{t("verdict.notRecommend")}</p>}
    </motion.header>
  );
}

export function AuditFooter({ rec }: { rec: CheckRecord }) {
  const { t, i18n } = useTranslation();
  const [why, setWhy] = useState(false);
  const r = rec.result;
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/50 px-4 py-2.5 font-mono text-[10.5px] text-fg-muted" data-testid="audit-footer">
      <span>
        {t("meta.policy")} v{r.policy_version} · {t("meta.rules")} v{r.rules_version} · {t("meta.model")} v{r.model_version} · {t("meta.checked")}{" "}
        {new Date(r.checked_at).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })} · {(r.latency_ms / 1000).toFixed(1)}s
      </span>
      <button type="button" onClick={() => setWhy(true)} className="min-h-11 font-sans text-xs font-medium text-primary-ink underline underline-offset-2">
        {t("consult.why")}
      </button>
      <WhyVerdictDialog open={why} onOpenChange={setWhy} />
    </footer>
  );
}

/** Chat-bubble verdict card: soft verdict panel, then findings, score and recommendation. */
export function VerdictCard({ rec }: { rec: CheckRecord }) {
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion();
  const r = rec.result;
  const st = VERDICT_STYLE[r.verdict];
  const th = i18n.language === "th";
  const rec_ = th ? r.recommendation_th : r.recommendation_en;
  return (
    <div aria-live="polite" className="space-y-2" data-testid="verdict-card">
      <VerdictBanner rec={rec} />
      <motion.article
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR.standard, delay: 0.08 }}
        className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_4px_20px_-10px_rgba(15,23,41,0.2)]"
      >
        <Section icon={Search} iconClass="text-primary-ink" title={r.sources?.length && !r.evidence.length ? t("nkr.sourcesTitle") : t("consult.found")}>
          {r.sources?.length ? <SourceList sources={r.sources} demo={rec.demo} /> : null}
          {r.sources?.length && !r.evidence.length ? null : <EvidenceList evidence={r.evidence} />}
        </Section>
        <Section icon={BarChart3} iconClass="text-[#3FB6D9]" title={t("consult.score")}>
          <div className="flex items-center gap-3">
            <RiskGauge score={r.score} verdict={r.verdict} />
            <div className="min-w-0 text-[12px]">
              <p className="text-fg-muted">{t("consult.considered")}</p>
              <p className={cn("mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide", st.soft, st.text)}>
                <st.icon size={12} aria-hidden /> {t(`verdict.${r.verdict}.label`)}
              </p>
              {isRisky(r.verdict) && <p className="mt-1 text-fg-muted">{t("consult.proceedNote")}</p>}
            </div>
          </div>
          <p className="mb-2 mt-3 text-[11px] font-medium text-fg-muted">{t("consult.checksRun")}</p>
          <TierStatusStrip tiers={r.tiers} />
        </Section>
        <Section icon={Lightbulb} iconClass="text-warning" title={t("consult.recommendation")}>
          <p className="text-[13px]">{rec_}</p>
        </Section>
        <AuditFooter rec={rec} />
      </motion.article>
    </div>
  );
}
