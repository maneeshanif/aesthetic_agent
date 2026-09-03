"use client";

import { useEffect, useRef, useState } from "react";

/** Ease-out count-up. Pass `run` (e.g. from an in-view flag) to start. */
export function useCountUp(target: number, run: boolean, ms = 900) {
  const [value, setValue] = useState(0);
  const from = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    const startVal = from.current;
    const tick = (now: number) => {
      const p = Math.min((now - start) / ms, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(startVal + (target - startVal) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, run, ms]);

  return run ? value : 0;
}
