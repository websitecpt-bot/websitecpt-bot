import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { User, Trade, SupportTicket, DepositRequest, WithdrawalRequest } from '../types';

// Read public credentials from Vite environment variables (Never service-role key!)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 20
  );
};

// Initialize public Supabase client
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// ==========================================
// 1. Fetching Data from Supabase
// ==========================================

export const fetchUsersFromSupabase = async (): Promise<User[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.warn('Supabase fetchUsers error:', error.message);
      return null;
    }
    if (!data) return null;
    return data.map((row: any) => ({
      id: row.id,
      uid: row.uid,
      name: row.name,
      email: row.email,
      phone: row.phone || '',
      tradingBalance: Number(row.trading_balance || 0),
      fundingBalance: Number(row.funding_balance || 0),
      status: (row.status === 'suspended' ? 'suspended' : 'active') as 'active' | 'suspended',
      isOnline: Boolean(row.is_online),
      avatar: row.avatar || '',
      createdAt: row.created_at || new Date().toISOString(),
      lastLogin: row.last_login || new Date().toISOString(),
      referredByUid: row.referred_by_uid || undefined,
      role: (row.role || 'user') as 'user' | 'admin' | 'superadmin',
      password: row.password || '123456',
    }));
  } catch (err) {
    console.warn('Supabase fetchUsers exception:', err);
    return null;
  }
};

export const fetchTradesFromSupabase = async (): Promise<Trade[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('trades').select('*').order('opened_at', { ascending: false });
    if (error) {
      console.warn('Supabase fetchTrades error:', error.message);
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
    }));
  } catch (err) {
    console.warn('Supabase fetchTrades exception:', err);
    return null;
  }
};

export const fetchTicketsFromSupabase = async (): Promise<SupportTicket[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('support_tickets').select('*');
    if (error) {
      console.warn('Supabase fetchTickets error:', error.message);
      return null;
    }
    if (!data) return null;
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      status: row.status as 'pending' | 'answered' | 'closed',
      lastMessage: row.last_message || '',
      lastMessageTime: row.last_message_time || new Date().toISOString(),
      unreadAdminCount: Number(row.unread_admin_count || 0),
      unreadUserCount: Number(row.unread_user_count || 0),
      messages: Array.isArray(row.messages) ? row.messages : [],
    }));
  } catch (err) {
    console.warn('Supabase fetchTickets exception:', err);
    return null;
  }
};

export const fetchDepositsFromSupabase = async (): Promise<DepositRequest[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('deposit_requests').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase fetchDeposits error:', error.message);
      return null;
    }
    if (!data) return null;
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      amount: Number(row.amount || 0),
      paymentMethod: row.payment_method || 'USDT',
      network: row.network || 'TRC-20',
      txid: row.txid,
      status: row.status as 'pending' | 'approved' | 'rejected',
      timestamp: row.created_at,
    }));
  } catch (err) {
    console.warn('Supabase fetchDeposits exception:', err);
    return null;
  }
};

export const fetchWithdrawalsFromSupabase = async (): Promise<WithdrawalRequest[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('withdrawal_requests').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase fetchWithdrawals error:', error.message);
      return null;
    }
    if (!data) return null;
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      amount: Number(row.amount || 0),
      accountHolderName: row.user_name,
      bankOrAddress: row.bank_or_address,
      network: row.network,
      status: row.status as 'pending' | 'approved' | 'rejected',
      timestamp: row.created_at,
      withdrawalType: (row.withdrawal_type || 'USD') as 'USD' | 'USDT',
      notes: row.notes || '',
    }));
  } catch (err) {
    console.warn('Supabase fetchWithdrawals exception:', err);
    return null;
  }
};

// ==========================================
// 2. Cloud Database Operations (Upserts/Sync)
// ==========================================

export const syncUserToSupabase = async (user: User) => {
  if (!supabase) return;
  try {
    await supabase.from('users').upsert({
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
    });
  } catch (err) {
    console.warn('Supabase syncUserToSupabase notice:', err);
  }
};

export const updateUserBalanceInSupabase = async (userId: string, trading: number, funding: number) => {
  if (!supabase) return;
  try {
    await supabase.from('users').update({
      trading_balance: trading,
      funding_balance: funding,
    }).eq('id', userId);
  } catch (err) {
    console.warn('Supabase updateUserBalance notice:', err);
  }
};

export const updateUserStatusInSupabase = async (userId: string, status: 'active' | 'suspended') => {
  if (!supabase) return;
  try {
    await supabase.from('users').update({
      status: status,
    }).eq('id', userId);
  } catch (err) {
    console.warn('Supabase updateUserStatus notice:', err);
  }
};

export const syncTradeToSupabase = async (trade: Trade) => {
  if (!supabase) return;
  try {
    await supabase.from('trades').upsert({
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
    });
  } catch (err) {
    console.warn('Supabase syncTradeToSupabase notice:', err);
  }
};

export const syncTicketToSupabase = async (ticket: SupportTicket) => {
  if (!supabase) return;
  try {
    await supabase.from('support_tickets').upsert({
      id: ticket.id,
      user_id: ticket.userId,
      user_name: ticket.userName,
      user_email: ticket.userEmail,
      status: ticket.status,
      last_message: ticket.lastMessage,
      last_message_time: ticket.lastMessageTime,
      messages: ticket.messages,
    });
  } catch (err) {
    console.warn('Supabase syncTicketToSupabase notice:', err);
  }
};

export const syncDepositToSupabase = async (deposit: DepositRequest) => {
  if (!supabase) return;
  try {
    await supabase.from('deposit_requests').upsert({
      id: deposit.id,
      user_id: deposit.userId,
      user_name: deposit.userName,
      amount: deposit.amount,
      network: deposit.network || deposit.paymentMethod,
      payment_method: deposit.paymentMethod,
      txid: deposit.txid,
      status: deposit.status,
      created_at: deposit.timestamp,
    });
  } catch (err) {
    console.warn('Supabase syncDepositToSupabase notice:', err);
  }
};

export const updateDepositStatusInSupabase = async (depositId: string, status: string) => {
  if (!supabase) return;
  try {
    await supabase.from('deposit_requests').update({ status }).eq('id', depositId);
  } catch (err) {
    console.warn('Supabase updateDepositStatus notice:', err);
  }
};

export const syncWithdrawalToSupabase = async (withdrawal: WithdrawalRequest) => {
  if (!supabase) return;
  try {
    await supabase.from('withdrawal_requests').upsert({
      id: withdrawal.id,
      user_id: withdrawal.userId,
      user_name: withdrawal.userName,
      amount: withdrawal.amount,
      withdrawal_type: withdrawal.withdrawalType,
      bank_or_address: withdrawal.bankOrAddress,
      network: withdrawal.network,
      status: withdrawal.status,
      notes: withdrawal.notes || '',
      created_at: withdrawal.timestamp,
    });
  } catch (err) {
    console.warn('Supabase syncWithdrawalToSupabase notice:', err);
  }
};

export const updateWithdrawalStatusInSupabase = async (withdrawalId: string, status: string) => {
  if (!supabase) return;
  try {
    await supabase.from('withdrawal_requests').update({ status }).eq('id', withdrawalId);
  } catch (err) {
    console.warn('Supabase updateWithdrawalStatus notice:', err);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, () => {
        handlers.onTradeUpdate?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        handlers.onTicketUpdate?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposit_requests' }, () => {
        handlers.onDepositUpdate?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawal_requests' }, () => {
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
