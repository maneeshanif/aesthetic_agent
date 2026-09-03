import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-[0.7rem] font-medium tracking-tightish transition-colors",
  {
    variants: {
      tone: {
        neutral: "border-stroke bg-elevated text-slate",
        champagne: "border-champagne/30 bg-champagne/10 text-[#a9763f]",
        sage: "border-sage/30 bg-sage/10 text-sage",
        terracotta: "border-terracotta/30 bg-terracotta/10 text-terracotta",
        outline: "border-stroke bg-transparent text-espresso",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
