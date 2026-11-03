"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTimers, type SceneProps } from "./shared";

const BANDS = ["#FF4F9A", "#FFC928", "#10B58C", "#2A32D8", "#FF7A1A"];
const HITS = 4;
const MAX_SWING = 0.3; // radians; beyond this the star leaves narrow screens

/** One point of the star: stacked bands of fringed crepe paper. */
function Point({ angle, shift }: { angle: number; shift: number }) {
  const base = 38;
  const tip = 150;
  const half = 44;
  const bands = 5;
  return (
    <g transform={`rotate(${angle})`}>
      {Array.from({ length: bands }, (_, i) => {
        const a = base + ((tip - base) * i) / bands;
        const b = base + ((tip - base) * (i + 1)) / bands;
        const w = (r: number) => half * (1 - (r - base) / (tip - base));
        const color = BANDS[(i + shift) % BANDS.length];
        return (
          <g key={i}>
            <path d={`M${-w(a)} ${-a} L${w(a)} ${-a} L${w(b)} ${-b} L${-w(b)} ${-b}Z`} fill={color} />
            <line x1={-w(a) - 2} y1={-a - 10} x2={w(a) + 2} y2={-a - 10} stroke="rgba(0,0,0,.2)" strokeWidth="20" strokeDasharray="1.5 4" opacity={i < 4 ? 0.8 : 0} />
          </g>
        );
      })}
      <g transform={`translate(0 ${-tip})`}>
        {[-14, -5, 5, 14].map((x, i) => (
          <path key={x} d={`M0 0 Q${x} 16 ${x * 1.5} 34`} stroke={BANDS[(i + shift + 1) % BANDS.length]} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        ))}
      </g>
    </g>
  );
}

function Star() {
  const hub = useMemo(() => ["#FF4F9A", "#FFC928", "#10B58C", "#FF7A1A", "#2A32D8"], []);
  return (
    <g>
      {[0, 60, 120, 180, 240, 300].map((a, i) => (
        <Point key={a} angle={a} shift={i} />
      ))}
      {hub.map((c, i) => (
        <g key={c}>
          <circle r={58 - i * 11} fill={c} />
          <circle r={55 - i * 11} fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="9" strokeDasharray="1.5 3.5" />
        </g>
      ))}
    </g>
  );
}

const CRACKS = [
  "M-6 -46 L6 -22 L-8 -6",
  "M-8 -6 L10 12 L-2 30 L8 54",
  "M-8 -6 L-34 8 L-52 2 M10 12 L34 2 L50 12",
  "M-2 30 L-24 40 M6 -22 L28 -30",
];

export function PinataScene({ t, reduced, sfx, confetti, setHint, finish }: SceneProps) {
  const [hits, setHits] = useState(0);
  const [split, setSplit] = useState(false);
  const swing = useRef<SVGGElement>(null);
  const motion = useRef({ a: 0.08, v: 0 });
  const later = useTimers();

  useEffect(() => setHint(t.hints.hit), [setHint, t]);

  // A damped pendulum, so each hit visibly adds to the swing.
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const step = () => {
      const m = motion.current;
      m.v += -0.0052 * Math.sin(m.a);
      m.v *= 0.992;
      m.a = Math.max(-MAX_SWING, Math.min(MAX_SWING, m.a + m.v));
      swing.current?.setAttribute("transform", `rotate(${(m.a * 180) / Math.PI} 195 0)`);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  function hit(e: React.MouseEvent<HTMLButtonElement>) {
    if (split) return;
    if (reduced) return finish("fade");
    const rect = e.currentTarget.getBoundingClientRect();
    const fromLeft = e.clientX ? e.clientX < rect.left + rect.width / 2 : Math.random() > 0.5;
    motion.current.v = Math.max(-0.024, Math.min(0.024, motion.current.v + (fromLeft ? 1 : -1) * 0.02));
    const n = hits + 1;
    setHits(n);
    navigator.vibrate?.(35);
    confetti({ x: fromLeft ? 0.38 : 0.62, y: 0.44, count: 14, angle: fromLeft ? 200 : -20, spread: 60, power: 7 });
    if (n < HITS) {
      sfx.play("whack");
      return setHint([t.hints.harder, t.hints.cracking, t.hints.oneMore][n - 1]);
    }
    setHint(null);
    sfx.play("crack");
    setSplit(true);
    later(120, () => {
      sfx.play("candy");
      confetti({ x: 0.5, y: 0.44, count: 90, kind: "candy", angle: 90, spread: 220, power: 9 });
      confetti({ x: 0.5, y: 0.44, count: 110, angle: -90, spread: 260, power: 11 });
    });
    later(1250, () => finish("drop"));
  }

  return (
    <div className="pinata-scene" data-split={split} data-hits={hits}>
      <svg viewBox="0 0 390 780" className="pinata-art" aria-hidden="true">
        <defs>
          <clipPath id="pin-left"><path d="M-260 -260H2L-6 -46 6 -22 -8 -6 10 12 -2 30 8 54 2 260H-260Z" /></clipPath>
          <clipPath id="pin-right"><path d="M260 -260H2L-6 -46 6 -22 -8 -6 10 12 -2 30 8 54 2 260H260Z" /></clipPath>
        </defs>
        <g className="bunting">
          <path d="M-10 86 Q195 180 400 86" fill="none" stroke="#fff" strokeWidth="2" />
          {[30, 90, 150, 210, 270, 330].map((x, i) => {
            const y = 96 + 62 * (1 - ((x - 195) / 205) ** 2) - 12;
            return <path key={x} d={`M${x - 20} ${y} h40 l-20 36z`} fill={BANDS[i % BANDS.length]} />;
          })}
        </g>
        <g ref={swing}>
          <line x1="195" y1="-10" x2="195" y2="205" stroke="#fff" strokeWidth="3" />
          <g transform="translate(195 345)">
            <g className="pin-half pin-left" clipPath="url(#pin-left)"><Star /></g>
            <g className="pin-half pin-right" clipPath="url(#pin-right)"><Star /></g>
            {!split &&
              CRACKS.slice(0, hits).map((d) => (
                <path key={d} d={d} fill="none" stroke="#17103A" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              ))}
          </g>
        </g>
      </svg>
      <button className="scene-tap pinata-tap" onClick={hit} aria-label={t.aria.hit(hits, HITS)} />
    </div>
  );
}
