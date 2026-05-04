alter table public.orders
add column if not exists payment_method text;

update public.orders
set payment_method = coalesce(payment_method, 'card')
where payment_method is null;

alter table public.orders
alter column payment_method set not null;

alter table public.orders
alter column payment_method set default 'card';

alter table public.orders
drop constraint if exists orders_payment_method_check;

alter table public.orders
add constraint orders_payment_method_check
check (payment_method in ('card', 'apple_pay', 'cash'));
