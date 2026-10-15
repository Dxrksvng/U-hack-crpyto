import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { truncate } from "@/lib/address";
import { Tooltip } from "./ui/tooltip";
import { cn } from "@/lib/utils";

export function Address({ value, className }: { value: string; className?: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono text-sm", className)}>
      <Tooltip content={<span className="font-mono">{value}</span>}>
        <span tabIndex={0} className="rounded">{truncate(value)}</span>
      </Tooltip>
      <button
        type="button"
        aria-label={copied ? t("common.copied") : t("common.copy")}
        className="grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-muted"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          } catch {
            /* clipboard blocked */
          }
        }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </span>
  );
}
