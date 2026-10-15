import { motion, useReducedMotion } from "framer-motion";
import { Check, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { formatEther } from "viem";
import { useTranslation } from "react-i18next";
import type { SendRecord } from "@/domain/types";
import { getChain } from "@/lib/chains";
import { Address } from "./Address";
import { ChainDot } from "./ChainSelector";
import { Button } from "./ui/button";
import { DemoBadge } from "./States";

/** Rendered only for a record whose on-chain receipt reported success. Never from approval or a bare hash. */
export function TransactionSuccess({ tx }: { tx: SendRecord }) {
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion();
  const chain = getChain(tx.chainId);
  const link = tx.hash ? `${chain.explorer}/tx/${tx.hash}` : undefined;
  const row = "flex min-h-12 items-center justify-between gap-3 border-b border-border py-2 last:border-0";
  return (
    <div className="space-y-4" data-testid="tx-success">
      <div className="flex flex-col items-center pt-2 text-center">
        <motion.span initial={reduce ? false : { scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} className="grid h-20 w-20 place-items-center rounded-full bg-norisk text-white" aria-hidden>
          <Check size={44} strokeWidth={3} />
        </motion.span>
        <h2 className="mt-4 font-display text-[22px] font-semibold" data-testid="success-title">
          {t("success.title")}
        </h2>
        <p className="text-sm text-fg-muted">{t("success.sub")}</p>
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer" data-testid="tx-explorer" className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary-ink underline underline-offset-4">
            {t("success.explorer")} <ExternalLink size={14} />
          </a>
        )}
      </div>
      <dl className="rounded-2xl border border-border bg-surface px-4">
        <div className={row}>
          <dt className="text-sm text-fg-muted">{t("success.hash")}</dt>
          <dd>{tx.hash && <Address value={tx.hash} />}</dd>
        </div>
        <div className={row}>
          <dt className="text-sm text-fg-muted">{t("success.from")}</dt>
          <dd><Address value={tx.from} /></dd>
        </div>
        <div className={row}>
          <dt className="text-sm text-fg-muted">{t("success.to")}</dt>
          <dd><Address value={tx.to} /></dd>
        </div>
        <div className={row}>
          <dt className="text-sm text-fg-muted">{t("success.network")}</dt>
          <dd className="inline-flex items-center gap-2 text-sm"><ChainDot color={chain.color} /> {chain.name}</dd>
        </div>
        <div className={row}>
          <dt className="text-sm text-fg-muted">{t("success.amount")}</dt>
          <dd className="font-mono text-sm">{tx.amount} {chain.symbol}</dd>
        </div>
        <div className={row}>
          <dt className="text-sm text-fg-muted">{t("success.fee")}</dt>
          <dd className="font-mono text-sm" data-testid="success-fee">{tx.feeWei != null ? `${formatEther(tx.feeWei)} ${chain.symbol}` : "—"}</dd>
        </div>
        <div className={row}>
          <dt className="text-sm text-fg-muted">{t("success.time")}</dt>
          <dd className="text-sm">{tx.confirmedAt ? new Date(tx.confirmedAt).toLocaleString(i18n.language, { dateStyle: "medium", timeStyle: "medium" }) : "—"}</dd>
        </div>
        <div className={row}>
          <dt className="text-sm text-fg-muted">{t("success.status")}</dt>
          <dd className="inline-flex items-center gap-2">
            <span className="rounded-full bg-norisk-soft px-2.5 py-0.5 text-xs font-medium text-norisk">{t("success.confirmed")}</span>
          </dd>
        </div>
      </dl>
      {tx.verdict && <p className="text-center text-xs text-fg-muted">{t(`verdict.${tx.verdict}.label`)} {tx.checkId ? <DemoBadge className="ml-1" /> : null}</p>}
      <div className="grid gap-2">
        <Button asChild size="lg" data-testid="success-history">
          <Link to="/history">{t("success.history")}</Link>
        </Button>
        <Button asChild variant="outline" size="lg" data-testid="success-home">
          <Link to="/">{t("success.home")}</Link>
        </Button>
      </div>
    </div>
  );
}
