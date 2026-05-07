import { NextResponse } from "next/server";
import {
  deleteVendorInventoryProduct,
  updateVendorInventoryProductMeta,
} from "@/lib/vendor-inventory-products-store";
import { requireVendorMembership } from "@/lib/supabase-server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorMembership();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as
    | { name?: unknown; description?: unknown; priceCents?: unknown }
    | null;

  const patch: { name?: string; description?: string | null; priceCents?: number | null } = {};
  if (body && typeof body.name === "string") {
    patch.name = body.name;
  }
  if (body && "description" in body) {
    if (body.description === null) {
      patch.description = null;
    } else if (typeof body.description === "string") {
      const t = body.description.trim();
      patch.description = t.length > 0 ? t : null;
    }
  }
  if (body && "priceCents" in body) {
    if (body.priceCents === null) {
      patch.priceCents = null;
    } else if (typeof body.priceCents === "number" && Number.isFinite(body.priceCents)) {
      patch.priceCents = Math.trunc(body.priceCents);
    } else {
      return NextResponse.json({ error: "priceCents must be a number or null" }, { status: 400 });
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Provide name, description, and/or priceCents" }, { status: 400 });
  }

  const { id } = await context.params;
  const outcome = await updateVendorInventoryProductMeta(auth.vendorId, id, patch);

  if (outcome === "not_found") {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  if (outcome === "error") {
    return NextResponse.json({ error: "Could not update product" }, { status: 400 });
  }

  return NextResponse.json({ ok: true as const });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorMembership();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const ok = await deleteVendorInventoryProduct(auth.vendorId, id);

  if (!ok) {
    return NextResponse.json({ error: "Could not delete product" }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const });
}
