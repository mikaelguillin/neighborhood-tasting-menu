alter table public.orders
  add column if not exists checkout_metadata jsonb;

comment on column public.orders.checkout_metadata is
  'Structured checkout fields (address, delivery, neighborhood, mode, non-PCI payment hints).';
