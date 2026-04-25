import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function requireEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createServerClient(url, key, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });
}

export type VendorPortalUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
};

function normalizeVendorPortalUser(authUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): VendorPortalUser {
  const metadata = authUser.user_metadata ?? {};
  const metadataName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : "";
  const email = authUser.email ?? "";
  const fallbackName = email.includes("@") ? email.split("@")[0] : "Account";
  const avatar =
    typeof metadata.avatar_url === "string"
      ? metadata.avatar_url
      : typeof metadata.picture === "string"
        ? metadata.picture
        : "";

  return {
    id: authUser.id,
    name: metadataName.trim() || fallbackName || "Account",
    email,
    avatar,
    role: "vendor",
  };
}

export async function getVendorPortalUser() {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { user: null, supabase };
  }

  return {
    user: normalizeVendorPortalUser(authData.user),
    supabase,
  };
}

export async function requireVendorMembership() {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { error: "Unauthorized", status: 401 as const };
  }

  const { data: membership, error: memberError } = await supabase
    .from("vendor_users")
    .select("vendor_id")
    .eq("user_id", authData.user.id)
    .limit(1)
    .maybeSingle();

  if (memberError) {
    return { error: "Unable to resolve vendor membership", status: 500 as const };
  }

  if (!membership?.vendor_id) {
    return { error: "Forbidden", status: 403 as const };
  }

  return { supabase, userId: authData.user.id, vendorId: membership.vendor_id };
}
