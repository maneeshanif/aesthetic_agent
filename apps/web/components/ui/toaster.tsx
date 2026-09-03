"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-card !border !border-stroke !bg-pearl/95 !text-espresso !shadow-glass !backdrop-blur-glass !font-sans",
          title: "!text-sm !font-medium",
          description: "!text-slate !text-xs",
          actionButton: "!bg-espresso !text-canvas !rounded-pill",
          success: "!text-sage",
          error: "!text-terracotta",
        },
      }}
    />
  );
}

export { toast } from "sonner";
