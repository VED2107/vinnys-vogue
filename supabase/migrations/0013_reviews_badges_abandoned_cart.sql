-- 0013_reviews_badges_abandoned_cart_safe.sql
-- Safe re-runnable version

-- ═══════════════════════════════════════════════════════════
-- A) REVIEWS SYSTEM
-- ═══════════════════════════════════════════════════════════

-- Base table (minimal create)
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Columns (safe add)
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS rating integer CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS review_text text;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT true;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Unique constraint (safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reviews_product_user_unique'
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_product_user_unique
      UNIQUE (product_id, user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
DROP INDEX IF EXISTS public.idx_reviews_product_status;
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved
  ON public.reviews(product_id)
  WHERE status = 'approved';

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- REVIEWS RLS
-- ═══════════════════════════════════════════════════════════

-- Public read approved
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='reviews'
      AND policyname='reviews_select_approved'
  ) THEN
    CREATE POLICY reviews_select_approved
    ON public.reviews
    FOR SELECT
    USING (status = 'approved');
  END IF;
END $$;

-- Admin read all
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='reviews'
      AND policyname='reviews_admin_select'
  ) THEN
    CREATE POLICY reviews_admin_select
    ON public.reviews
    FOR SELECT
    TO authenticated
    USING (public.is_admin());
  END IF;
END $$;

-- Admin update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='reviews'
      AND policyname='reviews_admin_update'
  ) THEN
    CREATE POLICY reviews_admin_update
    ON public.reviews
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
  END IF;
END $$;

-- Admin delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='reviews'
      AND policyname='reviews_admin_delete'
  ) THEN
    CREATE POLICY reviews_admin_delete
    ON public.reviews
    FOR DELETE
    TO authenticated
    USING (public.is_admin());
  END IF;
END $$;

-- Service role full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='reviews'
      AND policyname='reviews_service_role'
  ) THEN
    CREATE POLICY reviews_service_role
    ON public.reviews
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- VERIFIED BUYER RPC
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.submit_review(
  p_product_id uuid,
  p_rating integer,
  p_review_text text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_review_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  -- Must have delivered order containing this product
  SELECT o.id INTO v_order_id
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  WHERE o.user_id = v_user_id
    AND o.status = 'delivered'
    AND oi.product_id = p_product_id
  LIMIT 1;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'You can only review delivered products';
  END IF;

  -- Prevent duplicate review
  IF EXISTS (
    SELECT 1 FROM public.reviews
    WHERE product_id = p_product_id
      AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Already reviewed';
  END IF;

  INSERT INTO public.reviews (
    product_id,
    user_id,
    order_id,
    rating,
    review_text,
    is_verified,
    status
  )
  VALUES (
    p_product_id,
    v_user_id,
    v_order_id,
    p_rating,
    p_review_text,
    true,
    'approved'
  )
  RETURNING id INTO v_review_id;

  RETURN v_review_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_review(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_review(uuid, integer, text) TO authenticated;

-- ═══════════════════════════════════════════════════════════
-- B) PRODUCT BADGES
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_bestseller boolean NOT NULL DEFAULT false;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_new boolean NOT NULL DEFAULT false;

-- ═══════════════════════════════════════════════════════════
-- C) ABANDONED CART EMAIL LOGS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.abandoned_cart_email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.abandoned_cart_email_logs
  ADD COLUMN IF NOT EXISTS cart_id uuid REFERENCES public.carts(id) ON DELETE CASCADE;

ALTER TABLE public.abandoned_cart_email_logs
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.abandoned_cart_email_logs
  ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.abandoned_cart_email_logs
  ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('sent', 'failed'));

ALTER TABLE public.abandoned_cart_email_logs
  ADD COLUMN IF NOT EXISTS error text;

ALTER TABLE public.abandoned_cart_email_logs
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_abandoned_cart_email_logs_cart
  ON public.abandoned_cart_email_logs(cart_id);

ALTER TABLE public.abandoned_cart_email_logs ENABLE ROW LEVEL SECURITY;

-- Service role full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='abandoned_cart_email_logs'
      AND policyname='abandoned_cart_logs_service_role'
  ) THEN
    CREATE POLICY abandoned_cart_logs_service_role
    ON public.abandoned_cart_email_logs
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Admin read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='abandoned_cart_email_logs'
      AND policyname='abandoned_cart_logs_admin_select'
  ) THEN
    CREATE POLICY abandoned_cart_logs_admin_select
    ON public.abandoned_cart_email_logs
    FOR SELECT
    TO authenticated
    USING (public.is_admin());
  END IF;
END $$;
