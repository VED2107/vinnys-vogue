-- =====================================================
-- Fix order_items RLS: allow admin to view all items
-- =====================================================
-- Previous policy only allowed users to see order_items
-- for orders they own. This blocked admin analytics.
-- Updated to also allow admin role to see all order_items.
-- =====================================================

DROP POLICY IF EXISTS "Users view own order items" ON order_items;

CREATE POLICY "Users view own order items"
ON order_items
FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
