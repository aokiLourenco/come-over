"use client";

import { useEffect, useState, type ReactNode } from "react";
import { formatDay, formatTimeRange, googleCalendarUrl, mapUrl } from "@/lib/format";
import type { PublicInvite } from "@/lib/types";

export type CardData = Pick<
  PublicInvite,
  | "title" | "host" | "theme" | "startLocal" | "endLocal" | "venue" | "address" | "addressHidden"
  | "message" | "dressCode" | "bring" | "songUrl" | "goingNames" | "goingCount" | "isOver"
> & { photoUrl: string | null };

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function songLabel(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("spotify")) return "Listen on Spotify";
    if (host.includes("apple")) return "Listen on Apple Music";
    if (host.includes("youtu")) return "Listen on YouTube";
  } catch {}
  return "Listen to the song";
}

function Countdown({ startUtc }: { startUtc?: string }) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!startUtc) return;
    const days = Math.ceil((new Date(startUtc).getTime() - Date.now()) / 86_400_000);
    if (days > 1) setText(`${days} days to go`);
    else if (days === 1) setText("That's tomorrow");
    else if (days === 0) setText("That's today");
  }, [startUtc]);
  return text ? <span className="fact-sub">{text}</span> : null;
}

export function InviteCard({
  data,
  to,
  startUtc,
  calendarIcsUrl,
  children,
}: {
  data: CardData;
  to?: string;
  startUtc?: string;
  calendarIcsUrl?: string;
  children?: ReactNode;
}) {
  const where = [data.venue, data.address].filter(Boolean).join(", ");
  const len = data.title.length;
  return (
    <article className={`card theme-${data.theme}`}>
      <div className="card-art" aria-hidden="true" />
      <header className="card-head">
        <p className="card-kicker">{to ? `${to}, you're invited to` : "You're invited to"}</p>
        <h1 className={`card-title ${len > 34 ? "is-long" : len > 18 ? "is-mid" : ""}`}>{data.title || "Your party"}</h1>
        <p className="card-host">Hosted by {data.host || "you"}</p>
      </header>

      {data.photoUrl && (
        <div className="card-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.photoUrl} alt="" />
        </div>
      )}

      {data.message && <p className="card-message">{data.message}</p>}

      <dl className="card-facts">
        <Fact label="When">
          {data.startLocal ? (
            <>
              <strong>{formatDay(data.startLocal)}</strong>
              <span>{formatTimeRange(data.startLocal, data.endLocal)}</span>
              <Countdown startUtc={startUtc} />
            </>
          ) : (
            <strong>Pick a date</strong>
          )}
        </Fact>
        {(data.venue || data.address || data.addressHidden) && (
          <Fact label="Where">
            {data.venue && <strong>{data.venue}</strong>}
            {data.addressHidden ? (
              <span>Say you're coming to get the address.</span>
            ) : (
              data.address && (
                <a href={mapUrl(data.address)} target="_blank" rel="noreferrer">
                  {data.address}
                </a>
              )
            )}
          </Fact>
        )}
        {data.dressCode && <Fact label="Wear">{data.dressCode}</Fact>}
        {data.bring && <Fact label="Bring">{data.bring}</Fact>}
        {data.songUrl && (
          <Fact label="Soundtrack">
            <a href={data.songUrl} target="_blank" rel="noreferrer noopener">
              {songLabel(data.songUrl)}
            </a>
          </Fact>
        )}
        {data.goingNames.length > 0 && (
          <Fact label={`Going (${data.goingCount})`}>{data.goingNames.join(", ")}</Fact>
        )}
      </dl>

      {children}

      {calendarIcsUrl && data.startLocal && !data.isOver && (
        <p className="card-calendar">
          Add to calendar:{" "}
          <a
            href={googleCalendarUrl({
              title: data.title,
              startLocal: data.startLocal,
              endLocal: data.endLocal,
              where,
              details: `Hosted by ${data.host}`,
            })}
            target="_blank"
            rel="noreferrer"
          >
            Google
          </a>{" "}
          or <a href={calendarIcsUrl}>Apple and Outlook</a>
        </p>
      )}
    </article>
  );
}
