-- Re-apply dashboard RPC with neighborhood/customer chart payloads.
create or replace function public.get_vendor_analytics_dashboard(
  v_vendor_id uuid,
  v_from timestamptz,
  v_to timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_swap timestamptz;
  v_len interval;
  v_prev_from timestamptz;
  v_prev_to timestamptz;
  v_orders bigint;
  v_gmv bigint;
  v_cancelled bigint;
  v_fulfilled bigint;
  v_open bigint;
  v_prev_orders bigint;
  v_prev_gmv bigint;
  v_sales_days jsonb;
  v_fulfillment_days jsonb;
  v_sales_neighborhood jsonb;
  v_customers_days jsonb;
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

  if v_from > v_to then
    v_swap := v_from;
    v_from := v_to;
    v_to := v_swap;
  end if;

  v_len := v_to - v_from;
  v_prev_from := v_from - v_len;
  v_prev_to := v_to - v_len;

  with vo as (
    select distinct
      o.id as order_id,
      o.total_cents,
      o.status
    from public.vendor_queue_orders q
    inner join public.orders o on o.id = q.order_id
    where q.vendor_id = v_vendor_id
      and o.created_at >= v_from
      and o.created_at <= v_to
  )
  select
    count(*) filter (where status <> 'cancelled'),
    coalesce(sum(total_cents) filter (where status <> 'cancelled'), 0)::bigint,
    count(*) filter (where status = 'cancelled')
  into v_orders, v_gmv, v_cancelled
  from vo;

  select count(*) into v_fulfilled
  from public.vendor_queue_orders q
  where q.vendor_id = v_vendor_id
    and q.status = 'fulfilled'
    and q.updated_at >= v_from
    and q.updated_at <= v_to;

  select count(*) into v_open
  from public.vendor_queue_orders q
  where q.vendor_id = v_vendor_id
    and q.status in ('new', 'confirmed', 'preparing', 'ready');

  with vo as (
    select distinct
      o.id as order_id,
      o.total_cents,
      o.status
    from public.vendor_queue_orders q
    inner join public.orders o on o.id = q.order_id
    where q.vendor_id = v_vendor_id
      and o.created_at >= v_prev_from
      and o.created_at <= v_prev_to
  )
  select
    count(*) filter (where status <> 'cancelled'),
    coalesce(sum(total_cents) filter (where status <> 'cancelled'), 0)::bigint
  into v_prev_orders, v_prev_gmv
  from vo;

  select coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'day', by_day.day::text,
          'order_count', by_day.order_count,
          'gmv_cents', by_day.gmv_cents
        )
        order by by_day.day
      )
      from (
        with vo as (
          select distinct
            o.id as order_id,
            o.created_at,
            o.total_cents,
            o.status
          from public.vendor_queue_orders q
          inner join public.orders o on o.id = q.order_id
          where q.vendor_id = v_vendor_id
            and o.created_at >= v_from
            and o.created_at <= v_to
        )
        select
          (vo.created_at at time zone 'UTC')::date as day,
          count(*) filter (where vo.status <> 'cancelled') as order_count,
          coalesce(sum(vo.total_cents) filter (where vo.status <> 'cancelled'), 0)::bigint as gmv_cents
        from vo
        group by 1
      ) by_day
    ),
    '[]'::jsonb
  )
  into v_sales_days;

  select coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'day', by_day.day::text,
          'fulfilled_count', by_day.fulfilled_count
        )
        order by by_day.day
      )
      from (
        select
          (q.updated_at at time zone 'UTC')::date as day,
          count(*)::bigint as fulfilled_count
        from public.vendor_queue_orders q
        where q.vendor_id = v_vendor_id
          and q.status = 'fulfilled'
          and q.updated_at >= v_from
          and q.updated_at <= v_to
        group by 1
      ) by_day
    ),
    '[]'::jsonb
  )
  into v_fulfillment_days;

  select coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'neighborhood', by_neighborhood.neighborhood,
          'order_count', by_neighborhood.order_count,
          'gmv_cents', by_neighborhood.gmv_cents
        )
        order by by_neighborhood.gmv_cents desc, by_neighborhood.neighborhood
      )
      from (
        with vo as (
          select distinct
            o.id as order_id,
            o.total_cents,
            o.status,
            o.neighborhood_id
          from public.vendor_queue_orders q
          inner join public.orders o on o.id = q.order_id
          where q.vendor_id = v_vendor_id
            and o.created_at >= v_from
            and o.created_at <= v_to
            and o.neighborhood_id is not null
        )
        select
          n.name as neighborhood,
          count(*) filter (where vo.status <> 'cancelled') as order_count,
          coalesce(sum(vo.total_cents) filter (where vo.status <> 'cancelled'), 0)::bigint as gmv_cents
        from vo
        inner join public.neighborhoods n on n.slug = vo.neighborhood_id
        group by 1
      ) by_neighborhood
    ),
    '[]'::jsonb
  )
  into v_sales_neighborhood;

  select coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'day', by_day.day::text,
          'new_customers', by_day.new_customers,
          'returning_customers', by_day.returning_customers
        )
        order by by_day.day
      )
      from (
        with vendor_orders as (
          select distinct
            o.id as order_id,
            o.user_id,
            o.created_at,
            o.status
          from public.vendor_queue_orders q
          inner join public.orders o on o.id = q.order_id
          where q.vendor_id = v_vendor_id
            and o.status <> 'cancelled'
        ),
        first_seen as (
          select
            vo.user_id,
            min(vo.created_at) as first_order_at
          from vendor_orders vo
          group by vo.user_id
        ),
        scoped as (
          select distinct
            (vo.created_at at time zone 'UTC')::date as day,
            vo.user_id,
            (fs.first_order_at at time zone 'UTC')::date = (vo.created_at at time zone 'UTC')::date as is_new
          from vendor_orders vo
          inner join first_seen fs on fs.user_id = vo.user_id
          where vo.created_at >= v_from
            and vo.created_at <= v_to
        )
        select
          scoped.day,
          count(*) filter (where scoped.is_new) as new_customers,
          count(*) filter (where not scoped.is_new) as returning_customers
        from scoped
        group by scoped.day
      ) by_day
    ),
    '[]'::jsonb
  )
  into v_customers_days;

  return jsonb_build_object(
    'period', jsonb_build_object(
      'orders_count', v_orders,
      'gmv_cents', v_gmv,
      'cancelled_orders_count', v_cancelled,
      'fulfilled_tasks_count', v_fulfilled,
      'open_workload_count', v_open
    ),
    'previous', jsonb_build_object(
      'orders_count', v_prev_orders,
      'gmv_cents', v_prev_gmv
    ),
    'sales_by_day', v_sales_days,
    'fulfillments_by_day', v_fulfillment_days,
    'sales_by_neighborhood', v_sales_neighborhood,
    'customers_by_day', v_customers_days
  );
end;
$$;

revoke all on function public.get_vendor_analytics_dashboard(uuid, timestamptz, timestamptz) from public;
grant execute on function public.get_vendor_analytics_dashboard(uuid, timestamptz, timestamptz) to authenticated;
