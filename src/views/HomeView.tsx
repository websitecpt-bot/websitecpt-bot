import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Headphones,
  ArrowLeftRight,
  History,
  Users,
  Flame,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { MarketTable } from '../components/MarketTable';
import { CptLogo } from '../components/CptLogo';

export const HomeView: React.FC = () => {
  const {
    currentUser,
    coins,
    trades,
    setActiveTab,
    setSelectedSymbol,
    setIsSupportOpen,
    setIsDepositModalOpen,
    setIsTransferModalOpen,
  } = useApp();

  const [showBalance, setShowBalance] = useState(true);

  // Calculate live floating PnL from active trades
  const activeTrades = trades.filter((t) => t.userId === currentUser.id && t.status === 'OPEN');
  const floatingPnL = activeTrades.reduce((acc, t) => acc + t.pnl, 0);
  const equity = currentUser.tradingBalance + floatingPnL;
  const totalAssets = currentUser.fundingBalance + equity;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Welcome & Banner */}
      <div className="space-y-3">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
          <span>Welcome,</span>
          <span className="text-amber-400 capitalize">{currentUser.name}</span>
          <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
            Standard VIP
          </span>
        </h1>

        {/* CPT Markets banner matching user specification */}
        <div className="bg-gradient-to-r from-[#111927] via-[#142033] to-[#0f1724] border border-[#212f47] rounded-xl p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <CptLogo size={34} />
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                Trading Across 120+ Countries
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                A Global Trading Experience
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
            <span>FCA Compliant Global Gateway</span>
          </div>
        </div>
      </div>

      {/* Total Assets & Balance Card */}
      <div className="bg-[#121620] border border-[#22293b] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-medium text-slate-400">Total Assets (USD)</span>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-amber-400 hover:text-amber-300 transition-colors p-1"
            title="Toggle Balance Visibility"
          >
            {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        {/* Big Balance Number */}
        <div className="mt-2 text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white">
          {showBalance
            ? `$${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '••••••••••'}
        </div>

        {/* Sub-balances breakdown matching Screenshot 2 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-[#1e2536] text-xs">
          <div>
            <span className="text-slate-400 block">Funding</span>
            <span className="font-mono font-semibold text-slate-200 mt-0.5 block">
              {showBalance ? `$${currentUser.fundingBalance.toFixed(2)}` : '••••'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Trading</span>
            <span className="font-mono font-semibold text-amber-400 mt-0.5 block">
              {showBalance ? `$${currentUser.tradingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '••••'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Floating P/L</span>
            <span
              className={`font-mono font-semibold mt-0.5 block ${
                floatingPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {showBalance
                ? `${floatingPnL >= 0 ? '+' : ''}$${floatingPnL.toFixed(2)}`
                : '••••'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Equity</span>
            <span className="font-mono font-semibold text-slate-100 mt-0.5 block">
              {showBalance ? `$${equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '••••'}
            </span>
          </div>
        </div>

        {/* Trade & Deposit Action Buttons matching screenshot */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={() => setActiveTab('trade')}
            className="w-full bg-[#f4b41a] hover:bg-[#e0a416] text-black font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <span>Trade</span>
          </button>
          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="w-full bg-[#202636] hover:bg-[#283042] text-slate-200 font-bold py-3 px-4 rounded-xl text-sm transition-all border border-[#2d374d] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <span>Deposit</span>
          </button>
        </div>
      </div>

      {/* 4 Feature Action Cards matching screenshot */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Support */}
        <button
          onClick={() => setIsSupportOpen(true)}
          className="bg-[#121620] hover:bg-[#191f2d] border border-[#202738] rounded-xl p-4 flex flex-col items-center justify-center gap-2.5 text-center transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Headphones className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-300 group-hover:text-amber-400">Support</span>
        </button>

        {/* Transfer */}
        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="bg-[#121620] hover:bg-[#191f2d] border border-[#202738] rounded-xl p-4 flex flex-col items-center justify-center gap-2.5 text-center transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-300 group-hover:text-blue-400">Transfer</span>
        </button>

        {/* History */}
        <button
          onClick={() => setActiveTab('history')}
          className="bg-[#121620] hover:bg-[#191f2d] border border-[#202738] rounded-xl p-4 flex flex-col items-center justify-center gap-2.5 text-center transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <History className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-300 group-hover:text-emerald-400">History</span>
        </button>

        {/* Refer */}
        <button
          onClick={() => {
            setActiveTab('account');
          }}
          className="bg-[#121620] hover:bg-[#191f2d] border border-[#202738] rounded-xl p-4 flex flex-col items-center justify-center gap-2.5 text-center transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-300 group-hover:text-purple-400">Refer</span>
        </button>
      </div>

      {/* CPT MARKETS TRADING TABLE SECTION matching screenshot */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              CPT Live Markets
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('market')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>View All Markets</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Market Table with Montserrat Font */}
        <MarketTable limit={8} />
      </div>

      {/* QUICK PAIRS CARDS */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
              Hot Crypto & FX Pairs
            </h3>
          </div>
          <span className="text-xs text-slate-400">Up to 1000x Margin</span>
        </div>

        {/* Coin Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {coins.slice(0, 10).map((coin) => {
            const isPos = coin.change24h >= 0;
            return (
              <div
                key={coin.symbol}
                onClick={() => {
                  setSelectedSymbol(coin.symbol);
                  setActiveTab('trade');
                }}
                className="bg-[#121620] hover:bg-[#181e2b] border border-[#202738] hover:border-[#333e59] rounded-xl p-3.5 cursor-pointer transition-all hover:-translate-y-0.5 group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 group-hover:text-amber-400 transition-colors">
                    {coin.symbol}
                  </span>
                  <span
                    className={`font-mono text-[11px] font-semibold flex items-center gap-0.5 ${
                      isPos ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPos ? '▲' : '▼'} {isPos ? '+' : ''}
                    {coin.change24h.toFixed(2)}%
                  </span>
                </div>
                <div className="mt-2 font-mono font-bold text-sm sm:text-base text-white">
                  ${coin.price.toLocaleString(undefined, { minimumFractionDigits: coin.price > 100 ? 2 : 4 })}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Lev. {coin.maxLeverage}x</span>
                  <span className="text-amber-400/80 group-hover:text-amber-400 flex items-center">
                    Trade <ArrowUpRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
