import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MarketTable } from '../components/MarketTable';
import { TradingChart } from '../components/TradingChart';
import { Search, Activity } from 'lucide-react';

export const MarketView: React.FC = () => {
  const { coins, setSelectedSymbol, setActiveTab } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'crypto' | 'forex' | 'indices' | 'commodities'>('all');

  const filteredCoins = coins.filter((c) => {
    const matchesSearch =
      c.symbol.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (category === 'commodities') {
      return c.symbol.startsWith('XA');
    }
    if (category === 'forex') {
      return c.symbol.includes('EUR') || c.symbol.includes('GBP');
    }
    if (category === 'indices') {
      return c.symbol.includes('NAS') || c.symbol.includes('U30');
    }
    if (category === 'crypto') {
      return !c.symbol.startsWith('XA') && !c.symbol.includes('EUR') && !c.symbol.includes('GBP') && !c.symbol.includes('NAS') && !c.symbol.includes('U30');
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>Trading Markets</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
              Live Feed
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time spreads, buy/sell pricing, and instant execution up to 1000x leverage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol (BTC, XAU...)"
              className="w-full bg-[#10141f] border border-[#20283a] focus:border-amber-400 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Live Professional Candlestick Trading Chart matching user screenshot */}
      <div className="space-y-2">
        <TradingChart
          onSymbolSelect={(sym) => {
            setSelectedSymbol(sym);
          }}
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { id: 'all', label: 'All Instruments' },
          { id: 'commodities', label: 'Commodities (Gold/Silver)' },
          { id: 'forex', label: 'Forex' },
          { id: 'indices', label: 'Indices' },
          { id: 'crypto', label: 'Crypto' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategory(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              category === tab.id
                ? 'bg-amber-400 text-black font-semibold shadow-sm'
                : 'bg-[#101522] text-slate-400 hover:text-white border border-[#1d2538]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Market Watch Table */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-amber-400" />
          <span>MARKET WATCH</span>
        </h2>
        <MarketTable coinsList={filteredCoins} />
      </div>
    </div>
  );
};
