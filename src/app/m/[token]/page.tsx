import type { Metadata } from "next";
import { headers } from "next/headers";
import { ManageBoard } from "@/components/ManageBoard";
import { getInviteByManageToken, listGuests } from "@/lib/store";

export const metadata: Metadata = { title: "Your guest list | Come Over", robots: { index: false, follow: false } };

export default async function ManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { token } = await params;
  const { new: isNew } = await searchParams;
  const invite = getInviteByManageToken(token);
  if (!invite) {
    return (
      <main className="gone">
        <h1>This page isn't here</h1>
        <p>The invite may have been deleted, or the link may be incomplete. Check the full link you saved.</p>
        <a className="btn-main" href="/create">Make an invite</a>
      </main>
    );
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return <ManageBoard invite={invite} guests={listGuests(invite.id)} origin={`${proto}://${host}`} isNew={isNew === "1"} />;
}
