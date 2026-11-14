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
  Eye,
} from 'lucide-react';

export const AdminWithdrawalsTab: React.FC = () => {
  const { withdrawalRequests, approveWithdrawal, rejectWithdrawal } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectModalWth, setRejectModalWth] = useState<WithdrawalRequest | null>(null);
  const [detailsModalWth, setDetailsModalWth] = useState<WithdrawalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const getRecipientDetails = (request: WithdrawalRequest) => {
    const destination = request.bankOrAddress || '';
    if (request.withdrawalType === 'USDT') {
      return {
        destinationLabel: 'Wallet Address',
        destinationValue: destination || 'Not provided',
        providerLabel: 'Network',
        providerValue: request.network || 'USDT',
      };
    }

    const separator = destination.indexOf(' - ');
    if (separator >= 0) {
      return {
        destinationLabel: 'Receiving Account Number',
        destinationValue: destination.slice(separator + 3).trim() || 'Not provided',
        providerLabel: 'Bank / Payment Provider',
        providerValue: destination.slice(0, separator).trim() || 'Not provided',
      };
    }

    return {
      destinationLabel: 'Receiving Account / Address',
      destinationValue: destination || 'Not provided',
      providerLabel: 'Bank / Payment Provider',
      providerValue: 'Not separately recorded',
    };
  };

  const formatRequestDate = (value: string, options: Intl.DateTimeFormatOptions) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, options);
  };

  const filteredWithdrawals = withdrawalRequests.filter((w) => {
    const matchesFilter = statusFilter === 'all' || w.status === statusFilter;
    const matchesSearch =
      w.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.accountHolderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.bankOrAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.network.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.id || '').toLowerCase().includes(searchQuery.toLowerCase());
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
          <table className="admin-withdrawal-table w-full min-w-[1100px] table-fixed text-left text-xs">
            <colgroup>
              <col style={{ width: '12%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '23%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <thead className="bg-[#161c2b] border-b border-[#21293c] text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-3 py-3">Trader</th>
                <th className="px-3 py-3">Amount</th>
                <th className="px-3 py-3">Account Holder</th>
                <th className="px-3 py-3">Destination / Network</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
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
                    <td data-label="Trader" className="px-3 py-3.5">
                      <div className="font-bold text-white capitalize">{w.userName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">#{w.id}</div>
                    </td>
                    <td data-label="Amount" className="px-3 py-3.5 font-mono font-bold text-rose-400 text-sm">
                      ${w.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td data-label="Account Holder" className="px-3 py-3.5 font-medium text-slate-200 break-words">{w.accountHolderName || 'Not provided'}</td>
                    <td data-label="Destination / Network" className="px-3 py-3.5">
                      <div className="min-w-0 space-y-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-bold uppercase shrink-0">
                            {w.withdrawalType || 'USD'}
                          </span>
                          <span className="min-w-0 font-mono text-[11px] text-slate-200 break-all whitespace-normal" title={w.bankOrAddress}>
                            {w.bankOrAddress || 'Destination not provided'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 break-words">{w.network}</div>
                        {w.notes && (
                          <div className="text-[10px] text-slate-400 italic break-words">
                            Note: {w.notes}
                          </div>
                        )}
                        {w.rejectReason && (
                          <div className="text-[10px] text-rose-400 font-medium break-words">
                            Reason: {w.rejectReason}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setDetailsModalWth(w)}
                          className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold text-cyan-300 hover:bg-cyan-500/20 whitespace-nowrap"
                        >
                          <Eye className="h-3 w-3" />
                          View Full Details
                        </button>
                      </div>
                    </td>
                    <td data-label="Date" className="px-3 py-3.5 font-mono text-[10px] text-slate-400">
                      <div className="whitespace-nowrap">{formatRequestDate(w.timestamp, { year: 'numeric', month: 'short', day: '2-digit' })}</div>
                      <div className="mt-0.5 whitespace-nowrap text-slate-500">{formatRequestDate(w.timestamp, { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td data-label="Status" className="px-3 py-3.5">
                      <span
                        className={`admin-withdrawal-status inline-flex text-[10px] font-bold px-2 py-1 rounded capitalize whitespace-nowrap ${
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
                    <td data-label="Actions" className="px-3 py-3.5 text-right">
                      {w.status === 'pending' ? (
                        <div className="admin-withdrawal-actions flex items-center justify-end gap-2 whitespace-nowrap">
                          <button
                            onClick={() => approveWithdrawal(w.id)}
                            className="admin-withdrawal-action inline-flex shrink-0 items-center gap-1 whitespace-nowrap bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer shadow-sm"
                            title="Approve and Finalize Payout"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span className="whitespace-nowrap">Approve</span>
                          </button>
                          <button
                            onClick={() => setRejectModalWth(w)}
                            className="admin-withdrawal-action inline-flex shrink-0 items-center gap-1 whitespace-nowrap bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer"
                            title="Reject and Refund Balance"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span className="whitespace-nowrap">Reject</span>
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

      {/* Full withdrawal details modal */}
      {detailsModalWth && (() => {
        const recipient = getRecipientDetails(detailsModalWth);
        const request = detailsModalWth;
        return (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/80 p-2 backdrop-blur-sm sm:p-4"
            onClick={() => setDetailsModalWth(null)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="withdrawal-details-title"
              className="my-auto max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#293650] bg-[#111725] p-3 shadow-2xl sm:p-5"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#253047] pb-3">
                <div className="min-w-0">
                  <h3 id="withdrawal-details-title" className="text-sm font-bold text-white sm:text-base">
                    Withdrawal Request Details
                  </h3>
                  <p className="mt-1 break-all font-mono text-[10px] text-slate-400">Request ID: {request.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsModalWth(null)}
                  aria-label="Close withdrawal details"
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-[#222c40] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                <div className="rounded-lg border border-[#263149] bg-[#171f2e] p-3">
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Trader</div>
                  <div className="mt-1 break-words text-xs font-bold text-white">{request.userName}</div>
                </div>
                <div className="rounded-lg border border-[#263149] bg-[#171f2e] p-3">
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Amount</div>
                  <div className="mt-1 text-sm font-bold text-rose-400">
                    ${request.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="rounded-lg border border-[#263149] bg-[#171f2e] p-3">
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Asset / Type</div>
                  <div className="mt-1 text-xs font-bold text-amber-300">{request.withdrawalType || 'USD'}</div>
                </div>
                <div className="rounded-lg border border-[#263149] bg-[#171f2e] p-3">
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Source Wallet</div>
                  <div className="mt-1 text-xs font-bold capitalize text-white">{request.sourceWallet || 'funding'}</div>
                </div>
                <div className="rounded-lg border border-[#263149] bg-[#171f2e] p-3">
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Status</div>
                  <div className="mt-1 text-xs font-bold capitalize text-white">{request.status}</div>
                </div>
                <div className="rounded-lg border border-[#263149] bg-[#171f2e] p-3">
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Requested At</div>
                  <div className="mt-1 break-words text-[11px] text-slate-200">{formatRequestDate(request.timestamp, { dateStyle: 'medium', timeStyle: 'medium' })}</div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-cyan-500/25 bg-[#101a2a] p-3 sm:p-4">
                <h4 className="text-xs font-bold uppercase tracking-wide text-cyan-300">Recipient / Bank Details</h4>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="min-w-0">
                    <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Account Holder</div>
                    <div className="mt-1 break-words text-sm font-semibold text-white">{request.accountHolderName || 'Not provided'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{recipient.providerLabel}</div>
                    <div className="mt-1 break-words text-sm font-semibold text-white">{recipient.providerValue}</div>
                  </div>
                  <div className="min-w-0 sm:col-span-2">
                    <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{recipient.destinationLabel}</div>
                    <div className="mt-1 select-text break-all rounded-lg border border-[#2b3b57] bg-[#0b111c] p-3 font-mono text-sm font-semibold text-amber-200">
                      {recipient.destinationValue}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Network / Transfer Method</div>
                    <div className="mt-1 break-words text-xs text-slate-200">{request.network || 'Not recorded'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Reviewed By</div>
                    <div className="mt-1 break-words text-xs text-slate-200">{request.reviewedBy || 'Not reviewed yet'}</div>
                  </div>
                </div>
                {request.notes && (
                  <div className="mt-3 border-t border-[#263149] pt-3">
                    <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Customer Note</div>
                    <div className="mt-1 whitespace-pre-wrap break-words text-xs text-slate-200">{request.notes}</div>
                  </div>
                )}
                {request.rejectReason && (
                  <div className="mt-3 border-t border-rose-500/20 pt-3">
                    <div className="text-[9px] font-semibold uppercase tracking-wide text-rose-400">Rejection Reason</div>
                    <div className="mt-1 whitespace-pre-wrap break-words text-xs text-rose-200">{request.rejectReason}</div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailsModalWth(null)}
                  className="rounded-lg border border-[#34415a] bg-[#202a3d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2b3850]"
                >
                  Close Details
                </button>
              </div>
            </section>
          </div>
        );
      })()}

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
