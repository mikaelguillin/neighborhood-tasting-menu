# Neighborhood Tasting Menu - Database Schema

This document summarizes:

- the **currently implemented** database schema in `supabase/migrations`
- the **target MVP schema** defined by project planning artifacts

## 1) Current Implemented Schema (as of current migrations)

Sources:

- `supabase/migrations/202604220001_initial_schema.sql`
- `supabase/migrations/202604251320_core_flows_schema.sql`
- `supabase/migrations/202604251745_add_order_payment_method.sql`
- `supabase/migrations/202604262010_neighborhood_vendor_m2m.sql`
- `supabase/migrations/202604272228_vendors_public_read_for_discovery.sql`
- `supabase/migrations/202605031200_vendor_inventory_products.sql`
- `supabase/migrations/202605041200_inventory_product_name_uuid.sql`
- `supabase/migrations/202605051200_products_catalog.sql`
- `supabase/migrations/202605051205_products_id_default.sql`

### `public.health_checks`

| Column | Type | Constraints / Default |
| --- | --- | --- |
| `id` | `bigint` | `generated always as identity`, `primary key` |
| `created_at` | `timestamptz` | `not null`, default `now()` |
| `status` | `text` | `not null`, default `'ok'` |

Row Level Security: **enabled**

### Newly implemented core flow tables

- `public.users`
- `public.vendors`
- `public.vendor_users`
- `public.neighborhoods`
- `public.neighborhood_vendors`
- `public.plans`
- `public.orders`
- `public.order_timeline_events`
- `public.vendor_queue_orders`
- `public.products` (vendor catalog: display name and description)
- `public.vendor_inventory_products`
- `public.vendor_inventory_product_neighborhoods`

### `public.products` (vendor catalog)

| Column | Type | Constraints / Default |
| --- | --- | --- |
| `id` | `uuid` | `primary key`, default `gen_random_uuid()` (aligned with `vendor_inventory_products.product_id`) |
| `vendor_id` | `uuid` | `not null`, references `vendors(id)` on delete cascade |
| `name` | `text` | `not null` |
| `description` | `text` | nullable |
| `created_at` | `timestamptz` | `not null`, default `now()` |
| `updated_at` | `timestamptz` | `not null`, default `now()` |

Row Level Security: **enabled**

- **`SELECT` (anonymous / authenticated)**: allowed when the row appears in at least one `vendor_inventory_product_neighborhoods` row (`product_id` match), so only **listed** products are world-readable.
- **`SELECT` (vendor members)**: any product owned by a vendor the user belongs to (covers drafts not yet linked to a neighborhood).
- **`INSERT` / `UPDATE` / `DELETE`**: vendor members on matching `products.vendor_id`.

### `public.vendor_inventory_products` (operational stock)

| Column | Type | Constraints / Default |
| --- | --- | --- |
| `id` | `text` | `primary key` (e.g. `inv_…`) |
| `vendor_id` | `uuid` | `not null`, references `vendors(id)` on delete cascade |
| `product_id` | `uuid` | `not null`, **unique**, references `products(id)` on delete cascade |
| `stock` | `integer` | `not null`, default `0`, check `>= 0` |
| `low_stock_threshold` | `integer` | `not null`, default `0`, check `>= 0` |
| `available` | `boolean` | `not null`, default `true` |
| `out_of_stock_reason` | `text` | nullable |
| `created_at` | `timestamptz` | `not null`, default `now()` |
| `updated_at` | `timestamptz` | `not null`, default `now()` |

Display **`name` / `description`** live on **`public.products`** only (one stock row per catalog product).

### `public.vendor_inventory_product_neighborhoods` (slim junction)

| Column | Type | Constraints / Default |
| --- | --- | --- |
| `product_id` | `uuid` | `not null`, references `products(id)` on delete cascade |
| `neighborhood_slug` | `text` | `not null`, references `neighborhoods(slug)` on delete cascade |
| `vendor_id` | `uuid` | `not null`, references `vendors(id)` on delete cascade |
| **primary key** | | `(product_id, neighborhood_slug)` |

Row Level Security: **enabled** — `SELECT` for all roles; `INSERT` / `DELETE` for `vendor_users` on `vendor_id`.

### Implemented auth and policy behavior

