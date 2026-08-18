-- Merch orders, kept separate from book orders.
--
-- They share only Stripe. Merch is printed on demand and shipped by Printful, so there is
-- no Packeta packet, no pickup point and no stock to reserve — print on demand cannot sell
-- out. A cart also means many different products per order, where a book order is one title.
--
-- Same security model as public.orders: RLS on with no policies, all access server-side.

create sequence if not exists public.merch_order_number_seq start 1001;

create table if not exists public.merch_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    default 'MERCH-' || to_char(now(), 'YYYY') || '-' ||
            lpad(nextval('public.merch_order_number_seq')::text, 4, '0'),
  public_token uuid not null default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'shipped', 'cancelled')),

  customer_name text not null check (length(customer_name) between 1 and 64),
  customer_surname text not null check (length(customer_surname) between 1 and 64),
  email text not null check (length(email) between 3 and 254),
  phone text check (phone is null or length(phone) <= 20),

  -- Printful ships to an address; there are no pickup points.
  country_code text not null check (length(country_code) = 2),
  address1 text not null check (length(address1) between 1 and 128),
  city text not null check (length(city) between 1 and 64),
  zip text not null check (length(zip) between 1 and 16),

  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'EUR',
  -- Which Printful rate was quoted, so a disputed shipping charge can be traced.
  shipping_rate_id text,
  shipping_rate_name text,

  stripe_session_id text unique,
  stripe_payment_intent_id text,

  printful_order_id text,
  printful_error text,
  tracking_url text,

  paid_at timestamptz,
  shipped_at timestamptz,
  confirmation_email_sent_at timestamptz,
  shipped_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.merch_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.merch_orders(id) on delete cascade,
  -- Store variant, used to place the Printful order.
  sync_variant_id bigint not null,
  -- Catalog variant, required by Printful's shipping rate endpoint.
  variant_id bigint not null,
  name text not null,
  size text,
  color text,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists merch_orders_status_idx on public.merch_orders (status);
create index if not exists merch_orders_created_at_idx on public.merch_orders (created_at desc);
create index if not exists merch_orders_public_token_idx on public.merch_orders (public_token);
create index if not exists merch_orders_printful_order_idx on public.merch_orders (printful_order_id);
create index if not exists merch_order_items_order_id_idx on public.merch_order_items (order_id);

drop trigger if exists merch_orders_set_updated_at on public.merch_orders;
create trigger merch_orders_set_updated_at
  before update on public.merch_orders
  for each row
  execute function public.set_updated_at();

alter table public.merch_orders enable row level security;
alter table public.merch_order_items enable row level security;

revoke all on public.merch_orders from anon, authenticated;
revoke all on public.merch_order_items from anon, authenticated;
revoke all on sequence public.merch_order_number_seq from anon, authenticated;
