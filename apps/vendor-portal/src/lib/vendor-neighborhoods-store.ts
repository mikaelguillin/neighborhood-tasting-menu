import { NYC_BOROUGHS, type NeighborhoodPickerRow } from "@/lib/vendor-neighborhoods-constants";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type { NeighborhoodPickerRow } from "@/lib/vendor-neighborhoods-constants";

const NYC_BOROUGH_SET = new Set<string>(NYC_BOROUGHS);

export async function listNycNeighborhoodsForPicker(): Promise<NeighborhoodPickerRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("neighborhoods")
    .select("slug,name,borough,tagline")
    .in("borough", [...NYC_BOROUGHS])
    .order("borough", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => ({
    slug: row.slug,
    name: row.name,
    borough: row.borough,
    tagline: row.tagline,
  }));
}

export async function listVendorNeighborhoodSlugs(vendorId: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("neighborhood_vendors")
    .select("neighborhood_slug")
    .eq("vendor_id", vendorId);

  if (error || !data) return [];
  return data.map((r) => r.neighborhood_slug).sort((a, b) => a.localeCompare(b));
}

export type NeighborhoodProductSummary = { id: string; name: string };

type ProductJoinRow = { id: string; name: string };

/** Neighborhood slug → products linked via inventory junction (names sorted, deduped by product id). */
export async function listVendorProductsByNeighborhoodSlug(
  vendorId: string,
): Promise<Record<string, NeighborhoodProductSummary[]>> {
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("vendor_inventory_product_neighborhoods")
    .select("neighborhood_slug, products(id, name)")
    .eq("vendor_id", vendorId);

  if (error || !rows) return {};

  const bySlug = new Map<string, Map<string, NeighborhoodProductSummary>>();

  for (const row of rows) {
    const nested = row.products as ProductJoinRow | ProductJoinRow[] | null;
    const product = Array.isArray(nested) ? nested[0] : nested;
    if (!product?.id) continue;

    let idMap = bySlug.get(row.neighborhood_slug);
    if (!idMap) {
      idMap = new Map();
      bySlug.set(row.neighborhood_slug, idMap);
    }
    idMap.set(product.id, { id: product.id, name: product.name ?? "" });
  }

  const out: Record<string, NeighborhoodProductSummary[]> = {};
  for (const [slug, idMap] of bySlug) {
    out[slug] = [...idMap.values()].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }),
    );
  }
  return out;
}

/** Returns slug if the neighborhood exists and is in an NYC borough; otherwise null. */
export async function getNycNeighborhoodSlugIfAssignable(rawSlug: string): Promise<string | null> {
  const slug = rawSlug.trim();
  if (!slug) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("neighborhoods")
    .select("slug,borough")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  if (!NYC_BOROUGH_SET.has(data.borough)) return null;
  return data.slug;
}

export type AssignNeighborhoodResult =
  | { ok: true }
  | { ok: false; reason: "duplicate" | "db_error"; message?: string };

export async function assignVendorToNeighborhood(
  vendorId: string,
  neighborhoodSlug: string,
): Promise<AssignNeighborhoodResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("neighborhood_vendors").insert({
    vendor_id: vendorId,
    neighborhood_slug: neighborhoodSlug,
  });

  if (!error) return { ok: true };

  if (error.code === "23505") {
    return { ok: false, reason: "duplicate" };
  }
  return { ok: false, reason: "db_error", message: error.message };
}

export async function unassignVendorFromNeighborhood(vendorId: string, neighborhoodSlug: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("neighborhood_vendors")
    .delete()
    .eq("vendor_id", vendorId)
    .eq("neighborhood_slug", neighborhoodSlug)
    .select("neighborhood_slug");

  if (error) return false;
  return (data?.length ?? 0) > 0;
}
