import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MarketCoin } from '../../types';
import {
  TrendingUp,
  Activity,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Zap,
  ShieldAlert,
  Server,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export const AdminMarketsTab: React.FC = () => {
  const {
    coins,
    updateCoinSettings,
    setCoinPrice,
    applyMarketShock,
    addCustomCoin,
    marketDataMode,
    setMarketDataMode,
  } = useApp();

  const [selectedCoin, setSelectedCoin] = useState<MarketCoin>(coins[0]);
  const [spreadInput, setSpreadInput] = useState<string>(coins[0]?.spread.toString() || '0');
  const [customPriceInput, setCustomPriceInput] = useState<string>(coins[0]?.price.toString() || '0');
  const [maxLevInput, setMaxLevInput] = useState<string>(coins[0]?.maxLeverage.toString() || '1000');

  // Custom Coin Form State
  const [showAddCoinModal, setShowAddCoinModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newSpread, setNewSpread] = useState('0.1');
  const [newMaxLev, setNewMaxLev] = useState('100');

  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSelectCoin = (c: MarketCoin) => {
    setSelectedCoin(c);
    setSpreadInput(c.spread.toString());
    setCustomPriceInput(c.price.toString());
    setMaxLevInput(c.maxLeverage.toString());
    setFeedback(null);
  };

  const handleApplyExactPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(customPriceInput);
    if (!p || p <= 0) {
      setFeedback('Please enter a valid benchmark price.');
      return;
    }
    setCoinPrice(selectedCoin.symbol, p);
    setFeedback(`Benchmark market price for ${selectedCoin.symbol} updated to $${p.toLocaleString()}. All user positions recalculated.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleMarketShock = (percentage: number) => {
    applyMarketShock(selectedCoin.symbol, percentage);
    const updated = coins.find((c) => c.symbol === selectedCoin.symbol);
    if (updated) {
      setCustomPriceInput((updated.price * (1 + percentage / 100)).toFixed(2));
    }
    setFeedback(`Market Shock applied: ${percentage >= 0 ? '+' : ''}${percentage}% on ${selectedCoin.symbol}. Stress test active!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const spread = parseFloat(spreadInput) || selectedCoin.spread;
    const maxLeverage = parseInt(maxLevInput) || selectedCoin.maxLeverage;

    updateCoinSettings(selectedCoin.symbol, {
      spread,
      maxLeverage,
    });

    setFeedback(`Spread & leverage parameters for ${selectedCoin.symbol} saved.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCreateCustomCoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSym = newSymbol.trim().toUpperCase();
    if (!cleanSym) return;

    if (coins.some((c) => c.symbol === cleanSym)) {
      setFeedback(`Coin with symbol ${cleanSym} already exists.`);
      return;
    }

    const price = parseFloat(newPrice) || 1.0;
    const spread = parseFloat(newSpread) || 0.01;
    const maxLev = parseInt(newMaxLev) || 100;

    const newCoinObj: MarketCoin = {
      symbol: cleanSym,
      name: newName.trim() || `${cleanSym} / USDT`,
      price,
      basePrice: price,
      change24h: 0.0,
      high24h: price * 1.05,
      low24h: price * 0.95,
      spread,
      priceOffset: 0,
      maxLeverage: maxLev,
      status: 'active',
    };

    addCustomCoin(newCoinObj);
    setShowAddCoinModal(false);
    setSelectedCoin(newCoinObj);
    setNewSymbol('');
    setNewName('');
    setNewPrice('');
    setFeedback(`Custom demo token ${cleanSym} listed successfully for sandbox testing!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const toggleStatus = (coin: MarketCoin) => {
    const nextStatus = coin.status === 'active' ? 'paused' : 'active';
    updateCoinSettings(coin.symbol, { status: nextStatus });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Coin & Market Simulation Engine</span>
          </h2>
          <p className="text-xs text-slate-400">
            Stress-test market crashes/surges, set failover benchmark prices, and list custom tokens for development.
          </p>
        </div>

        {/* 4 Developer Pillars Mode Control */}
        <div className="flex items-center gap-2 bg-[#121622] p-1.5 rounded-xl border border-[#21293c] text-xs">
          <button
            onClick={() => setMarketDataMode('live_stream')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              marketDataMode === 'live_stream'
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Auto Stream</span>
          </button>
          <button
            onClick={() => setMarketDataMode('manual_benchmark')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              marketDataMode === 'manual_benchmark'
                ? 'bg-cyan-400 text-black font-bold shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Halts random noise. Preserves exact benchmark price (API Failover / Offline Dev mode)"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Standalone Benchmark Mode</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Grid: Pair List & Calibration Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pairs Table (6 cols) */}
        <div className="lg:col-span-6 bg-[#121622] border border-[#21293c] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-[#1f273a] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Market Pairs ({coins.length})
              </h3>
              <span className="text-[11px] text-slate-400">Select pair to calibrate benchmark</span>
            </div>

            <button
              onClick={() => setShowAddCoinModal(true)}
              className="bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-cyan-500/20"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>List Demo Token</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-[520px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161c2b] border-b border-[#21293c] text-slate-400 uppercase font-semibold sticky top-0 z-10">
                <tr>
                  <th className="px-3.5 py-2.5">Pair</th>
                  <th className="px-3.5 py-2.5">Current Price</th>
                  <th className="px-3.5 py-2.5">24h Change</th>
                  <th className="px-3.5 py-2.5">Spread</th>
                  <th className="px-3.5 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2234]">
                {coins.map((coin) => {
                  const isSelected = coin.symbol === selectedCoin.symbol;
                  const isPos = coin.change24h >= 0;
                  return (
                    <tr
                      key={coin.symbol}
                      onClick={() => handleSelectCoin(coin)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-400/10 border-l-4 border-amber-400' : 'hover:bg-[#151b2a]'
                      }`}
                    >
                      <td className="px-3.5 py-3 font-bold text-white flex items-center gap-2">
                        <span>{coin.symbol}</span>
                        <span className="text-[10px] text-slate-400">USDT</span>
                      </td>
                      <td className="px-3.5 py-3 font-mono font-bold text-slate-100">
                        ${coin.price.toLocaleString(undefined, {
                          minimumFractionDigits: coin.price > 100 ? 2 : 4,
                        })}
                      </td>
                      <td className="px-3.5 py-3 font-mono font-semibold">
                        <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPos ? '+' : ''}{coin.change24h.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-3.5 py-3 font-mono text-slate-400">{coin.spread}</td>
                      <td className="px-3.5 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatus(coin);
                          }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                            coin.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {coin.status}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stress Testing & Calibration Control Panel (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Box 1: Benchmark Price & Stress Testing (Market Shock Simulator) */}
          <div className="bg-[#121622] border border-[#21293c] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="border-b border-[#20283c] pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Market Shock & Stress Testing Engine
                </span>
                <h3 className="text-base font-bold text-white">
                  {selectedCoin.symbol} / USDT: <span className="font-mono text-cyan-300">${selectedCoin.price.toLocaleString()}</span>
                </h3>
              </div>
              <span className="text-[11px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded">
                Simulated Sandbox
              </span>
            </div>

            {/* Direct Exact Benchmark Price Form */}
            <form onSubmit={handleApplyExactPrice} className="space-y-3 text-xs">
              <label className="text-slate-300 font-medium block">
                Set Benchmark Market Price ($) — (Applies globally to ticker & open trades)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  required
                  value={customPriceInput}
                  onChange={(e) => setCustomPriceInput(e.target.value)}
                  placeholder="e.g. 78500.00"
                  className="flex-1 bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 rounded-xl px-4 py-2.5 text-white font-mono text-sm outline-none"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-black font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-sm shadow-cyan-500/20"
                >
                  Apply Price
                </button>
              </div>
            </form>

            {/* 1-Click Market Shock Stress Test Buttons */}
            <div className="space-y-2 pt-2 border-t border-[#1e2538] text-xs">
              <span className="text-slate-400 font-medium block">
                ⚡ Rapid Volatility & Liquidation Stress Test:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleMarketShock(5)}
                  className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-bold py-2 px-2.5 rounded-xl transition-colors cursor-pointer text-center text-[11px]"
                >
                  ▲ +5% Rise
                </button>
                <button
                  onClick={() => handleMarketShock(10)}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold py-2 px-2.5 rounded-xl transition-colors cursor-pointer text-center text-[11px]"
                >
                  ▲ +10% Surge
                </button>
                <button
                  onClick={() => handleMarketShock(20)}
                  className="bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-500/50 font-bold py-2 px-2.5 rounded-xl transition-colors cursor-pointer text-center text-[11px]"
                >
                  ▲ +20% Pump
                </button>

                <button
                  onClick={() => handleMarketShock(-5)}
                  className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-bold py-2 px-2.5 rounded-xl transition-colors cursor-pointer text-center text-[11px]"
                >
                  ▼ -5% Dip
                </button>
                <button
                  onClick={() => handleMarketShock(-10)}
                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold py-2 px-2.5 rounded-xl transition-colors cursor-pointer text-center text-[11px]"
                >
                  ▼ -10% Dump
                </button>
                <button
                  onClick={() => handleMarketShock(-20)}
                  className="bg-rose-500/25 hover:bg-rose-500/35 text-rose-200 border border-rose-500/50 font-bold py-2 px-2.5 rounded-xl transition-colors cursor-pointer text-center text-[11px]"
                >
                  ▼ -20% Crash
                </button>
              </div>
            </div>
          </div>

          {/* Box 2: Spread & Leverage Settings */}
          <div className="bg-[#121622] border border-[#21293c] rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Spread & Risk Settings: {selectedCoin.symbol}
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Spread (Bid/Ask diff)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={spreadInput}
                    onChange={(e) => setSpreadInput(e.target.value)}
                    className="w-full bg-[#161c2a] border border-[#242e44] focus:border-amber-400 rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Max Allowed Leverage
                  </label>
                  <select
                    value={maxLevInput}
                    onChange={(e) => setMaxLevInput(e.target.value)}
                    className="w-full bg-[#161c2a] border border-[#242e44] focus:border-amber-400 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="50">50x</option>
                    <option value="100">100x</option>
                    <option value="200">200x</option>
                    <option value="300">300x</option>
                    <option value="500">500x</option>
                    <option value="1000">1000x</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1a2336] hover:bg-[#232f48] text-cyan-400 border border-cyan-500/30 font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Save Spread & Leverage
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modal: List Custom Demo Token */}
      {showAddCoinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111522] border border-[#232c40] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-cyan-400" />
              <span>List New Custom / Demo Token</span>
            </h3>
            <p className="text-xs text-slate-400">
              Test newly developing or custom tokens in this sandbox before exchange listing.
            </p>

            <form onSubmit={handleCreateCustomCoin} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Coin Symbol (e.g. CPT or SHIB)</label>
                <input
                  type="text"
                  required
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  placeholder="e.g. CPT"
                  className="w-full bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 rounded-xl px-4 py-2 text-white font-mono uppercase outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Token Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. CPT Token / USDT"
                  className="w-full bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 rounded-xl px-4 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Initial Benchmark Price ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="e.g. 5.50"
                  className="w-full bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 rounded-xl px-4 py-2 text-white font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Spread</label>
                  <input
                    type="number"
                    step="any"
                    value={newSpread}
                    onChange={(e) => setNewSpread(e.target.value)}
                    className="w-full bg-[#161c2a] border border-[#242e44] rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Max Leverage</label>
                  <input
                    type="number"
                    value={newMaxLev}
                    onChange={(e) => setNewMaxLev(e.target.value)}
                    className="w-full bg-[#161c2a] border border-[#242e44] rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCoinModal(false)}
                  className="bg-[#1a2133] text-slate-300 px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-black font-extrabold px-4 py-2 rounded-xl shadow-md shadow-cyan-500/20"
                >
                  List & Launch Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
