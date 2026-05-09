insert into public.health_checks (status) values ('ok');

-- Base plans used by seeded plan-based orders.
insert into public.plans (id, name, cadence, price_cents, blurb, perks, featured)
values
  (
    'sampler',
    'The Sampler',
    'Every other week',
    5800,
    'A taste of one new neighborhood twice a month.',
    array['5-6 curated items', 'Skip any week', 'Cancel anytime'],
    false
  ),
  (
    'weekly',
    'The Weekly',
    'Every Friday',
    7200,
    'A fresh neighborhood each week, packed for two.',
    array['6-8 curated items', 'Priority delivery window', 'Member-only drops'],
    true
  ),
  (
    'local-hero',
    'The Local Hero',
    'Every Friday + extras',
    11800,
    'A larger box for households with premium local selections.',
    array['10-12 curated items', 'Free weekly delivery', 'Quarterly extras'],
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

-- Neighborhoods loaded from supabase/neighborhoods_rows.csv.
insert into public.neighborhoods (
  slug,
  name,
  borough,
  tagline,
  description,
  image_url,
  price_cents,
  highlight,
  badge,
  created_at,
  updated_at
)
values
  ('astoria', 'The Best of Astoria', 'Queens', 'Phyllo, honey & olives from 30th Avenue.', 'A walk down 30th Avenue without leaving your apartment.', '/assets/box-astoria.jpg', 7000, false, null, '2026-04-27 00:14:34.752865+00', '2026-04-27 00:14:34.752865+00'),
  ('bushwick-taqueria', 'Bushwick Taqueria', 'Brooklyn', 'Al pastor, salsa verde & churros from Knickerbocker.', 'Al pastor, salsa verde & churros from Knickerbocker.', '/assets/box-bushwick.jpg', 7300, false, null, '2026-05-07 01:01:18.878842+00', '2026-05-07 01:01:18.878842+00'),
  ('chinatown-market', 'Chinatown Market', 'Manhattan', 'Dim sum, chili crisp & oolong from Mott Street.', 'Dim sum, chili crisp & oolong from Mott Street.', '/assets/box-chinatown.jpg', 7600, false, null, '2026-05-07 00:58:00.464312+00', '2026-05-07 00:58:00.464312+00'),
  ('harlem-soul', 'Harlem Soul', 'Manhattan', 'Cornbread, hot sauce & sweet potato pie.', 'Cornbread, hot sauce & sweet potato pie.', '/assets/box-harlem.jpg', 7400, false, null, '2026-05-07 00:47:55.777984+00', '2026-05-07 00:47:55.777984+00'),
  ('long-island-city', 'The Best of Long Island City', 'Queens', 'Sourdough, cold brew & Brooklyn-roasted comfort.', 'A pilot box from the LIC waterfront - slow-fermented sourdough, hand-rolled bagels, and small-batch pantry staples.', '/assets/box-lic.jpg', 7200, true, 'Pilot Neighborhood', '2026-04-27 00:14:34.752865+00', '2026-04-27 00:14:34.752865+00'),
  ('lower-east-side', 'Lower East Side Classics', 'Manhattan', 'Black-and-white cookies, knishes & a Sunday babka.', 'The deli classics that built the LES, gathered into one box.', '/assets/box-les.jpg', 7400, false, null, '2026-04-27 00:14:34.752865+00', '2026-04-27 00:14:34.752865+00'),
  ('park-slope-pantry', 'Park Slope Pantry', 'Brooklyn', 'Fresh pasta, marinara & cold-pressed olive oil.', 'Fresh pasta, marinara & cold-pressed olive oil.', '/assets/box-park-slope.jpg', 7500, false, null, '2026-05-07 00:56:26.164657+00', '2026-05-07 00:56:26.164657+00'),
  ('upper-west-side-brunch', 'Upper West Side Brunch', 'Manhattan', 'Smoked salmon, bagels & a pot of Earl Grey.', 'Smoked salmon, bagels & a pot of Earl Grey.', '/assets/box-upper-west-side.jpg', 7700, false, null, '2026-05-07 01:03:14.842028+00', '2026-05-07 01:03:14.842028+00'),
  ('west-village', 'West Village Essentials', 'Manhattan', 'Croissants, brie, charcuterie - a Sunday morning, boxed.', 'An unhurried West Village brunch in a single delivery.', '/assets/box-west-village.jpg', 7600, false, null, '2026-04-27 00:14:34.752865+00', '2026-04-27 00:14:34.752865+00'),
  ('williamsburg-provisions', 'Williamsburg Provisions', 'Brooklyn', 'Craft beer, aged cheddar & wood-fired bread.', 'Craft beer, aged cheddar & wood-fired bread.', '/assets/box-williamsburg.jpg', 7800, false, null, '2026-05-07 00:43:49.557505+00', '2026-05-07 00:43:49.557505+00')
on conflict (slug) do update
set
  name = excluded.name,
  borough = excluded.borough,
  tagline = excluded.tagline,
  description = excluded.description,
  image_url = excluded.image_url,
  price_cents = excluded.price_cents,
  highlight = excluded.highlight,
  badge = excluded.badge,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

insert into public.vendors (id, name, slug, description, status)
values
  (
    '33333333-3333-3333-3333-333333333333',
    'Northside Makers Collective',
    'northside-makers-collective',
    'Brooklyn and Queens focused kitchen collective for weekly box prep.',
    'active'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Downtown Pantry Studio',
    'downtown-pantry-studio',
    'Manhattan focused team curating neighborhood pantry and brunch boxes.',
    'active'
  )
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

-- Vendor login users for vendor portal access.
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
    '55555555-5555-5555-5555-555555555555',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'vendor.northside@demo.local',
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
    '{"full_name":"Noah Ortiz"}'::jsonb
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'vendor.downtown@demo.local',
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
    '{"full_name":"Maya Brooks"}'::jsonb
  )
