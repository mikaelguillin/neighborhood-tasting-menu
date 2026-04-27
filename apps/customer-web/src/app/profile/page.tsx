import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Profile - Neighborhood Tasting Menu",
  description: "View and update your customer profile details.",
};

type UserProfileRow = {
  email: string;
  full_name: string | null;
  phone: string | null;
  default_address: string | null;
};

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("email, full_name, phone, default_address")
    .eq("id", user.id)
    .maybeSingle<UserProfileRow>();

  const fallbackFullName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;

  return (
    <section className="bg-canvas">
      <div className="mx-auto w-full max-w-[900px] px-4 pb-20 pt-12 md:px-6 lg:px-10 lg:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Your account
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-brand md:text-5xl">
          Profile settings
        </h1>
        <p className="mt-4 max-w-2xl text-base text-foreground/70">
          Keep your contact and delivery details up to date so checkout is faster.
        </p>

        <ProfileForm
          initialEmail={profile?.email ?? user.email ?? ""}
          initialFullName={profile?.full_name ?? fallbackFullName}
          initialPhone={profile?.phone || ""}
          initialDefaultAddress={profile?.default_address || ""}
        />
      </div>
    </section>
  );
}
