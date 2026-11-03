import { COLORS, LIMITS, OCCASIONS, REVEALS, THEMES } from "./config.ts";
import type { InviteInput, RsvpStatus } from "./types.ts";

type Result<T> = { ok: true; value: T } | { ok: false; error: string; field?: string };

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
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "The invite data is missing." };
  const r = raw as Record<string, unknown>;
  const now = opts.now ?? new Date();

  const occasion = oneOf(r.occasion, OCCASIONS);
  const reveal = oneOf(r.reveal, REVEALS);
  const color = oneOf(r.color, COLORS);
  const theme = oneOf(r.theme, THEMES);
  if (!occasion || !reveal || !color || !theme) {
    return { ok: false, error: "Pick an occasion, a reveal, a color and a card design." };
  }

  const title = str(r.title, LIMITS.title);
  if (!title) return { ok: false, error: "Give the party a name.", field: "title" };
  const host = str(r.host, LIMITS.host);
  if (!host) return { ok: false, error: "Add who's hosting.", field: "host" };

  const startLocal = str(r.startLocal, 16);
  if (!LOCAL_DT.test(startLocal) || !isRealLocal(startLocal)) {
    return { ok: false, error: "Add the date and start time.", field: "startLocal" };
  }
  const tzOffsetMin = Number(r.tzOffsetMin);
  if (!Number.isInteger(tzOffsetMin) || Math.abs(tzOffsetMin) > 14 * 60) {
    return { ok: false, error: "The party's time zone couldn't be read. Reload and try again." };
  }
  if (!opts.allowPast && localToUtc(startLocal, tzOffsetMin) <= now) {
    return { ok: false, error: "That date has passed. Pick one in the future.", field: "startLocal" };
  }

  const endLocal = str(r.endLocal, 16);
  if (endLocal) {
    if (!LOCAL_DT.test(endLocal) || !isRealLocal(endLocal)) {
      return { ok: false, error: "That end time isn't valid.", field: "endLocal" };
    }
    if (endLocal <= startLocal) {
      return { ok: false, error: "The end time needs to be after the start time.", field: "endLocal" };
    }
  }

  const rsvpBy = str(r.rsvpBy, 10);
  if (rsvpBy) {
    if (!LOCAL_D.test(rsvpBy) || !isRealLocal(`${rsvpBy}T00:00`)) {
      return { ok: false, error: "That RSVP date isn't valid.", field: "rsvpBy" };
    }
    if (rsvpBy > startLocal.slice(0, 10)) {
      return { ok: false, error: "The RSVP date needs to be on or before the party.", field: "rsvpBy" };
    }
  }

  const songUrl = str(r.songUrl, LIMITS.songUrl);
  if (songUrl) {
    let ok = false;
    try {
      const u = new URL(songUrl);
      ok = u.protocol === "https:" || u.protocol === "http:";
    } catch {}
    if (!ok) return { ok: false, error: "Paste a full song link starting with https://", field: "songUrl" };
  }

  const address = str(r.address, LIMITS.address);
  const maxPlusOnes = Math.min(LIMITS.maxPlusOnes, Math.max(0, Math.trunc(Number(r.maxPlusOnes) || 0)));

  return {
    ok: true,
    value: {
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
      address,
      hideAddress: Boolean(r.hideAddress) && Boolean(address),
      message: str(r.message, LIMITS.message),
      dressCode: str(r.dressCode, LIMITS.dressCode),
      bring: str(r.bring, LIMITS.bring),
      songUrl,
      allowMaybe: r.allowMaybe !== false,
      maxPlusOnes,
      showGuestList: Boolean(r.showGuestList),
      rsvpBy,
    },
  };
}

export function parseRsvp(
  raw: unknown,
  invite: { allowMaybe: boolean; maxPlusOnes: number },
): Result<{ name: string; status: RsvpStatus; plusOnes: number; note: string }> {
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "The RSVP is missing." };
  const r = raw as Record<string, unknown>;
  const name = str(r.name, LIMITS.guestName);
  if (!name) return { ok: false, error: "Add your name so the host knows who's coming.", field: "name" };
  const status = r.status;
  if (status !== "yes" && status !== "no" && !(status === "maybe" && invite.allowMaybe)) {
    return { ok: false, error: "Choose whether you're coming.", field: "status" };
  }
  const wanted = Math.trunc(Number(r.plusOnes) || 0);
  const plusOnes = status === "no" ? 0 : Math.min(invite.maxPlusOnes, Math.max(0, wanted));
  return { ok: true, value: { name, status, plusOnes, note: str(r.note, LIMITS.guestNote) } };
}

/** Accepts a data URL from the browser. Only real JPEG, PNG or WebP bytes get through. */
export function parsePhoto(dataUrl: unknown): Result<{ bytes: Buffer; type: string }> {
  if (typeof dataUrl !== "string") return { ok: false, error: "That photo couldn't be read.", field: "photo" };
  const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(dataUrl);
  if (!m) return { ok: false, error: "Use a JPEG, PNG or WebP photo.", field: "photo" };
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length > LIMITS.photoBytes) {
    return { ok: false, error: "That photo is too large. Use one under 3 MB.", field: "photo" };
  }
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isWebp = bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP";
  const expected = m[1] === "jpeg" ? isJpeg : m[1] === "png" ? isPng : isWebp;
  if (!expected) return { ok: false, error: "That file isn't a real image.", field: "photo" };
  return { ok: true, value: { bytes, type: `image/${m[1]}` } };
}
