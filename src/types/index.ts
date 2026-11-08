export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  tradingBalance: number;
  fundingBalance: number;
  status: UserStatus;
  isOnline: boolean;
  avatar?: string;
  createdAt: string;
  lastLogin: string;
  referredByUid?: string;
  role?: 'user' | 'admin' | 'superadmin';
  password?: string;
}

export type TradeType = 'BUY' | 'SELL';
export type TradeStatus = 'OPEN' | 'CLOSED';

export interface Trade {
  id: string;
  userId: string;
  userName: string;
  symbol: string;
  type: TradeType;
  leverage: number;
  margin: number;
  positionSize: number;
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number;
  status: TradeStatus;
  durationMinutes: number;
  openedAt: string;
  closedAt?: string;
  expiresAt: string;
  expiresAtMs?: number;
  pnl: number;
  pnlPercent: number;
  fee: number;
}

export interface SupportMessage {
  id: string;
  sender: 'user' | 'admin';
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: 'image' | 'file';
}

export type TicketStatus = 'pending' | 'answered' | 'closed';

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: TicketStatus;
  lastMessage: string;
  lastMessageTime: string;
  unreadAdminCount: number;
  unreadUserCount: number;
  isSessionClosed?: boolean;
  messages: SupportMessage[];
}

export type Language = 'en' | 'bn' | 'hi' | 'ja' | 'zh' | 'pt' | 'ar' | 'es';

export type BalanceAdjustmentType = 'deposit' | 'withdrawal' | 'correction' | 'bonus' | 'refund' | 'trade_pnl';

export interface BalanceAdjustment {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  type: BalanceAdjustmentType;
  previousBalance: number;
  newBalance: number;
  reason: string;
  adminId: string;
  adminName: string;
  timestamp: string;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  txid: string;
  paymentMethod: string;
  network?: string;
  status: RequestStatus;
  timestamp: string;
  note?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  accountHolderName: string;
  bankOrAddress: string;
  network: string;
  status: RequestStatus;
  timestamp: string;
  rejectReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  withdrawalType?: 'USD' | 'USDT';
  notes?: string;
}

export interface MarketCoin {
  symbol: string;
  name: string;
  price: number;
  basePrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  spread: number;
  priceOffset: number; // For educational/testing calibration
  maxLeverage: number;
  status: 'active' | 'paused';
}

export interface AuditLog {
  id: string;
  adminName: string;
  adminId: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface SystemSettings {
  platformName: string;
  supportEmail: string;
  telegramSupport: string;
  announcement: string;
  tradingFeePercent: number;
  minDeposit: number;
  minWithdrawal: number;
  maxLeverageLimit: number;
  maintenanceMode: boolean;
  marketDataSource: 'live_stream' | 'simulated';
}
