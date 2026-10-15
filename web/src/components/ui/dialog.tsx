import type { ReactNode } from "react";
import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Props = { open: boolean; onOpenChange: (o: boolean) => void; title: ReactNode; description?: ReactNode; children: ReactNode; className?: string };

export function Dialog({ open, onOpenChange, title, description, children, className }: Props) {
  const { t } = useTranslation();
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in" />
        <D.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-5 shadow-xl",
            className,
          )}
        >
          <D.Title className="pr-8 font-display text-lg font-bold">{title}</D.Title>
          {description ? <D.Description className="mt-1 text-sm text-fg-muted">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
          <div className="mt-4">{children}</div>
          <D.Close aria-label={t("common.close")} className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full text-fg-muted hover:bg-muted">
            <X size={18} />
          </D.Close>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
