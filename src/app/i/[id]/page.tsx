import type { Metadata } from "next";
import { cookies } from "next/headers";
import { InviteExperience } from "@/components/InviteExperience";
import { formatDay } from "@/lib/format";
import { getGuestByToken, getInvite, listGuests, toPublicInvite } from "@/lib/store";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ to?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const invite = getInvite(id);
  if (!invite) return { title: "Invite not found | Come Over", robots: { index: false } };
  const title = `You're invited to ${invite.title}`;
  const description = `${invite.host} is hosting on ${formatDay(invite.startLocal)}. Open your invite to RSVP.`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "website" },
  };
}

export default async function InvitePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { to } = await searchParams;
  const invite = getInvite(id);
  if (!invite) {
    return (
      <main className="gone">
        <h1>This invite isn't here</h1>
        <p>The host may have deleted it, or the link may be incomplete. Ask them to send it again.</p>
        <a className="btn-main" href="/create">Make your own invite</a>
      </main>
    );
  }
  const jar = await cookies();
  const guest = getGuestByToken(id, jar.get(`guest_${id}`)?.value);
  const view = toPublicInvite(invite, guest, listGuests(id));
  return <InviteExperience invite={view} guest={guest} to={(to ?? "").trim().slice(0, 40)} />;
}
