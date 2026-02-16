-- 0015_checkout_cart_auth_uid.sql
-- Ensure checkout_cart uses auth.uid() internally and never accepts user_id from the client.

DROP FUNCTION IF EXISTS public.checkout_cart(uuid);

CREATE OR REPLACE FUNCTION public.checkout_cart()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_cart_id uuid;
  v_order_id uuid;
  v_total numeric := 0;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO v_cart_id
  FROM carts
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'No cart found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM cart_items WHERE cart_id = v_cart_id
  ) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Lock products involved (prevents race conditions)
  PERFORM 1
  FROM products p
  JOIN cart_items ci ON ci.product_id = p.id
  WHERE ci.cart_id = v_cart_id
  FOR UPDATE;

  -- Validate stock before proceeding
  IF EXISTS (
    SELECT 1
    FROM (
      SELECT product_id, SUM(quantity)::int AS total_quantity
      FROM cart_items
      WHERE cart_id = v_cart_id
      GROUP BY product_id
    ) agg
    JOIN products p ON p.id = agg.product_id
    WHERE p.stock < agg.total_quantity
  ) THEN
    RAISE EXCEPTION 'Insufficient stock for one or more items';
  END IF;

  -- Calculate total only
  SELECT COALESCE(SUM(ci.quantity * pr.price_cents), 0) / 100.0
  INTO v_total
  FROM cart_items ci
  JOIN products pr ON pr.id = ci.product_id
  WHERE ci.cart_id = v_cart_id;

  -- Deduct stock atomically
  UPDATE products p
  SET stock = p.stock - agg.total_quantity,
      updated_at = now()
  FROM (
    SELECT product_id, SUM(quantity)::int AS total_quantity
    FROM cart_items
    WHERE cart_id = v_cart_id
    GROUP BY product_id
  ) agg
  WHERE p.id = agg.product_id;

  -- Create order (user_id must always be the authenticated user)
  INSERT INTO orders (user_id, status, total_amount, payment_status)
  VALUES (v_user_id, 'pending', v_total, 'unpaid')
  RETURNING id INTO v_order_id;

  -- Insert ORDER_CREATED event if order_events exists (added in 0012)
  INSERT INTO public.order_events (order_id, event_type)
  VALUES (v_order_id, 'ORDER_CREATED');

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

REVOKE ALL ON FUNCTION public.checkout_cart() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.checkout_cart() TO authenticated;

ALTER FUNCTION public.checkout_cart() OWNER TO postgres;
