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
  category text check (category in ('bridal','festive','haldi','reception','mehendi','sangeet','stock_clearing')),
  stock integer not null default 0,
  has_variants boolean default false,
  show_on_home boolean default false,
  display_order integer default 0,
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

-- Idempotent column additions for existing databases
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='category') then
    alter table public.products add column category text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='has_variants') then
    alter table public.products add column has_variants boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='show_on_home') then
    alter table public.products add column show_on_home boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='display_order') then
    alter table public.products add column display_order integer default 0;
  end if;
end $$;

-- Ensure category check includes stock_clearing (drop + re-add idempotent)
alter table public.products drop constraint if exists products_category_check;
alter table public.products add constraint products_category_check
  check (category in ('bridal','festive','haldi','reception','mehendi','sangeet','stock_clearing'));

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_display_order on public.products(display_order);
create index if not exists idx_products_show_on_home on public.products(show_on_home) where show_on_home = true;

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
  address_line2 text,
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
  review_text text,
  is_verified boolean default false,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Idempotent column additions (safe to re-run)
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reviews' and column_name = 'review_text'
  ) then
    alter table public.reviews add column review_text text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reviews' and column_name = 'is_verified'
  ) then
    alter table public.reviews add column is_verified boolean default false;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reviews' and column_name = 'status'
  ) then
    alter table public.reviews add column status text default 'pending';
  end if;
end $$;

-- Check constraint on status (idempotent)
do $$ begin
  if not exists (
    select 1 from information_schema.constraint_column_usage
    where table_schema = 'public' and table_name = 'reviews' and constraint_name = 'reviews_status_check'
  ) then
    alter table public.reviews
      add constraint reviews_status_check
      check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

-- Safe data migration: copy comment → review_text where review_text is null
update public.reviews
set review_text = comment
where review_text is null and comment is not null;

alter table public.reviews enable row level security;

-- Drop old generic policy
drop policy if exists reviews_policy on public.reviews;

-- Granular RLS policies
drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read
on public.reviews
for select
using (status = 'approved' or user_id = auth.uid() or public.is_admin());

drop policy if exists reviews_user_insert on public.reviews;
create policy reviews_user_insert
on public.reviews
for insert
with check (user_id = auth.uid());

drop policy if exists reviews_admin_manage on public.reviews;
create policy reviews_admin_manage
on public.reviews
for all
using (public.is_admin())
with check (public.is_admin());

create index if not exists idx_reviews_product
on public.reviews(product_id, created_at desc);

create index if not exists idx_reviews_status
on public.reviews(status);

-- ==========================================================
-- WISHLIST (table name = "wishlist", not "wishlists")
-- ==========================================================

create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id,product_id)
);

alter table public.wishlist enable row level security;

drop policy if exists wishlist_policy on public.wishlist;

create policy wishlist_policy
on public.wishlist
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create index if not exists idx_wishlist_user
on public.wishlist(user_id);

-- ==========================================================
-- NEWSLETTER
-- ==========================================================

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamptz default now()
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists newsletter_select on public.newsletter_subscribers;
drop policy if exists newsletter_insert on public.newsletter_subscribers;
drop policy if exists newsletter_admin on public.newsletter_subscribers;

create policy newsletter_insert
on public.newsletter_subscribers for insert
with check (true);

create policy newsletter_select
on public.newsletter_subscribers for select
using (public.is_admin());

create policy newsletter_admin
on public.newsletter_subscribers for all
using (public.is_admin())
with check (public.is_admin());

create index if not exists idx_newsletter_email
on public.newsletter_subscribers(email);

-- ==========================================================
-- SITE CONTENT (CMS)
-- ==========================================================

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.site_content enable row level security;

drop policy if exists site_content_public_read on public.site_content;
drop policy if exists site_content_admin on public.site_content;

create policy site_content_public_read
on public.site_content for select
using (true);

create policy site_content_admin
on public.site_content for all
using (public.is_admin())
with check (public.is_admin());

-- ==========================================================
-- INVOICES
-- ==========================================================

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  invoice_number text unique not null,
  created_at timestamptz default now()
);

alter table public.invoices enable row level security;

drop policy if exists invoices_select on public.invoices;
drop policy if exists invoices_admin on public.invoices;