- Trigger `public.handle_auth_user_created()` syncs `auth.users` inserts to `public.users`.
- RLS enabled on all core flow tables above.
- Customer policies are scoped to `auth.uid()` for `users`, `orders`, and `order_timeline_events`.
- Vendor operational policies are scoped by membership in `vendor_users` for queue/inventory access.
- `neighborhoods` and `plans` are readable to all authenticated/anonymous users for discovery surfaces.
- `vendor_inventory_product_neighborhoods` is readable to all roles for discovery (which **`products.id`** appear in which neighborhoods); writes are scoped to `vendor_users`.
- `products` (vendor catalog): public read only when listed in the junction; vendors can read/write their own rows (see table section above).

### Implemented indexes

- `idx_orders_user_id_created_at`
- `idx_order_timeline_events_order_id_event_at`
- `idx_vendor_queue_orders_vendor_status`
- `idx_vendor_inventory_products_vendor_available`
- `idx_vendor_inv_prod_nh_neighborhood`
- `idx_neighborhoods_borough`

## 2) Target MVP Schema (planned)

The following schema is derived from:

- `.cursor/plans/neighborhood_monorepo_mvp_plan_d71af8d6.plan.md`
- domain state models in:
  - `apps/customer-web/src/lib/order-store.ts`
  - `apps/vendor-portal/src/lib/vendor-ops-store.ts`

> Note: These tables are the intended MVP model and are not yet fully represented in migrations.

### Core identity and access

#### `users`
- `id uuid primary key` (maps to `auth.users.id`)
- `email text not null unique`
- `full_name text`
- `phone text`
- `default_address text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

#### `vendors`
- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `slug text not null unique`
- `description text`
- `status text not null default 'active'` (`active`, `paused`, `archived`)
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

#### `vendor_users`
- `vendor_id uuid not null references vendors(id) on delete cascade`
- `user_id uuid not null references users(id) on delete cascade`
- `role text not null` (`owner`, `manager`, `staff`)
- `created_at timestamptz not null default now()`
- `primary key (vendor_id, user_id)`

#### `neighborhood_vendors`
- `neighborhood_slug text not null references neighborhoods(slug) on delete cascade`
- `vendor_id uuid not null references vendors(id) on delete cascade`
- `created_at timestamptz not null default now()`
- `primary key (neighborhood_slug, vendor_id)`

### Catalog and curation

> **Implemented today:** `public.products` is a vendor-scoped catalog row (`name`, `description` only) with RLS; see §1. The richer MVP shape below (pricing, windows) is **not** migrated yet.

#### `products` (future MVP catalog; not fully migrated)
- `id uuid primary key default gen_random_uuid()`
- `vendor_id uuid not null references vendors(id) on delete cascade`
- `name text not null`
- `description text`
- `unit_price_cents integer not null check (unit_price_cents >= 0)`
- `available boolean not null default true`
- `availability_start timestamptz`
- `availability_end timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

#### `boxes`
- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `slug text not null unique`
- `description text`
- `base_price_cents integer not null check (base_price_cents >= 0)`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

#### `box_items`
- `box_id uuid not null references boxes(id) on delete cascade`
- `product_id uuid not null references products(id) on delete restrict`
- `quantity integer not null check (quantity > 0)`
- `sort_order integer not null default 0`
- `primary key (box_id, product_id)`

### Subscriptions and ordering

#### `subscriptions`
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references users(id) on delete cascade`
- `box_id uuid not null references boxes(id) on delete restrict`
- `plan_id text not null` (`sampler`, `weekly`, `local-hero`)
- `cadence text not null` (`weekly`, `biweekly`, `monthly`)
- `status text not null` (`active`, `paused`, `canceled`)
- `next_renewal_at timestamptz`
- `started_at timestamptz not null default now()`
- `canceled_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

#### `orders`
- `id text primary key` (supports IDs like `ord_xxx` seen in app state)
- `user_id uuid not null references users(id) on delete cascade`
- `subscription_id uuid references subscriptions(id) on delete set null`
- `plan_id text not null` (`sampler`, `weekly`, `local-hero`)
- `plan_name text not null`
- `status text not null` (`placed`, `payment_confirmed`, `in_preparation`, `out_for_delivery`, `delivered`)
- `subtotal_cents integer not null check (subtotal_cents >= 0)`
- `delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0)`
- `service_fee_cents integer not null default 0 check (service_fee_cents >= 0)`
- `discount_cents integer not null default 0 check (discount_cents >= 0)`
- `total_cents integer not null check (total_cents >= 0)`
- `promo_code text`
- `address text not null`
- `delivery_window text not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

#### `order_items`
- `id uuid primary key default gen_random_uuid()`
- `order_id text not null references orders(id) on delete cascade`
- `product_id uuid not null references products(id) on delete restrict`
- `product_name text not null`
- `unit_price_cents integer not null check (unit_price_cents >= 0)`
- `quantity integer not null check (quantity > 0)`
- `line_total_cents integer not null check (line_total_cents >= 0)`

#### `order_timeline_events`
- `id uuid primary key default gen_random_uuid()`
- `order_id text not null references orders(id) on delete cascade`
- `status text not null`
- `label text not null`
- `note text not null`
- `event_at timestamptz not null default now()`

### Fulfillment and operations

#### `deliveries`
- `id uuid primary key default gen_random_uuid()`
- `order_id text not null unique references orders(id) on delete cascade`
- `address text not null`
- `window_label text not null`
- `status text not null` (`scheduled`, `out_for_delivery`, `delivered`, `failed`)
- `proof_url text`
- `delivered_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

