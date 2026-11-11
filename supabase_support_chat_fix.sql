-- CPT Markets support chat repair.
-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Keeps existing support conversations and messages.

BEGIN;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  is_session_closed BOOLEAN DEFAULT FALSE,
  session_number INTEGER DEFAULT NULL,
  unread_admin_count INTEGER DEFAULT 0,
  unread_user_count INTEGER DEFAULT 0,
  last_message TEXT DEFAULT '',
  last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  messages JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS user_email TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_session_closed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS session_number INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS unread_admin_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unread_user_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_message TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS messages JSONB DEFAULT '[]'::jsonb;

UPDATE public.support_tickets
SET messages = '[]'::jsonb
WHERE messages IS NULL;

UPDATE public.support_tickets
SET is_session_closed = (status = 'closed')
WHERE is_session_closed IS NULL;

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_time
  ON public.support_tickets (user_id, last_message_time DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status_time
  ON public.support_tickets (status, last_message_time DESC);

ALTER TABLE public.support_tickets DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN
      RAISE NOTICE 'supabase_realtime publication not found. Enable Realtime for public.support_tickets in Supabase Dashboard.';
  END;
END $$;

COMMIT;

-- Verify existing tickets and their stored message counts.
SELECT
  id,
  user_id,
  user_name,
  status,
  last_message_time,
  jsonb_array_length(COALESCE(messages, '[]'::jsonb)) AS message_count
FROM public.support_tickets
ORDER BY last_message_time DESC
LIMIT 50;