create policy invoices_select
on public.invoices for select
using (
  order_id in (select id from public.orders where user_id = auth.uid())
  or public.is_admin()
);

create policy invoices_admin
on public.invoices for all
using (public.is_admin() or auth.role() = 'service_role')
with check (public.is_admin() or auth.role() = 'service_role');

create index if not exists idx_invoices_order
on public.invoices(order_id);

-- ==========================================================
-- ORDER EMAIL LOGS
-- ==========================================================

create table if not exists public.order_email_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  status text not null default 'pending',
  error text,
  created_at timestamptz default now()
);

alter table public.order_email_logs enable row level security;

drop policy if exists order_email_logs_service on public.order_email_logs;

create policy order_email_logs_service
on public.order_email_logs
for all
using (auth.role() = 'service_role' or public.is_admin())
with check (auth.role() = 'service_role' or public.is_admin());

create index if not exists idx_order_email_logs_order
on public.order_email_logs(order_id);

-- ==========================================================
-- SHIPPING EMAIL LOGS
-- ==========================================================

create table if not exists public.shipping_email_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  status text not null default 'pending',
  error text,
  created_at timestamptz default now()
);

alter table public.shipping_email_logs enable row level security;

drop policy if exists shipping_email_logs_service on public.shipping_email_logs;

create policy shipping_email_logs_service
on public.shipping_email_logs
for all
using (auth.role() = 'service_role' or public.is_admin())
with check (auth.role() = 'service_role' or public.is_admin());

create index if not exists idx_shipping_email_logs_order
on public.shipping_email_logs(order_id);

-- ==========================================================
-- MONITORING EVENTS
-- ==========================================================

create table if not exists public.monitoring_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  severity text not null default 'info',
  message text,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table public.monitoring_events enable row level security;

drop policy if exists monitoring_events_service on public.monitoring_events;

create policy monitoring_events_service
on public.monitoring_events
for all
using (auth.role() = 'service_role' or public.is_admin())
with check (auth.role() = 'service_role' or public.is_admin());

create index if not exists idx_monitoring_events_created
on public.monitoring_events(created_at desc);

-- ==========================================================
-- SYSTEM STATE (key-value store for cron state, etc.)
-- ==========================================================

