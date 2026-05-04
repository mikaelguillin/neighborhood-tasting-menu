-- New catalog rows need a generated primary key when the app omits `id`.
alter table public.products
  alter column id set default gen_random_uuid();
