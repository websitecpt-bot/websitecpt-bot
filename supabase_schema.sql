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
  current_price NUMERIC(30, 12) NOT NULL,
  exit_price NUMERIC(30, 12) DEFAULT NULL,
  status TEXT DEFAULT 'OPEN', -- 'OPEN' or 'CLOSED'
  duration_minutes INTEGER DEFAULT 1,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  pnl NUMERIC(15, 2) DEFAULT 0.00,
  pnl_percent NUMERIC(10, 2) DEFAULT 0.00,
  fee NUMERIC(15, 2) DEFAULT 0.00,
  is_paper_trade BOOLEAN NOT NULL DEFAULT FALSE,
  qa_override_mode TEXT DEFAULT NULL,
  qa_locked_exit_price NUMERIC(30, 12) DEFAULT NULL,
  qa_target_profit NUMERIC(15, 2) DEFAULT NULL,
  qa_target_exit_price NUMERIC(30, 12) DEFAULT NULL,
  qa_start_pnl NUMERIC(15, 2) DEFAULT NULL,
  qa_override_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  qa_last_price_update_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Additive migration for existing trades tables (safe to run more than once).
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS is_paper_trade BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS qa_override_mode TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS qa_locked_exit_price NUMERIC(30, 12) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS qa_target_profit NUMERIC(15, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS qa_target_exit_price NUMERIC(30, 12) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS qa_start_pnl NUMERIC(15, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS qa_override_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS qa_last_price_update_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Increase precision for exact QA target-price calculations without changing existing values.
ALTER TABLE public.trades
  ALTER COLUMN current_price TYPE NUMERIC(30, 12) USING current_price::NUMERIC(30, 12),
  ALTER COLUMN exit_price TYPE NUMERIC(30, 12) USING exit_price::NUMERIC(30, 12);

-- 3. SUPPORT TICKETS & 2-WAY MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT DEFAULT '',
  status TEXT DEFAULT 'pending', -- 'pending', 'answered', 'closed'
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
  source_wallet TEXT NOT NULL DEFAULT 'funding',
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reject_reason TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safe migration for databases where withdrawal_requests already existed.
ALTER TABLE public.withdrawal_requests
  ADD COLUMN IF NOT EXISTS source_wallet TEXT NOT NULL DEFAULT 'funding',
  ADD COLUMN IF NOT EXISTS reject_reason TEXT DEFAULT '';

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
