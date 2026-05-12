---
name: Queue order detail dialog
overview: Remove the Source column from the live queue table and add a click-to-open details view on each order ID that surfaces the same queue row data, including source type, label, and slug—no new API or migrations required.
todos:
  - id: remove-source-column
    content: Remove Source TableHead/TableCell from queue-priorities.tsx
    status: completed
  - id: order-id-trigger-dialog
    content: Add controlled Dialog; link-style button on orderId opens with selected QueueOrder
    status: completed
  - id: dialog-source-fields
    content: "Render read-only details: timestamps, status, priority, SLA, source type/label/slug"
    status: completed
isProject: false
---

# Queue priorities: drop Source column, open details on order ID

## Context

- The table lives in [`apps/vendor-portal/src/app/(main)/dashboard/default/_components/queue-priorities.tsx`](<apps/vendor-portal/src/app/(main)/dashboard/default/_components/queue-priorities.tsx>). The **Source** column is the header/cell pair at roughly lines 239 and 271–277 (`md:table-cell` visibility).
- Each row is a [`QueueOrder`](apps/vendor-portal/src/lib/vendor-ops-types.ts): `orderId`, `id`, `createdAt`, `dueAt`, `status`, `priority`, `slaMinutesRemaining`, and **`sourceType` / `sourceLabel` / `sourceSlug`**. That is enough to show “details including the source” without backend work. (Richer data like line items would need a new security-definer RPC joining `orders`; out of scope unless you explicitly want it later.)

## UI behavior

1. **Remove** the Source `TableHead` and the corresponding `TableCell` (and any now-unused responsive classes tied only to that column).
2. **Keep** neighborhood/plan filter logic and `sourceKey` helpers—they still depend on `sourceType` / `sourceSlug` / `sourceLabel` on each row; only the dedicated column goes away.
3. **Make the order ID interactive**: replace the plain `<span>` in the first column with a **link-styled control** (e.g. [`Button`](apps/vendor-portal/src/components/ui/button.tsx) `variant="link"`) that opens a **controlled [`Dialog`](apps/vendor-portal/src/components/ui/dialog.tsx)** (same pattern as [`inventory-products-manager.tsx`](<apps/vendor-portal/src/app/(main)/dashboard/inventory/_components/inventory-products-manager.tsx>)).
4. **Dialog contents** (read-only, clear labels):
   - Public **order id** (`orderId`) and optional internal queue **row id** (`id`) if useful for support/debugging.
   - **Created**, **due** (full locale string; optionally reuse relative copy from `formatQueueDueRelative` where it still applies).
   - **Status**, **priority**, **SLA minutes remaining** (`slaMinutesRemaining`).
   - **Source**: show type (Plan vs Neighborhood), **label**, and **slug** when present (slug only if different from label or always as a secondary line—pick one consistent layout).
5. **Accessibility**: `aria-label` on the trigger like “View details for order …”; ensure the dialog has a proper `DialogTitle` / `DialogDescription`.

## Files to touch

- **Primary**: [`queue-priorities.tsx`](<apps/vendor-portal/src/app/(main)/dashboard/default/_components/queue-priorities.tsx>)—column removal, state (`selectedOrder: QueueOrder | null`), trigger, dialog, reuse existing `sourceLabel()` or split into small helpers for the dialog only.
- **No changes** to [`vendor-ops-store.ts`](apps/vendor-portal/src/lib/vendor-ops-store.ts), types, or API routes unless you later want deeper order payloads.

## Optional follow-up (not in this pass)

- Shareable URL (`/dashboard/.../queue/...`) would require a new page + server fetch by queue row id; only needed if you want bookmarkable detail views.
