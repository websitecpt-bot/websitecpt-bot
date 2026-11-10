import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Trade,
  TradeType,
  SupportTicket,
  SupportMessage,
  TicketStatus,
  BalanceAdjustment,
  BalanceAdjustmentType,
  DepositRequest,
  WithdrawalRequest,
  MarketCoin,
  AuditLog,
  SystemSettings,
  Language,
  ClientTradingAgreement,
} from '../types';
import {
  initialUsers,
  initialCoins,
  initialTrades,
  initialSupportTickets,
  initialBalanceAdjustments,
  initialDepositRequests,
  initialWithdrawalRequests,
  initialAuditLogs,
  initialSystemSettings,
  OFFICIAL_REFERRAL_CODES,
} from '../data/initialData';
import {
  isSupabaseConfigured,
  getSupabaseConfigStatus,
  fetchUsersFromSupabase,
  fetchTradesFromSupabase,
  fetchTicketsFromSupabase,
  fetchDepositsFromSupabase,
  fetchWithdrawalsFromSupabase,
  fetchAuditLogsFromSupabase,
  syncUserToSupabase,
  updateUserBalanceInSupabase,
  updateUserStatusInSupabase,
  syncTradeToSupabase,
  syncTicketToSupabase,
  syncDepositToSupabase,
  updateDepositStatusInSupabase,
  syncWithdrawalToSupabase,
  deleteWithdrawalFromSupabase,
  updateWithdrawalStatusInSupabase,
  syncAuditLogToSupabase,
  subscribeToSupabaseRealtime,
  supabaseAuthSignUp,
  supabaseAuthSignIn,
} from '../lib/supabase';

interface AppContextType {
  // Supabase Cloud Sync
  refreshAllFromSupabase: () => Promise<void>;
  isSupabaseSynced: boolean;

