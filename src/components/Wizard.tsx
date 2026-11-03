"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { COLORS, LIMITS, OCCASIONS, REVEALS, THEMES, occasionById, type ColorId, type OccasionId, type RevealId, type ThemeId } from "@/lib/config";
import { STRINGS, colorLabel, occasionText, revealText, themeLabel, type ErrorKey, type Lang } from "@/lib/i18n";
import { isValidCode, randomCode, sealInvite } from "@/lib/seal";
import { parseInvite } from "@/lib/validate";
import { InviteCard, type CardData } from "./InviteCard";
import { Phone } from "./Phone";
import { RevealStage } from "./reveals/RevealStage";
import { Rsvp } from "./Rsvp";
import { ShareScreen } from "./ShareScreen";

const DRAFT_KEY = "come-over-draft";

type Draft = {
  lang: Lang;
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
  message: string;
  dressCode: string;
  bring: string;
  songUrl: string;
  allowMaybe: boolean;
  maxPlusOnes: number;
  rsvpBy: string;
  rsvpPhone: string;
  rsvpEmail: string;
  code: string;
};

const EMPTY: Draft = {
  lang: "en",
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
  message: "",
  dressCode: "",
  bring: "",
  songUrl: "",
  allowMaybe: true,
  maxPlusOnes: 1,
  rsvpBy: "",
  rsvpPhone: "",
  rsvpEmail: "",
  code: "",
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
  const { date: _d, startTime: _s, endTime: _e, code: _c, ...rest } = d;
  return {
    ...rest,
    startLocal,
    endLocal: endLocalFor(d),
    tzOffsetMin: startLocal ? new Date(startLocal).getTimezoneOffset() : new Date().getTimezoneOffset(),
  };
}

