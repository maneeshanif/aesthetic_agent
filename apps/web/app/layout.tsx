import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Vespera AI — After-hours clinical concierge for medical spas",
    template: "%s · Vespera AI",
  },
  description:
    "Vespera AI captures the high-ticket aesthetic consultations your front desk sleeps through — with medical-grade triage, RAG safety checks, and direct booking hand-off.",
  metadataBase: new URL("https://vespera.ai"),
};

export const viewport: Viewport = {
  themeColor: "#FAF8F5",
  width: "device-width",
  initialScale: 1,
};

/**
 * Root HTML wrapper. Fonts (Instrument Serif / Plus Jakarta Sans / JetBrains Mono)
 * and providers are wired in Commit 3; this shell only establishes the document.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-canvas font-sans text-espresso antialiased">{children}</body>
    </html>
  );
}
