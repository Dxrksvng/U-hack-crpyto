import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-12 w-full rounded-xl border border-border bg-surface px-3 text-fg placeholder:text-fg-muted/70 focus-visible:outline-2 focus-visible:outline-primary",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
