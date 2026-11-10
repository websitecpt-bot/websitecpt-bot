import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RequestStatus, DepositRequest } from '../../types';
import {
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';

export const AdminDepositsTab: React.FC = () => {
  const { depositRequests, approveDeposit, rejectDeposit } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectModalDep, setRejectModalDep] = useState<DepositRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredDeposits = depositRequests.filter((d) => {
    const matchesFilter = statusFilter === 'all' || d.status === statusFilter;
    const matchesSearch =
      d.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.txid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalDep) return;
    rejectDeposit(rejectModalDep.id, rejectReason || 'Payment verification failed.');
    setRejectModalDep(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>Deposit Request Management</span>
          </h2>
          <p className="text-xs text-slate-400">
            Verify transaction IDs (TXIDs), approve funds directly to user trading balances, or reject unverified submissions.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-[#121622] p-1 rounded-xl border border-[#21293c] text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'all' ? 'bg-cyan-400 text-black font-bold shadow-sm shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({depositRequests.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-cyan-400 text-black font-bold shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({depositRequests.filter((d) => d.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-emerald-500 text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Approved ({depositRequests.filter((d) => d.status === 'approved').length})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-rose-500 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rejected ({depositRequests.filter((d) => d.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#121622] border border-[#21293c] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1f273a] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Deposit Requests Record
          </span>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by User or TXID..."
              className="w-full bg-[#161c2a] border border-[#242e42] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161c2b] border-b border-[#21293c] text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">ID / User</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method & Network</th>
                <th className="px-4 py-3">Transaction ID (TXID)</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2234]">
              {filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No deposit requests found in this category.
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((dep) => (
                  <tr key={dep.id} className="hover:bg-[#151a28] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white capitalize">{dep.userName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">#{dep.id}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-400 text-sm">
                      ${dep.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5 text-slate-200">
                      <div>{dep.paymentMethod}</div>
                      <div className="text-[10px] text-slate-400">{dep.network}</div>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="font-mono text-[11px] text-slate-300 truncate" title={dep.txid}>
                        {dep.txid}
                      </div>
                      {dep.note && <div className="text-[10px] text-slate-400 mt-0.5">{dep.note}</div>}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">{dep.timestamp}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                          dep.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : dep.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {dep.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {dep.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => approveDeposit(dep.id)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                            title="Verify TXID and Credit Balance"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => setRejectModalDep(dep)}
                            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            title="Reject Deposit"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">
                          {dep.reviewedBy ? `by ${dep.reviewedBy}` : 'Completed'}
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
      {rejectModalDep && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111522] border border-[#232c40] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2">
              Reject Deposit: #{rejectModalDep.id} (${rejectModalDep.amount.toLocaleString()})
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Specify the reason for rejection (e.g. invalid transaction hash, unconfirmed on blockchain).
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Rejection Reason</label>
                <input
                  type="text"
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. TXID not found on TronScan explorer"
                  className="w-full bg-[#161c2a] border border-[#242e44] focus:border-rose-400 rounded-xl px-4 py-2.5 text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalDep(null)}
                  className="bg-[#1a2133] hover:bg-[#232c42] text-slate-300 px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-500 hover:bg-rose-400 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
