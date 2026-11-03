"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { STRINGS, type Lang } from "@/lib/i18n";
import { isValidCode, openInvite, parseFragment, type Sealed } from "@/lib/seal";
import type { InviteInput } from "@/lib/types";
import { parseInvite } from "@/lib/validate";
import { InviteExperience } from "./InviteExperience";

type View = { kind: "loading" } | { kind: "bad"; lang: Lang } | { kind: "gate"; sealed: Sealed } | { kind: "open"; sealed: Sealed; invite: InviteInput };

function CodeGate({ sealed, onOpen }: { sealed: Sealed; onOpen: (invite: InviteInput) => void }) {
  const t = STRINGS[sealed.lang];
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);

  async function attempt(value: string) {
    setBusy(true);
    const raw = await openInvite(sealed, value);
    // Anyone can craft a link, so decrypted data gets the same checks as the form.
    const parsed = raw ? parseInvite(raw, { allowPast: true }) : null;
    if (parsed?.ok) {
      sessionStorage.setItem(`code:${sealed.id}`, value);
      onOpen(parsed.value);
      return;
    }
    setBusy(false);
    setWrong(true);
    setCode("");
    input.current?.focus();
  }

  function change(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setCode(digits);
    if (digits) setWrong(false);
    if (isValidCode(digits)) void attempt(digits);
  }

  return (
    <main className="gate" lang={sealed.lang === "pt" ? "pt-BR" : "en"}>
      <h1>{t.gate.title}</h1>
      <p>{t.gate.body}</p>
      <div className="gate-cells" data-wrong={wrong} onClick={() => input.current?.focus()}>
        <input
          ref={input}
          className="gate-input"
          value={code}
          onChange={(e) => change(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          disabled={busy}
          aria-label={t.gate.label}
          aria-invalid={wrong}
          aria-describedby="gate-status"
        />
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="gate-cell" data-active={!busy && i === code.length} aria-hidden="true">
            {code[i] ?? ""}
          </span>
        ))}
      </div>
      <p id="gate-status" className="gate-status" role={wrong ? "alert" : undefined}>
        {busy ? t.gate.checking : wrong ? t.gate.wrong : " "}
      </p>
    </main>
  );
}

export function InvitePage() {
  const [view, setView] = useState<View>({ kind: "loading" });

  useEffect(() => {
    const load = async () => {
      const sealed = parseFragment(window.location.hash);
      if (!sealed) {
        const lang: Lang = navigator.language.toLowerCase().startsWith("pt") ? "pt" : "en";
        setView({ kind: "bad", lang });
        return;
      }
      document.documentElement.lang = sealed.lang === "pt" ? "pt-BR" : "en";
      const remembered = sessionStorage.getItem(`code:${sealed.id}`);
      if (remembered) {
        const raw = await openInvite(sealed, remembered);
        const parsed = raw ? parseInvite(raw, { allowPast: true }) : null;
        if (parsed?.ok) {
          setView({ kind: "open", sealed, invite: parsed.value });
          return;
        }
      }
      setView({ kind: "gate", sealed });
    };
    void load();
    window.addEventListener("hashchange", load);
    return () => window.removeEventListener("hashchange", load);
  }, []);

  if (view.kind === "loading") return <main className="gate" />;
  if (view.kind === "bad") {
    const t = STRINGS[view.lang];
    return (
      <main className="gone">
        <h1>{t.gate.badTitle}</h1>
        <p>{t.gate.badBody}</p>
        <Link className="btn-main" href={`/create/?lang=${view.lang}`}>{t.makeYourOwn}</Link>
      </main>
    );
  }
  if (view.kind === "gate") {
    const { sealed } = view;
    return <CodeGate key={sealed.id} sealed={sealed} onOpen={(invite) => setView({ kind: "open", sealed, invite })} />;
  }
  return <InviteExperience key={view.sealed.id} invite={view.invite} to={view.sealed.to} inviteKey={view.sealed.id} />;
}
