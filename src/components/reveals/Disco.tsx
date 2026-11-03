"use client";

import { useEffect, useRef, useState } from "react";
import { useTimers, type SceneProps } from "./shared";

const SPOTS = ["#FF4F9A", "#FFC928", "#7FE3FF", "#FFFFFF", "#8A7BFF", "#37E3B0"];

export function DiscoScene({ reduced, sfx, confetti, setHint, finish }: SceneProps) {
  const [on, setOn] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const later = useTimers();

  useEffect(() => setHint("Pull the cord"), [setHint]);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const W = 390;
    const H = 780;
    const R = 92;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr;
    c.height = H * dpr;
    const dots = Array.from({ length: 70 }, (_, i) => ({
      lon: Math.random() * Math.PI * 2,
      y: Math.random() * H,
      r: 3 + Math.random() * 6,
      color: SPOTS[i % SPOTS.length],
    }));
    let raf = 0;
    const started = performance.now();

    const draw = (now: number) => {
      const t = (now - started) / 1000;
      const drop = on ? Math.min(1, t / 0.9) : 0;
      const eased = 1 - (1 - drop) ** 3;
      const cy = -130 + eased * 390;
      const spin = t * 0.9;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      if (on && drop > 0.5) {
        const glow = (drop - 0.5) * 2;
        for (const d of dots) {
          const a = d.lon + spin;
          const x = W / 2 + Math.sin(a) * W * 0.62;
          const depth = Math.cos(a);
          if (depth < -0.1) continue;
          ctx.globalAlpha = glow * (0.35 + depth * 0.5);
          ctx.fillStyle = d.color;
          ctx.beginPath();
          ctx.ellipse(x, d.y, d.r * (0.5 + Math.abs(depth)), d.r, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#C9CDD8";
      ctx.fillRect(W / 2 - 1.5, 0, 3, Math.max(0, cy - R));

      // The ball is a lat/long grid of mirror tiles projected onto a circle.
      const rows = 14;
      for (let i = 0; i < rows; i++) {
        const lat0 = -Math.PI / 2 + (Math.PI * i) / rows;
        const lat1 = -Math.PI / 2 + (Math.PI * (i + 1)) / rows;
        const mid = (lat0 + lat1) / 2;
        const cols = Math.max(6, Math.round(26 * Math.cos(mid)));
        for (let j = 0; j < cols; j++) {
          const lon0 = (j / cols) * Math.PI * 2 + spin;
          const lon1 = ((j + 1) / cols) * Math.PI * 2 + spin;
          const m = (lon0 + lon1) / 2;
          if (Math.cos(m) < 0) continue;
          const px = (la: number, lo: number) => W / 2 + R * Math.cos(la) * Math.sin(lo);
          const py = (la: number) => cy + R * Math.sin(la);
          const seed = Math.sin(i * 12.9 + j * 78.2) * 43758.5;
          const shimmer = seed - Math.floor(seed);
          const light = Math.cos(m - 0.7) * Math.cos(mid + 0.5);
          const flash = on ? Math.max(0, Math.sin(t * 5 + shimmer * 20)) ** 12 : 0;
          const v = Math.round(60 + 150 * Math.max(0, light) * (0.45 + shimmer * 0.55) + flash * 80);
          ctx.fillStyle = flash > 0.6 ? "#FFFFFF" : `rgb(${v},${v},${Math.min(255, v + 22)})`;
          ctx.beginPath();
          ctx.moveTo(px(lat0, lon0), py(lat0));
          ctx.lineTo(px(lat0, lon1), py(lat0));
          ctx.lineTo(px(lat1, lon1), py(lat1));
          ctx.lineTo(px(lat1, lon0), py(lat1));
          ctx.closePath();
          ctx.fill();
        }
      }
      if (on || !reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [on, reduced]);

  function pull() {
    if (on) return;
    if (reduced) return finish("fade");
    setOn(true);
    setHint(null);
    sfx.play("cord");
    navigator.vibrate?.(25);
    later(350, () => sfx.play("disco"));
    later(1100, () => confetti({ x: 0.5, y: 0.2, count: 110, angle: 90, spread: 160, power: 8 }));
    later(2800, () => finish("zoom"));
  }

  return (
    <div className="disco-scene" data-on={on}>
      <div className="disco-beams" aria-hidden="true">
        <span /><span /><span /><span />
      </div>
      <canvas ref={canvas} className="disco-canvas" aria-hidden="true" />
      <div className="disco-floor" aria-hidden="true" />
      <button className="disco-cord" onClick={pull} aria-label="Pull the cord">
        <span className="cord-line" />
        <span className="cord-bead" />
      </button>
    </div>
  );
}
