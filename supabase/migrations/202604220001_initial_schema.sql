-- Initial schema placeholder for Neighborhood Tasting Menu.
-- Add auth-linked business tables and RLS policies incrementally.

create table if not exists public.health_checks (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  status text not null default 'ok'
);

alter table public.health_checks enable row level security;
