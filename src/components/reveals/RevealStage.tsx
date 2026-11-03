"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { colorById, type ColorId, type RevealId } from "@/lib/config";
import { sfx } from "@/lib/sound";
import { Confetti, type Burst, type ConfettiHandle } from "../Confetti";
import { DiscoScene } from "./Disco";
import { DoorScene } from "./Door";
import { EnvelopeScene } from "./Envelope";
import { PinataScene } from "./Pinata";
import { PopperScene } from "./Popper";
import { SceneBox, type Arrival, type SceneInfo, type SceneProps } from "./shared";
import { TicketScene } from "./Ticket";

const SCENES: Record<RevealId, (p: SceneProps) => ReactNode> = {
  door: DoorScene,
  pinata: PinataScene,
  popper: PopperScene,
  envelope: EnvelopeScene,
  disco: DiscoScene,
  ticket: TicketScene,
};

export function RevealStage({
  kind,
  color,
  info,
  card,
  startOpen = false,
  onOpened,
  soundControl = true,
  className = "",
}: {
  kind: RevealId;
  color: ColorId;
  info: SceneInfo;
  card: ReactNode;
  startOpen?: boolean;
  onOpened?: () => void;
  soundControl?: boolean;
  className?: string;
}) {
  const [arrival, setArrival] = useState<Arrival | null>(startOpen ? "fade" : null);
  const [hint, setHint] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const confetti = useRef<ConfettiHandle>(null);
  const c = colorById(color);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const stored = localStorage.getItem("muted") === "1";
    sfx.muted = stored;
    setMuted(stored);
  }, []);

  const finish = useCallback(
    (a: Arrival) => {
      setHint(null);
      setArrival(a);
      onOpened?.();
    },
    [onOpened],
  );
  const burst = useCallback((b: Burst) => confetti.current?.burst(b), []);

  function toggleSound() {
    const next = !muted;
    sfx.muted = next;
    setMuted(next);
    localStorage.setItem("muted", next ? "1" : "0");
  }

  const Scene = SCENES[kind];
  return (
    <div
      className={`stage ${className}`}
      style={
        {
          "--r": c.hex,
          "--r-deep": c.deep,
          "--wall": c.wall,
          "--floor": c.floor,
        } as React.CSSProperties
      }
    >
      {arrival === null && (
        <SceneBox>
          <Scene info={info} reduced={reduced} sfx={sfx} confetti={burst} setHint={setHint} finish={finish} />
        </SceneBox>
      )}
      {arrival !== null && <div className={`stage-card arrive-${arrival}`}>{card}</div>}
      <Confetti ref={confetti} />
      <p className="stage-hint" aria-live="polite" data-show={Boolean(hint)}>
        {hint}
      </p>
      {arrival === null && (
        <button className="stage-skip" onClick={() => finish("fade")}>
          Skip to the invite
        </button>
      )}
      {soundControl && arrival === null && (
        <button className="stage-sound" onClick={toggleSound} aria-pressed={muted} aria-label={muted ? "Turn sound on" : "Turn sound off"}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
            {muted ? (
              <path d="M16 9l5 6m0-6l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            )}
          </svg>
        </button>
      )}
    </div>
  );
}
