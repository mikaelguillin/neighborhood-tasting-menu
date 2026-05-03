import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const neighborhoodSlug = searchParams.get("neighborhoodSlug")?.trim();
  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ error: "Server is missing Supabase admin configuration" }, { status: 503 });
  }

  let builder = supabase
    .from("vendors")
    .select("id,name,slug,neighborhood_vendors!left(neighborhood_slug)")
    .eq("status", "active")
    .order("name", { ascending: true })
    .limit(100);

  if (query) {
    builder = builder.or(`name.ilike.%${query}%,slug.ilike.%${query}%`);
  }

  if (neighborhoodSlug) {
    builder = builder.eq("neighborhood_vendors.neighborhood_slug", neighborhoodSlug);
  }

  const { data, error } = await builder;

  if (error) {
    return NextResponse.json({ error: "Unable to load vendors" }, { status: 500 });
  }

  const items = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    neighborhoodSlugs: (row.neighborhood_vendors ?? []).map((entry) => entry.neighborhood_slug),
  }));

  return NextResponse.json({ items });
}
