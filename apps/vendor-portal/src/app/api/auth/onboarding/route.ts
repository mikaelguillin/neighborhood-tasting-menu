import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const createPayloadSchema = z.object({
  mode: z.literal("create"),
  vendorName: z.string().trim().min(2).max(80),
  description: z.string().trim().max(280).optional(),
  neighborhoodSlugs: z.array(z.string().trim().min(1).max(80)).max(25).optional(),
});

const linkPayloadSchema = z.object({
  mode: z.literal("link"),
  vendorId: z.string().uuid(),
  neighborhoodSlugs: z.array(z.string().trim().min(1).max(80)).max(25).optional(),
});

const payloadSchema = z.union([createPayloadSchema, linkPayloadSchema]);

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function normalizeNeighborhoodSlugs(raw: string[] | undefined) {
  if (!raw) {
    return [];
  }

  return Array.from(
    new Set(
      raw
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

async function resolveUniqueSlug(supabase: ReturnType<typeof createSupabaseAdminClient>, vendorName: string) {
  const base = slugify(vendorName) || "vendor";

  for (let index = 0; index < 20; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const { data, error } = await supabase.from("vendors").select("id").eq("slug", candidate).maybeSingle();

    if (error) {
      throw new Error("Unable to check vendor slug uniqueness");
    }

    if (!data) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique vendor slug");
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: z.infer<typeof payloadSchema>;
  try {
    const body = await request.json();
    payload = payloadSchema.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ error: "Server is missing Supabase admin configuration" }, { status: 503 });
  }

  const { data: existingMembership, error: membershipError } = await admin
    .from("vendor_users")
    .select("vendor_id")
    .eq("user_id", authData.user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    return NextResponse.json({ error: "Unable to validate membership" }, { status: 500 });
  }

  if (existingMembership?.vendor_id) {
    return NextResponse.json({ error: "User is already linked to a vendor" }, { status: 409 });
  }

  const neighborhoodSlugs = normalizeNeighborhoodSlugs(payload.neighborhoodSlugs);

  let vendorId: string;

  if (payload.mode === "create") {
    const slug = await resolveUniqueSlug(admin, payload.vendorName);
    const { data: vendor, error: createError } = await admin
      .from("vendors")
      .insert({
        name: payload.vendorName,
        slug,
        description: payload.description?.trim() || null,
        status: "active",
      })
      .select("id")
      .single();

    if (createError || !vendor?.id) {
      return NextResponse.json({ error: "Unable to create vendor" }, { status: 500 });
    }

    vendorId = vendor.id;
  } else {
    const { data: vendor, error: vendorError } = await admin
      .from("vendors")
      .select("id")
      .eq("id", payload.vendorId)
      .eq("status", "active")
      .maybeSingle();

    if (vendorError) {
      return NextResponse.json({ error: "Unable to validate vendor" }, { status: 500 });
    }

    if (!vendor?.id) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    vendorId = vendor.id;
  }

  const { error: linkError } = await admin.from("vendor_users").insert({
    vendor_id: vendorId,
    user_id: authData.user.id,
    role: "owner",
  });

  if (linkError) {
    return NextResponse.json({ error: "Unable to link user to vendor" }, { status: 500 });
  }

  if (neighborhoodSlugs.length > 0) {
    const { data: neighborhoods, error: neighborhoodsError } = await admin
      .from("neighborhoods")
      .select("slug")
      .in("slug", neighborhoodSlugs);

    if (neighborhoodsError) {
      return NextResponse.json({ error: "Unable to validate neighborhoods" }, { status: 500 });
    }

    const validSlugs = new Set((neighborhoods ?? []).map((row) => row.slug));
    if (validSlugs.size !== neighborhoodSlugs.length) {
      return NextResponse.json({ error: "One or more neighborhoods are invalid" }, { status: 400 });
    }

    const rows = neighborhoodSlugs.map((neighborhoodSlug) => ({
      neighborhood_slug: neighborhoodSlug,
      vendor_id: vendorId,
    }));

    const { error: neighborhoodLinkError } = await admin.from("neighborhood_vendors").upsert(rows, {
      onConflict: "neighborhood_slug,vendor_id",
      ignoreDuplicates: true,
    });

    if (neighborhoodLinkError) {
      return NextResponse.json({ error: "Unable to link vendor to neighborhoods" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, vendorId });
}
