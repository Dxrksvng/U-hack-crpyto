import { useId } from "react";
import { CircleAlert } from "lucide-react";
import { formatEther } from "viem";
import { useTranslation } from "react-i18next";
import type { AmountError } from "@/lib/amount";
import { cn } from "@/lib/utils";

type Props = { value: string; onChange: (v: string) => void; symbol: string; balance?: bigint; fee?: bigint; error: AmountError | null };

export function AmountInput({ value, onChange, symbol, balance, fee, error }: Props) {
  const { t } = useTranslation();
  const id = useId();
  const show = value !== "" && error;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium">
          {t("send.amount")}
        </label>
        {balance != null && (
          <span className="text-xs text-fg-muted">
            {t("send.balance")}: <span className="font-mono text-fg">{Number(formatEther(balance)).toFixed(4)} {symbol}</span>
          </span>
        )}
      </div>
      <div className={cn("flex h-12 items-center rounded-[12px] border bg-surface pr-2 focus-within:outline-2 focus-within:outline-primary", show ? "border-critical" : "border-border")}>
        <input
          id={id}
          data-testid="amount-input"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(",", ".").replace(/[^0-9.]/g, ""))}
          placeholder="0.0"
          aria-invalid={Boolean(show)}
          aria-describedby={`${id}-err`}
          className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono outline-none"
        />
        {balance != null && fee != null && balance > fee && (
          <button type="button" onClick={() => onChange(formatEther(balance - fee))} className="mr-1 h-9 rounded-lg px-2 text-xs font-medium text-primary-ink hover:bg-muted">
            {t("send.max")}
          </button>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-sm font-medium">
          <span className="h-4 w-4 rounded-full bg-[conic-gradient(#627EEA,#8FA4F0,#627EEA)]" aria-hidden />
          {symbol}
        </span>
      </div>
      <p id={`${id}-err`} className="mt-1 min-h-5 text-xs">
        {show && (
          <span className="flex items-center gap-1 text-critical-ink">
            <CircleAlert size={13} /> {t(`send.${error}`)}
          </span>
        )}
      </p>
    </div>
  );
}
