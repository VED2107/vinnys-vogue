-- 0011_production_hardening.sql

-- 1) Restore stock and cancel order (no refund)
CREATE OR REPLACE FUNCTION public.restore_order_stock(p_order_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_user_id uuid;
BEGIN
  -- Lock order row
  SELECT user_id INTO v_user_id
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Ensure caller owns the order
  IF v_user_id <> p_user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Restore stock for each order item
  FOR v_item IN
    SELECT product_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id
  LOOP
    IF v_item.product_id IS NULL THEN
      CONTINUE;
    END IF;

    UPDATE public.products
    SET stock = stock + v_item.quantity,
        updated_at = now()
    WHERE id = v_item.product_id;

    INSERT INTO public.inventory_logs (product_id, change, reason)
    VALUES (v_item.product_id, v_item.quantity, 'order_cancelled');
  END LOOP;

  -- Cancel the order (do not touch payment_status)
  UPDATE public.orders
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = p_order_id;

  -- Monitoring
  INSERT INTO public.monitoring_events (type, severity, message, metadata)
  VALUES (
    'order_cancelled',
    'info',
    'Order cancelled and stock restored',
    jsonb_build_object('order_id', p_order_id, 'user_id', v_user_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.restore_order_stock(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_order_stock(uuid, uuid) TO authenticated;


-- 2) Low stock monitoring inside confirm_order_payment (minimal change)
CREATE OR REPLACE FUNCTION public.confirm_order_payment(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
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

END;
$$;
