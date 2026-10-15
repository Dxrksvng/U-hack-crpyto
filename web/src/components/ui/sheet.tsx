import { useEffect, useRef, type ReactNode } from "react";
import { Dialog as D } from "radix-ui";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { DUR, SHEET_SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: ReactNode;
  hideTitle?: boolean;
  closeLabel?: string;
  children: ReactNode;
  className?: string;
  testId?: string;
};

/** iOS-style bottom sheet: rounded top, drag handle, swipe down / Esc / backdrop to close. Radix restores focus on close. */
export function Sheet({ open, onOpenChange, title, hideTitle, closeLabel, children, className, testId }: Props) {
  const reduce = useReducedMotion();
  // Opened programmatically (no Radix Trigger), so remember and restore the invoking element ourselves.
  const returnTo = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) returnTo.current = document.activeElement as HTMLElement | null;
    else if (returnTo.current) {
      const el = returnTo.current;
      returnTo.current = null;
      requestAnimationFrame(() => el.isConnected && el.focus());
    }
  }, [open]);
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <D.Portal forceMount>
            <D.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-[#0F1729]/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: DUR.standard }} />
            </D.Overlay>
            <D.Content asChild forceMount aria-describedby={undefined} onCloseAutoFocus={(e) => e.preventDefault()}>
              <motion.div
                data-testid={testId}
                className={cn(
                  "fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[90dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[26px] bg-surface px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_40px_-12px_rgba(15,23,41,0.25)] outline-none",
                  className,
                )}
                initial={reduce ? { opacity: 0 } : { y: "100%" }}
                animate={reduce ? { opacity: 1 } : { y: 0 }}
                exit={reduce ? { opacity: 0 } : { y: "100%" }}
                transition={reduce ? { duration: DUR.fast } : SHEET_SPRING}
                drag={reduce ? false : "y"}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.6 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 110 || info.velocity.y > 600) onOpenChange(false);
                }}
              >
                <div className="mx-auto mb-3 h-[5px] w-10 rounded-full bg-[#D5DAE3]" aria-hidden />
                <D.Title className={cn("font-display text-lg font-semibold", hideTitle && "sr-only")}>{title}</D.Title>
                {closeLabel && (
                  <D.Close aria-label={closeLabel} className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full text-fg-muted hover:bg-muted">
                    <X size={18} />
                  </D.Close>
                )}
                {children}
              </motion.div>
            </D.Content>
          </D.Portal>
        )}
      </AnimatePresence>
    </D.Root>
  );
}
