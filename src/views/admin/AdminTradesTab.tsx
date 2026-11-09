import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Trade, TradeStatus } from '../../types';
import {
  TrendingUp,
  Search,
  Activity,
  CheckCircle2,
  Clock,
  Filter,
  Zap,
  Sliders,
  DollarSign,
} from 'lucide-react';

export const AdminTradesTab: React.FC = () => {
  const { trades, closeTrade, coins, setCoinPrice, applyMarketShock } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | TradeStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fast Market Stress-Testing / Benchmark State
  const [testSymbol, setTestSymbol] = useState('ETH');
  const activeTestCoin = coins.find((c) => c.symbol === testSymbol) || coins[0];
  const [calibratedPriceInput, setCalibratedPriceInput] = useState<string>(activeTestCoin.price.toString());
  const [calibratedSuccess, setCalibratedSuccess] = useState<string | null>(null);

  const filteredTrades = trades.filter((t) => {
    const matchesFilter = statusFilter === 'all' || t.status === statusFilter;
    const matchesSearch =
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openCount = trades.filter((t) => t.status === 'OPEN').length;
  const closedCount = trades.filter((t) => t.status === 'CLOSED').length;

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(calibratedPriceInput);
    if (!p || p <= 0) return;
    setCoinPrice(testSymbol, p);
    setCalibratedSuccess(`Benchmark price for ${testSymbol} set to $${p.toLocaleString()}. User positions updated below!`);
    setTimeout(() => setCalibratedSuccess(null), 3000);
  };

  const handleQuickShock = (percentage: number) => {
    applyMarketShock(testSymbol, percentage);
    const updated = coins.find((c) => c.symbol === testSymbol);
    if (updated) {
      setCalibratedPriceInput((updated.price * (1 + percentage / 100)).toFixed(2));
    }
    setCalibratedSuccess(`Applied ${percentage >= 0 ? '+' : ''}${percentage}% volatility shock to ${testSymbol}. Recalculating PnL!`);
    setTimeout(() => setCalibratedSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Trading Management (All Users)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Monitor real-time positions, leverage execution, timestamps, and automated PnL calculations.
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
            All Trades ({trades.length})
          </button>
          <button
            onClick={() => setStatusFilter('OPEN')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'OPEN'
                ? 'bg-cyan-400 text-black font-bold shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Open Trades ({openCount})
          </button>
          <button
            onClick={() => setStatusFilter('CLOSED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === 'CLOSED'
                ? 'bg-emerald-500 text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Closed Trades ({closedCount})
          </button>
        </div>
      </div>

      {/* FAST MARKET BENCHMARK & STRESS-TEST WIDGET */}
      <div className="bg-[#121622] border border-[#21293c] rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white uppercase tracking-wider">
              Market Benchmark & Stress-Test Simulator:
            </span>
            <span className="text-slate-400 hidden sm:inline">
              (Calibrates coin price to test liquidations, stop-loss & PnL below)
            </span>
          </div>

          {calibratedSuccess && (
            <span className="text-emerald-400 font-semibold text-[11px] animate-pulse">
              ✓ {calibratedSuccess}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Symbol Selector */}
          <select
            value={testSymbol}
            onChange={(e) => {
              setTestSymbol(e.target.value);
              const target = coins.find((c) => c.symbol === e.target.value);
              if (target) setCalibratedPriceInput(target.price.toString());
            }}
            className="bg-[#161c2a] border border-[#242e44] text-cyan-400 font-bold rounded-xl px-3 py-2 text-xs outline-none"
          >
            {coins.map((c) => (
              <option key={c.symbol} value={c.symbol}>
                {c.symbol} (Now: ${c.price.toLocaleString()})
              </option>
            ))}
          </select>

          {/* Form to set exact benchmark price */}
          <form onSubmit={handleApplyPrice} className="flex items-center gap-2 flex-1 min-w-[240px]">
            <input
              type="number"
              step="any"
              value={calibratedPriceInput}
              onChange={(e) => setCalibratedPriceInput(e.target.value)}
              placeholder="Benchmark Price ($)"
              className="flex-1 bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-black font-extrabold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer whitespace-nowrap shadow-sm shadow-cyan-500/20"
            >
              Apply Benchmark
            </button>
          </form>

          {/* Quick Stress Test Buttons */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleQuickShock(5)}
              className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 px-2 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer"
            >
              ▲ +5%
            </button>
            <button
              type="button"
              onClick={() => handleQuickShock(10)}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer"
            >
              ▲ +10%
            </button>
            <button
              type="button"
              onClick={() => handleQuickShock(-5)}
              className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 px-2 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer"
            >
              ▼ -5%
            </button>
            <button
              type="button"
              onClick={() => handleQuickShock(-10)}
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer"
            >
              ▼ -10%
            </button>
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-[#121622] border border-[#21293c] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1f273a] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            User Positions Ledger
          </span>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trader, symbol, ID..."
              className="w-full bg-[#161c2a] border border-[#242e42] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161c2b] border-b border-[#21293c] text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Trader & Symbol</th>
                <th className="px-4 py-3">Type & Lev</th>
                <th className="px-4 py-3">Entry Price</th>
                <th className="px-4 py-3 text-cyan-400">Exit / Current</th>
                <th className="px-4 py-3">Margin & Size</th>
                <th className="px-4 py-3">Profit / Loss</th>
                <th className="px-4 py-3">Executed At</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2234]">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No trades found in this view.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((t) => {
                  const isProfit = t.pnl >= 0;
                  return (
                    <tr key={t.id} className="hover:bg-[#151a28] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white capitalize">{t.userName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">#{t.id}</span>
                        </div>
                        <span className="font-extrabold text-cyan-400 text-xs block mt-0.5">
                          {t.symbol}/USDT
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            t.type === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {t.type} {t.leverage}x
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {t.durationMinutes}m duration
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-200">
                        ${t.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-cyan-300 bg-cyan-400/5">
                        ${(t.exitPrice || t.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 font-mono">
                        <div className="text-white font-medium">${t.margin.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">
                          Pos: ${t.positionSize.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono">
                        <span
                          className={`font-bold text-xs ${
                            isProfit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isProfit ? '+' : ''}${t.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {isProfit ? '+' : ''}{t.pnlPercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                        <div>{t.openedAt}</div>
                        {t.closedAt && (
                          <div className="text-[10px] text-slate-500">Closed: {t.closedAt.slice(11)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {t.status === 'OPEN' ? (
                          <button
                            onClick={() => closeTrade(t.id)}
                            className="bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-sm shadow-cyan-500/20"
                            title="Force Close Trade"
                          >
                            Close Trade
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 uppercase bg-[#181f2f] px-2 py-0.5 rounded">
                            Settled
                          </span>
                        )}
                      </td>
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
