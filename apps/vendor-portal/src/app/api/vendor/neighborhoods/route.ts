import { NextResponse } from "next/server";
import {
  assignVendorToNeighborhood,
  getNycNeighborhoodSlugIfAssignable,
  listNycNeighborhoodsForPicker,
  listVendorNeighborhoodSlugs,
} from "@/lib/vendor-neighborhoods-store";
import { requireVendorMembership } from "@/lib/supabase-server";

export async function GET() {
  const auth = await requireVendorMembership();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [catalog, assignedSlugs] = await Promise.all([
    listNycNeighborhoodsForPicker(),
    listVendorNeighborhoodSlugs(auth.vendorId),
  ]);

  return NextResponse.json({ catalog, assignedSlugs });
}

export async function POST(request: Request) {
  const auth = await requireVendorMembership();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as { slug?: unknown } | null;
  const slugRaw = typeof body?.slug === "string" ? body.slug : "";
  const neighborhoodSlug = await getNycNeighborhoodSlugIfAssignable(slugRaw);

  if (!neighborhoodSlug) {
    return NextResponse.json(
      { error: "Neighborhood not found or not available in NYC boroughs" },
      { status: 400 },
    );
  }

  const result = await assignVendorToNeighborhood(auth.vendorId, neighborhoodSlug);

  if (result.ok) {
    return NextResponse.json({ ok: true as const, slug: neighborhoodSlug });
  }

  if (result.reason === "duplicate") {
    return NextResponse.json({ error: "Already assigned to this neighborhood" }, { status: 409 });
  }

  return NextResponse.json({ error: result.message ?? "Could not assign neighborhood" }, { status: 500 });
}
