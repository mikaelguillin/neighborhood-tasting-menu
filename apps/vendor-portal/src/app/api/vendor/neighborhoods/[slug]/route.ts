import { NextResponse } from "next/server";
import { unassignVendorFromNeighborhood } from "@/lib/vendor-neighborhoods-store";
import { requireVendorMembership } from "@/lib/supabase-server";

export async function DELETE(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const auth = await requireVendorMembership();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { slug: encodedSlug } = await context.params;
  let neighborhoodSlug = encodedSlug;
  try {
    neighborhoodSlug = decodeURIComponent(encodedSlug);
  } catch {
    neighborhoodSlug = encodedSlug;
  }

  const removed = await unassignVendorFromNeighborhood(auth.vendorId, neighborhoodSlug);

  if (!removed) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true as const, slug: neighborhoodSlug });
}
