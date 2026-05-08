-- Ensure every vendor queue row is anchored to a canonical order.
-- Remove orphaned queue rows before adding NOT NULL + stricter FK behavior.
delete from public.vendor_queue_orders
where order_id is null;

alter table public.vendor_queue_orders
  drop constraint if exists vendor_queue_orders_order_id_fkey;

alter table public.vendor_queue_orders
  alter column order_id set not null;

alter table public.vendor_queue_orders
  add constraint vendor_queue_orders_order_id_fkey
  foreign key (order_id) references public.orders (id) on delete restrict;
