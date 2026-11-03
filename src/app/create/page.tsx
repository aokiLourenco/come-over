import type { Metadata } from "next";
import { Wizard } from "@/components/Wizard";

export const metadata: Metadata = {
  title: "Make an invite | Come Over",
  description: "Pick a party, choose how it opens, add the details and get a link to send.",
};

export default function CreatePage() {
  return <Wizard />;
}
