import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, ArrowUpDown, Wallet, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const TransferModal: React.FC = () => {
  const {
    currentUser,
    isTransferModalOpen,
    setIsTransferModalOpen,
    transferFunds,
  } = useApp();

  const [fromWallet, setFromWallet] = useState<'funding' | 'trading'>('funding');
  const [toWallet, setToWallet] = useState<'funding' | 'trading'>('trading');
  const [amountInput, setAmountInput] = useState<string>('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isTransferModalOpen) return null;

  const fundingBal = currentUser.fundingBalance || 0;
  const tradingBal = currentUser.tradingBalance || 0;
  const sourceAvailable = fromWallet === 'funding' ? fundingBal : tradingBal;

  const handleSwap = () => {
    setFromWallet((prev) => (prev === 'funding' ? 'trading' : 'funding'));
    setToWallet((prev) => (prev === 'funding' ? 'trading' : 'funding'));
    setAmountInput('');
    setNotification(null);
  };

  const handlePercentage = (percent: number) => {
    const calculated = (sourceAvailable * (percent / 100)).toFixed(2);
    setAmountInput(calculated);
    setNotification(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountInput);

    if (isNaN(amount) || amount <= 0) {
      setNotification({ type: 'error', message: 'Please enter a valid transfer amount.' });
      return;
    }

    if (amount > sourceAvailable) {
      setNotification({
        type: 'error',
        message: `Insufficient funds in ${fromWallet === 'funding' ? 'Funding' : 'Trading'} Wallet.`,
      });
      return;
    }

    setIsSubmitting(true);
    const res = transferFunds({ fromWallet, toWallet, amount });
    setIsSubmitting(false);

    if (res.success) {
      setNotification({ type: 'success', message: res.message });
      setAmountInput('');
      setTimeout(() => {
        setIsTransferModalOpen(false);
        setNotification(null);
      }, 1500);
    } else {
      setNotification({ type: 'error', message: res.message });
    }
  };

  const parsedAmount = parseFloat(amountInput) || 0;
  const newSourceBalance = Math.max(0, sourceAvailable - parsedAmount);
  const targetAvailable = toWallet === 'funding' ? fundingBal : tradingBal;
  const newTargetBalance = targetAvailable + parsedAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#121622] border border-[#232c3f] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2738] bg-[#0d101a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Internal Transfer</h3>
              <p className="text-[11px] text-slate-400">Instant transfer between your CPT accounts</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsTransferModalOpen(false);
              setNotification(null);
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a2130] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {notification && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                notification.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Direction Transfer Container */}
          <div className="bg-[#0b0e16] border border-[#1d2436] rounded-xl p-4 relative">
            {/* From Wallet */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">From</span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white capitalize">
                  {fromWallet === 'funding' ? 'Funding Wallet' : 'Trading Wallet'}
                </span>
                <span className="text-xs font-mono text-amber-400">
                  ${sourceAvailable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Swap Button Divider */}
            <div className="my-3 relative flex items-center justify-center">
              <div className="w-full border-t border-[#1d2436]"></div>
              <button
                type="button"
                onClick={handleSwap}
                className="absolute bg-[#1a2133] hover:bg-amber-400 hover:text-black text-amber-400 border border-[#2b354d] p-1.5 rounded-full transition-all shadow-md group cursor-pointer"
                title="Switch Direction"
              >
                <ArrowUpDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
              </button>
            </div>

            {/* To Wallet */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">To</span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white capitalize">
                  {toWallet === 'funding' ? 'Funding Wallet' : 'Trading Wallet'}
                </span>
                <span className="text-xs font-mono text-slate-300">
                  ${targetAvailable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Transfer Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="text-slate-300 font-medium">Transfer Amount (USDT)</label>
              <span className="text-slate-400 text-[11px]">
                Max: <strong className="text-amber-400 font-mono">${sourceAvailable.toFixed(2)}</strong>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.01"
                max={sourceAvailable}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#151a26] border border-[#242d40] focus:border-amber-400 rounded-xl px-4 py-3 text-white font-mono text-base outline-none transition-colors pr-16"
              />
              <button
                type="button"
                onClick={() => handlePercentage(100)}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 rounded-md transition-colors"
              >
                MAX
              </button>
            </div>

            {/* Quick Percentage Buttons */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePercentage(p)}
                  className="py-1 px-2 text-xs font-semibold rounded-lg bg-[#182030] hover:bg-[#20293d] border border-[#232c40] text-slate-300 hover:text-white transition-colors"
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Transfer Preview */}
          {parsedAmount > 0 && (
            <div className="bg-[#0e121c] border border-[#1c2436] rounded-xl p-3 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Fee</span>
                <span className="text-emerald-400 font-bold">$0.00 (Zero Fee)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Speed</span>
                <span className="text-white">Instant</span>
              </div>
              <div className="flex justify-between text-slate-300 pt-1 border-t border-[#1b2233]">
                <span>New {fromWallet} Balance</span>
                <span className="text-slate-200">${newSourceBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>New {toWallet} Balance</span>
                <span className="text-amber-400 font-bold">${newTargetBalance.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={isSubmitting || sourceAvailable <= 0}
            className="w-full bg-[#f4b41a] hover:bg-[#e0a416] text-black font-extrabold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Confirm Transfer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
