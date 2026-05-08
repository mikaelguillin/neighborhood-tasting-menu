import type { PlanId } from "@ntm/types";
import type { CheckoutMetadata } from "@/lib/checkout-types";
import { orderCanBeCancelled } from "@/lib/order-status";
import { computeOrderTotals } from "@/lib/order-pricing";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type OrderStatus =
  | "placed"
  | "payment_confirmed"
  | "in_preparation"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "card" | "apple_pay" | "cash";

export type OrderTimelineEvent = {
  status: OrderStatus;
  label: string;
  timestamp: string;
  note: string;
};

export type OrderRecord = {
  id: string;
  planId: PlanId | null;
  neighborhoodId: string | null;
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
  cancelled: {
    label: "Order cancelled",
    note: "This order was cancelled at your request.",
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
  plan_id: PlanId | null;
  neighborhood_id: string | null;
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

function toOrderRecord(row: DbOrderRow, planName: string): OrderRecord {
  return {
    id: row.id,
    planId: row.plan_id,
    neighborhoodId: row.neighborhood_id,
    planName,
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

async function getNeighborhoodPriceAndName(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("neighborhoods")
    .select("slug,name,price_cents")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as { slug: string; name: string; price_cents: number | null };
}

export async function listOrders(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,plan_id,neighborhood_id,status,subtotal_cents,delivery_fee_cents,service_fee_cents,discount_cents,total_cents,promo_code,payment_method,address,delivery_window,created_at,order_timeline_events(status,label,note,event_at)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("event_at", {
      foreignTable: "order_timeline_events",
      ascending: true,
    });

  if (error || !data) return [];

  const rows = data as DbOrderRow[];

  const planIds = [...new Set(rows.map((r) => r.plan_id).filter((x): x is PlanId => x != null))];
  const neighborhoodSlugs = [
    ...new Set(rows.map((r) => r.neighborhood_id).filter((x): x is string => x != null)),
  ];

  const planNameById = new Map<PlanId, string>();
  if (planIds.length > 0) {
    const { data: planRows } = await supabase.from("plans").select("id,name").in("id", planIds);
    if (planRows) {
      for (const p of planRows as { id: PlanId; name: string }[]) {
        planNameById.set(p.id, p.name);
      }
    }
  }

  const neighborhoodNameBySlug = new Map<string, string>();
  if (neighborhoodSlugs.length > 0) {
    const { data: neighborhoodRows } = await supabase
      .from("neighborhoods")
      .select("slug,name")
      .in("slug", neighborhoodSlugs);
    if (neighborhoodRows) {
      for (const n of neighborhoodRows as { slug: string; name: string }[]) {
        neighborhoodNameBySlug.set(n.slug, n.name);
      }
    }
  }

  return rows.map((row) => {
    const displayName =
      row.neighborhood_id != null
        ? neighborhoodNameBySlug.get(row.neighborhood_id) ?? row.neighborhood_id
        : row.plan_id != null
          ? planNameById.get(row.plan_id) ?? row.plan_id
          : "Order";
    return toOrderRecord(row, displayName);
  });
}

export async function getOrder(id: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,plan_id,neighborhood_id,status,subtotal_cents,delivery_fee_cents,service_fee_cents,discount_cents,total_cents,promo_code,payment_method,address,delivery_window,created_at,order_timeline_events(status,label,note,event_at)",
    )
    .eq("id", id)
    .eq("user_id", userId)
    .order("event_at", {
      foreignTable: "order_timeline_events",
      ascending: true,
    })
    .maybeSingle();

  if (error || !data) return null;
  const row = data as DbOrderRow;
  const displayName = (() => {
    if (row.neighborhood_id != null) return row.neighborhood_id;
    if (row.plan_id != null) return row.plan_id;
    return "Order";
  })();

  // Resolve names (best-effort) for display.
  if (row.neighborhood_id != null) {
    const nh = await getNeighborhoodPriceAndName(row.neighborhood_id);
    return toOrderRecord(row, nh?.name ?? row.neighborhood_id);
  }
  if (row.plan_id != null) {
    const plan = await getPlanById(row.plan_id);
    return toOrderRecord(row, plan?.name ?? row.plan_id);
  }
  return toOrderRecord(row, displayName);
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

  let subtotalCents = plan.price_cents;
  let planIdToInsert: PlanId | null = input.planId;
  let neighborhoodIdToInsert: string | null = null;

  if (input.checkoutMetadata?.checkoutMode === "onetime") {
    const nh = await getNeighborhoodPriceAndName(input.checkoutMetadata.neighborhoodSlug);
    if (!nh) {
      throw new Error("Unknown neighborhood");
    }
    subtotalCents = nh.price_cents ?? plan.price_cents;
    neighborhoodIdToInsert = nh.slug;
    planIdToInsert = null;
  }

  const totals = computeOrderTotals(subtotalCents, promoCode);
  const id = `ord_${Date.now().toString(36)}`;
  const supabase = await createSupabaseServerClient();
  const createdAt = new Date().toISOString();

  const timeline = createTimelineEvent("placed");

  const baseInsert = {
    id,
    user_id: userId,
    plan_id: planIdToInsert,
    neighborhood_id: neighborhoodIdToInsert,
    status: "placed" as const,
    subtotal_cents: subtotalCents,
    delivery_fee_cents: totals.deliveryFeeCents,
    service_fee_cents: totals.serviceFeeCents,
    discount_cents: totals.discountCents,
    total_cents: totals.totalCents,
    promo_code: promoCode,
    payment_method: input.paymentMethod,
    address: input.address,
    delivery_window: input.deliveryWindow,
    created_at: createdAt,
  };

  const insertPayload =
    input.checkoutMetadata != null
      ? { ...baseInsert, checkout_metadata: input.checkoutMetadata }
      : baseInsert;

  let { error: insertOrderError } = await supabase.from("orders").insert(insertPayload);

  const checkoutMetaUnavailable =
    insertOrderError?.code === "PGRST204" &&
    typeof insertOrderError.message === "string" &&
    insertOrderError.message.includes("checkout_metadata");

  if (checkoutMetaUnavailable && input.checkoutMetadata != null) {
    insertOrderError = (await supabase.from("orders").insert(baseInsert)).error;
  }

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

export type CancelOrderResult =
  | { ok: true; order: OrderRecord }
  | { ok: false; reason: "not_found" | "not_cancellable" };

export async function cancelOrder(id: string, userId: string): Promise<CancelOrderResult> {
  const order = await getOrder(id, userId);
  if (!order) {
    return { ok: false, reason: "not_found" };
  }
  if (!orderCanBeCancelled(order.status)) {
    return { ok: false, reason: "not_cancellable" };
  }

  const supabase = await createSupabaseServerClient();
  const cancelledTimeline = createTimelineEvent("cancelled");

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (updateError) {
    throw updateError;
  }

  const { error: timelineError } = await supabase.from("order_timeline_events").insert({
    order_id: id,
    status: cancelledTimeline.status,
    label: cancelledTimeline.label,
    note: cancelledTimeline.note,
    event_at: cancelledTimeline.timestamp,
  });

  if (timelineError) {
    throw timelineError;
  }

  const updated = await getOrder(id, userId);
  if (!updated) {
    throw new Error("Failed to load order after cancel");
  }
  return { ok: true, order: updated };
}

export async function advanceOrderStatus(id: string, userId: string) {
  const order = await getOrder(id, userId);
  if (!order) return null;

  const currentIndex = STATUS_FLOW.indexOf(order.status);
  if (currentIndex === -1) {
    return order;
  }

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
