import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { User, Trade, SupportTicket, DepositRequest, WithdrawalRequest, AuditLog } from '../types';

// Read public credentials from Vite environment variables (Never service-role key!)
const getSupabaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('cpt_supabase_url');
    if (saved) return saved.trim();
  }
  return (
    import.meta.env.VITE_SUPABASE_URL ||
    (typeof window !== 'undefined' && (window as any).__VITE_SUPABASE_URL) ||
    ''
  ).trim();
};

const getSupabaseAnonKey = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('cpt_supabase_key');
    if (saved) return saved.trim();
  }
  return (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    (typeof window !== 'undefined' && (window as any).__VITE_SUPABASE_ANON_KEY) ||
    ''
  ).trim();
};

export const setCustomSupabaseCredentials = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('cpt_supabase_url', url.trim());
      localStorage.setItem('cpt_supabase_key', key.trim());
    } else {
      localStorage.removeItem('cpt_supabase_url');
      localStorage.removeItem('cpt_supabase_key');
    }
  }
};

export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    key.length > 20
  );
};

export const getSupabaseConfigStatus = () => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const hasUrl = Boolean(url && url.startsWith('https://'));
  const hasKey = Boolean(key && key.length > 20);
  return {
    isConfigured: hasUrl && hasKey,
    hasUrl,
    hasKey,
    urlPreview: url ? url.replace(/^(https:\/\/[^.]+).*/, '$1.supabase.co') : 'missing',
  };
};

// Initialize public Supabase client
export const supabase = isSupabaseConfigured()
  ? createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export const getSupabaseClient = () => supabase;

// ==========================================
// 1. Fetching Data from Supabase
// ==========================================

export const fetchUsersFromSupabase = async (): Promise<User[] | null> => {
  if (!supabase) return null;
  try {
    // Try 'users' table first
    let res = await supabase.from('users').select('*');
    if (res.error && (res.error.message?.includes('does not exist') || res.error.code === '42P01')) {
      // Fallback to 'profiles' table if user named it profiles
      res = await supabase.from('profiles').select('*');
    }

    if (res.error) {
      console.warn('[Supabase fetchUsers] error:', res.error.message);
      return null;
    }
    if (!res.data) return null;

    return res.data.map((row: any) => ({
      id: row.id,
      uid: row.uid || row.id?.slice(0, 6) || '100001',
      name: row.name || row.full_name || row.username || 'Trader',
      email: row.email || '',
      phone: row.phone || '',
      tradingBalance: Number(row.trading_balance ?? row.balance ?? 0),
      fundingBalance: Number(row.funding_balance ?? 0),
      status: (row.status === 'suspended' ? 'suspended' : 'active') as 'active' | 'suspended',
      isOnline: Boolean(row.is_online ?? true),
      avatar: row.avatar || row.avatar_url || '',
      createdAt: row.created_at || new Date().toISOString(),
      lastLogin: row.last_login || new Date().toISOString(),
      referredByUid: row.referred_by_uid || undefined,
      role: (row.role || 'user') as 'user' | 'admin' | 'superadmin',
      password: row.password || '123456',
    }));
  } catch (err) {
    console.warn('[Supabase fetchUsers] exception:', err);
    return null;
  }
};

export const fetchTradesFromSupabase = async (): Promise<Trade[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('trades').select('*').order('opened_at', { ascending: false });
    if (error) {
      console.warn('[Supabase fetchTrades] error:', error.message);
      return null;
    }
    if (!data) return null;
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      symbol: row.symbol,
      type: row.type as 'BUY' | 'SELL',
      leverage: Number(row.leverage || 10),
      margin: Number(row.margin || 0),
      positionSize: Number(row.position_size || 0),
      entryPrice: Number(row.entry_price || 0),
      currentPrice: Number(row.current_price || 0),
      exitPrice: row.exit_price ? Number(row.exit_price) : undefined,
      status: row.status as 'OPEN' | 'CLOSED',
      durationMinutes: Number(row.duration_minutes || 1),
      openedAt: row.opened_at,
      closedAt: row.closed_at || undefined,
      expiresAt: row.expires_at,
      pnl: Number(row.pnl || 0),
      pnlPercent: Number(row.pnl_percent || 0),
      fee: Number(row.fee || 0),
      isPaperTrade: Boolean(row.is_paper_trade),
      qaOverrideMode: row.qa_override_mode === 'locked' || row.qa_override_mode === 'target_profit'
        ? row.qa_override_mode
        : undefined,
      qaLockedExitPrice: row.qa_locked_exit_price != null ? Number(row.qa_locked_exit_price) : undefined,
      qaTargetProfit: row.qa_target_profit != null ? Number(row.qa_target_profit) : undefined,
      qaTargetExitPrice: row.qa_target_exit_price != null ? Number(row.qa_target_exit_price) : undefined,
      qaStartPnl: row.qa_start_pnl != null ? Number(row.qa_start_pnl) : undefined,
      qaOverrideStartedAt: row.qa_override_started_at || undefined,
      qaLastPriceUpdateAt: row.qa_last_price_update_at || undefined,
    }));
  } catch (err) {
    console.warn('[Supabase fetchTrades] exception:', err);
    return null;
  }
};

