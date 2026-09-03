import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md border border-stroke bg-pearl/70 px-3.5 py-2 text-sm text-espresso",
        "shadow-[inset_0_1px_2px_rgba(26,23,21,0.04)] transition-colors placeholder:text-slate/70",
        "focus-visible:border-champagne/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[92px] w-full rounded-md border border-stroke bg-pearl/70 px-3.5 py-2.5 text-sm text-espresso",
      "shadow-[inset_0_1px_2px_rgba(26,23,21,0.04)] transition-colors placeholder:text-slate/70",
      "focus-visible:border-champagne/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/25",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
