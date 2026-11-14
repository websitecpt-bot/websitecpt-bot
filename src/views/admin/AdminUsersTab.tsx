import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Trade, BalanceAdjustment } from '../../types';
import {
  Search,
  UserCheck,
  UserX,
  History,
  DollarSign,
  Shield,
  Eye,
  CheckCircle2,
  X,
  AlertTriangle,
  Plus,
  Minus,
  Wallet,
} from 'lucide-react';

export const AdminUsersTab: React.FC<{ segment: 'new' | 'existing' }> = ({ segment }) => {
  const {
    users,
    updateUserStatus,
    trades,
    balanceAdjustments,
    adjustUserBalance,
    depositRequests,
    withdrawalRequests,
    supportTickets,
    auditLogs,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<User | null>(null);

  // Quick balance adjustment modal
  const [adjustModalUser, setAdjustModalUser] = useState<User | null>(null);
  const [adjustMode, setAdjustMode] = useState<'add' | 'deduct'>('add');
  const [targetWallet, setTargetWallet] = useState<'trading' | 'funding'>('trading');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'bonus' | 'correction' | 'refund' | 'deposit'>('bonus');
  const [adjustReason, setAdjustReason] = useState('');

  const isNewTrader = (u: User) => {
    if (!u.createdAt) return false;
    const raw = u.createdAt.trim();
    const normalized = raw.includes('T') || /Z$|[+-]\\d{2}:?\\d{2}$/.test(raw)
      ? raw
      : `${raw.replace(' ', 'T')}Z`;
    const createdMs = Date.parse(normalized);
    const now = Date.now();
    return Number.isFinite(createdMs) && createdMs <= now + 5 * 60 * 1000 && createdMs >= now - 48 * 3600 * 1000;
  };

  const customerUsers = users.filter((user) => !user.role || user.role === 'user');
  const newTradersCount = customerUsers.filter(isNewTrader).length;
  const existingCustomersCount = customerUsers.length - newTradersCount;
  const filteredUsers = customerUsers.filter((user) => {
    const isInSection = segment === 'new' ? isNewTrader(user) : !isNewTrader(user);
    if (!isInSection) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.uid.toLowerCase().includes(q) ||
      (user.phone || '').toLowerCase().includes(q);
  });

  const openAdjustModal = (user: User, mode: 'add' | 'deduct') => {
    setAdjustModalUser(user);
    setAdjustMode(mode);
    setAdjustAmount('');
    setTargetWallet('trading');
    setAdjustReason(mode === 'add' ? 'Manual credit by Chief Operator' : 'Account balance correction');
    setAdjustType(mode === 'add' ? 'bonus' : 'correction');
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalUser) return;
    const rawAmt = Math.abs(parseFloat(adjustAmount));
    if (isNaN(rawAmt) || rawAmt === 0) return;
    if (!adjustReason.trim()) return;

    const finalAmount = adjustMode === 'deduct' ? -rawAmt : rawAmt;

    adjustUserBalance({
      userId: adjustModalUser.id,
      amount: finalAmount,
      type: adjustType,
      reason: adjustReason,
      wallet: targetWallet,
    });

    setAdjustModalUser(null);
    setAdjustAmount('');
    setAdjustReason('');
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Ribbon */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{segment === 'new' ? 'New User Accounts' : 'Existing Customers'} ({filteredUsers.length})</span>
              {newTradersCount > 0 && (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                  {newTradersCount} NEW
                </span>
              )}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400">
              {segment === 'new'
                ? 'Accounts registered in the last 48 hours.'
                : 'Earlier customer accounts, profiles, transactions and management.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-lg border px-2.5 py-1.5 text-[9px] sm:text-[10px] font-bold ${
            segment === 'new'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
          }`}>
            {segment === 'new' ? `New · ${newTradersCount} (48h)` : `Existing · ${existingCustomersCount}`}
          </span>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, phone or UID..."
              className="w-full bg-[#141926] border border-[#232c40] focus:border-cyan-400 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#121622] border border-[#21293c] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="admin-customer-table w-full text-left text-xs">
            <thead className="bg-[#161c2b] border-b border-[#21293c] text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Trader</th>
                <th className="px-4 py-3">UID</th>
                <th className="px-4 py-3">Referred By</th>
                <th className="px-4 py-3">Trading Balance</th>
                <th className="px-4 py-3">Funding</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Online</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2234]">
              {filteredUsers.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                  {segment === 'new' ? 'No customer registrations in the last 48 hours.' : 'No existing customers match this search.'}
                </td></tr>
              )}
              {filteredUsers.map((user) => {
                const userTrades = trades.filter((t) => t.userId === user.id);
                const isNew = isNewTrader(user);
                const userReferralsCount = users.filter((u) => u.referredByUid === user.uid).length;
                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-[#151b2a] transition-colors ${
                      isNew ? 'bg-emerald-950/15 border-l-2 border-emerald-400' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 font-bold flex items-center justify-center text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white capitalize">{user.name}</span>
                            {user.role === 'superadmin' && (
                              <span className="bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                                SUPER ADMIN
                              </span>
                            )}
                            {isNew && (
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider animate-pulse">
                                NEW TRADER
                              </span>
                            )}
                            {userReferralsCount > 0 && (
                              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                {userReferralsCount} Reffered
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-cyan-400 font-semibold">{user.uid}</td>
                    <td className="px-4 py-3.5 font-mono text-[11px]">
                      {user.referredByUid ? (
                        <span className="text-cyan-400 font-bold bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                          UID: {user.referredByUid}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Organic (Master)</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-white">
                      ${user.tradingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      ${user.fundingBalance.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                      {user.createdAt ? user.createdAt.slice(0, 16) : 'N/A'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                          user.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {user.isOnline ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          Online
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Offline</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* + Add Balance Quick Button */}
                        <button
                          onClick={() => openAdjustModal(user, 'add')}
                          className="bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 px-2 py-1.5 rounded-lg transition-all font-bold flex items-center gap-1 text-[11px] shadow-sm cursor-pointer"
                          title={`Add Funds (+) to ${user.name}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>

                        {/* - Minus Balance Quick Button */}
                        <button
                          onClick={() => openAdjustModal(user, 'deduct')}
                          className="bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 px-2 py-1.5 rounded-lg transition-all font-bold flex items-center gap-1 text-[11px] shadow-sm cursor-pointer"
                          title={`Deduct Funds (-) from ${user.name}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                          <span>Minus</span>
                        </button>

                        {/* View History Drilldown */}
                        <button
                          onClick={() => setSelectedUserForHistory(user)}
                          className="bg-[#1b2334] hover:bg-[#253046] text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="View Complete User Trade & Transaction History"
                        >
                          <History className="w-3.5 h-3.5 text-cyan-400" />
                        </button>

                        {/* Adjust Balance Modal */}
                        <button
                          onClick={() => openAdjustModal(user, 'add')}
                          className="bg-[#1b2334] hover:bg-[#253046] text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Detailed Balance Adjustment"
                        >
                          <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                        </button>

                        {/* Suspend / Activate */}
                        {user.status === 'active' ? (
                          <button
                            onClick={() => updateUserStatus(user.id, 'suspended')}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors"
                            title="Temporarily Block / Suspend User"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => updateUserStatus(user.id, 'active')}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors"
                            title="Unblock User"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* USER COMPLETE HISTORY DRILL-DOWN MODAL (Requirement 2: View complete trading and transaction history of a specific user) */}
      {selectedUserForHistory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111522] border border-[#232c40] rounded-xl sm:rounded-2xl w-full max-w-3xl max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-[#151a28] border-b border-[#20283c] px-3 sm:px-5 py-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Trading & Transaction Record:</span>
                  <span className="text-cyan-400 capitalize">{selectedUserForHistory.name}</span>
                  <span className="text-xs font-mono text-slate-400">(UID: {selectedUserForHistory.uid})</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Current Trading Balance: ${selectedUserForHistory.tradingBalance.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedUserForHistory(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 sm:p-5 overflow-y-auto overscroll-contain space-y-4">
              <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  ['Email', selectedUserForHistory.email || 'Not provided'],
                  ['Phone', selectedUserForHistory.phone || 'Not provided'],
                  ['Status', selectedUserForHistory.status],
                  ['Registered', selectedUserForHistory.createdAt || 'Not recorded'],
                  ['Trading', `${selectedUserForHistory.tradingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
                  ['Funding', `${selectedUserForHistory.fundingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
                  ['Referral UID', selectedUserForHistory.referredByUid || 'Direct'],
                  ['Presence', selectedUserForHistory.isOnline ? 'Online' : 'Offline'],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0 rounded-lg border border-[#263149] bg-[#151b2a] p-2">
                    <div className="text-[9px] uppercase tracking-wide text-slate-500">{label}</div>
                    <div className="mt-1 break-words text-[10px] sm:text-xs font-semibold text-slate-200">{value}</div>
                  </div>
                ))}
              </section>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-[#263149] bg-[#151b2a] p-2"><div className="text-[9px] text-slate-500">Trades</div><div className="text-sm font-bold text-white">{trades.filter((t) => t.userId === selectedUserForHistory.id).length}</div></div>
                <div className="rounded-lg border border-[#263149] bg-[#151b2a] p-2"><div className="text-[9px] text-slate-500">Deposits</div><div className="text-sm font-bold text-white">{depositRequests.filter((d) => d.userId === selectedUserForHistory.id).length}</div></div>
                <div className="rounded-lg border border-[#263149] bg-[#151b2a] p-2"><div className="text-[9px] text-slate-500">Withdrawals</div><div className="text-sm font-bold text-white">{withdrawalRequests.filter((w) => w.userId === selectedUserForHistory.id).length}</div></div>
              </div>

              {/* Trades section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  All Trades Recorded
                </h4>
                {trades.filter((t) => t.userId === selectedUserForHistory.id).length === 0 ? (
                  <p className="text-xs text-slate-500">No trades found for this trader.</p>
                ) : (
                  <div className="space-y-2">
                    {trades
                      .filter((t) => t.userId === selectedUserForHistory.id)
                      .map((t) => {
                        const isProfit = t.pnl >= 0;
                        return (
                          <div
                            key={t.id}
                            className="bg-[#151a27] border border-[#222a3d] rounded-xl p-3 flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{t.symbol}</span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                    t.type === 'BUY'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-rose-500/20 text-rose-400'
                                  }`}
                                >
                                  {t.type} {t.leverage}x
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">#{t.id}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                Entry: ${t.entryPrice.toLocaleString()} | Exit: $
                                {(t.exitPrice || t.currentPrice).toLocaleString()}
                              </div>
                              <div className="text-[10px] text-slate-500">{t.openedAt}</div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`font-mono font-bold text-sm block ${
                                  isProfit ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isProfit ? '+' : ''}${t.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-[10px] text-slate-400">Margin: ${t.margin.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Customer deposit history */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-2">Deposit History</h4>
                {depositRequests.filter((d) => d.userId === selectedUserForHistory.id).length === 0 ? <p className="text-xs text-slate-500">No deposit requests recorded.</p> : (
                  <div className="space-y-2">
                    {depositRequests.filter((d) => d.userId === selectedUserForHistory.id).map((d) => (
                      <div key={d.id} className="rounded-lg border border-[#263149] bg-[#151b2a] p-3 text-[10px] sm:text-xs">
                        <div className="flex flex-wrap justify-between gap-2"><strong className="text-white">${d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} · {d.status.toUpperCase()}</strong><span className="text-slate-500">{d.timestamp}</span></div>
                        <div className="mt-1 break-words text-slate-400">{d.paymentMethod} · {d.network || 'Network not recorded'}</div>
                        <div className="mt-1 break-all font-mono text-slate-500">TXID: {d.txid || 'Not recorded'}</div>
                        {d.note && <div className="mt-1 text-slate-400">Note: {d.note}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Customer withdrawal history */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-2">Withdrawal History</h4>
                {withdrawalRequests.filter((w) => w.userId === selectedUserForHistory.id).length === 0 ? <p className="text-xs text-slate-500">No withdrawal requests recorded.</p> : (
                  <div className="space-y-2">
                    {withdrawalRequests.filter((w) => w.userId === selectedUserForHistory.id).map((w) => (
                      <div key={w.id} className="rounded-lg border border-[#263149] bg-[#151b2a] p-3 text-[10px] sm:text-xs">
                        <div className="flex flex-wrap justify-between gap-2"><strong className="text-white">${w.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} · {w.status.toUpperCase()}</strong><span className="text-slate-500">{w.timestamp}</span></div>
                        <div className="mt-1 break-words text-slate-400">{w.accountHolderName} · {w.withdrawalType || 'USD'}</div>
                        <div className="mt-1 break-all font-mono text-slate-400">{w.bankOrAddress}</div>
                        <div className="mt-1 text-slate-500">{w.network} · {w.sourceWallet || 'Wallet source not recorded'}</div>
                        {w.rejectReason && <div className="mt-1 text-rose-300">Reason: {w.rejectReason}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Customer support history */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-2">Support History</h4>
                {supportTickets.filter((t) => t.userId === selectedUserForHistory.id).length === 0 ? <p className="text-xs text-slate-500">No support sessions recorded.</p> : (
                  <div className="space-y-2">
                    {supportTickets.filter((t) => t.userId === selectedUserForHistory.id).map((ticket) => (
                      <div key={ticket.id} className="rounded-lg border border-[#263149] bg-[#151b2a] p-3">
                        <div className="flex flex-wrap justify-between gap-2 text-[10px]"><strong className="text-white">Session {ticket.sessionNumber || '—'} · {ticket.status}</strong><span className="text-slate-500">{ticket.lastMessageTime}</span></div>
                        <div className="mt-1 text-[10px] text-slate-400">{ticket.messages.length} messages · {ticket.lastMessage || 'No message preview'}</div>
                        <div className="mt-2 space-y-1 border-t border-[#263149] pt-2">
                          {ticket.messages.map((message) => (
                            <div key={message.id} className="text-[10px] text-slate-400">
                              <span className={message.sender === 'admin' ? 'text-cyan-300' : 'text-emerald-300'}>{message.senderName}</span>
                              <span className="text-slate-600"> · {message.timestamp}</span>
                              <div className="break-words text-slate-300">{message.isDeleted ? 'Message deleted' : message.text || (message.attachmentName ? `Attachment: ${message.attachmentName}` : 'Attachment')}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cloud-synced activity history */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-2">Admin Activity History</h4>
                {auditLogs.filter((log) =>
                  log.target.includes(selectedUserForHistory.uid) ||
                  log.target.includes(selectedUserForHistory.id)
                ).length === 0 ? (
                  <p className="text-xs text-slate-500">No matching admin activity records are available.</p>
                ) : (
                  <div className="space-y-2">
                    {auditLogs.filter((log) =>
                      log.target.includes(selectedUserForHistory.uid) ||
                      log.target.includes(selectedUserForHistory.id)
                    ).map((log) => (
                      <div key={log.id} className="rounded-lg border border-[#263149] bg-[#151b2a] p-3 text-[10px] sm:text-xs">
                        <div className="flex flex-wrap justify-between gap-2">
                          <strong className="text-cyan-300">{log.action}</strong>
                          <span className="text-slate-500">{log.timestamp}</span>
                        </div>
                        <div className="mt-1 text-slate-300">{log.details}</div>
                        <div className="mt-1 text-slate-500">By {log.adminName}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Balance Adjustments section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Balance Audit History
                </h4>
                {balanceAdjustments.filter((b) => b.userId === selectedUserForHistory.id).length === 0 ? (
                  <p className="text-xs text-slate-500">No balance adjustments logged for this user.</p>
                ) : (
                  <div className="space-y-2">
                    {balanceAdjustments
                      .filter((b) => b.userId === selectedUserForHistory.id)
                      .map((adj) => (
                        <div
                          key={adj.id}
                          className="bg-[#151a27] border border-[#222a3d] rounded-xl p-3 text-xs space-y-1"
                        >
                          <div className="flex justify-between font-bold">
                            <span className="text-white uppercase">{adj.type}</span>
                            <span
                              className={`font-mono ${
                                adj.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {adj.amount >= 0 ? '+' : ''}${adj.amount.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px]">{adj.reason}</p>
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                            <span>Admin: {adj.adminName}</span>
                            <span>{adj.timestamp}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BALANCE ADJUSTMENT QUICK MODAL */}
      {adjustModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111522] border border-[#232c40] rounded-xl sm:rounded-2xl w-full max-w-md max-h-[92dvh] overflow-y-auto p-3 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#20283c] pb-3 mb-4">
              <h3 className="text-sm font-bold text-white">
                Adjust Balance: <span className="text-cyan-400">{adjustModalUser.name}</span>
              </h3>
              <button
                onClick={() => setAdjustModalUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Adjustment Type
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
                >
                  <option value="bonus">Promotional Bonus (+)</option>
                  <option value="deposit">Approved Manual Deposit (+)</option>
                  <option value="refund">Trade / Disputed Refund (+)</option>
                  <option value="correction">Balance Correction (+/-)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Amount ($) — Use negative sign for deduction (e.g. -500)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 500 or -250"
                  className="w-full bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 rounded-xl px-3 py-2 text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Reason for Adjustment (Required - Visible to User)
                </label>
                <textarea
                  required
                  rows={3}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. VIP promo bonus / Approved offline wire / Execution correction"
                  className="w-full bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 rounded-xl p-3 text-white outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-black font-extrabold py-2.5 rounded-xl transition-all shadow-md shadow-cyan-500/25 cursor-pointer"
              >
                Apply Balance Change
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
