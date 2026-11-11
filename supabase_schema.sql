-- ==============================================================================
-- CPT MARKETS UK — MASTER SUPABASE SQL SCHEMA
-- Execute this entire script in Supabase -> SQL Editor -> Run
-- This creates all tables, compatibility views, and configures Realtime & RLS.
-- ==============================================================================

-- 1. USERS & TRADER ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  uid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  trading_balance NUMERIC(15, 2) DEFAULT 0.00,
  funding_balance NUMERIC(15, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'active',
  is_online BOOLEAN DEFAULT true,
  role TEXT DEFAULT 'user',
  referred_by_uid TEXT DEFAULT NULL,
  password TEXT DEFAULT '123456',
  avatar TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compatibility view for setups expecting "profiles" table
CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM public.users;

-- 2. LIVE & CLOSED TRADES TABLE
CREATE TABLE IF NOT EXISTS public.trades (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL, -- 'BUY' or 'SELL'
  leverage NUMERIC(10, 2) DEFAULT 10,
  margin NUMERIC(15, 2) NOT NULL,
  position_size NUMERIC(15, 2) NOT NULL,
  entry_price NUMERIC(15, 4) NOT NULL,
  current_price NUMERIC(15, 4) NOT NULL,
  exit_price NUMERIC(15, 4) DEFAULT NULL,
  status TEXT DEFAULT 'OPEN', -- 'OPEN' or 'CLOSED'
  duration_minutes INTEGER DEFAULT 1,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  pnl NUMERIC(15, 2) DEFAULT 0.00,
  pnl_percent NUMERIC(10, 2) DEFAULT 0.00,
  fee NUMERIC(15, 2) DEFAULT 0.00
);

-- 3. SUPPORT TICKETS & 2-WAY MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT DEFAULT '',
  status TEXT DEFAULT 'pending', -- 'pending', 'answered', 'closed'
  is_session_closed BOOLEAN DEFAULT FALSE,
  session_number INTEGER DEFAULT NULL,
  unread_admin_count INTEGER DEFAULT 0,
  unread_user_count INTEGER DEFAULT 0,
  last_message TEXT DEFAULT '',
  last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  messages JSONB DEFAULT '[]'::jsonb
);

-- Compatibility view for "support_messages"
CREATE OR REPLACE VIEW public.support_messages AS SELECT * FROM public.support_tickets;

-- 4. DEPOSIT REQUESTS & TXID VERIFICATION TABLE
CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT DEFAULT '',
  user_uid TEXT DEFAULT '',
  amount NUMERIC(15, 2) NOT NULL,
  network TEXT DEFAULT 'TRC-20',
  payment_method TEXT DEFAULT 'USDT',
  wallet_address TEXT DEFAULT '',
  txid TEXT DEFAULT '',
  note TEXT DEFAULT '',
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compatibility view for "deposits"
CREATE OR REPLACE VIEW public.deposits AS SELECT * FROM public.deposit_requests;

-- 5. WITHDRAWAL REQUESTS & PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  account_holder_name TEXT DEFAULT '',
  amount NUMERIC(15, 2) NOT NULL,
  withdrawal_type TEXT DEFAULT 'USD',
  bank_or_address TEXT NOT NULL,
  network TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compatibility view for "withdrawals"
CREATE OR REPLACE VIEW public.withdrawals AS SELECT * FROM public.withdrawal_requests;

-- 6. AUDIT LOGS & ADMIN ACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  admin_name TEXT NOT NULL,
  admin_id TEXT DEFAULT 'admin-01',
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  details TEXT DEFAULT '',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. DISABLE ROW LEVEL SECURITY (RLS) FOR DIRECT FRONTEND ACCESS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- 8. ENABLE REALTIME CHANGE FEEDS (Instant updates without page reloads)
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.users; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.trades; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.deposit_requests; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 9. TRADE HISTORY & CROSS-DEVICE SYNC COMPATIBILITY
-- The original CREATE TABLE IF NOT EXISTS does not add columns to an
-- already-existing trades table. These ALTERs safely upgrade existing projects.
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS scheduled_outcome TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS scheduled_percent NUMERIC(10, 2) DEFAULT NULL;

-- Keep user history and admin monitoring queries efficient.
CREATE INDEX IF NOT EXISTS idx_trades_user_opened_at
  ON public.trades (user_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_status_opened_at
  ON public.trades (status, opened_at DESC);

-- Ensure the existing trades table is included in Supabase Realtime.
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN RAISE NOTICE 'supabase_realtime publication not found; enable Realtime for public.trades in Supabase Dashboard.';
  END;
END $$;
