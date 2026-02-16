-- 0016_cancel_order_rpc.sql
-- Secure cancel_order() RPC using auth.uid() internally.
-- Restores stock atomically, prevents double cancel, inserts ORDER_CANCELLED event.

DROP FUNCTION IF EXISTS public.cancel_order(uuid);

CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_owner_id uuid;
  v_status text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock order row and fetch status + owner
  SELECT user_id, status INTO v_owner_id, v_status
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Ensure caller owns the order
  IF v_owner_id <> v_user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Prevent double cancel (also prevents double restock)
  IF v_status = 'cancelled' THEN
    RAISE EXCEPTION 'Order already cancelled';
  END IF;

  -- Only allow cancel for pending or confirmed orders
  IF v_status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'Order cannot be cancelled (status: %)', v_status;
  END IF;

  UPDATE products p
  SET stock = p.stock + oi.quantity,
      updated_at = now()
  FROM (
    SELECT product_id, SUM(quantity)::int AS quantity
    FROM order_items
    WHERE order_id = p_order_id
    AND product_id IS NOT NULL
    GROUP BY product_id
  ) oi
  WHERE p.id = oi.product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No order items found for restock';
  END IF;

  INSERT INTO inventory_logs (product_id, change, reason)
  SELECT product_id, quantity, 'order_cancelled'
  FROM order_items
  WHERE order_id = p_order_id
  AND product_id IS NOT NULL;

  -- Mark order as cancelled
  UPDATE orders
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = p_order_id;

  -- Insert ORDER_CANCELLED event
  INSERT INTO order_events (order_id, event_type)
  VALUES (p_order_id, 'ORDER_CANCELLED');

  -- Monitoring
  INSERT INTO monitoring_events (type, severity, message, metadata)
  VALUES (
    'order_cancelled',
    'info',
    'Order cancelled and stock restored',
    jsonb_build_object('order_id', p_order_id, 'user_id', v_user_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_order(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.cancel_order(uuid) TO authenticated;
ALTER FUNCTION public.cancel_order(uuid) OWNER TO postgres;
