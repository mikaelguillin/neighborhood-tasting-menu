alter table public.products
add column if not exists price_cents integer;

alter table public.products
drop constraint if exists products_price_cents_nonnegative;

alter table public.products
add constraint products_price_cents_nonnegative
check (price_cents is null or price_cents >= 0);
