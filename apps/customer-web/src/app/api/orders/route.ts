import { NextResponse } from "next/server";
import { createOrder, listOrders } from "@/lib/order-store";

export async function GET() {
  return NextResponse.json({ items: listOrders() });
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

  const validPlanIds = new Set(["sampler", "weekly", "local-hero"]);
  const planId = payload?.planId;
  const address = payload?.address?.trim() ?? "";
  const deliveryWindow = payload?.deliveryWindow?.trim() ?? "";

  if (!planId || !validPlanIds.has(planId) || address.length < 8 || deliveryWindow.length < 4) {
    return NextResponse.json(
      { error: "Invalid checkout payload" },
      { status: 400 },
    );
  }

  const order = createOrder({
    planId: planId as "sampler" | "weekly" | "local-hero",
    promoCode: payload?.promoCode,
    address,
    deliveryWindow,
  });
  return NextResponse.json(order, { status: 201 });
}
