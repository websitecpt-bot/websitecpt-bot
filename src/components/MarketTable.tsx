import React from 'react';
import { useApp } from '../context/AppContext';
import { MarketCoin } from '../types';
import { OfficialCoinIcon, getCoinFullName } from './OfficialCoinIcon';

interface MarketTableProps {
  coinsList?: MarketCoin[];
  limit?: number;
}

// Sparkline SVG renderer matching cptmarkets.com/en screenshot
export const SparklineChart: React.FC<{ isPositive: boolean; symbol: string }> = ({ isPositive, symbol }) => {
  const strokeColor = isPositive ? '#10b981' : '#ef4444';
  const fillColor = isPositive ? '#10b981' : '#ef4444';
  const gradId = `spark-${symbol}-${isPositive ? 'up' : 'down'}`;

  // Deterministic smooth curve paths
  const upPath = "M 0 22 Q 25 24, 45 14 T 85 10 T 130 4";
  const downPath = "M 0 6 Q 25 4, 45 16 T 85 20 T 130 26";
  const activePath = isPositive ? upPath : downPath;
  const areaPath = `${activePath} L 130 30 L 0 30 Z`;

  return (
    <div className="w-24 sm:w-28 h-7 flex items-center">
      <svg viewBox="0 0 130 30" className="w-full h-full overflow-hidden">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          d={activePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// Custom stylized icon for each financial instrument
export const InstrumentIcon: React.FC<{ symbol: string }> = ({ symbol }) => {
  const s = symbol.toUpperCase();

  if (s.includes('XAU') || s === 'GOLD') {
    return (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center text-black font-black text-[11px] shadow-sm shadow-amber-500/20">
        <span>AU</span>
      </div>
    );
  }
  if (s.includes('BTC')) {
    return (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f7931a] flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-orange-500/20">
        <span>₿</span>
      </div>
    );
  }
  if (s.includes('EUR')) {
    return (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#003399] flex items-center justify-center text-yellow-300 font-extrabold text-[10px] shadow-sm">
        <span>★EU★</span>
      </div>
    );
  }
  if (s.includes('NAS')) {
    return (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-sky-500 flex items-center justify-center text-white font-black text-[10px] tracking-tight">
        <span>100</span>
      </div>
    );
  }
  if (s.includes('DSH') || s.includes('DASH')) {
    return (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs">
        <span>Ð</span>
      </div>
    );
  }
  if (s.includes('GBP')) {
    return (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-900 border border-red-500/50 flex items-center justify-center text-white font-extrabold text-[10px]">
        <span>£</span>
      </div>
    );
  }
  if (s.includes('U30') || s.includes('US30')) {
    return (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-700 flex items-center justify-center text-white font-black text-[10px]">
        <span>U</span>
      </div>
    );
  }
  if (s.includes('XAG') || s === 'SILVER') {
    return (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-slate-400 via-gray-300 to-slate-200 flex items-center justify-center text-slate-800 font-black text-[10px]">
        <span>AG</span>
      </div>
    );
  }
  if (s.includes('ETH')) {
    return (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#627eea] flex items-center justify-center text-white font-bold text-xs">
        <span>Ξ</span>
      </div>
    );
  }

  return (
    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs">
      {symbol.slice(0, 2)}
    </div>
  );
};

export const MarketTable: React.FC<MarketTableProps> = ({ coinsList, limit }) => {
  const { coins, setSelectedSymbol, setActiveTab } = useApp();

  const displayList = (coinsList || coins).slice(0, limit || coins.length);

  return (
    <div className="w-full bg-[#0a0d14] border border-[#1b212f] rounded-2xl overflow-hidden shadow-2xl font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#181d29] text-slate-400 text-xs font-semibold select-none">
              <th className="py-4 px-4 sm:px-6">Symbol</th>
              <th className="py-4 px-3 sm:px-4">Buy Price</th>
              <th className="py-4 px-3 sm:px-4">Spread</th>
              <th className="py-4 px-3 sm:px-4">Sell Price</th>
              <th className="py-4 px-3 sm:px-4">Change (%)</th>
              <th className="py-4 px-3 sm:px-4">Past 24 Hours</th>
              <th className="py-4 px-4 sm:px-6 text-right">Trade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#131924]">
            {displayList.map((coin) => {
              const isPositive = coin.change24h >= 0;
              const halfSpread = coin.spread > 0 ? coin.spread / 2 : 0.05;
              const buyPrice = coin.price + halfSpread;
              const sellPrice = coin.price - halfSpread;

              // Format price appropriately for FX vs Crypto vs Index
              const formatPrice = (val: number) => {
                if (val >= 1000) return val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
                if (val >= 10) return val.toFixed(2);
                if (val >= 1) return val.toFixed(4);
                return val.toFixed(5);
              };

              // Display spread in points / pips as shown on CPT Markets screenshot
              const displaySpread = () => {
                if (coin.spread >= 1) return Math.round(coin.spread);
                if (coin.spread >= 0.1) return Math.round(coin.spread * 100);
                return Math.round(coin.spread * 100000);
              };

              return (
                <tr
                  key={coin.symbol}
                  onClick={() => {
                    setSelectedSymbol(coin.symbol);
                    setActiveTab('trade');
                  }}
                  className="hover:bg-[#111622] transition-colors cursor-pointer group text-xs sm:text-sm"
                >
                  {/* Symbol matching image_df93f9b4.png */}
                  <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <OfficialCoinIcon symbol={coin.symbol} size={30} />
                      <div className="flex flex-col">
                        <span className="font-extrabold text-white group-hover:text-amber-400 transition-colors tracking-wide">
                          {coin.symbol}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {getCoinFullName(coin.symbol)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Buy Price */}
                  <td className="py-4 px-3 sm:px-4 font-mono font-medium text-slate-100 whitespace-nowrap">
                    {formatPrice(buyPrice)}
                  </td>

                  {/* Spread */}
                  <td className="py-4 px-3 sm:px-4 font-mono text-slate-300 whitespace-nowrap">
                    {displaySpread()}
                  </td>

                  {/* Sell Price */}
                  <td className="py-4 px-3 sm:px-4 font-mono font-medium text-slate-100 whitespace-nowrap">
                    {formatPrice(sellPrice)}
                  </td>

                  {/* Change (%) */}
                  <td className="py-4 px-3 sm:px-4 font-mono font-semibold whitespace-nowrap">
                    <span className={isPositive ? 'text-emerald-400' : 'text-rose-500'}>
                      {isPositive ? '+' : ''}
                      {coin.change24h.toFixed(2)}
                    </span>
                  </td>

                  {/* Past 24 Hours (Sparkline) */}
                  <td className="py-4 px-3 sm:px-4 whitespace-nowrap">
                    <SparklineChart isPositive={isPositive} symbol={coin.symbol} />
                  </td>

                  {/* Trade Button matching CPT Markets screenshot */}
                  <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSymbol(coin.symbol);
                        setActiveTab('trade');
                      }}
                      className="bg-[#161c28] hover:bg-amber-400 hover:text-black border border-[#273247] hover:border-amber-400 text-slate-200 font-semibold px-4 py-1.5 rounded-full text-xs transition-all shadow-sm group-hover:border-slate-500"
                    >
                      Trading
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
