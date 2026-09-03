import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-md border border-stroke bg-elevated px-3.5 text-sm text-espresso transition-colors placeholder:text-faint focus-visible:border-champagne/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input type={type} ref={ref} className={cn(base, "h-11 py-2", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(base, "min-h-[96px] py-2.5 leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";
