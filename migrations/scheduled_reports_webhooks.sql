-- Scheduled reports and outbound webhooks

CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name varchar NOT NULL,
  type varchar NOT NULL CHECK (type IN ('visitors', 'revenue', 'incidents')),
  frequency varchar NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  recipients text NOT NULL,
  next_run_at timestamp NOT NULL,
  status varchar DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  last_run_at timestamp,
  created_by_user_id varchar,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_reports_status_next_run
  ON public.scheduled_reports (status, next_run_at);

CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  url text NOT NULL,
  description varchar,
  events text[] NOT NULL DEFAULT ARRAY[]::text[],
  secret varchar,
  status varchar DEFAULT 'active' CHECK (status IN ('active', 'failing', 'disabled')),
  last_success_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_status
  ON public.webhook_endpoints (status);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  endpoint_id varchar NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event varchar NOT NULL,
  status varchar NOT NULL CHECK (status IN ('success', 'failed')),
  payload jsonb,
  response_status integer,
  response_body text,
  timestamp timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint_time
  ON public.webhook_deliveries (endpoint_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status_time
  ON public.webhook_deliveries (status, timestamp DESC);

ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No anon access" ON public.scheduled_reports;
DROP POLICY IF EXISTS "No anon access" ON public.webhook_endpoints;
DROP POLICY IF EXISTS "No anon access" ON public.webhook_deliveries;

CREATE POLICY "No anon access" ON public.scheduled_reports
  FOR ALL USING (false);

CREATE POLICY "No anon access" ON public.webhook_endpoints
  FOR ALL USING (false);

CREATE POLICY "No anon access" ON public.webhook_deliveries
  FOR ALL USING (false);
