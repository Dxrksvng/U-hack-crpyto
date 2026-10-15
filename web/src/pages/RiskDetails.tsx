import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useSession } from "@/state/session";
import { isRisky } from "@/domain/types";
import { VERDICT_STYLE } from "@/lib/verdict";
import { getChain } from "@/lib/chains";
import { DUR } from "@/lib/motion";
import { RiskGauge } from "@/components/RiskGauge";
import { RiskFactorRow, SourceList, TierStatusStrip } from "@/components/Evidence";
import { Button } from "@/components/ui/button";
import { AuditFooter } from "@/components/VerdictCard";
import { Address } from "@/components/Address";
import { DemoBadge } from "@/components/States";
import { TopBar } from "@/components/Bars";
import { CheckNotFound } from "./Analysis";
import { cn } from "@/lib/utils";

/** Screen 08: Risk Analysis. */
export default function RiskDetails() {
  const { t, i18n } = useTranslation();
  const { checkId = "" } = useParams();
  const nav = useNavigate();
  const rec = useSession().getCheck(checkId);
  if (!rec)
    return (
      <>
        <TopBar title={t("details2.title")} />
        <CheckNotFound />
      </>
    );
  const r = rec.result;
  const st = VERDICT_STYLE[r.verdict];
  const th = i18n.language === "th";
  return (
    <>
      <TopBar title={t("details2.title")} right={rec.demo ? <DemoBadge /> : <span className="mr-1 rounded border border-border px-1.5 py-px font-mono text-[10px] font-bold">{t("common.live")}</span>} />
      <div className="mx-auto w-full max-w-[480px] space-y-4 px-4 py-4">
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR.standard }} className="flex items-center gap-4 rounded-[18px] border border-border bg-surface p-4" aria-live="polite" data-testid="details-gauge">
          <RiskGauge score={r.score} verdict={r.verdict} />
          <div className="min-w-0 text-[13px]">
            <p className="text-fg-muted">{t("consult.considered")}</p>
            <p className={cn("mt-1 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", st.soft, st.text)} data-verdict={r.verdict}>
              <st.icon size={12} aria-hidden /> {t(`verdict.${r.verdict}.label`)}
            </p>
            <p className="mt-1.5 text-fg-muted">{isRisky(r.verdict) ? t("consult.proceedNote") : r.verdict === "NO_KNOWN_RISK" ? t("nkr.support") : th ? r.summary_th : r.summary_en}</p>
          </div>
        </motion.section>
        <p className="px-1 text-xs text-fg-muted">
          <Address value={rec.destination} className="text-xs" /> · {getChain(rec.chainId).name}
        </p>
        <section className="rounded-[18px] border border-border bg-surface px-4 pt-3">
          <h2 className="font-display text-[15px] font-semibold">{r.sources?.length && !r.evidence.length ? t("nkr.sourcesTitle") : t("analysis.factors")}</h2>
          {r.sources?.length ? <SourceList sources={r.sources} demo={rec.demo} /> : null}
          {r.sources?.length && !r.evidence.length ? null : r.evidence.length ? (
            <ul className="divide-y divide-border">
              {r.evidence.map((e, i) => (
                <RiskFactorRow key={e.id} e={e} index={i} />
              ))}
            </ul>
          ) : (
            <p className="py-4 text-sm text-fg-muted">{t("consult.noFindings")}</p>
          )}
          {rec.demo && r.verdict === "NO_KNOWN_RISK" && <p className="pb-3 text-xs text-fg-muted" data-testid="demo-sources-note">{t("nkr.simulated")}</p>}
        </section>
        <section className="rounded-[18px] border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-medium">{t("consult.checksRun")}</h2>
          <TierStatusStrip tiers={r.tiers} />
        </section>
        <section className="rounded-[18px] border border-border bg-surface p-4">
          <h2 className="mb-1 text-sm font-medium">{r.verdict === "NO_KNOWN_RISK" ? t("nkr.recoTitle") : t("consult.recommendation")}</h2>
          <p className="text-sm">{th ? r.recommendation_th : r.recommendation_en}</p>
          {r.verdict === "NO_KNOWN_RISK" && (
            <div className="mt-3 grid gap-2">
              <Button onClick={() => nav("/review")} data-testid="details-review">{t("nkr.review")}</Button>
              <Button variant="outline" asChild data-testid="details-consult"><Link to="/consult">{t("nkr.askConsult")}</Link></Button>
              <Button variant="ghost" asChild data-testid="details-back"><Link to="/send">{t("nkr.back")}</Link></Button>
            </div>
          )}
        </section>
        <div className="overflow-hidden rounded-[18px] border border-border">
          <AuditFooter rec={rec} />
        </div>
      </div>
    </>
  );
}
