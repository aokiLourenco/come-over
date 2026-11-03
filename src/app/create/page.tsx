import type { Metadata } from "next";
import { Wizard } from "@/components/Wizard";
import { REVEALS, type RevealId } from "@/lib/config";

export const metadata: Metadata = {
  title: "Make an invite | Come Over",
  description: "Pick a party, choose how it opens, add the details and get a link to send.",
};

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ reveal?: string }> }) {
  const { reveal } = await searchParams;
  const initial = REVEALS.find((r) => r.id === reveal)?.id as RevealId | undefined;
  return <Wizard initialReveal={initial} />;
}
