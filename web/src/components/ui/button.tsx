import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-[transform,background-color,box-shadow,opacity] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 min-h-11 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg shadow-sm hover:bg-primary-hover",
        secondary: "bg-muted text-fg hover:bg-border",
        outline: "border border-border bg-surface text-fg hover:bg-muted",
        ghost: "text-fg hover:bg-muted",
        link: "text-fg underline underline-offset-4 min-h-0 hover:text-primary-ink",
        destructiveOutline: "border-2 border-critical text-critical bg-transparent hover:bg-critical-soft",
      },
      size: { sm: "h-9 px-3 text-sm", md: "h-11 px-4 text-sm", lg: "h-12 px-6 text-base", icon: "h-11 w-11" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = "Button";
