---
name: Customer journey checkout upgrade
overview: Implement an MVP end-to-end customer journey in customer-web by removing hardcoded checkout defaults, wiring profile-driven defaults, and adding selectable payment methods persisted with orders.
todos:
  - id: checkout-state-refactor
    content: Refactor checkout form to remove hardcoded defaults and initialize from plans/profile data.
    status: completed
  - id: payment-method-ui
    content: Add required payment method selection to checkout UI and API payload.
    status: completed
  - id: orders-api-validation
    content: Update orders API to validate dynamic plan IDs and payment method values.
    status: completed
  - id: orders-payment-persistence
    content: Add DB migration and order-store changes to persist payment method.
    status: completed
  - id: post-checkout-display
    content: Show payment method in order detail/timeline views and validate end-to-end journey.
    status: completed
isProject: false
---

# Customer-Web MVP Journey Plan

## Goal

Deliver a complete browse-to-order MVP experience in `customer-web` with dynamic checkout defaults and payment method selection persisted on orders, while keeping payments simulated (no external processor).

## Implementation Steps

1. **Stabilize checkout data flow (no hardcoded defaults)**
   - Update [apps/customer-web/src/components/checkout-form.tsx](apps/customer-web/src/components/checkout-form.tsx) to initialize form state from fetched data instead of literals.
   - Replace hardcoded `planId`, `address`, and `deliveryWindow` defaults with:
     - `planId`: URL `plan` query param if valid; otherwise first plan from `/api/plans`.
     - `address`: customer `default_address` from `/api/profile` when available.
     - `deliveryWindow`: a required empty field with explicit user selection/input (no seeded string).
   - Keep fee/promo display but move toward server-trusted totals by using server response after order creation.

2. **Wire profile defaults into checkout**
   - Reuse existing profile API in [apps/customer-web/src/app/api/profile/route.ts](apps/customer-web/src/app/api/profile/route.ts) and fetch it in checkout client flow.
   - Ensure unauthenticated behavior is explicit (prompt/sign-in CTA) rather than generic failure.

3. **Add payment method selection in UI and payload**
   - Extend checkout form in [apps/customer-web/src/components/checkout-form.tsx](apps/customer-web/src/components/checkout-form.tsx) with a required `paymentMethod` field (e.g., `card`, `apple_pay`, `cash`).
   - Include this field in the `POST /api/orders` payload and success summary.

4. **Harden order API validation for dynamic plans + payment method**
   - Update [apps/customer-web/src/app/api/orders/route.ts](apps/customer-web/src/app/api/orders/route.ts) to:
     - Validate `planId` against actual plans from catalog/store (remove static set).
     - Validate `paymentMethod` against allowed enum values.
     - Return clear 4xx errors for missing/invalid checkout fields.

5. **Persist payment method at storage layer**
   - Add a Supabase migration to store payment method on `orders` (new column, constrained values).
   - Update [apps/customer-web/src/lib/order-store.ts](apps/customer-web/src/lib/order-store.ts) create/read mapping so payment method is saved and available in order responses.

6. **Expose payment method in post-checkout journey**
   - Update [apps/customer-web/src/app/orders/[id]/page.tsx](apps/customer-web/src/app/orders/[id]/page.tsx) and relevant presentational components (likely [apps/customer-web/src/components/order-timeline.tsx](apps/customer-web/src/components/order-timeline.tsx)) to display selected payment method in order details.
   - Keep existing status simulation but ensure customer-visible wording matches simulated payment mode.

7. **Complete MVP journey quality checks**
   - Validate journey: landing -> neighborhoods -> plan select -> checkout -> order detail.
   - Verify edge cases: invalid plan query, missing profile address, unauthenticated checkout, invalid payment method payload.
   - Run app lint/tests for touched areas and resolve regressions.

## Key Files

- [apps/customer-web/src/components/checkout-form.tsx](apps/customer-web/src/components/checkout-form.tsx)
- [apps/customer-web/src/app/api/orders/route.ts](apps/customer-web/src/app/api/orders/route.ts)
- [apps/customer-web/src/lib/order-store.ts](apps/customer-web/src/lib/order-store.ts)
- [apps/customer-web/src/app/api/profile/route.ts](apps/customer-web/src/app/api/profile/route.ts)
- [apps/customer-web/src/app/orders/[id]/page.tsx](apps/customer-web/src/app/orders/[id]/page.tsx)
- [apps/customer-web/src/components/order-timeline.tsx](apps/customer-web/src/components/order-timeline.tsx)
- `supabase/migrations/<new_migration>.sql`