export const fetchTicketsFromSupabase = async (): Promise<SupportTicket[] | null> => {
  if (!supabase) return null;
  try {
    let res = await supabase.from('support_tickets').select('*');
    if (res.error && (res.error.message?.includes('does not exist') || res.error.code === '42P01')) {
      res = await supabase.from('support_messages').select('*');
    }
    if (res.error) {
      console.warn('[Supabase fetchTickets] error:', res.error.message);
      return null;
    }
    if (!res.data) return null;
    return res.data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email || '',
      status: (row.status || 'pending') as 'pending' | 'answered' | 'closed',
      lastMessage: row.last_message || '',
      lastMessageTime: row.last_message_time || new Date().toISOString(),
      unreadAdminCount: Number(row.unread_admin_count || 0),
      unreadUserCount: Number(row.unread_user_count || 0),
      messages: Array.isArray(row.messages) ? row.messages : [],
    }));
  } catch (err) {
    console.warn('[Supabase fetchTickets] exception:', err);
    return null;
  }
};

export const fetchDepositsFromSupabase = async (): Promise<DepositRequest[] | null> => {
  if (!supabase) return null;
  try {
    let res = await supabase.from('deposit_requests').select('*').order('created_at', { ascending: false });
    if (res.error && (res.error.message?.includes('does not exist') || res.error.code === '42P01')) {
      res = await supabase.from('deposits').select('*').order('created_at', { ascending: false });
    }
    if (res.error) {
      console.warn('[Supabase fetchDeposits] error:', res.error.message);
      return null;
    }
    if (!res.data) return null;
    return res.data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      amount: Number(row.amount || 0),
      paymentMethod: row.payment_method || 'USDT',
      network: row.network || 'TRC-20',
      txid: row.txid || '',
      status: (row.status || 'pending') as 'pending' | 'approved' | 'rejected',
      timestamp: row.created_at,
    }));
  } catch (err) {
    console.warn('[Supabase fetchDeposits] exception:', err);
    return null;
  }
};

export const fetchWithdrawalsFromSupabase = async (): Promise<WithdrawalRequest[] | null> => {
  if (!supabase) return null;
  try {
    let res = await supabase.from('withdrawal_requests').select('*').order('created_at', { ascending: false });
    if (res.error && (res.error.message?.includes('does not exist') || res.error.code === '42P01')) {
      res = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    }
    if (res.error) {
      console.warn('[Supabase fetchWithdrawals] error:', res.error.message);
      return null;
    }
    if (!res.data) return null;
    return res.data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      amount: Number(row.amount || 0),
      accountHolderName: row.account_holder_name || row.user_name,
      bankOrAddress: row.bank_or_address || '',
      network: row.network || 'USDT',
      status: (row.status || 'pending') as 'pending' | 'approved' | 'rejected',
      timestamp: row.created_at,
      withdrawalType: (row.withdrawal_type || 'USD') as 'USD' | 'USDT',
      notes: row.notes || '',
      rejectReason: row.reject_reason || (row.status === 'rejected' ? row.notes : '') || '',
      sourceWallet: row.source_wallet === 'trading' ? 'trading' : 'funding',
    }));
  } catch (err) {
    console.warn('[Supabase fetchWithdrawals] exception:', err);
    return null;
  }
};

