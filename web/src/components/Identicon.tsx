import { cn } from "@/lib/utils";

/** Deterministic gradient identicon from an address. Decorative. */
export function Identicon({ address, className }: { address: string; className?: string }) {
  const h = parseInt(address.slice(2, 8), 16) || 0;
  const a = h % 360;
  const b = (a + 90 + ((h >> 8) % 120)) % 360;
  const c = (b + 120) % 360;
  return (
    <span
      aria-hidden
      className={cn("inline-block h-8 w-8 shrink-0 rounded-full", className)}
      style={{ background: `conic-gradient(from ${a}deg, hsl(${a} 70% 55%), hsl(${b} 70% 55%), hsl(${c} 65% 60%), hsl(${a} 70% 55%))` }}
    />
  );
}
