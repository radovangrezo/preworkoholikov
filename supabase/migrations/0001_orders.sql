-- Orders for the direct book shop.
--
-- Security model: the browser never talks to Supabase. Every read and write goes
-- through our own API routes using the service-role key. Row Level Security is
-- therefore enabled with no policies at all, so anon/authenticated roles can
-- reach nothing even if a key ever leaks.

create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    default 'RPW-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 4, '0'),
  -- Unguessable handle so the thank-you page can show an order without exposing ids.
  public_token uuid not null default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'shipped', 'cancelled')),

  -- Customer. Lengths mirror Packeta's API limits so a packet can never be
  -- rejected for an over-long field after we already took the money.
  customer_name text not null check (length(customer_name) between 1 and 32),
  customer_surname text not null check (length(customer_surname) between 1 and 32),
  email text not null check (length(email) between 3 and 254),
  phone text not null check (length(phone) between 5 and 20),

  -- Delivery
  country text not null check (country in ('SK', 'CZ')),
  delivery_method text not null check (delivery_method in ('pickup_point', 'home')),
  pickup_point_id text,
  pickup_point_name text,
  street text check (street is null or length(street) <= 64),
  house_number text check (house_number is null or length(house_number) <= 16),
  city text check (city is null or length(city) <= 32),
  zip text check (zip is null or length(zip) <= 10),

  -- Money, always in minor units to avoid floating point drift.
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'EUR',
  weight_kg numeric(6, 3) not null check (weight_kg > 0),

  -- Stripe
  stripe_session_id text unique,
  stripe_payment_intent_id text,

  -- Packeta
  packeta_packet_id text,
  packeta_barcode text,
  packeta_status text,
  -- Set when packet creation fails, so a paid order is never lost silently.
  packeta_error text,

  -- Lifecycle
  paid_at timestamptz,
  shipped_at timestamptz,
  confirmation_email_sent_at timestamptz,
  shipped_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint orders_pickup_point_required check (
    delivery_method <> 'pickup_point' or pickup_point_id is not null
  ),
  constraint orders_home_address_required check (
    delivery_method <> 'home'
    or (street is not null and house_number is not null and city is not null and zip is not null)
  )
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sku text not null,
  title text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_public_token_idx on public.orders (public_token);
create index if not exists orders_packeta_packet_id_idx on public.orders (packeta_packet_id);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- Keep updated_at honest.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row
  execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Defence in depth: no grants for the roles reachable with a public key.
revoke all on public.orders from anon, authenticated;
revoke all on public.order_items from anon, authenticated;
revoke all on sequence public.order_number_seq from anon, authenticated;
