import "@fontsource/shrikhand/400.css";
import "@fontsource/bagel-fat-one/400.css";
import "@fontsource-variable/familjen-grotesk";
import "@fontsource-variable/bodoni-moda/wght-italic.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./reveals.css";
import "./themes.css";

export const metadata: Metadata = {
  title: "Come Over: party invites they open by hand",
  description:
    "Make a party invite they open by knocking on a door, smashing a piñata or popping a popper. Send one link and track RSVPs. No app, no signup.",
};

export const viewport: Viewport = { themeColor: "#FFC928" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
