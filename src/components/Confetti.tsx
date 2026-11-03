"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type Burst = {
  x: number; // 0..1 of the canvas
  y: number;
  count?: number;
  angle?: number; // degrees, -90 is straight up
  spread?: number;
  power?: number;
  kind?: "paper" | "candy";
};
export type ConfettiHandle = { burst: (b: Burst) => void };

type P = {
  x: number; y: number; vx: number; vy: number; r: number; vr: number;
  w: number; h: number; color: string; life: number; kind: "paper" | "candy"; phase: number;
};

const PAPER = ["#FF4F9A", "#FFC928", "#2A32D8", "#10B58C", "#FF7A1A", "#FFFFFF"];

export const Confetti = forwardRef<ConfettiHandle>(function Confetti(_props, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const parts = useRef<P[]>([]);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  function tick() {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (c.width !== Math.round(w * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const unit = w / 390;
    parts.current = parts.current.filter((p) => p.life > 0 && p.y < h + 40);
    for (const p of parts.current) {
      p.vy += 0.16 * unit;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      p.phase += 0.14;
      p.life -= 1;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life / 40);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.color;
      if (p.kind === "candy") {
        const s = p.w * unit;
        ctx.beginPath();
        ctx.moveTo(-s * 1.9, -s * 0.7);
        ctx.lineTo(-s * 0.7, 0);
        ctx.lineTo(-s * 1.9, s * 0.7);
        ctx.closePath();
        ctx.moveTo(s * 1.9, -s * 0.7);
        ctx.lineTo(s * 0.7, 0);
        ctx.lineTo(s * 1.9, s * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.55)";
        ctx.beginPath();
        ctx.arc(-s * 0.3, -s * 0.3, s * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.scale(1, Math.cos(p.phase));
        ctx.fillRect((-p.w / 2) * unit, (-p.h / 2) * unit, p.w * unit, p.h * unit);
      }
      ctx.restore();
    }
    if (parts.current.length) raf.current = requestAnimationFrame(tick);
    else {
      raf.current = 0;
      ctx.clearRect(0, 0, w, h);
    }
  }

  useImperativeHandle(ref, () => ({
    burst({ x, y, count = 120, angle = -90, spread = 70, power = 13, kind = "paper" }) {
      const c = canvas.current;
      if (!c || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const unit = c.clientWidth / 390;
      for (let i = 0; i < count; i++) {
        const a = ((angle + (Math.random() - 0.5) * spread) * Math.PI) / 180;
        const v = power * unit * (0.45 + Math.random() * 0.75);
        parts.current.push({
          x: x * c.clientWidth,
          y: y * c.clientHeight,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          r: Math.random() * 6,
          vr: (Math.random() - 0.5) * 0.3,
          w: kind === "candy" ? 5 + Math.random() * 3 : 6 + Math.random() * 6,
          h: 5 + Math.random() * 8,
          color: PAPER[Math.floor(Math.random() * PAPER.length)],
          life: 130 + Math.random() * 90,
          kind,
          phase: Math.random() * 6,
        });
      }
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    },
  }));

  return <canvas ref={canvas} className="confetti" aria-hidden="true" />;
});
