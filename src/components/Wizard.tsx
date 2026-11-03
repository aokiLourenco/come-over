"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { COLORS, LIMITS, OCCASIONS, REVEALS, THEMES, occasionById, type ColorId, type OccasionId, type RevealId, type ThemeId } from "@/lib/config";
import type { InviteInput } from "@/lib/types";
import { parseInvite } from "@/lib/validate";
import { InviteCard, type CardData } from "./InviteCard";
import { Phone } from "./Phone";
import { RevealStage } from "./reveals/RevealStage";
import { Rsvp } from "./Rsvp";

const DRAFT_KEY = "come-over-draft";
const STEPS = ["Occasion", "Reveal", "Details", "Preview"] as const;

type Draft = {
  occasion: OccasionId | "";
  reveal: RevealId;
  color: ColorId;
  theme: ThemeId;
  title: string;
  host: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  address: string;
  hideAddress: boolean;
  message: string;
  dressCode: string;
  bring: string;
  songUrl: string;
  allowMaybe: boolean;
  maxPlusOnes: number;
  showGuestList: boolean;
  rsvpBy: string;
};

const EMPTY: Draft = {
  occasion: "",
  reveal: "door",
  color: "cobalt",
  theme: "flyer",
  title: "",
  host: "",
  date: "",
  startTime: "",
  endTime: "",
  venue: "",
  address: "",
  hideAddress: false,
  message: "",
  dressCode: "",
  bring: "",
  songUrl: "",
  allowMaybe: true,
  maxPlusOnes: 1,
  showGuestList: false,
  rsvpBy: "",
};

/** An end time earlier than the start means the party runs past midnight. */
function endLocalFor(d: Draft) {
  if (!d.endTime || !d.date) return "";
  if (d.endTime > d.startTime) return `${d.date}T${d.endTime}`;
  const [y, m, day] = d.date.split("-").map(Number);
  return `${new Date(Date.UTC(y, m - 1, day + 1)).toISOString().slice(0, 10)}T${d.endTime}`;
}

function toPayload(d: Draft): Record<string, unknown> {
  const startLocal = d.date && d.startTime ? `${d.date}T${d.startTime}` : "";
  const { date: _d, startTime: _s, endTime: _e, ...rest } = d;
  return {
    ...rest,
    startLocal,
    endLocal: endLocalFor(d),
    tzOffsetMin: startLocal ? new Date(startLocal).getTimezoneOffset() : new Date().getTimezoneOffset(),
  };
}

function fromInvite(i: InviteInput): Draft {
  return {
    ...EMPTY,
    ...i,
    date: i.startLocal.slice(0, 10),
    startTime: i.startLocal.slice(11),
    endTime: i.endLocal.slice(11),
  };
}

async function shrinkPhoto(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return c.toDataURL("image/jpeg", 0.84);
}

function Flags({ step, reached, go }: { step: number; reached: number; go: (s: number) => void }) {
  return (
    <ol className="flags" aria-label="Steps">
      {STEPS.map((label, i) => (
        <li key={label} data-on={i <= step}>
          <button disabled={i > reached || i === step} onClick={() => go(i)} aria-current={i === step ? "step" : undefined}>
            <span className="flag" aria-hidden="true" />
            {i + 1}. {label}
          </button>
        </li>
      ))}
    </ol>
  );
}

