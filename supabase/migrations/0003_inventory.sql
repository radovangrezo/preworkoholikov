-- Stock control, so the shop cannot sell more copies than were printed.
--
-- `claimed` counts copies that are either sold or currently held by an unfinished
-- checkout. It rises when a checkout starts and falls again if that checkout expires,
-- so an abandoned cart does not permanently consume a copy.
--
-- The check constraint is the real guarantee: even if application logic were wrong,
-- the database physically cannot record more claims than there are copies.

create table if not exists public.inventory (
  sku text primary key,
  total_printed integer not null check (total_printed >= 0),
  claimed integer not null default 0 check (claimed >= 0),
  updated_at timestamptz not null default now(),
  constraint inventory_not_oversold check (claimed <= total_printed)
);

insert into public.inventory (sku, total_printed)
values ('RPW-001', 2950)
on conflict (sku) do nothing;

/*
 * Claims stock atomically. The WHERE clause and the increment happen in one statement,
 * so two simultaneous checkouts cannot both pass the availability test.
 * Returns true when the copies were reserved, false when there are not enough left.
 */
create or replace function public.claim_stock(p_sku text, p_quantity integer)
returns boolean
language plpgsql
as $$
declare
  affected integer;
begin
  update public.inventory
     set claimed = claimed + p_quantity,
         updated_at = now()
   where sku = p_sku
     and claimed + p_quantity <= total_printed;

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

/* Returns copies to the pool when a checkout is abandoned or fails to start. */
create or replace function public.release_stock(p_sku text, p_quantity integer)
returns void
language plpgsql
as $$
begin
  update public.inventory
     set claimed = greatest(claimed - p_quantity, 0),
         updated_at = now()
   where sku = p_sku;
end;
$$;

alter table public.inventory enable row level security;
revoke all on public.inventory from anon, authenticated;
revoke all on function public.claim_stock(text, integer) from anon, authenticated;
revoke all on function public.release_stock(text, integer) from anon, authenticated;
