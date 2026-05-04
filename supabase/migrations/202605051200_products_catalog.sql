-- Canonical products (name, description) + slim neighborhood junction (no denormalized columns).

create table public._migration_vinh_backup as
select distinct
  i.product_id,
  j.neighborhood_slug,
  j.vendor_id
from public.vendor_inventory_product_neighborhoods j
inner join public.vendor_inventory_products i on i.id = j.inventory_id;

drop trigger if exists trg_vendor_inventory_products_name on public.vendor_inventory_products;
drop function if exists public.sync_vendor_inventory_name_to_junction();

drop table if exists public.vendor_inventory_product_neighborhoods;

create table public.products (
  id uuid primary key,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.products (id, vendor_id, name, description, created_at, updated_at)
select
  v.product_id,
  v.vendor_id,
  v.name,
  v.description,
  v.created_at,
  v.updated_at
from public.vendor_inventory_products v;

alter table public.vendor_inventory_products
  drop column if exists name;

alter table public.vendor_inventory_products
  drop column if exists description;

alter table public.vendor_inventory_products
  drop constraint if exists vendor_inventory_products_product_id_fkey;

alter table public.vendor_inventory_products
  add constraint vendor_inventory_products_product_id_fkey
  foreign key (product_id) references public.products (id) on delete cascade;

create table public.vendor_inventory_product_neighborhoods (
  product_id uuid not null references public.products (id) on delete cascade,
  neighborhood_slug text not null references public.neighborhoods (slug) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  primary key (product_id, neighborhood_slug)
);

insert into public.vendor_inventory_product_neighborhoods (product_id, neighborhood_slug, vendor_id)
select product_id, neighborhood_slug, vendor_id
from public._migration_vinh_backup;

drop table if exists public._migration_vinh_backup;

create index if not exists idx_vendor_inv_prod_nh_neighborhood
  on public.vendor_inventory_product_neighborhoods (neighborhood_slug);

alter table public.products enable row level security;

create policy "products_select_if_listed"
  on public.products
  for select
  using (
    exists (
      select 1
      from public.vendor_inventory_product_neighborhoods j
      where j.product_id = products.id
    )
  );

create policy "products_select_vendor_member"
  on public.products
  for select
  using (
    exists (
      select 1 from public.vendor_users vu
      where vu.vendor_id = products.vendor_id and vu.user_id = auth.uid()
    )
  );

create policy "products_insert_vendor_member"
  on public.products
  for insert
  with check (
    exists (
      select 1 from public.vendor_users vu
      where vu.vendor_id = products.vendor_id and vu.user_id = auth.uid()
    )
  );

create policy "products_update_vendor_member"
  on public.products
  for update
  using (
    exists (
      select 1 from public.vendor_users vu
      where vu.vendor_id = products.vendor_id and vu.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.vendor_users vu
      where vu.vendor_id = products.vendor_id and vu.user_id = auth.uid()
    )
  );

create policy "products_delete_vendor_member"
  on public.products
  for delete
  using (
    exists (
      select 1 from public.vendor_users vu
      where vu.vendor_id = products.vendor_id and vu.user_id = auth.uid()
    )
  );

alter table public.vendor_inventory_product_neighborhoods enable row level security;

create policy "vendor_inventory_product_neighborhoods_read_all"
  on public.vendor_inventory_product_neighborhoods
  for select
  using (true);

create policy "vendor_inventory_product_neighborhoods_insert_member"
  on public.vendor_inventory_product_neighborhoods
  for insert
  with check (
    exists (
      select 1 from public.vendor_users vu
      where vu.vendor_id = vendor_id and vu.user_id = auth.uid()
    )
  );

create policy "vendor_inventory_product_neighborhoods_delete_member"
  on public.vendor_inventory_product_neighborhoods
  for delete
  using (
    exists (
      select 1 from public.vendor_users vu
      where vu.vendor_id = vendor_id and vu.user_id = auth.uid()
    )
  );
