import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  AgreementAdminRecord,
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
  fetchTradeFromSupabase,
  fetchDepositsFromSupabase,
  fetchWithdrawalsFromSupabase,
  fetchAuditLogsFromSupabase,
  syncUserToSupabase,
  updateUserBalanceInSupabase,
  updateUserStatusInSupabase,
  syncTradeToSupabase,
  syncDepositToSupabase,
  updateDepositStatusInSupabase,
  syncWithdrawalToSupabase,
  updateWithdrawalStatusInSupabase,
  syncAuditLogToSupabase,
  subscribeToSupabaseRealtime,
} from '../lib/supabase';
import { registerWithFirebase, loginOrMigrateWithFirebase } from '../lib/firebaseAuth';
import { saveFirebaseDocument, deleteFirebaseDocument, subscribeFirebaseCollection, fetchFirebaseCollection } from '../lib/firebaseData';
import { isFirebaseConfigured } from '../lib/firebase';

interface AppContextType {
  // Supabase Cloud Sync
  refreshAllFromSupabase: () => Promise<void>;
  isSupabaseSynced: boolean;

  // Current user & Auth
  users: User[];
  currentUser: User;
  switchUser: (userId: string) => void;
  updateUserStatus: (userId: string, status: 'active' | 'suspended' | 'archived', reason?: string) => void;
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
  updateClientAgreementStatus: (agreementId: string, status: 'completed' | 'cancelled', reason?: string) => { success: boolean; message: string };

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
  }) => Promise<{ success: boolean; message: string }>;
  closeTrade: (tradeId: string) => void;
  setTradeOutcome: (tradeId: string, outcome: 'WIN' | 'LOSS' | null, percent?: number) => void;
  adminSettleTrade: (tradeId: string, outcome: 'WIN' | 'LOSS', percent?: number) => void;

  // Support system & Real-time Presence
  supportTickets: SupportTicket[];
  activeSupportUsers: { userId: string; userName: string; uid: string; enteredAt: string }[];
  setUserViewingSupport: (userId: string, isViewing: boolean) => void;
  sendUserMessage: (
    text: string,
    attachment?: { url: string; name: string; type: 'image' | 'file' }
  ) => Promise<{ success: boolean; message: string; ticketId?: string }>;
  sendAdminReply: (
    ticketId: string,
    text: string,
    attachment?: { url: string; name: string; type: 'image' | 'file' }
  ) => Promise<{ success: boolean; message: string }>;
  addSupportSystemNotification: (ticketId: string, text: string) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  closeSupportSession: (ticketId: string) => void;
  reopenSupportSession: (ticketId: string) => void;
  startNewSupportChat: (userId?: string) => Promise<{ success: boolean; message: string; ticketId?: string }>;
  deleteSupportTicket: (ticketId: string) => void;
  editSupportMessage: (ticketId: string, messageId: string, newText: string) => void;
  deleteSupportMessageForEveryone: (ticketId: string, messageId: string) => void;
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
  adminTransferFunds: (params: { userId: string; amount: number; reason: string }) => { success: boolean; message: string };

  depositRequests: DepositRequest[];
  submitDepositRequest: (params: {
    amount: number;
    txid: string;
    paymentMethod: string;
    network?: string;
    note?: string;
  }) => Promise<{ success: boolean; message: string }>;
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

  // Support conversations are stored and synchronized through Firebase only.
  const persistSupportTicket = async (ticket: SupportTicket): Promise<{ success: boolean; error?: string }> => {
    if (!isFirebaseConfigured()) return { success: false, error: 'Firebase is not configured.' };
    try {
      await saveFirebaseDocument('supportTickets', ticket.id, ticket);
      return { success: true };
    } catch (error) {
      console.error('[Firebase Support] Save failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Firebase save failed.' };
    }
  };
  const [balanceAdjustments, setBalanceAdjustments] = useState<BalanceAdjustment[]>(() => loadState('adjustments', initialBalanceAdjustments));
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>(() => loadState('deposits', initialDepositRequests));
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => loadState('withdrawals', initialWithdrawalRequests));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadState('audit', initialAuditLogs));
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => loadState('settings', initialSystemSettings));
  // Throttle live position snapshots so Admin receives fresh P/L without writing every 500ms.
  const lastTradeCloudSyncRef = useRef<Record<string, number>>({});

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

  // Keep the local certificate status in sync with Admin decisions delivered through the existing Support Inbox.
  useEffect(() => {
    const latest = supportTickets
      .filter((ticket) => ticket.userId === currentUserId)
      .flatMap((ticket) => ticket.messages || [])
      .filter((message) => message.isAgreementEvent && message.agreementData)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.agreementData;
    if (!latest) return;
    setClientAgreement((previous) => {
      if (!previous || previous.id !== latest.id) return previous;
      const next = { ...previous, status: latest.status, reviewedAt: latest.reviewedAt, reviewedBy: latest.reviewedBy, statusReason: latest.statusReason };
      saveState('cpt_agreement_' + currentUserId, next);
      return next;
    });
  }, [supportTickets, currentUserId]);

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

    // Reuse the already-connected Support Inbox as the cross-device transport. Only compact
    // agreement metadata is synced; identity images, signature, street address and phone are not.
    const agreementData: AgreementAdminRecord = {
      id: newAgreement.id,
      userId: newAgreement.userId,
      fullName: newAgreement.fullName,
      username: newAgreement.username,
      uid: newAgreement.uid,
      agreementNumber: newAgreement.agreementNumber,
      startDate: newAgreement.startDate,
      durationDays: newAgreement.durationDays,
      endDate: newAgreement.endDate,
      tradingPurpose: newAgreement.tradingPurpose,
      tradeAmount: newAgreement.tradeAmount,
      status: 'active',
      submittedAt: newAgreement.submittedAt,
    };
    const agreementMessage: SupportMessage = {
      id: `msg-agreement-${newAgreement.id}`,
      sender: 'user',
      senderName: currentUser.name,
      text: `📄 Agreement submitted · ${newAgreement.agreementNumber}`,
      timestamp: newAgreement.submittedAt,
      read: false,
      isSystem: true,
      isAgreementEvent: true,
      agreementData,
    };
    const userTickets = supportTickets.filter((ticket) => ticket.userId === currentUserId);
    const activeTicket = userTickets.find((ticket) => !ticket.isSessionClosed && ticket.status !== 'closed');
    const agreementTicket: SupportTicket = activeTicket
      ? { ...activeTicket, status: 'pending', isSessionClosed: false, lastMessage: agreementMessage.text, lastMessageTime: agreementMessage.timestamp, unreadAdminCount: (activeTicket.unreadAdminCount || 0) + 1, messages: [...(activeTicket.messages || []), agreementMessage] }
      : { id: `ticket-agreement-${newAgreement.id}`, userId: currentUser.id, userName: currentUser.name, userEmail: currentUser.email, status: 'pending', isSessionClosed: false, sessionNumber: 240 + userTickets.length + 1, lastMessage: agreementMessage.text, lastMessageTime: agreementMessage.timestamp, unreadAdminCount: 1, unreadUserCount: 0, messages: [agreementMessage] };
    setSupportTickets((previous) => {
      const exists = previous.some((ticket) => ticket.id === agreementTicket.id);
      const next = exists ? previous.map((ticket) => ticket.id === agreementTicket.id ? agreementTicket : ticket) : [agreementTicket, ...previous];
      return next.sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime());
    });
    {
      const result = await persistSupportTicket(agreementTicket);
      if (!result.success) throw new Error(`Agreement was not saved to Firebase: ${result.error || 'Please try again.'}`);
    }

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

  const updateClientAgreementStatus = (agreementId: string, status: 'completed' | 'cancelled', reason = '') => {
    const targetTicket = supportTickets.find((ticket) =>
      (ticket.messages || []).some((message) => message.isAgreementEvent && message.agreementData?.id === agreementId)
    );
    if (!targetTicket) return { success: false, message: 'Agreement not found.' };
    const targetMessage = (targetTicket.messages || []).find((message) =>
      message.isAgreementEvent && message.agreementData?.id === agreementId
    );
    if (!targetMessage?.agreementData || targetMessage.agreementData.status !== 'active') {
      return { success: false, message: 'Agreement not found or it is no longer running.' };
    }

    const reviewedAt = new Date().toISOString();
    const updatedRecord: AgreementAdminRecord = {
      ...targetMessage.agreementData,
      status,
      reviewedAt,
      reviewedBy: adminName,
      statusReason: reason.trim() || undefined,
    };
    const updatedMessages = (targetTicket.messages || []).map((message) =>
      message.id === targetMessage.id
        ? { ...message, text: `📄 Agreement ${status} · ${updatedRecord.agreementNumber}`, timestamp: reviewedAt, agreementData: updatedRecord }
        : message
    );
    const updatedTicket: SupportTicket = {
      ...targetTicket,
      messages: updatedMessages,
      lastMessage: updatedMessages[updatedMessages.length - 1]?.text || targetTicket.lastMessage,
      lastMessageTime: reviewedAt,
      unreadUserCount: (targetTicket.unreadUserCount || 0) + 1,
    };
    setSupportTickets((previous) => previous.map((ticket) => ticket.id === targetTicket.id ? updatedTicket : ticket));
    {
      void persistSupportTicket(updatedTicket).then((result) => {
        if (!result.success) console.error('[Agreement] Admin status was not saved to cloud:', result.error);
      });
    }
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      adminName,
      adminId: currentUser.id,
      action: status === 'completed' ? 'CLIENT_AGREEMENT_COMPLETED' : 'CLIENT_AGREEMENT_CANCELLED',
      target: `${updatedRecord.fullName} (${updatedRecord.uid})`,
      details: `Agreement ${updatedRecord.agreementNumber} ${status}.${reason.trim() ? ` Reason: ${reason.trim()}` : ''}`,
      timestamp: reviewedAt,
    };
    setAuditLogs((previous) => [newLog, ...previous]);
    return { success: true, message: `Agreement ${status}.` };
  };

  const resetAgreement = () => {
    if (clientAgreement?.status === 'active') return;
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
  const [activeSupportUsers, setActiveSupportUsers] = useState<{ userId: string; userName: string; uid: string; enteredAt: string }[]>([]);
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

    const merged = incoming.map((cloudTicket) => {
      // Strictly match by ticket ID so distinct sessions for the same user NEVER mix messages!
      const local = localMap.get(cloudTicket.id);
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
        isSessionClosed: cloudTicket.isSessionClosed ?? local.isSessionClosed ?? (cloudTicket.status === 'closed'),
        sessionNumber: cloudTicket.sessionNumber || local.sessionNumber,
        messages: allMsgs,
        lastMessage: lastMsg ? (lastMsg.text || (lastMsg.attachmentUrl ? '📎 Attachment' : 'Message')) : cloudTicket.lastMessage,
        lastMessageTime: lastMsg ? lastMsg.timestamp : cloudTicket.lastMessageTime,
        unreadAdminCount: Math.max(cloudTicket.unreadAdminCount || 0, local.unreadAdminCount || 0),
        unreadUserCount: Math.max(cloudTicket.unreadUserCount || 0, local.unreadUserCount || 0),
      };
    });

    // Keep locally created tickets that are pending cloud upsert
    prev.forEach((loc) => {
      if (!merged.some((m) => m.id === loc.id)) {
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
      // Fetch each data group independently. A timeout in the large support-chat
      // table must never prevent accounts, balances, trades or requests from loading.
      const results = await Promise.allSettled([
        fetchUsersFromSupabase(),
        fetchTradesFromSupabase(),
        fetchDepositsFromSupabase(),
        fetchWithdrawalsFromSupabase(),
        fetchAuditLogsFromSupabase(),
      ]);
      const cloudUsers = results[0].status === 'fulfilled' ? results[0].value : null;
      const cloudTrades = results[1].status === 'fulfilled' ? results[1].value : null;
      const cloudDeposits = results[2].status === 'fulfilled' ? results[2].value : null;
      const cloudWithdrawals = results[3].status === 'fulfilled' ? results[3].value : null;
      const cloudAudit = results[4].status === 'fulfilled' ? results[4].value : null;

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
      if (cloudTrades) {
        setTrades((prev) => {
          const cloudMap = new Map(cloudTrades.map((t) => [t.id, t]));
          const merged = [...cloudTrades];
          // Preserve local trades until their cloud write is confirmed, including completed history.
          prev.forEach((localTrade) => {
            if (!cloudMap.has(localTrade.id)) merged.push(localTrade);
          });
          return merged.sort(
            (a, b) => new Date(b.openedAt || 0).getTime() - new Date(a.openedAt || 0).getTime()
          );
        });
      }
      if (cloudDeposits && cloudDeposits.length > 0) {
        setDepositRequests(cloudDeposits);
      }
      if (cloudWithdrawals && cloudWithdrawals.length > 0) {
        setWithdrawalRequests(cloudWithdrawals);
      }
      if (cloudAudit) {
        setAuditLogs((prev) => {
          const merged = new Map(cloudAudit.map((log) => [log.id, log]));
          prev.forEach((log) => {
            if (!merged.has(log.id)) merged.set(log.id, log);
          });
          return Array.from(merged.values()).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        });
      }
      const coreDataLoaded =
        results[0].status === 'fulfilled' && cloudUsers !== null &&
        results[1].status === 'fulfilled' && cloudTrades !== null;
      setIsSupabaseSynced(coreDataLoaded);
      if (!coreDataLoaded) {
        console.warn('[Supabase Cloud Hydration] Account or trade data could not be confirmed from the shared database.');
      }
    } catch (err) {
      setIsSupabaseSynced(false);
      console.warn('[Supabase Cloud Hydration] notice:', err);
    }
  };

  const refreshAllFromSupabase = async () => {
    // Manual Admin Sync Now must also refresh the Support Inbox, not just core tables.
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
      onTradeUpdate: async (payload) => {
        // A live P/L update affects one trade. Fetch only that row instead of
        // re-downloading the customer's complete trade history on every event.
        const tradeId = payload?.new?.id || payload?.old?.id;
        if (!tradeId || !isMounted) return;
        if (payload?.eventType === 'DELETE') {
          setTrades((prev) => prev.filter((trade) => trade.id !== tradeId));
          return;
        }
        const cloudTrade = await fetchTradeFromSupabase(tradeId);
        if (!cloudTrade || !isMounted) return;
        setTrades((prev) => {
          const exists = prev.some((trade) => trade.id === cloudTrade.id);
          const merged = exists
            ? prev.map((trade) => trade.id === cloudTrade.id ? cloudTrade : trade)
            : [cloudTrade, ...prev];
          return merged.sort(
            (a, b) => new Date(b.openedAt || 0).getTime() - new Date(a.openedAt || 0).getTime()
          );
        });
      },
      onDepositUpdate: async () => {
        const d = await fetchDepositsFromSupabase();
        if (d && isMounted) setDepositRequests(d);
      },
      onWithdrawalUpdate: async () => {
        const w = await fetchWithdrawalsFromSupabase();
        if (w && isMounted) setWithdrawalRequests(w);
      },
      onAuditLogUpdate: async () => {
        const cloudLogs = await fetchAuditLogsFromSupabase();
        if (cloudLogs && isMounted) {
          setAuditLogs((prev) => {
            const merged = new Map(cloudLogs.map((log) => [log.id, log]));
            prev.forEach((log) => {
              if (!merged.has(log.id)) merged.set(log.id, log);
            });
            return Array.from(merged.values()).sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          });
        }
      },
    });

    // Realtime handles changes immediately. Poll less often as a fallback to
    // avoid repeatedly transferring the same account and full support history.
    const pollTimer = setInterval(() => {
      if (isMounted) hydrateFromSupabase(false);
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);

      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  // Firebase Realtime listener: both customer and admin clients receive the same inbox updates.
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const unsubscribe = subscribeFirebaseCollection<SupportTicket>(
      'supportTickets',
      (tickets) => {
        const sorted = tickets.sort(
          (a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
        );
        setSupportTickets(sorted);
      },
      (error) => console.error('[Firebase Support] Realtime listener failed:', error)
    );
    return () => unsubscribe();
  }, []);

  // Live Binance Price Feed (Zero-lag accurate real-world rates for major crypto coins)
  useEffect(() => {
    let isMounted = true;

    const fetchBinancePrices = async () => {
      if (marketDataMode === 'manual_benchmark') return;

      try {
        const binanceSymbols = [
          'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
          'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'LINKUSDT', 'SUIUSDT', 'NEARUSDT', 'TRXUSDT'
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
    // Admin monitoring must never settle customer positions from the Admin browser's
    // independent market feed. Only the customer-side trading session runs this timer.
    if (typeof window !== 'undefined' && window.sessionStorage.getItem('cpt_admin_auth') === 'true') {
      return;
    }
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

          let expiryMs = t.expiresAtMs;
          if (!expiryMs || isNaN(expiryMs) || expiryMs <= 0) {
            if (t.expiresAt && t.expiresAt.includes('T')) {
              expiryMs = new Date(t.expiresAt).getTime();
            } else if (t.expiresAt) {
              expiryMs = new Date(t.expiresAt.replace(' ', 'T') + 'Z').getTime() || new Date(t.expiresAt).getTime();
            }
          }

          // If still missing/NaN, calculate from openedAt + durationMinutes
          if (!expiryMs || isNaN(expiryMs) || expiryMs <= 0) {
            const openedMs = t.openedAt ? new Date(t.openedAt).getTime() : 0;
            if (openedMs > 0 && !isNaN(openedMs)) {
              expiryMs = openedMs + (t.durationMinutes || 1) * 60 * 1000;
            }
          }

          // Protection: never auto-expire a trade opened less than 10 seconds ago
          const openedTime = t.openedAt ? new Date(t.openedAt).getTime() : 0;
          const isFreshTrade = openedTime > 0 && (nowMs - openedTime < 10000);

          const isExpired = !isFreshTrade && typeof expiryMs === 'number' && expiryMs > 0 && !Number.isNaN(expiryMs) && nowMs >= expiryMs;

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

            let finalExitPrice = curPrice;
            let finalPnl = pnl;
            let finalPnlPercent = pnlPercent;

            if (t.scheduledOutcome === 'WIN') {
              const winPct = t.scheduledPercent ?? 35;
              finalPnl = Number((t.margin * (winPct / 100)).toFixed(2));
              finalPnlPercent = winPct;
              if (t.type === 'BUY') {
                finalExitPrice = Number((t.entryPrice * (1 + (winPct / 100) / t.leverage)).toFixed(t.entryPrice > 100 ? 2 : 4));
              } else {
                finalExitPrice = Number((t.entryPrice * (1 - (winPct / 100) / t.leverage)).toFixed(t.entryPrice > 100 ? 2 : 4));
              }
            } else if (t.scheduledOutcome === 'LOSS') {
              const lossPct = t.scheduledPercent ?? 100;
              finalPnl = -Number((t.margin * (lossPct / 100)).toFixed(2));
              finalPnlPercent = -lossPct;
              if (t.type === 'BUY') {
                finalExitPrice = Number((t.entryPrice * (1 - (lossPct / 100) / t.leverage)).toFixed(t.entryPrice > 100 ? 2 : 4));
              } else {
                finalExitPrice = Number((t.entryPrice * (1 + (lossPct / 100) / t.leverage)).toFixed(t.entryPrice > 100 ? 2 : 4));
              }
            }

            const finalReturn = Math.max(0, Number((t.margin + finalPnl).toFixed(2)));
            payouts.push({ userId: t.userId, returnAmount: finalReturn });

            const closedTradeItem: Trade = {
              ...t,
              currentPrice: finalExitPrice,
              exitPrice: finalExitPrice,
              pnl: Number(finalPnl.toFixed(2)),
              pnlPercent: Number(finalPnlPercent.toFixed(2)),
              status: 'CLOSED' as const,
              closedAt: now.toISOString().replace('T', ' ').slice(0, 19),
            };
            if (isSupabaseConfigured()) {
              syncTradeToSupabase(closedTradeItem).catch((e) => console.warn('Trade auto-close sync notice:', e));
            }
            return closedTradeItem;
          }

          const livePnl = Number(pnl.toFixed(2));
          const livePnlPercent = Number(pnlPercent.toFixed(2));
          // Persist the live market snapshot every 10 seconds. Realtime sends the
          // changed trade row to other devices without reloading the full trade table.
          const lastSyncedAt = lastTradeCloudSyncRef.current[t.id] || 0;
          if (isSupabaseConfigured() && nowMs - lastSyncedAt >= 10000) {
            lastTradeCloudSyncRef.current[t.id] = nowMs;
            syncTradeToSupabase({
              ...t,
              currentPrice: curPrice,
              pnl: livePnl,
              pnlPercent: livePnlPercent,
            }).then((result) => {
              if (!result.success) console.warn('[Trade live sync] Snapshot not saved:', result.error, t.id);
            }).catch((error) => console.warn('[Trade live sync] Snapshot error:', error, t.id));
          }

          return {
            ...t,
            currentPrice: curPrice,
            pnl: livePnl,
            pnlPercent: livePnlPercent,
          };
        });

        if (hasExpired && payouts.length > 0) {
          setTimeout(() => {
            setUsers((prevUsers) =>
              prevUsers.map((u) => {
                const userPayouts = payouts.filter((p) => p.userId === u.id);
                if (userPayouts.length > 0) {
                  const totalReturn = userPayouts.reduce((sum, p) => sum + p.returnAmount, 0);
                  const updatedTradingBalance = Number((u.tradingBalance + totalReturn).toFixed(2));

                  // Persist expiry settlement to Supabase as well as local state.
                  // Margin was deducted when the trade opened; return margin + PnL here.
                  if (isSupabaseConfigured()) {
                    updateUserBalanceInSupabase(u.id, updatedTradingBalance, u.fundingBalance);
                  }

                  return {
                    ...u,
                    tradingBalance: updatedTradingBalance,
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
    if (import.meta.env.PROD && !isFirebaseConfigured()) {
      return { success: false, message: 'Firebase Authentication is unavailable. Your account was not created. Please try again later.' };
    }

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

    // Firebase is the primary authentication provider. Do not block registration on Supabase quota/service status.
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

    // Save new customer authentication and profile to Firebase.
    try {
      const firebaseUser = await registerWithFirebase(
        cleanEmail,
        password || '123456',
        cleanName
      );
      const { password: _password, ...firebaseProfile } = newUser;
      await saveFirebaseDocument('users', newUser.id, {
        ...firebaseProfile,
        authUid: firebaseUser.uid,
        authProvider: 'firebase',
      });
    } catch (firebaseError) {
      console.error('[Firebase Registration failed]', firebaseError);
      return {
        success: false,
        message: 'Firebase account creation failed. Please contact Support before trying again.',
      };
    }

    // Firebase profile is the source of truth for newly registered accounts.

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
    let welcomeTicketSaved = isFirebaseConfigured();
    {
      const ticketSave = await persistSupportTicket(welcomeTicket);
      welcomeTicketSaved = ticketSave.success;
      if (!ticketSave.success) {
        console.error('[Registration welcome ticket sync failed]', ticketSave.error);
      }
    }
    if (welcomeTicketSaved) {
      setSupportTickets((prev) => [welcomeTicket, ...prev]);
    }

    logAuditAction(
      'NEW_USER_REGISTERED_WITH_REFERRAL',
      `${newUser.name} (${uid})`,
      `New trader account created via Referral UID: ${referrer.uid} (${referrer.name})`
    );

    return {
      success: true,
      message: welcomeTicketSaved
        ? `Account created successfully! Welcome UID: ${uid} (Invited by ${referrer.name})`
        : `Account created successfully! UID: ${uid}. Your welcome message could not sync, but you can still contact Support after login.`,
      user: newUser,
    };
  };

  const loginUser = async (identifier: string, password?: string) => {
    const clean = identifier.trim().toLowerCase();
    let firebaseFound: User | undefined;

    // Firebase user profiles keep login working even when Supabase is restricted.
    if (isFirebaseConfigured()) {
      try {
        const firebaseUsers = await fetchFirebaseCollection<User>('users');
        if (firebaseUsers.length > 0) {
          setUsers((prev) => {
            const merged = new Map(prev.map((user) => [user.id, user]));
            firebaseUsers.forEach((user) => merged.set(user.id, { ...merged.get(user.id), ...user } as User));
            return Array.from(merged.values());
          });
          const match = firebaseUsers.find((u) => u.name.toLowerCase() === clean || u.email.toLowerCase() === clean || u.uid === clean);
          if (match) {
            firebaseFound = match;
            setUsers((prev) => [match, ...prev.filter((u) => u.id !== match.id)]);
          }
        }
      } catch (err) {
        console.warn('[Firebase users lookup]', err);
      }
    }

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

    let found = firebaseFound || users.find(
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
    if (found.status === 'archived') {
      return { success: false, message: 'This account has been archived. Please contact Support for assistance.' };
    }

    // Verify Firebase login or migrate a verified legacy account.
    if (password) {
      if (!found.email) {
        return { success: false, message: 'This account has no registered email address.' };
      }

      // Authentication is Firebase-only. For a legacy profile not yet migrated,
      // verify its locally stored legacy password before creating its Firebase Auth account.
      // No Supabase Auth request is made here.
      const legacyAuthVerified = Boolean(found.password && password === found.password);

      try {
        const firebaseResult = await loginOrMigrateWithFirebase(
          found.email,
          password,
          legacyAuthVerified,
          found.name
        );

        const { password: _password, ...firebaseProfile } = found;
        await saveFirebaseDocument('users', found.id, {
          ...firebaseProfile,
          authUid: firebaseResult.user.uid,
          authProvider: 'firebase',
        });
      } catch (firebaseError) {
        console.error('[Firebase Login/Migration failed]', firebaseError);
        return {
          success: false,
          message: 'Login or account migration failed. Your existing account has not been deleted. Please contact Support.',
        };
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

  useEffect(() => {
    if (isUserLoggedIn && currentUser?.status === 'archived') {
      logoutUser();
    }
  }, [isUserLoggedIn, currentUser?.status]);

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

  const updateUserStatus = (userId: string, status: 'active' | 'suspended' | 'archived', reason?: string) => {
    const targetUser = users.find((user) => user.id === userId);
    if (!targetUser) return;
    if (status === 'archived' && trades.some((trade) => trade.userId === userId && trade.status === 'OPEN')) {
      console.warn('[Customer archive] Close all open trades before archiving this account.');
      return;
    }

    setUsers((prev) => prev.map((user) => user.id === userId ? { ...user, status } : user));
    void updateUserStatusInSupabase(userId, status);
    const action = status === 'archived'
      ? 'USER_ARCHIVED'
      : status === 'suspended'
        ? 'USER_SUSPENDED'
        : 'USER_ACTIVATED';
    const details = status === 'archived'
      ? `Account archived (soft delete). All customer, trade, and financial history retained. Reason: ${reason?.trim() || 'Archived by administrator'}.`
      : `Account marked as ${status} by Admin. ${reason?.trim() || ''}`.trim();
    logAuditAction(action, `${targetUser.name} (${targetUser.uid})`, details);
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

  const openTrade = async ({
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
  }): Promise<{ success: boolean; message: string }> => {
    if (currentUser.status === 'suspended') {
      return { success: false, message: 'Your account is suspended. Please contact Support.' };
    }
    if (currentUser.status === 'archived') {
      return { success: false, message: 'This account has been archived. Please contact Support.' };
    }

    const positionSize = margin * leverage;
    // Preserve the existing fee calculation and customer-facing trade rules.
    const fee = Number((positionSize * 0.000005).toFixed(2));
    const totalDeduction = margin + fee;
    if (currentUser.tradingBalance < totalDeduction) {
      return { success: false, message: 'Insufficient trading balance.' };
    }

    const targetCoin = coins.find((c) => c.symbol === symbol);
    if (!targetCoin) return { success: false, message: 'Invalid symbol.' };

    if (!isFirebaseConfigured()) {
      return { success: false, message: 'Firebase cloud connection is unavailable. Your trade was not opened. Please contact Support.' };
    }

    const nextTradingBalance = Number((currentUser.tradingBalance - totalDeduction).toFixed(2));
    const now = new Date();
    const nowMs = now.getTime();
    const expiryMs = nowMs + durationMinutes * 60 * 1000;
    const expiry = new Date(expiryMs);
    const halfSpread = targetCoin.spread / 2;
    const entryPrice = type === 'BUY' ? targetCoin.price + halfSpread : targetCoin.price - halfSpread;

    const newTrade: Trade = {
      id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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

    // Firebase is the source of truth for opening trades. Do not report success
    // or change local balances unless both cloud writes complete.
    try {
      await saveFirebaseDocument('trades', newTrade.id, newTrade);
      await saveFirebaseDocument('users', currentUser.id, {
        tradingBalance: nextTradingBalance,
        fundingBalance: currentUser.fundingBalance,
      });
    } catch (firebaseError) {
      try {
        await deleteFirebaseDocument('trades', newTrade.id);
      } catch (rollbackError) {
        console.error('[Firebase Trade] Could not remove incomplete trade:', rollbackError);
      }
      console.error('[Firebase Trade] Save failed:', firebaseError);
      return {
        success: false,
        message: 'Trade not opened because Firebase could not save the trade and balance. No local balance was deducted. Please try again or contact Support.',
      };
    }

    setUsers((prev) => prev.map((u) => u.id === currentUser.id ? { ...u, tradingBalance: nextTradingBalance } : u));
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
    // Always credit the owner of this trade, never whichever account happens to be
    // logged in on this browser (Admin may be viewing/closing another customer's trade).
    const tradeOwner = users.find((u) => u.id === trade.userId);
    if (!tradeOwner) {
      console.error('[Trade settlement] Owner not found; refusing to credit the wrong account.', trade.userId);
      return;
    }
    const updatedBal = Number((tradeOwner.tradingBalance + finalReturn).toFixed(2));

    // Return the margin and realized P/L to the actual trade owner.
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
      updateUserBalanceInSupabase(trade.userId, updatedBal, tradeOwner.fundingBalance);
    }
  };

  const setTradeOutcome = (tradeId: string, outcome: 'WIN' | 'LOSS' | null, percent: number = 35) => {
    setTrades((prev) =>
      prev.map((t) =>
        t.id === tradeId
          ? {
              ...t,
              scheduledOutcome: outcome,
              scheduledPercent: percent,
            }
          : t
      )
    );
    const target = trades.find((t) => t.id === tradeId);
    if (target && isSupabaseConfigured()) {
      syncTradeToSupabase({
        ...target,
        scheduledOutcome: outcome,
        scheduledPercent: percent,
      }).catch((e) => console.warn('Schedule outcome sync notice:', e));
    }
  };

  const adminSettleTrade = (tradeId: string, outcome: 'WIN' | 'LOSS', percent: number = 35) => {
    const trade = trades.find((t) => t.id === tradeId);
    if (!trade || trade.status !== 'OPEN') return;

    let finalExitPrice = trade.currentPrice;
    let finalPnl = 0;
    let finalPnlPercent = 0;

    if (outcome === 'WIN') {
      finalPnl = Number((trade.margin * (percent / 100)).toFixed(2));
      finalPnlPercent = percent;
      if (trade.type === 'BUY') {
        finalExitPrice = Number((trade.entryPrice * (1 + (percent / 100) / trade.leverage)).toFixed(trade.entryPrice > 100 ? 2 : 4));
      } else {
        finalExitPrice = Number((trade.entryPrice * (1 - (percent / 100) / trade.leverage)).toFixed(trade.entryPrice > 100 ? 2 : 4));
      }
    } else {
      const lossPct = percent || 100;
      finalPnl = -Number((trade.margin * (lossPct / 100)).toFixed(2));
      finalPnlPercent = -lossPct;
      if (trade.type === 'BUY') {
        finalExitPrice = Number((trade.entryPrice * (1 - (lossPct / 100) / trade.leverage)).toFixed(trade.entryPrice > 100 ? 2 : 4));
      } else {
        finalExitPrice = Number((trade.entryPrice * (1 + (lossPct / 100) / trade.leverage)).toFixed(trade.entryPrice > 100 ? 2 : 4));
      }
    }

    const finalReturn = Math.max(0, Number((trade.margin + finalPnl).toFixed(2)));

    // Credit target user's tradingBalance
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === trade.userId) {
          const newTradingBal = Number((u.tradingBalance + finalReturn).toFixed(2));
          if (isSupabaseConfigured()) {
            updateUserBalanceInSupabase(u.id, newTradingBal, u.fundingBalance);
          }
          return { ...u, tradingBalance: newTradingBal };
        }
        return u;
      })
    );

    const closedTrade: Trade = {
      ...trade,
      status: 'CLOSED',
      currentPrice: finalExitPrice,
      exitPrice: finalExitPrice,
      pnl: Number(finalPnl.toFixed(2)),
      pnlPercent: Number(finalPnlPercent.toFixed(2)),
      scheduledOutcome: outcome,
      scheduledPercent: percent,
      closedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    setTrades((prev) => prev.map((t) => (t.id === tradeId ? closedTrade : t)));

    if (isSupabaseConfigured()) {
      syncTradeToSupabase(closedTrade).catch((err) => console.warn('Admin settle sync error:', err));
    }

    logAuditAction(
      'ADMIN_SETTLE_TRADE',
      `${trade.userName} (${trade.userId})`,
      `Trade #${trade.id} settled as ${outcome} (${percent}% profit/loss) with Exit Price: $${finalExitPrice}`
    );
  };

  // Support System
  const sendUserMessage = async (
    text: string,
    attachment?: { url: string; name: string; type: 'image' | 'file' }
  ): Promise<{ success: boolean; message: string; ticketId?: string }> => {
    if (!text.trim() && !attachment) return { success: false, message: 'Enter a message or attach a file.' };
    if (!isFirebaseConfigured()) {
      return { success: false, message: 'Firebase Support connection is unavailable. Your message was not sent.' };
    }

    const nowStr = new Date().toISOString();
    const displaySummary = text.trim() || (attachment ? `📎 [${attachment.type === 'image' ? 'Photo' : 'File'}] ${attachment.name}` : '');
    const newMsg: SupportMessage = {
      id: `msg-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender: 'user',
      senderName: currentUser.name,
      text: text.trim(),
      timestamp: nowStr,
      read: false,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type,
    };

    const userTickets = supportTickets.filter((t) => t.userId === currentUser.id);
    const activeTicket = userTickets.find((t) => !t.isSessionClosed && t.status !== 'closed');
    const updatedTicket: SupportTicket = activeTicket
      ? {
          ...activeTicket,
          status: 'pending',
          isSessionClosed: false,
          lastMessage: displaySummary,
          lastMessageTime: nowStr,
          unreadAdminCount: (activeTicket.unreadAdminCount || 0) + 1,
          messages: [...(activeTicket.messages || []), newMsg],
        }
      : {
          id: `ticket-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          status: 'pending',
          isSessionClosed: false,
          sessionNumber: 240 + userTickets.length + 1,
          lastMessage: displaySummary,
          lastMessageTime: nowStr,
          unreadAdminCount: 1,
          unreadUserCount: 0,
          messages: [newMsg],
        };

    const save = await persistSupportTicket(updatedTicket);
if (!save.success) {
      console.error('[Firebase Support] User message save failed:', save.error);
      return { success: false, message: `Message was not sent because Firebase saving failed. ${save.error || ''}`.trim() };
    }

    const updatedList = activeTicket
      ? supportTickets.map((t) => t.id === activeTicket.id ? updatedTicket : t)
      : [updatedTicket, ...supportTickets];
    setSupportTickets(updatedList.sort(
      (x, y) => new Date(y.lastMessageTime || 0).getTime() - new Date(x.lastMessageTime || 0).getTime()
    ));
    return { success: true, message: 'Message sent successfully.', ticketId: updatedTicket.id };
  };

  const startNewSupportChat = async (userId?: string): Promise<{ success: boolean; message: string; ticketId?: string }> => {
    const targetId = userId || currentUser.id;
    const targetUser = users.find((u) => u.id === targetId) || currentUser;
    if (!isFirebaseConfigured()) {
      return { success: false, message: 'Firebase Support connection is unavailable. A new chat was not opened.' };
    }

    const nowStr = new Date().toISOString();
    const userTickets = supportTickets.filter((t) => t.userId === targetId);
    const sessionNum = 240 + userTickets.length + 1;
    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: targetUser.id,
      userName: targetUser.name,
      userEmail: targetUser.email,
      status: 'pending',
      isSessionClosed: false,
      sessionNumber: sessionNum,
      lastMessage: '',
      lastMessageTime: nowStr,
      unreadAdminCount: 0,
      unreadUserCount: 0,
      messages: [],
    };

    const previouslyOpen = userTickets.filter((t) => !t.isSessionClosed && t.status !== 'closed');
    const saves = await Promise.all([
        ...previouslyOpen.map((ticket) =>
          persistSupportTicket({ ...ticket, status: 'closed', isSessionClosed: true })
        ),
        persistSupportTicket(newTicket),
      ]);
      const failed = saves.find((result) => !result.success);
if (failed) {
      console.error('[Firebase Support] New session save failed:', failed.error);
      return { success: false, message: `A new chat could not be saved. ${failed.error || ''}`.trim() };
    }

    setSupportTickets((prev) => {
      const updated = prev.map((ticket) =>
        ticket.userId === targetId && !ticket.isSessionClosed && ticket.status !== 'closed'
          ? { ...ticket, isSessionClosed: true, status: 'closed' as TicketStatus }
          : ticket
      );
      return [newTicket, ...updated];
    });

    logAuditAction(
      'NEW_SUPPORT_TICKET_STARTED',
      `${targetUser.name} (${targetUser.uid})`,
      'New support session thread started by user.'
    );
    return { success: true, message: 'Support chat opened.', ticketId: newTicket.id };
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
    if (targetTicket) {
      void persistSupportTicket({ ...targetTicket, status: 'closed', isSessionClosed: true }).then((result) => {
        if (!result.success) console.error('[Firebase Support] Close ticket save failed:', result.error);
      });
    }
    logAuditAction(
      'SUPPORT_SESSION_CLOSED',
      targetTicket ? `${targetTicket.userName} (${targetTicket.userId})` : ticketId,
      'Support chat session closed by Administrator.'
    );
  };

  const reopenSupportSession = (ticketId: string) => {
    const target = supportTickets.find((ticket) => ticket.id === ticketId);
    if (!target) return;
    const nowStr = new Date().toISOString();
    const updated = {
      ...target,
      status: 'pending' as const,
      isSessionClosed: false,
      lastMessageTime: nowStr,
    };
    setSupportTickets((prev) => prev.map((ticket) => ticket.id === ticketId ? updated : ticket));
    {
      void persistSupportTicket(updated).then((result) => {
        if (!result.success) console.error('[Support] Reopened ticket was not saved:', result.error);
      });
    }
  };

  const deleteSupportTicket = (ticketId: string) => {
    const targetTicket = supportTickets.find((ticket) => ticket.id === ticketId);
    setSupportTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId));
    {
      void deleteFirebaseDocument('supportTickets', ticketId).catch((error) => {
        console.error('[Firebase Support] Ticket deletion failed:', error);
      });
    }
    logAuditAction(
      'SUPPORT_TICKET_DELETED',
      targetTicket ? `${targetTicket.userName} (#${targetTicket.id.slice(-6)})` : ticketId,
      'Support chat session permanently deleted by Administrator.'
    );
  };

  const editSupportMessage = (ticketId: string, messageId: string, newText: string) => {
    if (!newText.trim()) return;
    setSupportTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const updatedMsgs = t.messages.map((m) =>
          m.id === messageId ? { ...m, text: newText.trim(), isEdited: true } : m
        );
        const updatedTicket = { ...t, messages: updatedMsgs };
        {
          persistSupportTicket(updatedTicket).catch((e) => console.warn('Edit msg sync notice:', e));
        }
        return updatedTicket;
      })
    );
  };

  const deleteSupportMessageForEveryone = (ticketId: string, messageId: string) => {
    setSupportTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const updatedMsgs = t.messages.map((m) =>
          m.id === messageId
            ? {
                ...m,
                text: '🚫 This message was deleted',
                isDeleted: true,
                attachmentUrl: undefined,
                attachmentName: undefined,
              }
            : m
        );
        const updatedTicket = { ...t, messages: updatedMsgs };
        {
          persistSupportTicket(updatedTicket).catch((e) => console.warn('Delete msg sync notice:', e));
        }
        return updatedTicket;
      })
    );
  };

  const sendAdminReply = async (
    ticketId: string,
    text: string,
    attachment?: { url: string; name: string; type: 'image' | 'file' }
  ): Promise<{ success: boolean; message: string }> => {
    if (!text.trim() && !attachment) return { success: false, message: 'Enter a reply or attach a file.' };
    if (!isFirebaseConfigured()) {
      return { success: false, message: 'Firebase Support connection is unavailable. The reply was not sent.' };
    }

    const ticket = supportTickets.find((item) => item.id === ticketId);
    if (!ticket) {
      console.error('[Support] Cannot reply: selected ticket was not found.', ticketId);
      return { success: false, message: 'Selected support conversation was not found. Refresh the Inbox and try again.' };
    }

    const nowStr = new Date().toISOString();
    const displaySummary = text.trim() || (attachment ? `📎 [${attachment.type === 'image' ? 'Photo' : 'File'}] ${attachment.name}` : '');
    const newMsg: SupportMessage = {
      id: `msg-admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender: 'admin',
      senderName: adminName,
      text: text.trim(),
      timestamp: nowStr,
      read: false,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type,
    };
    const updatedTicket: SupportTicket = {
      ...ticket,
      status: 'answered',
      isSessionClosed: false,
      lastMessage: displaySummary,
      lastMessageTime: nowStr,
      unreadAdminCount: 0,
      unreadUserCount: (ticket.unreadUserCount || 0) + 1,
      messages: [...(ticket.messages || []), newMsg],
    };

    const save = await persistSupportTicket(updatedTicket);
if (!save.success) {
      console.error('[Firebase Support] Admin reply save failed:', save.error);
      return { success: false, message: `Reply was not sent because Firebase saving failed. ${save.error || ''}`.trim() };
    }

    setSupportTickets((prev) => prev.map((item) => item.id === ticket.id ? updatedTicket : item)
      .sort((x, y) => new Date(y.lastMessageTime || 0).getTime() - new Date(x.lastMessageTime || 0).getTime()));
    logAuditAction(
      'SUPPORT_REPLY',
      `${ticket.userName} (${ticket.userId})`,
      'Admin sent reply to support query.'
    );
    return { success: true, message: 'Reply sent successfully.' };
  };

  // Add a shared system event to the conversation without sending an admin chat bubble.
  const addSupportSystemNotification = (ticketId: string, text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    const ticket = supportTickets.find((item) => item.id === ticketId);
    if (!ticket || ticket.isSessionClosed || ticket.status === 'closed') return;

    const nowStr = new Date().toISOString();
    const notification: SupportMessage = {
      id: `msg-system-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender: 'admin',
      senderName: 'CPT Markets System',
      text: cleanText,
      timestamp: nowStr,
      read: false,
      isSystem: true,
    };

    const updatedTicket: SupportTicket = {
      ...ticket,
      lastMessage: cleanText,
      lastMessageTime: nowStr,
      unreadAdminCount: 0,
      unreadUserCount: (ticket.unreadUserCount || 0) + 1,
      messages: [...(ticket.messages || []), notification],
    };

    setSupportTickets((prev) => {
      if (!prev.some((item) => item.id === ticket.id)) return prev;
      return prev
        .map((item) => item.id === ticket.id ? updatedTicket : item)
        .sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime());
    });

    {
      void persistSupportTicket(updatedTicket).then((result) => {
        if (!result.success) console.error('[Support] System notification was not saved:', result.error);
      });
    }

    logAuditAction(
      'SUPPORT_SYSTEM_NOTIFICATION',
      `${ticket.userName} (${ticket.userId})`,
      `Admin posted system status notification: ${cleanText}`
    );
  };

  const updateTicketStatus = (ticketId: string, status: TicketStatus) => {
    const target = supportTickets.find((ticket) => ticket.id === ticketId);
    if (!target) return;
    const updated = {
      ...target,
      status,
      isSessionClosed: status === 'closed',
    };
    setSupportTickets((prev) => prev.map((ticket) => ticket.id === ticketId ? updated : ticket));
    {
      void persistSupportTicket(updated).then((result) => {
        if (!result.success) console.error('[Support] Ticket status was not saved:', result.error);
      });
    }
  };

  const markUserChatAsRead = () => {
    const unreadTickets = supportTickets.filter(
      (ticket) => ticket.userId === currentUser.id && ticket.unreadUserCount > 0
    );
    setSupportTickets((prev) =>
      prev.map((ticket) =>
        ticket.userId === currentUser.id ? { ...ticket, unreadUserCount: 0 } : ticket
      )
    );
    {
      unreadTickets.forEach((ticket) => {
        void persistSupportTicket({ ...ticket, unreadUserCount: 0 }).then((result) => {
          if (!result.success) console.error('[Support] Read status was not saved:', result.error);
        });
      });
    }
  };

  const setUserViewingSupport = (userId: string, isViewing: boolean) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (!isViewing) {
      setActiveSupportUsers((prev) => prev.filter((p) => p.userId !== userId));
      return;
    }

    const now = new Date();
    const nowStr = now.toISOString();

    // Live presence: visible while the customer is inside the Support window.
    setActiveSupportUsers((prev) => {
      if (prev.some((p) => p.userId === userId)) return prev;
      return [{ userId, userName: targetUser.name, uid: targetUser.uid, enteredAt: nowStr }, ...prev];
    });

    // Persist every Support entry in the matching conversation so Admin can review
    // the visit timeline even after the customer has left the Support window.
    const activeTicket = supportTickets.find(
      (ticket) => ticket.userId === userId && !ticket.isSessionClosed && ticket.status !== 'closed'
    );
    const visitEvent: SupportMessage = {
      id: `msg-visit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender: 'user',
      senderName: targetUser.name,
      text: 'Customer entered Support',
      timestamp: nowStr,
      read: true,
      isVisitEvent: true,
    };

    const updatedTicket: SupportTicket = activeTicket
      ? {
          ...activeTicket,
          lastMessage: visitEvent.text,
          lastMessageTime: nowStr,
          messages: [...(activeTicket.messages || []), visitEvent],
        }
      : {
          id: `ticket-visit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: targetUser.id,
          userName: targetUser.name,
          userEmail: targetUser.email,
          status: 'pending',
          isSessionClosed: false,
          sessionNumber: 240 + supportTickets.filter((ticket) => ticket.userId === userId).length + 1,
          lastMessage: visitEvent.text,
          lastMessageTime: nowStr,
          unreadAdminCount: 0,
          unreadUserCount: 0,
          messages: [visitEvent],
        };

    setSupportTickets((prev) => {
      const exists = prev.some((ticket) => ticket.id === updatedTicket.id);
      const updated = exists
        ? prev.map((ticket) => ticket.id === updatedTicket.id ? updatedTicket : ticket)
        : [updatedTicket, ...prev];
      return updated.sort(
        (a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
      );
    });

    {
      void persistSupportTicket(updatedTicket).then((result) => {
        if (!result.success) console.error('[Support] Customer Support visit was not saved:', result.error);
      });
    }
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
  const submitDepositRequest = async ({
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
  }): Promise<{ success: boolean; message: string }> => {
    if (import.meta.env.PROD && !isSupabaseConfigured()) {
      return { success: false, message: 'Cloud connection is unavailable. The deposit request was not submitted.' };
    }
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
    if (isSupabaseConfigured()) {
      const saved = await syncDepositToSupabase(newReq);
      if (!saved.success) {
        console.error('[Deposit] Cloud save failed:', saved.error);
        return { success: false, message: `Deposit request was not submitted. ${saved.error || ''}`.trim() };
      }
    }
    setDepositRequests((prev) => [newReq, ...prev]);
    return { success: true, message: 'Deposit request submitted and saved for Admin review.' };
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
    if (currentUser.status === 'suspended' || currentUser.status === 'archived') {
      return { success: false, message: 'This account cannot submit withdrawals. Please contact Support.' };
    }
    if (amount < systemSettings.minWithdrawal) {
      return { success: false, message: `Minimum withdrawal is $${systemSettings.minWithdrawal}.` };
    }

    const isFunding = wallet === 'funding';
    const available = isFunding ? (currentUser.fundingBalance || 0) : (currentUser.tradingBalance || 0);
    if (available < amount) {
      return { success: false, message: `Insufficient ${isFunding ? 'Funding' : 'Trading'} balance ($${available.toFixed(2)} available).` };
    }
    if (import.meta.env.PROD && !isSupabaseConfigured()) {
      return { success: false, message: 'Cloud connection is unavailable. The withdrawal was not submitted and no balance was deducted.' };
    }

    const oldFunding = currentUser.fundingBalance || 0;
    const oldTrading = currentUser.tradingBalance || 0;
    const newFunding = isFunding ? Number((oldFunding - amount).toFixed(2)) : oldFunding;
    const newTrading = isFunding ? oldTrading : Number((oldTrading - amount).toFixed(2));
    const newReq: WithdrawalRequest = {
      id: `wth-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      amount,
      accountHolderName,
      bankOrAddress,
      network,
      withdrawalType,
      sourceWallet: isFunding ? 'funding' : 'trading',
      notes,
      status: 'pending',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    if (isSupabaseConfigured()) {
      const balanceSave = await updateUserBalanceInSupabase(currentUser.id, newTrading, newFunding);
      if (!balanceSave.success) {
        return { success: false, message: `Withdrawal not submitted: balance could not be saved. ${balanceSave.error || ''}`.trim() };
      }
      const requestSave = await syncWithdrawalToSupabase(newReq);
      if (!requestSave.success) {
        const rollback = await updateUserBalanceInSupabase(currentUser.id, oldTrading, oldFunding);
        console.error('[Withdrawal] Request save failed; balance rollback:', rollback.success, requestSave.error);
        return { success: false, message: `Withdrawal not submitted because cloud saving failed. ${requestSave.error || ''}`.trim() };
      }
    }

    setUsers((prev) => prev.map((u) => u.id === currentUser.id
      ? { ...u, tradingBalance: newTrading, fundingBalance: newFunding }
      : u
    ));
    setWithdrawalRequests((prev) => [newReq, ...prev]);
    logAuditAction(
      'WITHDRAWAL_REQUESTED',
      `${currentUser.name} (${currentUser.uid})`,
      `Submitted $${amount.toFixed(2)} withdrawal from ${isFunding ? 'Funding' : 'Trading'} Wallet.`
    );
    return {
      success: true,
      message: `Withdrawal request of $${amount.toFixed(2)} from ${isFunding ? 'Funding' : 'Trading'} Wallet submitted and saved for Admin review.`,
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

    const targetUser = users.find((u) => u.id === wth.userId);
    const isFunding = wth.sourceWallet === 'funding';

    const prevTrading = targetUser ? targetUser.tradingBalance : 0;
    const prevFunding = targetUser ? targetUser.fundingBalance : 0;

    const refundedTrading = isFunding ? prevTrading : Number((prevTrading + wth.amount).toFixed(2));
    const refundedFunding = isFunding ? Number((prevFunding + wth.amount).toFixed(2)) : prevFunding;

    // Refund back to user's wallet
    setUsers((prev) =>
      prev.map((u) =>
        u.id === wth.userId
          ? { ...u, tradingBalance: refundedTrading, fundingBalance: refundedFunding }
          : u
      )
    );
    updateUserBalanceInSupabase(wth.userId, refundedTrading, refundedFunding);

    setWithdrawalRequests((prev) =>
      prev.map((w) =>
        w.id === withdrawalId
          ? {
              ...w,
              status: 'rejected',
              rejectReason: reason,
              notes: reason,
              reviewedBy: adminName,
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : w
      )
    );
    updateWithdrawalStatusInSupabase(withdrawalId, 'rejected', reason);

    logAuditAction(
      'WITHDRAWAL_REJECTED',
      `${wth.userName} (#${wth.id})`,
      `Rejected $${wth.amount.toLocaleString()} withdrawal and refunded to ${isFunding ? 'Funding' : 'Trading'} Wallet. Reason: ${reason}`
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
    if (isSupabaseConfigured()) {
      void syncAuditLogToSupabase(newLog).then((result) => {
        if (!result.success) console.error('[Audit] Activity log was not saved:', result.error);
      });
    }
  };

  const adminTransferFunds = ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'Customer account not found.' };
    if (!Number.isFinite(amount) || amount <= 0) return { success: false, message: 'Enter a valid amount greater than zero.' };
    if (target.fundingBalance < amount) return { success: false, message: `Insufficient Funding Balance. Available: ${target.fundingBalance.toFixed(2)}.` };
    if (!reason.trim()) return { success: false, message: 'A reason is required for the audit trail.' };

    const oldFunding = Number((target.fundingBalance || 0).toFixed(2));
    const oldTrading = Number((target.tradingBalance || 0).toFixed(2));
    const newFunding = Number((oldFunding - amount).toFixed(2));
    const newTrading = Number((oldTrading + amount).toFixed(2));

    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, fundingBalance: newFunding, tradingBalance: newTrading } : u));
    updateUserBalanceInSupabase(userId, newTrading, newFunding);

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const entries: BalanceAdjustment[] = [
      { id: `adj-${Date.now()}-funding`, userId, userName: target.name, amount: -amount, type: 'correction', previousBalance: oldFunding, newBalance: newFunding, reason: `[Admin Transfer: Funding → Trading] ${reason}`, adminId: 'admin-01', adminName, timestamp },
      { id: `adj-${Date.now()}-trading`, userId, userName: target.name, amount, type: 'correction', previousBalance: oldTrading, newBalance: newTrading, reason: `[Admin Transfer: Funding → Trading] ${reason}`, adminId: 'admin-01', adminName, timestamp },
    ];
    setBalanceAdjustments((prev) => [...entries, ...prev]);
    logAuditAction('ADMIN_WALLET_TRANSFER', `${target.name} (${target.uid})`, `Transferred ${amount.toFixed(2)} from Funding Wallet to Trading Wallet. Reason: ${reason}`);
    return { success: true, message: `Transferred ${amount.toFixed(2)} from Funding to Trading for ${target.name}.` };
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

    const currentFunding = Number((currentUser.fundingBalance || 0).toFixed(2));
    const currentTrading = Number((currentUser.tradingBalance || 0).toFixed(2));

    if (fromWallet === 'funding') {
      if (currentFunding < amount) {
        return {
          success: false,
          message: `Insufficient Funding balance ($${currentFunding.toFixed(2)} available).`,
        };
      }

      const newFunding = Number((currentFunding - amount).toFixed(2));
      const newTrading = Number((currentTrading + amount).toFixed(2));

      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id
            ? {
                ...u,
                fundingBalance: newFunding,
                tradingBalance: newTrading,
              }
            : u
        )
      );

      // Persist to Supabase immediately so background sync/realtime preserves the new balances
      updateUserBalanceInSupabase(currentUser.id, newTrading, newFunding);

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

      const newTrading = Number((currentTrading - amount).toFixed(2));
      const newFunding = Number((currentFunding + amount).toFixed(2));

      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id
            ? {
                ...u,
                tradingBalance: newTrading,
                fundingBalance: newFunding,
              }
            : u
        )
      );

      // Persist to Supabase immediately so background sync/realtime preserves the new balances
      updateUserBalanceInSupabase(currentUser.id, newTrading, newFunding);

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
        updateClientAgreementStatus,
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
        setTradeOutcome,
        adminSettleTrade,
        supportTickets,
        activeSupportUsers,
        setUserViewingSupport,
        sendUserMessage,
        sendAdminReply,
        addSupportSystemNotification,
        updateTicketStatus,
        closeSupportSession,
        reopenSupportSession,
        startNewSupportChat,
        deleteSupportTicket,
        editSupportMessage,
        deleteSupportMessageForEveryone,
        markUserChatAsRead,
        language,
        setLanguage,
        balanceAdjustments,
        adjustUserBalance,
        adminTransferFunds,
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