export const fetchAuditLogsFromSupabase = async (): Promise<AuditLog[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100);
    if (error) return null;
    return data.map((row: any) => ({
      id: row.id,
      adminName: row.admin_name,
      adminId: row.admin_id,
      action: row.action,
      target: row.target,
      details: row.details,
      timestamp: row.timestamp,
    }));
  } catch {
    return null;
  }
};

// ==========================================
// 2. Cloud Database Operations (Upserts/Sync)
// ==========================================

export const syncUserToSupabase = async (user: User): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured' };
  }
  try {
    const payload = {
      id: user.id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      trading_balance: user.tradingBalance,
      funding_balance: user.fundingBalance,
      status: user.status,
      is_online: user.isOnline,
      role: user.role || 'user',
      referred_by_uid: user.referredByUid || null,
      password: user.password,
      avatar: user.avatar || '',
      created_at: user.createdAt,
      last_login: user.lastLogin,
    };

    let { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });

    if (error && (error.message?.includes('does not exist') || error.code === '42P01')) {
      const fallback = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
      if (fallback.error) {
        return { success: false, error: fallback.error.message };
      }
      return { success: true };
    }

    if (error) {
      console.error('[Supabase syncUserToSupabase] error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase syncUserToSupabase] exception:', err);
    return { success: false, error: err?.message || 'Network exception saving user profile' };
  }
};

export const updateUserBalanceInSupabase = async (
  userId: string,
  trading: number,
  funding: number
): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase client is not configured' };

  const payload = {
    trading_balance: Number(trading.toFixed(2)),
    funding_balance: Number(funding.toFixed(2)),
  };

  try {
    let result = await supabase
      .from('users')
      .update(payload)
      .eq('id', userId)
      .select('id')
      .maybeSingle();

    if (result.error && (result.error.code === '42P01' || result.error.message?.includes('does not exist'))) {
      result = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId)
        .select('id')
        .maybeSingle();
    }

    if (!result.error && result.data) return { success: true };

    if (!result.error && !result.data) {
      const byUid = await supabase
        .from('users')
        .update(payload)
        .eq('uid', userId)
        .select('id')
        .maybeSingle();
      if (byUid.error) return { success: false, error: byUid.error.message };
      if (byUid.data) return { success: true };
      return { success: false, error: `No Supabase user row found for id/uid "${userId}".` };
    }

    // Compatibility with older schemas whose trading balance column was named "balance".
    if (result.error && (result.error.message?.includes('trading_balance') || result.error.code === '42703')) {
      const legacyPayload = { balance: payload.trading_balance, funding_balance: payload.funding_balance };
      const legacy = await supabase.from('users').update(legacyPayload).eq('id', userId).select('id').maybeSingle();
      if (legacy.error) return { success: false, error: legacy.error.message };
      if (legacy.data) return { success: true };
    }

    return { success: false, error: result.error?.message || 'Supabase did not update the user balance.' };
  } catch (err: any) {
    console.warn('Supabase updateUserBalance error:', err);
    return { success: false, error: err?.message || 'Network exception while updating wallet balances' };
  }
};

export const updateUserStatusInSupabase = async (userId: string, status: 'active' | 'suspended') => {
  if (!supabase) return;
  try {
    let { error } = await supabase.from('users').update({ status }).eq('id', userId);
    if (error && (error.message?.includes('does not exist') || error.code === '42P01')) {
      await supabase.from('profiles').update({ status }).eq('id', userId);
    }
  } catch (err) {
    console.warn('Supabase updateUserStatus notice:', err);
  }
};

export const syncTradeToSupabase = async (trade: Trade): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Not configured' };
  try {
    const { error } = await supabase.from('trades').upsert({
      id: trade.id,
      user_id: trade.userId,
      user_name: trade.userName,
      symbol: trade.symbol,
      type: trade.type,
      leverage: trade.leverage,
      margin: trade.margin,
      position_size: trade.positionSize,
      entry_price: trade.entryPrice,
      current_price: trade.currentPrice,
      exit_price: trade.exitPrice || null,
      status: trade.status,
      duration_minutes: trade.durationMinutes,
      opened_at: trade.openedAt,
      closed_at: trade.closedAt || null,
      expires_at: trade.expiresAt,
      pnl: trade.pnl,
      pnl_percent: trade.pnlPercent,
      fee: trade.fee,
      is_paper_trade: Boolean(trade.isPaperTrade),
      qa_override_mode: trade.qaOverrideMode || null,
      qa_locked_exit_price: trade.qaLockedExitPrice ?? null,
      qa_target_profit: trade.qaTargetProfit ?? null,
      qa_target_exit_price: trade.qaTargetExitPrice ?? null,
      qa_start_pnl: trade.qaStartPnl ?? null,
      qa_override_started_at: trade.qaOverrideStartedAt || null,
      qa_last_price_update_at: trade.qaLastPriceUpdateAt || null,
    }, { onConflict: 'id' });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
};

