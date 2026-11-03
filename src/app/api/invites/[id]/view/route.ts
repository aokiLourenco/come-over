import { NextResponse } from "next/server";
import { allow, clientIp } from "@/lib/rate-limit";
import { countView } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (allow(`view:${clientIp(req)}:${id}`, 10, 3600_000)) countView(id);
  return new NextResponse(null, { status: 204 });
}
