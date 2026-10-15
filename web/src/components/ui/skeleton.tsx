import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md bg-[linear-gradient(90deg,var(--muted)_25%,var(--border)_50%,var(--muted)_75%)] bg-[length:200%_100%] animate-shimmer", className)}
      {...props}
    />
  );
}
