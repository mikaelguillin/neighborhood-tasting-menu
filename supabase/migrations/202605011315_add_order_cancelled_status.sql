alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders
add constraint orders_status_check check (
  status in (
    'placed',
    'payment_confirmed',
    'in_preparation',
    'out_for_delivery',
    'delivered',
    'cancelled'
  )
);
