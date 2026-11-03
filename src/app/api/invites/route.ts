import { NextResponse } from "next/server";
import { allow, clientIp } from "@/lib/rate-limit";
import { createInvite } from "@/lib/store";
import { parseInvite, parsePhoto } from "@/lib/validate";

const MAX_BODY = 5 * 1024 * 1024;

export async function POST(req: Request) {
  if (!allow(`create:${clientIp(req)}`, 20, 3600_000)) {
    return NextResponse.json({ error: "Too many invites from this connection. Try again in an hour." }, { status: 429 });
  }
  const text = await req.text();
  if (text.length > MAX_BODY) return NextResponse.json({ error: "That photo is too large." }, { status: 413 });
  let body: { invite?: unknown; photo?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "The invite couldn't be read. Reload and try again." }, { status: 400 });
  }
  const parsed = parseInvite(body.invite);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 422 });

  let photo: { bytes: Buffer; type: string } | undefined;
  if (body.photo) {
    const p = parsePhoto(body.photo);
    if (!p.ok) return NextResponse.json({ error: p.error, field: p.field }, { status: 422 });
    photo = p.value;
  }
  return NextResponse.json(createInvite(parsed.value, photo), { status: 201 });
}
