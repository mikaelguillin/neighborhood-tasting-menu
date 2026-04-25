import { NextResponse } from "next/server";
import { bulkSetInventoryAvailability } from "@/lib/vendor-ops-store";
import { requireVendorMembership } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const auth = await requireVendorMembership();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => null)) as
    | { ids?: string[]; available?: boolean }
    | null;

  if (!payload?.ids || !Array.isArray(payload.ids) || typeof payload.available !== "boolean") {
    return NextResponse.json({ error: "Invalid bulk inventory payload" }, { status: 400 });
  }

  return NextResponse.json({
    items: await bulkSetInventoryAvailability(auth.vendorId, payload.ids, payload.available),
  });
}
