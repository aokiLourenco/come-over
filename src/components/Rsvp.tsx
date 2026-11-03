"use client";

import { useState } from "react";
import type { Guest, PublicInvite, RsvpStatus } from "@/lib/types";
import { LIMITS } from "@/lib/config";

type Props = {
  allowMaybe: boolean;
  maxPlusOnes: number;
  to?: string;
  preview?: boolean;
  inviteId?: string;
  guest?: Guest | null;
  closed?: string | null;
  onSaved?: (guest: Guest, invite: PublicInvite) => void;
};

const SAVED: Record<RsvpStatus, string> = {
  yes: "You're on the list",
  maybe: "Marked as maybe",
  no: "Thanks for letting them know",
};

export function Rsvp({ allowMaybe, maxPlusOnes, to, preview, inviteId, guest, closed, onSaved }: Props) {
  const [status, setStatus] = useState<RsvpStatus | null>(guest?.status ?? null);
  const [name, setName] = useState(guest?.name ?? to ?? "");
  const [plusOnes, setPlusOnes] = useState(guest?.plusOnes ?? 0);
  const [note, setNote] = useState(guest?.note ?? "");
  const [editing, setEditing] = useState(!guest);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (closed) {
    return (
      <section className="rsvp">
        {guest ? <h2>{SAVED[guest.status]}, {guest.name.split(/\s+/)[0]}</h2> : <h2>RSVPs are closed</h2>}
        <p className="rsvp-sub">{closed}</p>
      </section>
    );
  }

  if (guest && !editing) {
    return (
      <section className="rsvp" aria-live="polite">
        <h2>{SAVED[guest.status]}, {guest.name.split(/\s+/)[0]}</h2>
        {guest.plusOnes > 0 && guest.status !== "no" && <p className="rsvp-sub">Plus {guest.plusOnes} with you.</p>}
        <button className="rsvp-change" onClick={() => setEditing(true)}>
          Change your RSVP
        </button>
      </section>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (preview || !inviteId || !status) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/invites/${inviteId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, status, plusOnes, note }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Your RSVP didn't send. Try again.");
        return;
      }
      setEditing(false);
      onSaved?.(body.guest, body.invite);
    } catch {
      setError("Your RSVP didn't send. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const options: [RsvpStatus, string][] = [
    ["yes", "I'm in"],
    ...(allowMaybe ? ([["maybe", "Maybe"]] as [RsvpStatus, string][]) : []),
    ["no", "Can't make it"],
  ];

  return (
    <form className="rsvp" onSubmit={submit}>
      <h2 id="rsvp-q">Are you coming?</h2>
      <div className="rsvp-choices" role="radiogroup" aria-labelledby="rsvp-q">
        {options.map(([value, label]) => (
          <button type="button" key={value} role="radio" aria-checked={status === value} className="rsvp-choice" onClick={() => setStatus(value)}>
            {label}
          </button>
        ))}
      </div>
      {status && (
        <div className="rsvp-fields">
          <label>
            Your name
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={LIMITS.guestName} autoComplete="name" required />
          </label>
          {status !== "no" && maxPlusOnes > 0 && (
            <label>
              Bringing anyone?
              <select value={plusOnes} onChange={(e) => setPlusOnes(Number(e.target.value))}>
                <option value={0}>Just me</option>
                {Array.from({ length: maxPlusOnes }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Plus {i + 1}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Note for the host (optional)
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={LIMITS.guestNote} />
          </label>
          {preview ? (
            <p className="rsvp-sub">This is a preview. Your guests send their answer from here.</p>
          ) : (
            <button className="rsvp-send" disabled={busy}>
              {busy ? "Sending..." : "Send RSVP"}
            </button>
          )}
          {error && <p className="rsvp-error" role="alert">{error}</p>}
        </div>
      )}
    </form>
  );
}
