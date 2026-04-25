insert into public.health_checks (status) values ('ok');

-- Demo auth users for local development.
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  reauthentication_token,
  phone_change,
  phone_change_token,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'customer@demo.local',
    crypt('password123', gen_salt('bf')),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Customer Demo"}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'vendor@demo.local',
    crypt('password123', gen_salt('bf')),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Vendor Demo"}'::jsonb
  )
on conflict (id) do nothing;

-- Required for email/password login in Supabase Auth.
insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '11111111-1111-1111-1111-111111111111',
    'customer@demo.local',
    '{"sub":"11111111-1111-1111-1111-111111111111","email":"customer@demo.local","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '22222222-2222-2222-2222-222222222222',
    'vendor@demo.local',
    '{"sub":"22222222-2222-2222-2222-222222222222","email":"vendor@demo.local","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider_id, provider) do nothing;

insert into public.vendors (id, name, slug, description, status)
values (
  '33333333-3333-3333-3333-333333333333',
  'Neighborhood Demo Kitchen',
  'neighborhood-demo-kitchen',
  'Demo vendor used for local dashboard and order operations.',
  'active'
)
on conflict (id) do nothing;

insert into public.vendor_users (vendor_id, user_id, role)
values ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'owner')
on conflict (vendor_id, user_id) do nothing;

insert into public.plans (id, name, cadence, price_cents, blurb, perks, featured)
values
  (
    'sampler',
    'The Sampler',
    'Every other week',
    5800,
    'A taste of one new neighborhood twice a month. Great for solo eaters.',
    array['5-6 curated items per box', 'Free delivery in pilot zones', 'Skip any week', 'Cancel any time'],
    false
  ),
  (
    'weekly',
    'The Weekly',
    'Every Friday',
    7200,
    'Our signature plan - a fresh neighborhood each week, packed for two.',
    array['6-8 curated items per box', 'First delivery free', 'Priority delivery window', 'Member-only seasonal drops'],
    true
  ),
  (
    'local-hero',
    'The Local Hero',
    'Every Friday + extras',
    11800,
    'A larger box for households or small offices, with a quarterly maker visit.',
    array['10-12 curated items per box', 'Free delivery, every week', 'Quarterly behind-the-counter visit', 'Gift one box per quarter'],
    false
  )
on conflict (id) do update
set
  name = excluded.name,
  cadence = excluded.cadence,
  price_cents = excluded.price_cents,
  blurb = excluded.blurb,
  perks = excluded.perks,
  featured = excluded.featured,
  updated_at = now();

insert into public.neighborhoods (
  slug,
  name,
  borough,
  tagline,
  description,
  image_url,
  vendors,
  items,
  highlight,
  badge
)
values
  (
    'long-island-city',
    'The Best of Long Island City',
    'Queens',
    'Sourdough, cold brew & Brooklyn-roasted comfort.',
    'A pilot box from the LIC waterfront - slow-fermented sourdough, hand-rolled bagels, and small-batch pantry staples.',
    '/assets/box-lic.jpg',
    '[{"name":"Hunters Point Bakery","craft":"Sourdough & country breads"},{"name":"5 Borough Bagel Co.","craft":"Hand-rolled bagels"},{"name":"Vernon Pantry","craft":"Nut butters & preserves"},{"name":"Pier 26 Roasters","craft":"Single-origin coffee"}]'::jsonb,
    array[
      'Country sourdough loaf - Hunters Point Bakery',
      'Half-dozen hand-rolled bagels - 5 Borough Bagel Co.',
      'Small-batch peanut butter - Vernon Pantry',
      '12oz single-origin cold brew - Pier 26 Roasters',
      'Dark chocolate bar - Queens Cocoa'
    ],
    true,
    'Pilot Neighborhood'
  ),
  (
    'west-village',
    'West Village Essentials',
    'Manhattan',
    'Croissants, brie, charcuterie - a Sunday morning, boxed.',
    'An unhurried West Village brunch in a single delivery.',
    '/assets/box-west-village.jpg',
    '[{"name":"Rue Perry","craft":"French viennoiserie"},{"name":"The Cheese Counter","craft":"Affineur & cheesemonger"},{"name":"Carmine St. Salumi","craft":"Cured meats"},{"name":"Bleecker Pantry","craft":"Preserves & pantry"}]'::jsonb,
    array[
      'Two all-butter croissants - Rue Perry',
      'Mini wheel of brie - The Cheese Counter',
      'Sliced prosciutto & coppa - Carmine St. Salumi',
      'Black mission fig jam - Bleecker Pantry',
      'Box of cocoa-dusted truffles - Greenwich Chocolatier'
    ],
    false,
    null
  ),
  (
    'astoria',
    'The Best of Astoria',
    'Queens',
    'Phyllo, honey & olives from 30th Avenue.',
    'A walk down 30th Avenue without leaving your apartment.',
    '/assets/box-astoria.jpg',
    '[{"name":"Athena Sweets","craft":"Greek pastries"},{"name":"30th Ave Bakery","craft":"Pita & flatbreads"},{"name":"Ditmars Deli","craft":"Olives & antipasti"},{"name":"Hellenic Apiaries","craft":"Wildflower honey"}]'::jsonb,
    array[
      'Pistachio baklava (8 pieces) - Athena Sweets',
      'Fresh pita & lavash - 30th Ave Bakery',
      'Marinated Kalamata olives - Ditmars Deli',
      'Wildflower honey jar - Hellenic Apiaries',
      'Spiced halva bar - Levantine & Co.'
    ],
    false,
    null
  ),
  (
    'lower-east-side',
    'Lower East Side Classics',
    'Manhattan',
    'Black-and-white cookies, knishes & a Sunday babka.',
    'The deli classics that built the LES, gathered into one box.',
    '/assets/box-les.jpg',
    '[{"name":"Orchard St. Bakeshop","craft":"Bagels & bialys"},{"name":"Rivington Knish Co.","craft":"Knishes & savory pastries"},{"name":"Essex St. Picklers","craft":"Pickles & ferments"},{"name":"Delancey Bakery","craft":"Babka & rugelach"}]'::jsonb,
    array[
      'Half-dozen everything bagels - Orchard St. Bakeshop',
      'Potato knishes (4) - Rivington Knish Co.',
      'Half-sour pickle jar - Essex St. Picklers',
      'Mini chocolate babka - Delancey Bakery',
      'Black-and-white cookies (2) - Houston St. Pastry'
    ],
    false,
    null
  )
