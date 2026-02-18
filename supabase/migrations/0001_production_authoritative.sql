-- ==========================================================
-- VINNYS VOGUE — FULL ENTERPRISE AUTHORITATIVE SCHEMA
-- RUPEE MODEL • ALL FEATURES • FULLY IDEMPOTENT
-- ==========================================================

create extension if not exists pgcrypto;

-- ==========================================================
-- ENUMS
-- ==========================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum (
      'pending',
      'payment_initiated',
      'confirmed',
      'shipped',
      'delivered',
      'cancelled'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum (
      'unpaid',
      'paid',
      'failed',
      'refunded'
    );
  end if;
end $$;

-- ==========================================================
-- PROFILES
-- ==========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text,
  role text not null default 'user' check (role in ('user','admin')),
  full_name text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text default 'India',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists profiles_all on public.profiles;
create policy profiles_all
on public.profiles
for all
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Auto profile trigger
create or replace function public.create_profile_on_signup()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id,email)
  values (new.id,new.email)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_on_signup();

-- ==========================================================
-- PRODUCTS
-- ==========================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  currency text default 'INR',
  stock integer not null default 0,
  image_path text,
  active boolean default true,
  is_bestseller boolean default false,
  is_new boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;

drop policy if exists products_public on public.products;
drop policy if exists products_admin on public.products;

create policy products_public
on public.products for select
using (active = true);

create policy products_admin
on public.products for all
using (public.is_admin())
with check (public.is_admin());

create index if not exists idx_products_stock
on public.products(stock);

-- ==========================================================
-- PRODUCT VARIANTS
-- ==========================================================

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  name text,
  stock integer default 0,
  created_at timestamptz default now()
);

alter table public.product_variants enable row level security;

drop policy if exists product_variants_select on public.product_variants;
drop policy if exists product_variants_admin on public.product_variants;

create policy product_variants_select
on public.product_variants for select
using (true);

create policy product_variants_admin
on public.product_variants for all
using (public.is_admin())
with check (public.is_admin());

-- ==========================================================
-- CARTS
-- ==========================================================

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.carts(id) on delete cascade,
  product_id uuid references public.products(id),
  variant_id uuid references public.product_variants(id),
  quantity integer not null check (quantity > 0)
);

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

drop policy if exists carts_policy on public.carts;
drop policy if exists cart_items_policy on public.cart_items;

create policy carts_policy
on public.carts for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy cart_items_policy
on public.cart_items for all
using (
  cart_id in (select id from public.carts where user_id = auth.uid())
)
with check (
  cart_id in (select id from public.carts where user_id = auth.uid())
);

create index if not exists idx_cart_user on public.carts(user_id);

-- ==========================================================
-- ORDERS
-- ==========================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  status order_status default 'pending',
  payment_status payment_status default 'unpaid',
  total_amount numeric(12,2) not null default 0,
  currency text default 'INR',
  razorpay_order_id text,
  razorpay_payment_id text,
  full_name text,
  email text,
  phone text,
  address_line1 text,
  postal_code text,
  city text,
  state text,
  country text,
  courier_name text,
  tracking_number text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;

drop policy if exists orders_select on public.orders;
drop policy if exists orders_insert on public.orders;
drop policy if exists orders_admin_update on public.orders;

create policy orders_select
on public.orders for select
using (user_id = auth.uid() or public.is_admin());

create policy orders_insert
on public.orders for insert
with check (user_id = auth.uid());

create policy orders_admin_update
on public.orders for update
using (public.is_admin())
with check (public.is_admin());

create index if not exists idx_orders_user_created
on public.orders(user_id, created_at desc);

create index if not exists idx_orders_paid_only
on public.orders(created_at)
where payment_status = 'paid';

create index if not exists idx_orders_retry
on public.orders(created_at)
where payment_status = 'unpaid'
and status = 'payment_initiated';

create index if not exists idx_orders_brin
on public.orders using brin(created_at);

