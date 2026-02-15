-- ============================================================
-- 0003_enterprise_inventory_model.sql
-- Purpose: Enforce webhook-driven enterprise inventory model
-- ============================================================

-- 1️⃣ Replace checkout_cart to REMOVE stock deduction
CREATE OR REPLACE FUNCTION public.checkout_cart(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_cart_id uuid;
  v_order_id uuid;
  v_total numeric := 0;
BEGIN
  SELECT id INTO v_cart_id
  FROM carts
  WHERE user_id = p_user_id;

  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'No cart found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM cart_items WHERE cart_id = v_cart_id
  ) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Calculate total only
  SELECT COALESCE(SUM(ci.quantity * pr.price_cents), 0) / 100.0
  INTO v_total
  FROM cart_items ci
  JOIN products pr ON pr.id = ci.product_id
  WHERE ci.cart_id = v_cart_id;

  -- Create order
  INSERT INTO orders (user_id, status, total_amount, payment_status)
  VALUES (p_user_id, 'pending', v_total, 'unpaid')
  RETURNING id INTO v_order_id;

  -- Insert order items
  INSERT INTO order_items (order_id, product_id, quantity, price)
  SELECT v_order_id, ci.product_id, ci.quantity, pr.price_cents / 100.0
  FROM cart_items ci
  JOIN products pr ON pr.id = ci.product_id
  WHERE ci.cart_id = v_cart_id;

  -- Clear cart
  DELETE FROM cart_items
  WHERE cart_id = v_cart_id;

  RETURN v_order_id;
END;
$$;


-- 2️⃣ Create confirm_order_payment RPC (Atomic)
CREATE OR REPLACE FUNCTION public.confirm_order_payment(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Lock order row
  PERFORM 1 FROM orders WHERE id = p_order_id FOR UPDATE;

  -- Idempotency inside DB
  IF (SELECT payment_status FROM orders WHERE id = p_order_id) = 'paid' THEN
    RETURN;
  END IF;

  -- Loop through order items
  FOR v_item IN
    SELECT * FROM order_items WHERE order_id = p_order_id
  LOOP

    -- Lock product row
    PERFORM 1 FROM products WHERE id = v_item.product_id FOR UPDATE;

    -- Check stock
    IF (SELECT stock FROM products WHERE id = v_item.product_id) < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock during payment confirmation';
    END IF;

    -- Deduct stock
    UPDATE products
    SET stock = stock - v_item.quantity
    WHERE id = v_item.product_id;

    -- Insert inventory log
    INSERT INTO inventory_logs (product_id, change, reason)
    VALUES (v_item.product_id, -v_item.quantity, 'payment_confirmed');

  END LOOP;

  -- Mark order confirmed + paid
  UPDATE orders
  SET status = 'confirmed',
      payment_status = 'paid'
  WHERE id = p_order_id;

END;
$$;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
