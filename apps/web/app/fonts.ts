import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

/** Display — big kinetic headlines with real character. */
export const displaySans = Bricolage_Grotesque({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

/** UI + body. */
export const sans = Hanken_Grotesk({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

/** Data, numerals, latency figures. Not decoration. */
export const mono = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});
