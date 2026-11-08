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
  fetchUsersFromSupabase,
  fetchTradesFromSupabase,
  fetchTicketsFromSupabase,
  fetchDepositsFromSupabase,
  fetchWithdrawalsFromSupabase,
  syncUserToSupabase,
  updateUserBalanceInSupabase,
  updateUserStatusInSupabase,
  syncTradeToSupabase,
  syncTicketToSupabase,
  syncDepositToSupabase,
  updateDepositStatusInSupabase,
  syncWithdrawalToSupabase,
  updateWithdrawalStatusInSupabase,
  subscribeToSupabaseRealtime,
} from '../lib/supabase';

interface AppContextType {
  // Current user & Auth
  users: User[];
  currentUser: User;
  switchUser: (userId: string) => void;
  updateUserStatus: (userId: string, status: 'active' | 'suspended') => void;
  isUserLoggedIn: boolean;
  isSuperAdmin: boolean;
  loginUser: (identifier: string, password?: string) => { success: boolean; message: string };
  registerUser: (params: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    referralCode: string;
  }) => { success: boolean; message: string; user?: User };
  logoutUser: () => void;
  updateUserAvatar: (avatarUrl: string) => void;

  // Navigation
  activeTab: 'home' | 'market' | 'trade' | 'history' | 'account' | 'admin' | 'login';
  setActiveTab: (tab: 'home' | 'market' | 'trade' | 'history' | 'account' | 'admin' | 'login') => void;

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
  }) => { success: boolean; message: string };
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
    notes?: string;
  }) => { success: boolean; message: string };
  approveWithdrawal: (withdrawalId: string) => void;
  rejectWithdrawal: (withdrawalId: string, reason: string) => void;

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

  // Navigation & UI state with URL /admin, /login, /register router detection
  const [activeTab, setActiveTab] = useState<'home' | 'market' | 'trade' | 'history' | 'account' | 'admin' | 'login'>(() => {
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
    }
    // Default to 'login' page for unauthenticated visitors as requested
    const savedLogin = loadState('isUserLoggedIn', false);
    return savedLogin ? 'home' : 'login';
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => loadState('isAdmin', false));
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(() => loadState('isUserLoggedIn', false));
  const adminName = 'Chief Operator (UK)';

  // Automatically listen to /admin, #admin, /login and ?tab=admin URL navigation
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

  // Central Supabase Cloud Sync & Realtime Listener
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let isMounted = true;

    const hydrateFromSupabase = async () => {
      try {
        const [cloudUsers, cloudTrades, cloudTickets, cloudDeposits, cloudWithdrawals] = await Promise.all([
          fetchUsersFromSupabase(),
          fetchTradesFromSupabase(),
          fetchTicketsFromSupabase(),
          fetchDepositsFromSupabase(),
          fetchWithdrawalsFromSupabase(),
        ]);

        if (!isMounted) return;

        if (cloudUsers && cloudUsers.length > 0) {
          setUsers((prev) => {
            const existingMap = new Map(cloudUsers.map((u) => [u.id, u]));
            prev.forEach((u) => {
              if (!existingMap.has(u.id)) existingMap.set(u.id, u);
            });
            return Array.from(existingMap.values());
          });
        }
        if (cloudTrades && cloudTrades.length > 0) {
          setTrades(cloudTrades);
        }
        if (cloudTickets && cloudTickets.length > 0) {
          setSupportTickets(cloudTickets);
        }
        if (cloudDeposits && cloudDeposits.length > 0) {
          setDepositRequests(cloudDeposits);
        }
        if (cloudWithdrawals && cloudWithdrawals.length > 0) {
          setWithdrawalRequests(cloudWithdrawals);
        }
      } catch (err) {
        console.warn('[Supabase Cloud Hydration] notice:', err);
      }
    };

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
        if (k && isMounted) setSupportTickets(k);
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

    return () => {
      isMounted = false;
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  // Live Price Ticker & Trade PnL Updater
  useEffect(() => {
    const interval = setInterval(() => {
      // If in manual benchmark mode, preserve exact prices without random noise
      if (marketDataMode === 'manual_benchmark') return;

      // Small realistic market fluctuation
      setCoins((prevCoins) =>
        prevCoins.map((coin) => {
          if (coin.status === 'paused') return coin;
          const deltaPct = (Math.random() - 0.49) * 0.0018; // ~0.1% micro fluctuation
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
    }, 1800);

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

            return {
              ...t,
              currentPrice: curPrice,
              exitPrice: curPrice,
              pnl: Number(pnl.toFixed(2)),
              pnlPercent: Number(pnlPercent.toFixed(2)),
              status: 'CLOSED' as const,
              closedAt: now.toISOString(),
            };
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

  const registerUser = ({
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
    referralCode: string;
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

    // Rule 1 & 2: Referral code is strictly required and must match an existing user's UID or official master code
    if (!cleanRef) {
      return {
        success: false,
        message: 'A valid Referral Code (Inviter UID or Official Code) is required to register an account.',
      };
    }

    const officialMatch = OFFICIAL_REFERRAL_CODES.find((o) => o.code === cleanRef);
    const userMatch = users.find((u) => u.uid === cleanRef);
    const referrer = officialMatch
      ? { uid: officialMatch.code, name: officialMatch.inviterName }
      : userMatch
      ? { uid: userMatch.uid, name: userMatch.name }
      : null;

    if (!referrer) {
      return {
        success: false,
        message: `Invalid Referral Code "${cleanRef}". Please enter a valid inviter UID.`,
      };
    }

    const exists = users.some(
      (u) => u.email.toLowerCase() === cleanEmail || u.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (exists) {
      return { success: false, message: 'This username or email is already registered.' };
    }

    // Generate random 6-digit UID (ensure it doesn't collide)
    let uid = Math.floor(100000 + Math.random() * 900000).toString();
    while (users.some((u) => u.uid === uid)) {
      uid = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const newId = `user-${uid}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newUser: User = {
      id: newId,
      uid,
      name: cleanName,
      email: cleanEmail,
      phone: phone || '+44 7900 000000',
      tradingBalance: 0.00, // 0.00 initial balance as requested, only added by admin deposit
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

    setUsers((prev) => [newUser, ...prev]);
    syncUserToSupabase(newUser);
    // Do not auto-login; let user see registration success card and smoothly redirect to sign in

    // Automatically create a support welcome ticket for this new trader
    const welcomeTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      userId: newId,
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

  const loginUser = (identifier: string, password?: string) => {
    const clean = identifier.trim().toLowerCase();
    const found = users.find(
      (u) =>
        u.name.toLowerCase() === clean ||
        u.email.toLowerCase() === clean ||
        u.uid === clean
    );

    if (!found) {
      return {
        success: false,
        message: 'Account not found. Please verify your username/email or click Create Account.',
      };
    }

    if (found.status === 'suspended') {
      return { success: false, message: 'This account has been suspended by the administrator.' };
    }

    // Verify registered password
    if (password) {
      const validPass = found.password || '123456';
      if (password !== validPass) {
        return { success: false, message: 'Incorrect password. Please verify your credentials.' };
      }
    }

    setCurrentUserId(found.id);
    setIsUserLoggedIn(true);
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

    // Return to user
    setUsers((prev) =>
      prev.map((u) =>
        u.id === trade.userId
          ? { ...u, tradingBalance: Number((u.tradingBalance + finalReturn).toFixed(2)) }
          : u
      )
    );

    // Mark trade closed
    setTrades((prev) =>
      prev.map((t) =>
        t.id === tradeId
          ? {
              ...t,
              status: 'CLOSED',
              exitPrice: curPrice,
              pnl: Number(pnl.toFixed(2)),
              pnlPercent: Number(pnlPercent.toFixed(2)),
              closedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : t
      )
    );
  };

  // Support System
  const sendUserMessage = (
    text: string,
    attachment?: { url: string; name: string; type: 'image' | 'file' }
  ) => {
    if (!text.trim() && !attachment) return;
    const nowStr = new Date().toISOString();
    const displaySummary = text.trim() || (attachment ? `📎 [${attachment.type === 'image' ? 'Photo' : 'File'}] ${attachment.name}` : '');

    const newMsg: SupportMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderName: currentUser.name,
      text: text.trim(),
      timestamp: nowStr,
      read: false,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type,
    };

    let isFirstUserMessage = false;

    setSupportTickets((prev) => {
      const userTickets = prev.filter((t) => t.userId === currentUser.id);
      const activeTicket = userTickets[0]; // most recent ticket

      if (activeTicket && !activeTicket.isSessionClosed) {
        const hadPriorUserMessage = activeTicket.messages.some((m) => m.sender === 'user');
        if (!hadPriorUserMessage) {
          isFirstUserMessage = true;
        }
        return prev.map((t) =>
          t.id === activeTicket.id
            ? {
                ...t,
                status: 'pending',
                isSessionClosed: false,
                lastMessage: displaySummary,
                lastMessageTime: nowStr,
                unreadAdminCount: t.unreadAdminCount + 1,
                messages: [...t.messages, newMsg],
              }
            : t
        );
      } else {
        isFirstUserMessage = true;
        const newTicket: SupportTicket = {
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
        return [newTicket, ...prev];
      }
    });

    // Send single automated initial acknowledgment only on customer's first message
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
          const userTickets = prev.filter((t) => t.userId === currentUser.id);
          const activeTicket = userTickets[0];
          if (!activeTicket) return prev;
          return prev.map((t) =>
            t.id === activeTicket.id
              ? {
                  ...t,
                  lastMessage: botReply.text,
                  lastMessageTime: replyNowStr,
                  unreadUserCount: t.unreadUserCount + 1,
                  messages: [...t.messages, botReply],
                }
              : t
          );
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
    if (!text.trim() && !attachment) return;
    const nowStr = new Date().toISOString();
    const displaySummary = text.trim() || (attachment ? `📎 [${attachment.type === 'image' ? 'Photo' : 'File'}] ${attachment.name}` : '');

    const newMsg: SupportMessage = {
      id: `msg-${Date.now()}`,
      sender: 'admin',
      senderName: adminName,
      text: text.trim(),
      timestamp: nowStr,
      read: false,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type,
    };

    setSupportTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'answered',
            isSessionClosed: false,
            lastMessage: displaySummary,
            lastMessageTime: nowStr,
            unreadAdminCount: 0,
            unreadUserCount: t.unreadUserCount + 1,
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      })
    );

    const ticket = supportTickets.find((t) => t.id === ticketId);
    logAuditAction(
      'SUPPORT_REPLY',
      ticket ? `${ticket.userName} (${ticket.userId})` : 'User Ticket',
      `Admin sent reply to support query.`
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
  const submitWithdrawalRequest = ({
    amount,
    accountHolderName,
    bankOrAddress,
    network,
    withdrawalType = 'USD',
    notes,
  }: {
    amount: number;
    accountHolderName: string;
    bankOrAddress: string;
    network: string;
    withdrawalType?: 'USD' | 'USDT';
    notes?: string;
  }) => {
    if (currentUser.status === 'suspended') {
      return { success: false, message: 'Account is suspended from withdrawals.' };
    }
    if (amount < systemSettings.minWithdrawal) {
      return { success: false, message: `Minimum withdrawal is $${systemSettings.minWithdrawal}.` };
    }
    if (currentUser.tradingBalance < amount) {
      return { success: false, message: 'Insufficient trading balance.' };
    }

    const newTrading = Number((currentUser.tradingBalance - amount).toFixed(2));
    // Deduct funds immediately upon request
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? { ...u, tradingBalance: newTrading }
          : u
      )
    );
    updateUserBalanceInSupabase(currentUser.id, newTrading, currentUser.fundingBalance);

    const newReq: WithdrawalRequest = {
      id: `wth-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      amount,
      accountHolderName,
      bankOrAddress,
      network,
      withdrawalType,
      notes,
      status: 'pending',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setWithdrawalRequests((prev) => [newReq, ...prev]);
    syncWithdrawalToSupabase(newReq);

    return {
      success: true,
      message: 'Withdrawal request submitted! Our finance team is reviewing your transaction.',
    };
  };

  const approveWithdrawal = (withdrawalId: string) => {
    const wth = withdrawalRequests.find((w) => w.id === withdrawalId);
    if (!wth || wth.status !== 'pending') return;

    setWithdrawalRequests((prev) =>
      prev.map((w) =>
        w.id === withdrawalId
          ? {
              ...w,
              status: 'approved',
              reviewedBy: adminName,
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : w
      )
    );
    updateWithdrawalStatusInSupabase(withdrawalId, 'approved');

    logAuditAction(
      'WITHDRAWAL_APPROVED',
      `${wth.userName} (#${wth.id})`,
      `Approved withdrawal of $${wth.amount.toLocaleString()} to ${wth.accountHolderName} (${wth.network})`
    );
  };

  const rejectWithdrawal = (withdrawalId: string, reason: string) => {
    const wth = withdrawalRequests.find((w) => w.id === withdrawalId);
    if (!wth || wth.status !== 'pending') return;

    const refundedTrading = Number((currentUser.tradingBalance + wth.amount).toFixed(2));
    // Refund back to user's trading balance
    setUsers((prev) =>
      prev.map((u) =>
        u.id === wth.userId
          ? { ...u, tradingBalance: Number((u.tradingBalance + wth.amount).toFixed(2)) }
          : u
      )
    );
    updateUserBalanceInSupabase(wth.userId, refundedTrading, currentUser.fundingBalance);

    setWithdrawalRequests((prev) =>
      prev.map((w) =>
        w.id === withdrawalId
          ? {
              ...w,
              status: 'rejected',
              rejectReason: reason,
              reviewedBy: adminName,
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : w
      )
    );
    updateWithdrawalStatusInSupabase(withdrawalId, 'rejected');

    logAuditAction(
      'WITHDRAWAL_REJECTED',
      `${wth.userName} (#${wth.id})`,
      `Rejected $${wth.amount.toLocaleString()} withdrawal and refunded balance. Reason: ${reason}`
    );
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

  const transferFunds = ({
    fromWallet,
    toWallet,
    amount,
  }: {
    fromWallet: 'funding' | 'trading';
    toWallet: 'funding' | 'trading';
    amount: number;
  }) => {
    if (fromWallet === toWallet) {
      return { success: false, message: 'Source and destination wallets must be different.' };
    }
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: 'Please enter a valid transfer amount.' };
    }

    const currentFunding = currentUser.fundingBalance || 0;
    const currentTrading = currentUser.tradingBalance || 0;

    if (fromWallet === 'funding') {
      if (currentFunding < amount) {
        return {
          success: false,
          message: `Insufficient Funding balance ($${currentFunding.toFixed(2)} available).`,
        };
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id
            ? {
                ...u,
                fundingBalance: Number((u.fundingBalance - amount).toFixed(2)),
                tradingBalance: Number((u.tradingBalance + amount).toFixed(2)),
              }
            : u
        )
      );
      logAuditAction(
        'WALLET_TRANSFER',
        currentUser.name,
        `Transferred $${amount.toFixed(2)} from Funding Wallet to Trading Wallet.`
      );
      return {
        success: true,
        message: `Successfully transferred $${amount.toFixed(2)} to Trading Wallet!`,
      };
    } else {
      if (currentTrading < amount) {
        return {
          success: false,
          message: `Insufficient Trading balance ($${currentTrading.toFixed(2)} available).`,
        };
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id
            ? {
                ...u,
                tradingBalance: Number((u.tradingBalance - amount).toFixed(2)),
                fundingBalance: Number((u.fundingBalance + amount).toFixed(2)),
              }
            : u
        )
      );
      logAuditAction(
        'WALLET_TRANSFER',
        currentUser.name,
        `Transferred $${amount.toFixed(2)} from Trading Wallet to Funding Wallet.`
      );
      return {
        success: true,
        message: `Successfully transferred $${amount.toFixed(2)} to Funding Wallet!`,
      };
    }
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
        activeTab,
        setActiveTab,
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
