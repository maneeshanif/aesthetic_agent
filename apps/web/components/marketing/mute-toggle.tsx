"use client";

import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

export function MuteToggle({
  muted,
  onToggle,
  className,
}: {
  muted: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={!muted}
      aria-label={muted ? "Unmute call audio" : "Mute call audio"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border border-stroke bg-ink/70 px-2.5 py-1 font-mono text-[0.68rem] text-slate backdrop-blur-sm transition-colors hover:border-champagne/50 hover:text-espresso active:scale-[0.97]",
        className,
      )}
    >
      {muted ? (
        <VolumeX className="h-3 w-3" strokeWidth={2} />
      ) : (
        <Volume2 className="h-3 w-3 text-champagne" strokeWidth={2} />
      )}
      {muted ? "Unmute" : "Sound on"}
    </button>
  );
}
