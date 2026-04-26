import { createClient } from "@supabase/supabase-js";

function requireEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value =
    name === "SUPABASE_SERVICE_ROLE_KEY"
      ? process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE
      : process.env[name];
  if (!value) {
    if (name === "SUPABASE_SERVICE_ROLE_KEY") {
      throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE)");
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function createSupabaseAdminClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
