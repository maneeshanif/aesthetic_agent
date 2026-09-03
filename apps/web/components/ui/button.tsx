import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill text-sm font-medium tracking-tightish transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-espresso text-canvas shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_8px_24px_-12px_rgba(26,23,21,0.5)] hover:bg-espresso/90",
        champagne:
          "border border-champagne/40 bg-champagne text-espresso shadow-champagne-glow hover:brightness-[1.04]",
        outline:
          "border border-stroke bg-pearl/60 text-espresso backdrop-blur hover:bg-pearl hover:border-champagne/40",
        ghost: "text-espresso hover:bg-elevated",
        subtle: "bg-elevated text-slate hover:text-espresso hover:bg-stroke/60",
        destructive:
          "border border-terracotta/30 bg-terracotta/10 text-terracotta hover:bg-terracotta/15",
        link: "text-champagne underline-offset-4 hover:underline rounded-none px-0",
      },
      size: {
        sm: "h-8 px-3.5 text-xs",
        md: "h-10 px-5",
        lg: "h-12 px-7 text-[0.95rem]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
