import { cookies } from "next/headers";
import { buildIcs } from "@/lib/format";
import { getGuestByToken, getInvite, listGuests, toPublicInvite } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invite = getInvite(id);
  if (!invite) return new Response("Not found", { status: 404 });
  const jar = await cookies();
  const guest = getGuestByToken(id, jar.get(`guest_${id}`)?.value);
  // Goes through toPublicInvite so a hidden address stays hidden here too.
  const view = toPublicInvite(invite, guest, listGuests(id));
  const ics = buildIcs({
    uid: `${id}@come-over`,
    title: view.title,
    startLocal: view.startLocal,
    endLocal: view.endLocal,
    where: [view.venue, view.address].filter(Boolean).join(", "),
    details: `Hosted by ${view.host}`,
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="party.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
