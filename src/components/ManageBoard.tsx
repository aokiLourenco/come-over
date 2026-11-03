"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDay, formatTimeRange } from "@/lib/format";
import type { Guest, Invite, RsvpStatus } from "@/lib/types";

const LABEL: Record<RsvpStatus, string> = { yes: "Going", maybe: "Maybe", no: "Can't make it" };

export function ManageBoard({ invite, guests, origin, isNew }: { invite: Invite; guests: Guest[]; origin: string; isNew: boolean }) {
  const router = useRouter();
  const [copied, setCopied] = useState("");
  const [name, setName] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const base = `${origin}/i/${invite.id}`;
  const link = name.trim() ? `${base}?to=${encodeURIComponent(name.trim())}` : base;
  const text = `You're invited to ${invite.title}. Open your invite:`;

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
    const t = setInterval(() => router.refresh(), 20_000);
    return () => clearInterval(t);
  }, [router]);

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(""), 1800);
  }

  async function removeGuest(id: string) {
    const res = await fetch(`/api/manage/${invite.manageToken}/guests/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setError("That guest couldn't be removed. Try again.");
  }

  async function removeInvite() {
    const res = await fetch(`/api/manage/${invite.manageToken}`, { method: "DELETE" });
    if (res.ok) router.push("/");
    else setError("The invite couldn't be deleted. Try again.");
  }

  const tally = (s: RsvpStatus) => guests.filter((g) => g.status === s);
  const people = (list: Guest[]) => list.reduce((n, g) => n + 1 + g.plusOnes, 0);
  const going = tally("yes");
  const maybe = tally("maybe");
  const no = tally("no");
  const order: RsvpStatus[] = ["yes", "maybe", "no"];
  const sorted = [...guests].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

  return (
    <main className="manage">
      <nav className="wizard-top">
        <a className="wordmark" href="/">Come Over</a>
      </nav>

      <header className="manage-head">
        {isNew && <p className="manage-created">Invite created. Now send it.</p>}
        <h1>{invite.title}</h1>
        <p>
          {formatDay(invite.startLocal)}, {formatTimeRange(invite.startLocal, invite.endLocal)}
        </p>
      </header>

      <section className="share" aria-label="Share your invite">
        <div className="share-link">
          <input readOnly value={link} aria-label="Invite link" onFocus={(e) => e.target.select()} />
          <button className="btn-main" onClick={() => copy(link, "link")}>
            {copied === "link" ? "Link copied" : "Copy link"}
          </button>
        </div>
        <div className="share-ways">
          {canShare && (
            <button className="chip" onClick={() => navigator.share({ title: invite.title, text, url: link }).catch(() => {})}>Share</button>
          )}
          <a className="chip" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`} target="_blank" rel="noreferrer">WhatsApp</a>
          <a className="chip" href={`sms:?&body=${encodeURIComponent(`${text} ${link}`)}`}>Text</a>
          <a className="chip" href={`mailto:?subject=${encodeURIComponent(`You're invited: ${invite.title}`)}&body=${encodeURIComponent(`${text}\n\n${link}`)}`}>Email</a>
          <a className="chip" href={link} target="_blank" rel="noreferrer">Open invite</a>
        </div>
        <label className="field share-name">
          <span className="field-label">Make it personal (optional)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Guest's name" />
          <span className="field-hint">The link changes to greet them by name and fills in their RSVP.</span>
        </label>
      </section>

      <section className="tally" aria-label="RSVP totals">
        <div><strong>{people(going)}</strong><span>Going</span></div>
        <div><strong>{people(maybe)}</strong><span>Maybe</span></div>
        <div><strong>{no.length}</strong><span>Can't make it</span></div>
        <div><strong>{invite.views}</strong><span>Opened</span></div>
      </section>

      <section className="guests">
        <h2>Guest list</h2>
        {sorted.length === 0 ? (
          <p className="guests-empty">No RSVPs yet. Send the link and they'll show up here.</p>
        ) : (
          <ul>
            {sorted.map((g) => (
              <li key={g.id}>
                <div>
                  <strong>{g.name}</strong>
                  {g.plusOnes > 0 && <span className="guest-plus"> plus {g.plusOnes}</span>}
                  {g.note && <p>{g.note}</p>}
                </div>
                <span className={`guest-status status-${g.status}`}>{LABEL[g.status]}</span>
                <button className="btn-text" onClick={() => removeGuest(g.id)} aria-label={`Remove ${g.name}`}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="manage-private">
        <h2>Keep this page's link</h2>
        <p>There's no account, so this link is the only way back to your guest list. Anyone who has it can edit the party.</p>
        <button className="btn-quiet" onClick={() => copy(`${origin}/m/${invite.manageToken}`, "manage")}>
          {copied === "manage" ? "Private link copied" : "Copy private link"}
        </button>
      </section>

      <section className="manage-actions">
        <a className="btn-quiet" href={`/m/${invite.manageToken}/edit`}>Edit invite</a>
        {confirming ? (
          <>
            <span>Delete the invite and its guest list?</span>
            <button className="btn-danger" onClick={removeInvite}>Delete invite</button>
            <button className="btn-text" onClick={() => setConfirming(false)}>Keep it</button>
          </>
        ) : (
          <button className="btn-text" onClick={() => setConfirming(true)}>Delete invite</button>
        )}
        {error && <p className="field-error" role="alert">{error}</p>}
      </section>
    </main>
  );
}
