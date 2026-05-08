-- Vendor-safe queue reader with plan/neighborhood metadata.
create or replace function public.get_vendor_queue_orders(v_vendor_id uuid)
returns table (
  id text,
  order_id text,
  due_at timestamptz,
  sla_minutes_remaining integer,
  status text,
  priority text,
  source_type text,
  source_label text,
  source_slug text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.vendor_users vu
    where vu.vendor_id = v_vendor_id
      and vu.user_id = auth.uid()
  ) then
    raise exception 'Vendor membership required';
  end if;

  return query
  select
    q.id,
    q.order_id,
    q.due_at,
    q.sla_minutes_remaining,
    q.status,
    q.priority,
    case
      when o.plan_id is not null then 'plan'
      when o.neighborhood_id is not null then 'neighborhood'
      else null
    end as source_type,
    coalesce(p.name, n.name, o.plan_id, o.neighborhood_id, q.order_id) as source_label,
    coalesce(n.slug, o.neighborhood_id, p.id, o.plan_id) as source_slug
  from public.vendor_queue_orders q
  left join public.orders o on o.id = q.order_id
  left join public.plans p on p.id = o.plan_id
  left join public.neighborhoods n on n.slug = o.neighborhood_id
  where q.vendor_id = v_vendor_id
  order by q.due_at asc;
end;
$$;

revoke all on function public.get_vendor_queue_orders(uuid) from public;
grant execute on function public.get_vendor_queue_orders(uuid) to authenticated;