on conflict (id) do update
set
  email = excluded.email,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

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
    '77777777-7777-4777-8777-777777777771',
    '55555555-5555-5555-5555-555555555555',
    'vendor.northside@demo.local',
    '{"sub":"55555555-5555-5555-5555-555555555555","email":"vendor.northside@demo.local","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '77777777-7777-4777-8777-777777777772',
    '66666666-6666-6666-6666-666666666666',
    'vendor.downtown@demo.local',
    '{"sub":"66666666-6666-6666-6666-666666666666","email":"vendor.downtown@demo.local","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider_id, provider) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.users (id, email, full_name, phone, default_address)
values
  (
    '55555555-5555-5555-5555-555555555555',
    'vendor.northside@demo.local',
    'Noah Ortiz',
    '555-020-0001',
    '125 Greenpoint Ave, Brooklyn, NY'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'vendor.downtown@demo.local',
    'Maya Brooks',
    '555-020-0002',
    '78 Bleecker St, New York, NY'
  )
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  phone = excluded.phone,
  default_address = excluded.default_address,
  updated_at = now();

insert into public.vendor_users (vendor_id, user_id, role)
values
  ('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'owner'),
  ('44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'owner')
on conflict (vendor_id, user_id) do update
set role = excluded.role;

-- 100 seeded catalog products split across both vendors.
with product_adjectives as (
  select * from unnest(array[
    'Smoked', 'Spicy', 'Honey', 'Roasted', 'Citrus',
    'Herbed', 'Garlic', 'Maple', 'Sesame', 'Truffle'
  ]) with ordinality as t(adjective, adjective_idx)
),
product_nouns as (
  select * from unnest(array[
    'Chicken Skewers', 'Pork Dumplings', 'Veggie Wrap', 'Lentil Salad', 'Mushroom Tart',
    'Cheese Board', 'Bagel Bites', 'Pasta Bowl', 'Rice Cakes', 'Brownie Box'
  ]) with ordinality as t(noun, noun_idx)
),
product_seed as (
  select
    ((a.adjective_idx - 1) * 10 + n.noun_idx) as idx,
    a.adjective as adjective,
    n.noun as noun,
    a.adjective || ' ' || n.noun as name
  from product_adjectives a
  cross join product_nouns n
)
insert into public.products (id, vendor_id, name, description, price_cents, created_at, updated_at)
select
  ('90000000-0000-4000-8000-' || lpad(ps.idx::text, 12, '0'))::uuid as id,
  case when ps.idx <= 50
    then '33333333-3333-3333-3333-333333333333'::uuid
    else '44444444-4444-4444-4444-444444444444'::uuid
  end as vendor_id,
  ps.name,
  case ps.noun
    when 'Chicken Skewers' then
      ps.adjective || ' marinated chicken skewers grilled over high heat and finished with charred scallions.'
    when 'Pork Dumplings' then
      ps.adjective || ' pork dumplings wrapped by hand and served with a ginger-soy dipping sauce.'
    when 'Veggie Wrap' then
      ps.adjective || ' veggie wrap layered with crisp greens, pickled onion, and a house yogurt spread.'
    when 'Lentil Salad' then
      ps.adjective || ' lentil salad with roasted vegetables, herbs, and a bright lemon vinaigrette.'
    when 'Mushroom Tart' then
      ps.adjective || ' mushroom tart on buttery pastry with caramelized onions and whipped ricotta.'
    when 'Cheese Board' then
      ps.adjective || ' cheese board with rotating local cheeses, seasonal fruit, and seeded crackers.'
    when 'Bagel Bites' then
      ps.adjective || ' bagel bites baked daily with cultured cream cheese and crunchy garnish.'
    when 'Pasta Bowl' then
      ps.adjective || ' pasta bowl tossed to order with slow-simmered sauce and grated aged cheese.'
    when 'Rice Cakes' then
      ps.adjective || ' rice cakes crisped in a cast-iron pan and topped with fresh herb relish.'
    else
      ps.adjective || ' brownie box with fudgy centers, flaky sea salt, and a cocoa-rich finish.'
  end as description,
  900 + (ps.idx * 55) as price_cents,
  now() - (ps.idx * interval '30 minutes'),
  now()
from product_seed ps
on conflict (id) do update
set
  vendor_id = excluded.vendor_id,
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  updated_at = now();

with seeded_products as (
  select
    ('90000000-0000-4000-8000-' || lpad(gs::text, 12, '0'))::uuid as product_id,
    gs as idx,
    case when gs <= 50
      then '33333333-3333-3333-3333-333333333333'::uuid
      else '44444444-4444-4444-4444-444444444444'::uuid
    end as vendor_id
  from generate_series(1, 100) as gs
)
insert into public.vendor_inventory_products (
  id,
  vendor_id,
  product_id,
  stock,
  low_stock_threshold,
  available,
  out_of_stock_reason,
  created_at,
  updated_at
)
select
  'inv_seed_' || lpad(sp.idx::text, 3, '0') as id,
  sp.vendor_id,
  sp.product_id,
  18 + ((sp.idx * 7) % 45) as stock,
  8 + (sp.idx % 10) as low_stock_threshold,
  true as available,
  null::text as out_of_stock_reason,
  now() - (sp.idx * interval '25 minutes'),
  now()
from seeded_products sp
on conflict (id) do update
set
  vendor_id = excluded.vendor_id,
  product_id = excluded.product_id,
  stock = excluded.stock,
  low_stock_threshold = excluded.low_stock_threshold,
  available = excluded.available,
  out_of_stock_reason = excluded.out_of_stock_reason,
  updated_at = now();

with seeded_products as (
  select
    ('90000000-0000-4000-8000-' || lpad(gs::text, 12, '0'))::uuid as product_id,
    gs as idx,
    case when gs <= 50
      then '33333333-3333-3333-3333-333333333333'::uuid
      else '44444444-4444-4444-4444-444444444444'::uuid
    end as vendor_id
  from generate_series(1, 100) as gs
)
insert into public.vendor_inventory_product_neighborhoods (product_id, neighborhood_slug, vendor_id)
select
  sp.product_id,
  case
    when sp.vendor_id = '33333333-3333-3333-3333-333333333333'::uuid then
      (array[
        'astoria', 'bushwick-taqueria', 'long-island-city', 'park-slope-pantry', 'williamsburg-provisions'
      ])[((sp.idx - 1) % 5) + 1]
    else
      (array[
        'chinatown-market', 'harlem-soul', 'lower-east-side', 'upper-west-side-brunch', 'west-village'
      ])[((sp.idx - 1) % 5) + 1]
  end as neighborhood_slug,
  sp.vendor_id
from seeded_products sp
on conflict (product_id, neighborhood_slug) do update
set
  vendor_id = excluded.vendor_id;

-- Link neighborhoods to one of the two vendors.
insert into public.neighborhood_vendors (neighborhood_slug, vendor_id)
values
  ('astoria', '33333333-3333-3333-3333-333333333333'),
  ('bushwick-taqueria', '33333333-3333-3333-3333-333333333333'),
  ('long-island-city', '33333333-3333-3333-3333-333333333333'),
  ('park-slope-pantry', '33333333-3333-3333-3333-333333333333'),
  ('williamsburg-provisions', '33333333-3333-3333-3333-333333333333'),
  ('chinatown-market', '44444444-4444-4444-4444-444444444444'),
  ('harlem-soul', '44444444-4444-4444-4444-444444444444'),
  ('lower-east-side', '44444444-4444-4444-4444-444444444444'),
  ('upper-west-side-brunch', '44444444-4444-4444-4444-444444444444'),
  ('west-village', '44444444-4444-4444-4444-444444444444')
on conflict (neighborhood_slug, vendor_id) do nothing;

with customer_seed as (
  select
    gs as idx,
    ('00000000-0000-0000-0000-' || lpad(gs::text, 12, '0'))::uuid as user_id,
    ('customer' || lpad(gs::text, 2, '0') || '@demo.local') as email,
    (array[
      'Alex Rivera', 'Jordan Lee', 'Sam Patel', 'Casey Nguyen', 'Taylor Kim',
      'Morgan Diaz', 'Riley Brown', 'Avery Clark', 'Jamie Chen', 'Parker Jones',
      'Drew Wright', 'Quinn Hall', 'Kendall Green', 'Reese Adams', 'Skyler Scott',
      'Rowan Baker', 'Charlie Young', 'Sawyer Allen', 'Emerson King', 'Finley Hill'
    ])[gs] as full_name,
    ('555-010-' || lpad(gs::text, 4, '0')) as phone,
    (array[
      'Astoria', 'Bushwick', 'Chinatown', 'Harlem', 'Long Island City',
      'Lower East Side', 'Park Slope', 'Upper West Side', 'West Village', 'Williamsburg',
      'Astoria', 'Bushwick', 'Chinatown', 'Harlem', 'Long Island City',
      'Lower East Side', 'Park Slope', 'Upper West Side', 'West Village', 'Williamsburg'
    ])[gs] as neighborhood_name,
    (array[
      'astoria', 'bushwick-taqueria', 'chinatown-market', 'harlem-soul', 'long-island-city',
      'lower-east-side', 'park-slope-pantry', 'upper-west-side-brunch', 'west-village', 'williamsburg-provisions',
      'astoria', 'bushwick-taqueria', 'chinatown-market', 'harlem-soul', 'long-island-city',
      'lower-east-side', 'park-slope-pantry', 'upper-west-side-brunch', 'west-village', 'williamsburg-provisions'
    ])[gs] as home_neighborhood_slug
  from generate_series(1, 20) as gs
)
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
select
  cs.user_id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  cs.email,
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
  jsonb_build_object('full_name', cs.full_name)
from customer_seed cs
on conflict (id) do update
set
  email = excluded.email,
  updated_at = now(),
  raw_user_meta_data = excluded.raw_user_meta_data;

with customer_seed as (
  select
    gs as idx,
    ('00000000-0000-0000-0000-' || lpad(gs::text, 12, '0'))::uuid as user_id,
    ('customer' || lpad(gs::text, 2, '0') || '@demo.local') as email
  from generate_series(1, 20) as gs
)
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
select
  ('10000000-0000-4000-8000-' || lpad(cs.idx::text, 12, '0'))::uuid as id,
  cs.user_id,
  cs.email,
  jsonb_build_object(
    'sub', cs.user_id::text,
    'email', cs.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now(),
  now()
from customer_seed cs
on conflict (provider_id, provider) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now();

with customer_seed as (
  select
    gs as idx,
    ('00000000-0000-0000-0000-' || lpad(gs::text, 12, '0'))::uuid as user_id,
    ('customer' || lpad(gs::text, 2, '0') || '@demo.local') as email,
    (array[
      'Alex Rivera', 'Jordan Lee', 'Sam Patel', 'Casey Nguyen', 'Taylor Kim',
      'Morgan Diaz', 'Riley Brown', 'Avery Clark', 'Jamie Chen', 'Parker Jones',
      'Drew Wright', 'Quinn Hall', 'Kendall Green', 'Reese Adams', 'Skyler Scott',
      'Rowan Baker', 'Charlie Young', 'Sawyer Allen', 'Emerson King', 'Finley Hill'
    ])[gs] as full_name,
    ('555-010-' || lpad(gs::text, 4, '0')) as phone,
    format('%s Example St, Apt %s, New York, NY', 100 + gs, gs) as default_address
  from generate_series(1, 20) as gs
)
insert into public.users (id, email, full_name, phone, default_address)
select
  cs.user_id,
  cs.email,
  cs.full_name,
  cs.phone,
  cs.default_address
from customer_seed cs
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  phone = excluded.phone,
  default_address = excluded.default_address,
  updated_at = now();

with customer_seed as (
  select
    gs as idx,
    ('00000000-0000-0000-0000-' || lpad(gs::text, 12, '0'))::uuid as user_id,
    format('%s Example St, Apt %s, New York, NY', 100 + gs, gs) as address,
    (array[
      'astoria', 'bushwick-taqueria', 'chinatown-market', 'harlem-soul', 'long-island-city',
      'lower-east-side', 'park-slope-pantry', 'upper-west-side-brunch', 'west-village', 'williamsburg-provisions',
      'astoria', 'bushwick-taqueria', 'chinatown-market', 'harlem-soul', 'long-island-city',
      'lower-east-side', 'park-slope-pantry', 'upper-west-side-brunch', 'west-village', 'williamsburg-provisions'
    ])[gs] as home_neighborhood_slug
  from generate_series(1, 20) as gs
),
order_seed as (
  select
    cs.idx as customer_idx,
    os.order_idx,
    ('ord_seed_' || lpad(cs.idx::text, 2, '0') || '_' || os.order_idx::text) as id,
    cs.user_id,
    case
      when ((cs.idx + os.order_idx) % 6) = 0 then 'cancelled'
      when ((cs.idx + os.order_idx) % 6) = 1 then 'placed'
      when ((cs.idx + os.order_idx) % 6) = 2 then 'payment_confirmed'
      when ((cs.idx + os.order_idx) % 6) = 3 then 'in_preparation'
      when ((cs.idx + os.order_idx) % 6) = 4 then 'out_for_delivery'
      else 'delivered'
    end as status,
    case
      when os.order_idx = 1 then 'sampler'
      when os.order_idx = 2 then 'weekly'
      else null
    end as plan_id,
    case
      when os.order_idx = 3 then cs.home_neighborhood_slug
      else null
    end as neighborhood_id,
    case
      when os.order_idx = 1 then 5800
      when os.order_idx = 2 then 7200
      else n.price_cents
    end as subtotal_cents,
    case when ((cs.idx + os.order_idx) % 4) = 0 then 0 else 499 end as delivery_fee_cents,
    299 as service_fee_cents,
    case when ((cs.idx + os.order_idx) % 5) = 0 then 500 else 0 end as discount_cents,
    case
      when (cs.idx % 3) = 0 then 'apple_pay'
      when (cs.idx % 3) = 1 then 'card'
      else 'cash'
    end as payment_method,
    cs.address,
    case
      when os.order_idx = 1 then 'Thursday 5:00 PM - 8:00 PM'
      when os.order_idx = 2 then 'Friday 4:00 PM - 7:00 PM'
      else 'Saturday 11:00 AM - 2:00 PM'
    end as delivery_window,
    now() - ((cs.idx * 3 + os.order_idx) * interval '8 hours') as created_at
  from customer_seed cs
  cross join (values (1), (2), (3)) as os(order_idx)
  left join public.neighborhoods n on n.slug = cs.home_neighborhood_slug
)
insert into public.orders (
  id,
  user_id,
  plan_id,
  neighborhood_id,
  status,
  subtotal_cents,
  delivery_fee_cents,
  service_fee_cents,
  discount_cents,
  total_cents,
  promo_code,
  payment_method,
  address,
  delivery_window,
  checkout_metadata,
  created_at,
  updated_at
)
select
  o.id,
  o.user_id,
  o.plan_id,
  o.neighborhood_id,
  o.status,
  o.subtotal_cents,
  o.delivery_fee_cents,
  o.service_fee_cents,
  o.discount_cents,
  greatest(o.subtotal_cents + o.delivery_fee_cents + o.service_fee_cents - o.discount_cents, 0) as total_cents,
  case when o.discount_cents > 0 then 'WELCOME5' else null end as promo_code,
  o.payment_method,
  o.address,
  o.delivery_window,
  jsonb_build_object(
    'source', 'seed-script',
    'customer_index', o.customer_idx,
    'order_index', o.order_idx
  ),
  o.created_at,
  now()
from order_seed o
on conflict (id) do update
set
  user_id = excluded.user_id,
  plan_id = excluded.plan_id,
  neighborhood_id = excluded.neighborhood_id,
  status = excluded.status,
  subtotal_cents = excluded.subtotal_cents,
  delivery_fee_cents = excluded.delivery_fee_cents,
  service_fee_cents = excluded.service_fee_cents,
  discount_cents = excluded.discount_cents,
  total_cents = excluded.total_cents,
  promo_code = excluded.promo_code,
  payment_method = excluded.payment_method,
  address = excluded.address,
  delivery_window = excluded.delivery_window,
  checkout_metadata = excluded.checkout_metadata,
  created_at = excluded.created_at,
  updated_at = now();

delete from public.order_timeline_events
where order_id like 'ord_seed_%';

insert into public.order_timeline_events (order_id, status, label, note, event_at)
select
  o.id,
  'placed',
  'Order placed',
  'Order received and queued for processing.',
  o.created_at
from public.orders o
where o.id like 'ord_seed_%'
union all
select
  o.id,
  'payment_confirmed',
  'Payment confirmed',
  'Payment captured successfully.',
  o.created_at + interval '10 minutes'
from public.orders o
where o.id like 'ord_seed_%'
  and o.status in ('payment_confirmed', 'in_preparation', 'out_for_delivery', 'delivered')
union all
select
  o.id,
  'in_preparation',
  'In preparation',
  'Vendor started preparing this order.',
  o.created_at + interval '40 minutes'
from public.orders o
where o.id like 'ord_seed_%'
  and o.status in ('in_preparation', 'out_for_delivery', 'delivered')
union all
select
  o.id,
  'out_for_delivery',
  'Out for delivery',
  'Courier picked up the neighborhood box.',
  o.created_at + interval '90 minutes'
from public.orders o
where o.id like 'ord_seed_%'
  and o.status in ('out_for_delivery', 'delivered')
union all
select
  o.id,
  'delivered',
  'Delivered',
  'Order delivered to the customer.',
  o.created_at + interval '2 hours'
from public.orders o
where o.id like 'ord_seed_%'
  and o.status = 'delivered'
union all
select
  o.id,
  'cancelled',
  'Cancelled',
  'Order cancelled after placement.',
  o.created_at + interval '20 minutes'
from public.orders o
where o.id like 'ord_seed_%'
  and o.status = 'cancelled';
