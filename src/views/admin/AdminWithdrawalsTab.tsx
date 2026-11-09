import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RequestStatus, WithdrawalRequest } from '../../types';
import {
  ArrowUpRight,
  Search,
  Check,
  X,
  AlertCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const AdminWithdrawalsTab: React.FC = () => {
  const { withdrawalRequests, approveWithdrawal, rejectWithdrawal } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectModalWth, setRejectModalWth] = useState<WithdrawalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredWithdrawals = withdrawalRequests.filter((w) => {
    const matchesFilter = statusFilter === 'all' || w.status === statusFilter;
    const matchesSearch =
      w.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.accountHolderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.bankOrAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.network.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalWth) return;
    rejectWithdrawal(rejectModalWth.id, rejectReason || 'Withdrawal canceled by administrator.');
    setRejectModalWth(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-rose-400" />
            <span>Withdrawal Management</span>
          </h2>
          <p className="text-xs text-slate-400">
            Review user withdrawal requests, inspect destination accounts/wallets, and approve or cancel payouts.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-[#121622] p-1 rounded-xl border border-[#21293c] text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'all' ? 'bg-amber-400 text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({withdrawalRequests.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-400 text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({withdrawalRequests.filter((w) => w.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-emerald-500 text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Approved ({withdrawalRequests.filter((w) => w.status === 'approved').length})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-rose-500 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rejected ({withdrawalRequests.filter((w) => w.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#121622] border border-[#21293c] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1f273a] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Withdrawal Requests
          </span>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, name, address..."
              className="w-full bg-[#161c2a] border border-[#242e42] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161c2b] border-b border-[#21293c] text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Trader</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Account Holder</th>
                <th className="px-4 py-3">Destination / Network</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2234]">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No withdrawal requests found in this view.
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-[#151a28] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white capitalize">{w.userName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">#{w.id}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-rose-400 text-sm">
                      ${w.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-200">{w.accountHolderName}</td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-bold uppercase shrink-0">
                          {w.withdrawalType || 'USD'}
                        </span>
                        <div className="font-mono text-slate-300 truncate" title={w.bankOrAddress}>
                          {w.bankOrAddress}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{w.network}</div>
                      {w.notes && (
                        <div className="text-[10px] text-slate-400 italic mt-0.5">
                          Note: {w.notes}
                        </div>
                      )}
                      {w.rejectReason && (
                        <div className="text-[10px] text-rose-400 mt-0.5 font-medium">
                          Reason: {w.rejectReason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">{w.timestamp}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                          w.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : w.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {w.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => approveWithdrawal(w.id)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                            title="Approve and Finalize Payout"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => setRejectModalWth(w)}
                            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            title="Reject and Refund Balance"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">
                          {w.reviewedBy ? `by ${w.reviewedBy}` : 'Completed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectModalWth && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111522] border border-[#232c40] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2">
              Reject Withdrawal: #{rejectModalWth.id} (${rejectModalWth.amount.toLocaleString()})
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Rejecting this request will automatically refund the locked ${rejectModalWth.amount.toLocaleString()} back to the trader's balance. Please provide a clear reason for the audit log.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Rejection Reason</label>
                <input
                  type="text"
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Account name mismatch / Verification pending"
                  className="w-full bg-[#161c2a] border border-[#242e44] focus:border-rose-400 rounded-xl px-4 py-2.5 text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalWth(null)}
                  className="bg-[#1a2133] hover:bg-[#232c42] text-slate-300 px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-500 hover:bg-rose-400 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Confirm Rejection & Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
