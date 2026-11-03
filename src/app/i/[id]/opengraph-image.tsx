import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { formatDay } from "@/lib/format";
import { getInvite } from "@/lib/store";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Shows up in chat link previews, so it never carries the address.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invite = getInvite(id);
  const font = await readFile(join(process.cwd(), "node_modules/@fontsource/shrikhand/files/shrikhand-latin-400-normal.woff"));
  return new ImageResponse(
    <div
      style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center",
        padding: 80, background: "#FFC928", color: "#1C1A9E", fontFamily: "Shrikhand",
      }}
    >
      <div style={{ fontSize: 44 }}>You're invited to</div>
      <div style={{ fontSize: invite && invite.title.length > 24 ? 92 : 128, lineHeight: 1.05, marginTop: 18 }}>
        {invite?.title ?? "a party"}
      </div>
      {invite && <div style={{ fontSize: 40, marginTop: 28 }}>{formatDay(invite.startLocal)}</div>}
    </div>,
    { ...size, fonts: [{ name: "Shrikhand", data: font, weight: 400, style: "normal" }] },
  );
}
