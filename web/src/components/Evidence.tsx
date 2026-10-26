import { motion } from "framer-motion";
import { Ban, Check, CircleDashed, Clock, ExternalLink, FileCode2, Fingerprint, Minus, Network, ShieldAlert, Users, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Evidence, SourceResult, SourceStatus, Tier, TierStatus } from "@/domain/types";
import { DUR } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SEV = { high: "bg-critical", medium: "bg-warning", low: "bg-unknown", info: "bg-unknown" } as const;
const TIER_ICON: Record<Tier, LucideIcon> = { T0: Fingerprint, T1: ShieldAlert, T2: Network, T3: Clock, T4: FileCode2 };

export function EvidenceItem({ e, variant = "compact", index = 0 }: { e: Evidence; variant?: "compact" | "card"; index?: number }) {
  const { t, i18n } = useTranslation();
  const th = i18n.language === "th";
  const Icon = e.reporter_count != null ? Users : TIER_ICON[e.tier];
  const meta = (
    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-fg-muted">
      <span className="rounded bg-muted px-1 font-mono font-medium text-fg" title={t(`tiers.${e.tier}`)}>
        {e.tier}
      </span>
      <span>{e.source}</span>
      <span aria-hidden>·</span>
      <span className="sr-only">severity</span>
      <span className="capitalize">{e.severity}</span>
      <span aria-hidden>·</span>
      <time className="font-mono" dateTime={e.observed_at}>
        {new Date(e.observed_at).toLocaleString(i18n.language, { dateStyle: "short", timeStyle: "short" })}
      </time>
      {e.url && (
        <a href={e.url} target="_blank" rel="noopener noreferrer" aria-label={`${e.source}: ${th ? e.fact_th : e.fact_en}`} data-testid="evidence-link" className="inline-grid h-7 w-7 place-items-center rounded text-primary-ink hover:bg-muted">
          <ExternalLink size={13} />
        </a>
      )}
    </div>
  );
  const body = (
    <>
      <p className="font-medium">{th ? e.fact_th : e.fact_en}</p>
      {(e.detail_en || e.detail_th) && <p className="text-fg-muted">{th ? e.detail_th : e.detail_en}</p>}
      {e.reporter_count != null && <p className="font-medium text-warning-ink">{t("consult.reporters", { count: e.reporter_count })}</p>}
      {meta}
    </>
  );
  if (variant === "card")
    return (
      <motion.li initial={{ y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR.standard, delay: index * 0.05 }} className="flex gap-3 rounded-2xl border border-border bg-surface p-4" data-testid="evidence-item">
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", e.severity === "high" ? "bg-critical-soft text-critical-ink" : e.severity === "medium" ? "bg-warning-soft text-warning-ink" : "bg-muted text-fg-muted")}>
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1 text-sm leading-snug">{body}</div>
      </motion.li>
    );
  return (
    <motion.li initial={{ y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR.standard, delay: index * 0.05 }} className="flex gap-2.5" data-testid="evidence-item">
      <span className={cn("mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full", SEV[e.severity])} aria-hidden />
      <div className="min-w-0 flex-1 text-[13px] leading-snug">{body}</div>
    </motion.li>
  );
}

const SEV_PILL = {
  critical: "bg-critical-soft text-critical-ink",
  high: "bg-critical-soft text-critical-ink",
  medium: "bg-warning-soft text-warning-ink",
  low: "bg-unknown-soft text-unknown",
  info: "bg-unknown-soft text-unknown",
} as const;
/** T1 threat-list hits are the only "critical" findings (policy). */
export const sevKey = (e: Evidence) => (e.tier === "T1" && e.severity === "high" ? "critical" : e.severity);

