import { NextResponse } from "next/server";
import { replaceVendorInventoryProductNeighborhoods } from "@/lib/vendor-inventory-products-store";
import { requireVendorMembership } from "@/lib/supabase-server";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorMembership();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as { slugs?: unknown } | null;
  const slugs = Array.isArray(body?.slugs) ? body.slugs.filter((s): s is string => typeof s === "string") : null;

  if (!slugs) {
    return NextResponse.json({ error: "Invalid payload: slugs array required" }, { status: 400 });
  }

  const { id } = await context.params;
  const result = await replaceVendorInventoryProductNeighborhoods(auth.vendorId, id, slugs);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true as const });
}