function Field({
  label, error, hint, children,
}: {
  label: string; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <label className="field" data-error={Boolean(error)}>
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export function Wizard({
  initialReveal,
  edit,
}: {
  initialReveal?: RevealId;
  edit?: { token: string; invite: InviteInput; photoUrl: string | null };
}) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(() => (edit ? fromInvite(edit.invite) : EMPTY));
  const [step, setStep] = useState(edit ? 2 : 0);
  const [reached, setReached] = useState(edit ? 3 : 0);
  const [run, setRun] = useState(0);
  const [photo, setPhoto] = useState<string | null>(edit?.photoUrl ?? null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const loaded = useRef(Boolean(edit));

  useEffect(() => {
    if (edit) return;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { d: Draft; step: number };
        setD({ ...EMPTY, ...parsed.d });
        const s = Math.min(parsed.step, 2);
        setStep(s);
        setReached(s);
      }
    } catch {}
    if (initialReveal) {
      setD((x) => ({ ...x, reveal: initialReveal }));
    }
    loaded.current = true;
  }, [edit, initialReveal]);

  useEffect(() => {
    if (!loaded.current || edit) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ d, step }));
  }, [d, step, edit]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setD((x) => ({ ...x, [key]: value }));
    if (error?.field) setError(null);
  };

  const occasion = occasionById(d.occasion);
  const info = useMemo(
    () => ({ to: "", title: d.title, host: d.host, startLocal: d.date && d.startTime ? `${d.date}T${d.startTime}` : "" }),
    [d.title, d.host, d.date, d.startTime],
  );

  const card: CardData = {
    title: d.title,
    host: d.host,
    theme: d.theme,
    startLocal: info.startLocal,
    endLocal: endLocalFor(d),
    venue: d.venue,
    address: d.hideAddress ? "" : d.address,
    addressHidden: d.hideAddress && Boolean(d.address),
    message: d.message,
    dressCode: d.dressCode,
    bring: d.bring,
    songUrl: d.songUrl,
    goingNames: [],
    goingCount: 0,
    isOver: false,
    photoUrl: photo,
  };
  const previewCard = (
    <InviteCard data={card}>
      <Rsvp allowMaybe={d.allowMaybe} maxPlusOnes={d.maxPlusOnes} preview />
    </InviteCard>
  );

  function go(s: number) {
    setStep(s);
    setReached((r) => Math.max(r, s));
    setRun((r) => r + 1);
  }

  function pickOccasion(id: OccasionId) {
    const o = occasionById(id)!;
    setD((x) => ({ ...x, occasion: id, reveal: initialReveal ?? o.reveal, theme: o.theme, color: o.color }));
    go(1);
  }

  function checkDetails() {
    const r = parseInvite(toPayload(d), { allowPast: Boolean(edit) });
    if (r.ok) {
      setError(null);
      return true;
    }
    setError({ field: r.field, message: r.error });
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('[data-error="true"] input, .wizard-error')?.focus();
    });
    return false;
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    try {
      setPhoto(await shrinkPhoto(file));
      setPhotoChanged(true);
      setError(null);
    } catch {
      setError({ field: "photo", message: "That file couldn't be read. Try a JPEG or PNG." });
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const photoField = !photoChanged ? undefined : photo;
      const res = await fetch(edit ? `/api/manage/${edit.token}` : "/api/invites", {
        method: edit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite: toPayload(d), photo: photoField }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError({ field: body.field, message: body.error ?? "The invite didn't save. Try again." });
        setStep(2);
        return;
      }
      if (edit) {
        router.push(`/m/${edit.token}`);
        router.refresh();
      } else {
        localStorage.removeItem(DRAFT_KEY);
        router.push(`/m/${body.manageToken}?new=1`);
      }
    } catch {
      setError({ field: undefined, message: "The invite didn't save. Check your connection and try again." });
      setStep(2);
    } finally {
      setBusy(false);
    }
  }

  const fieldError = (f: string) => (error?.field === f ? error.message : undefined);
  const saveLabel = edit ? "Save changes" : "Create invite";

  if (step === 3) {
    return (
      <div className="preview-full">
        <Phone>
          <RevealStage key={run} kind={d.reveal} color={d.color} info={info} card={previewCard} />
        </Phone>
        <div className="preview-bar">
          <button className="btn-quiet" onClick={() => setStep(2)}>Edit</button>
          <button className="btn-quiet" onClick={() => setRun((r) => r + 1)}>Replay</button>
          <button className="btn-main" onClick={save} disabled={busy}>
            {busy ? "Saving..." : saveLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard">
      <nav className="wizard-top">
        <a className="wordmark" href="/">Come Over</a>
        {edit && <a href={`/m/${edit.token}`}>Back to guest list</a>}
      </nav>
      <Flags step={step} reached={reached} go={go} />

      {step === 0 && (
        <section className="step step-occasion">
          <h1>What's the party?</h1>
          <div className="occasions">
            {OCCASIONS.map((o, i) => (
              <button key={o.id} className={`ticket-tile tone-${i % 4}`} aria-pressed={d.occasion === o.id} onClick={() => pickOccasion(o.id)}>
                {o.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="step step-split">
          <h1>How should it open?</h1>
          <div className="preview-col">
            <Phone>
              <RevealStage key={`${d.reveal}-${d.color}-${run}`} kind={d.reveal} color={d.color} info={info} card={previewCard} />
            </Phone>
            <button className="btn-quiet" onClick={() => setRun((r) => r + 1)}>Replay</button>
            <p className="field-hint">Try it. This is exactly what your guests get.</p>
          </div>
          <div className="controls">
            <div className="chips" role="group" aria-label="Reveal">
              {REVEALS.map((r) => (
                <button key={r.id} className="chip" aria-pressed={d.reveal === r.id} onClick={() => set("reveal", r.id)}>
                  {r.label}
                </button>
              ))}
            </div>
            <p className="reveal-blurb">{REVEALS.find((r) => r.id === d.reveal)?.blurb}</p>

            <h2>Color</h2>
            <div className="chips" role="group" aria-label="Color">
              {COLORS.map((c) => (
                <button key={c.id} className="chip chip-color" aria-pressed={d.color === c.id} onClick={() => set("color", c.id)}>
                  <span style={{ background: c.hex }} aria-hidden="true" />
                  {c.label}
                </button>
              ))}
            </div>

            <h2>Invite design</h2>
            <div className="themes">
              {THEMES.map((t) => (
                <button key={t.id} className="theme-pick" aria-pressed={d.theme === t.id} onClick={() => set("theme", t.id)}>
                  <span className={`card theme-${t.id} theme-thumb`} aria-hidden="true">
                    <span className="card-art" />
                    <span className="thumb-title">{t.label}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="wizard-bar">
              <button className="btn-text" onClick={() => setStep(0)}>Back</button>
              <button className="btn-main" onClick={() => go(2)}>Next</button>
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="step step-split">
          <h1>Fill in the details</h1>
          <div className="preview-col preview-col-details">
            <Phone>
              <div className="phone-card">{previewCard}</div>
            </Phone>
            <p className="field-hint">Your changes appear here.</p>
          </div>
          <div className="controls">
            {error && !error.field && <p className="wizard-error" role="alert" tabIndex={-1}>{error.message}</p>}
            <div className="row">
              <Field label="Party name" error={fieldError("title")}>
                <input value={d.title} onChange={(e) => set("title", e.target.value)} maxLength={LIMITS.title} placeholder={occasion?.titleHint ?? "Name the party"} />
              </Field>
              <Field label="Hosted by" error={fieldError("host")}>
                <input value={d.host} onChange={(e) => set("host", e.target.value)} maxLength={LIMITS.host} placeholder="Your name" autoComplete="name" />
              </Field>
            </div>

            <div className="row row-3">
              <Field label="Date" error={fieldError("startLocal")}>
                <input type="date" value={d.date} onChange={(e) => set("date", e.target.value)} />
              </Field>
              <Field label="Starts">
                <input type="time" value={d.startTime} onChange={(e) => set("startTime", e.target.value)} />
              </Field>
              <Field label="Ends (optional)" error={fieldError("endLocal")}>
                <input type="time" value={d.endTime} onChange={(e) => set("endTime", e.target.value)} />
              </Field>
            </div>

            <div className="row">
              <Field label="Place (optional)">
                <input value={d.venue} onChange={(e) => set("venue", e.target.value)} maxLength={LIMITS.venue} placeholder="Maya's place" />
              </Field>
              <Field label="Address (optional)">
                <input value={d.address} onChange={(e) => set("address", e.target.value)} maxLength={LIMITS.address} placeholder="Street, city" autoComplete="street-address" />
              </Field>
            </div>
            {d.address && (
              <Check checked={d.hideAddress} onChange={(v) => set("hideAddress", v)}>
                Hide the address until a guest says they're coming
              </Check>
            )}

            <Field label="Your message (optional)">
              <textarea value={d.message} onChange={(e) => set("message", e.target.value)} maxLength={LIMITS.message} rows={3} placeholder="Tell them why they should come" />
            </Field>
            {occasion && (
              <div className="starters">
                <p className="field-hint">Stuck? Tap a line and make it yours.</p>
                <div className="starter-list">
                  {occasion.lines.map((line) => (
                    <button key={line} className="starter" onClick={() => set("message", line)}>{line}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="field" data-error={Boolean(fieldError("photo"))}>
              <span className="field-label">Photo (optional)</span>
              <div className="photo-row">
                <label className="btn-quiet photo-pick">
                  {photo ? "Change photo" : "Add a photo"}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => void onPhoto(e.target.files?.[0])} />
                </label>
                {photo && (
                  <button className="btn-text" onClick={() => { setPhoto(null); setPhotoChanged(true); }}>Remove</button>
                )}
              </div>
              {fieldError("photo") && <span className="field-error" role="alert">{fieldError("photo")}</span>}
            </div>

            <details className="more" open={Boolean(fieldError("songUrl") || fieldError("rsvpBy"))}>
              <summary>More options</summary>
              <div className="row">
                <Field label="What to wear">
                  <input value={d.dressCode} onChange={(e) => set("dressCode", e.target.value)} maxLength={LIMITS.dressCode} placeholder="Anything with sequins" />
                </Field>
                <Field label="What to bring">
                  <input value={d.bring} onChange={(e) => set("bring", e.target.value)} maxLength={LIMITS.bring} placeholder="Something to share" />
                </Field>
              </div>
              <Field label="Song link" error={fieldError("songUrl")}>
                <input value={d.songUrl} onChange={(e) => set("songUrl", e.target.value)} maxLength={LIMITS.songUrl} inputMode="url" placeholder="https://open.spotify.com/track/..." />
              </Field>
              <div className="row">
                <Field label="Guests can bring">
                  <select value={d.maxPlusOnes} onChange={(e) => set("maxPlusOnes", Number(e.target.value))}>
                    <option value={0}>Nobody extra</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>Up to {n} more</option>
                    ))}
                  </select>
                </Field>
                <Field label="Reply by" error={fieldError("rsvpBy")}>
                  <input type="date" value={d.rsvpBy} onChange={(e) => set("rsvpBy", e.target.value)} />
                </Field>
              </div>
              <Check checked={d.allowMaybe} onChange={(v) => set("allowMaybe", v)}>Let guests answer "Maybe"</Check>
              <Check checked={d.showGuestList} onChange={(v) => set("showGuestList", v)}>Show guests who else is going</Check>
            </details>

            <div className="wizard-bar">
              <button className="btn-text" onClick={() => setStep(1)}>Back</button>
              <button className="btn-main" onClick={() => checkDetails() && go(3)}>Preview invite</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