create table if not exists public.system_state (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.system_state enable row level security;

drop policy if exists system_state_service on public.system_state;

create policy system_state_service
on public.system_state
for all
using (auth.role() = 'service_role' or public.is_admin())
with check (auth.role() = 'service_role' or public.is_admin());

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

-- ==========================================================
-- PASSWORD RESET OTP SYSTEM
-- ==========================================================

create table if not exists public.password_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_password_otps_email
on public.password_otps(email);

create index if not exists idx_password_otps_expires
on public.password_otps(expires_at);

-- ==========================================================
-- OTP RATE LIMITS
-- ==========================================================

create table if not exists public.otp_rate_limits (
  id uuid primary key default gen_random_uuid(),
  email text,
  ip_address text,
  created_at timestamptz default now()
);

create index if not exists idx_otp_rate_email
on public.otp_rate_limits(email);

create index if not exists idx_otp_rate_ip
on public.otp_rate_limits(ip_address);

-- ==========================================================
-- OTP RLS (service_role only)
-- ==========================================================

alter table public.password_otps enable row level security;
alter table public.otp_rate_limits enable row level security;

drop policy if exists "no direct access password_otps" on public.password_otps;
create policy "no direct access password_otps"
on public.password_otps
for all
using (false);

drop policy if exists "no direct access otp_rate_limits" on public.otp_rate_limits;
create policy "no direct access otp_rate_limits"
on public.otp_rate_limits
for all
using (false);

-- ==========================================================
-- SIGNUP OTP SYSTEM
-- ==========================================================

create table if not exists public.signup_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_signup_otps_email
on public.signup_otps(email);

create index if not exists idx_signup_otps_expires
on public.signup_otps(expires_at);

alter table public.signup_otps enable row level security;

drop policy if exists "no direct access signup_otps" on public.signup_otps;
create policy "no direct access signup_otps"
on public.signup_otps
for all
using (false);

-- ==========================================================
-- OTP CLEANUP FUNCTION (covers password + signup otps)
-- ==========================================================

create or replace function public.cleanup_expired_otps()
returns void
language plpgsql
as $$
begin
  delete from public.password_otps
  where expires_at < now();

  delete from public.signup_otps
  where expires_at < now();

  delete from public.otp_rate_limits
  where created_at < now() - interval '24 hours';
end;
$$;

-- ==========================================================
-- RPC: increment_cart_item
-- Increments cart item quantity or inserts a new row.
-- ==========================================================

create or replace function public.increment_cart_item(
  p_cart_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_variant_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_id uuid;
begin
  -- Look for an existing cart item matching product + variant
  select id into v_existing_id
  from public.cart_items
  where cart_id = p_cart_id
    and product_id = p_product_id
    and (variant_id is not distinct from p_variant_id)
  limit 1;

  if v_existing_id is not null then
    update public.cart_items
    set quantity = quantity + p_quantity
    where id = v_existing_id;
  else
    insert into public.cart_items (cart_id, product_id, variant_id, quantity)
    values (p_cart_id, p_product_id, p_variant_id, p_quantity);
  end if;
end;
$$;

-- ==========================================================
-- RPC: checkout_cart
-- Atomically converts the current user's cart into an order.
-- Returns the new order UUID.
-- ==========================================================

create or replace function public.checkout_cart()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_cart_id uuid;
  v_order_id uuid;
  v_total numeric(12,2) := 0;
  v_item record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Find the user's cart
  select id into v_cart_id
  from public.carts
  where user_id = v_user_id;

  if v_cart_id is null then
    raise exception 'Cart is empty';
  end if;

  -- Ensure the cart has items
  if not exists (select 1 from public.cart_items where cart_id = v_cart_id) then
    raise exception 'Cart is empty';
  end if;

  -- Create the order
  insert into public.orders (user_id, status, payment_status)
  values (v_user_id, 'pending', 'unpaid')
  returning id into v_order_id;

  -- Copy cart items → order items, decrement stock
  for v_item in
    select ci.product_id, ci.variant_id, ci.quantity, p.price, p.title, p.image_path, p.stock
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.cart_id = v_cart_id
  loop
    if v_item.stock < v_item.quantity then
      raise exception 'Insufficient stock for %', v_item.title;
    end if;

    insert into public.order_items (order_id, product_id, quantity, price, product_name, image_url)
    values (v_order_id, v_item.product_id, v_item.quantity, v_item.price, v_item.title, v_item.image_path);

    update public.products
    set stock = stock - v_item.quantity,
        updated_at = now()
    where id = v_item.product_id;

    v_total := v_total + (v_item.price * v_item.quantity);
  end loop;

  -- Set total
  update public.orders
  set total_amount = v_total, updated_at = now()
  where id = v_order_id;

  -- Clear the cart
  delete from public.cart_items where cart_id = v_cart_id;

  return v_order_id;
end;
$$;

-- ==========================================================
-- RPC: confirm_order_payment
-- Marks an order as paid + status = confirmed.
-- GRANT to service_role only.
-- ==========================================================

create or replace function public.confirm_order_payment(
  p_order_id uuid,
  p_razorpay_payment_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set payment_status = 'paid',
      status = 'confirmed',
      razorpay_payment_id = p_razorpay_payment_id,
      updated_at = now()
  where id = p_order_id
    and payment_status != 'paid';

  -- Log the event
  insert into public.order_events (order_id, event_type, event_data)
  values (
    p_order_id,
    'payment_confirmed',
    jsonb_build_object('razorpay_payment_id', p_razorpay_payment_id, 'confirmed_at', now())
  );
end;
$$;

-- Restrict confirm_order_payment to service_role only
revoke execute on function public.confirm_order_payment(uuid, text) from public;
revoke execute on function public.confirm_order_payment(uuid, text) from authenticated;
grant execute on function public.confirm_order_payment(uuid, text) to service_role;

-- ==========================================================
-- RPC: update_order_status
-- Admin-only: progresses order status, optionally sets
-- shipping details.
-- ==========================================================

create or replace function public.update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_tracking_number text default null,
  p_courier_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admin check
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  update public.orders
  set status = p_new_status::order_status,
      tracking_number = coalesce(p_tracking_number, tracking_number),
      courier_name = coalesce(p_courier_name, courier_name),
      shipped_at = case when p_new_status = 'shipped' then now() else shipped_at end,
      delivered_at = case when p_new_status = 'delivered' then now() else delivered_at end,
      updated_at = now()
  where id = p_order_id;

  insert into public.order_events (order_id, event_type, event_data)
  values (
    p_order_id,
    'status_changed',
    jsonb_build_object('new_status', p_new_status, 'tracking_number', p_tracking_number, 'courier_name', p_courier_name)
  );
end;
$$;

-- ==========================================================
-- RPC: cancel_order
-- Cancels an order and restores stock.
-- ==========================================================

create or replace function public.cancel_order(
  p_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
begin
  select id, user_id, status, payment_status
  into v_order
  from public.orders
  where id = p_order_id;

  if v_order is null then
    raise exception 'Order not found';
  end if;

  -- Allow owner or admin
  if v_order.user_id != auth.uid() and not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  if v_order.status::text = 'cancelled' then
    raise exception 'Order already cancelled';
  end if;

  if v_order.status::text in ('shipped', 'delivered') then
    raise exception 'Order cannot be cancelled — already %', v_order.status;
  end if;

  -- Restore stock
  for v_item in
    select product_id, quantity
    from public.order_items
    where order_id = p_order_id
  loop
    update public.products
    set stock = stock + v_item.quantity,
        updated_at = now()
    where id = v_item.product_id;
  end loop;

  -- Update order
  update public.orders
  set status = 'cancelled',
      updated_at = now()
  where id = p_order_id;

  insert into public.order_events (order_id, event_type, event_data)
  values (
    p_order_id,
    'cancelled',
    jsonb_build_object('cancelled_at', now(), 'cancelled_by', auth.uid())
  );
end;
$$;

-- ==========================================================
-- RPC: submit_review
-- Inserts a review for a product. Returns the review UUID.
-- ==========================================================

create or replace function public.submit_review(
  p_product_id uuid,
  p_rating integer,
  p_review_text text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_review_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5';
  end if;

  -- Check if user already reviewed this product
  if exists (
    select 1 from public.reviews
    where product_id = p_product_id and user_id = v_user_id
  ) then
    raise exception 'You have already reviewed this product';
  end if;

  insert into public.reviews (product_id, user_id, rating, review_text, comment, status, is_verified)
  values (p_product_id, v_user_id, p_rating, p_review_text, p_review_text, 'pending', false)
  returning id into v_review_id;

  return v_review_id;
end;
$$;

-- ==========================================================
-- RPC: admin_adjust_product_stock
-- Admin-only: adjusts stock and logs the change.
-- ==========================================================

create or replace function public.admin_adjust_product_stock(
  p_product_id uuid,
  p_change integer,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  update public.products
  set stock = stock + p_change,
      updated_at = now()
  where id = p_product_id;

  -- The stock check constraint will raise if stock goes negative

  insert into public.inventory_logs (product_id, change, reason)
  values (p_product_id, p_change, p_reason);
end;
$$;

-- ==========================================================
-- EMAIL LOG TABLES
-- ==========================================================

create table if not exists public.shipping_email_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  status text not null default 'pending',
  error text,
  created_at timestamptz default now()
);
alter table public.shipping_email_logs enable row level security;
drop policy if exists shipping_email_logs_admin on public.shipping_email_logs;
create policy shipping_email_logs_admin on public.shipping_email_logs for all using (public.is_admin());

create table if not exists public.order_email_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  status text not null default 'pending',
  error text,
  created_at timestamptz default now()
);
alter table public.order_email_logs enable row level security;
drop policy if exists order_email_logs_admin on public.order_email_logs;
create policy order_email_logs_admin on public.order_email_logs for all using (public.is_admin());

create table if not exists public.abandoned_cart_email_logs (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.carts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'pending',
  error text,
  created_at timestamptz default now()
);
alter table public.abandoned_cart_email_logs enable row level security;
drop policy if exists abandoned_cart_email_logs_admin on public.abandoned_cart_email_logs;
create policy abandoned_cart_email_logs_admin on public.abandoned_cart_email_logs for all using (public.is_admin());

-- ==========================================================
-- STOCK NON-NEGATIVE CONSTRAINT
-- ==========================================================

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'stock_non_negative'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
    add constraint stock_non_negative check (stock >= 0);
  end if;
end $$;
