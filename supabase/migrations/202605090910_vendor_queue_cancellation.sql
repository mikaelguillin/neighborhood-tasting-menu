-- Allow queue rows to reflect cancelled orders; propagate from orders.status.
alter table public.vendor_queue_orders
  drop constraint if exists vendor_queue_orders_status_check;

alter table public.vendor_queue_orders
  add constraint vendor_queue_orders_status_check
  check (status in ('new', 'confirmed', 'preparing', 'ready', 'fulfilled', 'cancelled'));

create or replace function public.handle_order_cancelled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update public.vendor_queue_orders
       set status = 'cancelled',
           updated_at = now()
     where order_id = new.id
       and status <> 'cancelled';
  end if;
  return new;
end;
$$;

drop trigger if exists on_order_cancelled on public.orders;
create trigger on_order_cancelled
after update of status on public.orders
for each row execute procedure public.handle_order_cancelled();
