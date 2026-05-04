-- Vendor inventory products: name, description, system-generated product_id (uuid).
-- Junction: product_id uuid + denormalized product_name for public discovery.

drop trigger if exists trg_vendor_inventory_products_product_id on public.vendor_inventory_products;
drop function if exists public.sync_vendor_inventory_product_id_to_junction();

drop table if exists public.vendor_inventory_product_neighborhoods;

alter table public.vendor_inventory_products
  add column if not exists name text;

alter table public.vendor_inventory_products
  add column if not exists description text;

update public.vendor_inventory_products
set
  name = coalesce(
    nullif(trim(name), ''),
    initcap(replace(replace(product_id::text, '-', ' '), '_', ' '))
  )
where name is null or trim(coalesce(name, '')) = '';

alter table public.vendor_inventory_products
  alter column name set not null;

alter table public.vendor_inventory_products
  add column if not exists product_uuid uuid default gen_random_uuid();

update public.vendor_inventory_products
set product_uuid = gen_random_uuid()
where product_uuid is null;

alter table public.vendor_inventory_products
  alter column product_uuid set not null,
  alter column product_uuid set default gen_random_uuid();

alter table public.vendor_inventory_products
  drop constraint if exists vendor_inventory_products_vendor_product_key;

alter table public.vendor_inventory_products
  drop column if exists product_id;

alter table public.vendor_inventory_products
  rename column product_uuid to product_id;

alter table public.vendor_inventory_products
  add constraint vendor_inventory_products_product_id_key unique (product_id);

create table public.vendor_inventory_product_neighborhoods (
  inventory_id text not null references public.vendor_inventory_products (id) on delete cascade,
  neighborhood_slug text not null references public.neighborhoods (slug) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  product_id uuid not null references public.vendor_inventory_products (product_id) on delete cascade,
  product_name text not null,
  primary key (inventory_id, neighborhood_slug)
);

create index if not exists idx_vendor_inv_prod_nh_neighborhood
  on public.vendor_inventory_product_neighborhoods (neighborhood_slug);

create or replace function public.sync_vendor_inventory_name_to_junction()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.name is distinct from old.name then
    update public.vendor_inventory_product_neighborhoods j
    set product_name = new.name
    where j.inventory_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_vendor_inventory_products_name on public.vendor_inventory_products;
create trigger trg_vendor_inventory_products_name
after update of name on public.vendor_inventory_products
for each row
when (old.name is distinct from new.name)
execute procedure public.sync_vendor_inventory_name_to_junction();

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
