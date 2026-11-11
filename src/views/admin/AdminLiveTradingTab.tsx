import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Trade } from '../../types';
import {
  Radio,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Zap,
  Sliders,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const AdminLiveTradingTab: React.FC = () => {
  const {
    trades,
    coins,
    setTradeOutcome,
    adminSettleTrade,
  } = useApp();

  const [customPercentModal, setCustomPercentModal] = useState<{
    tradeId: string;
    trade: Trade;
    mode: 'WIN' | 'LOSS';
  } | null>(null);
  const [customPercentInput, setCustomPercentInput] = useState<number>(35);
  const [settleImmediately, setSettleImmediately] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filter only active running trades
  const openTrades = trades.filter((t) => t.status === 'OPEN');

  // Active metrics
  const activeVolume = openTrades.reduce((sum, t) => sum + t.margin, 0);
  const activeTradesCount = openTrades.length;

  // Realtime tick for countdown timers
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeLeft = (trade: Trade) => {
    const now = Date.now();
    let expiryMs = trade.expiresAtMs;
    if (!expiryMs) {
      if (trade.expiresAt.includes('T')) {
        expiryMs = new Date(trade.expiresAt).getTime();
      } else {
        expiryMs = new Date(trade.expiresAt.replace(' ', 'T') + 'Z').getTime() || new Date(trade.expiresAt).getTime();
      }
    }
    const diff = Math.max(0, Math.floor((expiryMs - now) / 1000));
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleApplyCustomOutcome = () => {
    if (!customPercentModal) return;
    const { tradeId, mode } = customPercentModal;
    const pct = Number(customPercentInput) || 35;

    if (settleImmediately) {
      adminSettleTrade(tradeId, mode, pct);
      setActionNotice(`Trade #${tradeId} immediately settled as ${mode} (${pct}%)!`);
    } else {
      setTradeOutcome(tradeId, mode, pct);
      setActionNotice(`Scheduled ${mode} (+${pct}%) on Trade #${tradeId} when duration ends.`);
    }

    setCustomPercentModal(null);
    setSettleImmediately(false);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header matching image_356c43a1.png */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <span>Live Trading Broadcast</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time live trades monitoring, entry vs live market prices, and scheduled outcome control.
          </p>
        </div>

        {actionNotice && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-1.5 rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* Top Metrics Cards matching screenshot 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Active Volume */}
        <div className="bg-[#121622] border border-[#21293c] rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Volume
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono mt-0.5">
              ${activeVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Total active position margin in execution
            </div>
          </div>
        </div>

        {/* Active Running Trades */}
        <div className="bg-[#121622] border border-[#21293c] rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Running Trades
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-0.5 flex items-center gap-2">
              <span>{activeTradesCount}</span>
              {activeTradesCount > 0 && (
                <span className="text-xs font-sans font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Live Execution
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Positions currently open across traders
            </div>
          </div>
        </div>
      </div>

      {/* Live Broadcast Feed (Auto Update 2s) matching screenshot */}
      <div className="bg-[#121622] border border-[#21293c] rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[#1f273a] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span>Live Broadcast Feed (Auto Update 2s)</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {openTrades.length} open position{openTrades.length === 1 ? '' : 's'}
          </span>
        </div>

        {openTrades.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Radio className="w-10 h-10 mx-auto text-slate-600 opacity-50" />
            <p className="text-sm">No active trades running at the moment.</p>
            <p className="text-xs text-slate-600">
              When traders place orders from the trading terminal, they will stream here live for outcome scheduling.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161c2b] border-b border-[#21293c] text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Direction</th>
                  <th className="px-4 py-3">Amount ($)</th>
                  <th className="px-4 py-3">Entry Price</th>
                  <th className="px-4 py-3 text-cyan-400">Live Market</th>
                  <th className="px-4 py-3">Time Left</th>
                  <th className="px-4 py-3">Scheduled Outcome</th>
                  <th className="px-4 py-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2234]">
                {openTrades.map((trade) => {
                  const targetCoin = coins.find((c) => c.symbol === trade.symbol);
                  const curPrice = targetCoin ? targetCoin.price : trade.currentPrice;
                  const isBuy = trade.type === 'BUY';
                  const isScheduledWin = trade.scheduledOutcome === 'WIN';
                  const isScheduledLoss = trade.scheduledOutcome === 'LOSS';
                  const scheduledPct = trade.scheduledPercent ?? (isScheduledWin ? 35 : 100);

                  return (
                    <tr key={trade.id} className="hover:bg-[#151a28] transition-colors">
                      {/* USER */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white capitalize">{trade.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: #{trade.id}
                        </div>
                      </td>

                      {/* ASSET */}
                      <td className="px-4 py-3.5">
                        <span className="font-extrabold text-cyan-400">
                          {trade.symbol}/USDT
                        </span>
                      </td>

                      {/* DIRECTION */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit ${
                            isBuy
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {trade.type} {trade.leverage}x
                        </span>
                      </td>

                      {/* AMOUNT ($) [Margin & Size] */}
                      <td className="px-4 py-3.5 font-mono">
                        <div className="text-white font-bold">${trade.margin.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="text-[10px] text-slate-400">
                          Pos: ${trade.positionSize.toLocaleString()}
                        </div>
                      </td>

                      {/* ENTRY PRICE */}
                      <td className="px-4 py-3.5 font-mono text-slate-200">
                        ${trade.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* LIVE MARKET */}
                      <td className="px-4 py-3.5 font-mono">
                        <div className="text-cyan-300 font-bold bg-cyan-400/5 px-2 py-0.5 rounded inline-flex items-center gap-1.5">
                          <span>${curPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                        </div>
                      </td>

                      {/* TIME LEFT */}
                      <td className="px-4 py-3.5 font-mono">
                        <div className="inline-flex items-center gap-1.5 text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{formatTimeLeft(trade)}</span>
                        </div>
                      </td>

                      {/* SCHEDULED OUTCOME STATUS */}
                      <td className="px-4 py-3.5">
                        {isScheduledWin ? (
                          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-lg font-bold text-[11px]">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>WIN (+{scheduledPct}%)</span>
                          </div>
                        ) : isScheduledLoss ? (
                          <div className="inline-flex items-center gap-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 px-2.5 py-1 rounded-lg font-bold text-[11px]">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>LOSS (-{scheduledPct}%)</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium">
                            Auto (Market Ticker)
                          </span>
                        )}
                      </td>

                      {/* ADMIN ACTIONS: WIN / LOSS BUTTONS */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Win 35% Quick Button */}
                          <button
                            onClick={() => {
                              setTradeOutcome(trade.id, 'WIN', 35);
                              setActionNotice(`Scheduled 35% Win for ${trade.userName} on #${trade.id}`);
                              setTimeout(() => setActionNotice(null), 3000);
                            }}
                            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm ${
                              isScheduledWin && scheduledPct === 35
                                ? 'bg-emerald-400 text-black ring-2 ring-emerald-300 font-extrabold'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
                            }`}
                            title="Schedule 35% Win profit on margin"
                          >
                            Win (35%)
                          </button>

                          {/* Custom Win / Loss Modal Trigger */}
                          <button
                            onClick={() => {
                              setCustomPercentModal({
                                tradeId: trade.id,
                                trade,
                                mode: 'WIN',
                              });
                              setCustomPercentInput(35);
                            }}
                            className="bg-[#182030] hover:bg-[#202b40] text-slate-300 hover:text-white border border-[#2a3754] px-2 py-1 rounded-lg text-xs font-medium cursor-pointer"
                            title="Set custom Win % or settle immediately"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          {/* Loss Button */}
                          <button
                            onClick={() => {
                              setTradeOutcome(trade.id, 'LOSS', 100);
                              setActionNotice(`Scheduled Loss for ${trade.userName} on #${trade.id}`);
                              setTimeout(() => setActionNotice(null), 3000);
                            }}
                            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm ${
                              isScheduledLoss
                                ? 'bg-rose-500 text-white ring-2 ring-rose-400 font-extrabold'
                                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30'
                            }`}
                            title="Schedule -100% loss of margin"
                          >
                            Loss
                          </button>

                          {/* Instant Settle Now Button */}
                          <button
                            onClick={() => {
                              const outcome = isScheduledLoss ? 'LOSS' : 'WIN';
                              const pct = isScheduledLoss ? scheduledPct : (isScheduledWin ? scheduledPct : 35);
                              adminSettleTrade(trade.id, outcome, pct);
                              setActionNotice(`Instantly settled #${trade.id} as ${outcome} (${pct}%)!`);
                              setTimeout(() => setActionNotice(null), 3000);
                            }}
                            className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs px-2.5 py-1 rounded-lg cursor-pointer shadow-sm shadow-amber-500/20 whitespace-nowrap ml-1"
                            title="Settle trade right now"
                          >
                            Settle Now
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Win/Loss & Immediate Settlement Modal */}
      {customPercentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121622] border border-[#232c40] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1f273a] pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Configure Outcome for Trade #{customPercentModal.tradeId}
                </h3>
              </div>
              <button
                onClick={() => setCustomPercentModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#161c2a] p-3 rounded-xl border border-[#232d42] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Trader:</span>
                <span className="text-white font-bold">{customPercentModal.trade.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Position:</span>
                <span className="text-cyan-400 font-bold">
                  {customPercentModal.trade.type} {customPercentModal.trade.symbol} ({customPercentModal.trade.leverage}x)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Margin:</span>
                <span className="text-amber-400 font-mono font-bold">
                  ${customPercentModal.trade.margin.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Entry Price:</span>
                <span className="text-slate-200 font-mono">
                  ${customPercentModal.trade.entryPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCustomPercentModal({ ...customPercentModal, mode: 'WIN' })}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  customPercentModal.mode === 'WIN'
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'bg-[#182030] text-slate-400 hover:text-white'
                }`}
              >
                WIN (Profit)
              </button>
              <button
                type="button"
                onClick={() => setCustomPercentModal({ ...customPercentModal, mode: 'LOSS' })}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  customPercentModal.mode === 'LOSS'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'bg-[#182030] text-slate-400 hover:text-white'
                }`}
              >
                LOSS
              </button>
            </div>

            {/* Percentage Presets & Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Target {customPercentModal.mode} Percentage (% on Margin)
              </label>

              <div className="grid grid-cols-4 gap-2">
                {[20, 35, 50, 80].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomPercentInput(preset)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      customPercentInput === preset
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                        : 'bg-[#182030] text-slate-300 border-[#25314a] hover:border-slate-500'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>

              <div className="relative mt-2">
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={customPercentInput}
                  onChange={(e) => setCustomPercentInput(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#161c2b] border border-[#263148] focus:border-cyan-400 rounded-xl px-3 py-2 text-white font-mono text-sm outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  %
                </span>
              </div>
            </div>

            {/* Calculated Preview */}
            {(() => {
              const margin = customPercentModal.trade.margin;
              const leverage = customPercentModal.trade.leverage;
              const entry = customPercentModal.trade.entryPrice;
              const isBuy = customPercentModal.trade.type === 'BUY';
              const isWin = customPercentModal.mode === 'WIN';
              const pnl = isWin
                ? Number((margin * (customPercentInput / 100)).toFixed(2))
                : -Number((margin * (customPercentInput / 100)).toFixed(2));

              let exit = entry;
              if (isWin) {
                exit = isBuy
                  ? entry * (1 + (customPercentInput / 100) / leverage)
                  : entry * (1 - (customPercentInput / 100) / leverage);
              } else {
                exit = isBuy
                  ? entry * (1 - (customPercentInput / 100) / leverage)
                  : entry * (1 + (customPercentInput / 100) / leverage);
              }

              return (
                <div className="bg-[#0e121b] p-3 rounded-xl border border-[#1b2334] text-xs space-y-1 font-mono">
                  <div className="text-[11px] text-slate-400 font-sans font-semibold">
                    Expected Settle Calculation:
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Projected PnL:</span>
                    <span className={`font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isWin ? '+' : ''}${pnl.toFixed(2)} ({isWin ? '+' : '-'}{customPercentInput}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Exit Price:</span>
                    <span className="text-cyan-300 font-bold">
                      ${exit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Immediate Execution Option */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 bg-[#161c2a] p-2.5 rounded-xl border border-[#222a3d]">
              <input
                type="checkbox"
                checked={settleImmediately}
                onChange={(e) => setSettleImmediately(e.target.checked)}
                className="rounded accent-cyan-400 cursor-pointer"
              />
              <span className="font-semibold text-white">
                Execute & Settle Immediately (Don't wait for timer expiry)
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCustomPercentModal(null)}
                className="flex-1 bg-[#182030] hover:bg-[#202b40] text-slate-300 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCustomOutcome}
                className="flex-1 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-black py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                {settleImmediately ? 'Settle Trade Now' : 'Save Scheduled Outcome'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
