import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Wizard } from "@/components/Wizard";
import { getInviteByManageToken } from "@/lib/store";

export const metadata: Metadata = { title: "Edit invite | Come Over", robots: { index: false, follow: false } };

export default async function EditPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = getInviteByManageToken(token);
  if (!invite) notFound();
  const { manageToken: _m, views: _v, id, hasPhoto, photoVersion, createdAt: _c, ...input } = invite;
  return <Wizard edit={{ token, invite: input, photoUrl: hasPhoto ? `/api/photos/${id}?v=${photoVersion}` : null }} />;
}