-- ==========================================================
-- ORDER ITEMS
-- ==========================================================

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  price numeric(10,2) not null,
  product_name text,
  image_url text,
  created_at timestamptz default now()
);

alter table public.order_items enable row level security;

drop policy if exists order_items_select on public.order_items;

create policy order_items_select
on public.order_items for select
using (
  order_id in (select id from public.orders where user_id = auth.uid())
  or public.is_admin()
);

create index if not exists idx_order_items_order
on public.order_items(order_id);

-- ==========================================================
-- INVENTORY LOGS
-- ==========================================================

create table if not exists public.inventory_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id),
  change integer not null,
  reason text,
  created_at timestamptz default now()
);

alter table public.inventory_logs enable row level security;

drop policy if exists inventory_logs_admin on public.inventory_logs;

create policy inventory_logs_admin
on public.inventory_logs
for all
using (public.is_admin())
with check (public.is_admin());

create index if not exists idx_inventory_logs_product
on public.inventory_logs(product_id, created_at desc);

-- ==========================================================
-- ORDER EVENTS (TIMELINE)
-- ==========================================================

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  event_type text not null,
  event_data jsonb,
  created_at timestamptz default now()
);

alter table public.order_events enable row level security;

drop policy if exists order_events_policy on public.order_events;

create policy order_events_policy
on public.order_events for select
using (
  order_id in (select id from public.orders where user_id = auth.uid())
  or public.is_admin()
);

create index if not exists idx_order_events_order
on public.order_events(order_id, created_at desc);

-- ==========================================================
-- WEBHOOK RETRY QUEUE
-- ==========================================================

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  razorpay_event_id text unique,
  razorpay_order_id text,
  payload jsonb not null,
  status text default 'pending',
  retry_count integer default 0,
  last_error text,
  latency_ms integer,
  processed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.webhook_events enable row level security;

drop policy if exists webhook_service_role on public.webhook_events;

create policy webhook_service_role
on public.webhook_events
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create index if not exists idx_webhook_retry
on public.webhook_events(status, retry_count, created_at)
where status in ('pending','failed');

-- ==========================================================
-- REVIEWS
-- ==========================================================

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id),
  user_id uuid references auth.users(id),
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;

drop policy if exists reviews_policy on public.reviews;

create policy reviews_policy
on public.reviews
for all
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid());

create index if not exists idx_reviews_product
on public.reviews(product_id, created_at desc);

-- ==========================================================
-- WISHLIST
-- ==========================================================

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id,product_id)
);

alter table public.wishlists enable row level security;

drop policy if exists wishlist_policy on public.wishlists;

create policy wishlist_policy
on public.wishlists
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create index if not exists idx_wishlist_user
on public.wishlists(user_id);

-- ==========================================================
-- NEWSLETTER
-- ==========================================================

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamptz default now()
);

create index if not exists idx_newsletter_email
on public.newsletter_subscribers(email);

-- ==========================================================
-- ANALYTICS VIEW
-- ==========================================================

create or replace view public.admin_order_stats
with (security_invoker = on)
as
select
  count(*) as total_orders,
  coalesce(sum(total_amount) filter (where payment_status = 'paid'),0) as total_revenue,
  coalesce(avg(total_amount) filter (where payment_status = 'paid'),0) as avg_order_value,
  count(*) filter (where status = 'pending') as pending_count,
  count(*) filter (where status = 'confirmed') as confirmed_count,
  count(*) filter (where status = 'shipped') as shipped_count,
  count(*) filter (where status = 'delivered') as delivered_count,
  count(*) filter (where status = 'cancelled') as cancelled_count,
  count(*) filter (where payment_status = 'paid') as paid_count,
  count(*) filter (where payment_status = 'unpaid') as unpaid_count,
  count(*) filter (where payment_status = 'failed') as failed_count,
  count(*) filter (where payment_status = 'refunded') as refunded_count
from public.orders;
