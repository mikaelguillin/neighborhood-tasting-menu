---
name: Vendor analytics KPIs
overview: Replace placeholder vendor analytics with a small set of real KPIs and two simple charts—emphasizing sales (order volume and checkout GMV from joined orders) plus light operational signals—using security-definer RPCs over vendor_queue_orders ⨝ orders, with clear labeling for shared multi-vendor orders.
todos:
  - id: rpc-analytics-simple
    content: Add one security-definer RPC returning period summary (sales + ops KPIs) and daily series for a single chart (or two lightweight RPCs)
    status: completed
  - id: replace-ui-simple
    content: Replace analytics page with KPI strip + 1–2 charts; remove CRM-placeholder components
    status: completed
  - id: sales-copy-gmv
    content: "UI copy/tooltips for sales: distinct order_id for counts and GMV; note full-checkout value until line-item splits exist"
    status: completed
isProject: false
---

# Vendor analytics (simplified): KPIs, sales, and charts

## Current state

- [apps/vendor-portal/src/app/(main)/dashboard/analytics/](<apps/vendor-portal/src/app/(main)/dashboard/analytics/>) is mostly placeholder “CRM” UI ([analytics-overview.tsx](<apps/vendor-portal/src/app/(main)/dashboard/analytics/_components/analytics-overview.tsx>) uses random data; other blocks are static).
- Real reads must follow **`security definer` RPCs** that verify `vendor_users` and join `vendor_queue_orders` → `orders` (see [get_vendor_queue_orders](supabase/migrations/202605090930_vendor_queue_source_metadata_rpc.sql)). Vendors cannot select `orders` directly under RLS.
- **Multi-vendor orders:** one customer `order_id` can produce one queue row per vendor. For **sales KPIs**, use **`count(distinct order_id)`** and **sum(`orders.total_cents`) over distinct orders** in the period so dollars are not multiplied by row count. Label this as **checkout GMV for orders you were assigned to** (full order total, not your payout share) unless you later add line items or payout splits.

## Scope: keep it simple

**One short KPI row** (4–6 numbers) and **at most two charts**. No funnel/histogram/top-N lists in v1 unless you explicitly expand later.

### Sales KPIs (primary)

These are all computable from the join (filter by `orders.created_at` or by queue `created_at`—pick one rule and use it consistently; **recommend `orders.created_at`** for “sales in period”).

| KPI                      | Definition                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Orders (sales count)** | `count(distinct order_id)` for rows linked to non-cancelled orders in range (or include cancelled with a separate KPI—see below).                 |
| **Sales (GMV)**          | Sum of `orders.total_cents` over those distinct orders (same set as orders count). Display as currency.                                           |
| **Average order value**  | GMV / orders when orders > 0.                                                                                                                     |
| **Cancelled orders**     | `count(distinct order_id)` where `orders.status = 'cancelled'` (or queue `status = 'cancelled'`) in range—optional fourth chip for “lost” volume. |

Optional comparison row: **vs previous period** (same-length window immediately before selected range)—percentage change on orders and GMV only, to avoid clutter.

### Operations KPIs (secondary, minimal)

Pick **two** so the page stays light:

| KPI                 | Definition                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| **Fulfilled tasks** | Count of queue rows with `status = 'fulfilled'` and fulfillment time in range (e.g. `updated_at`). |
| **Open workload**   | Current snapshot: queue rows in (`new`,`confirmed`,`preparing`,`ready`) for this `vendor_id`.      |

Defer for later: SLA histograms, source mix donuts, inventory charts, multi-series backlog charts.

## Charts (two simple options)

1. **Sales over time** — Single series: **orders per day** (distinct `order_id` per day by `orders.created_at`) or **GMV per day** (sum of `total_cents` for orders first appearing that day). One line or bar chart; default to **orders** if you want the least sensitive metric.
2. **Fulfillments over time** (optional second chart) — Count of queue rows moved to `fulfilled` per day (`updated_at`). If you only want **one** chart, show **sales (orders or GMV)** and surface fulfillments only as the **Fulfilled tasks** KPI.

Use the existing Recharts + `ChartContainer` patterns from [analytics-overview.tsx](<apps/vendor-portal/src/app/(main)/dashboard/analytics/_components/analytics-overview.tsx>); strip filters that do not map to data (enterprise/stalled, etc.) or replace with a single **date range** control.

## Implementation direction

- **One RPC** (preferred for simplicity), e.g. `get_vendor_analytics_dashboard(v_vendor_id uuid, v_from timestamptz, v_to timestamptz)`, returning:
  - JSON or composite type with: sales KPIs, ops KPIs, prior-period deltas (optional), and two arrays: `sales_by_day[]` (date, order_count, gmv_cents), `fulfillments_by_day[]` (date, count)—or only the first array if you ship one chart.
- Membership guard identical to [get_vendor_queue_orders](supabase/migrations/202605090930_vendor_queue_source_metadata_rpc.sql).
- **Server Component** loads data via [createSupabaseServerClient](apps/vendor-portal/src/lib/supabase-server.ts); pass props into small presentational components.
- **Remove or gut** [analytics-drivers-forecast-target.tsx](<apps/vendor-portal/src/app/(main)/dashboard/analytics/_components/analytics-drivers-forecast-target.tsx>), [analytics-drivers-coverage-triage.tsx](<apps/vendor-portal/src/app/(main)/dashboard/analytics/_components/analytics-drivers-coverage-triage.tsx>), [analytics-actions-manager-queue.tsx](<apps/vendor-portal/src/app/(main)/dashboard/analytics/_components/analytics-actions-manager-queue.tsx>), [analytics-actions-risk-ledger.tsx](<apps/vendor-portal/src/app/(main)/dashboard/analytics/_components/analytics-actions-risk-ledger.tsx>) in favor of the simplified layout.

## Schema note

True **per-vendor revenue / payout** is not in the database today; sales KPIs use **order-level** totals. Document in UI (subtitle or tooltip) so vendors are not misled.
