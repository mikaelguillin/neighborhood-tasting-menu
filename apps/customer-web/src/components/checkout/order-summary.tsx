"use client";

import type { ReactNode } from "react";
import { useCheckout } from "./checkout-context";
import { formatFriendlyDate, getNextFriday } from "@/lib/dates";
import { computeOrderTotals } from "@/lib/order-pricing";
import { Input } from "@/components/ui/input";

function centsToMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value / 100);
}

export function OrderSummary({ compact = false }: { compact?: boolean }) {
  const { plan, neighborhoodSlug, mode, promoCode, setPromoCode, neighborhoods } = useCheckout();
  const neighborhood = neighborhoods.find((n) => n.slug === neighborhoodSlug);
  const ship = formatFriendlyDate(getNextFriday());
  const promoForTotals = promoCode.trim() ? promoCode.trim() : null;
  const { serviceFeeCents, discountCents, totalCents } = computeOrderTotals(
    plan.priceCents,
    promoForTotals,
  );

  return (
    <aside
      className={
        compact
          ? "rounded-[12px] bg-card p-5 shadow-[var(--shadow-card)]"
          : "sticky top-24 rounded-[16px] bg-card p-6 shadow-[var(--shadow-card)]"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Order summary
      </p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight text-brand">{plan.name}</h3>
      <p className="mt-1 text-sm text-foreground/70">{plan.cadence}</p>

      {neighborhood && (
        <div className="mt-5 flex items-center gap-3 rounded-[10px] bg-canvas-soft p-3">
          <img
            src={neighborhood.image}
            alt=""
            className="h-14 w-14 shrink-0 rounded-[8px] object-cover"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              First box
            </p>
            <p className="truncate text-sm font-semibold text-foreground">{neighborhood.name}</p>
            <p className="text-xs text-foreground/60">Ships {ship}</p>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-2">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Promo code (optional)
          </span>
          <Input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="mt-1.5 h-9 rounded-[8px] text-sm uppercase"
            placeholder="WELCOME10"
            autoComplete="off"
          />
        </label>
      </div>

      <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <Row label="Subtotal" value={centsToMoney(plan.priceCents)} />
        <Row
          label="Delivery"
          value={<span className="text-primary">Free</span>}
        />
        <Row label="Service fee" value={centsToMoney(serviceFeeCents)} />
        <Row label="Discount" value={`- ${centsToMoney(discountCents)}`} />
        {mode === "subscription" && <Row label="Billing" value={plan.cadence} muted />}
      </dl>
      <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-sm font-semibold text-foreground">Total today</span>
        <span className="text-2xl font-semibold tracking-tight text-brand">
          {centsToMoney(totalCents)}
        </span>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        {mode === "subscription"
          ? "You can skip, pause or cancel any time before Wednesday 11:59pm ET."
          : "One-time order — no subscription created."}
      </p>
    </aside>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={muted ? "text-muted-foreground" : "text-foreground/70"}>{label}</dt>
      <dd
        className={muted ? "text-muted-foreground" : "font-medium text-foreground"}
      >
        {value}
      </dd>
    </div>
  );
}
