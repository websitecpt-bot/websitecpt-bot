import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trade } from '../types';
import { ArrowLeft, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';

const formatTradeTimestamp = (value?: string) => {
  if (!value) return '—';
  const normalized = value.includes('T') || /Z$|[+-]\\d{2}:?\\d{2}$/.test(value)
    ? value
    : `${value.replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  }).format(date);
};

export const OrderHistoryView: React.FC = () => {
  const { currentUser, trades, closeTrade } = useApp();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('completed');
  const [detailModalTrade, setDetailModalTrade] = useState<Trade | null>(null);

  const userTrades = trades.filter((t) => t.userId === currentUser.id);
  const activeTradesList = userTrades.filter((t) => t.status === 'OPEN');
  const completedTradesList = userTrades.filter((t) => t.status === 'CLOSED');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Tabs Header matching screenshot 1 */}
      <div className="flex border-b border-[#21283a] text-sm font-semibold">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'border-amber-400 text-amber-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Trades ({activeTradesList.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'border-amber-400 text-amber-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Completed ({completedTradesList.length})
        </button>
      </div>

      {/* Trades List */}
      <div className="space-y-2.5">
        {activeTab === 'active' ? (
          activeTradesList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 border border-[#1b2233] rounded-xl bg-[#10141f]">
              No active trades running.
            </div>
          ) : (
            activeTradesList.map((trade) => {
              const isProfit = trade.pnl >= 0;
              return (
                <div
                  key={trade.id}
                  onClick={() => setDetailModalTrade(trade)}
                  className="bg-[#10141f] hover:bg-[#151a28] border border-[#1d2436] rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">{trade.symbol}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          trade.type === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {trade.type} {trade.leverage}x
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Entry: ${trade.entryPrice.toLocaleString()} | Now: ${trade.currentPrice.toLocaleString()}
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>Opened {formatTradeTimestamp(trade.openedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right space-y-1">
                      <div className="inline-flex items-center justify-end gap-2 text-[10px] font-semibold text-slate-300">
                        Floating PnL
                        <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${isProfit ? 'bg-emerald-400 shadow-[0_0_9px_rgba(52,211,153,0.7)]' : 'bg-rose-500 shadow-[0_0_9px_rgba(244,63,94,0.7)]'}`} />
                      </div>
                      <div className="text-[11px] text-slate-400">Margin: ${trade.margin.toFixed(2)}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTrade(trade.id);
                      }}
                      className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs px-3 py-1.5 rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })
          )
        ) : completedTradesList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 border border-[#1b2233] rounded-xl bg-[#10141f]">
            No completed trade history.
          </div>
        ) : (
          completedTradesList.map((trade) => {
            const isProfit = trade.pnl >= 0;
            return (
              <div
                key={trade.id}
                onClick={() => setDetailModalTrade(trade)}
                className="bg-[#10141f] hover:bg-[#161c2b] border border-[#1e2538] hover:border-[#2d3752] rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm">{trade.symbol}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        trade.type === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {trade.type} {trade.leverage}x
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Entry: ${trade.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} | Exit: ${(trade.exitPrice ?? trade.entryPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="space-y-1 text-[10px] sm:text-[11px]">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-slate-400">
                      <span className="inline-flex items-center gap-1 text-slate-500"><Clock className="h-3 w-3" /> Opened</span>
                      <time className="font-medium text-slate-300">{formatTradeTimestamp(trade.openedAt)}</time>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-slate-400">
                      <span className="inline-flex items-center gap-1 text-slate-500"><CheckCircle2 className="h-3 w-3" /> Closed</span>
                      <time className="font-medium text-slate-300">{formatTradeTimestamp(trade.closedAt || trade.openedAt)}</time>
                    </div>
                    <div className="font-mono text-slate-500">Margin: ${trade.margin.toFixed(2)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div
                      className={`font-mono font-bold text-sm sm:text-base ${
                        isProfit ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isProfit ? '+' : ''}${trade.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Trade Details Modal matching screenshot 6 */}
      {detailModalTrade && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-gradient-to-b from-[#151c2b] to-[#0f1420] border border-[#2b3851] rounded-2xl w-full max-w-md max-h-[92dvh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#202739] pb-4 mb-4">
              <button
                onClick={() => setDetailModalTrade(null)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Trade Details</span>
              </button>
              <span className="text-xs font-mono text-slate-500">#{detailModalTrade.id}</span>
            </div>

            {/* Badge */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-lg font-bold text-white">{detailModalTrade.symbol}</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                  detailModalTrade.type === 'BUY'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {detailModalTrade.type} {detailModalTrade.leverage}x
              </span>
            </div>

            {/* Key-Value Details matching screenshot 6 */}
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Entry Price</span>
                <span className="font-mono text-slate-200">
                  ${detailModalTrade.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{detailModalTrade.status === 'CLOSED' ? 'Exit Price' : 'Current Price'}</span>
                <span className="font-mono text-cyan-300 font-bold">
                  ${(detailModalTrade.status === 'CLOSED' ? (detailModalTrade.exitPrice ?? detailModalTrade.entryPrice) : detailModalTrade.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Leverage</span>
                <span className="font-mono text-slate-200">{detailModalTrade.leverage}x</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Margin</span>
                <span className="font-mono text-slate-200">
                  ${detailModalTrade.margin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Position Size</span>
                <span className="font-mono text-slate-200">
                  ${detailModalTrade.positionSize.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-start gap-3 text-slate-400">
                <span>Opened</span>
                <time className="text-right font-mono text-[11px] text-slate-300">{formatTradeTimestamp(detailModalTrade.openedAt)}</time>
              </div>
              <div className="flex justify-between items-start gap-3 text-slate-400">
                <span>Closed</span>
                {detailModalTrade.closedAt
                  ? <time className="text-right font-mono text-[11px] text-slate-300">{formatTradeTimestamp(detailModalTrade.closedAt)}</time>
                  : <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> RUNNING</span>}
              </div>

              <div className="pt-4 border-t border-[#202739] flex justify-between items-center text-sm">
                {detailModalTrade.status === 'CLOSED' ? (
                  <>
                    <span className="font-semibold text-slate-300">Realized P/L</span>
                    <span className={`font-mono font-bold text-lg ${detailModalTrade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {detailModalTrade.pnl >= 0 ? '+' : ''}${detailModalTrade.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-slate-300">Floating P/L</span>
                    <span className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-300">
                      LIVE
                      <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${detailModalTrade.pnl >= 0 ? 'bg-emerald-400 shadow-[0_0_9px_rgba(52,211,153,0.7)]' : 'bg-rose-500 shadow-[0_0_9px_rgba(244,63,94,0.7)]'}`} />
                    </span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => setDetailModalTrade(null)}
              className="w-full mt-6 bg-[#212a3d] hover:bg-[#2b364e] text-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
