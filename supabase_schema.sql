-- ========================================================
-- CPT MARKETS UK — SUPABASE DATABASE SCHEMA
-- Run this script in your Supabase project -> SQL Editor
-- ========================================================

-- 1. USERS TABLE
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

-- 2. TRADES TABLE
CREATE TABLE IF NOT EXISTS public.trades (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL, -- BUY or SELL
  leverage NUMERIC(10, 2) DEFAULT 10,
  margin NUMERIC(15, 2) NOT NULL,
  position_size NUMERIC(15, 2) NOT NULL,
  entry_price NUMERIC(15, 4) NOT NULL,
  current_price NUMERIC(15, 4) NOT NULL,
  exit_price NUMERIC(15, 4) DEFAULT NULL,
  status TEXT DEFAULT 'OPEN', -- OPEN or CLOSED
  duration_minutes INTEGER DEFAULT 1,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  pnl NUMERIC(15, 2) DEFAULT 0.00,
  pnl_percent NUMERIC(10, 2) DEFAULT 0.00,
  fee NUMERIC(15, 2) DEFAULT 0.00
);

-- 3. SUPPORT TICKETS & MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, answered, closed
  unread_admin_count INTEGER DEFAULT 0,
  last_message TEXT DEFAULT '',
  last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  messages JSONB DEFAULT '[]'::jsonb
);

-- 4. DEPOSIT REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT DEFAULT '',
  user_uid TEXT DEFAULT '',
  amount NUMERIC(15, 2) NOT NULL,
  network TEXT DEFAULT 'TRC-20',
  payment_method TEXT DEFAULT 'USDT',
  wallet_address TEXT DEFAULT '',
  txid TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. WITHDRAWAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  withdrawal_type TEXT DEFAULT 'USD',
  bank_or_address TEXT NOT NULL,
  network TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable Row Level Security (RLS) for seamless prototype access, or enable with open policies
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests DISABLE ROW LEVEL SECURITY;
