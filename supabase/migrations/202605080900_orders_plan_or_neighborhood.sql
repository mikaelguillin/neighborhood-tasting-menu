-- Orders can originate from either a plan subscription flow or a one-time neighborhood box flow.
-- This migration removes denormalized `plan_name`, adds `neighborhood_id`, makes `plan_id` nullable,
-- and enforces that exactly one of (`plan_id`, `neighborhood_id`) is set.

alter table public.orders
  add column if not exists neighborhood_id text references public.neighborhoods (slug) on delete restrict;

alter table public.orders
  alter column plan_id drop not null;

alter table public.orders
  drop column if exists plan_name;

alter table public.orders
  drop constraint if exists orders_plan_or_neighborhood_chk;

alter table public.orders
  add constraint orders_plan_or_neighborhood_chk
  check ((plan_id is null) != (neighborhood_id is null));

