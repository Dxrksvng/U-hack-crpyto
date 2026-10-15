import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { formatEther } from "viem";
import { useTranslation } from "react-i18next";
import type { CheckRecord } from "@/domain/types";
import type { ChainInfo } from "@/lib/chains";
import { VERDICT_STYLE } from "@/lib/verdict";
import { Address } from "./Address";
import { Identicon } from "./Identicon";
import { ChainDot } from "./ChainSelector";
import { DemoBadge } from "./States";
import { cn } from "@/lib/utils";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border py-2 last:border-0">
      <dt className="text-sm text-fg-muted">{label}</dt>
      <dd className="min-w-0 text-right text-sm">{children}</dd>
    </div>
  );
}

type Props = { from?: `0x${string}`; to: `0x${string}`; chain: ChainInfo; amount: string; amountWei: bigint; fee?: bigint; feeLoading: boolean; rec: CheckRecord };

export function TransactionPreview({ from, to, chain, amount, amountWei, fee, feeLoading, rec }: Props) {
  const { t } = useTranslation();
  const st = VERDICT_STYLE[rec.result.verdict];
  const fmt = (v: bigint) => `${Number(formatEther(v)).toFixed(6)} ${chain.symbol}`;
  return (
    <dl className="rounded-2xl border border-border bg-surface px-4" data-testid="tx-preview">
      <div className="border-b border-border py-3">
        <dt className="text-xs text-fg-muted">{t("preview.from")}</dt>
        <dd className="mt-1.5 flex items-center gap-3">
          {from ? (
            <>
              <Identicon address={from} className="h-9 w-9" />
              <span>
                <Address value={from} />
                <span className="block text-xs text-fg-muted">{t("preview2.myWallet")}</span>
              </span>
            </>
          ) : (
            <span className="text-sm text-fg-muted">{t("send.notConnected")}</span>
          )}
        </dd>
      </div>
      <div className="border-b border-border py-3">
        <dt className="text-xs text-fg-muted">{t("preview.to")}</dt>
        <dd className="mt-1.5 flex items-center gap-3">
          <Identicon address={to} className="h-9 w-9" />
          <span className="min-w-0 break-all font-mono text-[13px]" data-testid="preview-to">{to}</span>
        </dd>
      </div>
      <Row label={t("preview.network")}>
        <span className="inline-flex items-center gap-2">
          <ChainDot color={chain.color} /> {chain.name}
        </span>
      </Row>
      <Row label={t("preview.amount")}>
        <span className="font-mono">
          {amount} {chain.symbol}
        </span>
      </Row>
      <Row label={t("preview.fee")}>
        <span className="font-mono">{fee != null ? fmt(fee) : feeLoading ? "…" : "—"}</span>
      </Row>
      <Row label={t("preview.total")}>
        <span className="font-mono font-medium">{fee != null ? fmt(amountWei + fee) : "—"}</span>
      </Row>
      <Row label={t("preview.verdict")}>
        <span className="inline-flex flex-wrap items-center justify-end gap-2">
          <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", st.soft, st.text)} data-testid="preview-verdict">
            <st.icon size={13} aria-hidden /> {t(`verdict.${rec.result.verdict}.label`)}
          </span>
          {rec.demo && <DemoBadge />}
          <Link to={`/analysis/${rec.id}/details`} className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-primary-ink">
            {t("preview.evidence")} <ArrowRight size={12} />
          </Link>
        </span>
      </Row>
    </dl>
  );
}
