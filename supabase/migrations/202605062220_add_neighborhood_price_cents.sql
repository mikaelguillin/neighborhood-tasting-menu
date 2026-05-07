alter table public.neighborhoods
add column if not exists price_cents integer;

alter table public.neighborhoods
drop constraint if exists neighborhoods_price_cents_nonnegative;

alter table public.neighborhoods
add constraint neighborhoods_price_cents_nonnegative
check (price_cents is null or price_cents >= 0);
