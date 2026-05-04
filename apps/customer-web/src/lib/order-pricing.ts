/**
 * Order line totals (service fee, WELCOME10 discount) — must match `createOrder` in order-store.
 * Client-safe: no server-only imports.
 */
export function computeOrderTotals(subtotalCents: number, promoCode: string | null) {
  const deliveryFeeCents = 0;
  const serviceFeeCents = 400;
  const discountCents =
    promoCode?.toUpperCase() === "WELCOME10"
      ? Math.round(subtotalCents * 0.1)
      : 0;
  const totalCents =
    subtotalCents + deliveryFeeCents + serviceFeeCents - discountCents;

  return { deliveryFeeCents, serviceFeeCents, discountCents, totalCents };
}
