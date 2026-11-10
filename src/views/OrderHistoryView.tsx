import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trade } from '../types';
import { ArrowLeft, Clock, ChevronRight } from 'lucide-react';

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
                    <div className="text-[11px] text-slate-500 font-mono">{trade.openedAt}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div
                        className={`font-mono font-bold text-base ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isProfit ? '+' : ''}${trade.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                    Entry: ${trade.entryPrice.toLocaleString()} | Exit: ${trade.exitPrice?.toLocaleString() || trade.currentPrice.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {trade.closedAt || trade.openedAt}
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121622] border border-[#232c40] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
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
                <span>Exit Price</span>
                <span className="font-mono text-slate-200">
                  ${(detailModalTrade.exitPrice || detailModalTrade.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
              <div className="flex justify-between text-slate-400">
                <span>Opened</span>
                <span className="font-mono text-slate-300">{detailModalTrade.openedAt}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Closed</span>
                <span className="font-mono text-slate-300">
                  {detailModalTrade.closedAt || 'Still Running'}
                </span>
              </div>

              <div className="pt-4 border-t border-[#202739] flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-300">Realized P/L</span>
                <span
                  className={`font-mono font-bold text-lg ${
                    detailModalTrade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {detailModalTrade.pnl >= 0 ? '+' : ''}${detailModalTrade.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
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
