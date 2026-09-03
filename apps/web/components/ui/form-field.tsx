import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-terracotta">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate/80">{hint}</p>
      ) : null}
    </div>
  );
}
