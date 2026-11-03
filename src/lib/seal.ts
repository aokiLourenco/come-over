import type { Lang } from "./i18n.ts";
import type { InviteInput } from "./types.ts";

// The invite lives in the URL fragment, which browsers never send to a server, so
// GitHub Pages only ever serves the empty page. AES-GCM keyed from the 4-digit code
// keeps the details out of the link text, and the GCM tag is how a wrong code is detected.
//
// This stops someone who has the link but not the code from casually reading it. It is not
// strong encryption: 10,000 codes can be tried offline, and a static site can't limit attempts.

const VERSION = "v1";
const ITERATIONS = 300_000;

export const isValidCode = (code: string) => /^\d{4}$/.test(code);

export function randomCode() {
  return String(crypto.getRandomValues(new Uint16Array(1))[0] % 10_000).padStart(4, "0");
}

function toB64(bytes: Uint8Array) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64(text: string) {
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: { readable: ReadableStream; writable: WritableStream }) {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

async function keyFor(code: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: ITERATIONS },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export type Sealed = { lang: Lang; salt: Uint8Array; iv: Uint8Array; data: Uint8Array; to: string; id: string };

/** Returns the URL fragment. The language stays readable so the code screen can be translated. */
export async function sealInvite(invite: InviteInput, code: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const packed = await pipe(new TextEncoder().encode(JSON.stringify(invite)), new CompressionStream("deflate-raw"));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, await keyFor(code, salt), packed as BufferSource);
  return [VERSION, invite.lang, toB64(salt), toB64(iv), toB64(new Uint8Array(data))].join(".");
}

/** Adds a guest's name for the greeting. It's only encoded, and stays in the fragment. */
export function withGuestName(fragment: string, name: string) {
  const base = fragment.split(".").slice(0, 5).join(".");
  return name ? `${base}.${toB64(new TextEncoder().encode(name))}` : base;
}

export function parseFragment(fragment: string): Sealed | null {
  const [version, lang, salt, iv, data, to] = fragment.replace(/^#/, "").split(".");
  if (version !== VERSION || (lang !== "en" && lang !== "pt") || !salt || !iv || !data || data.length > 40_000) return null;
  try {
    return {
      lang,
      salt: fromB64(salt),
      iv: fromB64(iv),
      data: fromB64(data),
      to: to ? new TextDecoder().decode(fromB64(to)).trim().slice(0, 40) : "",
      id: salt,
    };
  } catch {
    return null;
  }
}

/** Resolves to the raw decoded invite, or null for a wrong code. Validate the result: anyone can craft a link. */
export async function openInvite(sealed: Sealed, code: string): Promise<unknown | null> {
  try {
    const key = await keyFor(code, sealed.salt);
    const packed = await crypto.subtle.decrypt({ name: "AES-GCM", iv: sealed.iv as BufferSource }, key, sealed.data as BufferSource);
    const json = await pipe(new Uint8Array(packed), new DecompressionStream("deflate-raw"));
    return JSON.parse(new TextDecoder().decode(json));
  } catch {
    return null;
  }
}
