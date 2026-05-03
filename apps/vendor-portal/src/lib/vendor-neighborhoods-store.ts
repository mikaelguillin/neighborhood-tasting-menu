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