export const syncTicketToSupabase = async (ticket: SupportTicket): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Not configured' };
  try {
    const payload = {
      id: ticket.id,
      user_id: ticket.userId,
      user_name: ticket.userName,
      user_email: ticket.userEmail,
      status: ticket.status,
      unread_admin_count: ticket.unreadAdminCount || 0,
      unread_user_count: ticket.unreadUserCount || 0,
      last_message: ticket.lastMessage,
      last_message_time: ticket.lastMessageTime,
      messages: ticket.messages,
    };
    let { error } = await supabase.from('support_tickets').upsert(payload, { onConflict: 'id' });
    if (error && (error.message?.includes('does not exist') || error.code === '42P01')) {
      const fb = await supabase.from('support_messages').upsert(payload, { onConflict: 'id' });
      if (fb.error) return { success: false, error: fb.error.message };
      return { success: true };
    }
    if (error) {
      console.warn('[Supabase syncTicketToSupabase notice]:', error.message);
      // Fallback with base columns if schema has column differences
      const minimal = {
        id: ticket.id,
        user_id: ticket.userId,
        user_name: ticket.userName,
        status: ticket.status,
        last_message: ticket.lastMessage,
        messages: ticket.messages,
      };
      const retry = await supabase.from('support_tickets').upsert(minimal, { onConflict: 'id' });
      if (retry.error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
};

export const syncDepositToSupabase = async (deposit: DepositRequest): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Not configured' };
  try {
    const payload = {
      id: deposit.id,
      user_id: deposit.userId,
      user_name: deposit.userName,
      amount: deposit.amount,
      network: deposit.network || deposit.paymentMethod,
      payment_method: deposit.paymentMethod,
      txid: deposit.txid,
      status: deposit.status,
      note: deposit.note || '',
      created_at: deposit.timestamp,
    };
    let { error } = await supabase.from('deposit_requests').upsert(payload, { onConflict: 'id' });
    if (error && (error.message?.includes('does not exist') || error.code === '42P01')) {
      const fb = await supabase.from('deposits').upsert(payload, { onConflict: 'id' });
      if (fb.error) return { success: false, error: fb.error.message };
      return { success: true };
    }
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
};

export const updateDepositStatusInSupabase = async (depositId: string, status: string) => {
  if (!supabase) return;
  try {
    let { error } = await supabase.from('deposit_requests').update({ status }).eq('id', depositId);
    if (error && (error.message?.includes('does not exist') || error.code === '42P01')) {
      await supabase.from('deposits').update({ status }).eq('id', depositId);
    }
  } catch (err) {
    console.warn('Supabase updateDepositStatus notice:', err);
  }
};

export const syncWithdrawalToSupabase = async (withdrawal: WithdrawalRequest): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase client is not configured' };

  try {
    const payload = {
      id: withdrawal.id,
      user_id: withdrawal.userId,
      user_name: withdrawal.userName,
      account_holder_name: withdrawal.accountHolderName || withdrawal.userName,
      amount: Number(withdrawal.amount.toFixed(2)),
      withdrawal_type: withdrawal.withdrawalType || 'USD',
      bank_or_address: withdrawal.bankOrAddress,
      network: withdrawal.network,
      source_wallet: withdrawal.sourceWallet || 'funding',
      status: withdrawal.status,
      reject_reason: withdrawal.rejectReason || '',
      notes: withdrawal.notes || '',
      created_at: withdrawal.timestamp,
    };

    const { error } = await supabase
      .from('withdrawal_requests')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase syncWithdrawalToSupabase] error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase syncWithdrawalToSupabase] exception:', err);
    return { success: false, error: err?.message || 'Network exception saving withdrawal request' };
  }
};

