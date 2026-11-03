import type { Metadata } from "next";
import { InvitePage } from "@/components/InvitePage";

// A shared page for every invite: the details are in the URL fragment, read in the browser.
export const metadata: Metadata = {
  title: "You have an invite | Come Over",
  description: "Open your invite with your door code.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function Page() {
  return <InvitePage />;
}
