CREATE TABLE IF NOT EXISTS public.system_state (
  key text PRIMARY KEY,
  value jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.system_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access system_state"
ON public.system_state
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
