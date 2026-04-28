-- Allow customer-facing discovery surfaces to read active vendors.
drop policy if exists "vendors_read_active_all" on public.vendors;
create policy "vendors_read_active_all" on public.vendors
for select using (status = 'active');