/** Storyboard 8 row: icon, title, description, severity pill on the right. */
export function RiskFactorRow({ e, index = 0 }: { e: Evidence; index?: number }) {
  const { t, i18n } = useTranslation();
  const th = i18n.language === "th";
  const Icon = e.reporter_count != null ? Users : TIER_ICON[e.tier];
  const k = sevKey(e);
  return (
    <motion.li initial={{ y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR.standard, delay: index * 0.05 }} className="flex gap-3 py-3.5" data-testid="evidence-item">
      <Icon size={18} className={cn("mt-0.5 shrink-0", k === "critical" || k === "high" ? "text-critical" : k === "medium" ? "text-warning" : "text-fg-muted")} aria-hidden />
      <div className="min-w-0 flex-1 text-[13px] leading-snug">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[14px] font-medium">{th ? e.fact_th : e.fact_en}</p>
          <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium", SEV_PILL[k])}>{t(`sev.${k}`)}</span>
        </div>
        {(e.detail_en || e.detail_th) && <p className="mt-0.5 text-fg-muted">{th ? e.detail_th : e.detail_en}</p>}
        {e.reporter_count != null && <p className="text-fg-muted">{t("consult.reporters", { count: e.reporter_count })}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[11px] text-fg-muted">
          <span className="rounded bg-muted px-1 font-mono font-medium text-fg">{e.tier}</span>
          <span>{e.source}</span>
          <span aria-hidden>·</span>
          <time className="font-mono" dateTime={e.observed_at}>{new Date(e.observed_at).toLocaleString(i18n.language, { dateStyle: "short", timeStyle: "short" })}</time>
          {e.url && (
            <a href={e.url} target="_blank" rel="noopener noreferrer" aria-label={`${e.source}: ${th ? e.fact_th : e.fact_en}`} data-testid="evidence-link" className="inline-grid h-7 w-7 place-items-center rounded text-primary-ink hover:bg-muted">
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </motion.li>
  );
}

export function EvidenceList({ evidence, variant = "compact" }: { evidence: Evidence[]; variant?: "compact" | "card" }) {
  const { t } = useTranslation();
  if (!evidence.length) return <p className="text-[13px] text-fg-muted">{t("consult.noFindings")}</p>;
  return (
    <ul className={variant === "card" ? "space-y-2.5" : "space-y-3"}>
      {evidence.map((e, i) => (
        <EvidenceItem key={e.id} e={e} variant={variant} index={i} />
      ))}
    </ul>
  );
}

const STATUS = {
  ok: { icon: CircleDashed, cls: "border-border text-fg-muted" },
  hit: { icon: ShieldAlert, cls: "border-critical/40 bg-critical-soft text-critical-ink" },
  not_checked: { icon: Ban, cls: "border-dashed border-unknown text-unknown" },
  timeout: { icon: Clock, cls: "border-dashed border-warning text-warning-ink" },
} as const;

/** One chip per tier. A source that failed reads "Not checked"/"Timeout", never a tick. */
export function TierStatusStrip({ tiers }: { tiers: TierStatus[] }) {
  const { t } = useTranslation();
  return (
    <ul className="flex flex-wrap gap-1.5" data-testid="tier-strip">
      {tiers.map((x) => {
        const s = STATUS[x.status];
        return (
          <li key={x.tier} className={cn("flex items-center gap-1 rounded-full border px-2 py-1 text-[11px]", s.cls)}>
            <s.icon size={12} aria-hidden />
            <span className="font-mono font-medium">{x.tier}</span>
            <span>{t(`tiers.${x.tier}`)}:</span>
            <span className="font-medium">{t(`tiers.status.${x.status}`)}</span>
          </li>
        );
      })}
    </ul>
  );
}

const SRC_STATUS: Record<SourceStatus, { icon: LucideIcon; cls: string }> = {
  NO_MATCH: { icon: Check, cls: "bg-norisk-soft text-norisk" },
  MATCH: { icon: ShieldAlert, cls: "bg-critical-soft text-critical-ink" },
  UNAVAILABLE: { icon: Clock, cls: "border border-dashed border-warning bg-warning-soft text-warning-ink" },
  NOT_CHECKED: { icon: Ban, cls: "border border-dashed border-unknown bg-unknown-soft text-unknown" },
  NOT_APPLICABLE: { icon: Minus, cls: "bg-muted text-fg-muted" },
};

/**
 * One row per checked source with its real status. "No match found" is shown only for NO_MATCH, which the
 * result may only contain for a source that actually ran. Never rendered from the verdict alone.
 */
export function SourceList({ sources, demo }: { sources: SourceResult[]; demo: boolean }) {
  const { t, i18n } = useTranslation();
  const th = i18n.language === "th";
  return (
    <ul className="divide-y divide-border" data-testid="source-list" data-mode={demo ? "DEMO" : "LIVE"}>
      {sources.map((s) => {
        const st = SRC_STATUS[s.status];
        return (
          <li key={s.id} className="flex items-start gap-3 py-3" data-testid="source-row" data-status={s.status}>
            <span className="min-w-0 flex-1 text-[13px] leading-snug">
              <span className="block text-[14px] font-medium">{s.source}</span>
              <span className="block text-fg-muted">{th ? s.description_th : s.description_en}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-fg-muted">
                <span className="font-mono">{demo ? "DEMO" : "LIVE"}</span>
                {s.checked_at && (
                  <>
                    <span aria-hidden>·</span>
                    <time className="font-mono" dateTime={s.checked_at}>
                      {t("nkr.checkedAt")} {new Date(s.checked_at).toLocaleString(i18n.language, { dateStyle: "short", timeStyle: "short" })}
                    </time>
                  </>
                )}
                {s.url && (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`${s.source}: ${t("tx.view")}`} data-testid="source-link" className="inline-grid h-7 w-7 place-items-center rounded text-primary-ink hover:bg-muted">
                    <ExternalLink size={13} />
                  </a>
                )}
              </span>
            </span>
            <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium", st.cls)}>
              <st.icon size={12} aria-hidden /> {t(`nkr.status.${s.status}`)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
