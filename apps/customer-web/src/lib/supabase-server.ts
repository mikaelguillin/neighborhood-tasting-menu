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
    cookieOptions: {
      // Isolate auth from vendor-portal on shared localhost/domain.
      name: "customer-web-auth",
    },
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components cannot mutate cookies; session refresh runs in Route Handlers / middleware.
        }
      },
      remove(name, options) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Same as set — ignore when not in a mutable request context.
        }
      },
    },
  });
}

export async function requireCustomerUserId() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { error: "Unauthorized", status: 401 as const };
  }

  return { userId: data.user.id, supabase };
}
