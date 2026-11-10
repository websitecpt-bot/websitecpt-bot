import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  MessageSquare,
  Activity,
  Clock,
  Shield,
  Search,
  UserCheck,
  Calendar,
  Gift,
  ExternalLink,
  DollarSign,
  ChevronRight,
  X,
  FileText,
} from 'lucide-react';
import { OFFICIAL_REFERRAL_CODES } from '../../data/initialData';

export const AdminDashboardTab: React.FC<{
  onNavigate: (tab: string) => void;
}> = ({ onNavigate }) => {
  const {
    users,
    trades,
    supportTickets,
    depositRequests,
    withdrawalRequests,
    auditLogs,
  } = useApp();

  const [signupSearch, setSignupSearch] = useState('');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');

  const openTrades = trades.filter((t) => t.status === 'OPEN');
  const closedTrades = trades.filter((t) => t.status === 'CLOSED');

  const pendingSupport = supportTickets.filter((t) => t.status === 'pending').length;
  const pendingDeposits = depositRequests.filter((d) => d.status === 'pending').length;
  const pendingWithdrawals = withdrawalRequests.filter((w) => w.status === 'pending').length;

  // Sort registered customers by newest registration first
  const sortedUsers = [...users].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  const filteredSignups = sortedUsers.filter((u) => {
    const q = signupSearch.toLowerCase();
    const refCode = u.referredByUid ? String(u.referredByUid).toLowerCase() : '';
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q) ||
      refCode.includes(q)
    );
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    const q = auditSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.target.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.adminName.toLowerCase().includes(q)
    );
  });

  const getReferralLabel = (refCode?: string) => {
    if (!refCode) return 'Direct Sign-up (No Code)';
    const official = OFFICIAL_REFERRAL_CODES.find((c) => c.code === refCode);
    if (official) return `${official.code} (${official.inviterName})`;
    const inviterUser = users.find((u) => u.uid === refCode);
    if (inviterUser) return `UID: ${refCode} (${inviterUser.name})`;
    return `UID: ${refCode}`;
  };

  const formatDateTime = (dateStr: string) => {
    try {
      if (!dateStr) return 'N/A';
      if (dateStr.includes('T')) {
        const d = new Date(dateStr);
        return d.toLocaleString([], {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Urgent Alert Bar if pending actions */}
      {(pendingSupport > 0 || pendingDeposits > 0 || pendingWithdrawals > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
            <span className="font-bold">Pending Administrative Actions:</span>
            <span>
              {pendingSupport} support message{pendingSupport !== 1 ? 's' : ''}, {pendingDeposits} deposit{pendingDeposits !== 1 ? 's' : ''},{' '}
              {pendingWithdrawals} withdrawal{pendingWithdrawals !== 1 ? 's' : ''} awaiting review.
            </span>
          </div>
          <div className="flex gap-2">
            {pendingSupport > 0 && (
              <button
                onClick={() => onNavigate('support')}
                className="bg-amber-400 hover:bg-amber-300 text-black font-bold px-3 py-1.5 rounded-lg text-[11px] cursor-pointer"
              >
                Open Support ({pendingSupport})
              </button>
            )}
            {pendingDeposits > 0 && (
              <button
                onClick={() => onNavigate('deposits')}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-3 py-1.5 rounded-lg text-[11px] cursor-pointer"
              >
                Review Deposits ({pendingDeposits})
              </button>
            )}
            {pendingWithdrawals > 0 && (
              <button
                onClick={() => onNavigate('withdrawals')}
                className="bg-rose-500 hover:bg-rose-400 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] cursor-pointer"
              >
                Review Withdrawals ({pendingWithdrawals})
              </button>
            )}
          </div>
        </div>
      )}

      {/* 
        Simplified 4 Metrics Cards (Requirement 1: Total Users, Currently Online, Total Deposits, 
        and Total Withdrawals permanently removed as marked with red 'X' in screenshot).
        Kept the 4 green-checked cards: Live Active Trades, Total Trades, Support Inbox, Active Traders.
      */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Live Active Trades */}
        <div
          onClick={() => onNavigate('trades')}
          className="bg-[#121622] hover:bg-[#161c2b] border border-[#21293c] rounded-xl p-4 cursor-pointer transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Live Active Trades</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-2 flex items-center gap-2">
            <span>{openTrades.length}</span>
            <span className="text-xs text-slate-400 font-normal">in progress</span>
          </div>
          <span className="text-[11px] text-cyan-400/80 mt-1 block">Monitoring live execution</span>
        </div>

        {/* 2. Total Trades */}
        <div
          onClick={() => onNavigate('trades')}
          className="bg-[#121622] hover:bg-[#161c2b] border border-[#21293c] rounded-xl p-4 cursor-pointer transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Trades</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">{trades.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{closedTrades.length} completed</span>
        </div>

        {/* 3. Support Inbox */}
        <div
          onClick={() => onNavigate('support')}
          className="bg-[#121622] hover:bg-[#161c2b] border border-[#21293c] rounded-xl p-4 cursor-pointer transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Support Inbox</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2 flex items-center gap-2">
            <span>{supportTickets.length}</span>
            {pendingSupport > 0 && (
              <span className="text-xs bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingSupport} pending
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">2-way live desk</span>
        </div>

        {/* 4. Active Traders */}
        <div
          onClick={() => onNavigate('balance')}
          className="bg-[#121622] hover:bg-[#161c2b] border border-[#21293c] rounded-xl p-4 cursor-pointer transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Active Traders</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-teal-400 mt-2">
            {users.filter((u) => u.status === 'active').length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {users.filter((u) => u.status === 'suspended').length} suspended
          </span>
        </div>
      </div>

      {/* 
        NEW SECTION (Requirement 1): Referral & Registration Tracking
        Displays:
        • Customer Name (with UID & Avatar)
        • Registration Date & Time
        • The specific Referral Code they used to create the account
      */}
      <div className="bg-[#121622] border border-[#21293c] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-[#1f273a] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#141926]">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400" />
              <span>Customer Sign-up & Referral Tracking</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live registration log detailing customer identity, timestamp, and referral attribution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={signupSearch}
                onChange={(e) => setSignupSearch(e.target.value)}
                placeholder="Search name, UID, referral code..."
                className="w-full bg-[#182030] border border-[#242e44] focus:border-amber-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none"
              />
            </div>
            <span className="text-xs font-mono text-slate-400 shrink-0 bg-[#182030] px-2.5 py-1.5 rounded-xl border border-[#242e44]">
              {filteredSignups.length} Users
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161c2b] border-b border-[#21293c] text-slate-400 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Client UID</th>
                <th className="px-4 py-3">Registration Date & Time</th>
                <th className="px-4 py-3">Referral Code Used</th>
                <th className="px-4 py-3">Trading Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2234]">
              {filteredSignups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No sign-up records matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredSignups.map((u) => {
                  const refInfo = getReferralLabel(u.referredByUid);
                  const isMasterRef = u.referredByUid === '100001' || u.referredByUid === '777888' || u.referredByUid === '992282';
                  return (
                    <tr key={u.id} className="hover:bg-[#151a28] transition-colors">
                      {/* Customer Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border border-[#2d3852]"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-cyan-500/15 text-cyan-400 font-bold flex items-center justify-center text-xs border border-cyan-500/30">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white capitalize flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.isOnline && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Online now"></span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Client UID */}
                      <td className="px-4 py-3.5 font-mono text-cyan-300 font-bold">
                        <span className="bg-[#182030] px-2 py-0.5 rounded border border-cyan-500/20">
                          {u.uid}
                        </span>
                      </td>

                      {/* Registration Date & Time */}
                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDateTime(u.createdAt)}</span>
                        </div>
                      </td>

                      {/* Specific Referral Code Used */}
                      <td className="px-4 py-3.5">
                        {u.referredByUid ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-semibold">
                            <Gift className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{refInfo}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">
                            Direct (No Referral)
                          </span>
                        )}
                      </td>

                      {/* Trading Balance */}
                      <td className="px-4 py-3.5 font-mono font-bold text-emerald-400 text-xs">
                        ${u.tradingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                            u.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => onNavigate('balance')}
                          className="bg-[#182030] hover:bg-[#222c42] text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Manage user balance"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Balance</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Trading Feed Section (Who is taking trades at what time) */}
      <div className="bg-[#121622] border border-[#21293c] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h3 className="text-sm font-bold text-white">
              Live Active Trades Monitor (Real-time)
            </h3>
          </div>
          <button
            onClick={() => onNavigate('trades')}
            className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>View All Trades</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {openTrades.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No active open trades currently running across users.
          </div>
        ) : (
          <div className="space-y-2.5">
            {openTrades.map((t) => {
              const isProfit = t.pnl >= 0;
              return (
                <div
                  key={t.id}
                  className="bg-[#161b2a] border border-[#242e44] rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 font-bold flex items-center justify-center text-xs">
                      {t.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{t.userName}</span>
                        <span className="font-mono text-[11px] text-slate-400 font-medium">
                          opened {t.symbol}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            t.type === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {t.type} {t.leverage}x
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Entry: ${t.entryPrice.toLocaleString()} • Margin: ${t.margin.toFixed(2)} • Time:{' '}
                        {t.openedAt}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono">
                      <span className="text-[10px] text-slate-400 block">Current P/L</span>
                      <span
                        className={`font-bold text-sm ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isProfit ? '+' : ''}${t.pnl.toFixed(2)} ({isProfit ? '+' : ''}
                        {t.pnlPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity & Admin Audit Feed */}
      <div className="bg-[#121622] border border-[#21293c] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Recent Activities & Admin Audit Feed</span>
          </h3>
          <button
            onClick={() => setShowAuditModal(true)}
            className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Audit Log History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {auditLogs.slice(0, 6).map((log) => (
            <div
              key={log.id}
              className="bg-[#161b2a] border border-[#222a3e] rounded-xl p-3 flex items-start justify-between text-xs gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-400">{log.action}</span>
                  <span className="text-slate-300 font-semibold">• {log.target}</span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">{log.details}</p>
              </div>
              <div className="text-right text-[10px] text-slate-500 font-mono whitespace-nowrap">
                <div>{log.adminName}</div>
                <div>{log.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Audit Log Modal for Requirement 5 */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111522] border border-[#232c40] rounded-2xl w-full max-w-4xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#1f273a] pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Platform Administrative History & Audit Trail</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Chronological record of balance modifications, trade settlements, and operator decisions.
                </p>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit actions, operators, targets..."
                className="w-full bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 rounded-xl px-4 py-2 text-xs text-white outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredAuditLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No audit log entries matching search query.
                </div>
              ) : (
                filteredAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-[#151a28] border border-[#222a3e] rounded-xl p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-400 font-mono text-[11px]">{log.action}</span>
                        <span className="text-slate-200 font-medium">• {log.target}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">{log.details}</p>
                    </div>
                    <div className="text-right text-[10px] text-slate-500 font-mono shrink-0">
                      <div>Operator: <strong className="text-slate-300">{log.adminName}</strong></div>
                      <div>{log.timestamp}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
