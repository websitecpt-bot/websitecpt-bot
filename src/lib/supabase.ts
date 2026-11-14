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

const SUPPORT_ATTACHMENT_BUCKET = 'support-attachments';
const SUPPORT_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;

/**
 * Upload a support attachment to a private Supabase Storage bucket.
 * The returned storage:// reference is persisted in the support message;
 * it is not a public URL or an expiring signed URL.
 */
export const uploadSupportAttachment = async (file: File, ticketId: string): Promise<string> => {
  if (!supabase) throw new Error('Supabase is not configured. Cannot upload support attachments.');
  if (!file) throw new Error('No attachment selected.');
  if (file.size > SUPPORT_ATTACHMENT_MAX_BYTES) {
    throw new Error('The attachment is larger than the 20 MB limit.');
  }

  const safeName = file.name
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(-120) || 'attachment';
  const safeTicketId = ticketId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100) || 'support';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`;
  const objectPath = `${safeTicketId}/${uniqueName}`;

  const { error } = await supabase.storage
    .from(SUPPORT_ATTACHMENT_BUCKET)
    .upload(objectPath, file, {
      cacheControl: '3600',
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (error) {
    console.error('[Support Storage] Upload failed:', error.message);
    throw new Error(error.message || 'Unable to upload attachment.');
  }

  return `storage://${SUPPORT_ATTACHMENT_BUCKET}/${objectPath}`;
};

/**
 * Resolve a stored attachment reference to a short-lived private signed URL.
 * Legacy data URLs and ordinary HTTP URLs continue to work unchanged.
 */
export const getSupportAttachmentUrl = async (
  reference: string,
  download = false,
  fileName?: string
): Promise<string> => {
  if (!reference.startsWith('storage://')) return reference;
  if (!supabase) throw new Error('Supabase is not configured. Cannot open attachment.');

  const storagePath = reference.slice('storage://'.length);
  const separator = storagePath.indexOf('/');
  if (separator <= 0 || separator === storagePath.length - 1) {
    throw new Error('Invalid support attachment reference.');
  }

  const bucket = storagePath.slice(0, separator);
  const objectPath = storagePath.slice(separator + 1);
  if (bucket !== SUPPORT_ATTACHMENT_BUCKET) {
    throw new Error('Unsupported support attachment storage bucket.');
  }

  const options = download ? { download: fileName || true } : undefined;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, 60 * 60 * 24, options);

  if (error || !data?.signedUrl) {
    console.error('[Support Storage] Signed URL failed:', error?.message);
    throw new Error(error?.message || 'Unable to open attachment.');
  }

  return data.signedUrl;
};


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
    return data.map((row: any) => {
      const duration = Number(row.duration_minutes || 1);
      let expiryMs = row.expires_at ? new Date(row.expires_at).getTime() : NaN;
      if (isNaN(expiryMs) || expiryMs <= 0) {
        const openedMs = row.opened_at ? new Date(row.opened_at).getTime() : Date.now();
        expiryMs = (isNaN(openedMs) ? Date.now() : openedMs) + duration * 60 * 1000;
      }
      return {
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
        exitPrice: row.exit_price
          ? Number(row.exit_price)
          : (row.status === 'CLOSED' ? Number(row.current_price || row.entry_price) : undefined),
        status: row.status as 'OPEN' | 'CLOSED',
        durationMinutes: duration,
        openedAt: row.opened_at || new Date().toISOString(),
        closedAt: row.closed_at || undefined,
        expiresAt: row.expires_at || new Date(expiryMs).toISOString(),
        expiresAtMs: expiryMs,
        pnl: Number(row.pnl || 0),
        pnlPercent: Number(row.pnl_percent || 0),
        fee: Number(row.fee || 0),
        scheduledOutcome: row.scheduled_outcome || undefined,
        scheduledPercent: row.scheduled_percent ? Number(row.scheduled_percent) : undefined,
      };
    });
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
      isSessionClosed: row.is_session_closed ?? (row.status === 'closed'),
      sessionNumber: row.session_number ? Number(row.session_number) : undefined,
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
      accountHolderName: row.account_holder_name || row.user_name || '',
      bankOrAddress: row.bank_or_address || '',
      sourceWallet: row.source_wallet === 'trading' ? 'trading' : 'funding',
      network: row.network || 'USDT',
      status: (row.status || 'pending') as 'pending' | 'approved' | 'rejected',
      timestamp: row.created_at,
      withdrawalType: (row.withdrawal_type || 'USD') as 'USD' | 'USDT',
      notes: row.notes || '',
      rejectReason: row.reject_reason || row.notes || '',
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

