import { ClosingCta } from "@/components/marketing/closing-cta";
import { FeatureRibbon } from "@/components/marketing/feature-ribbon";
import { HeroLedger } from "@/components/marketing/hero-ledger";
import { RevenueCalculator } from "@/components/marketing/revenue-calculator";
import { TriageCanvas } from "@/components/marketing/triage-canvas";
import { VoiceOrb } from "@/components/marketing/voice-orb";

export default function LandingPage() {
  return (
    <>
      <HeroLedger />
      <TriageCanvas />
      <VoiceOrb />
      <RevenueCalculator />
      <FeatureRibbon />
      <ClosingCta />
    </>
  );
}
