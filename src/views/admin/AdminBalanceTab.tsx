import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BalanceAdjustmentType } from '../../types';
import {
  DollarSign,
  Search,
  PlusCircle,
  MinusCircle,
  Gift,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  History,
  ShieldCheck,
} from 'lucide-react';

export const AdminBalanceTab: React.FC = () => {
  const {
    users,
    adjustUserBalance,
    balanceAdjustments,
    adminName,
  } = useApp();

  const [selectedUserId, setSelectedUserId] = useState<string>(() => users[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<BalanceAdjustmentType>('bonus');
  const [reason, setReason] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid non-zero adjustment amount.' });
      return;
    }
    if (!reason.trim()) {
      setStatusMessage({ type: 'error', text: 'A detailed reason is mandatory for audit logging.' });
      return;
    }

    adjustUserBalance({
      userId: selectedUser.id,
      amount: parsedAmount,
      type: adjustmentType,
      reason,
    });

    setStatusMessage({
      type: 'success',
      text: `Successfully adjusted ${selectedUser.name}'s balance by ${parsedAmount >= 0 ? '+' : ''}$${parsedAmount.toLocaleString()}. Visible in user balance history.`,
    });

    setAmount('');
    setReason('');
  };

  const filteredAdjustments = balanceAdjustments.filter((adj) => {
    const q = searchFilter.toLowerCase();
    return (
      adj.userName.toLowerCase().includes(q) ||
      adj.reason.toLowerCase().includes(q) ||
      adj.adminName.toLowerCase().includes(q) ||
      adj.type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <span>Balance Management & Manual Adjustments</span>
        </h2>
        <p className="text-xs text-slate-400">
          Add or adjust user balances, credit bonuses or refunds, with permanent audit logging visible to users.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Primary Action Card: User Balance Adjustment Form */}
      <div className="bg-[#121622] border border-[#21293c] rounded-2xl p-6 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: User Selector & Current Balance Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4 border-b lg:border-b-0 lg:border-r border-[#1f273a] pb-6 lg:pb-0 lg:pr-6">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Select Trader to Manage
          </label>
          <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
            {users.map((u) => {
              const isSelected = u.id === selectedUser?.id;
              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all text-xs flex items-center justify-between ${
                    isSelected
                      ? 'bg-cyan-400/10 border-cyan-400/60 shadow-sm'
                      : 'bg-[#161c2a] border-[#222a3d] hover:border-[#303b54]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-white block capitalize">{u.name}</span>
                      <span className="text-[11px] text-slate-400">UID: {u.uid}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-white">
                    ${u.tradingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current balance card */}
          {selectedUser && (
            <div className="bg-[#161c2b] border border-[#242e44] rounded-xl p-4 text-xs space-y-2">
              <span className="text-slate-400 font-medium block">Selected Account Overview:</span>
              <div className="flex justify-between">
                <span className="text-slate-400">Trading Balance:</span>
                <span className="font-mono font-bold text-cyan-400">
                  ${selectedUser.tradingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Funding Balance:</span>
                <span className="font-mono text-slate-200">${selectedUser.fundingBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Status:</span>
                <span className={`font-semibold capitalize ${selectedUser.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedUser.status}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Adjustment Form (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white">
              Execute Balance Adjustment for <span className="text-cyan-400">{selectedUser?.name}</span>
            </h3>

            {/* Adjustment Type Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('bonus')}
                className={`py-2 px-3 rounded-lg border text-center font-semibold transition-all cursor-pointer ${
                  adjustmentType === 'bonus'
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                    : 'bg-[#161c2b] border-[#222a3d] text-slate-400 hover:text-white'
                }`}
              >
                🎁 Promo Bonus
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('deposit')}
                className={`py-2 px-3 rounded-lg border text-center font-semibold transition-all cursor-pointer ${
                  adjustmentType === 'deposit'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-[#161c2b] border-[#222a3d] text-slate-400 hover:text-white'
                }`}
              >
                ➕ Add Deposit
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('refund')}
                className={`py-2 px-3 rounded-lg border text-center font-semibold transition-all cursor-pointer ${
                  adjustmentType === 'refund'
                    ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                    : 'bg-[#161c2b] border-[#222a3d] text-slate-400 hover:text-white'
                }`}
              >
                🔄 Refund / Credit
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('correction')}
                className={`py-2 px-3 rounded-lg border text-center font-semibold transition-all cursor-pointer ${
                  adjustmentType === 'correction'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-[#161c2b] border-[#222a3d] text-slate-400 hover:text-white'
                }`}
              >
                ⚙️ Correction
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Adjustment Amount ($) — e.g. <span className="text-emerald-400">+5000</span> or <span className="text-rose-400">-500</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (positive or negative)"
                className="w-full bg-[#161c2b] border border-[#242e44] focus:border-cyan-400 rounded-xl px-4 py-2.5 text-white font-mono text-sm outline-none"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Mandatory Audit Reason (Visible in User's Balance History)
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. VIP loyalty promotional bonus / Wire payment confirmation"
                className="w-full bg-[#161c2b] border border-[#242e44] focus:border-cyan-400 rounded-xl px-4 py-2.5 text-white outline-none"
              />
            </div>

            <div className="bg-[#141926] p-3 rounded-xl border border-[#20283a] text-[11px] text-slate-400 flex items-center justify-between">
              <span>Admin Identity Stamp: <strong className="text-white">{adminName}</strong></span>
              <span>Timestamp: <strong className="font-mono text-slate-300">Automatic GMT</strong></span>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-black font-extrabold py-3 rounded-xl text-xs transition-all shadow-md shadow-cyan-500/25 cursor-pointer"
            >
              Confirm & Post Balance Adjustment
            </button>
          </form>
        </div>
      </div>

      {/* Audit History of Balance Adjustments */}
      <div className="bg-[#121622] border border-[#21293c] rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Complete Balance Adjustment Audit Trail</span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search adjustments..."
              className="w-full bg-[#161c2a] border border-[#242e42] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161c2b] border-b border-[#21293c] text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-2.5">Trader</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Amount</th>
                <th className="px-4 py-2.5">New Balance</th>
                <th className="px-4 py-2.5">Reason</th>
                <th className="px-4 py-2.5">Admin Operator</th>
                <th className="px-4 py-2.5">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2234]">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                    No balance adjustments recorded.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((adj) => {
                  const isPos = adj.amount >= 0;
                  return (
                    <tr key={adj.id} className="hover:bg-[#151a28] transition-colors">
                      <td className="px-4 py-3 font-semibold text-white capitalize">{adj.userName}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-800 text-slate-300">
                          {adj.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">
                        <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPos ? '+' : ''}${adj.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-200">
                        ${adj.newBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-xs truncate">{adj.reason}</td>
                      <td className="px-4 py-3 text-slate-400">{adj.adminName}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{adj.timestamp}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
