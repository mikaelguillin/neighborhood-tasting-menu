import { randomBytes } from "node:crypto";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { listVendorNeighborhoodSlugs } from "@/lib/vendor-neighborhoods-store";

export type VendorInventoryProductWithNeighborhoods = {
  id: string;
  productId: string;
  name: string;
  description: string | null;
  priceCents: number | null;
  neighborhoodSlugs: string[];
};

type ProductRow = { name: string; description: string | null; price_cents: number | null };

function newInventoryId(): string {
  return `inv_${randomBytes(6).toString("hex")}`;
}

async function replaceNeighborhoodLinks(vendorId: string, productId: string, slugs: string[]) {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("vendor_inventory_product_neighborhoods")
    .delete()
    .eq("vendor_id", vendorId)
    .eq("product_id", productId);

  if (slugs.length === 0) return;

  const rows = slugs.map((neighborhood_slug) => ({
    product_id: productId,
    neighborhood_slug,
    vendor_id: vendorId,
  }));

  await supabase.from("vendor_inventory_product_neighborhoods").insert(rows);
}

export async function listVendorInventoryProductsWithNeighborhoods(
  vendorId: string,
): Promise<VendorInventoryProductWithNeighborhoods[]> {
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("vendor_inventory_products")
    .select("id,product_id,products(name,description,price_cents)")
    .eq("vendor_id", vendorId)
    .order("name", { ascending: true, foreignTable: "products" });

  if (error || !rows) return [];

  const { data: links } = await supabase
    .from("vendor_inventory_product_neighborhoods")
    .select("product_id,neighborhood_slug")
    .eq("vendor_id", vendorId);

  const byProduct = new Map<string, string[]>();
  for (const l of links ?? []) {
    const list = byProduct.get(l.product_id) ?? [];
    list.push(l.neighborhood_slug);
    byProduct.set(l.product_id, list);
  }

  return rows.map((r) => {
    const p = r.products as ProductRow | ProductRow[] | null;
    const product = Array.isArray(p) ? p[0] : p;
    return {
      id: r.id,
      productId: r.product_id,
      name: product?.name ?? "",
      description: product?.description ?? null,
      priceCents: product?.price_cents ?? null,
      neighborhoodSlugs: (byProduct.get(r.product_id) ?? []).sort((a, b) => a.localeCompare(b)),
    };
  });
}

export async function createVendorInventoryProduct(
  vendorId: string,
  input: { name: string; description?: string | null; priceCents?: number | null; neighborhoodSlugs?: string[] },
): Promise<
  | { ok: true; item: VendorInventoryProductWithNeighborhoods }
  | { ok: false; reason: "invalid_neighborhoods" | "db_error"; message?: string }
> {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    return { ok: false, reason: "db_error", message: "name is required" };
  }

  const allowed = new Set(await listVendorNeighborhoodSlugs(vendorId));
  const requested = input.neighborhoodSlugs ?? [];
  const invalid = requested.filter((s) => !allowed.has(s));
  if (invalid.length > 0) {
    return { ok: false, reason: "invalid_neighborhoods" };
  }

  const supabase = await createSupabaseServerClient();
  const id = newInventoryId();
  const desc = input.description?.trim();
  const description = desc ? desc : null;
  const priceCents =
    typeof input.priceCents === "number" && Number.isFinite(input.priceCents)
      ? Math.trunc(input.priceCents)
      : null;
  if (priceCents !== null && priceCents < 0) {
    return { ok: false, reason: "db_error", message: "price must be 0 or higher" };
  }

  const { data: productRow, error: productErr } = await supabase
    .from("products")
    .insert({
      vendor_id: vendorId,
      name: trimmedName,
      description,
      price_cents: priceCents,
    })
    .select("id,name,description,price_cents")
    .maybeSingle();

  if (productErr || !productRow) {
    return { ok: false, reason: "db_error", message: productErr?.message ?? "Insert failed" };
  }

  const { data: inserted, error } = await supabase
    .from("vendor_inventory_products")
    .insert({
      id,
      vendor_id: vendorId,
      product_id: productRow.id,
      stock: 0,
      low_stock_threshold: 0,
      available: true,
    })
    .select("id,product_id")
    .maybeSingle();

  if (error || !inserted) {
    await supabase.from("products").delete().eq("id", productRow.id).eq("vendor_id", vendorId);
    return { ok: false, reason: "db_error", message: error?.message ?? "Insert failed" };
  }

  if (requested.length > 0) {
    await replaceNeighborhoodLinks(vendorId, productRow.id, requested);
  }

  return {
    ok: true,
    item: {
      id: inserted.id,
      productId: productRow.id,
      name: productRow.name,
      description: productRow.description,
      priceCents: productRow.price_cents,
      neighborhoodSlugs: [...requested].sort((a, b) => a.localeCompare(b)),
    },
  };
}

export async function updateVendorInventoryProductMeta(
  vendorId: string,
  inventoryId: string,
  input: { name?: string; description?: string | null; priceCents?: number | null },
): Promise<"ok" | "not_found" | "error"> {
  const supabase = await createSupabaseServerClient();
  const { data: existing, error: fetchErr } = await supabase
    .from("vendor_inventory_products")
    .select("product_id")
    .eq("vendor_id", vendorId)
    .eq("id", inventoryId)
    .maybeSingle();

  if (fetchErr || !existing) return "not_found";

  const patch: { name?: string; description?: string | null; price_cents?: number | null; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };
  if (typeof input.name === "string") {
    const t = input.name.trim();
    if (!t) return "error";
    patch.name = t;
  }
  if (input.description !== undefined) {
    if (input.description === null) {
      patch.description = null;
    } else {
      const d = input.description.trim();
      patch.description = d.length > 0 ? d : null;
    }
  }
  if (input.priceCents !== undefined) {
    if (input.priceCents === null) {
      patch.price_cents = null;
    } else if (Number.isFinite(input.priceCents)) {
      const cents = Math.trunc(input.priceCents);
      if (cents < 0) return "error";
      patch.price_cents = cents;
    } else {
      return "error";
    }
  }

  const { error } = await supabase
    .from("products")
    .update(patch)
    .eq("vendor_id", vendorId)
    .eq("id", existing.product_id);

  if (error) return "error";
  return "ok";
}

export async function deleteVendorInventoryProduct(vendorId: string, inventoryId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data: row, error: fetchErr } = await supabase
    .from("vendor_inventory_products")
    .select("product_id")
    .eq("vendor_id", vendorId)
    .eq("id", inventoryId)
    .maybeSingle();

  if (fetchErr || !row) return false;

  const { error } = await supabase.from("products").delete().eq("vendor_id", vendorId).eq("id", row.product_id);

  return !error;
}

export async function replaceVendorInventoryProductNeighborhoods(
  vendorId: string,
  inventoryId: string,
  slugs: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const allowed = new Set(await listVendorNeighborhoodSlugs(vendorId));
  const invalid = slugs.filter((s) => !allowed.has(s));
  if (invalid.length > 0) {
    return { ok: false, error: "One or more neighborhoods are not assigned to your vendor" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: row, error: fetchErr } = await supabase
    .from("vendor_inventory_products")
    .select("product_id")
    .eq("vendor_id", vendorId)
    .eq("id", inventoryId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: "Product not found" };
  }

  await replaceNeighborhoodLinks(vendorId, row.product_id, slugs);
  return { ok: true };
}
