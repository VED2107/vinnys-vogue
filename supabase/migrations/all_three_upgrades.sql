-- =============================================================
-- CONSOLIDATED MIGRATION: Three Major Upgrades
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- PART 1: Payment Status System
-- ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE payment_status_enum AS ENUM ('unpaid','paid','failed','refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status payment_status_enum NOT NULL DEFAULT 'unpaid';

-- ─────────────────────────────────────────────────────────────
-- PART 2: Product Variants + Inventory
-- ─────────────────────────────────────────────────────────────

ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size text NOT NULL,
  stock integer NOT NULL DEFAULT 0
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- RLS policies (safe to re-run — uses IF NOT EXISTS pattern via DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_variants' AND policyname = 'Anyone can read variants') THEN
    CREATE POLICY "Anyone can read variants" ON product_variants FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_variants' AND policyname = 'Admin can manage variants') THEN
    CREATE POLICY "Admin can manage variants" ON product_variants FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- Cart items variant reference
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id);

-- Update increment_cart_item to support variant_id
CREATE OR REPLACE FUNCTION increment_cart_item(
  p_user_id uuid,
  p_product_id uuid,
  p_variant_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cart_id uuid;
BEGIN
  -- Get or create cart
  SELECT id INTO v_cart_id FROM carts WHERE user_id = p_user_id;
  IF v_cart_id IS NULL THEN
    INSERT INTO carts (user_id) VALUES (p_user_id) RETURNING id INTO v_cart_id;
  END IF;

  -- Upsert cart item (with optional variant_id)
  IF p_variant_id IS NULL THEN
    INSERT INTO cart_items (cart_id, product_id, quantity)
    VALUES (v_cart_id, p_product_id, 1)
    ON CONFLICT (cart_id, product_id) WHERE variant_id IS NULL
    DO UPDATE SET quantity = cart_items.quantity + 1;
  ELSE
    -- Check if this exact variant already exists in cart
    INSERT INTO cart_items (cart_id, product_id, variant_id, quantity)
    VALUES (v_cart_id, p_product_id, p_variant_id, 1)
    ON CONFLICT (cart_id, product_id, variant_id)
    DO UPDATE SET quantity = cart_items.quantity + 1;
  END IF;
END;
$$;

-- Add unique constraints for the upsert to work
-- First drop old constraint if it only covers (cart_id, product_id)
-- Then create a partial unique index for NULL variant_id and a unique index for non-NULL
DO $$ BEGIN
  -- Create unique index for items without variant
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'cart_items_cart_product_no_variant') THEN
    CREATE UNIQUE INDEX cart_items_cart_product_no_variant
      ON cart_items (cart_id, product_id) WHERE variant_id IS NULL;
  END IF;
  -- Create unique index for items with variant
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'cart_items_cart_product_variant') THEN
    CREATE UNIQUE INDEX cart_items_cart_product_variant
      ON cart_items (cart_id, product_id, variant_id) WHERE variant_id IS NOT NULL;
  END IF;
END $$;

-- Enhanced checkout_cart RPC with stock validation + decrement
CREATE OR REPLACE FUNCTION checkout_cart(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cart_id uuid;
  v_order_id uuid;
  v_total numeric := 0;
  v_item record;
  v_available_stock integer;
  v_product_title text;
BEGIN
  -- Get user's cart
  SELECT id INTO v_cart_id FROM carts WHERE user_id = p_user_id;
  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'No cart found';
  END IF;

  -- Check cart is not empty
  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE cart_id = v_cart_id) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Stock validation + decrement loop
  FOR v_item IN
    SELECT ci.id, ci.product_id, ci.variant_id, ci.quantity,
           p.price_cents, p.has_variants, p.title
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = v_cart_id
  LOOP
    IF v_item.variant_id IS NOT NULL THEN
      -- Variant-based stock check
      SELECT stock INTO v_available_stock
        FROM product_variants
        WHERE id = v_item.variant_id
        FOR UPDATE;

      IF v_available_stock IS NULL OR v_available_stock < v_item.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product: %', v_item.title;
      END IF;

      UPDATE product_variants
        SET stock = stock - v_item.quantity
        WHERE id = v_item.variant_id;

    ELSIF NOT v_item.has_variants THEN
      -- Simple product stock check
      SELECT stock INTO v_available_stock
        FROM products
        WHERE id = v_item.product_id
        FOR UPDATE;

      IF v_available_stock < v_item.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product: %', v_item.title;
      END IF;

      UPDATE products
        SET stock = stock - v_item.quantity
        WHERE id = v_item.product_id;
    END IF;

    -- Accumulate total (price_cents stores cents, total_amount stores rupees)
    v_total := v_total + (v_item.price_cents::numeric / 100.0) * v_item.quantity;
  END LOOP;

  -- Create order
  INSERT INTO orders (user_id, total_amount, status, payment_status)
  VALUES (p_user_id, v_total, 'pending', 'unpaid')
  RETURNING id INTO v_order_id;

  -- Create order items
  INSERT INTO order_items (order_id, product_id, quantity, price)
  SELECT v_order_id, ci.product_id, ci.quantity, (p.price_cents::numeric / 100.0)
  FROM cart_items ci
  JOIN products p ON p.id = ci.product_id
  WHERE ci.cart_id = v_cart_id;

  -- Clear cart
  DELETE FROM cart_items WHERE cart_id = v_cart_id;

  RETURN v_order_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- PART 3: Admin Analytics View
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW admin_order_stats AS
SELECT
  count(*)::int AS total_orders,
  coalesce(sum(total_amount) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS total_revenue,
  coalesce(avg(total_amount) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS avg_order_value,
  count(*) FILTER (WHERE status = 'pending')::int AS pending_count,
  count(*) FILTER (WHERE status = 'confirmed')::int AS confirmed_count,
  count(*) FILTER (WHERE status = 'shipped')::int AS shipped_count,
  count(*) FILTER (WHERE status = 'delivered')::int AS delivered_count,
  count(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_count,
  count(*) FILTER (WHERE payment_status = 'paid')::int AS paid_count,
  count(*) FILTER (WHERE payment_status = 'unpaid')::int AS unpaid_count,
  count(*) FILTER (WHERE payment_status = 'failed')::int AS failed_count,
  count(*) FILTER (WHERE payment_status = 'refunded')::int AS refunded_count
FROM orders;

GRANT SELECT ON admin_order_stats TO authenticated;
