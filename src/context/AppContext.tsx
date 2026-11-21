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
import { registerWithFirebase, loginOrMigrateWithFirebase, updateFirebasePassword, logoutFromFirebase } from '../lib/firebaseAuth';
import { saveFirebaseDocument, deleteFirebaseDocument, subscribeFirebaseCollection, fetchFirebaseCollection, settleFirebaseTrade } from '../lib/firebaseData';
import { isFirebaseConfigured } from '../lib/firebase';

interface AppContextType {
  // Firebase Cloud Sync
  refreshAllFromFirebase: () => Promise<void>;
  migrateCachedDataToFirebase: () => Promise<{ success: boolean; summary: string }>;
  isFirebaseSynced: boolean;

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
  setTradeOutcome: (tradeId: string, outcome: 'WIN' | 'LOSS' | null, percent?: number) => Promise<{ success: boolean; message: string }>;
  adminSettleTrade: (tradeId: string, outcome: 'WIN' | 'LOSS', percent?: number) => Promise<{ success: boolean; message: string }>;

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
  // Firestore rejects undefined values, so omit optional fields before saving.
  const removeUndefinedSupportValues = (value: any): any => {
    if (Array.isArray(value)) {
      return value.map((item) => item === undefined ? null : removeUndefinedSupportValues(item));
    }
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, item]) => item !== undefined)
          .map(([key, item]) => [key, removeUndefinedSupportValues(item)])
      );
    }
    return value;
  };

  const persistSupportTicket = async (ticket: SupportTicket): Promise<{ success: boolean; error?: string }> => {
    if (!isFirebaseConfigured()) return { success: false, error: 'Firebase is not configured.' };
    try {
      const firestoreSafeTicket = removeUndefinedSupportValues(ticket) as SupportTicket;
      await saveFirebaseDocument('supportTickets', ticket.id, firestoreSafeTicket);
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
  // Prevent repeated expiry attempts in this tab while the Firestore transaction runs.
  const settlingTradeIdsRef = useRef<Set<string>>(new Set());

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

  const [marketDataMode, setMarketDataModeState] = useState<'live_stream' | 'manual_benchmark'>(() =>
    loadState('marketDataMode', 'live_stream')
  );
  const setMarketDataMode = (mode: 'live_stream' | 'manual_benchmark') => {
    setMarketDataModeState(mode);
    if (isFirebaseConfigured()) {
      void saveFirebaseDocument('marketSettings', 'global', { marketDataMode: mode })
        .catch((error) => console.warn('[Firebase Market] Market mode sync failed:', error));
    }
  };

  useEffect(() => {
    safeStorageSet('marketDataMode', marketDataMode);
  }, [marketDataMode]);

  // Keep the application and Admin portal usable if a device has a stale empty local users cache.
  const currentUser = users.find((u) => u.id === currentUserId) || users[0] || initialUsers.find((u) => u.role === 'superadmin') || initialUsers[0];
  const isSuperAdmin =
    currentUser.role === 'superadmin' ||
    currentUser.email === 'ripuworkshop@gmail.com' ||
    currentUser.uid === '100001';
  const activeCoin = coins.find((c) => c.symbol === selectedSymbol) || coins[0];

  const [isFirebaseSynced, setIsFirebaseSynced] = useState<boolean>(() => isFirebaseConfigured());

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

  // Firebase is the single cloud source for account, trade, support and request data.
  const mergeCloudItems = <T extends { id: string }>(previous: T[], incoming: T[]): T[] => {
    const merged = new Map(previous.map((item) => [item.id, item]));
    incoming.forEach((item) => {
      merged.set(item.id, { ...merged.get(item.id), ...item } as T);
    });
    return Array.from(merged.values());
  };

  const normalizeFirebaseUser = (value: any): User => ({
    ...value,
    id: String(value?.id || ''),
    uid: String(value?.uid || ''),
    name: String(value?.name || 'Unknown Customer'),
    email: String(value?.email || ''),
    phone: value?.phone ? String(value.phone) : undefined,
    tradingBalance: Number(value?.tradingBalance || 0),
    fundingBalance: Number(value?.fundingBalance || 0),
    status: value?.status === 'suspended' || value?.status === 'archived' ? value.status : 'active',
    isOnline: Boolean(value?.isOnline),
    createdAt: String(value?.createdAt || ''),
    lastLogin: String(value?.lastLogin || ''),
  });

  const normalizeSupportTicket = (value: any): SupportTicket => ({
    ...value,
    id: String(value?.id || ''),
    userId: String(value?.userId || ''),
    userName: String(value?.userName || 'Unknown Customer'),
    userEmail: String(value?.userEmail || ''),
    status: value?.status === 'closed' || value?.status === 'answered' ? value.status : 'pending',
    lastMessage: String(value?.lastMessage || ''),
    lastMessageTime: String(value?.lastMessageTime || new Date().toISOString()),
    unreadAdminCount: Number(value?.unreadAdminCount || 0),
    unreadUserCount: Number(value?.unreadUserCount || 0),
    messages: Array.isArray(value?.messages)
      ? value.messages
          .filter((message: any) => message && typeof message === 'object')
          .map((message: any, index: number) => ({
            ...message,
            id: String(message.id || `message-${index}`),
            sender: message.sender === 'admin' ? 'admin' : 'user',
            senderName: String(message.senderName || (message.sender === 'admin' ? 'Admin Team' : value?.userName || 'Customer')),
            text: String(message.text || ''),
            timestamp: String(message.timestamp || value?.lastMessageTime || new Date().toISOString()),
            read: Boolean(message.read),
          }))
      : [],
  });

  const refreshAllFromFirebase = async () => {
    if (!isFirebaseConfigured()) {
      setIsFirebaseSynced(false);
      return;
    }
    const results = await Promise.allSettled([
      fetchFirebaseCollection<User>('users'),
      fetchFirebaseCollection<Trade>('trades'),
      fetchFirebaseCollection<DepositRequest>('deposits'),
      fetchFirebaseCollection<WithdrawalRequest>('withdrawals'),
      fetchFirebaseCollection<AuditLog>('auditLogs'),
      fetchFirebaseCollection<BalanceAdjustment>('balanceAdjustments'),
      fetchFirebaseCollection<SupportTicket>('supportTickets'),
      fetchFirebaseCollection<MarketCoin>('marketCoins'),
      fetchFirebaseCollection<{ marketDataMode?: 'live_stream' | 'manual_benchmark' }>('marketSettings'),
      fetchFirebaseCollection<SystemSettings>('systemSettings'),
    ]);

    if (results[0].status === 'fulfilled') setUsers((prev) => mergeCloudItems(prev, results[0].value.map(normalizeFirebaseUser)));
    if (results[1].status === 'fulfilled') setTrades((prev) => mergeCloudItems(prev, results[1].value));
    if (results[2].status === 'fulfilled') setDepositRequests((prev) => mergeCloudItems(prev, results[2].value));
    if (results[3].status === 'fulfilled') setWithdrawalRequests((prev) => mergeCloudItems(prev, results[3].value));
    if (results[4].status === 'fulfilled') {
      setAuditLogs((prev) => mergeCloudItems(prev, results[4].value).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    }
    if (results[5].status === 'fulfilled') {
      setBalanceAdjustments((prev) => mergeCloudItems(prev, results[5].value).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    }
    if (results[6].status === 'fulfilled') {
      setSupportTickets(results[6].value.map(normalizeSupportTicket).sort(
        (a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
      ));
    }
    if (results[7].status === 'fulfilled' && results[7].value.length > 0) {
      setCoins((prev) => {
        const map = new Map(prev.map((coin) => [coin.symbol, coin]));
        results[7].value.forEach((coin) => map.set(coin.symbol, { ...map.get(coin.symbol), ...coin }));
        return Array.from(map.values());
      });
    }
    if (results[8].status === 'fulfilled' && results[8].value[0]?.marketDataMode) {
      setMarketDataModeState(results[8].value[0].marketDataMode);
    }
    if (results[9].status === 'fulfilled' && results[9].value[0]) {
      setSystemSettings((prev) => ({ ...prev, ...results[9].value[0] }));
    }

    const coreDataLoaded = results[0].status === 'fulfilled' && results[1].status === 'fulfilled';
    setIsFirebaseSynced(coreDataLoaded);
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error('[Firebase Cloud Sync] Collection load failed:', ['users', 'trades', 'deposits', 'withdrawals', 'auditLogs', 'balanceAdjustments', 'supportTickets', 'marketCoins', 'marketSettings', 'systemSettings'][index], result.reason);
      }
    });
  };

  /**
   * Backfill this browser's retained legacy cache into Firebase without overwriting
   * documents already present in Firestore. Password fields are never uploaded.
   */
  const migrateCachedDataToFirebase = async (): Promise<{ success: boolean; summary: string }> => {
    if (!isFirebaseConfigured()) {
      return { success: false, summary: 'Firebase is not configured. No legacy records were copied.' };
    }

    try {
      const remoteUsers = await fetchFirebaseCollection<User>('users');
      const byId = new Map(remoteUsers.map((user) => [String(user.id), user]));
      const byEmail = new Map(remoteUsers.map((user) => [String(user.email || '').trim().toLowerCase(), user]));
      const byUid = new Map(remoteUsers.map((user) => [String(user.uid || ''), user]));
      const userIdMap = new Map<string, string>();
      const counts = { users: 0, trades: 0, deposits: 0, withdrawals: 0, support: 0, adjustments: 0, audit: 0 };
      const failures: string[] = [];
      const skippedDemoIds = new Set(['user-518294', 'user-739102', 'user-394821']);

      for (const user of users) {
        if (!user?.id || skippedDemoIds.has(user.id)) continue;
        const emailKey = String(user.email || '').trim().toLowerCase();
        const uidKey = String(user.uid || '');
        const emailMatch = emailKey ? byEmail.get(emailKey) : undefined;
        const uidMatch = uidKey ? byUid.get(uidKey) : undefined;
        const existing = byId.get(user.id) || emailMatch || (!emailKey ? uidMatch : undefined);
        if (!existing && uidMatch && emailKey && String(uidMatch.email || '').trim().toLowerCase() !== emailKey) {
          failures.push(`user ${user.email || user.id}: UID collision with a different Firebase email; left untouched`);
          continue;
        }
        if (existing) {
          userIdMap.set(user.id, existing.id);
          continue;
        }

        const { password: _legacyPassword, ...safeProfile } = user;
        try {
          await saveFirebaseDocument('users', user.id, safeProfile);
          byId.set(user.id, safeProfile as User);
          if (emailKey) byEmail.set(emailKey, safeProfile as User);
          if (uidKey) byUid.set(uidKey, safeProfile as User);
          userIdMap.set(user.id, user.id);
          counts.users += 1;
        } catch (error) {
          failures.push(`user ${user.email || user.id}: ${error instanceof Error ? error.message : 'save failed'}`);
        }
      }

      const migrateMissing = async <T extends { id: string }>(
        collectionName: string,
        items: T[],
        countKey: keyof typeof counts,
        transform: (item: T) => Record<string, unknown> = (item) => item as Record<string, unknown>
      ) => {
        const existing = await fetchFirebaseCollection<T>(collectionName);
        const knownIds = new Set(existing.map((item) => String(item.id)));
        for (const item of items) {
          if (!item?.id || knownIds.has(item.id)) continue;
          const sourceUserId = (item as T & { userId?: string }).userId;
          const mappedUserId = sourceUserId ? (userIdMap.get(sourceUserId) || sourceUserId) : undefined;
          const migrated = transform({
            ...item,
            ...(mappedUserId ? { userId: mappedUserId } : {}),
          } as T);
          // Firestore documents have a 1 MiB hard limit; skip oversized chat records safely.
          if (new TextEncoder().encode(JSON.stringify(migrated)).length > 900000) {
            failures.push(`${collectionName}/${item.id}: too large for a single Firestore document`);
            continue;
          }
          try {
            await saveFirebaseDocument(collectionName, item.id, migrated);
            knownIds.add(item.id);
            counts[countKey] += 1;
          } catch (error) {
            failures.push(`${collectionName}/${item.id}: ${error instanceof Error ? error.message : 'save failed'}`);
          }
        }
      };

      await migrateMissing('trades', trades, 'trades', (item) => ({ ...item }));
      await migrateMissing('deposits', depositRequests, 'deposits', (item) => ({ ...item }));
      await migrateMissing('withdrawals', withdrawalRequests, 'withdrawals', (item) => ({ ...item }));
      await migrateMissing('supportTickets', supportTickets, 'support', (item) => ({
        ...item,
        messages: Array.isArray((item as SupportTicket).messages) ? (item as SupportTicket).messages : [],
      }));
      await migrateMissing('balanceAdjustments', balanceAdjustments, 'adjustments', (item) => ({ ...item }));
      await migrateMissing('auditLogs', auditLogs, 'audit', (item) => ({ ...item }));

      const summary = [
        `Copied missing records: ${counts.users} users, ${counts.trades} trades, ${counts.deposits} deposits, ${counts.withdrawals} withdrawals, ${counts.support} support tickets, ${counts.adjustments} balance adjustments, ${counts.audit} audit logs.`,
        'Existing Firebase documents were left unchanged. Legacy passwords were not copied.',
        failures.length ? `Items not copied: ${failures.length}. First issue: ${failures[0]}` : 'No item-level errors were reported.',
      ].join(' ');
      return { success: failures.length === 0, summary };
    } catch (error) {
      console.error('[Firebase Legacy Backfill] Failed:', error);
      return { success: false, summary: error instanceof Error ? error.message : 'Could not read the local cache or Firebase collections.' };
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setIsFirebaseSynced(false);
      return;
    }

    let isMounted = true;
    let usersReady = false;
    let tradesReady = false;
    const onError = (collectionName: string) => (error: Error) => {
      console.error(`[Firebase ${collectionName}] Realtime listener failed:`, error);
      if (collectionName === 'users' || collectionName === 'trades') setIsFirebaseSynced(false);
    };

    const unsubscribers = [
      subscribeFirebaseCollection<User>('users', (items) => {
        if (!isMounted) return;
        usersReady = true;
        setUsers((prev) => mergeCloudItems(prev, items.map(normalizeFirebaseUser)));
        setIsFirebaseSynced(usersReady && tradesReady);
      }, onError('users')),
      subscribeFirebaseCollection<Trade>('trades', (items) => {
        if (!isMounted) return;
        tradesReady = true;
        setTrades((prev) => mergeCloudItems(prev, items).sort(
          (a, b) => new Date(b.openedAt || 0).getTime() - new Date(a.openedAt || 0).getTime()
        ));
        setIsFirebaseSynced(usersReady && tradesReady);
      }, onError('trades')),
      subscribeFirebaseCollection<DepositRequest>('deposits', (items) => {
        if (isMounted) setDepositRequests((prev) => mergeCloudItems(prev, items));
      }, onError('deposits')),
      subscribeFirebaseCollection<WithdrawalRequest>('withdrawals', (items) => {
        if (isMounted) setWithdrawalRequests((prev) => mergeCloudItems(prev, items));
      }, onError('withdrawals')),
      subscribeFirebaseCollection<AuditLog>('auditLogs', (items) => {
        if (isMounted) setAuditLogs((prev) => mergeCloudItems(prev, items).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      }, onError('auditLogs')),
      subscribeFirebaseCollection<BalanceAdjustment>('balanceAdjustments', (items) => {
        if (isMounted) setBalanceAdjustments((prev) => mergeCloudItems(prev, items).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      }, onError('balanceAdjustments')),
      subscribeFirebaseCollection<SupportTicket>('supportTickets', (items) => {
        if (!isMounted) return;
        setSupportTickets(items.map(normalizeSupportTicket).sort(
          (a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
        ));
      }, onError('supportTickets')),
      subscribeFirebaseCollection<MarketCoin>('marketCoins', (items) => {
        if (!isMounted || items.length === 0) return;
        setCoins((prev) => {
          const map = new Map(prev.map((coin) => [coin.symbol, coin]));
          items.forEach((coin) => map.set(coin.symbol, { ...map.get(coin.symbol), ...coin }));
          return Array.from(map.values());
        });
      }, onError('marketCoins')),
      subscribeFirebaseCollection<{ marketDataMode?: 'live_stream' | 'manual_benchmark' }>('marketSettings', (items) => {
        if (isMounted && items[0]?.marketDataMode) setMarketDataModeState(items[0].marketDataMode);
      }, onError('marketSettings')),
      subscribeFirebaseCollection<SystemSettings>('systemSettings', (items) => {
        if (isMounted && items[0]) setSystemSettings((prev) => ({ ...prev, ...items[0] }));
      }, onError('systemSettings')),
    ];

    void refreshAllFromFirebase();
    return () => {
      isMounted = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
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

  // Dedicated fast 500ms timer loop: auto-expiry uses the same atomic settlement as Admin.
  useEffect(() => {
    // Admin monitoring must never settle customer positions from the Admin browser's
    // independent market feed. Only the customer-side trading session runs this timer.
    try {
      if (typeof window !== 'undefined' && window.sessionStorage.getItem('cpt_admin_auth') === 'true') return;
    } catch {
      // Continue safely when session storage is unavailable.
    }

    const timer = setInterval(() => {
      const now = new Date();
      const nowMs = now.getTime();

      setTrades((prevTrades) => {
        if (!prevTrades.some((trade) => trade.status === 'OPEN')) return prevTrades;

        return prevTrades.map((trade) => {
          if (trade.status !== 'OPEN') return trade;

          let expiryMs = trade.expiresAtMs;
          if (!expiryMs || isNaN(expiryMs) || expiryMs <= 0) {
            if (trade.expiresAt && trade.expiresAt.includes('T')) {
              expiryMs = new Date(trade.expiresAt).getTime();
            } else if (trade.expiresAt) {
              expiryMs = new Date(trade.expiresAt.replace(' ', 'T') + 'Z').getTime() || new Date(trade.expiresAt).getTime();
            }
          }

          if (!expiryMs || isNaN(expiryMs) || expiryMs <= 0) {
            const openedMs = trade.openedAt ? new Date(trade.openedAt).getTime() : 0;
            if (openedMs > 0 && !isNaN(openedMs)) expiryMs = openedMs + (trade.durationMinutes || 1) * 60 * 1000;
          }

          const openedTime = trade.openedAt ? new Date(trade.openedAt).getTime() : 0;
          const isFreshTrade = openedTime > 0 && nowMs - openedTime < 10000;
          const isExpired = !isFreshTrade && typeof expiryMs === 'number' && expiryMs > 0 && !Number.isNaN(expiryMs) && nowMs >= expiryMs;
          const targetCoin = coins.find((coin) => coin.symbol === trade.symbol);
          const currentPrice = targetCoin ? targetCoin.price : trade.currentPrice;

          if (isExpired) {
            if (isFirebaseConfigured() && !settlingTradeIdsRef.current.has(trade.id)) {
              settlingTradeIdsRef.current.add(trade.id);
              const scheduled = trade.scheduledOutcome === 'WIN' || trade.scheduledOutcome === 'LOSS'
                ? trade.scheduledOutcome
                : 'MARKET';
              void settleFirebaseTrade({
                tradeId: trade.id,
                outcome: scheduled,
                percent: trade.scheduledPercent,
                marketPrice: currentPrice,
                closedAt: now.toISOString().replace('T', ' ').slice(0, 19),
              }).then((result) => {
                setTrades((items) => items.map((item) => item.id === trade.id ? result.trade as Trade : item));
                setUsers((items) => items.map((user) =>
                  user.id === result.userId ? { ...user, tradingBalance: result.tradingBalance } : user
                ));
              }).catch((error) => {
                console.error('[Firebase Trade] Atomic auto-settlement failed:', error, trade.id);
              }).finally(() => {
                settlingTradeIdsRef.current.delete(trade.id);
              });
            }
            // Keep the local position OPEN until Firestore confirms the transaction.
            return trade;
          }

          const livePnl = trade.type === 'BUY'
            ? ((currentPrice - trade.entryPrice) / trade.entryPrice) * trade.positionSize
            : ((trade.entryPrice - currentPrice) / trade.entryPrice) * trade.positionSize;
          const livePnlRounded = Number(livePnl.toFixed(2));
          const livePnlPercent = trade.margin > 0 ? Number((livePnl / trade.margin * 100).toFixed(2)) : 0;
          const lastSyncedAt = lastTradeCloudSyncRef.current[trade.id] || 0;

          if (isFirebaseConfigured() && nowMs - lastSyncedAt >= 10000) {
            lastTradeCloudSyncRef.current[trade.id] = nowMs;
            void saveFirebaseDocument('trades', trade.id, {
              ...trade,
              currentPrice,
              pnl: livePnlRounded,
              pnlPercent: livePnlPercent,
            }).catch((error) => console.warn('[Firebase Trade] Live snapshot not saved:', error, trade.id));
          }

          return { ...trade, currentPrice, pnl: livePnlRounded, pnlPercent: livePnlPercent };
        });
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
      (u) => String(u.email || '').toLowerCase() === cleanEmail || String(u.name || '').toLowerCase() === cleanName.toLowerCase()
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

    // Firebase is the primary authentication provider. Do not block registration on unrelated legacy service status.
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

    // Firebase user profiles keep login working independently of the previous database.
    if (isFirebaseConfigured()) {
      try {
        const firebaseUsers = await fetchFirebaseCollection<User>('users');
        if (firebaseUsers.length > 0) {
          setUsers((prev) => {
            const merged = new Map(prev.map((user) => [user.id, user]));
            firebaseUsers.forEach((user) => merged.set(user.id, { ...merged.get(user.id), ...user } as User));
            return Array.from(merged.values());
          });
          const match = firebaseUsers.find((u) => String(u.name || '').toLowerCase() === clean || String(u.email || '').toLowerCase() === clean || String(u.uid || '') === clean);
          if (match) {
            firebaseFound = match;
            setUsers((prev) => [match, ...prev.filter((u) => u.id !== match.id)]);
          }
        }
      } catch (err) {
        console.warn('[Firebase users lookup]', err);
      }
    }

    let found = firebaseFound || users.find(
      (u) =>
        String(u.name || '').toLowerCase() === clean ||
        String(u.email || '').toLowerCase() === clean ||
        String(u.uid || '') === clean
    );

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
      // Authentication is performed only by Firebase Auth.
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
    void logoutFromFirebase().catch((error) => {
      console.warn('[Firebase Auth] Sign-out notice:', error);
    });
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
        const { password: _password, ...safeProfile } = target;
        void saveFirebaseDocument('users', target.id, safeProfile)
          .catch((error) => console.warn('[Firebase User] Avatar sync failed:', error));
      }
      return updated;
    });
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    if (!newPass || newPass.trim().length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }
    try {
      await updateFirebasePassword(currentPass.trim(), newPass.trim());
      logAuditAction(
        'USER_PASSWORD_CHANGED',
        `${currentUser.name} (${currentUser.uid})`,
        'Account login password updated successfully through Firebase Authentication.'
      );
      return { success: true, message: 'Password updated successfully! Please use your new password for all future logins.' };
    } catch (error) {
      console.warn('[Firebase Auth] Password update failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Password could not be updated. Please sign in again and retry.',
      };
    }
  };

  const updateUserStatus = (userId: string, status: 'active' | 'suspended' | 'archived', reason?: string) => {
    const targetUser = users.find((user) => user.id === userId);
    if (!targetUser) return;
    if (status === 'archived' && trades.some((trade) => trade.userId === userId && trade.status === 'OPEN')) {
      console.warn('[Customer archive] Close all open trades before archiving this account.');
      return;
    }

    setUsers((prev) => prev.map((user) => user.id === userId ? { ...user, status } : user));
    void saveFirebaseDocument('users', userId, { status })
      .catch((error) => console.warn('[Firebase User] Status sync failed:', error));
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
    const existing = coins.find((coin) => coin.symbol === symbol);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    if (updates.priceOffset !== undefined || updates.price !== undefined) {
      updated.price = Number((updated.basePrice + (updated.priceOffset || 0)).toFixed(updated.basePrice > 100 ? 2 : 4));
    }
    setCoins((prev) => prev.map((coin) => coin.symbol === symbol ? updated : coin));
    void saveFirebaseDocument('marketCoins', symbol, updated)
      .catch((error) => console.warn('[Firebase Market] Coin settings sync failed:', error));
    logAuditAction('MARKET_CONFIG_UPDATE', symbol, `Market coin parameters calibrated (Offset: ${updates.priceOffset ?? 0}, Spread: ${updates.spread ?? 'N/A'})`);
  };

  const setCoinPrice = (symbol: string, newPrice: number) => {
    if (newPrice <= 0) return;
    const existing = coins.find((coin) => coin.symbol === symbol);
    if (!existing) return;
    const formatted = Number(newPrice.toFixed(newPrice > 100 ? 2 : 4));
    const change = ((formatted - existing.basePrice) / existing.basePrice) * 100;
    const updated: MarketCoin = {
      ...existing,
      price: formatted,
      basePrice: formatted,
      priceOffset: 0,
      change24h: Number(change.toFixed(2)),
      high24h: Math.max(existing.high24h, formatted),
      low24h: Math.min(existing.low24h, formatted),
    };
    setCoins((prev) => prev.map((coin) => coin.symbol === symbol ? updated : coin));
    void saveFirebaseDocument('marketCoins', symbol, updated)
      .catch((error) => console.warn('[Firebase Market] Benchmark price sync failed:', error));
    logAuditAction('BENCHMARK_PRICE_CALIBRATION', symbol, `Market benchmark price calibrated to $${newPrice.toLocaleString()}`);
  };

  const applyMarketShock = (symbol: string, percentage: number) => {
    const existing = coins.find((coin) => coin.symbol === symbol);
    if (!existing) return;
    const multiplier = 1 + percentage / 100;
    const newPrice = Number((existing.price * multiplier).toFixed(existing.price > 100 ? 2 : 4));
    const updated: MarketCoin = {
      ...existing,
      price: newPrice,
      basePrice: newPrice,
      priceOffset: 0,
      change24h: Number((existing.change24h + percentage).toFixed(2)),
      high24h: Math.max(existing.high24h, newPrice),
      low24h: Math.min(existing.low24h, newPrice),
    };
    setCoins((prev) => prev.map((coin) => coin.symbol === symbol ? updated : coin));
    void saveFirebaseDocument('marketCoins', symbol, updated)
      .catch((error) => console.warn('[Firebase Market] Market shock sync failed:', error));
    logAuditAction('MARKET_STRESS_TEST', symbol, `Simulated market shock applied: ${percentage >= 0 ? '+' : ''}${percentage}%`);
  };

  const addCustomCoin = (newCoin: MarketCoin) => {
    setCoins((prev) => [...prev.filter((coin) => coin.symbol !== newCoin.symbol), newCoin]);
    void saveFirebaseDocument('marketCoins', newCoin.symbol, newCoin)
      .catch((error) => console.warn('[Firebase Market] New coin sync failed:', error));
    logAuditAction('CUSTOM_COIN_ADDED', newCoin.symbol, `New custom sandbox coin listed: ${newCoin.name} at initial price $${newCoin.price}`);
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
    const trade = trades.find((item) => item.id === tradeId);
    if (!trade || trade.status !== 'OPEN' || !isFirebaseConfigured()) return;
    const targetCoin = coins.find((coin) => coin.symbol === trade.symbol);
    const currentPrice = targetCoin ? targetCoin.price : trade.currentPrice;

    if (settlingTradeIdsRef.current.has(tradeId)) return;
    settlingTradeIdsRef.current.add(tradeId);
    void settleFirebaseTrade({
      tradeId,
      outcome: 'MARKET',
      marketPrice: currentPrice,
    }).then((result) => {
      setTrades((prev) => prev.map((item) => item.id === tradeId ? result.trade as Trade : item));
      setUsers((prev) => prev.map((user) =>
        user.id === result.userId ? { ...user, tradingBalance: result.tradingBalance } : user
      ));
    }).catch((error) => {
      console.error('[Firebase Trade] Manual close failed:', error, tradeId);
    }).finally(() => {
      settlingTradeIdsRef.current.delete(tradeId);
    });
  };

  const setTradeOutcome = async (
    tradeId: string,
    outcome: 'WIN' | 'LOSS' | null,
    percent: number = 35
  ): Promise<{ success: boolean; message: string }> => {
    const trade = trades.find((item) => item.id === tradeId);
    if (!trade || trade.status !== 'OPEN') return { success: false, message: 'This trade is no longer open.' };
    if (!isFirebaseConfigured()) return { success: false, message: 'Firebase is unavailable. The outcome was not saved.' };

    const safePercent = Number(percent);
    if (outcome && (!Number.isFinite(safePercent) || safePercent < 1 || safePercent > 5000)) {
      return { success: false, message: 'Enter a valid outcome percentage from 1% to 5000%.' };
    }

    const updatedTrade: Trade = {
      ...trade,
      scheduledOutcome: outcome,
      scheduledPercent: outcome ? safePercent : undefined,
    };
    try {
      await saveFirebaseDocument('trades', tradeId, updatedTrade);
      setTrades((prev) => prev.map((item) => item.id === tradeId ? updatedTrade : item));
      return { success: true, message: outcome ? `Scheduled ${outcome} at ${safePercent}% for expiry.` : 'Scheduled outcome cleared.' };
    } catch (error) {
      console.error('[Firebase Trade] Outcome schedule save failed:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Firebase could not save the scheduled outcome.' };
    }
  };

  const adminSettleTrade = async (
    tradeId: string,
    outcome: 'WIN' | 'LOSS',
    percent: number = 35
  ): Promise<{ success: boolean; message: string }> => {
    const trade = trades.find((item) => item.id === tradeId);
    if (!trade || trade.status !== 'OPEN') return { success: false, message: 'This trade is no longer open.' };
    if (!isFirebaseConfigured()) return { success: false, message: 'Firebase is unavailable. The trade was not settled.' };

    const safePercent = Number(percent);
    if (!Number.isFinite(safePercent) || safePercent < 1 || safePercent > 5000) {
      return { success: false, message: 'Enter a valid settlement percentage from 1% to 5000%.' };
    }
    if (settlingTradeIdsRef.current.has(tradeId)) {
      return { success: false, message: 'Settlement is already being processed for this trade.' };
    }

    settlingTradeIdsRef.current.add(tradeId);
    try {
      const result = await settleFirebaseTrade({
        tradeId,
        outcome,
        percent: safePercent,
      });

      setTrades((prev) => prev.map((item) => item.id === tradeId ? result.trade as Trade : item));
      setUsers((prev) => prev.map((user) =>
        user.id === result.userId ? { ...user, tradingBalance: result.tradingBalance } : user
      ));

      if (!result.settled) {
        return { success: false, message: 'This trade was already settled elsewhere. No additional balance was credited.' };
      }

      logAuditAction(
        'ADMIN_SETTLE_TRADE',
        `${trade.userName} (${trade.userId})`,
        `Trade #${trade.id} settled as ${outcome} (${safePercent}% of margin; PnL $${result.trade.pnl}).`
      );
      return {
        success: true,
        message: `Trade #${tradeId} settled as ${outcome} (${safePercent}%). Customer credited $${(Number(result.trade.margin) + Number(result.trade.pnl)).toFixed(2)}.`,
      };
    } catch (error) {
      console.error('[Firebase Trade] Atomic Admin settlement failed:', error, tradeId);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Firebase could not confirm settlement. The trade and balance were not changed locally.',
      };
    } finally {
      settlingTradeIdsRef.current.delete(tradeId);
    }
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
    void saveFirebaseDocument('users', userId, {
      tradingBalance: finalTrading,
      fundingBalance: finalFunding,
    }).catch((error) => console.warn('[Firebase Balance] Adjustment sync failed:', error));

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
    void saveFirebaseDocument('balanceAdjustments', adjustment.id, adjustment)
      .catch((error) => console.warn('[Firebase Balance] Adjustment history sync failed:', error));

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
    if (!isFirebaseConfigured()) {
      return { success: false, message: 'Firebase connection is unavailable. The deposit request was not submitted.' };
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
    try {
      await saveFirebaseDocument('deposits', newReq.id, newReq);
    } catch (error) {
      console.error('[Firebase Deposit] Cloud save failed:', error);
      return { success: false, message: 'Deposit request was not submitted because Firebase could not save it. Please retry.' };
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
    const approvedRequest = depositRequests.find((request) => request.id === depositId);
    if (approvedRequest) {
      void saveFirebaseDocument('deposits', depositId, {
        ...approvedRequest,
        status: 'approved',
        reviewedBy: adminName,
        reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      }).catch((error) => console.warn('[Firebase Deposit] Approval sync failed:', error));
    }

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
    const rejectedRequest = depositRequests.find((request) => request.id === depositId);
    if (rejectedRequest) {
      void saveFirebaseDocument('deposits', depositId, {
        ...rejectedRequest,
        status: 'rejected',
        note: note || rejectedRequest.note,
        reviewedBy: adminName,
        reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      }).catch((error) => console.warn('[Firebase Deposit] Rejection sync failed:', error));
    }
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
    if (!isFirebaseConfigured()) {
      return { success: false, message: 'Firebase connection is unavailable. The withdrawal was not submitted and no balance was deducted.' };
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

    try {
      await saveFirebaseDocument('users', currentUser.id, {
        tradingBalance: newTrading,
        fundingBalance: newFunding,
      });
      await saveFirebaseDocument('withdrawals', newReq.id, newReq);
    } catch (error) {
      try {
        await saveFirebaseDocument('users', currentUser.id, {
          tradingBalance: oldTrading,
          fundingBalance: oldFunding,
        });
      } catch (rollbackError) {
        console.error('[Firebase Withdrawal] Balance rollback failed:', rollbackError);
      }
      console.error('[Firebase Withdrawal] Cloud save failed:', error);
      return { success: false, message: 'Withdrawal was not submitted because Firebase could not save the request. The balance rollback was attempted.' };
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
    void saveFirebaseDocument('withdrawals', withdrawalId, {
      ...wth,
      status: 'approved',
      reviewedBy: adminName,
      reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    }).catch((error) => console.warn('[Firebase Withdrawal] Approval sync failed:', error));

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
    void saveFirebaseDocument('users', wth.userId, {
      tradingBalance: refundedTrading,
      fundingBalance: refundedFunding,
    }).catch((error) => console.warn('[Firebase Withdrawal] Refund balance sync failed:', error));

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
    void saveFirebaseDocument('withdrawals', withdrawalId, {
      ...wth,
      status: 'rejected',
      rejectReason: reason,
      notes: reason,
      reviewedBy: adminName,
      reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    }).catch((error) => console.warn('[Firebase Withdrawal] Rejection sync failed:', error));

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
    void saveFirebaseDocument('auditLogs', newLog.id, newLog)
      .catch((error) => console.error('[Firebase Audit] Activity log was not saved:', error));
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
    void saveFirebaseDocument('users', userId, {
      tradingBalance: newTrading,
      fundingBalance: newFunding,
    }).catch((error) => console.warn('[Firebase Balance] Admin transfer sync failed:', error));

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const entries: BalanceAdjustment[] = [
      { id: `adj-${Date.now()}-funding`, userId, userName: target.name, amount: -amount, type: 'correction', previousBalance: oldFunding, newBalance: newFunding, reason: `[Admin Transfer: Funding → Trading] ${reason}`, adminId: 'admin-01', adminName, timestamp },
      { id: `adj-${Date.now()}-trading`, userId, userName: target.name, amount, type: 'correction', previousBalance: oldTrading, newBalance: newTrading, reason: `[Admin Transfer: Funding → Trading] ${reason}`, adminId: 'admin-01', adminName, timestamp },
    ];
    setBalanceAdjustments((prev) => [...entries, ...prev]);
    entries.forEach((entry) => {
      void saveFirebaseDocument('balanceAdjustments', entry.id, entry)
        .catch((error) => console.warn('[Firebase Balance] Admin transfer history sync failed:', error));
    });
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

      void saveFirebaseDocument('users', currentUser.id, {
        tradingBalance: newTrading,
        fundingBalance: newFunding,
      }).catch((error) => console.warn('[Firebase Balance] Wallet transfer sync failed:', error));

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

      void saveFirebaseDocument('users', currentUser.id, {
        tradingBalance: newTrading,
        fundingBalance: newFunding,
      }).catch((error) => console.warn('[Firebase Balance] Wallet transfer sync failed:', error));

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
    setSystemSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      void saveFirebaseDocument('systemSettings', 'global', updated)
        .catch((error) => console.warn('[Firebase Settings] Platform settings sync failed:', error));
      return updated;
    });
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
        refreshAllFromFirebase,
        migrateCachedDataToFirebase,
        isFirebaseSynced,
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