function Flags({ labels, title, step, reached, go }: { labels: string[]; title: string; step: number; reached: number; go: (s: number) => void }) {
  return (
    <ol className="flags" aria-label={title}>
      {labels.map((label, i) => (
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

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
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

function LangSwitch({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="lang-switch" role="group" aria-label="Language / Idioma">
      <button lang="en" aria-pressed={lang === "en"} onClick={() => onChange("en")}>English</button>
      <button lang="pt-BR" aria-pressed={lang === "pt"} onClick={() => onChange("pt")}>Português</button>
    </div>
  );
}

export function Wizard() {
  const [d, setD] = useState<Draft>(EMPTY);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [run, setRun] = useState(0);
  const [error, setError] = useState<{ field?: string; key: ErrorKey } | null>(null);
  const [busy, setBusy] = useState(false);
  const [sealed, setSealed] = useState<string | null>(null);
  const [pickedReveal, setPickedReveal] = useState<RevealId | undefined>();
  const loaded = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromLink = REVEALS.find((r) => r.id === params.get("reveal"))?.id;
    const wanted = params.get("lang");
    setPickedReveal(fromLink);
    let next: Draft = { ...EMPTY, lang: navigator.language.toLowerCase().startsWith("pt") ? "pt" : "en" };
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { d: Draft; step: number };
        next = { ...EMPTY, ...parsed.d };
        const s = Math.min(parsed.step, 2);
        setStep(s);
        setReached(s);
      }
    } catch {}
    if (wanted === "pt" || wanted === "en") next.lang = wanted;
    if (fromLink) next.reveal = fromLink;
    if (!isValidCode(next.code)) next.code = randomCode();
    setD(next);
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (loaded.current) localStorage.setItem(DRAFT_KEY, JSON.stringify({ d, step }));
  }, [d, step]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  useEffect(() => {
    document.documentElement.lang = d.lang === "pt" ? "pt-BR" : "en";
  }, [d.lang]);

  const t = STRINGS[d.lang];
  const w = t.wizard;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setD((x) => ({ ...x, [key]: value }));
    if (error?.field) setError(null);
  };

  const occasion = d.occasion ? occasionText(d.occasion, d.lang) : null;
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
    address: d.address,
    message: d.message,
    dressCode: d.dressCode,
    bring: d.bring,
    songUrl: d.songUrl,
  };
  const previewCard = (
    <InviteCard data={card} lang={d.lang}>
      <Rsvp lang={d.lang} allowMaybe={d.allowMaybe} maxPlusOnes={d.maxPlusOnes} preview />
    </InviteCard>
  );

  function go(s: number) {
    setStep(s);
    setReached((r) => Math.max(r, s));
    setRun((r) => r + 1);
  }

  function pickOccasion(id: OccasionId) {
    const o = occasionById(id)!;
    setD((x) => ({ ...x, occasion: id, reveal: pickedReveal ?? o.reveal, theme: o.theme, color: o.color }));
    go(1);
  }

  function checkDetails() {
    const r = parseInvite(toPayload(d));
    const problem = !r.ok ? { field: r.field, key: r.error } : !isValidCode(d.code) ? { field: "code", key: "code" as ErrorKey } : null;
    setError(problem);
    if (problem) {
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[data-error="true"] input, .wizard-error')?.focus();
      });
    }
    return !problem;
  }

  async function create() {
    setBusy(true);
    setError(null);
    const r = parseInvite(toPayload(d));
    try {
      if (!r.ok) {
        setError({ field: r.field, key: r.error });
        setStep(2);
        return;
      }
      setSealed(await sealInvite(r.value, d.code));
    } catch {
      setError({ key: "seal" });
      setStep(2);
    } finally {
      setBusy(false);
    }
  }

  function fresh() {
    localStorage.removeItem(DRAFT_KEY);
    setSealed(null);
    setD({ ...EMPTY, lang: d.lang, code: randomCode() });
    setStep(0);
    setReached(0);
    setRun((r) => r + 1);
  }

  const fieldError = (f: string) => (error?.field === f ? t.errors[error.key] : undefined);

  if (sealed) {
    return (
      <ShareScreen
        fragment={sealed}
        code={d.code}
        title={d.title}
        lang={d.lang}
        onEdit={() => { setSealed(null); setStep(2); }}
        onFresh={fresh}
      />
    );
  }

  if (step === 3) {
    return (
      <div className="preview-full">
        <Phone>
          <RevealStage key={run} kind={d.reveal} color={d.color} lang={d.lang} info={info} card={previewCard} />
        </Phone>
        <div className="preview-bar">
          <button className="btn-quiet" onClick={() => setStep(2)}>{w.edit}</button>
          <button className="btn-quiet" onClick={() => setRun((r) => r + 1)}>{w.replay}</button>
          <button className="btn-main" onClick={create} disabled={busy}>{busy ? w.creating : w.create}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard">
      <nav className="wizard-top">
        <Link className="wordmark" href="/">Come Over</Link>
        <LangSwitch lang={d.lang} onChange={(l) => set("lang", l)} />
      </nav>
      <Flags labels={w.steps} title={w.stepsLabel} step={step} reached={reached} go={go} />

      {step === 0 && (
        <section className="step step-occasion">
          <h1>{w.occasionTitle}</h1>
          <div className="occasions">
            {OCCASIONS.map((o, i) => (
              <button key={o.id} className={`ticket-tile tone-${i % 4}`} aria-pressed={d.occasion === o.id} onClick={() => pickOccasion(o.id)}>
                {occasionText(o.id, d.lang).label}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="step step-split">
          <h1>{w.revealTitle}</h1>
          <div className="preview-col">
            <Phone>
              <RevealStage key={`${d.reveal}-${d.color}-${d.lang}-${run}`} kind={d.reveal} color={d.color} lang={d.lang} info={info} card={previewCard} />
            </Phone>
            <button className="btn-quiet" onClick={() => setRun((r) => r + 1)}>{w.replay}</button>
            <p className="field-hint">{w.tryIt}</p>
          </div>
          <div className="controls">
            <div className="chips" role="group" aria-label={w.steps[1]}>
              {REVEALS.map((r) => (
                <button key={r.id} className="chip" aria-pressed={d.reveal === r.id} onClick={() => set("reveal", r.id)}>
                  {revealText(r.id, d.lang).label}
                </button>
              ))}
            </div>
            <p className="reveal-blurb">{revealText(d.reveal, d.lang).blurb}</p>

            <h2>{w.color}</h2>
            <div className="chips" role="group" aria-label={w.color}>
              {COLORS.map((c) => (
                <button key={c.id} className="chip chip-color" aria-pressed={d.color === c.id} onClick={() => set("color", c.id)}>
                  <span style={{ background: c.hex }} aria-hidden="true" />
                  {colorLabel(c.id, d.lang)}
                </button>
              ))}
            </div>

            <h2>{w.design}</h2>
            <div className="themes">
              {THEMES.map((th) => (
                <button key={th.id} className="theme-pick" aria-pressed={d.theme === th.id} onClick={() => set("theme", th.id)}>
                  <span className={`card theme-${th.id} theme-thumb`} aria-hidden="true">
                    <span className="card-art" />
                    <span className="thumb-title">{themeLabel(th.id, d.lang)}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="wizard-bar">
              <button className="btn-text" onClick={() => setStep(0)}>{w.back}</button>
              <button className="btn-main" onClick={() => go(2)}>{w.next}</button>
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="step step-split">
          <h1>{w.detailsTitle}</h1>
          <div className="preview-col preview-col-details">
            <Phone>
              <div className="phone-card">{previewCard}</div>
            </Phone>
            <p className="field-hint">{w.changes}</p>
          </div>
          <div className="controls">
            {error && !error.field && <p className="wizard-error" role="alert" tabIndex={-1}>{t.errors[error.key]}</p>}
            <div className="row">
              <Field label={w.partyName} error={fieldError("title")}>
                <input value={d.title} onChange={(e) => set("title", e.target.value)} maxLength={LIMITS.title} placeholder={occasion?.titleHint ?? w.nameThePlaceholder} />
              </Field>
              <Field label={w.hostedBy} error={fieldError("host")}>
                <input value={d.host} onChange={(e) => set("host", e.target.value)} maxLength={LIMITS.host} placeholder={w.hostPlaceholder} autoComplete="name" />
              </Field>
            </div>

            <div className="row row-3">
              <Field label={w.date} error={fieldError("startLocal")}>
                <input type="date" value={d.date} onChange={(e) => set("date", e.target.value)} />
              </Field>
              <Field label={w.starts}>
                <input type="time" value={d.startTime} onChange={(e) => set("startTime", e.target.value)} />
              </Field>
              <Field label={w.ends} error={fieldError("endLocal")}>
                <input type="time" value={d.endTime} onChange={(e) => set("endTime", e.target.value)} />
              </Field>
            </div>

            <div className="row">
              <Field label={w.place}>
                <input value={d.venue} onChange={(e) => set("venue", e.target.value)} maxLength={LIMITS.venue} placeholder={w.placePlaceholder} />
              </Field>
              <Field label={w.address}>
                <input value={d.address} onChange={(e) => set("address", e.target.value)} maxLength={LIMITS.address} placeholder={w.addressPlaceholder} autoComplete="street-address" />
              </Field>
            </div>

            <Field label={w.message}>
              <textarea value={d.message} onChange={(e) => set("message", e.target.value)} maxLength={LIMITS.message} rows={3} placeholder={w.messagePlaceholder} />
            </Field>
            {occasion && (
              <div className="starters">
                <p className="field-hint">{w.stuck}</p>
                <div className="starter-list">
                  {occasion.lines.map((line) => (
                    <button key={line} className="starter" onClick={() => set("message", line)}>{line}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="field" data-error={Boolean(fieldError("code"))}>
              <label className="field-label" htmlFor="door-code">{w.code}</label>
              <div className="code-row">
                <input
                  id="door-code"
                  className="code-input"
                  value={d.code}
                  onChange={(e) => set("code", e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                />
                <button className="btn-text" onClick={() => set("code", randomCode())}>{w.newCode}</button>
              </div>
              {fieldError("code") ? <span className="field-error" role="alert">{fieldError("code")}</span> : <span className="field-hint">{w.codeHint}</span>}
            </div>

            <fieldset className="plain-fieldset">
              <legend>{w.rsvpTo}</legend>
              <p className="field-hint">{w.rsvpToHint}</p>
              <div className="row">
                <Field label={w.phone} error={fieldError("rsvpPhone")} hint={w.phoneHint}>
                  <input value={d.rsvpPhone} onChange={(e) => set("rsvpPhone", e.target.value)} inputMode="tel" autoComplete="tel" placeholder={w.phonePlaceholder} />
                </Field>
                <Field label={w.email} error={fieldError("rsvpEmail")}>
                  <input value={d.rsvpEmail} onChange={(e) => set("rsvpEmail", e.target.value)} inputMode="email" autoComplete="email" placeholder={w.emailPlaceholder} />
                </Field>
              </div>
            </fieldset>

            <details className="more" open={Boolean(fieldError("songUrl") || fieldError("rsvpBy"))}>
              <summary>{w.more}</summary>
              <div className="row">
                <Field label={w.wearLabel}>
                  <input value={d.dressCode} onChange={(e) => set("dressCode", e.target.value)} maxLength={LIMITS.dressCode} placeholder={w.wearPlaceholder} />
                </Field>
                <Field label={w.bringLabel}>
                  <input value={d.bring} onChange={(e) => set("bring", e.target.value)} maxLength={LIMITS.bring} placeholder={w.bringPlaceholder} />
                </Field>
              </div>
              <Field label={w.song} error={fieldError("songUrl")}>
                <input value={d.songUrl} onChange={(e) => set("songUrl", e.target.value)} maxLength={LIMITS.songUrl} inputMode="url" placeholder="https://open.spotify.com/track/..." />
              </Field>
              <div className="row">
                <Field label={w.guestsBring}>
                  <select value={d.maxPlusOnes} onChange={(e) => set("maxPlusOnes", Number(e.target.value))}>
                    <option value={0}>{w.nobody}</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{w.upTo(n)}</option>
                    ))}
                  </select>
                </Field>
                <Field label={w.replyBy} error={fieldError("rsvpBy")}>
                  <input type="date" value={d.rsvpBy} onChange={(e) => set("rsvpBy", e.target.value)} />
                </Field>
              </div>
              <Check checked={d.allowMaybe} onChange={(v) => set("allowMaybe", v)}>{w.allowMaybe}</Check>
            </details>

            <div className="wizard-bar">
              <button className="btn-text" onClick={() => setStep(1)}>{w.back}</button>
              <button className="btn-main" onClick={() => checkDetails() && go(3)}>{w.preview}</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
