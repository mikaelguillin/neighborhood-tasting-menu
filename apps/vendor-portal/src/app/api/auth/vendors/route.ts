import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ error: "Server is missing Supabase admin configuration" }, { status: 503 });
  }

  let builder = supabase.from("vendors").select("id,name,slug").eq("status", "active").order("name", { ascending: true }).limit(100);

  if (query) {
    builder = builder.or(`name.ilike.%${query}%,slug.ilike.%${query}%`);
  }

  const { data, error } = await builder;

  if (error) {
    return NextResponse.json({ error: "Unable to load vendors" }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
