"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { REVEALS, type ColorId, type RevealId } from "@/lib/config";
import { InviteCard, type CardData } from "./InviteCard";
import { Phone } from "./Phone";
import { RevealStage } from "./reveals/RevealStage";
import { Rsvp } from "./Rsvp";

const DEMO_COLOR: Record<RevealId, ColorId> = {
  door: "cobalt", pinata: "bubblegum", popper: "tangerine", envelope: "cherry", disco: "midnight", ticket: "mint",
};

function nextSaturday() {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7) + 7);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T20:00`;
}

function useSample(): CardData {
  return useMemo(
    () => ({
      title: "Maya's 30th",
      host: "Maya",
      theme: "sprinkles",
      startLocal: nextSaturday(),
      endLocal: "",
      venue: "Maya's place",
      address: "",
      message: "Cake, loud music, and everyone I like in one room. Be there.",
      dressCode: "Anything with sequins",
      bring: "",
      songUrl: "",
    }),
    [],
  );
}

export function HeroDoor() {
  const sample = useSample();
  const [run, setRun] = useState(0);
  const [opened, setOpened] = useState(false);
  return (
    <div className="hero-door">
      <RevealStage
        key={run}
        kind="door"
        color="cobalt"
        info={{ to: "", title: sample.title, host: sample.host, startLocal: sample.startLocal }}
        onOpened={() => setOpened(true)}
        soundControl={false}
        card={
          <InviteCard data={sample}>
            <Rsvp lang="en" allowMaybe maxPlusOnes={1} preview />
          </InviteCard>
        }
      />
      {opened && (
        <button className="hero-replay" onClick={() => { setRun((r) => r + 1); setOpened(false); }}>
          Close the door
        </button>
      )}
    </div>
  );
}

export function RevealDemo() {
  const sample = useSample();
  const [kind, setKind] = useState<RevealId>("pinata");
  const [run, setRun] = useState(0);
  const current = REVEALS.find((r) => r.id === kind)!;
  return (
    <div className="demo">
      <div className="demo-phone">
        <Phone>
          <RevealStage
            key={`${kind}-${run}`}
            kind={kind}
            color={DEMO_COLOR[kind]}
            info={{ to: "", title: sample.title, host: sample.host, startLocal: sample.startLocal }}
            card={
              <InviteCard data={sample}>
                <Rsvp lang="en" allowMaybe maxPlusOnes={1} preview />
              </InviteCard>
            }
          />
        </Phone>
        <button className="btn-quiet" onClick={() => setRun((r) => r + 1)}>Replay</button>
      </div>
      <div className="demo-list">
        <h2>Six ways in</h2>
        <ul>
          {REVEALS.map((r) => (
            <li key={r.id}>
              <button aria-pressed={kind === r.id} onClick={() => { setKind(r.id); setRun((x) => x + 1); }}>
                {r.label}
              </button>
            </li>
          ))}
        </ul>
        <p>{current.blurb}</p>
        <Link className="btn-main" href={`/create/?reveal=${kind}`}>Use the {current.label}</Link>
      </div>
    </div>
  );
}
