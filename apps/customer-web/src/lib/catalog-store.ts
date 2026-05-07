import type { Neighborhood, NeighborhoodVendor, PlanOption } from "@/lib/catalog-types";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type SortOption = "featured" | "name-asc" | "name-desc";

function parseVendors(value: unknown): NeighborhoodVendor[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as { name?: unknown; craft?: unknown };
      if (typeof item.name !== "string" || typeof item.craft !== "string") return null;
      return { name: item.name, craft: item.craft };
    })
    .filter((entry): entry is NeighborhoodVendor => entry !== null);
}

function parseNeighborhoodVendors(value: unknown): NeighborhoodVendor[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as { vendors?: unknown };
      if (!row.vendors || typeof row.vendors !== "object") return null;
      const vendor = row.vendors as { name?: unknown; description?: unknown };
      if (typeof vendor.name !== "string") return null;
      return {
        name: vendor.name,
        craft: typeof vendor.description === "string" ? vendor.description : "Local maker",
      };
    })
    .filter((entry): entry is NeighborhoodVendor => entry !== null);
}

function toNeighborhood(
  row: {
    slug: string;
    name: string;
    borough: string;
    tagline: string;
    description: string;
    image_url: string;
    price_cents: number | null;
    neighborhood_vendors?: unknown;
    vendors?: unknown;
    highlight: boolean;
    badge: string | null;
  },
  /** Product display names from `vendor_inventory_product_neighborhoods` (tasting lineup). */
  items: string[],
): Neighborhood {
  const vendors = row.neighborhood_vendors
    ? parseNeighborhoodVendors(row.neighborhood_vendors)
    : parseVendors(row.vendors);

  return {
    slug: row.slug,
    name: row.name,
    borough: row.borough,
    tagline: row.tagline,
    description: row.description,
    image: row.image_url,
    priceCents: row.price_cents,
    vendors,
    items,
    highlight: row.highlight,
    badge: row.badge ?? undefined,
  };
}

type ProductNameEmbed = { name: string };

function productNameFromRow(products: ProductNameEmbed | ProductNameEmbed[] | null | undefined): string | null {
  const p = products;
  const row = Array.isArray(p) ? p[0] : p;
  return row?.name ?? null;
}

async function loadProductDisplayNamesByNeighborhoodSlug(): Promise<Map<string, string[]>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendor_inventory_product_neighborhoods")
    .select("neighborhood_slug,products(name)");

  if (error || !data) return new Map();

  const map = new Map<string, string[]>();
  for (const row of data) {
    const label = productNameFromRow(
      row.products as ProductNameEmbed | ProductNameEmbed[] | null | undefined,
    );
    if (!label) continue;
    const list = map.get(row.neighborhood_slug) ?? [];
    if (!list.includes(label)) list.push(label);
    map.set(row.neighborhood_slug, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.localeCompare(b));
  }
  return map;
}

async function listProductDisplayNamesForNeighborhoodSlug(slug: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendor_inventory_product_neighborhoods")
    .select("products(name)")
    .eq("neighborhood_slug", slug);

  if (error || !data) return [];
  const names = [
    ...new Set(
      data
        .map((r) =>
          productNameFromRow(r.products as ProductNameEmbed | ProductNameEmbed[] | null | undefined),
        )
        .filter((n): n is string => typeof n === "string" && n.length > 0),
    ),
  ];
  names.sort((a, b) => a.localeCompare(b));
  return names;
}

export async function listPlans(): Promise<PlanOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("plans")
    .select("id,name,cadence,price_cents,blurb,perks,featured")
    .order("price_cents", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    cadence: row.cadence,
    priceCents: row.price_cents,
    blurb: row.blurb,
    perks: row.perks,
    featured: row.featured,
  }));
}

export async function listNeighborhoods(params: {
  q: string;
  borough: string;
  sort: SortOption;
  page: number;
  pageSize: number;
}) {
  const supabase = await createSupabaseServerClient();
  const [nhResult, productBySlug] = await Promise.all([
    supabase
      .from("neighborhoods")
      .select(
        "slug,name,borough,tagline,description,image_url,price_cents,highlight,badge,neighborhood_vendors(vendors(name,description))",
      ),
    loadProductDisplayNamesByNeighborhoodSlug(),
  ]);

  const { data, error } = nhResult;

  if (error || !data) {
    return { items: [], total: 0, page: 1, pageSize: params.pageSize, totalPages: 1 };
  }

  const normalizedQ = params.q.trim().toLowerCase();
  const filtered = data
    .map((row) => toNeighborhood(row, productBySlug.get(row.slug) ?? []))
    .filter((neighborhood) => {
      if (params.borough !== "all" && neighborhood.borough !== params.borough) return false;
      if (!normalizedQ) return true;

      const haystack = [
        neighborhood.name,
        neighborhood.borough,
        neighborhood.tagline,
        neighborhood.description,
        ...neighborhood.items,
        ...neighborhood.vendors.map((vendor) => `${vendor.name} ${vendor.craft}`),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQ);
    });

  const sorted = [...filtered].sort((left, right) => {
    if (params.sort === "name-asc") return left.name.localeCompare(right.name);
    if (params.sort === "name-desc") return right.name.localeCompare(left.name);
    if (left.highlight === right.highlight) return left.name.localeCompare(right.name);
    return left.highlight ? -1 : 1;
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const page = Math.min(params.page, totalPages);
  const start = (page - 1) * params.pageSize;
  const items = sorted.slice(start, start + params.pageSize);

  return {
    items,
    total,
    page,
    pageSize: params.pageSize,
    totalPages,
  };
}

export async function getNeighborhoodBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();
  const [nhResult, productIds] = await Promise.all([
    supabase
      .from("neighborhoods")
      .select(
        "slug,name,borough,tagline,description,image_url,price_cents,highlight,badge,neighborhood_vendors(vendors(name,description))",
      )
      .eq("slug", slug)
      .maybeSingle(),
    listProductDisplayNamesForNeighborhoodSlug(slug),
  ]);

  const { data, error } = nhResult;

  if (error || !data) return null;
  return toNeighborhood(data, productIds);
}

export async function listNeighborhoodSlugs() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("neighborhoods").select("slug").order("name");
  if (error || !data) return [];
  return data.map((item) => item.slug);
}
