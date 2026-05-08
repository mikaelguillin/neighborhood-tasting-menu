-- Fan out vendor_queue_orders rows when a customer order is inserted.
create or replace function public.handle_order_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.neighborhood_id is not null then
    insert into public.vendor_queue_orders
      (id, vendor_id, order_id, due_at, sla_minutes_remaining, status, priority)
    select
      'q_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
      nv.vendor_id,
      new.id,
      new.created_at + interval '90 minutes',
      90,
      'new',
      'medium'
    from public.neighborhood_vendors nv
    where nv.neighborhood_slug = new.neighborhood_id;
  elsif new.plan_id is not null then
    insert into public.vendor_queue_orders
      (id, vendor_id, order_id, due_at, sla_minutes_remaining, status, priority)
    select
      'q_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
      v.id,
      new.id,
      new.created_at + interval '90 minutes',
      90,
      'new',
      'medium'
    from public.vendors v
    where v.status = 'active';
  end if;
  return new;
end;
$$;

drop trigger if exists on_order_inserted on public.orders;
create trigger on_order_inserted
after insert on public.orders
for each row execute procedure public.handle_order_inserted();
