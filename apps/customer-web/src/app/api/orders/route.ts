import { NextResponse } from "next/server";
import type { PlanId } from "@/lib/catalog-types";
import { parseCheckoutMetadata } from "@/lib/checkout-types";
import { listPlans } from "@/lib/catalog-store";
import { createOrder, listOrders } from "@/lib/order-store";
import { requireCustomerUserId } from "@/lib/supabase-server";

const PAYMENT_METHODS = ["card", "apple_pay", "cash"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

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
        paymentMethod?: string;
        checkoutMetadata?: unknown;
      }
    | null;

  const auth = await requireCustomerUserId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const availablePlans = await listPlans();
  const validPlanIds = new Set<PlanId>(availablePlans.map((plan) => plan.id));
  const planId = payload?.planId as PlanId | undefined;
  const address = payload?.address?.trim() ?? "";
  const deliveryWindow = payload?.deliveryWindow?.trim() ?? "";
  const paymentMethod = payload?.paymentMethod as PaymentMethod | undefined;

  if (!planId || !validPlanIds.has(planId)) {
    return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
  }
  if (address.length < 8) {
    return NextResponse.json({ error: "A valid delivery address is required" }, { status: 400 });
  }
  if (deliveryWindow.length < 4) {
    return NextResponse.json({ error: "A valid delivery window is required" }, { status: 400 });
  }
  if (!paymentMethod || !PAYMENT_METHODS.includes(paymentMethod)) {
    return NextResponse.json({ error: "A valid payment method is required" }, { status: 400 });
  }

  let checkoutMetadata = null;
  if (payload?.checkoutMetadata !== undefined) {
    const raw = JSON.stringify(payload.checkoutMetadata);
    if (raw.length > 16_000) {
      return NextResponse.json({ error: "Checkout metadata is too large" }, { status: 400 });
    }
    const parsed = parseCheckoutMetadata(payload.checkoutMetadata);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid checkout metadata" }, { status: 400 });
    }
    checkoutMetadata = parsed;
  }

  try {
    const order = await createOrder(auth.userId, {
      planId,
      promoCode: payload?.promoCode,
      address,
      deliveryWindow,
      paymentMethod,
      checkoutMetadata,
    });
    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
