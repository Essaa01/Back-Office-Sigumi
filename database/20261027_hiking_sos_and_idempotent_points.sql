-- =============================================================================
-- Migration: Hiking SOS Alerts & Idempotent Tracking Points
-- File: database/20261027_hiking_sos_and_idempotent_points.sql
-- =============================================================================

-- 1. Ensure Table public.hiking_sos_alerts exists with required schema
CREATE TABLE IF NOT EXISTS public.hiking_sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_alert_id TEXT UNIQUE,
  session_id UUID REFERENCES public.hiking_sessions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  accuracy_meters DOUBLE PRECISION,
  location_recorded_at TIMESTAMPTZ,
  message TEXT NOT NULL DEFAULT 'Pengguna meminta bantuan melalui SOS.',
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'acknowledged', 'resolved', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hiking_sos_alerts_open_created
  ON public.hiking_sos_alerts (created_at DESC)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_hiking_sos_alerts_user_created
  ON public.hiking_sos_alerts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hiking_sos_alerts_client_alert_id
  ON public.hiking_sos_alerts (client_alert_id);

-- 3. Idempotent columns on hiking_sessions and hiking_track_points
ALTER TABLE public.hiking_sessions
  ADD COLUMN IF NOT EXISTS client_session_id TEXT UNIQUE;

ALTER TABLE public.hiking_track_points
  ADD COLUMN IF NOT EXISTS client_point_id TEXT UNIQUE;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.hiking_sos_alerts ENABLE ROW LEVEL SECURITY;

-- 4a. Mobile users policies (Users can only insert & view their own alerts)
DROP POLICY IF EXISTS "Users can create own hiking SOS alerts" ON public.hiking_sos_alerts;
CREATE POLICY "Users can create own hiking SOS alerts"
  ON public.hiking_sos_alerts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      session_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.hiking_sessions s
        WHERE s.id = session_id AND s.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can view own hiking SOS alerts" ON public.hiking_sos_alerts;
CREATE POLICY "Users can view own hiking SOS alerts"
  ON public.hiking_sos_alerts FOR SELECT
  USING (auth.uid() = user_id);

-- 4b. Backoffice Admin policy
-- If backoffice admins authenticate via Supabase Auth:
DROP POLICY IF EXISTS "Admins can view and update all hiking SOS alerts" ON public.hiking_sos_alerts;
CREATE POLICY "Admins can view and update all hiking SOS alerts"
  ON public.hiking_sos_alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admins a
      WHERE a.email = auth.jwt()->>'email'
        AND a.role IN ('BPBD', 'MDMC')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins a
      WHERE a.email = auth.jwt()->>'email'
        AND a.role IN ('BPBD', 'MDMC')
    )
  );

-- Alternative policy for environments where backoffice connects with anon key:
-- (Uncomment if backoffice does not sign into Supabase Auth directly)
-- DROP POLICY IF EXISTS "Backoffice anon read update hiking SOS alerts" ON public.hiking_sos_alerts;
-- CREATE POLICY "Backoffice anon read update hiking SOS alerts"
--   ON public.hiking_sos_alerts FOR ALL
--   TO anon
--   USING (true)
--   WITH CHECK (true);

-- 5. Replica Identity FULL for Realtime updates (ensures all columns sent on UPDATE)
ALTER TABLE public.hiking_sos_alerts REPLICA IDENTITY FULL;

-- 6. Add to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'hiking_sos_alerts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hiking_sos_alerts;
  END IF;
END $$;