  // Current user & Auth
  users: User[];
  currentUser: User;
  switchUser: (userId: string) => void;
  updateUserStatus: (userId: string, status: 'active' | 'suspended') => void;
  isUserLoggedIn: boolean;
  isSuperAdmin: boolean;
  loginUser: (identifier: string, password?: string) => Promise<{ success: boolean; message: string }>;
  registerUser: (params: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    referralCode?: string;
  }) => Promise<{ success: boolean; message: string; user?: User }>;
  logoutUser: () => void;
  updateUserAvatar: (avatarUrl: string) => void;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;

  // Navigation
  activeTab: 'home' | 'market' | 'trade' | 'history' | 'account' | 'admin' | 'login' | 'agreement';
  setActiveTab: (tab: 'home' | 'market' | 'trade' | 'history' | 'account' | 'admin' | 'login' | 'agreement') => void;

  // Client Trading Agreement
  clientAgreement: ClientTradingAgreement | null;
  submitAgreement: (data: Omit<ClientTradingAgreement, 'id' | 'agreementNumber' | 'submittedAt' | 'status'>) => Promise<ClientTradingAgreement>;
  resetAgreement: () => void;

  // Modals
  isSupportOpen: boolean;
  setIsSupportOpen: (open: boolean) => void;
  isDepositModalOpen: boolean;
  setIsDepositModalOpen: (open: boolean) => void;
  isWithdrawModalOpen: boolean;
  setIsWithdrawModalOpen: (open: boolean) => void;
  isTransferModalOpen: boolean;
  setIsTransferModalOpen: (open: boolean) => void;
  transferFunds: (params: {
    fromWallet: 'funding' | 'trading';
    toWallet: 'funding' | 'trading';
    amount: number;
  }) => Promise<{ success: boolean; message: string }>;
  selectedTradeDetails: Trade | null;
  setSelectedTradeDetails: (trade: Trade | null) => void;

  // Market & Trading
  coins: MarketCoin[];
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  activeCoin: MarketCoin;
  updateCoinSettings: (symbol: string, updates: Partial<MarketCoin>) => void;
  setCoinPrice: (symbol: string, newPrice: number) => void;
  applyMarketShock: (symbol: string, percentage: number) => void;
  addCustomCoin: (newCoin: MarketCoin) => void;
  marketDataMode: 'live_stream' | 'manual_benchmark';
  setMarketDataMode: (mode: 'live_stream' | 'manual_benchmark') => void;

  trades: Trade[];
  openTrade: (params: {
    symbol: string;
    type: TradeType;
    leverage: number;
    margin: number;
    durationMinutes: number;
  }) => { success: boolean; message: string };
  closeTrade: (tradeId: string) => void;

  // Support system & Real-time Presence
  supportTickets: SupportTicket[];
  activeSupportUsers: { userId: string; userName: string; uid: string; enteredAt: string }[];
  setUserViewingSupport: (userId: string, isViewing: boolean) => void;
  sendUserMessage: (
    text: string,
    attachment?: { url: string; name: string; type: 'image' | 'file' }
  ) => void;
  sendAdminReply: (
    ticketId: string,
    text: string,
    attachment?: { url: string; name: string; type: 'image' | 'file' }
  ) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  closeSupportSession: (ticketId: string) => void;
  reopenSupportSession: (ticketId: string) => void;
  startNewSupportChat: (userId?: string) => void;
  deleteSupportTicket: (ticketId: string) => void;
  markUserChatAsRead: () => void;

  // Language & Localization
  language: Language;
  setLanguage: (lang: Language) => void;

  // Balance & Transactions
  balanceAdjustments: BalanceAdjustment[];
  adjustUserBalance: (params: {
    userId: string;
    amount: number;
    type: BalanceAdjustmentType;
    reason: string;
    wallet?: 'trading' | 'funding';
  }) => void;

  depositRequests: DepositRequest[];
  submitDepositRequest: (params: {
    amount: number;
    txid: string;
    paymentMethod: string;
    network?: string;
    note?: string;
  }) => void;
  approveDeposit: (depositId: string) => void;
  rejectDeposit: (depositId: string, note?: string) => void;

  withdrawalRequests: WithdrawalRequest[];
  submitWithdrawalRequest: (params: {
    amount: number;
    accountHolderName: string;
    bankOrAddress: string;
    network: string;
    withdrawalType?: 'USD' | 'USDT';
    wallet?: 'funding' | 'trading';
    notes?: string;
  }) => Promise<{ success: boolean; message: string }>;
  approveWithdrawal: (withdrawalId: string) => Promise<void>;
  rejectWithdrawal: (withdrawalId: string, reason: string) => Promise<boolean>;

  // Admin & System
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  adminName: string;
  auditLogs: AuditLog[];
  systemSettings: SystemSettings;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence loaders
  const loadState = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(`cpt_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  const saveState = <T,>(key: string, value: T): void => {
    try {
      if (value === null || value === undefined) {
        localStorage.removeItem(`cpt_${key}`);
      } else {
        localStorage.setItem(`cpt_${key}`, JSON.stringify(value));
      }
    } catch {
      // Ignore quota errors
    }
  };

  const [users, setUsers] = useState<User[]>(() => loadState('users', initialUsers));
  const [currentUserId, setCurrentUserId] = useState<string>(() => loadState('currentUserId', 'user-827592'));
  const [coins, setCoins] = useState<MarketCoin[]>(() => loadState('coins', initialCoins));
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [trades, setTrades] = useState<Trade[]>(() => loadState('trades', initialTrades));
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => loadState('tickets', initialSupportTickets));
  const [balanceAdjustments, setBalanceAdjustments] = useState<BalanceAdjustment[]>(() => loadState('adjustments', initialBalanceAdjustments));
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>(() => loadState('deposits', initialDepositRequests));
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => loadState('withdrawals', initialWithdrawalRequests));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadState('audit', initialAuditLogs));
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => loadState('settings', initialSystemSettings));

  // Navigation & UI state with URL /admin, /login, /register, /agreement router detection
  const [activeTab, setActiveTab] = useState<'home' | 'market' | 'trade' | 'history' | 'account' | 'admin' | 'login' | 'agreement'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (
        path.startsWith('/admin') ||
        hash === '#admin' ||
        params.get('tab') === 'admin' ||
        params.get('admin') === 'true'
      ) {
        return 'admin';
      }
      if (path.includes('/login') || path.includes('/register')) {
        return 'login';
      }
      if (path.includes('/agreement')) {
        return 'agreement';
      }
    }
    // Default to 'login' page for unauthenticated visitors as requested
    const savedLogin = loadState('isUserLoggedIn', false);
    return savedLogin ? 'home' : 'login';
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => loadState('isAdmin', false));
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(() => loadState('isUserLoggedIn', false));
  const adminName = 'Chief Operator (UK)';

  // Client Trading Agreement state & persistence
  const [clientAgreement, setClientAgreement] = useState<ClientTradingAgreement | null>(() => {
    return loadState('cpt_agreement_' + currentUserId, null);
  });

  useEffect(() => {
    setClientAgreement(loadState('cpt_agreement_' + currentUserId, null));
  }, [currentUserId]);

  const submitAgreement = async (
    data: Omit<ClientTradingAgreement, 'id' | 'agreementNumber' | 'submittedAt' | 'status'>
  ): Promise<ClientTradingAgreement> => {
    const newAgreement: ClientTradingAgreement = {
      ...data,
      id: 'agr-' + Date.now(),
      agreementNumber: `CPT-AGR-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'active',
      submittedAt: new Date().toISOString(),
    };

    setClientAgreement(newAgreement);
    saveState('cpt_agreement_' + currentUserId, newAgreement);

    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      adminName: 'System / Compliance Desk',
      adminId: 'compliance-system',
      action: 'CLIENT_AGREEMENT_EXECUTED',
      target: `${currentUser.name} (${currentUser.uid})`,
      details: `Executed ${newAgreement.durationDays}-Day Trading Agreement #${newAgreement.agreementNumber} for $${newAgreement.tradeAmount.toLocaleString()} USD (${newAgreement.tradingPurpose}). NID/Passport verified with digital manual signature.`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    return newAgreement;
  };

  const resetAgreement = () => {
    setClientAgreement(null);
    saveState('cpt_agreement_' + currentUserId, null);
  };

  // Automatically listen to /admin, #admin, /login, /agreement and ?tab=admin URL navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleUrlRoutes = () => {
        const path = window.location.pathname.toLowerCase();
        const hash = window.location.hash.toLowerCase();
        const params = new URLSearchParams(window.location.search);
        if (
          path.startsWith('/admin') ||
          hash === '#admin' ||
          params.get('tab') === 'admin' ||
          params.get('admin') === 'true'
        ) {
          // Open Admin tab and let AdminPanel handle secure Admin authentication
          setActiveTab('admin');
        } else if (path.includes('/login') || path.includes('/register')) {
          setActiveTab('login');
        } else if (path.includes('/agreement')) {
          setActiveTab('agreement');
        } else if (path === '/' && !isUserLoggedIn) {
          setActiveTab('login');
        }
      };
      handleUrlRoutes();
      window.addEventListener('hashchange', handleUrlRoutes);
      window.addEventListener('popstate', handleUrlRoutes);
      return () => {
        window.removeEventListener('hashchange', handleUrlRoutes);
        window.removeEventListener('popstate', handleUrlRoutes);
      };
    }
  }, [isUserLoggedIn]);

  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [activeSupportUsers, setActiveSupportUsers] = useState<{ userId: string; userName: string; uid: string; enteredAt: string }[]>(() =>
    loadState('activeSupportUsers', [
      { userId: 'user-518294', userName: 'Alex Trader', uid: '518294', enteredAt: 'Live Now' }
    ])
  );
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTradeDetails, setSelectedTradeDetails] = useState<Trade | null>(null);

  const safeStorageSet = (key: string, value: any) => {
    try {
      localStorage.setItem(`cpt_${key}`, JSON.stringify(value));
    } catch (err) {
      console.warn(`[SafeStorage] Quota exceeded or error saving cpt_${key}:`, err);
    }
  };

  useEffect(() => {
    safeStorageSet('activeSupportUsers', activeSupportUsers);
  }, [activeSupportUsers]);

  // Sync to localStorage safely
  useEffect(() => {
    safeStorageSet('users', users);
  }, [users]);

  useEffect(() => {
    safeStorageSet('currentUserId', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    safeStorageSet('coins', coins);
  }, [coins]);

  useEffect(() => {
    safeStorageSet('trades', trades);
  }, [trades]);

  useEffect(() => {
    safeStorageSet('tickets', supportTickets);
  }, [supportTickets]);

  useEffect(() => {
    safeStorageSet('adjustments', balanceAdjustments);
  }, [balanceAdjustments]);

  useEffect(() => {
    safeStorageSet('deposits', depositRequests);
  }, [depositRequests]);

  useEffect(() => {
    safeStorageSet('withdrawals', withdrawalRequests);
  }, [withdrawalRequests]);

  useEffect(() => {
    safeStorageSet('audit', auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    safeStorageSet('settings', systemSettings);
  }, [systemSettings]);

  useEffect(() => {
    safeStorageSet('isAdmin', isAdmin);
  }, [isAdmin]);

  useEffect(() => {
    safeStorageSet('isUserLoggedIn', isUserLoggedIn);
  }, [isUserLoggedIn]);

  const [language, setLanguage] = useState<Language>(() => loadState('language', 'en'));

  useEffect(() => {
    safeStorageSet('language', language);
  }, [language]);

  const [marketDataMode, setMarketDataMode] = useState<'live_stream' | 'manual_benchmark'>(() =>
    loadState('marketDataMode', 'live_stream')
  );

  useEffect(() => {
    safeStorageSet('marketDataMode', marketDataMode);
  }, [marketDataMode]);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const isSuperAdmin =
    currentUser.role === 'superadmin' ||
    currentUser.email === 'ripuworkshop@gmail.com' ||
    currentUser.uid === '100001';
  const activeCoin = coins.find((c) => c.symbol === selectedSymbol) || coins[0];

  const [isSupabaseSynced, setIsSupabaseSynced] = useState<boolean>(() => isSupabaseConfigured());

  // Non-destructive WhatsApp-style ticket merge: ensures zero message drops & keeps latest order
  const mergeIncomingTickets = (prev: SupportTicket[], incoming: SupportTicket[]): SupportTicket[] => {
    const localMap = new Map(prev.map((t) => [t.id, t]));
    const userMap = new Map<string, SupportTicket>();
    prev.forEach((t) => userMap.set(t.userId, t));

    const merged = incoming.map((cloudTicket) => {
      const local = localMap.get(cloudTicket.id) || userMap.get(cloudTicket.userId);
      if (!local) return cloudTicket;

      const msgMap = new Map<string, SupportMessage>();
      (cloudTicket.messages || []).forEach((m) => msgMap.set(m.id, m));
      (local.messages || []).forEach((m) => {
        if (!msgMap.has(m.id)) {
          msgMap.set(m.id, m);
        }
      });

      const allMsgs = Array.from(msgMap.values()).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const lastMsg = allMsgs[allMsgs.length - 1];

      return {
        ...cloudTicket,
        messages: allMsgs,
        lastMessage: lastMsg ? (lastMsg.text || (lastMsg.attachmentUrl ? '📎 Attachment' : 'Message')) : cloudTicket.lastMessage,
        lastMessageTime: lastMsg ? lastMsg.timestamp : cloudTicket.lastMessageTime,
        unreadAdminCount: Math.max(cloudTicket.unreadAdminCount || 0, local.unreadAdminCount || 0),
        unreadUserCount: Math.max(cloudTicket.unreadUserCount || 0, local.unreadUserCount || 0),
      };
    });

    // Keep locally created tickets that are pending cloud upsert
    prev.forEach((loc) => {
      if (!merged.some((m) => m.id === loc.id || m.userId === loc.userId)) {
        merged.push(loc);
      }
    });

    // WhatsApp-Style Chronological Order: whichever user sends a message or says "Hi", conversation jumps to top
    return merged.sort(
      (a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
    );
  };

  // Central Supabase Cloud Sync & Realtime Listener
  const hydrateFromSupabase = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const [cloudUsers, cloudTrades, cloudTickets, cloudDeposits, cloudWithdrawals, cloudAudit] = await Promise.all([
        fetchUsersFromSupabase(),
        fetchTradesFromSupabase(),
        fetchTicketsFromSupabase(),
        fetchDepositsFromSupabase(),
        fetchWithdrawalsFromSupabase(),
        fetchAuditLogsFromSupabase(),
      ]);

      if (cloudUsers && cloudUsers.length > 0) {
        setUsers((prev) => {
          const cloudMap = new Map(cloudUsers.map((u) => [u.id, u]));
          // Keep existing if not in cloud, but cloud takes precedence for balances/status
          const merged = [...cloudUsers];
          prev.forEach((u) => {
            if (!cloudMap.has(u.id)) {
              merged.push(u);
            }
          });
          return merged;
        });
      }
      if (cloudTrades && cloudTrades.length > 0) {
        setTrades(cloudTrades);
      }
      if (cloudTickets && cloudTickets.length > 0) {
        setSupportTickets((prev) => mergeIncomingTickets(prev, cloudTickets));
      }
      if (cloudDeposits && cloudDeposits.length > 0) {
        setDepositRequests(cloudDeposits);
      }
      if (cloudWithdrawals && cloudWithdrawals.length > 0) {
        setWithdrawalRequests(cloudWithdrawals);
      }
      if (cloudAudit && cloudAudit.length > 0) {
        setAuditLogs(cloudAudit);
      }
      setIsSupabaseSynced(true);
    } catch (err) {
      console.warn('[Supabase Cloud Hydration] notice:', err);
    }
  };

  const refreshAllFromSupabase = async () => {
    await hydrateFromSupabase();
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let isMounted = true;
    hydrateFromSupabase();

    // Subscribe to Postgres Realtime changes
    const channel = subscribeToSupabaseRealtime({
      onUserUpdate: async () => {
        const u = await fetchUsersFromSupabase();
        if (u && isMounted) setUsers(u);
      },
      onTradeUpdate: async () => {
        const t = await fetchTradesFromSupabase();
        if (t && isMounted) setTrades(t);
      },
      onTicketUpdate: async () => {
        const k = await fetchTicketsFromSupabase();
        if (k && isMounted) setSupportTickets((prev) => mergeIncomingTickets(prev, k));
      },
      onDepositUpdate: async () => {
        const d = await fetchDepositsFromSupabase();
        if (d && isMounted) setDepositRequests(d);
      },
      onWithdrawalUpdate: async () => {
        const w = await fetchWithdrawalsFromSupabase();
        if (w && isMounted) setWithdrawalRequests(w);
      },
    });

    // Auto-polling interval every 4 seconds to guarantee live updates without manual page refresh
    const pollTimer = setInterval(() => {
      if (isMounted) {
        hydrateFromSupabase();
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  // Live Binance Price Feed (Zero-lag accurate real-world rates for major crypto coins)
  useEffect(() => {
    let isMounted = true;

    const fetchBinancePrices = async () => {
      if (marketDataMode === 'manual_benchmark') return;

      try {
        const binanceSymbols = [
          'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
          'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'TRXUSDT'
        ];
        const encoded = encodeURIComponent(JSON.stringify(binanceSymbols));
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encoded}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data) || !isMounted) return;

        const binanceMap = new Map<string, { price: number; change24h: number; high: number; low: number }>();
        data.forEach((item: any) => {
          const sym = item.symbol.replace('USDT', '');
          binanceMap.set(sym, {
            price: parseFloat(item.lastPrice),
            change24h: parseFloat(item.priceChangePercent),
            high: parseFloat(item.highPrice),
            low: parseFloat(item.lowPrice),
          });
        });

        setCoins((prevCoins) =>
          prevCoins.map((coin) => {
            if (coin.status === 'paused') return coin;
            const bData = binanceMap.get(coin.symbol);
            if (bData && !isNaN(bData.price) && bData.price > 0) {
              const effective = Number((bData.price + coin.priceOffset).toFixed(bData.price > 100 ? 2 : 4));
              return {
                ...coin,
                basePrice: bData.price,
                price: effective,
                change24h: Number(bData.change24h.toFixed(2)),
                high24h: bData.high,
                low24h: bData.low,
              };
            }
            return coin;
          })
        );
      } catch {
        // Fallback silently to local simulation
      }
    };

    fetchBinancePrices();
    const binanceInterval = setInterval(fetchBinancePrices, 3000);

    return () => {
      isMounted = false;
      clearInterval(binanceInterval);
    };
  }, [marketDataMode]);

  // Secondary Micro-fluctuation for traditional assets (Forex/Commodities)
  useEffect(() => {
    const interval = setInterval(() => {
      if (marketDataMode === 'manual_benchmark') return;

      const nonCryptoSymbols = ['XAUUSD', 'EURUSD', 'NASUSD', 'DSHUSD', 'GBPUSD', 'U30USD', 'XAGUSD'];
      setCoins((prevCoins) =>
        prevCoins.map((coin) => {
          if (coin.status === 'paused' || !nonCryptoSymbols.includes(coin.symbol)) return coin;
          const deltaPct = (Math.random() - 0.49) * 0.0015;
          const newBase = Number((coin.basePrice * (1 + deltaPct)).toFixed(coin.basePrice > 100 ? 2 : 4));
          const effective = Number((newBase + coin.priceOffset).toFixed(newBase > 100 ? 2 : 4));
          return {
            ...coin,
            basePrice: newBase,
            price: effective,
            high24h: Math.max(coin.high24h, effective),
            low24h: Math.min(coin.low24h, effective),
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [marketDataMode]);

  // Dedicated fast 500ms timer loop: Auto-close trades precisely on duration expiry & settle PnL
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const nowMs = now.getTime();

      setTrades((prevTrades) => {
        const hasOpen = prevTrades.some((t) => t.status === 'OPEN');
        if (!hasOpen) return prevTrades;

        let hasExpired = false;
        const payouts: { userId: string; returnAmount: number }[] = [];

        const updated = prevTrades.map((t) => {
          if (t.status !== 'OPEN') return t;

          const expiryMs =
            t.expiresAtMs ||
            (t.expiresAt.includes('T')
              ? new Date(t.expiresAt).getTime()
              : new Date(t.expiresAt.replace(' ', 'T') + 'Z').getTime() ||
                new Date(t.expiresAt).getTime());

          const isExpired = nowMs >= expiryMs;

          const targetCoin = coins.find((c) => c.symbol === t.symbol);
          const curPrice = targetCoin ? targetCoin.price : t.currentPrice;

          let pnl = 0;
          if (t.type === 'BUY') {
            pnl = ((curPrice - t.entryPrice) / t.entryPrice) * t.positionSize;
          } else {
            pnl = ((t.entryPrice - curPrice) / t.entryPrice) * t.positionSize;
          }
          const pnlPercent = (pnl / t.margin) * 100;

          if (isExpired) {
            hasExpired = true;
            const finalReturn = Math.max(0, t.margin + pnl);
            payouts.push({ userId: t.userId, returnAmount: finalReturn });

            const closedTradeItem: Trade = {
              ...t,
              currentPrice: curPrice,
              exitPrice: curPrice,
              pnl: Number(pnl.toFixed(2)),
              pnlPercent: Number(pnlPercent.toFixed(2)),
              status: 'CLOSED' as const,
              closedAt: now.toISOString(),
            };
            if (isSupabaseConfigured()) {
              syncTradeToSupabase(closedTradeItem).catch((e) => console.warn('Trade auto-close sync notice:', e));
            }
            return closedTradeItem;
          }

          return {
            ...t,
            currentPrice: curPrice,
            pnl: Number(pnl.toFixed(2)),
            pnlPercent: Number(pnlPercent.toFixed(2)),
          };
        });

        if (hasExpired && payouts.length > 0) {
          setTimeout(() => {
            setUsers((prevUsers) =>
              prevUsers.map((u) => {
                const userPayouts = payouts.filter((p) => p.userId === u.id);
                if (userPayouts.length > 0) {
                  const totalReturn = userPayouts.reduce((sum, p) => sum + p.returnAmount, 0);
                  return {
                    ...u,
                    tradingBalance: Number((u.tradingBalance + totalReturn).toFixed(2)),
                  };
                }
                return u;
              })
            );
          }, 0);
        }

        return updated;
      });
    }, 500);

    return () => clearInterval(timer);
  }, [coins]);

  const switchUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUserId(userId);
      setIsUserLoggedIn(true);
    }
  };

  const registerUser = async ({
    name,
    email,
    phone,
    password,
    referralCode,
  }: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    referralCode?: string;
  }) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanRef = (referralCode || '').trim();

    if (!cleanName) {
      return { success: false, message: 'Please enter your username.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (password && password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }

    // Referral code verification: strictly mandatory per system policy
    if (!cleanRef) {
      return {
        success: false,
        message: 'Referral code is mandatory. You cannot create an account without a valid invite code.',
      };
    }

    let referrer = { uid: '100001', name: 'CPT Markets Global' };
    const officialMatch = OFFICIAL_REFERRAL_CODES.find((o) => o.code === cleanRef);
    const userMatch = users.find((u) => u.uid === cleanRef);
    if (officialMatch) {
      referrer = { uid: officialMatch.code, name: officialMatch.inviterName };
    } else if (userMatch) {
      referrer = { uid: userMatch.uid, name: userMatch.name };
    } else {
      return {
        success: false,
        message: `Invalid Referral Code "${cleanRef}". Please provide a valid registered inviter UID or official code (e.g. 100001).`,
      };
    }

    const exists = users.some(
      (u) => u.email.toLowerCase() === cleanEmail || u.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (exists) {
      return { success: false, message: 'This username or email is already registered. Please sign in.' };
    }

    // Generate random 6-digit UID
    let uid = Math.floor(100000 + Math.random() * 900000).toString();
    while (users.some((u) => u.uid === uid)) {
      uid = Math.floor(100000 + Math.random() * 900000).toString();
    }

    let authenticatedUserId = `user-${uid}`;

    // If Supabase Cloud is configured, sync with Supabase Auth
    if (isSupabaseConfigured()) {
      try {
        const { data: authData, error: authError } = await supabaseAuthSignUp({
          email: cleanEmail,
          password: password || '123456',
          name: cleanName,
          phone: phone || '',
          uid,
        });

        if (authError) {
          if (authError.message?.toLowerCase().includes('already registered')) {
            return {
              success: false,
              message: 'This email is already registered. Please sign in with your password.',
            };
          }
          console.warn('[Supabase Auth notice]', authError.message);
        } else if (authData?.user?.id) {
          authenticatedUserId = authData.user.id;
        }
      } catch (authErr) {
        console.warn('[Supabase Auth SignUp notice]', authErr);
      }
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newUser: User = {
      id: authenticatedUserId,
      uid,
      name: cleanName,
      email: cleanEmail,
      phone: phone || '+44 7900 000000',
      tradingBalance: 0.00,
      fundingBalance: 0.00,
      status: 'active',
      isOnline: true,
      referredByUid: referrer.uid,
      role: 'user',
      password: password || '123456',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      createdAt: nowStr,
      lastLogin: nowStr,
    };

    // If Supabase is active, sync user profile to cloud table
    if (isSupabaseConfigured()) {
      try {
        await syncUserToSupabase(newUser);
      } catch (err) {
        console.warn('[Supabase Profile Sync notice]', err);
      }
    }

    // Update in-memory state
    setUsers((prev) => [newUser, ...prev.filter((u) => u.id !== newUser.id)]);

    // Automatically create a support welcome ticket for this new trader
    const welcomeTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      userId: authenticatedUserId,
      userName: newUser.name,
      userEmail: newUser.email,
      status: 'answered',
      lastMessage: 'Welcome to CPT Markets UK! Our 24/7 Official Support Desk is ready to assist you.',
      lastMessageTime: nowStr,
      unreadAdminCount: 0,
      unreadUserCount: 1,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'admin',
          senderName: 'Admin Team (UK)',
          text: `Welcome to CPT Markets UK, ${newUser.name}!\nYour account UID is ${uid} (Invited by ${referrer.name} — UID: ${referrer.uid}).\nIf you need any assistance with margin trading, verified deposit addresses, or withdrawals, please message us directly here.`,
          timestamp: nowStr,
          read: false,
        },
      ],
    };
    setSupportTickets((prev) => [welcomeTicket, ...prev]);
    if (isSupabaseConfigured()) {
      syncTicketToSupabase(welcomeTicket);
    }

    logAuditAction(
      'NEW_USER_REGISTERED_WITH_REFERRAL',
      `${newUser.name} (${uid})`,
      `New trader account created via Referral UID: ${referrer.uid} (${referrer.name})`
    );

    return {
      success: true,
      message: `Account created successfully! Welcome UID: ${uid} (Invited by ${referrer.name})`,
      user: newUser,
    };
  };

  const loginUser = async (identifier: string, password?: string) => {
    const clean = identifier.trim().toLowerCase();

    // Refresh from Supabase if configured so latest registered users from all devices are loaded
    if (isSupabaseConfigured()) {
      try {
        const cloudUsers = await fetchUsersFromSupabase();
        if (cloudUsers && cloudUsers.length > 0) {
          setUsers(cloudUsers);
        }
      } catch (err) {
        console.warn('Fetch users for login error:', err);
      }
    }

    let found = users.find(
      (u) =>
        u.name.toLowerCase() === clean ||
        u.email.toLowerCase() === clean ||
        u.uid === clean
    );

    // If still not found, try one direct cloud fetch
    if (!found && isSupabaseConfigured()) {
      const cloudUsers = await fetchUsersFromSupabase();
      if (cloudUsers) {
        setUsers(cloudUsers);
        found = cloudUsers.find(
          (u) =>
            u.name.toLowerCase() === clean ||
            u.email.toLowerCase() === clean ||
            u.uid === clean
        );
      }
    }

    if (!found) {
      return {
        success: false,
        message: 'Account not found. Please verify your username, email, or UID, or click Create Account.',
      };
    }

    if (found.status === 'suspended') {
      return { success: false, message: 'This account has been suspended by the administrator.' };
    }

    // Verify password:
    if (password) {
      if (isSupabaseConfigured() && found.email) {
        try {
          await supabaseAuthSignIn(found.email, password);
        } catch {
          // fallback to stored password check
        }
      }

      const validPass = found.password || '123456';
      if (password !== validPass) {
        return { success: false, message: 'Incorrect password. Please verify and try again.' };
      }
    }

    setCurrentUserId(found.id);
    setIsUserLoggedIn(true);

    if (found.role === 'admin' || found.role === 'superadmin') {
      setIsAdmin(true);
    }

    setActiveTab('home');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
    return { success: true, message: `Welcome back, ${found.name}!` };
  };

  const logoutUser = () => {
    setIsUserLoggedIn(false);
    setActiveTab('login');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/login');
    }
  };

  const updateUserAvatar = (avatarUrl: string) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === currentUserId ? { ...u, avatar: avatarUrl } : u));
      const target = updated.find((u) => u.id === currentUserId);
      if (target) {
        syncUserToSupabase(target);
      }
      return updated;
    });
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    if (!newPass || newPass.trim().length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }

    const actualCurrentPass = currentUser.password || '123456';
    if (currentPass.trim() !== actualCurrentPass) {
      return { success: false, message: 'Current password is incorrect. Please re-enter your current password.' };
    }

    const updatedUser: User = {
      ...currentUser,
      password: newPass.trim(),
    };

    setUsers((prev) => {
      const updatedList = prev.map((u) => (u.id === currentUser.id ? updatedUser : u));
      saveState('users', updatedList);
      return updatedList;
    });

    try {
      await syncUserToSupabase(updatedUser);
      if (isSupabaseConfigured() && currentUser.email) {
        const { getSupabaseClient } = await import('../lib/supabase');
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.auth.updateUser({ password: newPass.trim() });
        }
      }
    } catch (err) {
      console.warn('Supabase password sync notice:', err);
    }

    logAuditAction(
      'USER_PASSWORD_CHANGED',
      `${currentUser.name} (${currentUser.uid})`,
      'Account login password updated successfully by user.'
    );

    return {
      success: true,
      message: 'Password updated successfully! Please use your new password for all future logins.',
    };
  };

  const updateUserStatus = (userId: string, status: 'active' | 'suspended') => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status } : u))
    );
    updateUserStatusInSupabase(userId, status);
    const targetUser = users.find((u) => u.id === userId);
    logAuditAction(
      status === 'suspended' ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
      `${targetUser?.name || 'User'} (${targetUser?.uid})`,
      `Account marked as ${status} by Admin.`
    );
  };

  const updateCoinSettings = (symbol: string, updates: Partial<MarketCoin>) => {
    setCoins((prev) =>
      prev.map((coin) => {
        if (coin.symbol === symbol) {
          const updated = { ...coin, ...updates };
          if (updates.priceOffset !== undefined || updates.price !== undefined) {
            updated.price = Number((updated.basePrice + (updated.priceOffset || 0)).toFixed(updated.basePrice > 100 ? 2 : 4));
          }
          return updated;
        }
        return coin;
      })
    );
    logAuditAction(
      'MARKET_CONFIG_UPDATE',
      symbol,
      `Market coin parameters calibrated (Offset: ${updates.priceOffset ?? 0}, Spread: ${updates.spread ?? 'N/A'})`
    );
  };

  const setCoinPrice = (symbol: string, newPrice: number) => {
    if (newPrice <= 0) return;
    setCoins((prev) =>
      prev.map((c) => {
        if (c.symbol === symbol) {
          const formatted = Number(newPrice.toFixed(newPrice > 100 ? 2 : 4));
          const change = ((formatted - c.basePrice) / c.basePrice) * 100;
          return {
            ...c,
            price: formatted,
            basePrice: formatted,
            priceOffset: 0,
            change24h: Number(change.toFixed(2)),
            high24h: Math.max(c.high24h, formatted),
            low24h: Math.min(c.low24h, formatted),
          };
        }
        return c;
      })
    );
    logAuditAction(
      'BENCHMARK_PRICE_CALIBRATION',
      symbol,
      `Market benchmark price calibrated to $${newPrice.toLocaleString()}`
    );
  };

  const applyMarketShock = (symbol: string, percentage: number) => {
    setCoins((prev) =>
      prev.map((c) => {
        if (c.symbol === symbol) {
          const multiplier = 1 + percentage / 100;
          const newPrice = Number((c.price * multiplier).toFixed(c.price > 100 ? 2 : 4));
          const newChange = Number((c.change24h + percentage).toFixed(2));
          return {
            ...c,
            price: newPrice,
            basePrice: newPrice,
            priceOffset: 0,
            change24h: newChange,
            high24h: Math.max(c.high24h, newPrice),
            low24h: Math.min(c.low24h, newPrice),
          };
        }
        return c;
      })
    );
    logAuditAction(
      'MARKET_STRESS_TEST',
      symbol,
      `Simulated market shock applied: ${percentage >= 0 ? '+' : ''}${percentage}%`
    );
  };

  const addCustomCoin = (newCoin: MarketCoin) => {
    setCoins((prev) => [...prev, newCoin]);
    logAuditAction(
      'CUSTOM_COIN_ADDED',
      newCoin.symbol,
      `New custom sandbox coin listed: ${newCoin.name} at initial price $${newCoin.price}`
    );
  };

  const openTrade = ({
    symbol,
    type,
    leverage,
    margin,
    durationMinutes,
  }: {
    symbol: string;
    type: TradeType;
    leverage: number;
    margin: number;
    durationMinutes: number;
  }) => {
    if (currentUser.status === 'suspended') {
      return { success: false, message: 'Your account is suspended. Please contact Support.' };
    }

    const positionSize = margin * leverage;
    // User requirement: display shows Fee (0.1%), but actual deduction formula is 0.0005% ($5 per $1,000,000 position)
    const fee = Number((positionSize * 0.000005).toFixed(2));
    const totalDeduction = margin + fee;

    if (currentUser.tradingBalance < totalDeduction) {
      return { success: false, message: 'Insufficient trading balance.' };
    }

    const targetCoin = coins.find((c) => c.symbol === symbol);
    if (!targetCoin) {
      return { success: false, message: 'Invalid symbol.' };
    }

    // Deduct from user
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? { ...u, tradingBalance: Number((u.tradingBalance - totalDeduction).toFixed(2)) }
          : u
      )
    );

    const now = new Date();
    const nowMs = now.getTime();
    const expiryMs = nowMs + durationMinutes * 60 * 1000;
    const expiry = new Date(expiryMs);

    // Use current coin price with spread for execution
    const halfSpread = targetCoin.spread / 2;
    const entryPrice = type === 'BUY' ? targetCoin.price + halfSpread : targetCoin.price - halfSpread;

    const newTrade: Trade = {
      id: `tr-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      symbol,
      type,
      leverage,
      margin,
      positionSize,
      entryPrice: Number(entryPrice.toFixed(targetCoin.price > 100 ? 2 : 4)),
      currentPrice: targetCoin.price,
      status: 'OPEN',
      durationMinutes,
      openedAt: now.toISOString(),
      expiresAt: expiry.toISOString(),
      expiresAtMs: expiryMs,
      pnl: 0,
      pnlPercent: 0,
      fee,
    };

    setTrades((prev) => [newTrade, ...prev]);
    if (isSupabaseConfigured()) {
      syncTradeToSupabase(newTrade).catch((err) => console.warn('Trade sync notice:', err));
      updateUserBalanceInSupabase(
        currentUser.id,
        Number((currentUser.tradingBalance - totalDeduction).toFixed(2)),
        currentUser.fundingBalance
      );
    }
    return { success: true, message: `Trade opened successfully for ${symbol}!` };
  };

  const closeTrade = (tradeId: string) => {
    const trade = trades.find((t) => t.id === tradeId);
    if (!trade || trade.status !== 'OPEN') return;

    const targetCoin = coins.find((c) => c.symbol === trade.symbol);
    const curPrice = targetCoin ? targetCoin.price : trade.currentPrice;

    let pnl = 0;
    if (trade.type === 'BUY') {
      pnl = ((curPrice - trade.entryPrice) / trade.entryPrice) * trade.positionSize;
    } else {
      pnl = ((trade.entryPrice - curPrice) / trade.entryPrice) * trade.positionSize;
    }
    const pnlPercent = (pnl / trade.margin) * 100;
    const finalReturn = Math.max(0, trade.margin + pnl);

    const updatedBal = Number((currentUser.tradingBalance + finalReturn).toFixed(2));

    // Return to user
    setUsers((prev) =>
      prev.map((u) =>
        u.id === trade.userId
          ? { ...u, tradingBalance: updatedBal }
          : u
      )
    );

    const closedTrade: Trade = {
      ...trade,
      status: 'CLOSED',
      exitPrice: curPrice,
      pnl: Number(pnl.toFixed(2)),
      pnlPercent: Number(pnlPercent.toFixed(2)),
      closedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    // Mark trade closed
    setTrades((prev) =>
      prev.map((t) => (t.id === tradeId ? closedTrade : t))
    );

    if (isSupabaseConfigured()) {
      syncTradeToSupabase(closedTrade).catch((err) => console.warn('Trade close sync notice:', err));
      updateUserBalanceInSupabase(trade.userId, updatedBal, currentUser.fundingBalance);
    }
  };

  // Support System
  const sendUserMessage = (
    text: string,
    attachment?: { url: string; name: string; type: 'image' | 'file' }
  ) => {
    const cleanText = text.trim();
    if (!cleanText && !attachment) return;

    const nowStr = new Date().toISOString();
    const displaySummary = cleanText || (attachment
      ? `📎 [${attachment.type === 'image' ? 'Photo' : 'File'}] ${attachment.name}`
      : '');

    const newMsg: SupportMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderName: currentUser.name,
      text: cleanText,
      timestamp: nowStr,
      read: false,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type,
    };

    const activeTicket = supportTickets
      .filter((ticket) => ticket.userId === currentUser.id)
      .sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime())[0];

    const isFirstUserMessage = !activeTicket || activeTicket.isSessionClosed ||
      !activeTicket.messages.some((message) => message.sender === 'user');

    const updatedTicket: SupportTicket = activeTicket && !activeTicket.isSessionClosed
      ? {
          ...activeTicket,
          status: 'pending',
          isSessionClosed: false,
          lastMessage: displaySummary,
          lastMessageTime: nowStr,
          unreadAdminCount: (activeTicket.unreadAdminCount || 0) + 1,
          messages: [...activeTicket.messages, newMsg],
        }
      : {
          id: `ticket-${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          status: 'pending',
          isSessionClosed: false,
          lastMessage: displaySummary,
          lastMessageTime: nowStr,
          unreadAdminCount: 1,
          unreadUserCount: 0,
          messages: [newMsg],
        };

    const nextTickets = activeTicket && !activeTicket.isSessionClosed
      ? supportTickets.map((ticket) => ticket.id === activeTicket.id ? updatedTicket : ticket)
      : [updatedTicket, ...supportTickets];

    setSupportTickets(
      nextTickets.sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime())
    );

    if (isSupabaseConfigured()) {
      syncTicketToSupabase(updatedTicket).then((result) => {
        if (!result.success) console.warn('User support message was not saved to Supabase:', result.error);
      }).catch((error) => console.warn('User support message sync failed:', error));
    }

    // Send one automated acknowledgment for the first message in a support session.
    if (isFirstUserMessage) {
      setTimeout(() => {
        const replyNowStr = new Date().toISOString();
        const botReply: SupportMessage = {
          id: `msg-ack-${Date.now()}`,
          sender: 'admin',
          senderName: 'CPT Support Desk',
          text: 'Thank you for contacting us. Please allow us 1–2 minutes to respond. We appreciate your patience.',
          timestamp: replyNowStr,
          read: false,
        };

        setSupportTickets((prev) => {
          const currentTicket = prev
            .filter((ticket) => ticket.userId === currentUser.id)
            .sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime())[0];
          if (!currentTicket || currentTicket.isSessionClosed) return prev;

          const withBotReply: SupportTicket = {
            ...currentTicket,
            lastMessage: botReply.text,
            lastMessageTime: replyNowStr,
            unreadUserCount: (currentTicket.unreadUserCount || 0) + 1,
            messages: [...currentTicket.messages, botReply],
          };

          if (isSupabaseConfigured()) {
            syncTicketToSupabase(withBotReply).then((result) => {
              if (!result.success) console.warn('Support acknowledgment sync failed:', result.error);
            }).catch((error) => console.warn('Support acknowledgment sync failed:', error));
          }
          return prev.map((ticket) => ticket.id === currentTicket.id ? withBotReply : ticket);
        });
      }, 1200);
    }
  };

  const startNewSupportChat = (userId?: string) => {
    const targetId = userId || currentUser.id;
    const targetUser = users.find((u) => u.id === targetId) || currentUser;
    const nowStr = new Date().toISOString();

    const welcomeMsg: SupportMessage = {
      id: `msg-wel-${Date.now()}`,
      sender: 'admin',
      senderName: 'CPT Support Desk',
      text: `Welcome to a new support session, ${targetUser.name}! How may our 24/7 UK Desk assist you right now?`,
      timestamp: nowStr,
      read: true,
    };

    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      userId: targetUser.id,
      userName: targetUser.name,
      userEmail: targetUser.email,
      status: 'pending',
      isSessionClosed: false,
      lastMessage: welcomeMsg.text,
      lastMessageTime: nowStr,
      unreadAdminCount: 0,
      unreadUserCount: 1,
      messages: [welcomeMsg],
    };

    setSupportTickets((prev) => [newTicket, ...prev]);
    if (isSupabaseConfigured()) {
      syncTicketToSupabase(newTicket).catch((e) => console.warn('New ticket sync notice:', e));
    }

    logAuditAction(
      'NEW_SUPPORT_TICKET_STARTED',
      `${targetUser.name} (${targetUser.uid})`,
      'New support session thread started by user.'
    );
  };

  const closeSupportSession = (ticketId: string) => {
    setSupportTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'closed',
              isSessionClosed: true,
            }
          : t
      )
    );
    const targetTicket = supportTickets.find((t) => t.id === ticketId);
    if (targetTicket && isSupabaseConfigured()) {
      syncTicketToSupabase({ ...targetTicket, status: 'closed', isSessionClosed: true }).catch((e) => console.warn('Close ticket sync notice:', e));
    }
    logAuditAction(
      'SUPPORT_SESSION_CLOSED',
      targetTicket ? `${targetTicket.userName} (${targetTicket.userId})` : ticketId,
      'Support chat session closed by Administrator.'
    );
  };

  const reopenSupportSession = (ticketId: string) => {
    const nowStr = new Date().toISOString();
    setSupportTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'pending',
              isSessionClosed: false,
              lastMessageTime: nowStr,
            }
          : t
      )
    );
  };

  const deleteSupportTicket = (ticketId: string) => {
    const targetTicket = supportTickets.find((t) => t.id === ticketId);
    setSupportTickets((prev) => prev.filter((t) => t.id !== ticketId));
    logAuditAction(
      'SUPPORT_TICKET_DELETED',
      targetTicket ? `${targetTicket.userName} (#${targetTicket.id.slice(-6)})` : ticketId,
      'Support chat session permanently deleted by Administrator.'
    );
  };

  const sendAdminReply = (
    ticketId: string,
    text: string,
    attachment?: { url: string; name: string; type: 'image' | 'file' }
  ) => {
    const cleanText = text.trim();
    if (!cleanText && !attachment) return;

    const targetTicket = supportTickets.find((ticket) =>
      ticket.id === ticketId || ticket.userId === ticketId
    );
    if (!targetTicket) {
      console.warn('Admin reply skipped: support ticket not found.', ticketId);
      return;
    }

    const nowStr = new Date().toISOString();
    const displaySummary = cleanText || (attachment
      ? `📎 [${attachment.type === 'image' ? 'Photo' : 'File'}] ${attachment.name}`
      : '');

    const newMsg: SupportMessage = {
      id: `msg-${Date.now()}`,
      sender: 'admin',
      senderName: adminName,
      text: cleanText,
      timestamp: nowStr,
      read: false,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type,
    };

    const updatedTicket: SupportTicket = {
      ...targetTicket,
      status: 'answered',
      isSessionClosed: false,
      lastMessage: displaySummary,
      lastMessageTime: nowStr,
      unreadAdminCount: 0,
      unreadUserCount: (targetTicket.unreadUserCount || 0) + 1,
      messages: [...targetTicket.messages, newMsg],
    };

    setSupportTickets((prev) =>
      prev.map((ticket) => ticket.id === targetTicket.id ? updatedTicket : ticket)
        .sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime())
    );

    if (isSupabaseConfigured()) {
      syncTicketToSupabase(updatedTicket).then((result) => {
        if (!result.success) console.warn('Admin support reply was not saved to Supabase:', result.error);
      }).catch((error) => console.warn('Admin support reply sync failed:', error));
    }

    logAuditAction(
      'SUPPORT_REPLY',
      `${targetTicket.userName} (${targetTicket.userId})`,
      'Admin sent reply to support query.'
    );
  };

  const updateTicketStatus = (ticketId: string, status: TicketStatus) => {
    setSupportTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status,
              isSessionClosed: status === 'closed',
            }
          : t
      )
    );
  };

  const markUserChatAsRead = () => {
    setSupportTickets((prev) =>
      prev.map((t) =>
        t.userId === currentUser.id ? { ...t, unreadUserCount: 0 } : t
      )
    );
  };

  const setUserViewingSupport = (userId: string, isViewing: boolean) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const timeStr = new Date().toLocaleTimeString();

    setActiveSupportUsers((prev) => {
      if (isViewing) {
        if (prev.some((p) => p.userId === userId)) return prev;
        return [{ userId, userName: targetUser.name, uid: targetUser.uid, enteredAt: timeStr }, ...prev];
      } else {
        return prev.filter((p) => p.userId !== userId);
      }
    });
  };

  // Balance Management
  const adjustUserBalance = ({
    userId,
    amount,
    type,
    reason,
    wallet = 'trading',
  }: {
    userId: string;
    amount: number;
    type: BalanceAdjustmentType;
    reason: string;
    wallet?: 'trading' | 'funding';
  }) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const isFunding = wallet === 'funding';
    const previousBalance = isFunding ? targetUser.fundingBalance : targetUser.tradingBalance;
    const newBalance = Number(Math.max(0, previousBalance + amount).toFixed(2));

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        return isFunding ? { ...u, fundingBalance: newBalance } : { ...u, tradingBalance: newBalance };
      })
    );

    const finalTrading = isFunding ? targetUser.tradingBalance : newBalance;
    const finalFunding = isFunding ? newBalance : targetUser.fundingBalance;
    updateUserBalanceInSupabase(userId, finalTrading, finalFunding);

    const adjustment: BalanceAdjustment = {
      id: `adj-${Date.now()}`,
      userId,
      userName: targetUser.name,
      amount,
      type,
      previousBalance,
      newBalance,
      reason: `${isFunding ? '[Funding Wallet] ' : '[Trading Wallet] '}${reason}`,
      adminId: 'admin-01',
      adminName,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setBalanceAdjustments((prev) => [adjustment, ...prev]);

    logAuditAction(
      'BALANCE_ADJUSTMENT',
      `${targetUser.name} (${targetUser.uid})`,
      `${amount >= 0 ? '+' : ''}$${amount.toLocaleString()} on ${isFunding ? 'Funding' : 'Trading'} Wallet [${type}]: ${reason}`
    );
  };

  // Deposit Management
  const submitDepositRequest = ({
    amount,
    txid,
    paymentMethod,
    network,
    note,
  }: {
    amount: number;
    txid: string;
    paymentMethod: string;
    network?: string;
    note?: string;
  }) => {
    const newReq: DepositRequest = {
      id: `dep-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      amount,
      txid,
      paymentMethod,
      network: network || 'Default',
      status: 'pending',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      note,
    };
    setDepositRequests((prev) => [newReq, ...prev]);
    syncDepositToSupabase(newReq);
  };

  const approveDeposit = (depositId: string) => {
    const dep = depositRequests.find((d) => d.id === depositId);
    if (!dep || dep.status !== 'pending') return;

    setDepositRequests((prev) =>
      prev.map((d) =>
        d.id === depositId
          ? {
              ...d,
              status: 'approved',
              reviewedBy: adminName,
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : d
      )
    );
    updateDepositStatusInSupabase(depositId, 'approved');

    adjustUserBalance({
      userId: dep.userId,
      amount: dep.amount,
      type: 'deposit',
      reason: `Approved deposit request #${dep.id} (TXID: ${dep.txid.slice(0, 12)}...)`,
    });
  };

  const rejectDeposit = (depositId: string, note?: string) => {
    setDepositRequests((prev) =>
      prev.map((d) =>
        d.id === depositId
          ? {
              ...d,
              status: 'rejected',
              note: note || d.note,
              reviewedBy: adminName,
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : d
      )
    );
    updateDepositStatusInSupabase(depositId, 'rejected');
    const dep = depositRequests.find((d) => d.id === depositId);
    logAuditAction(
      'DEPOSIT_REJECTED',
      dep ? `${dep.userName} (#${dep.id})` : depositId,
      `Deposit of $${dep?.amount || 0} rejected: ${note || 'Invalid payment verification.'}`
    );
  };

  // Withdrawal Management
  const submitWithdrawalRequest = async ({
    amount,
    accountHolderName,
    bankOrAddress,
    network,
    withdrawalType = 'USD',
    wallet = 'funding',
    notes,
  }: {
    amount: number;
    accountHolderName: string;
    bankOrAddress: string;
    network: string;
    withdrawalType?: 'USD' | 'USDT';
    wallet?: 'funding' | 'trading';
    notes?: string;
  }): Promise<{ success: boolean; message: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase is not configured. Your withdrawal request was not submitted.' };
    }
    if (currentUser.status === 'suspended') {
      return { success: false, message: 'Account is suspended from withdrawals.' };
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, message: 'Please enter a valid withdrawal amount.' };
    }
    if (amount < systemSettings.minWithdrawal) {
      return { success: false, message: `Minimum withdrawal is $${systemSettings.minWithdrawal}.` };
    }
    if (!accountHolderName.trim() || !bankOrAddress.trim() || !network.trim()) {
      return { success: false, message: 'Please complete all required withdrawal details.' };
    }

    const isFunding = wallet === 'funding';
    const previousFunding = Number(currentUser.fundingBalance || 0);
    const previousTrading = Number(currentUser.tradingBalance || 0);
    const available = isFunding ? previousFunding : previousTrading;

    if (available < amount) {
      return {
        success: false,
        message: `Insufficient ${isFunding ? 'Funding' : 'Trading'} balance ($${available.toFixed(2)} available).`,
      };
    }

    const newFunding = isFunding
      ? Number((previousFunding - amount).toFixed(2))
      : previousFunding;
    const newTrading = isFunding
      ? previousTrading
      : Number((previousTrading - amount).toFixed(2));

    const newReq: WithdrawalRequest = {
      id: `wth-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      amount: Number(amount.toFixed(2)),
      accountHolderName: accountHolderName.trim(),
      bankOrAddress: bankOrAddress.trim(),
      network: network.trim(),
      withdrawalType,
      sourceWallet: isFunding ? 'funding' : 'trading',
      notes: notes?.trim() || '',
      rejectReason: '',
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    // Persist the request first. Only debit the wallet after the request row exists.
    const requestResult = await syncWithdrawalToSupabase(newReq);
    if (!requestResult.success) {
      return {
        success: false,
        message: `Could not save the withdrawal request: ${requestResult.error || 'Supabase insert failed'}`,
      };
    }

    const balanceResult = await updateUserBalanceInSupabase(currentUser.id, newTrading, newFunding);
    if (!balanceResult.success) {
      const cleanup = await deleteWithdrawalFromSupabase(newReq.id);
      if (!cleanup.success) {
        await updateWithdrawalStatusInSupabase(
          newReq.id,
          'rejected',
          'Cancelled automatically because the wallet balance could not be updated.'
        );
      }
      return {
        success: false,
        message: `The request was saved but the wallet balance could not be updated. ${balanceResult.error || 'Please contact support before retrying.'}`,
      };
    }

    setUsers((prev) =>
      prev.map((user) =>
        user.id === currentUser.id
          ? { ...user, tradingBalance: newTrading, fundingBalance: newFunding }
          : user
      )
    );
    setWithdrawalRequests((prev) => [newReq, ...prev]);

    logAuditAction(
      'WITHDRAWAL_REQUESTED',
      `${currentUser.name} (${currentUser.uid})`,
      `Submitted $${amount.toFixed(2)} withdrawal from ${isFunding ? 'Funding' : 'Trading'} Wallet.`
    );

    return {
      success: true,
      message: `Withdrawal request of $${amount.toFixed(2)} from ${isFunding ? 'Funding' : 'Trading'} Wallet submitted! Our finance desk is reviewing your transaction.`,
    };
  };

  const approveWithdrawal = async (withdrawalId: string): Promise<void> => {
    const wth = withdrawalRequests.find((withdrawal) => withdrawal.id === withdrawalId);
    if (!wth || wth.status !== 'pending') return;

    const result = await updateWithdrawalStatusInSupabase(withdrawalId, 'approved');
    if (!result.success) {
      console.warn('Could not approve withdrawal in Supabase:', result.error);
      return;
    }

    setWithdrawalRequests((prev) =>
      prev.map((withdrawal) =>
        withdrawal.id === withdrawalId
          ? {
              ...withdrawal,
              status: 'approved',
              reviewedBy: adminName,
              reviewedAt: new Date().toISOString(),
            }
          : withdrawal
      )
    );

    logAuditAction(
      'WITHDRAWAL_APPROVED',
      `${wth.userName} (#${wth.id})`,
      `Approved withdrawal of $${wth.amount.toLocaleString()} to ${wth.accountHolderName} (${wth.network})`
    );
  };

  const rejectWithdrawal = async (withdrawalId: string, reason: string): Promise<boolean> => {
    const wth = withdrawalRequests.find((withdrawal) => withdrawal.id === withdrawalId);
    if (!wth || wth.status !== 'pending') return false;

    const targetUser = users.find((user) => user.id === wth.userId);
    if (!targetUser) {
      console.warn('Could not refund rejected withdrawal: user not found.', wth.userId);
      return false;
    }

    const isFunding = wth.sourceWallet === 'funding';
    const prevTrading = Number(targetUser.tradingBalance || 0);
    const prevFunding = Number(targetUser.fundingBalance || 0);
    const refundedTrading = isFunding ? prevTrading : Number((prevTrading + wth.amount).toFixed(2));
    const refundedFunding = isFunding ? Number((prevFunding + wth.amount).toFixed(2)) : prevFunding;
    const cleanReason = reason.trim() || 'Withdrawal canceled by administrator.';

    // Refund the correct wallet first, then persist the rejection reason and status.
    const balanceResult = await updateUserBalanceInSupabase(wth.userId, refundedTrading, refundedFunding);
    if (!balanceResult.success) {
      console.warn('Could not refund rejected withdrawal:', balanceResult.error);
      return false;
    }

    const statusResult = await updateWithdrawalStatusInSupabase(withdrawalId, 'rejected', cleanReason);
    if (!statusResult.success) {
      // Restore the pre-review balances when the rejection update itself fails.
      const rollback = await updateUserBalanceInSupabase(wth.userId, prevTrading, prevFunding);
      if (!rollback.success) {
        console.error('Withdrawal rejection failed and wallet rollback also failed:', rollback.error);
      }
      console.warn('Could not save withdrawal rejection reason:', statusResult.error);
      return false;
    }

    const reviewedAt = new Date().toISOString();
    setUsers((prev) =>
      prev.map((user) =>
        user.id === wth.userId
          ? { ...user, tradingBalance: refundedTrading, fundingBalance: refundedFunding }
          : user
      )
    );
    setWithdrawalRequests((prev) =>
      prev.map((withdrawal) =>
        withdrawal.id === withdrawalId
          ? {
              ...withdrawal,
              status: 'rejected',
              rejectReason: cleanReason,
              notes: cleanReason,
              reviewedBy: adminName,
              reviewedAt,
            }
          : withdrawal
      )
    );

    logAuditAction(
      'WITHDRAWAL_REJECTED',
      `${wth.userName} (#${wth.id})`,
      `Rejected $${wth.amount.toLocaleString()} withdrawal and refunded to ${isFunding ? 'Funding' : 'Trading'} Wallet. Reason: ${cleanReason}`
    );
    return true;
  };

  const logAuditAction = (action: string, target: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      adminName,
      adminId: 'admin-01',
      action,
      target,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const transferFunds = async ({
    fromWallet,
    toWallet,
    amount,
  }: {
    fromWallet: 'funding' | 'trading';
    toWallet: 'funding' | 'trading';
    amount: number;
  }): Promise<{ success: boolean; message: string }> => {
    if (fromWallet === toWallet) {
      return { success: false, message: 'Source and destination wallets must be different.' };
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, message: 'Please enter a valid transfer amount.' };
    }
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase is not configured. The transfer was not saved.' };
    }

    const currentFunding = Number((currentUser.fundingBalance || 0).toFixed(2));
    const currentTrading = Number((currentUser.tradingBalance || 0).toFixed(2));
    const sourceBalance = fromWallet === 'funding' ? currentFunding : currentTrading;
    if (sourceBalance < amount) {
      return {
        success: false,
        message: `Insufficient ${fromWallet === 'funding' ? 'Funding' : 'Trading'} balance ($${sourceBalance.toFixed(2)} available).`,
      };
    }

    const newFunding = fromWallet === 'funding'
      ? Number((currentFunding - amount).toFixed(2))
      : Number((currentFunding + amount).toFixed(2));
    const newTrading = fromWallet === 'trading'
      ? Number((currentTrading - amount).toFixed(2))
      : Number((currentTrading + amount).toFixed(2));

    // Explicitly persist both database columns before reporting a successful transfer.
    const balanceResult = await updateUserBalanceInSupabase(currentUser.id, newTrading, newFunding);
    if (!balanceResult.success) {
      return {
        success: false,
        message: `Could not save the wallet transfer: ${balanceResult.error || 'Supabase update failed'}`,
      };
    }

    setUsers((prev) =>
      prev.map((user) =>
        user.id === currentUser.id
          ? { ...user, tradingBalance: newTrading, fundingBalance: newFunding }
          : user
      )
    );

    logAuditAction(
      'WALLET_TRANSFER',
      currentUser.name,
      `Transferred $${amount.toFixed(2)} from ${fromWallet === 'funding' ? 'Funding' : 'Trading'} Wallet to ${toWallet === 'funding' ? 'Funding' : 'Trading'} Wallet.`
    );

    return {
      success: true,
      message: `Successfully transferred $${amount.toFixed(2)} to ${toWallet === 'funding' ? 'Funding' : 'Trading'} Wallet!`,
    };
  };

  const updateSystemSettings = (newSettings: Partial<SystemSettings>) => {
    setSystemSettings((prev) => ({ ...prev, ...newSettings }));
    logAuditAction('SETTINGS_UPDATED', 'Platform Settings', 'System configuration updated.');
  };

  const resetAllData = () => {
    localStorage.clear();
    setUsers(initialUsers);
    setCurrentUserId('user-827592');
    setCoins(initialCoins);
    setTrades(initialTrades);
    setSupportTickets(initialSupportTickets);
    setBalanceAdjustments(initialBalanceAdjustments);
    setDepositRequests(initialDepositRequests);
    setWithdrawalRequests(initialWithdrawalRequests);
    setAuditLogs(initialAuditLogs);
    setSystemSettings(initialSystemSettings);
    setIsAdmin(false);
  };

  return (
    <AppContext.Provider
      value={{
        refreshAllFromSupabase,
        isSupabaseSynced,
        users,
        currentUser,
        switchUser,
        updateUserStatus,
        isUserLoggedIn,
        isSuperAdmin,
        loginUser,
        registerUser,
        logoutUser,
        updateUserAvatar,
        changePassword,
        activeTab,
        setActiveTab,
        clientAgreement,
        submitAgreement,
        resetAgreement,
        isSupportOpen,
        setIsSupportOpen,
        isDepositModalOpen,
        setIsDepositModalOpen,
        isWithdrawModalOpen,
        setIsWithdrawModalOpen,
        isTransferModalOpen,
        setIsTransferModalOpen,
        transferFunds,
        selectedTradeDetails,
        setSelectedTradeDetails,
        coins,
        selectedSymbol,
        setSelectedSymbol,
        activeCoin,
        updateCoinSettings,
        setCoinPrice,
        applyMarketShock,
        addCustomCoin,
        marketDataMode,
        setMarketDataMode,
        trades,
        openTrade,
        closeTrade,
        supportTickets,
        activeSupportUsers,
        setUserViewingSupport,
        sendUserMessage,
        sendAdminReply,
        updateTicketStatus,
        closeSupportSession,
        reopenSupportSession,
        startNewSupportChat,
        deleteSupportTicket,
        markUserChatAsRead,
        language,
        setLanguage,
        balanceAdjustments,
        adjustUserBalance,
        depositRequests,
        submitDepositRequest,
        approveDeposit,
        rejectDeposit,
        withdrawalRequests,
        submitWithdrawalRequest,
        approveWithdrawal,
        rejectWithdrawal,
        isAdmin,
        setIsAdmin,
        adminName,
        auditLogs,
        systemSettings,
        updateSystemSettings,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
