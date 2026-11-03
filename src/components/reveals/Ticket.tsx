"use client";

import { useEffect, useRef, useState } from "react";
import { formatShortDay, formatTime } from "@/lib/format";
import { useTimers, type SceneProps } from "./shared";

export function TicketScene({ info, lang, t, reduced, sfx, confetti, setHint, finish }: SceneProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [cleared, setCleared] = useState(false);
  const done = useRef(false);
  const down = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const lastSound = useRef(0);
  const lastCheck = useRef(0);
  const later = useTimers();

  useEffect(() => setHint(t.hints.foil), [setHint, t]);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    c.width = 300;
    c.height = 190;
    const g = ctx.createLinearGradient(0, 0, 300, 190);
    g.addColorStop(0, "#B9BEC9");
    g.addColorStop(0.45, "#EEF0F4");
    g.addColorStop(0.55, "#AEB4C0");
    g.addColorStop(1, "#D5D9E0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 300, 190);
    ctx.strokeStyle = "rgba(90,96,112,.2)";
    ctx.lineWidth = 2;
    for (let x = -190; x < 300; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 190, 190);
      ctx.stroke();
    }
    const label = () => {
      if (done.current) return;
      ctx.fillStyle = "rgba(40,44,60,.72)";
      ctx.font = "26px Shrikhand, serif";
      ctx.textAlign = "center";
      ctx.fillText(t.scratchHere, 150, 104);
    };
    document.fonts.load("26px Shrikhand").then(label, label);
  }, [t]);

  function reveal() {
    if (done.current) return;
    done.current = true;
    setCleared(true);
    setHint(null);
    sfx.play("sparkle");
    navigator.vibrate?.(40);
    confetti({ x: 0.5, y: 0.5, count: 120, angle: -90, spread: 240, power: 10 });
    later(1250, () => finish("rise"));
  }

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = e.currentTarget;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  }

  function scratch(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvas.current;
    const ctx = c?.getContext("2d", { willReadFrequently: true });
    if (!c || !ctx || done.current) return;
    const p = point(e);
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "#000"; // Opaque, or destination-out only erases part of the foil.
    ctx.lineWidth = 38;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(last.current?.x ?? p.x, last.current?.y ?? p.y);
    ctx.lineTo(p.x + 0.1, p.y);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    last.current = p;

    const now = performance.now();
    if (now - lastSound.current > 85) {
      sfx.play("scratch");
      lastSound.current = now;
    }
    if (now - lastCheck.current > 140) {
      lastCheck.current = now;
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let gone = 0;
      for (let i = 3; i < data.length; i += 16) if (data[i] === 0) gone++;
      if (gone / (data.length / 16) > 0.5) reveal();
    }
  }

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (reduced) return finish("fade");
    e.currentTarget.setPointerCapture(e.pointerId);
    down.current = true;
    last.current = null;
    scratch(e);
  };

  return (
    <div className="ticket-scene" data-cleared={cleared}>
      <div className="ticket">
        <div className="ticket-head">
          <span>{t.ticketAdmit(info.to)}</span>
          <span>No. 0{(info.title.length * 37 + 101) % 900}</span>
        </div>
        <div className="ticket-win">
          <div className="ticket-prize">
            <strong>{info.title || t.yourParty}</strong>
            {info.startLocal && (
              <span>
                {formatShortDay(info.startLocal, lang)}, {formatTime(info.startLocal, lang)}
              </span>
            )}
          </div>
          <canvas
            ref={canvas}
            className="ticket-foil"
            role="button"
            tabIndex={0}
            aria-label={t.aria.foil}
            onPointerDown={start}
            onPointerMove={(e) => down.current && scratch(e)}
            onPointerUp={() => (down.current = false)}
            onPointerCancel={() => (down.current = false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (reduced) finish("fade");
                else reveal();
              }
            }}
          />
        </div>
        <div className="ticket-foot">{t.hostedBy(info.host || t.you)}</div>
      </div>
    </div>
  );
}
