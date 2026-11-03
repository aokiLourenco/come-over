"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND } from "@/lib/config";
import { formatDay } from "@/lib/format";
import type { Guest, PublicInvite } from "@/lib/types";
import { Confetti, type ConfettiHandle } from "./Confetti";
import { InviteCard } from "./InviteCard";
import { RevealStage } from "./reveals/RevealStage";
import { Rsvp } from "./Rsvp";

export function InviteExperience({ invite: initial, guest: initialGuest, to }: { invite: PublicInvite; guest: Guest | null; to: string }) {
  const [invite, setInvite] = useState(initial);
  const [guest, setGuest] = useState(initialGuest);
  const [run, setRun] = useState(0);
  const confetti = useRef<ConfettiHandle>(null);

  useEffect(() => {
    const key = `viewed:${invite.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void fetch(`/api/invites/${invite.id}/view`, { method: "POST" });
  }, [invite.id]);

  const data = {
    ...invite,
    photoUrl: invite.hasPhoto ? `/api/photos/${invite.id}?v=${invite.photoVersion}` : null,
  };

  const closed = invite.isOver
    ? "This party has already happened."
    : invite.rsvpOpen
      ? null
      : `Replies closed${invite.rsvpBy ? ` on ${formatDay(invite.rsvpBy)}` : ""}. Message ${invite.host} directly if your plans have changed.`;

  const card = (
    <>
      <InviteCard data={data} to={to} startUtc={invite.startUtc} calendarIcsUrl={`/i/${invite.id}/calendar.ics`}>
        <Rsvp
          allowMaybe={invite.allowMaybe}
          maxPlusOnes={invite.maxPlusOnes}
          to={to}
          inviteId={invite.id}
          guest={guest}
          closed={closed}
          onSaved={(g, v) => {
            setGuest(g);
            setInvite(v);
            if (g.status === "yes") confetti.current?.burst({ x: 0.5, y: 0.8, count: 150, power: 17 });
          }}
        />
      </InviteCard>
      <footer className="invite-foot">
        <button onClick={() => setRun((r) => r + 1)}>Watch it again</button>
        <a href="/create">Make your own invite</a>
      </footer>
    </>
  );

  return (
    <main className={`invite-page backdrop-${invite.theme}`} aria-label={`Invite from ${BRAND}`}>
      <div className="invite-phone">
        <RevealStage
          key={run}
          kind={invite.reveal}
          color={invite.color}
          info={{ to, title: invite.title, host: invite.host, startLocal: invite.startLocal }}
          card={card}
          startOpen={run === 0 && Boolean(guest)}
        />
        <Confetti ref={confetti} />
      </div>
    </main>
  );
}
