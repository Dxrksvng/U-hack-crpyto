import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CHAINS, getChain } from "@/lib/chains";
import { Select } from "./ui/select";
import { Tooltip } from "./ui/tooltip";

export function ChainDot({ color }: { color: string }) {
  return <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} aria-hidden />;
}

export function ChainSelector({ value, onChange, className }: { value: number; onChange: (id: number) => void; className?: string }) {
  const { t } = useTranslation();
  const c = getChain(value);
  return (
    <div className="flex items-center gap-1">
      <Select
        className={className}
        ariaLabel={t("chain.label")}
        value={String(value)}
        onValueChange={(v) => onChange(Number(v))}
        groups={{ live: t("chain.liveSend"), check: t("chain.checkOnly") }}
        items={CHAINS.map((ch) => ({
          value: String(ch.id),
          group: ch.live ? "live" : "check",
          label: (
            <span className="flex items-center gap-2">
              <ChainDot color={ch.color} />
              {ch.name}
            </span>
          ),
        }))}
        renderValue={
          <span className="flex items-center gap-2" data-testid="chain-value">
            <ChainDot color={c.color} />
            {c.short}
          </span>
        }
      />
      {!c.live && (
        <Tooltip content={t("chain.checkOnlyTip")}>
          <button type="button" aria-label={t("chain.checkOnlyTip")} className="grid h-11 w-11 place-items-center rounded-full text-fg-muted hover:bg-muted">
            <Info size={16} />
          </button>
        </Tooltip>
      )}
    </div>
  );
}
