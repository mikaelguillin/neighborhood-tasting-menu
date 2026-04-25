export type PlanId = "sampler" | "weekly" | "local-hero";

export type OrderStatus =
  | "placed"
  | "payment_confirmed"
  | "in_preparation"
  | "out_for_delivery"
  | "delivered";

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
  address: string;
  deliveryWindow: string;
  createdAt: string;
  timeline: OrderTimelineEvent[];
};

const PLAN_CATALOG: Record<PlanId, { name: string; priceCents: number }> = {
  sampler: { name: "The Sampler", priceCents: 5800 },
  weekly: { name: "The Weekly", priceCents: 7200 },
  "local-hero": { name: "The Local Hero", priceCents: 11800 },
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
    note: "Your payment was processed and your order is now locked in.",
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

const orders = new Map<string, OrderRecord>();

function moneyTotals(subtotalCents: number, promoCode: string | null) {
  const deliveryFeeCents = 0;
  const serviceFeeCents = 400;
  const discountCents = promoCode?.toUpperCase() === "WELCOME10" ? Math.round(subtotalCents * 0.1) : 0;
  const totalCents = subtotalCents + deliveryFeeCents + serviceFeeCents - discountCents;

  return { deliveryFeeCents, serviceFeeCents, discountCents, totalCents };
}

function createTimelineEvent(status: OrderStatus): OrderTimelineEvent {
  const meta = STATUS_META[status];
  return {
    status,
    label: meta.label,
    note: meta.note,
    timestamp: new Date().toISOString(),
  };
}

function seedDemoOrders() {
  if (orders.size > 0) return;

  const createdAt = new Date(Date.now() - 1000 * 60 * 90).toISOString();
  const base = PLAN_CATALOG.weekly;
  const totals = moneyTotals(base.priceCents, null);
  const id = "ord_demo_weekly";

  orders.set(id, {
    id,
    planId: "weekly",
    planName: base.name,
    status: "in_preparation",
    subtotalCents: base.priceCents,
    ...totals,
    promoCode: null,
    address: "50-25 Center Blvd, Long Island City, NY",
    deliveryWindow: "Friday 4:00 PM - 7:00 PM",
    createdAt,
    timeline: [
      { ...createTimelineEvent("placed"), timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
      {
        ...createTimelineEvent("payment_confirmed"),
        timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      },
      {
        ...createTimelineEvent("in_preparation"),
        timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      },
    ],
  });
}

seedDemoOrders();

export function listOrders() {
  return Array.from(orders.values()).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getOrder(id: string) {
  return orders.get(id) ?? null;
}

export function createOrder(input: {
  planId: PlanId;
  promoCode?: string;
  address: string;
  deliveryWindow: string;
}) {
  const plan = PLAN_CATALOG[input.planId];
  const promoCode = input.promoCode?.trim() ? input.promoCode.trim() : null;
  const totals = moneyTotals(plan.priceCents, promoCode);
  const id = `ord_${Date.now().toString(36)}`;
  const createdAt = new Date().toISOString();

  const record: OrderRecord = {
    id,
    planId: input.planId,
    planName: plan.name,
    status: "placed",
    subtotalCents: plan.priceCents,
    ...totals,
    promoCode,
    address: input.address,
    deliveryWindow: input.deliveryWindow,
    createdAt,
    timeline: [createTimelineEvent("placed")],
  };

  orders.set(id, record);
  return record;
}

export function advanceOrderStatus(id: string) {
  const order = orders.get(id);
  if (!order) return null;

  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const next = STATUS_FLOW[currentIndex + 1];

  if (!next) {
    return order;
  }

  order.status = next;
  order.timeline.push(createTimelineEvent(next));
  orders.set(id, order);
  return order;
}

export const PLAN_OPTIONS = Object.entries(PLAN_CATALOG).map(([id, plan]) => ({
  id: id as PlanId,
  name: plan.name,
  priceCents: plan.priceCents,
}));
