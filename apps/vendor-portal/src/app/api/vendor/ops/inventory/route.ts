import { NextResponse } from "next/server";
import { getInventoryItems } from "@/lib/vendor-ops-store";
import { requireVendorMembership } from "@/lib/supabase-server";

export async function GET() {
  const auth = await requireVendorMembership();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({ items: await getInventoryItems(auth.vendorId) });
}
