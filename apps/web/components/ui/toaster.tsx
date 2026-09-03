"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      theme="dark"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-lg !border !border-stroke !bg-pearl !text-espresso !shadow-overlay !font-sans",
          title: "!text-sm !font-medium",
          description: "!text-slate !text-xs",
          actionButton: "!bg-champagne !text-[#1a1206] !rounded-md",
          success: "!text-sage",
          error: "!text-terracotta",
        },
      }}
    />
  );
}

export { toast } from "sonner";
