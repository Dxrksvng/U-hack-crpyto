import { useId } from "react";
import { CircleAlert, ClipboardPaste, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { validateAddress } from "@/lib/address";
import { cn } from "@/lib/utils";

export function AddressInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  const id = useId();
  const status = validateAddress(value);
  const v = value.trim();
  const msg = status === "invalid" ? t("send.invalid") : status === "bad_checksum" ? t("send.badChecksum") : null;
  return (
    <div>
      <div className={cn("flex h-12 items-center gap-1 rounded-[12px] border bg-surface pl-3 pr-1 focus-within:outline-2 focus-within:outline-primary", msg ? "border-critical" : "border-border")}>
        <label htmlFor={id} className="shrink-0 text-sm text-fg-muted">
          {t("send.to")}
        </label>
        <input
          id={id}
          data-testid="address-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0x…"
          spellCheck={false}
          autoComplete="off"
          aria-invalid={Boolean(msg)}
          aria-describedby={`${id}-msg`}
          className="h-full min-w-0 flex-1 bg-transparent px-2 font-mono text-[14px] outline-none placeholder:text-fg-muted/70"
        />
        {value ? (
          <button type="button" onClick={() => onChange("")} aria-label={t("send.clear")} className="flex h-9 items-center gap-1 rounded-lg bg-muted px-2.5 text-xs font-medium text-fg-muted hover:bg-border">
            <X size={13} aria-hidden /> {t("send.clear")}
          </button>
        ) : (
          <button
            type="button"
            aria-label={t("send.paste")}
            onClick={async () => {
              try {
                onChange((await navigator.clipboard.readText()).trim());
              } catch {
                /* clipboard permission denied */
              }
            }}
            className="grid h-10 w-10 place-items-center rounded-lg text-fg-muted hover:bg-muted"
          >
            <ClipboardPaste size={17} />
          </button>
        )}
      </div>
      <div id={`${id}-msg`} className="mt-1.5 min-h-5 text-xs">
        {msg ? (
          <span className="flex items-center gap-1 text-critical-ink">
            <CircleAlert size={13} /> {msg}
          </span>
        ) : status === "valid" ? (
          <span className="break-all font-mono text-fg-muted">
            <mark className="rounded bg-primary/15 px-0.5 font-medium text-fg">{v.slice(0, 6)}</mark>
            {v.slice(6, -4)}
            <mark className="rounded bg-primary/15 px-0.5 font-medium text-fg">{v.slice(-4)}</mark>
          </span>
        ) : null}
      </div>
    </div>
  );
}
