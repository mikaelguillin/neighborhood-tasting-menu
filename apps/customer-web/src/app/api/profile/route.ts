import { NextResponse } from "next/server";
import { requireCustomerUserId } from "@/lib/supabase-server";

type UserProfileRow = {
  email: string;
  full_name: string | null;
  phone: string | null;
  default_address: string | null;
};

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET() {
  const auth = await requireCustomerUserId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data: user } = await auth.supabase
    .from("users")
    .select("email, full_name, phone, default_address")
    .eq("id", auth.userId)
    .maybeSingle<UserProfileRow>();

  if (!user) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    email: user.email,
    fullName: user.full_name,
    phone: user.phone,
    defaultAddress: user.default_address,
  });
}

export async function PATCH(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        phone?: unknown;
        defaultAddress?: unknown;
      }
    | null;

  if (!payload) {
    return NextResponse.json({ error: "Invalid profile payload" }, { status: 400 });
  }

  const auth = await requireCustomerUserId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const phone = normalizeOptionalText(payload.phone);
  const defaultAddress = normalizeOptionalText(payload.defaultAddress);

  const { error } = await auth.supabase
    .from("users")
    .update({
      phone,
      default_address: defaultAddress,
      updated_at: new Date().toISOString(),
    })
    .eq("id", auth.userId);

  if (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
