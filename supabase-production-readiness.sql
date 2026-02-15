-- =============================================================
-- VinnysVogue — Database Production Readiness Verification
-- Run this ENTIRE script in the Supabase SQL Editor.
-- It will:
--   1. Create newsletter_subscribers if missing
--   2. Enable RLS + add policies on it
--   3. Verify RLS on ALL tables
--   4. Create missing indexes
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Create newsletter_subscribers table (IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text        NOT NULL UNIQUE,
  source     text        DEFAULT 'homepage',
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 2. RLS on newsletter_subscribers
-- ─────────────────────────────────────────────────────────────
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anon) to insert (subscribe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'newsletter_subscribers'
      AND policyname = 'Public can subscribe'
  ) THEN
    CREATE POLICY "Public can subscribe"
      ON newsletter_subscribers
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Only admin can read subscribers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'newsletter_subscribers'
      AND policyname = 'Admin can read subscribers'
  ) THEN
    CREATE POLICY "Admin can read subscribers"
      ON newsletter_subscribers
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 3. Verify RLS is ENABLED on all application tables
--    Run this query and check the output — every table
--    should show rowsecurity = true.
-- ─────────────────────────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'products',
    'product_variants',
    'carts',
    'cart_items',
    'orders',
    'order_items',
    'wishlist',
    'site_content',
    'newsletter_subscribers',
    'invoices',
    'reviews'
  )
ORDER BY tablename;

-- ─────────────────────────────────────────────────────────────
-- 4. Create missing indexes (IF NOT EXISTS)
--    These are the most impactful indexes for query performance.
-- ─────────────────────────────────────────────────────────────

-- orders.user_id — used on account/orders page & checkout
CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON orders (user_id);

-- orders.created_at — used for sorting in admin & user views
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders (created_at DESC);

-- order_items.order_id — used when loading order detail page
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items (order_id);

-- wishlist.user_id — used on every page load (header badge count)
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id
  ON wishlist (user_id);

-- newsletter_subscribers.email — used for upsert deduplication
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email
  ON newsletter_subscribers (email);

-- reviews.product_id — used on product detail page (if reviews exist)
-- This will silently skip if the reviews table doesn't exist yet.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reviews'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews (product_id)';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 5. Verify all indexes were created
-- ─────────────────────────────────────────────────────────────
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_orders_user_id',
    'idx_orders_created_at',
    'idx_order_items_order_id',
    'idx_wishlist_user_id',
    'idx_newsletter_subscribers_email',
    'idx_reviews_product_id'
  )
ORDER BY tablename, indexname;
