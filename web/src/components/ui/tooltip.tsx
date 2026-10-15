import type { ReactNode } from "react";
import { Tooltip as T } from "radix-ui";

export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <T.Root delayDuration={200}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content sideOffset={6} className="z-[60] max-w-xs rounded-lg bg-fg px-3 py-2 text-xs text-bg shadow-lg break-all">
          {content}
          <T.Arrow className="fill-fg" />
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
export const TooltipProvider = T.Provider;
