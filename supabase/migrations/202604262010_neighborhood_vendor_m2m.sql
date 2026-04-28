-- Normalize neighborhoods <-> vendors into a join table.
create table if not exists public.neighborhood_vendors (
  neighborhood_slug text not null references public.neighborhoods (slug) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (neighborhood_slug, vendor_id)
);

create index if not exists idx_neighborhood_vendors_vendor_id on public.neighborhood_vendors (vendor_id);

-- Backfill legacy neighborhoods.vendors JSONB values into join rows.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'neighborhoods'
      and column_name = 'vendors'
  ) then
    execute $sql$
      insert into public.neighborhood_vendors (neighborhood_slug, vendor_id)
      select
        n.slug,
        (entry.value)::uuid as vendor_id
      from public.neighborhoods n
      cross join lateral jsonb_array_elements_text(
        case
          when jsonb_typeof(n.vendors) = 'array' then n.vendors
          else '[]'::jsonb
        end
      ) as entry(value)
      where entry.value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        and exists (
          select 1
          from public.vendors v
          where v.id = (entry.value)::uuid
        )
      on conflict (neighborhood_slug, vendor_id) do nothing
    $sql$;
  end if;
end;
$$;

alter table public.neighborhood_vendors enable row level security;

drop policy if exists "neighborhood_vendors_read_all" on public.neighborhood_vendors;
create policy "neighborhood_vendors_read_all" on public.neighborhood_vendors
for select using (true);

drop policy if exists "neighborhood_vendors_insert_member" on public.neighborhood_vendors;
create policy "neighborhood_vendors_insert_member" on public.neighborhood_vendors
for insert with check (
  exists (
    select 1 from public.vendor_users vu
    where vu.vendor_id = vendor_id and vu.user_id = auth.uid()
  )
);

drop policy if exists "neighborhood_vendors_delete_member" on public.neighborhood_vendors;
create policy "neighborhood_vendors_delete_member" on public.neighborhood_vendors
for delete using (
  exists (
    select 1 from public.vendor_users vu
    where vu.vendor_id = vendor_id and vu.user_id = auth.uid()
  )
);

alter table public.neighborhoods drop column if exists vendors;
