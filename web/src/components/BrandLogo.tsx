import { cn } from "@/lib/utils";

/** Stencil wordmark "BRIDGE" with a small dark superscript "x" at the right, as in the mockups. */
export function BrandLogo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "xl" }) {
  const s = { sm: "text-lg", md: "text-[22px]", xl: "text-[64px] sm:text-[88px]" }[size];
  return (
    <span className={cn("inline-flex items-center leading-none text-fg", s, className)} aria-label="BridgeSecur" role="img">
      <span className="font-stencil tracking-[0.02em]" aria-hidden>
        BRIDGE
      </span>
      <span className="ml-[0.04em] -translate-y-[0.08em] font-display text-[0.26em] font-bold" aria-hidden>
        x
      </span>
    </span>
  );
}

export function LogoAvatar({ className }: { className?: string }) {
  return (
    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-surface", className)} aria-hidden>
      <span className="font-stencil text-[9px] leading-none text-fg">BRIDGE</span>
    </span>
  );
}
