import { NextResponse } from "next/server";
import type { PlanId } from "@/lib/catalog-types";
import { createOrder, listOrders } from "@/lib/order-store";
import { requireCustomerUserId } from "@/lib/supabase-server";

export async function GET() {
  const auth = await requireCustomerUserId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({ items: await listOrders(auth.userId) });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        planId?: string;
        promoCode?: string;
        address?: string;
        deliveryWindow?: string;
      }
    | null;

  const auth = await requireCustomerUserId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const validPlanIds = new Set<PlanId>(["sampler", "weekly", "local-hero"]);
  const planId = payload?.planId as PlanId | undefined;
  const address = payload?.address?.trim() ?? "";
  const deliveryWindow = payload?.deliveryWindow?.trim() ?? "";

  if (!planId || !validPlanIds.has(planId) || address.length < 8 || deliveryWindow.length < 4) {
    return NextResponse.json(
      { error: "Invalid checkout payload" },
      { status: 400 },
    );
  }

  try {
    const order = await createOrder(auth.userId, {
      planId: planId as PlanId,
      promoCode: payload?.promoCode,
      address,
      deliveryWindow,
    });
    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