export const updateUserBalanceInSupabase = async (userId: string, trading: number, funding: number) => {
  if (!supabase) return;
  try {
    const payload: Record<string, any> = {
      trading_balance: trading,
      funding_balance: funding,
    };

    let res = await supabase.from('users').update(payload).eq('id', userId);

    // Also update by uid in case client passed uid or table uses uid
    await supabase.from('users').update(payload).eq('uid', userId);

    if (res.error && res.error.message?.includes('trading_balance')) {
      const alt = { balance: trading, funding_balance: funding };
      await supabase.from('users').update(alt).eq('id', userId);
      await supabase.from('users').update(alt).eq('uid', userId);
    }

    if (res.error && (res.error.message?.includes('does not exist') || res.error.code === '42P01')) {
      await supabase.from('profiles').update(payload).eq('id', userId);
    }
  } catch (err) {
    console.warn('Supabase updateUserBalance notice:', err);
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
      scheduled_outcome: trade.scheduledOutcome || null,
      scheduled_percent: trade.scheduledPercent || null,
    }, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase syncTradeToSupabase] failed to save trade:', error.message, trade.id);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase syncTradeToSupabase] exception:', err, trade.id);
    return { success: false, error: err?.message || 'Unable to save trade to Supabase' };
  }
};

export const syncTicketToSupabase = async (ticket: SupportTicket): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase is not configured' };
  try {
    const payload = {
      id: ticket.id,
      user_id: ticket.userId,
      user_name: ticket.userName,
      user_email: ticket.userEmail || '',
      status: ticket.status,
      is_session_closed: ticket.isSessionClosed ?? (ticket.status === 'closed'),
      session_number: ticket.sessionNumber || null,
      unread_admin_count: ticket.unreadAdminCount || 0,
      unread_user_count: ticket.unreadUserCount || 0,
      last_message: ticket.lastMessage || '',
      last_message_time: ticket.lastMessageTime || new Date().toISOString(),
      messages: ticket.messages || [],
    };

    // support_tickets is the canonical writable table. support_messages is a
    // compatibility VIEW and must never be used as an upsert destination.
    const { error } = await supabase.from('support_tickets').upsert(payload, { onConflict: 'id' });
    if (!error) return { success: true };

    console.error('[Support sync] Full ticket upsert failed:', error.message, ticket.id);

    // Compatibility for older support_tickets schemas without newer metadata columns.
    const minimal = {
      id: ticket.id,
      user_id: ticket.userId,
      user_name: ticket.userName,
      status: ticket.status,
      last_message: ticket.lastMessage || '',
      messages: ticket.messages || [],
    };
    const retry = await supabase.from('support_tickets').upsert(minimal, { onConflict: 'id' });
    if (retry.error) {
      console.error('[Support sync] Compatibility upsert failed:', retry.error.message, ticket.id);
      return { success: false, error: retry.error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[Support sync] Unexpected exception:', err);
    return { success: false, error: err?.message || 'Unable to save support message' };
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
  if (!supabase) return { success: false, error: 'Not configured' };
  try {
    const payload = {
      id: withdrawal.id,
      user_id: withdrawal.userId,
      user_name: withdrawal.userName,
      account_holder_name: withdrawal.accountHolderName || withdrawal.userName,
      amount: withdrawal.amount,
      withdrawal_type: withdrawal.withdrawalType,
      source_wallet: withdrawal.sourceWallet || 'funding',
      bank_or_address: withdrawal.bankOrAddress,
      network: withdrawal.network,
      status: withdrawal.status,
      notes: withdrawal.notes || '',
      created_at: withdrawal.timestamp,
    };
    let { error } = await supabase.from('withdrawal_requests').upsert(payload, { onConflict: 'id' });
    if (error && (error.message?.includes('does not exist') || error.code === '42P01')) {
      const fb = await supabase.from('withdrawals').upsert(payload, { onConflict: 'id' });
      if (fb.error) return { success: false, error: fb.error.message };
      return { success: true };
    }
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
};

export const updateWithdrawalStatusInSupabase = async (
  withdrawalId: string,
  status: string,
  rejectReason?: string
) => {
  if (!supabase) return;
  try {
    const updatePayload: Record<string, any> = { status };
    if (rejectReason) {
      updatePayload.notes = rejectReason;
      updatePayload.reject_reason = rejectReason;
    }
    let { error } = await supabase.from('withdrawal_requests').update(updatePayload).eq('id', withdrawalId);
    if (error && (error.message?.includes('does not exist') || error.code === '42P01')) {
      await supabase.from('withdrawals').update(updatePayload).eq('id', withdrawalId);
    }
  } catch (err) {
    console.warn('Supabase updateWithdrawalStatus notice:', err);
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
