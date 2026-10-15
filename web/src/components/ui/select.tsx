import type { ReactNode } from "react";
import { Select as S } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectItem = { value: string; label: ReactNode; group?: string };

type Props = { value: string; onValueChange: (v: string) => void; items: SelectItem[]; ariaLabel: string; className?: string; groups?: Record<string, string>; renderValue?: ReactNode };

export function Select({ value, onValueChange, items, ariaLabel, className, groups, renderValue }: Props) {
  const groupKeys = groups ? Object.keys(groups) : [undefined];
  return (
    <S.Root value={value} onValueChange={onValueChange}>
      <S.Trigger aria-label={ariaLabel} className={cn("inline-flex min-h-11 items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-fg hover:bg-muted", className)}>
        {renderValue ?? <S.Value />}
        <S.Icon>
          <ChevronDown size={16} className="text-fg-muted" />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content position="popper" sideOffset={6} className="z-[60] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-xl">
          <S.Viewport>
            {groupKeys.map((g) => (
              <S.Group key={g ?? "all"}>
                {g && groups && <S.Label className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-fg-muted">{groups[g]}</S.Label>}
                {items
                  .filter((i) => !g || i.group === g)
                  .map((i) => (
                    <S.Item key={i.value} value={i.value} className="relative flex min-h-11 cursor-pointer select-none items-center gap-2 rounded-lg py-2 pl-3 pr-8 text-sm outline-none data-[highlighted]:bg-muted">
                      <S.ItemText>{i.label}</S.ItemText>
                      <S.ItemIndicator className="absolute right-2">
                        <Check size={14} />
                      </S.ItemIndicator>
                    </S.Item>
                  ))}
              </S.Group>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  );
}
