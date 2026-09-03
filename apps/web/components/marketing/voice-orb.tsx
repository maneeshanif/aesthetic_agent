"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SCRIPT = [
  "Hi Jessica, this is Dr. Sterling's concierge.",
  "We noticed you checked our Morpheus8 pricing last night but didn't finish booking.",
  "We had a VIP cancellation tomorrow at 2:00 PM —",
  "would you like me to hold that slot for you?",
];

/** Liquid-silk audio orb driven by a synthetic frequency loop. */
function Orb({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 320;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let raf = 0;
    let t = 0;
    const cx = size / 2;
    const cy = size / 2;

    const draw = () => {
      t += active ? 0.05 : 0.014;
      ctx.clearRect(0, 0, size, size);

      for (let ring = 0; ring < 3; ring++) {
        const points = 72;
        const baseR = 74 + ring * 12;
        const amp = (active ? 12 : 4) + ring * 3;
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
          const a = (i / points) * Math.PI * 2;
          const wave =
            Math.sin(a * 3 + t + ring) * amp + Math.sin(a * 7 - t * 1.4 + ring * 2) * (amp * 0.4);
          const r = baseR + wave;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, cy - 120, 0, cy + 120);
        grad.addColorStop(0, `rgba(232,197,176,${0.5 - ring * 0.13})`);
        grad.addColorStop(1, `rgba(212,163,115,${0.42 - ring * 0.12})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const core = ctx.createRadialGradient(cx, cy, 8, cx, cy, 70);
      core.addColorStop(0, "rgba(255,246,238,0.9)");
      core.addColorStop(1, "rgba(212,163,115,0.05)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, 60 + Math.sin(t * 2) * (active ? 6 : 2), 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return <canvas ref={canvasRef} style={{ width: 320, height: 320 }} aria-hidden />;
}

export function VoiceOrb() {
  const [playing, setPlaying] = useState(false);
  const [caption, setCaption] = useState(0);

  useEffect(() => {
    if (!playing) return;
    setCaption(0);
    const id = window.setInterval(() => {
      setCaption((c) => {
        if (c >= SCRIPT.length - 1) {
          window.clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, 2200);
    return () => window.clearInterval(id);
  }, [playing]);

  return (
    <section
      id="voice"
      className="relative overflow-hidden bg-[#211c19] py-28 text-[#f3efea]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(40rem 30rem at 80% 10%, rgba(212,163,115,0.18), transparent 60%)",
        }}
      />
      <div className="container grid items-center gap-16 lg:grid-cols-2">
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-champagne/80">
            Outbound voice recovery · Phase 4 preview
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            The lead that ghosted at 11 PM gets a call back at noon.
          </h2>
          <p className="mt-5 max-w-md text-[0.98rem] leading-relaxed text-[#c9c1b7]">
            When a qualified lead stalls, Vespera picks up the phone. Real cadence, real
            objection handling, and a booking confirmed before it hangs up.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <Button
              variant="champagne"
              size="lg"
              onClick={() => setPlaying((p) => !p)}
              aria-pressed={playing}
            >
              <Phone className="h-4 w-4" />
              {playing ? "Stop playback" : "Listen to a recovery call"}
            </Button>
          </div>

          <div className="mt-8 min-h-[3.5rem] max-w-md font-mono text-sm text-champagne/90">
            {playing ? (
              <p key={caption} className="animate-fade-up">
                {SCRIPT[caption]}
              </p>
            ) : (
              <p className="text-[#8c8378]">Captions stream here as the call runs.</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-8">
          <Orb active={playing} />
          <div className="hidden w-52 rounded-[28px] border border-[#3a332e] bg-[#171310] p-3 shadow-2xl sm:block">
            <div className="rounded-[20px] bg-[#1f1a16] p-3">
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-[#8c8378]">
                SMS · Vespera
              </p>
              <div
                className="mt-3 rounded-2xl rounded-bl-md bg-champagne/15 px-3 py-2 text-xs text-[#f3efea] transition-opacity"
                style={{ opacity: playing && caption >= 2 ? 1 : 0.25 }}
              >
                Your Morpheus8 slot is held for tomorrow 2:00 PM. Tap to confirm →
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[0.65rem] text-[#8c8378]">
                <MessageCircle className="h-3 w-3" />
                delivered
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
