"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STRINGS, type Lang } from "@/lib/i18n";
import { withGuestName } from "@/lib/seal";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function ShareScreen({
  fragment, code, title, lang, onEdit, onFresh,
}: {
  fragment: string; code: string; title: string; lang: Lang; onEdit: () => void; onFresh: () => void;
}) {
  const t = STRINGS[lang].share;
  const [copied, setCopied] = useState("");
  const [name, setName] = useState("");
  const [canShare, setCanShare] = useState(false);
  const link = `${window.location.origin}${BASE}/invite/#${withGuestName(fragment, name.trim())}`;
  const text = t.shareText(title);

  useEffect(() => {
    window.scrollTo(0, 0);
    setCanShare(typeof navigator.share === "function");
  }, []);

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(""), 1800);
  }

  return (
    <main className="manage">
      <nav className="wizard-top">
        <Link className="wordmark" href="/">Come Over</Link>
      </nav>
      <header className="manage-head">
        <p className="manage-created" role="status">{t.created}</p>
        <h1>{title}</h1>
      </header>

      <section className="share">
        <div className="share-link">
          <input readOnly value={link} aria-label={t.linkLabel} onFocus={(e) => e.target.select()} />
          <button className="btn-main" onClick={() => copy(link, "link")}>{copied === "link" ? t.linkCopied : t.copyLink}</button>
        </div>
        <div className="share-ways">
          {canShare && (
            <button className="chip" onClick={() => navigator.share({ title, text, url: link }).catch(() => {})}>{t.shareBtn}</button>
          )}
          <a className="chip" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`} target="_blank" rel="noreferrer">{t.whatsapp}</a>
          <a className="chip" href={`sms:?&body=${encodeURIComponent(`${text} ${link}`)}`}>{t.text}</a>
          <a className="chip" href={`mailto:?subject=${encodeURIComponent(t.emailSubject(title))}&body=${encodeURIComponent(`${text}\n\n${link}`)}`}>{t.email}</a>
          <a className="chip" href={link} target="_blank" rel="noreferrer">{t.open}</a>
        </div>
      </section>

      <section className="door-code">
        <h2>{t.codeTitle}</h2>
        <p className="door-code-value">{code}</p>
        <p>{t.codeNote}</p>
        <button className="btn-quiet" onClick={() => copy(code, "code")}>{copied === "code" ? t.codeCopied : t.copyCode}</button>
      </section>

      <label className="field share-name">
        <span className="field-label">{t.personal}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={t.personalPlaceholder} />
        <span className="field-hint">{t.personalHint}</span>
      </label>

      <section className="manage-private">
        <h2>{t.keepTitle}</h2>
        <p>{t.keepBody}</p>
      </section>

      <section className="manage-actions">
        <button className="btn-quiet" onClick={onEdit}>{t.edit}</button>
        <button className="btn-text" onClick={onFresh}>{t.fresh}</button>
        <p className="field-hint">{t.editNote}</p>
      </section>
    </main>
  );
}
