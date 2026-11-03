import { COLORS, LIMITS, OCCASIONS, REVEALS, THEMES } from "./config.ts";
import type { ErrorKey } from "./i18n.ts";
import type { InviteInput } from "./types.ts";

type Result<T> = { ok: true; value: T } | { ok: false; error: ErrorKey; field?: string };

const LOCAL_DT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const LOCAL_D = /^\d{4}-\d{2}-\d{2}$/;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
function oneOf<T extends string>(v: unknown, list: readonly { id: T }[]): T | null {
  return list.find((x) => x.id === v)?.id ?? null;
}

/** Wall-clock at the party plus its UTC offset gives the real instant. */
export function localToUtc(local: string, tzOffsetMin: number): Date {
  const [d, t = "00:00"] = local.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [h, min] = t.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, day, h, min) + tzOffsetMin * 60_000);
}

function isRealLocal(local: string): boolean {
  const [d, t] = local.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [h, min] = t.split(":").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day, h, min));
  return dt.getUTCMonth() === m - 1 && dt.getUTCDate() === day && h < 24 && min < 60;
}

export function parseInvite(raw: unknown, opts: { now?: Date; allowPast?: boolean } = {}): Result<InviteInput> {
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "missing" };
  const r = raw as Record<string, unknown>;
  const now = opts.now ?? new Date();

  const occasion = oneOf(r.occasion, OCCASIONS);
  const reveal = oneOf(r.reveal, REVEALS);
  const color = oneOf(r.color, COLORS);
  const theme = oneOf(r.theme, THEMES);
  if (!occasion || !reveal || !color || !theme) {
    return { ok: false, error: "choices" };
  }

  const title = str(r.title, LIMITS.title);
  if (!title) return { ok: false, error: "title", field: "title" };
  const host = str(r.host, LIMITS.host);
  if (!host) return { ok: false, error: "host", field: "host" };

  const startLocal = str(r.startLocal, 16);
  if (!LOCAL_DT.test(startLocal) || !isRealLocal(startLocal)) {
    return { ok: false, error: "start", field: "startLocal" };
  }
  const tzOffsetMin = Number(r.tzOffsetMin);
  if (!Number.isInteger(tzOffsetMin) || Math.abs(tzOffsetMin) > 14 * 60) {
    return { ok: false, error: "timezone" };
  }
  if (!opts.allowPast && localToUtc(startLocal, tzOffsetMin) <= now) {
    return { ok: false, error: "past", field: "startLocal" };
  }

  const endLocal = str(r.endLocal, 16);
  if (endLocal) {
    if (!LOCAL_DT.test(endLocal) || !isRealLocal(endLocal)) {
      return { ok: false, error: "end", field: "endLocal" };
    }
    if (endLocal <= startLocal) {
      return { ok: false, error: "endBefore", field: "endLocal" };
    }
  }

  const rsvpBy = str(r.rsvpBy, 10);
  if (rsvpBy) {
    if (!LOCAL_D.test(rsvpBy) || !isRealLocal(`${rsvpBy}T00:00`)) {
      return { ok: false, error: "rsvpBy", field: "rsvpBy" };
    }
    if (rsvpBy > startLocal.slice(0, 10)) {
      return { ok: false, error: "rsvpAfter", field: "rsvpBy" };
    }
  }

  const songUrl = str(r.songUrl, LIMITS.songUrl);
  if (songUrl) {
    let ok = false;
    try {
      const u = new URL(songUrl);
      ok = u.protocol === "https:" || u.protocol === "http:";
    } catch {}
    if (!ok) return { ok: false, error: "song", field: "songUrl" };
  }

  const digits = str(r.rsvpPhone, 32).replace(/\D/g, "");
  if (digits && (digits.length < 8 || digits.length > 15)) {
    return { ok: false, error: "phone", field: "rsvpPhone" };
  }
  const rsvpEmail = str(r.rsvpEmail, 120);
  if (rsvpEmail && !/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(rsvpEmail)) {
    return { ok: false, error: "email", field: "rsvpEmail" };
  }

  const maxPlusOnes = Math.min(LIMITS.maxPlusOnes, Math.max(0, Math.trunc(Number(r.maxPlusOnes) || 0)));

  return {
    ok: true,
    value: {
      lang: r.lang === "pt" ? "pt" : "en",
      occasion,
      reveal,
      color,
      theme,
      title,
      host,
      startLocal,
      endLocal,
      tzOffsetMin,
      venue: str(r.venue, LIMITS.venue),
      address: str(r.address, LIMITS.address),
      message: str(r.message, LIMITS.message),
      dressCode: str(r.dressCode, LIMITS.dressCode),
      bring: str(r.bring, LIMITS.bring),
      songUrl,
      allowMaybe: r.allowMaybe !== false,
      maxPlusOnes,
      rsvpBy,
      rsvpPhone: digits,
      rsvpEmail,
    },
  };
}

export function rsvpIsOpen(invite: Pick<InviteInput, "startLocal" | "rsvpBy" | "tzOffsetMin">, now = new Date()): boolean {
  if (localToUtc(invite.startLocal, invite.tzOffsetMin) <= now) return false;
  if (invite.rsvpBy && localToUtc(`${invite.rsvpBy}T23:59`, invite.tzOffsetMin) < now) return false;
  return true;
}

export function partyIsOver(invite: Pick<InviteInput, "startLocal" | "endLocal" | "tzOffsetMin">, now = new Date()): boolean {
  const end = localToUtc(invite.endLocal || invite.startLocal, invite.tzOffsetMin);
  return end.getTime() + 12 * 3600_000 < now.getTime();
}
