"use client";

import { useEffect, useState, type ReactNode } from "react";
import { buildIcs, formatDay, formatTimeRange, googleCalendarUrl, mapUrl } from "@/lib/format";
import { STRINGS, type Lang, type Strings } from "@/lib/i18n";
import type { InviteInput } from "@/lib/types";

export type CardData = Pick<
  InviteInput,
  "title" | "host" | "theme" | "startLocal" | "endLocal" | "venue" | "address" | "message" | "dressCode" | "bring" | "songUrl"
>;

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function songLabel(url: string, t: Strings) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("spotify")) return t.listen.spotify;
    if (host.includes("apple")) return t.listen.apple;
    if (host.includes("youtu")) return t.listen.youtube;
  } catch {}
  return t.listen.other;
}

function Countdown({ startUtc, t }: { startUtc?: string; t: Strings }) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!startUtc) return;
    const days = Math.ceil((new Date(startUtc).getTime() - Date.now()) / 86_400_000);
    if (days > 1) setText(t.daysToGo(days));
    else if (days === 1) setText(t.tomorrow);
    else if (days === 0) setText(t.today);
  }, [startUtc, t]);
  return text ? <span className="fact-sub">{text}</span> : null;
}

export function InviteCard({
  data,
  lang = "en",
  to,
  startUtc,
  calendar = false,
  children,
}: {
  data: CardData;
  lang?: Lang;
  to?: string;
  startUtc?: string;
  calendar?: boolean;
  children?: ReactNode;
}) {
  const t = STRINGS[lang];
  const where = [data.venue, data.address].filter(Boolean).join(", ");
  const details = t.hostedBy(data.host);
  const len = data.title.length;

  function downloadIcs() {
    const ics = buildIcs({ uid: `${data.startLocal}-${data.title.length}@come-over`, title: data.title, startLocal: data.startLocal, endLocal: data.endLocal, where, details });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = t.calendarFile;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  return (
    <article className={`card theme-${data.theme}`} lang={lang === "pt" ? "pt-BR" : "en"}>
      <div className="card-art" aria-hidden="true" />
      <header className="card-head">
        <p className="card-kicker">{t.kicker(to)}</p>
        <h1 className={`card-title ${len > 34 ? "is-long" : len > 18 ? "is-mid" : ""}`}>{data.title || t.yourParty}</h1>
        <p className="card-host">{t.hostedBy(data.host || t.you)}</p>
      </header>

      {data.message && <p className="card-message">{data.message}</p>}

      <dl className="card-facts">
        <Fact label={t.when}>
          {data.startLocal ? (
            <>
              <strong>{formatDay(data.startLocal, lang)}</strong>
              <span>{formatTimeRange(data.startLocal, data.endLocal, lang)}</span>
              <Countdown startUtc={startUtc} t={t} />
            </>
          ) : (
            <strong>{t.pickDate}</strong>
          )}
        </Fact>
        {(data.venue || data.address) && (
          <Fact label={t.where}>
            {data.venue && <strong>{data.venue}</strong>}
            {data.address && (
              <a href={mapUrl(data.address)} target="_blank" rel="noreferrer">
                {data.address}
              </a>
            )}
          </Fact>
        )}
        {data.dressCode && <Fact label={t.wear}>{data.dressCode}</Fact>}
        {data.bring && <Fact label={t.bring}>{data.bring}</Fact>}
        {data.songUrl && (
          <Fact label={t.soundtrack}>
            <a href={data.songUrl} target="_blank" rel="noreferrer noopener">
              {songLabel(data.songUrl, t)}
            </a>
          </Fact>
        )}
      </dl>

      {children}

      {calendar && data.startLocal && (
        <p className="card-calendar">
          {t.calendar}{" "}
          <a
            href={googleCalendarUrl({ title: data.title, startLocal: data.startLocal, endLocal: data.endLocal, where, details })}
            target="_blank"
            rel="noreferrer"
          >
            Google
          </a>{" "}
          {t.calendarOr} <button className="link-btn" onClick={downloadIcs}>{t.calendarOther}</button>
        </p>
      )}
    </article>
  );
}
