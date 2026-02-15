CREATE INDEX IF NOT EXISTS idx_webhook_events_status_created
ON public.webhook_events(status, created_at);

ALTER TABLE public.webhook_events
ADD COLUMN IF NOT EXISTS processed_at timestamptz;
