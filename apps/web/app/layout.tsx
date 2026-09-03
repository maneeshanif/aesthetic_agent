import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { displaySerif, mono, sans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Vespera AI — After-hours clinical concierge for medical spas",
    template: "%s · Vespera AI",
  },
  description:
    "Vespera AI captures the high-ticket aesthetic consultations your front desk sleeps through — medical-grade triage, RAG safety checks, and direct booking hand-off.",
  metadataBase: new URL("https://vespera.ai"),
};

export const viewport: Viewport = {
  themeColor: "#FAF8F5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(sans.variable, displaySerif.variable, mono.variable)}
    >
      <body className="min-h-screen bg-canvas font-sans text-espresso antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
