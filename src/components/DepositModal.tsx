import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Headphones,
  ShieldAlert,
  ArrowRight,
  Send,
  CheckCircle2,
  AlertCircle,
  CreditCard,
} from 'lucide-react';

export const DepositModal: React.FC = () => {
  const {
    isDepositModalOpen,
    setIsDepositModalOpen,
    setIsSupportOpen,
    sendUserMessage,
    submitDepositRequest,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'instruction' | 'submitTxid'>('instruction');
  const [amount, setAmount] = useState('');
  const [txid, setTxid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('USDT (TRC-20)');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isDepositModalOpen) return null;

  const handleOpenSupport = () => {
    setIsDepositModalOpen(false);
    sendUserMessage('Hello Support, I would like to deposit funds into my account. Please provide the verified deposit address.');
    setIsSupportOpen(true);
  };

  const handleTxidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setFeedback('Please enter a valid deposit amount.');
      return;
    }
    if (!txid.trim()) {
      setFeedback('Please enter your transaction ID (TXID).');
      return;
    }

    submitDepositRequest({
      amount: amt,
      txid,
      paymentMethod,
      note: 'User submitted proof of deposit via Deposit Portal',
    });

    setFeedback('Deposit submitted! Our admin team has received your transaction ID for verification.');
    setAmount('');
    setTxid('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111522] border border-[#232c40] rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#1e263a] pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Deposit Funds</h3>
          </div>
          <button
            onClick={() => setIsDepositModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-[#0c0f17] p-1 rounded-xl mb-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('instruction')}
            className={`py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'instruction'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Official Support Notice
          </button>
          <button
            onClick={() => setActiveTab('submitTxid')}
            className={`py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'submitTxid'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Submit Transaction ID
          </button>
        </div>

        {/* Local Currency Notice matching exact user requirement */}
        <div className="bg-[#182133] border border-amber-400/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200 mb-4 shadow-sm">
          <Headphones className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold text-amber-300">Notice: </span>
            To deposit in your local currency, contact Customer Support to exchange it to USD and complete your deposit.
          </p>
        </div>

        {activeTab === 'instruction' ? (
          <div className="space-y-5 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 mx-auto flex items-center justify-center">
              <Headphones className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-white">
                Contact Official Support for Deposit
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed px-2">
                To guarantee bank-grade security, prevent network fraud, and obtain the active verified deposit address, all deposits must be coordinated through our 24/7 Live Support Desk.
              </p>
            </div>

            <div className="bg-[#161c2a] border border-[#253046] rounded-xl p-3.5 text-xs text-slate-300 text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Security Guidelines</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li>Never send funds to unverified external contacts.</li>
                <li>Request verified TRC20, ERC20 or Wire details directly from our UK operator.</li>
                <li>Your balance will be credited promptly upon TXID confirmation.</li>
              </ul>
            </div>

            <button
              onClick={handleOpenSupport}
              className="w-full bg-[#f4b41a] hover:bg-[#e0a416] text-black font-extrabold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Headphones className="w-4 h-4" />
              <span>Contact Live Support Desk</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleTxidSubmit} className="space-y-4">
            <p className="text-xs text-slate-400">
              Already transferred funds? Submit your TXID for instant admin review and balance crediting.
            </p>

            {feedback && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Deposit Amount ($)
              </label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full bg-[#151a26] border border-[#242d40] focus:border-amber-400 rounded-xl px-4 py-2 text-white font-mono text-sm outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Payment Method / Network
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-[#151a26] border border-[#242d40] focus:border-amber-400 rounded-xl px-4 py-2 text-white text-sm outline-none"
              >
                <option value="USDT (TRC-20)">USDT (TRC-20 Tron)</option>
                <option value="USDT (ERC-20)">USDT (ERC-20 Ethereum)</option>
                <option value="Bitcoin (BTC)">Bitcoin Mainnet</option>
                <option value="Bank Wire">UK Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Transaction ID (TXID) / Hash
              </label>
              <input
                type="text"
                required
                value={txid}
                onChange={(e) => setTxid(e.target.value)}
                placeholder="Enter transaction hash or reference"
                className="w-full bg-[#151a26] border border-[#242d40] focus:border-amber-400 rounded-xl px-4 py-2 text-white font-mono text-xs outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Submit for Admin Verification
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
