-- Rename the order number prefix from RPW- to ROZPRAVKY-.
--
-- The prefix is what appears as the order number in Packeta, on the thank-you page and
-- in the confirmation email. "ROZPRAVKY-2026-1007" is 19 characters, within the 24 that
-- Packeta allows for a packet's `number`.
--
-- Only the default for new orders changes; existing rows keep the number they were given,
-- because that number has already been shown to a customer.

alter table public.orders
  alter column order_number
  set default 'ROZPRAVKY-' || to_char(now(), 'YYYY') || '-' ||
              lpad(nextval('public.order_number_seq')::text, 4, '0');
