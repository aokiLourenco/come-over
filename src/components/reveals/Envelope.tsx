"use client";

import { useEffect, useState } from "react";
import { useTimers, type SceneProps } from "./shared";

export function EnvelopeScene({ info, reduced, sfx, confetti, setHint, finish }: SceneProps) {
  const [stage, setStage] = useState<"sealed" | "broken" | "open" | "out">("sealed");
  const later = useTimers();
  const initial = (info.host.trim()[0] ?? "C").toUpperCase();

  useEffect(() => setHint("Tap the seal"), [setHint]);

  function crack() {
    if (stage !== "sealed") return;
    if (reduced) return finish("fade");
    setStage("broken");
    setHint(null);
    sfx.play("seal");
    navigator.vibrate?.(30);
    later(480, () => {
      setStage("open");
      sfx.play("paper");
    });
    later(1250, () => setStage("out"));
    later(1500, () => sfx.play("sparkle"));
    later(2150, () => {
      confetti({ x: 0.5, y: 0.4, count: 70, angle: -90, spread: 200, power: 9 });
      finish("rise");
    });
  }

  return (
    <div className="env-scene" data-stage={stage}>
      <div className="env">
        <div className="env-back" />
        <div className="env-letter">
          <span className="env-letter-kicker">{info.to ? `${info.to}, you're invited` : "You're invited"}</span>
          <strong>{info.title || "Your party"}</strong>
        </div>
        <div className="env-pocket">
          <svg viewBox="0 0 330 230" aria-hidden="true" preserveAspectRatio="none">
            <path d="M0 0 L165 122 L330 0 V230 H0Z" fill="var(--r)" />
            <path d="M0 230 L165 104 L330 230Z" fill="var(--r-deep)" opacity=".35" />
            <path d="M0 0 L165 122 L330 0" fill="none" stroke="var(--r-deep)" strokeWidth="2" />
          </svg>
          {info.to && <span className="env-address">For {info.to}</span>}
        </div>
        <div className="env-flap">
          <svg viewBox="0 0 330 150" aria-hidden="true" preserveAspectRatio="none">
            <path d="M0 0 H330 L180 136 Q165 148 150 136Z" fill="var(--r-deep)" />
          </svg>
        </div>
        <button className="env-seal" onClick={crack} aria-label="Break the wax seal">
          <span className="seal-half seal-l" aria-hidden="true" />
          <span className="seal-half seal-r" aria-hidden="true" />
          <span className="seal-mark" aria-hidden="true">{initial}</span>
        </button>
      </div>
    </div>
  );
}