export const deleteWithdrawalFromSupabase = async (
  withdrawalId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase client is not configured' };
  try {
    const { error } = await supabase
      .from('withdrawal_requests')
      .delete()
      .eq('id', withdrawalId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network exception deleting withdrawal request' };
  }
};

export const updateWithdrawalStatusInSupabase = async (
  withdrawalId: string,
  status: string,
  rejectReason?: string
): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase client is not configured' };

  try {
    const updatePayload: Record<string, any> = { status };
    if (typeof rejectReason === 'string') {
      updatePayload.notes = rejectReason;
      updatePayload.reject_reason = rejectReason;
    }

    let result = await supabase
      .from('withdrawal_requests')
      .update(updatePayload)
      .eq('id', withdrawalId)
      .select('id')
      .maybeSingle();

    if (result.error && result.error.code === '42703' && typeof rejectReason === 'string') {
      // Older installations may not yet have reject_reason; retain the message in notes.
      result = await supabase
        .from('withdrawal_requests')
        .update({ status, notes: rejectReason })
        .eq('id', withdrawalId)
        .select('id')
        .maybeSingle();
    }

    if (result.error) return { success: false, error: result.error.message };
    if (!result.data) return { success: false, error: 'Withdrawal record was not found in Supabase.' };
    return { success: true };
  } catch (err: any) {
    console.warn('Supabase updateWithdrawalStatus error:', err);
    return { success: false, error: err?.message || 'Network exception updating withdrawal status' };
  }
};

export const syncAuditLogToSupabase = async (log: AuditLog) => {
  if (!supabase) return;
  try {
    await supabase.from('audit_logs').insert({
      id: log.id,
      admin_name: log.adminName,
      admin_id: log.adminId,
      action: log.action,
      target: log.target,
      details: log.details,
      timestamp: log.timestamp,
    });
  } catch {
    // Audit logs non-critical
  }
};

// ==========================================
// 3. Realtime Subscription Handler
// ==========================================

export interface RealtimeHandlers {
  onRefreshAll?: () => void;
  onUserUpdate?: () => void;
  onTradeUpdate?: () => void;
  onTicketUpdate?: () => void;
  onDepositUpdate?: () => void;
  onWithdrawalUpdate?: () => void;
}

export const subscribeToSupabaseRealtime = (handlers: RealtimeHandlers): RealtimeChannel | null => {
  if (!supabase) return null;

  try {
    const channel = supabase
      .channel('cpt-markets-realtime-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        handlers.onUserUpdate?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        handlers.onUserUpdate?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, () => {
        handlers.onTradeUpdate?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        handlers.onTicketUpdate?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        handlers.onTicketUpdate?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposit_requests' }, () => {
        handlers.onDepositUpdate?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, () => {
        handlers.onDepositUpdate?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawal_requests' }, () => {
        handlers.onWithdrawalUpdate?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        handlers.onWithdrawalUpdate?.();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Supabase Realtime] Connected to public change feed');
        }
      });

    return channel;
  } catch (err) {
    console.warn('Failed to subscribe to Supabase Realtime channel:', err);
    return null;
  }
};

// ==========================================
// 4. Supabase Auth Helpers
// ==========================================

export const supabaseAuthSignUp = async (params: {
  email: string;
  password?: string;
  name: string;
  phone?: string;
  uid: string;
}): Promise<{ data: any; error: { message: string } | null }> => {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: 'Supabase client is not initialized. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.',
      },
    };
  }
  try {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password || '123456',
      options: {
        data: {
          name: params.name,
          phone: params.phone || '',
          uid: params.uid,
        },
      },
    });

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data, error: null };
  } catch (err: any) {
    console.warn('[Supabase Auth SignUp] exception:', err);
    return { data: null, error: { message: err?.message || 'Network error during Supabase Auth registration' } };
  }
};

export const supabaseAuthSignIn = async (
  email: string,
  password?: string
): Promise<{ data: any; error: { message: string } | null }> => {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: 'Supabase client is not initialized. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.',
      },
    };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: password || '123456',
    });

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data, error: null };
  } catch (err: any) {
    console.warn('[Supabase Auth SignIn] exception:', err);
    return { data: null, error: { message: err?.message || 'Network error during Supabase Auth login' } };
  }
};
