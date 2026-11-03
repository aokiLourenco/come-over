import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { DatabaseSync as DB } from "node:sqlite";
import type { Guest, Invite, InviteInput, PublicInvite, RsvpStatus } from "./types.ts";
import { localToUtc } from "./validate.ts";

const g = globalThis as unknown as { __comeOverDb?: DB };

function db(): DB {
  if (g.__comeOverDb) return g.__comeOverDb;
  const file = process.env.DATABASE_PATH ?? join(process.cwd(), "data", "come-over.db");
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  // getBuiltinModule keeps bundlers from trying to resolve node:sqlite.
  const { DatabaseSync } = process.getBuiltinModule("node:sqlite");
  const conn = new DatabaseSync(file);
  conn.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS invites (
      id TEXT PRIMARY KEY,
      manage_token TEXT NOT NULL UNIQUE,
      data TEXT NOT NULL,
      photo BLOB,
      photo_type TEXT,
      photo_version INTEGER NOT NULL DEFAULT 0,
      views INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS guests (
      id TEXT PRIMARY KEY,
      invite_id TEXT NOT NULL REFERENCES invites(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      plus_ones INTEGER NOT NULL DEFAULT 0,
      note TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS guests_invite ON guests(invite_id);
  `);
  g.__comeOverDb = conn;
  return conn;
}

const token = (bytes: number) => randomBytes(bytes).toString("base64url");

type InviteRow = {
  id: string;
  manage_token: string;
  data: string;
  has_photo: number;
  photo_version: number;
  views: number;
  created_at: string;
};
const INVITE_COLS = `id, manage_token, data, photo IS NOT NULL AS has_photo, photo_version, views, created_at`;

function toInvite(r: InviteRow): Invite {
  return {
    ...(JSON.parse(r.data) as InviteInput),
    id: r.id,
    manageToken: r.manage_token,
    hasPhoto: Boolean(r.has_photo),
    photoVersion: r.photo_version,
    views: r.views,
    createdAt: r.created_at,
  };
}

type GuestRow = {
  id: string;
  name: string;
  status: RsvpStatus;
  plus_ones: number;
  note: string;
  updated_at: string;
};
const toGuest = (r: GuestRow): Guest => ({
  id: r.id,
  name: r.name,
  status: r.status,
  plusOnes: r.plus_ones,
  note: r.note,
  updatedAt: r.updated_at,
});

export function createInvite(input: InviteInput, photo?: { bytes: Buffer; type: string }) {
  const id = token(8);
  const manageToken = token(24);
  db()
    .prepare(
      `INSERT INTO invites (id, manage_token, data, photo, photo_type, photo_version, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, manageToken, JSON.stringify(input), photo?.bytes ?? null, photo?.type ?? null, photo ? 1 : 0, new Date().toISOString());
  return { id, manageToken };
}

export function getInvite(id: string): Invite | null {
  const r = db().prepare(`SELECT ${INVITE_COLS} FROM invites WHERE id = ?`).get(id) as InviteRow | undefined;
  return r ? toInvite(r) : null;
}

export function getInviteByManageToken(t: string): Invite | null {
  const r = db().prepare(`SELECT ${INVITE_COLS} FROM invites WHERE manage_token = ?`).get(t) as InviteRow | undefined;
  return r ? toInvite(r) : null;
}

export function updateInvite(
  inviteId: string,
  input: InviteInput,
  photo?: { bytes: Buffer; type: string } | null,
) {
  const conn = db();
  conn.prepare(`UPDATE invites SET data = ? WHERE id = ?`).run(JSON.stringify(input), inviteId);
  if (photo === null) {
    conn.prepare(`UPDATE invites SET photo = NULL, photo_type = NULL WHERE id = ?`).run(inviteId);
  } else if (photo) {
    conn
      .prepare(`UPDATE invites SET photo = ?, photo_type = ?, photo_version = photo_version + 1 WHERE id = ?`)
      .run(photo.bytes, photo.type, inviteId);
  }
}

export function deleteInvite(inviteId: string) {
  db().prepare(`DELETE FROM invites WHERE id = ?`).run(inviteId);
}

export function getPhoto(id: string): { bytes: Uint8Array; type: string } | null {
  const r = db().prepare(`SELECT photo, photo_type FROM invites WHERE id = ?`).get(id) as
    | { photo: Uint8Array | null; photo_type: string | null }
    | undefined;
  return r?.photo && r.photo_type ? { bytes: r.photo, type: r.photo_type } : null;
}

export function countView(id: string) {
  db().prepare(`UPDATE invites SET views = views + 1 WHERE id = ?`).run(id);
}

export function listGuests(inviteId: string): Guest[] {
  const rows = db()
    .prepare(`SELECT * FROM guests WHERE invite_id = ? ORDER BY updated_at DESC`)
    .all(inviteId) as unknown as GuestRow[];
  return rows.map(toGuest);
}

export function getGuestByToken(inviteId: string, t: string | undefined): Guest | null {
  if (!t) return null;
  const r = db().prepare(`SELECT * FROM guests WHERE invite_id = ? AND token = ?`).get(inviteId, t) as
    | GuestRow
    | undefined;
  return r ? toGuest(r) : null;
}

/** A guest with a valid token updates their own row. Everyone else gets a new one. */
export function saveRsvp(
  inviteId: string,
  guestToken: string | undefined,
  rsvp: { name: string; status: RsvpStatus; plusOnes: number; note: string },
): { guest: Guest; token: string } {
  const conn = db();
  const now = new Date().toISOString();
  const existing = guestToken ? getGuestByToken(inviteId, guestToken) : null;
  if (existing && guestToken) {
    conn
      .prepare(`UPDATE guests SET name = ?, status = ?, plus_ones = ?, note = ?, updated_at = ? WHERE id = ?`)
      .run(rsvp.name, rsvp.status, rsvp.plusOnes, rsvp.note, now, existing.id);
    return { guest: { ...existing, ...rsvp, updatedAt: now }, token: guestToken };
  }
  const id = token(8);
  const t = token(24);
  conn
    .prepare(
      `INSERT INTO guests (id, invite_id, token, name, status, plus_ones, note, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, inviteId, t, rsvp.name, rsvp.status, rsvp.plusOnes, rsvp.note, now);
  return { guest: { id, ...rsvp, updatedAt: now }, token: t };
}

export function removeGuest(inviteId: string, guestId: string) {
  db().prepare(`DELETE FROM guests WHERE invite_id = ? AND id = ?`).run(inviteId, guestId);
}

export function rsvpIsOpen(invite: Pick<Invite, "startLocal" | "rsvpBy" | "tzOffsetMin">, now = new Date()): boolean {
  if (localToUtc(invite.startLocal, invite.tzOffsetMin) <= now) return false;
  if (invite.rsvpBy && localToUtc(`${invite.rsvpBy}T23:59`, invite.tzOffsetMin) < now) return false;
  return true;
}

/**
 * The single place a guest-facing invite is built. The address stays out of it
 * unless the host isn't hiding it or this guest has said yes.
 */
export function toPublicInvite(invite: Invite, guest: Guest | null, guests: Guest[], now = new Date()): PublicInvite {
  const { manageToken: _m, views: _v, tzOffsetMin, address, hideAddress, ...rest } = invite;
  const going = guests.filter((x) => x.status === "yes");
  const canSeeAddress = !hideAddress || guest?.status === "yes";
  const end = invite.endLocal || invite.startLocal;
  return {
    ...rest,
    address: canSeeAddress ? address : "",
    addressHidden: hideAddress && !canSeeAddress,
    startUtc: localToUtc(invite.startLocal, tzOffsetMin).toISOString(),
    rsvpOpen: rsvpIsOpen(invite, now),
    isOver: localToUtc(end, tzOffsetMin).getTime() + 12 * 3600_000 < now.getTime(),
    goingNames: invite.showGuestList ? going.map((x) => x.name.split(/\s+/)[0]) : [],
    goingCount: going.reduce((n, x) => n + 1 + x.plusOnes, 0),
  };
}
