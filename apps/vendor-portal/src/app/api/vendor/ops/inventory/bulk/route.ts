import { NextResponse } from "next/server";
import { bulkSetInventoryAvailability } from "@/lib/vendor-ops-store";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { ids?: string[]; available?: boolean }
    | null;

  if (!payload?.ids || !Array.isArray(payload.ids) || typeof payload.available !== "boolean") {
    return NextResponse.json({ error: "Invalid bulk inventory payload" }, { status: 400 });
  }

  return NextResponse.json({
    items: bulkSetInventoryAvailability(payload.ids, payload.available),
  });
}
