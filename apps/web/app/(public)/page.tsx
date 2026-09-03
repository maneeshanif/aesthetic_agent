import { CallDemo } from "@/components/marketing/call-demo";
import { Capabilities } from "@/components/marketing/capabilities";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { DmDemo } from "@/components/marketing/dm-demo";
import { HeroLedger } from "@/components/marketing/hero-ledger";
import { ProblemStats } from "@/components/marketing/problem-stats";
import { Proof } from "@/components/marketing/proof";
import { RevenueCalculator } from "@/components/marketing/revenue-calculator";
import { TriageCanvas } from "@/components/marketing/triage-canvas";

export default function LandingPage() {
  return (
    <>
      <HeroLedger />
      <CallDemo />
      <DmDemo />
      <ProblemStats />
      <TriageCanvas />
      <Capabilities />
      <RevenueCalculator />
      <Proof />
      <ClosingCta />
    </>
  );
}
