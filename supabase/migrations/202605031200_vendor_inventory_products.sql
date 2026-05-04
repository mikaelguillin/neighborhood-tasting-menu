-- Inventory table: rename, name -> product_id, unique per vendor.
-- Neighborhoods: drop legacy items[].
-- Junction: vendor inventory rows assigned to neighborhoods (denormalized for public read).

alter table public.vendor_inventory_items
  add column if not exists product_id text;

update public.vendor_inventory_items
set product_id = coalesce(nullif(product_id, ''), name)
where product_id is null or product_id = '';

alter table public.vendor_inventory_items
  alter column product_id set not null;

alter table public.vendor_inventory_items
  drop column if exists name;

alter table public.vendor_inventory_items
  add constraint vendor_inventory_products_vendor_product_key unique (vendor_id, product_id);

alter table public.vendor_inventory_items rename to vendor_inventory_products;

alter index if exists idx_vendor_inventory_items_vendor_available
  rename to idx_vendor_inventory_products_vendor_available;

alter table public.neighborhoods drop column if exists items;

create table if not exists public.vendor_inventory_product_neighborhoods (
  inventory_id text not null references public.vendor_inventory_products (id) on delete cascade,
  neighborhood_slug text not null references public.neighborhoods (slug) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  product_id text not null,
  primary key (inventory_id, neighborhood_slug)
);

create index if not exists idx_vendor_inv_prod_nh_neighborhood
  on public.vendor_inventory_product_neighborhoods (neighborhood_slug);

create or replace function public.sync_vendor_inventory_product_id_to_junction()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.product_id is distinct from old.product_id then
    update public.vendor_inventory_product_neighborhoods j
    set product_id = new.product_id
    where j.inventory_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_vendor_inventory_products_product_id on public.vendor_inventory_products;
create trigger trg_vendor_inventory_products_product_id
after update of product_id on public.vendor_inventory_products
for each row
when (old.product_id is distinct from new.product_id)
execute procedure public.sync_vendor_inventory_product_id_to_junction();

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

create policy "vendor_inventory_insert_member" on public.vendor_inventory_products
for insert
with check (
  exists (
    select 1 from public.vendor_users vu
    where vu.vendor_id = vendor_id and vu.user_id = auth.uid()
  )
);

create policy "vendor_inventory_delete_member" on public.vendor_inventory_products
for delete
using (
  exists (
    select 1 from public.vendor_users vu
    where vu.vendor_id = vendor_id and vu.user_id = auth.uid()
  )
);