on conflict (slug) do update
set
  name = excluded.name,
  borough = excluded.borough,
  tagline = excluded.tagline,
  description = excluded.description,
  image_url = excluded.image_url,
  vendors = excluded.vendors,
  items = excluded.items,
  highlight = excluded.highlight,
  badge = excluded.badge,
  updated_at = now();

insert into public.orders (
  id,
  user_id,
  plan_id,
  plan_name,
  status,
  subtotal_cents,
  delivery_fee_cents,
  service_fee_cents,
  discount_cents,
  total_cents,
  promo_code,
  address,
  delivery_window,
  created_at
)
values (
  'ord_demo_weekly',
  '11111111-1111-1111-1111-111111111111',
  'weekly',
  'The Weekly',
  'in_preparation',
  7200,
  0,
  400,
  0,
  7600,
  null,
  '50-25 Center Blvd, Long Island City, NY',
  'Friday 4:00 PM - 7:00 PM',
  now() - interval '90 minutes'
)
on conflict (id) do nothing;

insert into public.order_timeline_events (order_id, status, label, note, event_at)
values
  ('ord_demo_weekly', 'placed', 'Order placed', 'We received your order and reserved your neighborhood box.', now() - interval '90 minutes'),
  ('ord_demo_weekly', 'payment_confirmed', 'Payment confirmed', 'Your payment was processed and your order is now locked in.', now() - interval '75 minutes'),
  ('ord_demo_weekly', 'in_preparation', 'In preparation', 'Makers are assembling your box for the upcoming delivery cycle.', now() - interval '40 minutes')
on conflict do nothing;

insert into public.vendor_queue_orders (
  id,
  vendor_id,
  order_id,
  customer_name,
  neighborhood,
  item_count,
  due_at,
  sla_minutes_remaining,
  status,
  priority
)
values
  ('q_1001', '33333333-3333-3333-3333-333333333333', 'ord_demo_weekly', 'A. Parker', 'Long Island City', 7, now() + interval '42 minutes', 42, 'new', 'high'),
  ('q_1002', '33333333-3333-3333-3333-333333333333', null, 'R. Singh', 'Astoria', 5, now() + interval '88 minutes', 88, 'confirmed', 'medium'),
  ('q_1003', '33333333-3333-3333-3333-333333333333', null, 'J. Chen', 'West Village', 8, now() + interval '27 minutes', 27, 'preparing', 'high')
on conflict (id) do nothing;

insert into public.vendor_inventory_items (
  id,
  vendor_id,
  name,
  stock,
  low_stock_threshold,
  available,
  out_of_stock_reason
)
values
  ('inv_001', '33333333-3333-3333-3333-333333333333', 'Country Sourdough Loaf', 32, 15, true, null),
  ('inv_002', '33333333-3333-3333-3333-333333333333', 'Mini Chocolate Babka', 9, 10, true, null),
  ('inv_003', '33333333-3333-3333-3333-333333333333', 'Half-Dozen Bagels', 0, 8, false, 'Flour delivery delayed'),
  ('inv_004', '33333333-3333-3333-3333-333333333333', 'Wildflower Honey Jar', 14, 12, true, null)
on conflict (id) do nothing;
