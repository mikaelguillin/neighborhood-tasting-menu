import type { PlanId } from "@/lib/catalog-types";
import type { CheckoutMetadata } from "@/lib/checkout-types";
import { computeOrderTotals } from "@/lib/order-pricing";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type OrderStatus =
  | "placed"
  | "payment_confirmed"
  | "in_preparation"
  | "out_for_delivery"
  | "delivered";

export type PaymentMethod = "card" | "apple_pay" | "cash";

export type OrderTimelineEvent = {
  status: OrderStatus;
  label: string;
  timestamp: string;
  note: string;
};

export type OrderRecord = {
  id: string;
  planId: PlanId;
  planName: string;
  status: OrderStatus;
  subtotalCents: number;
  deliveryFeeCents: number;
  serviceFeeCents: number;
  discountCents: number;
  totalCents: number;
  promoCode: string | null;
  paymentMethod: PaymentMethod;
  address: string;
  deliveryWindow: string;
  createdAt: string;
  timeline: OrderTimelineEvent[];
};

const STATUS_FLOW: OrderStatus[] = [
  "placed",
  "payment_confirmed",
  "in_preparation",
  "out_for_delivery",
  "delivered",
];

const STATUS_META: Record<OrderStatus, { label: string; note: string }> = {
  placed: {
    label: "Order placed",
    note: "We received your order and reserved your neighborhood box.",
  },
  payment_confirmed: {
    label: "Payment confirmed",
    note: "Payment confirmation recorded for your selected checkout method.",
  },
  in_preparation: {
    label: "In preparation",
    note: "Makers are assembling your box for the upcoming delivery cycle.",
  },
  out_for_delivery: {
    label: "Out for delivery",
    note: "Your box is on the route and heading to your building.",
  },
  delivered: {
    label: "Delivered",
    note: "Your box has been delivered. Enjoy the neighborhood drop.",
  },
};

function createTimelineEvent(status: OrderStatus): OrderTimelineEvent {
  const meta = STATUS_META[status];
  return {
    status,
    label: meta.label,
    note: meta.note,
    timestamp: new Date().toISOString(),
  };
}

type DbTimelineRow = {
  status: OrderStatus;
  label: string;
  note: string;
  event_at: string;
};

type DbOrderRow = {
  id: string;
  plan_id: PlanId;
  plan_name: string;
  status: OrderStatus;
  subtotal_cents: number;
  delivery_fee_cents: number;
  service_fee_cents: number;
  discount_cents: number;
  total_cents: number;
  promo_code: string | null;
  payment_method: PaymentMethod;
  address: string;
  delivery_window: string;
  created_at: string;
  order_timeline_events?: DbTimelineRow[];
};

function toOrderRecord(row: DbOrderRow): OrderRecord {
  return {
    id: row.id,
    planId: row.plan_id,
    planName: row.plan_name,
    status: row.status,
    subtotalCents: row.subtotal_cents,
    deliveryFeeCents: row.delivery_fee_cents,
    serviceFeeCents: row.service_fee_cents,
    discountCents: row.discount_cents,
    totalCents: row.total_cents,
    promoCode: row.promo_code,
    paymentMethod: row.payment_method,
    address: row.address,
    deliveryWindow: row.delivery_window,
    createdAt: row.created_at,
    timeline: (row.order_timeline_events ?? []).map((event) => ({
      status: event.status,
      label: event.label,
      note: event.note,
      timestamp: event.event_at,
    })),
  };
}

async function getPlanById(planId: PlanId) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("plans")
    .select("id,name,price_cents")
    .eq("id", planId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function listOrders(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,plan_id,plan_name,status,subtotal_cents,delivery_fee_cents,service_fee_cents,discount_cents,total_cents,promo_code,payment_method,address,delivery_window,created_at,order_timeline_events(status,label,note,event_at)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("event_at", {
      foreignTable: "order_timeline_events",
      ascending: true,
    });

  if (error || !data) return [];
  return (data as DbOrderRow[]).map(toOrderRecord);
}

export async function getOrder(id: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,plan_id,plan_name,status,subtotal_cents,delivery_fee_cents,service_fee_cents,discount_cents,total_cents,promo_code,payment_method,address,delivery_window,created_at,order_timeline_events(status,label,note,event_at)",
    )
    .eq("id", id)
    .eq("user_id", userId)
    .order("event_at", {
      foreignTable: "order_timeline_events",
      ascending: true,
    })
    .maybeSingle();

  if (error || !data) return null;
  return toOrderRecord(data as DbOrderRow);
}

export async function createOrder(
  userId: string,
  input: {
    planId: PlanId;
    promoCode?: string;
    address: string;
    deliveryWindow: string;
    paymentMethod: PaymentMethod;
    checkoutMetadata?: CheckoutMetadata | null;
  },
) {
  const plan = await getPlanById(input.planId);
  if (!plan) {
    throw new Error("Unknown plan");
  }
  const promoCode = input.promoCode?.trim() ? input.promoCode.trim() : null;
  const totals = computeOrderTotals(plan.price_cents, promoCode);
  const id = `ord_${Date.now().toString(36)}`;
  const supabase = await createSupabaseServerClient();
  const createdAt = new Date().toISOString();

  const timeline = createTimelineEvent("placed");

  const { error: insertOrderError } = await supabase.from("orders").insert({
    id,
    user_id: userId,
    plan_id: input.planId,
    plan_name: plan.name,
    status: "placed",
    subtotal_cents: plan.price_cents,
    delivery_fee_cents: totals.deliveryFeeCents,
    service_fee_cents: totals.serviceFeeCents,
    discount_cents: totals.discountCents,
    total_cents: totals.totalCents,
    promo_code: promoCode,
    payment_method: input.paymentMethod,
    address: input.address,
    delivery_window: input.deliveryWindow,
    created_at: createdAt,
    checkout_metadata: input.checkoutMetadata ?? null,
  });

  if (insertOrderError) {
    throw insertOrderError;
  }

  const { error: timelineError } = await supabase
    .from("order_timeline_events")
    .insert({
      order_id: id,
      status: timeline.status,
      label: timeline.label,
      note: timeline.note,
      event_at: timeline.timestamp,
    });

  if (timelineError) {
    throw timelineError;
  }

  const order = await getOrder(id, userId);
  if (!order) {
    throw new Error("Failed to load created order");
  }
  return order;
}

export async function advanceOrderStatus(id: string, userId: string) {
  const order = await getOrder(id, userId);
  if (!order) return null;

  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const next = STATUS_FLOW[currentIndex + 1];

  if (!next) {
    return order;
  }

  const supabase = await createSupabaseServerClient();
  const nextTimeline = createTimelineEvent(next);

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: next,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (updateError) {
    throw updateError;
  }

  const { error: timelineError } = await supabase
    .from("order_timeline_events")
    .insert({
      order_id: id,
      status: nextTimeline.status,
      label: nextTimeline.label,
      note: nextTimeline.note,
      event_at: nextTimeline.timestamp,
    });

  if (timelineError) {
    throw timelineError;
  }

  return getOrder(id, userId);
}
