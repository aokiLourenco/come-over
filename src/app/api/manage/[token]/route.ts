import { NextResponse } from "next/server";
import { deleteInvite, getInviteByManageToken, updateInvite } from "@/lib/store";
import { parseInvite, parsePhoto } from "@/lib/validate";

type Ctx = { params: Promise<{ token: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { token } = await params;
  const invite = getInviteByManageToken(token);
  if (!invite) return NextResponse.json({ error: "This invite no longer exists." }, { status: 404 });
  const body = await req.json().catch(() => null);
  // A party already underway can still have its details corrected.
  const parsed = parseInvite(body?.invite, { allowPast: true });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 422 });

  let photo: { bytes: Buffer; type: string } | null | undefined;
  if (body.photo === null) photo = null;
  else if (body.photo) {
    const p = parsePhoto(body.photo);
    if (!p.ok) return NextResponse.json({ error: p.error, field: p.field }, { status: 422 });
    photo = p.value;
  }
  updateInvite(invite.id, parsed.value, photo);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { token } = await params;
  const invite = getInviteByManageToken(token);
  if (!invite) return NextResponse.json({ error: "This invite no longer exists." }, { status: 404 });
  deleteInvite(invite.id);
  return NextResponse.json({ ok: true });
}
