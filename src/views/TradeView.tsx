import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TradeType } from '../types';
import {
  TrendingDown,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';

const DURATION_OPTIONS = [
  { label: '1 min', value: 1 },
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
];

export const TradeCountdown: React.FC<{
  tradeId: string;
  expiresAt: string;
  expiresAtMs?: number;
  onExpire: () => void;
}> = ({ expiresAt, expiresAtMs, onExpire }) => {
  const getRemainingSeconds = () => {
    const target =
      expiresAtMs ||
      (expiresAt.includes('T')
        ? new Date(expiresAt).getTime()
        : new Date(expiresAt.replace(' ', 'T') + 'Z').getTime() ||
          new Date(expiresAt).getTime());
    return Math.max(0, Math.ceil((target - Date.now()) / 1000));
  };

  const [timeLeft, setTimeLeft] = useState<number>(getRemainingSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getRemainingSeconds();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onExpire();
      }
    }, 500);
    return () => clearInterval(timer);
  }, [expiresAt, expiresAtMs, onExpire]);

  return (
    <span className="font-mono text-xs text-amber-400 font-bold flex items-center gap-1">
      <span>⏳</span>
      <span>{timeLeft}s</span>
    </span>
  );
};

export const TradeView: React.FC = () => {
  const {
    currentUser,
    coins,
    selectedSymbol,
    setSelectedSymbol,
    activeCoin,
    openTrade,
    trades,
    closeTrade,
    setSelectedTradeDetails,
  } = useApp();

  const [leverage, setLeverage] = useState<number>(10);
  const [durationMinutes, setDurationMinutes] = useState<number>(1);
  const [marginInput, setMarginInput] = useState<string>('100');
  const [orderNotification, setOrderNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const margin = parseFloat(marginInput) || 0;
  const positionSize = margin * leverage;
  // User requirement: display shows Fee (0.1%), but actual formula is 0.0005% ($5.00 on $1,000,000 position size)
  const fee = Number((positionSize * 0.000005).toFixed(2));

  const halfSpread = activeCoin.spread / 2;
  const bidPrice = activeCoin.price - halfSpread;
  const askPrice = activeCoin.price + halfSpread;

  const handleOrder = (type: TradeType) => {
    if (margin <= 0) {
      setOrderNotification({ type: 'error', message: 'Please enter a valid margin amount.' });
      return;
    }

    const res = openTrade({
      symbol: selectedSymbol,
      type,
      leverage,
      margin,
      durationMinutes,
    });

    setOrderNotification({
      type: res.success ? 'success' : 'error',
      message: res.message,
    });

    if (res.success) {
      setTimeout(() => setOrderNotification(null), 4000);
    }
  };

  // User's open trades
  const userOpenTrades = trades.filter(
    (t) => t.userId === currentUser.id && t.status === 'OPEN'
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Order Ticket Container */}
      <div className="bg-[#10141f] border border-[#1e2538] rounded-2xl p-5 sm:p-7 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1b2131] pb-4 mb-5">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
            Order Ticket
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Free Margin (Trading):</span>
            <span className="font-mono font-bold text-amber-400">
              ${currentUser.tradingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Coin Selector Pills matching screenshot */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none mb-6">
          {coins.map((coin) => {
            const isSelected = coin.symbol === selectedSymbol;
            return (
              <button
                key={coin.symbol}
                onClick={() => setSelectedSymbol(coin.symbol)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-500/25 ring-1 ring-amber-400'
                    : 'bg-[#181f2e] text-slate-300 hover:text-white hover:bg-[#20293d] border border-[#242e42]'
                }`}
              >
                {coin.symbol}
              </button>
            );
          })}
        </div>

        {/* Sell (Bid) and Buy (Ask) Cards matching screenshot */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
          {/* Sell Box */}
          <div className="bg-[#1c1216] border border-rose-900/40 rounded-xl p-4 text-center">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
              SELL (Bid)
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-rose-500 mt-1">
              {bidPrice.toLocaleString(undefined, {
                minimumFractionDigits: activeCoin.price > 100 ? 2 : 4,
                maximumFractionDigits: activeCoin.price > 100 ? 2 : 4,
              })}
            </div>
          </div>

          {/* Buy Box */}
          <div className="bg-[#0f1d1b] border border-emerald-900/40 rounded-xl p-4 text-center">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              BUY (Ask)
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-400 mt-1">
              {askPrice.toLocaleString(undefined, {
                minimumFractionDigits: activeCoin.price > 100 ? 2 : 4,
                maximumFractionDigits: activeCoin.price > 100 ? 2 : 4,
              })}
            </div>
          </div>
        </div>

        {/* Spread Info */}
        <div className="text-xs text-slate-400 font-mono mb-5 flex justify-between">
          <span>Spread: {activeCoin.spread.toFixed(4)}</span>
          <span>Market Feed: Standard Fast Execution</span>
        </div>

        {/* Leverage Controls - Editable Input matching Screenshot 2 */}
        <div className="flex items-center justify-between mb-5">
          <label className="text-xs text-slate-300 font-medium">Leverage</label>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 bg-[#141a27] border border-[#232d42] rounded-lg px-3 py-1.5 focus-within:border-amber-400">
              <input
                type="number"
                min={1}
                max={activeCoin.maxLeverage}
                value={leverage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (isNaN(val)) {
                    setLeverage(1);
                  } else {
                    setLeverage(Math.min(activeCoin.maxLeverage, Math.max(1, val)));
                  }
                }}
                className="w-16 bg-transparent text-right font-mono font-bold text-amber-400 text-sm outline-none"
              />
              <span className="font-bold text-slate-300 text-sm">x</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Maximum leverage limit: <strong className="text-amber-400 font-bold">{activeCoin.maxLeverage}x</strong>
            </div>
          </div>
        </div>

        {/* Expiry Duration matching screenshot */}
        <div className="space-y-2 mb-5">
          <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Expiry Duration</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDurationMinutes(opt.value)}
                className={`py-2 text-xs font-semibold rounded-lg transition-all border ${
                  durationMinutes === opt.value
                    ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                    : 'border-[#222a3d] bg-[#141a27] text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Margin Input matching Screenshot 2 (25% Balance removed, Free Margin shown in yellow below input) */}
        <div className="space-y-1.5 mb-6">
          <div className="flex items-center justify-between text-xs">
            <label className="text-slate-300 font-medium">Margin (USDT)</label>
          </div>
          <div className="relative">
            <input
              type="number"
              value={marginInput}
              onChange={(e) => setMarginInput(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#151a26] border border-[#242d40] focus:border-amber-400 rounded-xl px-4 py-3 text-white font-mono text-base outline-none transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              USDT
            </span>
          </div>
          <div className="text-xs text-amber-400 font-bold mt-1.5">
            Free Margin (Trading Wallet): ${currentUser.tradingBalance.toFixed(2)}
          </div>
        </div>

        {/* Calculations Breakdown matching screenshot */}
        <div className="bg-[#0b0e15] border border-[#1a202e] rounded-xl p-3.5 space-y-2 text-xs mb-6">
          <div className="flex justify-between text-slate-400">
            <span>Position Size</span>
            <span className="font-mono font-medium text-slate-200">
              ${positionSize.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Fee (0.1%)</span>
            <span className="font-mono font-medium text-slate-200">${fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Duration</span>
            <span className="font-mono font-medium text-slate-200">{durationMinutes} min</span>
          </div>
        </div>

        {/* Order Notification message */}
        {orderNotification && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs flex items-center justify-between ${
              orderNotification.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {orderNotification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{orderNotification.message}</span>
            </div>
            <button onClick={() => setOrderNotification(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Big Action Buttons matching screenshot */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleOrder('SELL')}
            className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-rose-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <TrendingDown className="w-4 h-4" />
            <span>SELL</span>
          </button>
          <button
            onClick={() => handleOrder('BUY')}
            className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <TrendingUp className="w-4 h-4" />
            <span>BUY</span>
          </button>
        </div>
      </div>

      {/* Open Trades Container matching screenshot */}
      <div className="bg-[#10141f] border border-[#1e2538] rounded-2xl p-5 sm:p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span>Open Trades ({userOpenTrades.length})</span>
          {userOpenTrades.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          )}
        </h3>

        {userOpenTrades.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-[#1f2637] rounded-xl">
            No active open trades right now.
          </div>
        ) : (
          <div className="space-y-3">
            {userOpenTrades.map((t) => {
              const isProfit = t.pnl >= 0;
              return (
                <div
                  key={t.id}
                  className="bg-[#151a27] border border-[#222a3d] hover:border-[#323d57] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">{t.symbol}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          t.type === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {t.type} {t.leverage}x
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-1">
                      Entry {t.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} · Margin ${t.margin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
                    <div
                      className={`font-mono font-bold text-sm ${
                        isProfit ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isProfit ? '+' : ''}{t.pnl.toFixed(2)}
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Live Duration Countdown Timer matching screenshot */}
                      <TradeCountdown
                        tradeId={t.id}
                        expiresAt={t.expiresAt}
                        expiresAtMs={t.expiresAtMs}
                        onExpire={() => closeTrade(t.id)}
                      />

                      <button
                        onClick={() => closeTrade(t.id)}
                        className="bg-[#212738] hover:bg-[#2c354c] text-slate-200 hover:text-white border border-[#303c58] text-xs font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer shadow-sm"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
