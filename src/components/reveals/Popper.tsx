"use client";

import { useEffect, useRef, useState } from "react";
import { useTimers, type SceneProps } from "./shared";

const THRESHOLD = 60;
const MAX = 96;

export function PopperScene({ reduced, sfx, confetti, setHint, finish }: SceneProps) {
  const [pull, setPull] = useState(0);
  const [popped, setPopped] = useState(false);
  const drag = useRef<{ y: number; scale: number } | null>(null);
  const moved = useRef(false);
  const later = useTimers();

  useEffect(() => setHint("Pull the string"), [setHint]);

  function pop() {
    if (popped) return;
    if (reduced) return finish("fade");
    setPopped(true);
    setPull(0);
    setHint(null);
    sfx.play("pop");
    navigator.vibrate?.(60);
    confetti({ x: 0.5, y: 0.33, count: 220, angle: -90, spread: 62, power: 22 });
    later(120, () => confetti({ x: 0.5, y: 0.33, count: 80, angle: -90, spread: 100, power: 14 }));
    later(700, () => finish("rise"));
  }

  function onDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (popped) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const scale = e.currentTarget.getBoundingClientRect().width / e.currentTarget.offsetWidth || 1;
    drag.current = { y: e.clientY, scale };
    moved.current = false;
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const d = (e.clientY - drag.current.y) / drag.current.scale;
    if (Math.abs(d) > 4) moved.current = true;
    const next = Math.max(0, Math.min(MAX, d));
    setPull(next);
    setHint(next >= THRESHOLD ? "Let go" : "Pull the string");
  }
  function onUp() {
    if (!drag.current) return;
    drag.current = null;
    if (!moved.current || pull >= THRESHOLD) pop();
    else setPull(0);
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pop();
    }
  }

  const squash = 1 - (pull / MAX) * 0.09;

  return (
    <div className="popper-scene" data-popped={popped} data-ready={pull >= THRESHOLD}>
      <svg viewBox="0 0 390 780" className="popper-art" aria-hidden="true">
        <g transform={`translate(195 330) scale(${2 - squash} ${squash})`} className="popper-body">
          <path d="M-22 -70 L22 -70 L74 118 Q0 148 -74 118Z" fill="var(--r)" />
          <path d="M-29 -44 L29 -44 L36 -18 L-36 -18Z M-44 12 L44 12 L52 40 L-52 40Z M-59 66 L59 66 L66 92 L-66 92Z" fill="#FFC928" />
          <ellipse cx="0" cy="-70" rx="22" ry="7" fill="#17103A" />
          <path d="M-74 118 Q0 148 74 118 L74 128 Q0 158 -74 128Z" fill="var(--r-deep)" />
        </g>
      </svg>
      <div className="popper-string" style={{ height: 86 + pull }} aria-hidden="true" />
      <button
        className="popper-ring"
        style={{ top: 554 + pull }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => { drag.current = null; setPull(0); }}
        onKeyDown={onKey}
        aria-label="Pull the string"
      />
    </div>
  );
}
