---
name: one-time order box
overview: 'Wire up the "One-time order" button on each neighborhood detail page to actually order that box: send the user straight to a streamlined checkout (no plan step), price the order from the neighborhood box, and prominently show the price on the button itself.'
todos:
  - id: cta
    content: Update neighborhood detail CTA to link to /checkout?mode=onetime&neighborhood=<slug> with price-prominent label
    status: completed
  - id: step-order
    content: Make STEP_ORDER mode-aware in checkout-context (skip plan step for onetime) and update stepper + next/back
    status: completed
  - id: subtotal
    content: Expose subtotalCents from checkout context (neighborhood price for onetime, plan price otherwise) and use it in order-summary + step-payment
    status: completed
  - id: server
    content: In createOrder, when checkoutMode is onetime, override subtotal_cents/plan_name from neighborhoods.price_cents and name
    status: completed
isProject: false
---

# One-time order from a neighborhood detail page

## Behavior

- On `/neighborhoods/[slug]`, the "One-time order" CTA becomes `Order this box — $72` (price from `neighborhoods.price_cents`; if `null`, fall back to `Order this box`).
- Clicking it navigates to `/checkout?mode=onetime&neighborhood=<slug>`.
- In `onetime` mode the checkout has 3 steps (Address → Delivery → Payment) — the plan-picker step is skipped.
- Order summary line items and the final "Place order — $X" use the neighborhood box price as subtotal (not a plan price). The order is persisted with `subtotal_cents = neighborhoods.price_cents` and `plan_name = neighborhood.name`.

## Files to change

### 1. CTA on the neighborhood detail page

[apps/customer-web/src/app/neighborhoods/[slug]/page.tsx](apps/customer-web/src/app/neighborhoods/[slug]/page.tsx) lines 77–84 — replace the existing two CTAs' "One-time order" button with a price-prominent label and a deep link into onetime checkout. Add a small `centsToMoney` helper (same pattern as `/plans/page.tsx`).

```tsx
<Button asChild size="lg" variant="outline">
  <Link href={`/checkout?mode=onetime&neighborhood=${n.slug}`}>
    {n.priceCents != null
      ? `Order this box — ${centsToMoney(n.priceCents)}`
      : "Order this box"}
  </Link>
</Button>
```

### 2. Skip the plan step when `mode=onetime`

[apps/customer-web/src/components/checkout/checkout-context.tsx](apps/customer-web/src/components/checkout/checkout-context.tsx)

- Replace the static `STEP_ORDER` constant with a helper `getStepOrder(mode)` returning `["plan", "address", "delivery", "payment"]` for `subscription` and `["address", "delivery", "payment"]` for `onetime`. Export it (still as `STEP_ORDER` for the subscription case for back-compat) plus a `useStepOrder()` derived from context.
- Initial `step` becomes `"address"` when `initialMode === "onetime"`.
- Update `next()` / `back()` to compute `STEP_ORDER` from the current `mode` rather than the module-level constant.

[apps/customer-web/src/components/checkout/checkout-stepper.tsx](apps/customer-web/src/components/checkout/checkout-stepper.tsx)

- Pull the step list from context (`useStepOrder()`) instead of the static import. The `LABELS` map stays the same; only 3 entries render in onetime mode.

[apps/customer-web/src/components/checkout/checkout-flow.tsx](apps/customer-web/src/components/checkout/checkout-flow.tsx) lines 75–78 — keep the `step === "plan"` rendering branch (it just never matches in onetime mode). No other change.

### 3. Subtotal driven by the neighborhood for onetime checkout

[apps/customer-web/src/components/checkout/checkout-context.tsx](apps/customer-web/src/components/checkout/checkout-context.tsx)

- Expose a derived `subtotalCents` on the context:

```ts
const subtotalCents =
  mode === "onetime"
    ? (neighborhoods.find((n) => n.slug === neighborhoodSlug)?.priceCents ??
      plan.priceCents)
    : plan.priceCents;
```

- Plumb it into the `Ctx` type so consumers don't recompute it.

[apps/customer-web/src/components/checkout/order-summary.tsx](apps/customer-web/src/components/checkout/order-summary.tsx)

- Use `subtotalCents` in `computeOrderTotals` and the `Subtotal` row.
- When `mode === "onetime"`, replace the plan-name heading with the neighborhood name and a "One-time box" subtitle, and hide the `Billing: <cadence>` row (already conditional).

[apps/customer-web/src/components/checkout/steps/step-payment.tsx](apps/customer-web/src/components/checkout/steps/step-payment.tsx)

- Read `subtotalCents` from context for the "Place order — $X" button.
- When `mode === "onetime"`, replace the "Your <plan> subscription will renew…" disclaimer with a one-time wording.

### 4. Server: price the order from the neighborhood for onetime

[apps/customer-web/src/lib/order-store.ts](apps/customer-web/src/lib/order-store.ts) — `createOrder`

- When `input.checkoutMetadata?.checkoutMode === "onetime"`, fetch the neighborhood and override:
  - `subtotal_cents = neighborhood.price_cents ?? plan.price_cents`
  - `plan_name = neighborhood.name`
- `plan_id` still uses `input.planId` (the schema FK in [supabase/migrations/202604251320_core_flows_schema.sql](supabase/migrations/202604251320_core_flows_schema.sql) line 63 makes it `not null references plans(id)`, so we keep it bound to a real plan id but that's no longer user-facing in onetime mode).
- Add a small `getNeighborhoodPriceAndName(slug)` helper alongside the existing `getPlanById` to keep the change tight.

The client `completeOrder()` (in `checkout-context.tsx`) doesn't need to change its API contract — it already sends `planId` (defaulted to `plans[0].id`) and `checkoutMetadata.checkoutMode`, which is what the server now switches on.

## Out of scope

- Adding price/CTA to the neighborhood listing cards or homepage.
- Schema changes (e.g. making `orders.plan_id` nullable). The current FK is preserved by keeping `plan_id` bound to whichever plan was loaded into context first.
- Real payment processing — still demo card flow.
