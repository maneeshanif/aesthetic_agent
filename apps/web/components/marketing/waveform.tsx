"use client";

import { useEffect, useRef } from "react";

/** Gradient audio waveform. `live` drives amplitude; idle = a faint resting line. */
export function Waveform({
  live,
  height = 120,
  bars = 64,
  className,
}: {
  live: boolean;
  height?: number;
  bars?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = 560;
    const h = height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let time = 0;

    const paint = () => {
      time += reduce ? 0 : live ? 0.09 : 0.02;
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "#f5a623");
      grad.addColorStop(0.55, "#ff6a5b");
      grad.addColorStop(1, "#ff4d8d");
      ctx.fillStyle = grad;
      const bw = w / bars;
      for (let i = 0; i < bars; i++) {
        const seed = Math.sin(i * 0.7 + time) * 0.5 + Math.sin(i * 1.9 - time * 1.4) * 0.3;
        const amp = live
          ? 0.14 + Math.abs(seed) * 0.86
          : 0.05 + Math.abs(Math.sin(i * 0.5 + time)) * 0.04;
        const bh = Math.max(2, amp * h);
        const x = i * bw + bw * 0.22;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, (h - bh) / 2, bw * 0.56, bh, 3);
        else ctx.rect(x, (h - bh) / 2, bw * 0.56, bh);
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(paint);
    };
    paint();
    return () => cancelAnimationFrame(raf);
  }, [live, height, bars]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ width: "100%", height, display: "block" }}
      aria-hidden
    />
  );
}
