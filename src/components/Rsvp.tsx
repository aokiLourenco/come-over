"use client";

import { useState } from "react";
import { LIMITS } from "@/lib/config";
import { STRINGS, type Lang, type Status } from "@/lib/i18n";
import type { InviteInput, Reply } from "@/lib/types";

type Props = {
  lang: Lang;
  allowMaybe: boolean;
  maxPlusOnes: number;
  to?: string;
  preview?: boolean;
  invite?: InviteInput;
  saved?: Reply | null;
  closed?: string | null;
  onSaved?: (reply: Reply) => void;
};

export function Rsvp({ lang, allowMaybe, maxPlusOnes, to, preview, invite, saved, closed, onSaved }: Props) {
  const t = STRINGS[lang];
  const [status, setStatus] = useState<Status | null>(saved?.status ?? null);
  const [name, setName] = useState(saved?.name ?? to ?? "");
  const [plusOnes, setPlusOnes] = useState(saved?.plusOnes ?? 0);
  const [note, setNote] = useState(saved?.note ?? "");
  const [editing, setEditing] = useState(!saved);
  const [copied, setCopied] = useState(false);

  const first = (saved?.name ?? "").split(/\s+/)[0];

  if (closed) {
    return (
      <section className="rsvp">
        {saved ? <h2>{t.saved[saved.status]}, {first}</h2> : <h2>{t.closedTitle}</h2>}
        <p className="rsvp-sub">{closed}</p>
      </section>
    );
  }

  if (saved && !editing) {
    return (
      <section className="rsvp" aria-live="polite">
        <h2>{t.saved[saved.status]}, {first}</h2>
        {saved.plusOnes > 0 && saved.status !== "no" && <p className="rsvp-sub">{t.savedPlus(saved.plusOnes)}</p>}
        <p className="rsvp-sub">{copied && invite ? t.copiedHint(invite.host) : t.savedNote}</p>
        <button className="rsvp-change" onClick={() => setEditing(true)}>{t.change}</button>
      </section>
    );
  }

  const options: Status[] = allowMaybe ? ["yes", "maybe", "no"] : ["yes", "no"];
  const trimmed = name.trim();
  const reply: Reply | null = status && trimmed ? { name: trimmed, status, plusOnes: status === "no" ? 0 : plusOnes, note: note.trim() } : null;
  const message = reply && invite ? t.reply({ ...reply, host: invite.host, title: invite.title }) : "";

  function done() {
    if (!reply) return;
    setEditing(false);
    onSaved?.(reply);
  }

  async function copy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    done();
  }

  const phone = invite?.rsvpPhone;
  const email = invite?.rsvpEmail;

  return (
    <form className="rsvp" onSubmit={(e) => e.preventDefault()}>
      <h2 id="rsvp-q">{t.coming}</h2>
      <div className="rsvp-choices" role="radiogroup" aria-labelledby="rsvp-q">
        {options.map((value) => (
          <button type="button" key={value} role="radio" aria-checked={status === value} className="rsvp-choice" onClick={() => setStatus(value)}>
            {t.status[value]}
          </button>
        ))}
      </div>
      {status && (
        <div className="rsvp-fields">
          <label>
            {t.name}
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={LIMITS.guestName} autoComplete="name" />
          </label>
          {status !== "no" && maxPlusOnes > 0 && (
            <label>
              {t.bringing}
              <select value={plusOnes} onChange={(e) => setPlusOnes(Number(e.target.value))}>
                <option value={0}>{t.justMe}</option>
                {Array.from({ length: maxPlusOnes }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{t.plus(i + 1)}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            {t.noteForHost}
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={LIMITS.guestNote} />
          </label>
          {preview ? (
            <p className="rsvp-sub">{t.previewNote}</p>
          ) : !reply ? (
            <p className="rsvp-sub">{t.addName}</p>
          ) : (
            <div className="rsvp-send-list">
              {phone && (
                <a className="rsvp-send" href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" onClick={done}>
                  {t.sendWhatsApp}
                </a>
              )}
              {phone && (
                <a className="rsvp-send rsvp-send-alt" href={`sms:+${phone}?&body=${encodeURIComponent(message)}`} onClick={done}>
                  {t.sendText}
                </a>
              )}
              {email && (
                <a
                  className={`rsvp-send ${phone ? "rsvp-send-alt" : ""}`}
                  href={`mailto:${email}?subject=${encodeURIComponent(t.replySubject(invite?.title ?? ""))}&body=${encodeURIComponent(message)}`}
                  onClick={done}
                >
                  {t.sendEmail}
                </a>
              )}
              {!phone && !email && (
                <button type="button" className="rsvp-send" onClick={copy}>{t.copyReply}</button>
              )}
              {(phone || email) && <p className="rsvp-sub">{t.sendHint(invite?.host ?? "")}</p>}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
