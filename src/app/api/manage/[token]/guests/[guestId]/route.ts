import { NextResponse } from "next/server";
import { getInviteByManageToken, removeGuest } from "@/lib/store";

export async function DELETE(_req: Request, { params }: { params: Promise<{ token: string; guestId: string }> }) {
  const { token, guestId } = await params;
  const invite = getInviteByManageToken(token);
  if (!invite) return NextResponse.json({ error: "This invite no longer exists." }, { status: 404 });
  removeGuest(invite.id, guestId);
  return NextResponse.json({ ok: true });
}
