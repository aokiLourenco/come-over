"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Burst } from "../Confetti";
import type { sfx } from "@/lib/sound";

export type Arrival = "zoom" | "drop" | "rise" | "fade";

export type SceneInfo = { to: string; title: string; host: string; startLocal: string };

export type SceneProps = {
  info: SceneInfo;
  reduced: boolean;
  sfx: typeof sfx;
  confetti: (b: Burst) => void;
  setHint: (hint: string | null) => void;
  finish: (arrival: Arrival) => void;
};

/** setTimeout that dies with the scene, so replays never fire stale steps. */
export function useTimers() {
  const ids = useRef<number[]>([]);
  useEffect(() => {
    const list = ids.current;
    return () => list.forEach(clearTimeout);
  }, []);
  return (ms: number, fn: () => void) => {
    ids.current.push(window.setTimeout(fn, ms));
  };
}

/**
 * Scenes are authored on a fixed 390 x 780 board and scaled to cover their container.
 * Keep anything that matters between y=70 and y=710: shorter screens crop the edges.
 */
export function SceneBox({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(Math.max(el.clientWidth / 390, el.clientHeight / 780));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className="scene-box">
      <div className="scene" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {scale > 0 && children}
      </div>
    </div>
  );
}
