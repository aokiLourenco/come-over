import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { allow, clientIp } from "@/lib/rate-limit";
import { getGuestByToken, getInvite, listGuests, rsvpIsOpen, saveRsvp, toPublicInvite } from "@/lib/store";
import { parseRsvp } from "@/lib/validate";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invite = getInvite(id);
  if (!invite) return NextResponse.json({ error: "This invite no longer exists." }, { status: 404 });
  if (!allow(`rsvp:${clientIp(req)}:${id}`, 30, 600_000)) {
    return NextResponse.json({ error: "Too many RSVPs from this connection. Try again in a few minutes." }, { status: 429 });
  }
  if (!rsvpIsOpen(invite)) {
    return NextResponse.json({ error: "RSVPs for this party have closed." }, { status: 409 });
  }
  const body = await req.json().catch(() => null);
  const parsed = parseRsvp(body, invite);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 422 });

  const jar = await cookies();
  const cookieName = `guest_${id}`;
  const { guest, token } = saveRsvp(id, jar.get(cookieName)?.value, parsed.value);
  jar.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  const current = getGuestByToken(id, token);
  const view = toPublicInvite(invite, current, listGuests(id));
  return NextResponse.json({ guest, invite: view });
}
