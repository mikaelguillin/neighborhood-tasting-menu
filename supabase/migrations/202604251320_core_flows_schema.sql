-- Core flows schema for customer-web and vendor-portal.
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,
  default_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_users (
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  primary key (vendor_id, user_id)
);

create table if not exists public.neighborhoods (
  slug text primary key,
  name text not null,
  borough text not null,
  tagline text not null,
  description text not null,
  image_url text not null,
  price_cents integer check (price_cents >= 0),
  vendors jsonb not null default '[]'::jsonb,
  items text[] not null default '{}'::text[],
  highlight boolean not null default false,
  badge text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id text primary key check (id in ('sampler', 'weekly', 'local-hero')),
  name text not null,
  cadence text not null,
  price_cents integer not null check (price_cents >= 0),
  blurb text not null,
  perks text[] not null default '{}'::text[],
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  plan_id text not null references public.plans (id) on delete restrict,
  plan_name text not null,
  status text not null check (status in ('placed', 'payment_confirmed', 'in_preparation', 'out_for_delivery', 'delivered')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0),
  service_fee_cents integer not null default 0 check (service_fee_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  promo_code text,
  address text not null,
  delivery_window text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_timeline_events (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  status text not null,
  label text not null,
  note text not null,
  event_at timestamptz not null default now()
);

create table if not exists public.vendor_queue_orders (
  id text primary key,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  order_id text references public.orders (id) on delete set null,
  customer_name text not null,
  neighborhood text not null,
  item_count integer not null check (item_count >= 0),
  due_at timestamptz not null,
  sla_minutes_remaining integer not null,
  status text not null check (status in ('new', 'confirmed', 'preparing', 'ready', 'fulfilled')),
  priority text not null check (priority in ('high', 'medium', 'low')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_inventory_items (
  id text primary key,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  name text not null,
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 0 check (low_stock_threshold >= 0),
  available boolean not null default true,
  out_of_stock_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user_id_created_at on public.orders (user_id, created_at desc);
create index if not exists idx_order_timeline_events_order_id_event_at on public.order_timeline_events (order_id, event_at asc);
create index if not exists idx_vendor_queue_orders_vendor_status on public.vendor_queue_orders (vendor_id, status);
create index if not exists idx_vendor_inventory_items_vendor_available on public.vendor_inventory_items (vendor_id, available);
create index if not exists idx_neighborhoods_borough on public.neighborhoods (borough);

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', null))
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.users.full_name),
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_auth_user_created();

alter table public.users enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_users enable row level security;
alter table public.neighborhoods enable row level security;
alter table public.plans enable row level security;
alter table public.orders enable row level security;
alter table public.order_timeline_events enable row level security;
alter table public.vendor_queue_orders enable row level security;
alter table public.vendor_inventory_items enable row level security;

create policy "users_select_own" on public.users
for select using (id = auth.uid());
create policy "users_update_own" on public.users
for update using (id = auth.uid()) with check (id = auth.uid());

create policy "vendors_select_members" on public.vendors
for select using (
  exists (
    select 1
    from public.vendor_users vu
    where vu.vendor_id = id and vu.user_id = auth.uid()
  )
);

create policy "vendor_users_select_own" on public.vendor_users
for select using (user_id = auth.uid());

create policy "neighborhoods_read_all" on public.neighborhoods
for select using (true);
create policy "plans_read_all" on public.plans
for select using (true);

create policy "orders_select_own" on public.orders
for select using (user_id = auth.uid());
create policy "orders_insert_own" on public.orders
for insert with check (user_id = auth.uid());
create policy "orders_update_own" on public.orders
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "order_timeline_select_own" on public.order_timeline_events
for select using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);
create policy "order_timeline_insert_own" on public.order_timeline_events
for insert with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

create policy "vendor_queue_select_member" on public.vendor_queue_orders
for select using (
  exists (
    select 1 from public.vendor_users vu
    where vu.vendor_id = vendor_id and vu.user_id = auth.uid()
  )
);
create policy "vendor_queue_update_member" on public.vendor_queue_orders
for update using (
  exists (
    select 1 from public.vendor_users vu
    where vu.vendor_id = vendor_id and vu.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.vendor_users vu
    where vu.vendor_id = vendor_id and vu.user_id = auth.uid()
  )
);

create policy "vendor_inventory_select_member" on public.vendor_inventory_items
for select using (
  exists (
    select 1 from public.vendor_users vu
    where vu.vendor_id = vendor_id and vu.user_id = auth.uid()
  )
);
create policy "vendor_inventory_update_member" on public.vendor_inventory_items
for update using (
  exists (
    select 1 from public.vendor_users vu
    where vu.vendor_id = vendor_id and vu.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.vendor_users vu
    where vu.vendor_id = vendor_id and vu.user_id = auth.uid()
  )
);
