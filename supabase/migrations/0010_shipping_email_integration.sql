ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS courier_name text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_tracking_number
  ON public.orders(tracking_number);

CREATE TABLE IF NOT EXISTS public.shipping_email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  sent_at timestamptz DEFAULT now(),
  status text,
  error text
);

ALTER TABLE public.shipping_email_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shipping_email_logs'
      AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
    ON public.shipping_email_logs
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;
