-- CPT Markets: repair existing trades table for permanent history and cross-device live sync.
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- This does NOT create a second trades table or delete existing trade rows.

BEGIN;

-- Create the shared table only if this project does not have it yet.
-- Existing trade rows are left untouched.
CREATE TABLE IF NOT EXISTS public.trades (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL,
  leverage NUMERIC(10, 2) DEFAULT 10,
  margin NUMERIC(15, 2) NOT NULL,
  position_size NUMERIC(15, 2) NOT NULL,
  entry_price NUMERIC(15, 4) NOT NULL,
  current_price NUMERIC(15, 4) NOT NULL,
  exit_price NUMERIC(15, 4) DEFAULT NULL,
  status TEXT DEFAULT 'OPEN',
  duration_minutes INTEGER DEFAULT 1,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  pnl NUMERIC(15, 2) DEFAULT 0.00,
  pnl_percent NUMERIC(10, 2) DEFAULT 0.00,
  fee NUMERIC(15, 2) DEFAULT 0.00,
  scheduled_outcome TEXT DEFAULT NULL,
  scheduled_percent NUMERIC(10, 2) DEFAULT NULL
);

ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS scheduled_outcome TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS scheduled_percent NUMERIC(10, 2) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_trades_user_opened_at
  ON public.trades (user_id, opened_at DESC);

CREATE INDEX IF NOT EXISTS idx_trades_status_opened_at
  ON public.trades (status, opened_at DESC);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
    WHEN undefined_object THEN
      RAISE NOTICE 'supabase_realtime publication not found. Enable Realtime for public.trades in Supabase Dashboard.';
  END;
END $$;

COMMIT;

-- Verify the required columns exist:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'trades'
ORDER BY ordinal_position;

-- Verify trades are visible (including closed history):
SELECT id, user_id, symbol, type, status, opened_at, closed_at, pnl
FROM public.trades
ORDER BY opened_at DESC
LIMIT 50;
