-- Remove denormalized vendor queue display fields that can be derived elsewhere.
alter table public.vendor_queue_orders
  drop column if exists customer_name,
  drop column if exists neighborhood,
  drop column if exists item_count;
