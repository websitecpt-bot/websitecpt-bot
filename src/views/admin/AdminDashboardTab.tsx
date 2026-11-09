import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  UserCheck,
  CreditCard,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  Activity,
  Clock,
  Shield,
  ArrowDownLeft,
} from 'lucide-react';

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

  const totalUsers = users.length;
  const onlineUsers = users.filter((u) => u.isOnline).length;

  const totalDeposits = depositRequests
    .filter((d) => d.status === 'approved')
    .reduce((acc, d) => acc + d.amount, 0);

  const totalWithdrawals = withdrawalRequests
    .filter((w) => w.status === 'approved')
    .reduce((acc, w) => acc + w.amount, 0);

  const openTrades = trades.filter((t) => t.status === 'OPEN');
  const closedTrades = trades.filter((t) => t.status === 'CLOSED');

  const pendingSupport = supportTickets.filter((t) => t.status === 'pending').length;
  const pendingDeposits = depositRequests.filter((d) => d.status === 'pending').length;
  const pendingWithdrawals = withdrawalRequests.filter((w) => w.status === 'pending').length;

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
                className="bg-amber-400 hover:bg-amber-300 text-black font-bold px-2.5 py-1 rounded text-[11px]"
              >
                Open Support ({pendingSupport})
              </button>
            )}
            {pendingDeposits > 0 && (
              <button
                onClick={() => onNavigate('deposits')}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-2.5 py-1 rounded text-[11px]"
              >
                Review Deposits ({pendingDeposits})
              </button>
            )}
            {pendingWithdrawals > 0 && (
              <button
                onClick={() => onNavigate('withdrawals')}
                className="bg-rose-500 hover:bg-rose-400 text-white font-bold px-2.5 py-1 rounded text-[11px]"
              >
                Review Withdrawals ({pendingWithdrawals})
              </button>
            )}
          </div>
        </div>
      )}


      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Users */}
        <div
          onClick={() => onNavigate('users')}
          className="bg-[#121622] hover:bg-[#161c2b] border border-[#21293c] rounded-xl p-4 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Users</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">{totalUsers}</div>
          <span className="text-[11px] text-blue-400 mt-1 block">Registered traders</span>
        </div>

        {/* Online Users */}
        <div
          onClick={() => onNavigate('users')}
          className="bg-[#121622] hover:bg-[#161c2b] border border-[#21293c] rounded-xl p-4 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Currently Online</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2 flex items-center gap-2">
            <span>{onlineUsers}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <span className="text-[11px] text-emerald-400/80 mt-1 block">Active web sessions</span>
        </div>

        {/* Total Deposits */}
        <div
          onClick={() => onNavigate('deposits')}
          className="bg-[#121622] hover:bg-[#161c2b] border border-[#21293c] rounded-xl p-4 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Deposits</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-2">
            ${totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {depositRequests.filter((d) => d.status === 'approved').length} approved transactions
          </span>
        </div>

        {/* Total Withdrawals */}
        <div
          onClick={() => onNavigate('withdrawals')}
          className="bg-[#121622] hover:bg-[#161c2b] border border-[#21293c] rounded-xl p-4 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Withdrawals</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-2">
            ${totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {withdrawalRequests.filter((w) => w.status === 'approved').length} processed requests
          </span>
        </div>

        {/* Active Trades */}
        <div
          onClick={() => onNavigate('trades')}
          className="bg-[#121622] hover:bg-[#161c2b] border border-[#21293c] rounded-xl p-4 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Live Active Trades</span>
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

        {/* Total Trades History */}
        <div
          onClick={() => onNavigate('trades')}
          className="bg-[#121622] hover:bg-[#161c2b] border border-[#21293c] rounded-xl p-4 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Trades</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">{trades.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{closedTrades.length} completed</span>
        </div>

        {/* Total Support Messages */}
        <div
          onClick={() => onNavigate('support')}
          className="bg-[#121622] hover:bg-[#161c2b] border border-[#21293c] rounded-xl p-4 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Support Inbox</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2 flex items-center gap-2">
            <span>{supportTickets.length}</span>
            {pendingSupport > 0 && (
              <span className="text-xs bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                {pendingSupport} pending
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">2-way live desk</span>
        </div>

        {/* New Users */}
        <div
          onClick={() => onNavigate('users')}
          className="bg-[#121622] hover:bg-[#161c2b] border border-[#21293c] rounded-xl p-4 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Active Traders</span>
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

      {/* Live Trading Feed Section (Who is taking trades at what time) */}
      <div className="bg-[#121622] border border-[#21293c] rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h3 className="text-sm font-bold text-white">
              Live Active Trades Monitor (Real-time)
            </h3>
          </div>
          <button
            onClick={() => onNavigate('trades')}
            className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            View All Trades →
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

      {/* Recent Activity & Audit Feed matching requirement 1 */}
      <div className="bg-[#121622] border border-[#21293c] rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Recent Activities & Admin Audit Feed</span>
          </h3>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            Audit Log History →
          </button>
        </div>

        <div className="space-y-2.5">
          {auditLogs.slice(0, 5).map((log) => (
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
    </div>
  );
};
