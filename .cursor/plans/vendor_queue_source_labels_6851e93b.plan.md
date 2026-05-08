---
name: Vendor queue source labels
overview: Expose neighborhood/plan metadata in the vendor live queue using a secure DB read surface (view/RPC) compatible with current RLS, then render the label in queue rows.
todos:
  - id: add-vendor-queue-rpc
    content: Add migration creating vendor-safe RPC that returns queue rows with plan/neighborhood metadata
    status: completed
  - id: wire-store-to-rpc
    content: Update vendor ops store and queue types to consume enriched queue payload
    status: completed
  - id: render-source-label
    content: Display source label in queue-priorities row layout with robust fallback handling
    status: completed
  - id: verify-live-queue-flow
    content: Validate queue API payload and UI behavior for plan and neighborhood orders
    status: completed
isProject: false
---

# Show Plan/Neighborhood In Vendor Live Queue

## Approach

Use a vendor-safe database surface (RPC) that returns queue rows plus source metadata (`plan` or `neighborhood`) so the vendor portal can display what each order was placed for without denormalizing queue records.

## Implementation Steps

- Create a Supabase SQL migration that adds a `SECURITY DEFINER` RPC (e.g. `get_vendor_queue_orders(v_vendor_id uuid)`) that:
  - validates vendor membership against the authenticated user (similar to app-level `requireVendorMembership` expectations).
  - selects from `vendor_queue_orders` and left-joins `orders`, `plans`, and `neighborhoods`.
  - returns queue fields plus source metadata fields (e.g. `source_type`, `source_label`, optional `source_slug`).
  - applies stable fallback behavior when names are missing (`plan_id`/`neighborhood_id` fallback).
- Update vendor queue data access in [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/lib/vendor-ops-store.ts`](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/lib/vendor-ops-store.ts) to call the new RPC instead of the raw `vendor_queue_orders` select.
- Extend queue types in [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/lib/vendor-ops-types.ts`](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/lib/vendor-ops-types.ts) with the new source metadata fields.
- Render the new source label in each queue row in [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/app/(main)/dashboard/default/_components/queue-priorities.tsx`](</Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/app/(main)/dashboard/default/_components/queue-priorities.tsx>) near `orderId`/status so operators can quickly identify context.
- Keep existing queue status mutation path unchanged (`/api/vendor/ops/queue/[id]/status`) since this is read-only metadata enrichment.

## Data Flow

```mermaid
flowchart LR
  vendorPortalUI[QueuePrioritiesUI] --> opsDashboard[OpsDashboardLoadQueue]
  opsDashboard --> queueApi[GETVendorOpsQueueRoute]
  queueApi --> storeGet[getQueueOrdersStore]
  storeGet --> queueRpc[get_vendor_queue_ordersRPC]
  queueRpc --> queueTable[vendor_queue_orders]
  queueRpc --> ordersTable[orders]
  queueRpc --> plansTable[plans]
  queueRpc --> neighborhoodsTable[neighborhoods]
  queueApi --> vendorPortalUI
```

## Validation

- Verify API response at `/api/vendor/ops/queue` includes source metadata for both order shapes:
  - neighborhood-based orders
  - plan-based orders
- Verify queue row UI shows correct label and sensible fallback when metadata is partially missing.
- Verify no regression in queue status update actions from the same list view.

## Files Expected To Change

- New migration under [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/supabase/migrations`](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/supabase/migrations)
- [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/lib/vendor-ops-store.ts`](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/lib/vendor-ops-store.ts)
- [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/lib/vendor-ops-types.ts`](/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/lib/vendor-ops-types.ts)
- [`/Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/app/(main)/dashboard/default/_components/queue-priorities.tsx`](</Users/mikaelguillin/projects/neighborhood-tasting-menu-2/apps/vendor-portal/src/app/(main)/dashboard/default/_components/queue-priorities.tsx>)
