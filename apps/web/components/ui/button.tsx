import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-tightish transition-[background-color,color,border-color,transform,box-shadow] duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 active:scale-[0.985]",
  {
    variants: {
      variant: {
        primary:
          "bg-champagne text-[var(--text-on-accent)] hover:bg-champagne-strong hover:shadow-[0_0_0_1px_rgba(233,178,76,0.4),0_14px_38px_-14px_rgba(233,178,76,0.5)]",
        champagne:
          "bg-champagne text-[var(--text-on-accent)] hover:bg-champagne-strong hover:shadow-[0_0_0_1px_rgba(233,178,76,0.4),0_14px_38px_-14px_rgba(233,178,76,0.5)]",
        outline:
          "border border-stroke bg-transparent text-espresso hover:border-champagne/50 hover:bg-elevated",
        ghost: "text-slate hover:bg-elevated hover:text-espresso",
        subtle: "bg-elevated text-espresso hover:bg-raised",
        destructive:
          "border border-terracotta/40 bg-terracotta/10 text-terracotta hover:bg-terracotta/[0.16]",
        link: "rounded-none px-0 text-champagne underline-offset-4 hover:underline",
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
