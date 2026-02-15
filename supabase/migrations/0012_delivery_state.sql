-- 0012_delivery_state.sql

-- Add delivered_at column
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Optional index for admin filtering
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at
  ON public.orders (delivered_at);

-- Ensure order_events exists
CREATE TABLE IF NOT EXISTS public.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order
  ON public.order_events (order_id);

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

-- RLS: Customers can read events for their own orders. Admins can read all.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'order_events'
      AND policyname = 'order_events_select_own_or_admin'
  ) THEN
    CREATE POLICY order_events_select_own_or_admin
    ON public.order_events
    FOR SELECT
    TO authenticated
    USING (
      public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = order_id
          AND o.user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'order_events'
      AND policyname = 'order_events_insert_admin_or_service'
  ) THEN
    CREATE POLICY order_events_insert_admin_or_service
    ON public.order_events
    FOR INSERT
    TO authenticated
    WITH CHECK (
      public.is_admin()
      OR auth.role() = 'service_role'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'order_events'
      AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
    ON public.order_events
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Insert ORDER_CREATED event during checkout
CREATE OR REPLACE FUNCTION public.checkout_cart(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart_id uuid;
  v_order_id uuid;
  v_total numeric := 0;
BEGIN
  SELECT id INTO v_cart_id
  FROM carts
  WHERE user_id = p_user_id
  FOR UPDATE;

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

-- Insert PAYMENT_CONFIRMED event during confirm_order_payment
CREATE OR REPLACE FUNCTION public.confirm_order_payment(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_remaining integer;
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
    SET stock = stock - v_item.quantity,
        updated_at = now()
    WHERE id = v_item.product_id
    RETURNING stock INTO v_remaining;

    -- Insert inventory log
    INSERT INTO inventory_logs (product_id, change, reason)
    VALUES (v_item.product_id, -v_item.quantity, 'payment_confirmed');

    -- Low-stock monitoring
    IF v_remaining <= 2 THEN
      INSERT INTO public.monitoring_events (type, severity, message, metadata)
      VALUES (
        'low_stock',
        'warning',
        'Low stock threshold reached after payment confirmation',
        jsonb_build_object('product_id', v_item.product_id, 'remaining_stock', v_remaining)
      );
    END IF;

  END LOOP;

  -- Mark order confirmed + paid
  UPDATE orders
  SET status = 'confirmed',
      payment_status = 'paid'
  WHERE id = p_order_id;

  INSERT INTO public.order_events (order_id, event_type)
  VALUES (p_order_id, 'PAYMENT_CONFIRMED');

END;
$$;
