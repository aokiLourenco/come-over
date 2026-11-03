"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatDay } from "@/lib/format";
import { STRINGS } from "@/lib/i18n";
import type { InviteInput, Reply } from "@/lib/types";
import { localToUtc, partyIsOver, rsvpIsOpen } from "@/lib/validate";
import { Confetti, type ConfettiHandle } from "./Confetti";
import { InviteCard } from "./InviteCard";
import { RevealStage } from "./reveals/RevealStage";
import { Rsvp } from "./Rsvp";

export function InviteExperience({ invite, to, inviteKey }: { invite: InviteInput; to: string; inviteKey: string }) {
  const t = STRINGS[invite.lang];
  const replyKey = `reply:${inviteKey}`;
  const [reply, setReply] = useState<Reply | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(replyKey) ?? "null");
    } catch {
      return null;
    }
  });
  const [run, setRun] = useState(0);
  const confetti = useRef<ConfettiHandle>(null);

  useEffect(() => {
    document.title = t.docTitle(invite.title);
  }, [t, invite.title]);

  const closed = partyIsOver(invite)
    ? t.over
    : rsvpIsOpen(invite)
      ? null
      : invite.rsvpBy
        ? t.closedBy(formatDay(invite.rsvpBy, invite.lang), invite.host)
        : t.closedStart(invite.host);

  const card = (
    <>
      <InviteCard
        data={invite}
        lang={invite.lang}
        to={to}
        startUtc={localToUtc(invite.startLocal, invite.tzOffsetMin).toISOString()}
        calendar={!partyIsOver(invite)}
      >
        <Rsvp
          lang={invite.lang}
          allowMaybe={invite.allowMaybe}
          maxPlusOnes={invite.maxPlusOnes}
          to={to}
          invite={invite}
          saved={reply}
          closed={closed}
          onSaved={(r) => {
            setReply(r);
            localStorage.setItem(replyKey, JSON.stringify(r));
            if (r.status === "yes") confetti.current?.burst({ x: 0.5, y: 0.8, count: 150, power: 17 });
          }}
        />
      </InviteCard>
      <footer className={`invite-foot theme-${invite.theme}`}>
        <button onClick={() => setRun((r) => r + 1)}>{t.watchAgain}</button>
        <Link href={`/create/?lang=${invite.lang}`}>{t.makeYourOwn}</Link>
      </footer>
    </>
  );

  return (
    <main className={`invite-page backdrop-${invite.theme}`}>
      <div className="invite-phone">
        <RevealStage
          key={run}
          kind={invite.reveal}
          color={invite.color}
          lang={invite.lang}
          info={{ to, title: invite.title, host: invite.host, startLocal: invite.startLocal }}
          card={card}
          startOpen={run === 0 && Boolean(reply)}
        />
        <Confetti ref={confetti} />
      </div>
    </main>
  );
}