#### `vendor_queue_orders`
- `id text primary key` (supports IDs like `q_1001`)
- `vendor_id uuid not null references vendors(id) on delete cascade`
- `order_id text references orders(id) on delete set null`
- `customer_name text not null`
- `neighborhood text not null`
- `item_count integer not null check (item_count >= 0)`
- `due_at timestamptz not null`
- `sla_minutes_remaining integer not null`
- `status text not null` (`new`, `confirmed`, `preparing`, `ready`, `fulfilled`)
- `priority text not null` (`high`, `medium`, `low`)
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

#### `vendor_inventory_products` (operational; matches §1)
- `id text primary key` (supports IDs like `inv_001`)
- `vendor_id uuid not null references vendors(id) on delete cascade`
- `product_id uuid not null references products(id) on delete cascade` (unique; 1:1 with catalog row)
- `stock integer not null default 0 check (stock >= 0)`
- `low_stock_threshold integer not null default 0 check (low_stock_threshold >= 0)`
- `available boolean not null default true`
- `out_of_stock_reason text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

#### `vendor_inventory_product_neighborhoods` (matches §1)
- `product_id uuid not null references products(id) on delete cascade`
- `neighborhood_slug text not null references neighborhoods(slug) on delete cascade`
- `vendor_id uuid not null references vendors(id) on delete cascade`
- `primary key (product_id, neighborhood_slug)`

### Billing and communications

#### `payments`
- `id uuid primary key default gen_random_uuid()`
- `order_id text not null references orders(id) on delete cascade`
- `provider text not null default 'stripe'`
- `provider_payment_intent_id text`
- `amount_cents integer not null check (amount_cents >= 0)`
- `currency text not null default 'usd'`
- `status text not null` (`requires_payment_method`, `processing`, `succeeded`, `failed`, `refunded`)
- `paid_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

#### `billing_events`
- `id uuid primary key default gen_random_uuid()`
- `provider text not null default 'stripe'`
- `provider_event_id text not null unique`
- `event_type text not null`
- `payload jsonb not null`
- `processed boolean not null default false`
- `processed_at timestamptz`
- `created_at timestamptz not null default now()`

#### `notifications`
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid references users(id) on delete cascade`
- `order_id text references orders(id) on delete set null`
- `channel text not null` (`email`, `sms`)
- `template_key text not null`
- `status text not null` (`pending`, `sent`, `failed`)
- `retry_count integer not null default 0 check (retry_count >= 0)`
- `last_error text`
- `sent_at timestamptz`
- `created_at timestamptz not null default now()`

## 3) Relationship Overview

- A `user` can belong to many `vendors` through `vendor_users`.
- A `neighborhood` can include many `vendors` through `neighborhood_vendors`.
- A `vendor` owns many catalog **`products`** rows and matching **`vendor_inventory_products`** stock rows (1:1 on `product_id`).
- A `box` contains many `products` through `box_items`.
- A `user` has many `subscriptions`; subscriptions produce `orders`.
- An `order` has many `order_items`, `order_timeline_events`, `payments`, and optional `notifications`.
- An `order` has one delivery record in `deliveries`.
- Vendor operations map through `vendor_queue_orders` and `vendor_inventory_products`.
- Neighborhood tasting assortments are represented by `vendor_inventory_product_neighborhoods` (which **`products`** appear in which neighborhoods); product display names come from **`products.name`** via join/embed, not duplicated on the junction.

## 4) RLS Strategy (planned)

- Enable RLS on all business tables.
- Customer policies: read/write only their own profile, subscriptions, orders, deliveries, notifications.
- Vendor policies: read/write only data linked to their `vendor_id` membership.
- Service role policies: webhook ingestion (`billing_events`), payment reconciliation, system notifications/retries.
