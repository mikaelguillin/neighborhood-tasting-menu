import { NextResponse } from "next/server";
import {
  createVendorInventoryProduct,
  listVendorInventoryProductsWithNeighborhoods,
} from "@/lib/vendor-inventory-products-store";
import { requireVendorMembership } from "@/lib/supabase-server";

export async function GET() {
  const auth = await requireVendorMembership();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({
    items: await listVendorInventoryProductsWithNeighborhoods(auth.vendorId),
  });
}

export async function POST(request: Request) {
  const auth = await requireVendorMembership();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as
    | { name?: unknown; description?: unknown; neighborhoodSlugs?: unknown }
    | null;

  const name = typeof body?.name === "string" ? body.name : "";
  const description =
    body?.description === undefined
      ? undefined
      : typeof body.description === "string"
        ? body.description
        : null;
  const neighborhoodSlugs = Array.isArray(body?.neighborhoodSlugs)
    ? body.neighborhoodSlugs.filter((s): s is string => typeof s === "string")
    : undefined;

  const result = await createVendorInventoryProduct(auth.vendorId, {
    name,
    description,
    neighborhoodSlugs,
  });

  if (!result.ok) {
    if (result.reason === "invalid_neighborhoods") {
      return NextResponse.json(
        { error: "One or more neighborhoods are not assigned to your vendor" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: result.message ?? "Could not create product" }, { status: 500 });
  }

  return NextResponse.json({ item: result.item });
}
