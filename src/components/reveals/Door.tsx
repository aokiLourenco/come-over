"use client";

import { useEffect, useState } from "react";
import { useTimers, type SceneProps } from "./shared";

const DANCERS = [
  { x: 30, h: 150, d: 0, c: "#7A2B00" },
  { x: 78, h: 182, d: 0.15, c: "#4A1800" },
  { x: 128, h: 156, d: 0.3, c: "#8C3A08" },
  { x: 178, h: 186, d: 0.1, c: "#5B1E00" },
];

export function DoorScene({ info, t, reduced, sfx, confetti, setHint, finish }: SceneProps) {
  const [knocks, setKnocks] = useState(0);
  const [open, setOpen] = useState(false);
  const later = useTimers();

  useEffect(() => setHint(t.hints.knock), [setHint, t]);

  function knock() {
    if (open || knocks >= 3) return;
    if (reduced) return finish("fade");
    const n = knocks + 1;
    setKnocks(n);
    sfx.play("knock");
    navigator.vibrate?.(30);
    if (n < 3) return setHint(n === 1 ? t.hints.twoMore : t.hints.oneMore);
    setHint(null);
    later(650, () => {
      setOpen(true);
      sfx.play("door");
    });
    later(1250, () => {
      sfx.play("cheer");
      confetti({ x: 0.5, y: 0.55, count: 160, angle: 90, spread: 150, power: 11 });
    });
    later(2500, () => finish("zoom"));
  }

  return (
    <div className="door-scene" data-open={open} data-knocks={knocks}>
      <div className="door-wall" />
      <div className="door-sconce" aria-hidden="true">
        <span />
      </div>
      <div className="door-frame">
        <div className="door-inside" aria-hidden="true">
          <svg viewBox="0 0 210 495" className="door-party">
            <path d="M0 58 Q105 120 210 58" fill="none" stroke="#7A2B00" strokeWidth="2" />
            {[20, 52, 86, 120, 154, 190].map((x, i) => (
              <circle key={x} cx={x} cy={[69, 82, 90, 90, 82, 69][i]} r="7" fill={["#FF4F9A", "#fff", "#2A32D8", "#fff", "#FF4F9A", "#2A32D8"][i]} />
            ))}
            {DANCERS.map((p) => (
              <g key={p.x} className="dancer" style={{ animationDelay: `${p.d}s` }}>
                <circle cx={p.x} cy={495 - p.h} r="15" fill={p.c} />
                <path d={`M${p.x - 17} 495 L${p.x - 13} ${535 - p.h} Q${p.x} ${518 - p.h} ${p.x + 13} ${535 - p.h} L${p.x + 17} 495Z`} fill={p.c} />
                <path d={`M${p.x + 11} ${540 - p.h} L${p.x + 22} ${482 - p.h}`} stroke={p.c} strokeWidth="7" strokeLinecap="round" />
              </g>
            ))}
          </svg>
        </div>
        <div className="door-persp">
          <button className="door-leaf" onClick={knock} data-hit={knocks === 0 ? "none" : knocks % 2 ? "a" : "b"} aria-label={t.aria.knock(knocks)}>
            <svg viewBox="0 0 210 495" aria-hidden="true">
              <rect width="210" height="495" fill="var(--r)" />
              <rect x="26" y="26" width="158" height="118" rx="4" fill="var(--pane, #17103A)" stroke="var(--r-deep)" strokeWidth="6" />
              <path d="M105 26v118M26 85h158" stroke="var(--r-deep)" strokeWidth="6" />
              <rect x="26" y="176" width="158" height="128" rx="4" fill="none" stroke="var(--r-deep)" strokeWidth="6" />
              <rect x="26" y="336" width="158" height="132" rx="4" fill="none" stroke="var(--r-deep)" strokeWidth="6" />
              <circle cx="178" cy="312" r="10" fill="#F4C542" stroke="var(--r-deep)" strokeWidth="3" />
              <circle cx="105" cy="222" r="9" fill="#F4C542" stroke="var(--r-deep)" strokeWidth="3" />
              <path d="M90 228a15 19 0 1 0 30 0" fill="none" stroke="#F4C542" strokeWidth="6" strokeLinecap="round" />
            </svg>
            <span className="door-note">
              <em>{info.to ? t.noteFor(info.to) : t.noteInvited}</em>
            </span>
          </button>
        </div>
      </div>
      <div className="door-flood" aria-hidden="true" />
      <div className="door-floor" />
      <div className="door-mat" aria-hidden="true">
        <span>{t.mat}</span>
      </div>
    </div>
  );
}
