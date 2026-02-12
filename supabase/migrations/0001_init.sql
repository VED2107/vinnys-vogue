create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'INR',
  image_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.products
  add column if not exists active boolean not null default true;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'created',
  total_cents integer not null default 0 check (total_cents >= 0),
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid() and role = 'user');

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = 'user');

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
on public.profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
on public.products
for select
to public
using (active = true);

drop policy if exists "products_admin_select" on public.products;
create policy "products_admin_select"
on public.products
for select
to authenticated
using (public.is_admin());

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert"
on public.products
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update"
on public.products
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete"
on public.products
for delete
to authenticated
using (public.is_admin());

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
on public.orders
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
on public.orders
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "orders_update_own" on public.orders;
create policy "orders_update_own"
on public.orders
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "orders_admin_select" on public.orders;
create policy "orders_admin_select"
on public.orders
for select
to authenticated
using (public.is_admin());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update"
on public.orders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own"
on public.order_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

drop policy if exists "order_items_update_own" on public.order_items;
create policy "order_items_update_own"
on public.order_items
for update
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

drop policy if exists "order_items_admin_select" on public.order_items;
create policy "order_items_admin_select"
on public.order_items
for select
to authenticated
using (public.is_admin());

drop policy if exists "order_items_admin_update" on public.order_items;
create policy "order_items_admin_update"
on public.order_items
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
