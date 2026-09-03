import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { displaySans, mono, sans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Vespera — After-hours clinical concierge for medical spas",
    template: "%s · Vespera",
  },
  description:
    "Vespera answers the 11 PM DM in seconds, checks your clinical rulebook before it says yes, and hands over a booking link while the lead is still warm.",
  metadataBase: new URL("https://vespera.ai"),
};

export const viewport: Viewport = {
  themeColor: "#0C0B0E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(sans.variable, displaySans.variable, mono.variable)}
    >
      <body className="min-h-screen bg-canvas font-sans text-espresso antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
