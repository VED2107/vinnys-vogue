ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS latency_ms integer;

CREATE TABLE IF NOT EXISTS public.order_email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('sent', 'failed')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
ON public.order_email_logs
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
