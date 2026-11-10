import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
  Users,
  ShieldCheck,
  Search,
} from 'lucide-react';

export const AdminReportsTab: React.FC = () => {
  const {
    depositRequests,
    withdrawalRequests,
    trades,
    users,
    auditLogs,
  } = useApp();

  const [activeReport, setActiveReport] = useState<'financial' | 'traders' | 'audit'>('financial');
  const [auditSearch, setAuditSearch] = useState('');

  // Calculations
  const approvedDeposits = depositRequests.filter((d) => d.status === 'approved');
  const totalDepositVolume = approvedDeposits.reduce((acc, d) => acc + d.amount, 0);

  const approvedWithdrawals = withdrawalRequests.filter((w) => w.status === 'approved');
  const totalWithdrawalVolume = approvedWithdrawals.reduce((acc, w) => acc + w.amount, 0);

  const netLiquidity = totalDepositVolume - totalWithdrawalVolume;

  const totalTradesVolume = trades.reduce((acc, t) => acc + t.positionSize, 0);
  const totalNetTradingPnL = trades.reduce((acc, t) => acc + t.pnl, 0);

  const filteredAuditLogs = auditLogs.filter((l) => {
    const q = auditSearch.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.target.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.adminName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Reports, Analytics & Audit History</span>
          </h2>
          <p className="text-xs text-slate-400">
            Daily liquidity balance sheets, user performance breakdowns, and system audit logs.
          </p>
        </div>

        {/* Report Subtabs */}
        <div className="flex items-center gap-1.5 bg-[#121622] p-1 rounded-xl border border-[#21293c] text-xs">
          <button
            onClick={() => setActiveReport('financial')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeReport === 'financial' ? 'bg-cyan-400 text-black font-bold shadow-sm shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            Financial Summary
          </button>
          <button
            onClick={() => setActiveReport('traders')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeReport === 'traders' ? 'bg-cyan-400 text-black font-bold shadow-sm shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            Trader-wise Reports
          </button>
          <button
            onClick={() => setActiveReport('audit')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeReport === 'audit' ? 'bg-cyan-400 text-black font-bold shadow-sm shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin Audit Logs ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeReport === 'financial' && (
        <div className="space-y-6">
          {/* 4 Financial Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#121622] border border-[#21293c] rounded-xl p-4">
              <span className="text-xs text-slate-400 block">Total Approved Deposits</span>
              <span className="font-mono font-bold text-xl sm:text-2xl text-emerald-400 mt-1 block">
                ${totalDepositVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {approvedDeposits.length} total approvals
              </span>
            </div>

            <div className="bg-[#121622] border border-[#21293c] rounded-xl p-4">
              <span className="text-xs text-slate-400 block">Total Approved Withdrawals</span>
              <span className="font-mono font-bold text-xl sm:text-2xl text-rose-400 mt-1 block">
                ${totalWithdrawalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {approvedWithdrawals.length} completed payouts
              </span>
            </div>

            <div className="bg-[#121622] border border-[#21293c] rounded-xl p-4">
              <span className="text-xs text-slate-400 block">Net Platform Cashflow</span>
              <span
                className={`font-mono font-bold text-xl sm:text-2xl mt-1 block ${
                  netLiquidity >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ${netLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Deposits minus payouts</span>
            </div>

            <div className="bg-[#121622] border border-[#21293c] rounded-xl p-4">
              <span className="text-xs text-slate-400 block">Total Notional Turnover</span>
              <span className="font-mono font-bold text-xl sm:text-2xl text-cyan-400 mt-1 block">
                ${totalTradesVolume.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Combined leveraged volume</span>
            </div>
          </div>

          {/* Detailed Financial Breakdown Table */}
          <div className="bg-[#121622] border border-[#21293c] rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
              Daily Treasury Movement Breakdown
            </h3>
            <div className="space-y-3 text-xs">
              <div className="bg-[#151a28] p-3 rounded-xl border border-[#20293d] flex justify-between items-center">
                <div>
                  <span className="font-semibold text-white block">Wire / Treasury Reserves</span>
                  <span className="text-[11px] text-slate-400">Institutional Barclays UK Clearing</span>
                </div>
                <span className="font-mono font-bold text-emerald-400 text-sm">$320,000.00</span>
              </div>
              <div className="bg-[#151a28] p-3 rounded-xl border border-[#20293d] flex justify-between items-center">
                <div>
                  <span className="font-semibold text-white block">Tether USDT (TRC-20) Liquidity</span>
                  <span className="text-[11px] text-slate-400">Cold Vault #01 (Tron Multi-Sig)</span>
                </div>
                <span className="font-mono font-bold text-emerald-400 text-sm">$185,450.00</span>
              </div>
              <div className="bg-[#151a28] p-3 rounded-xl border border-[#20293d] flex justify-between items-center">
                <div>
                  <span className="font-semibold text-white block">Total Client Account Liability</span>
                  <span className="text-[11px] text-slate-400">Sum of all trader trading balances</span>
                </div>
                <span className="font-mono font-bold text-cyan-400 text-sm">
                  ${users.reduce((acc, u) => acc + u.tradingBalance, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'traders' && (
        <div className="bg-[#121622] border border-[#21293c] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-[#1f273a]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Trader Performance & Volume Ledger
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161c2b] border-b border-[#21293c] text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Trader</th>
                  <th className="px-4 py-3">UID</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Trades Count</th>
                  <th className="px-4 py-3">Cumulative Realized PnL</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2234]">
                {users.map((u) => {
                  const uTrades = trades.filter((t) => t.userId === u.id);
                  const uPnL = uTrades.reduce((acc, t) => acc + t.pnl, 0);
                  const isPos = uPnL >= 0;
                  return (
                    <tr key={u.id} className="hover:bg-[#151a28] transition-colors">
                      <td className="px-4 py-3 font-semibold text-white capitalize">{u.name}</td>
                      <td className="px-4 py-3 font-mono text-cyan-400 font-bold">{u.uid}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-200">
                        ${u.tradingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">{uTrades.length} trades</td>
                      <td className="px-4 py-3 font-mono font-bold">
                        <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPos ? '+' : ''}${uPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'audit' && (
        <div className="bg-[#121622] border border-[#21293c] rounded-2xl overflow-hidden shadow-xl space-y-4">
          <div className="p-4 border-b border-[#1f273a] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Official Administrative Audit Log (Requirement 10 & 11)
              </h3>
              <p className="text-[11px] text-slate-400">
                Immutable security record of all balance changes, suspensions, approvals, and configurations.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit trail..."
                className="w-full bg-[#161c2a] border border-[#242e42] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161c2b] border-b border-[#21293c] text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target Subject</th>
                  <th className="px-4 py-3">Event Details</th>
                  <th className="px-4 py-3">Admin Identity</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2234]">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      No audit records found matching search.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#151a28] transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-bold text-cyan-400 font-mono text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{log.target}</td>
                      <td className="px-4 py-3 text-slate-300 max-w-sm">{log.details}</td>
                      <td className="px-4 py-3 text-slate-400 font-medium">{log.adminName}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                        {log.timestamp}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
