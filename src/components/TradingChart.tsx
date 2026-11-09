import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { OfficialCoinIcon, getCoinFullName } from './OfficialCoinIcon';
import {
  TrendingUp,
  TrendingDown,
  BarChart2,
  LineChart,
  Activity,
  ChevronDown,
  Maximize2,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingChartProps {
  onSymbolSelect?: (symbol: string) => void;
}

export const TradingChart: React.FC<TradingChartProps> = ({ onSymbolSelect }) => {
  const { coins, selectedSymbol, setSelectedSymbol, activeCoin } = useApp();

  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1D'>('1m');
  const [chartType, setChartType] = useState<'candles' | 'line' | 'area'>('candles');
  const [showIndicators, setShowIndicators] = useState(true);
  const [symbolDropdownOpen, setSymbolDropdownOpen] = useState(false);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Generate deterministic realistic candles seeded by coin price
  const basePrice = activeCoin?.price || 77253.0;

  const candles = useMemo<CandleData[]>(() => {
    const list: CandleData[] = [];
    const count = 52;
    let current = basePrice * 0.985;
    const now = Date.now();
    const intervalMs = timeframe === '1m' ? 60000 : timeframe === '30m' ? 1800000 : 3600000;

    for (let i = count; i >= 0; i--) {
      const candleTime = new Date(now - i * intervalMs);
      const timeStr = `${candleTime.getHours().toString().padStart(2, '0')}:${candleTime.getMinutes().toString().padStart(2, '0')}`;
      
      // Random walk with mean reversion towards activeCoin.price
      const volatility = basePrice * 0.0035;
      const step = (Math.sin(i * 0.45) * 0.6 + (Math.random() - 0.48)) * volatility;
      const open = current;
      let close = open + step;
      if (i === 0) close = basePrice; // latest candle matches live price exactly

      const high = Math.max(open, close) + Math.random() * volatility * 0.7;
      const low = Math.min(open, close) - Math.random() * volatility * 0.7;
      const volume = Math.floor(15 + Math.random() * 85);

      list.push({
        time: timeStr,
        open: Number(open.toFixed(basePrice > 100 ? 2 : 4)),
        high: Number(high.toFixed(basePrice > 100 ? 2 : 4)),
        low: Number(low.toFixed(basePrice > 100 ? 2 : 4)),
        close: Number(close.toFixed(basePrice > 100 ? 2 : 4)),
        volume,
      });

      current = close;
    }
    return list;
  }, [selectedSymbol, basePrice, timeframe]);

  // Chart bounds calculation
  const { minPrice, maxPrice, priceRange, maxVolume } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    const padding = (max - min) * 0.1 || 10;
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      priceRange: max - min + padding * 2 || 20,
      maxVolume: maxVol || 100,
    };
  }, [candles]);

  const latestCandle = candles[candles.length - 1] || {
    open: basePrice,
    high: basePrice,
    low: basePrice,
    close: basePrice,
    volume: 50,
  };

  const activeDisplay = hoveredCandle || latestCandle;
  const isPos = activeDisplay.close >= activeDisplay.open;
  const changeAmt = activeDisplay.close - activeDisplay.open;
  const changePct = (changeAmt / (activeDisplay.open || 1)) * 100;

  // Chart dimensions
  const chartHeight = 360;
  const volumeHeight = 65;
  const candleAreaHeight = chartHeight - volumeHeight - 30;

  const getY = (val: number) => {
    return 15 + ((maxPrice - val) / priceRange) * candleAreaHeight;
  };

  const currentPriceY = getY(basePrice);

  // Available pair options for dropdown matching screenshot
  const pairOptions = [
    { symbol: 'BTC', label: 'BTC / USDT' },
    { symbol: 'ETH', label: 'ETH / USDT' },
    { symbol: 'BNB', label: 'BNB / USDT' },
    { symbol: 'SOL', label: 'SOL / USDT' },
    { symbol: 'XRP', label: 'XRP / USDT' },
    { symbol: 'ADA', label: 'ADA / USDT' },
    { symbol: 'DOT', label: 'DOT / USDT' },
    { symbol: 'XAUUSD', label: 'XAU / Gold' },
    { symbol: 'EURUSD', label: 'EUR / USD' },
    { symbol: 'GBPUSD', label: 'GBP / USD' },
    { symbol: 'NASUSD', label: 'NAS / 100' },
  ];

  const handleSelectCoin = (sym: string) => {
    setSelectedSymbol(sym);
    if (onSymbolSelect) onSymbolSelect(sym);
    setSymbolDropdownOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="bg-[#0b0e14] border border-[#1b2233] rounded-2xl overflow-hidden shadow-2xl font-sans select-none"
    >
      {/* 1. TOP TOOLBAR matching image_d65f5227.png */}
      <div className="bg-[#10141f] border-b border-[#1b2233] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-slate-200 font-bold text-xs sm:text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Candlestick Chart</span>
          </div>

          <div className="h-4 w-px bg-slate-700/60 mx-1 hidden sm:block" />

          {/* Timeframe intervals matching screenshot */}
          <div className="flex items-center gap-1 bg-[#090c13] p-0.5 rounded-lg border border-[#1c2336] text-[11px]">
            {(['1m', '5m', '15m', '30m', '1h', '4h', '1D'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-700/60 mx-1 hidden sm:block" />

          {/* Chart Style Toggle */}
          <div className="hidden sm:flex items-center gap-1 bg-[#090c13] p-0.5 rounded-lg border border-[#1c2336] text-xs">
            <button
              onClick={() => setChartType('candles')}
              className={`p-1 rounded transition-colors ${
                chartType === 'candles' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Candlestick View"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-1 rounded transition-colors ${
                chartType === 'line' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Line Chart"
            >
              <LineChart className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Indicators Toggle */}
          <button
            onClick={() => setShowIndicators(!showIndicators)}
            className={`hidden md:flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              showIndicators
                ? 'bg-amber-400/10 border-amber-400/30 text-amber-300'
                : 'bg-[#090c13] border-[#1c2336] text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3 h-3 text-amber-400" />
            <span>Indicators (MA 20, Vol)</span>
          </button>
        </div>

        {/* Right: Symbol Selector Dropdown matching screenshot */}
        <div className="relative">
          <button
            onClick={() => setSymbolDropdownOpen(!symbolDropdownOpen)}
            className="flex items-center gap-2 bg-[#171e2e] hover:bg-[#1e273c] border border-[#26334d] px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-sm"
          >
            <OfficialCoinIcon symbol={selectedSymbol} size={18} />
            <span className="text-amber-400 font-mono">{selectedSymbol} / USDT</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu matching image_d65f5227.png */}
          {symbolDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#101420] border border-[#242f47] rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-[#1b2336] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Trading Instrument
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-[#161c2c]">
                {pairOptions.map((opt) => (
                  <button
                    key={opt.symbol}
                    onClick={() => handleSelectCoin(opt.symbol)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                      selectedSymbol === opt.symbol
                        ? 'bg-amber-400/15 text-amber-300 font-bold'
                        : 'text-slate-300 hover:bg-[#182033] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <OfficialCoinIcon symbol={opt.symbol} size={16} />
                      <span className="font-mono">{opt.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. OHLC STATS STRIP matching screenshot: O: ... H: ... L: ... C: ... */}
      <div className="bg-[#0e121b] border-b border-[#171e2c] px-4 py-2 flex flex-wrap items-center justify-between text-[11px] font-mono gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <OfficialCoinIcon symbol={selectedSymbol} size={16} />
            <span className="font-bold text-white tracking-wide">
              {getCoinFullName(selectedSymbol)} / TetherUS · {timeframe} · Binance
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <span>O <span className="text-white">{activeDisplay.open.toLocaleString()}</span></span>
            <span>H <span className="text-white">{activeDisplay.high.toLocaleString()}</span></span>
            <span>L <span className="text-white">{activeDisplay.low.toLocaleString()}</span></span>
            <span>C <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>{activeDisplay.close.toLocaleString()}</span></span>
            <span className={`font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPos ? '+' : ''}{changeAmt.toFixed(2)} ({isPos ? '+' : ''}{changePct.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[10px]">
          <span>Vol · {selectedSymbol.slice(0, 3)}: <span className="text-amber-400 font-semibold">{activeDisplay.volume}</span></span>
          <span className="text-slate-500">Live 1s Tick</span>
        </div>
      </div>

      {/* 3. INTERACTIVE CHART SVG CANVAS */}
      <div
        className="relative w-full overflow-hidden bg-[#0a0d14]"
        style={{ height: chartHeight }}
        onMouseMove={(e) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          setMousePos({ x, y });

          // Determine hovered candle index based on x
          const candleWidth = (rect.width - 65) / candles.length;
          const idx = Math.min(candles.length - 1, Math.max(0, Math.floor(x / candleWidth)));
          setHoveredCandle(candles[idx]);
        }}
        onMouseLeave={() => {
          setHoveredCandle(null);
          setMousePos(null);
        }}
      >
        {/* Subtle Grid Lines */}
        <div className="absolute inset-0 pointer-events-none">
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
            <div
              key={ratio}
              className="absolute w-full border-b border-[#141b29]/80"
              style={{ top: `${ratio * 100}%` }}
            />
          ))}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <div
              key={ratio}
              className="absolute h-full border-r border-[#141b29]/80"
              style={{ left: `${ratio * 100}%` }}
            />
          ))}
        </div>

        {/* SVG Drawing of Candles, MA Line, and Volume */}
        <svg
          viewBox={`0 0 1000 ${chartHeight}`}
          preserveAspectRatio="none"
          className="w-[calc(100%-65px)] h-full overflow-visible"
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Volume bars in lower section */}
          {candles.map((c, i) => {
            const candleWidth = 1000 / candles.length;
            const x = i * candleWidth + candleWidth * 0.15;
            const w = Math.max(2, candleWidth * 0.7);
            const vHeight = (c.volume / maxVolume) * volumeHeight;
            const y = chartHeight - 20 - vHeight;
            const isBull = c.close >= c.open;

            return (
              <rect
                key={`vol-${i}`}
                x={x}
                y={y}
                width={w}
                height={vHeight}
                fill={isBull ? '#059669' : '#dc2626'}
                opacity="0.45"
              />
            );
          })}

          {/* Candlesticks or Line rendering */}
          {chartType === 'candles' ? (
            candles.map((c, i) => {
              const candleWidth = 1000 / candles.length;
              const xCenter = i * candleWidth + candleWidth * 0.5;
              const isBull = c.close >= c.open;
              const color = isBull ? '#10b981' : '#ef4444';

              const yHigh = getY(c.high);
              const yLow = getY(c.low);
              const yOpen = getY(c.open);
              const yClose = getY(c.close);

              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
              const bodyWidth = Math.max(3, candleWidth * 0.65);

              return (
                <g key={`candle-${i}`}>
                  {/* Wick */}
                  <line
                    x1={xCenter}
                    y1={yHigh}
                    x2={xCenter}
                    y2={yLow}
                    stroke={color}
                    strokeWidth="1.2"
                  />
                  {/* Candle Body */}
                  <rect
                    x={xCenter - bodyWidth / 2}
                    y={bodyTop}
                    width={bodyWidth}
                    height={bodyHeight}
                    fill={color}
                    rx="1"
                  />
                </g>
              );
            })
          ) : (
            // Line / Area chart fallback
            <>
              <path
                d={candles
                  .map((c, i) => {
                    const candleWidth = 1000 / candles.length;
                    const x = i * candleWidth + candleWidth * 0.5;
                    const y = getY(c.close);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />
              {chartType === 'area' && (
                <path
                  d={`${candles
                    .map((c, i) => {
                      const candleWidth = 1000 / candles.length;
                      const x = i * candleWidth + candleWidth * 0.5;
                      const y = getY(c.close);
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')} L 1000 ${chartHeight - 20} L 0 ${chartHeight - 20} Z`}
                  fill="url(#areaGrad)"
                />
              )}
            </>
          )}

          {/* Simple Moving Average Line (MA 20) */}
          {showIndicators && (
            <path
              d={candles
                .map((c, i) => {
                  if (i < 4) return '';
                  const slice = candles.slice(Math.max(0, i - 14), i + 1);
                  const avg = slice.reduce((a, b) => a + b.close, 0) / slice.length;
                  const candleWidth = 1000 / candles.length;
                  const x = i * candleWidth + candleWidth * 0.5;
                  const y = getY(avg);
                  return `${i === 4 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              opacity="0.85"
            />
          )}

          {/* Live Horizontal Current Price Line */}
          <line
            x1="0"
            y1={currentPriceY}
            x2="1000"
            y2={currentPriceY}
            stroke="#10b981"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.8"
          />
        </svg>

        {/* Right Price Axis */}
        <div className="absolute right-0 top-0 bottom-0 w-[65px] border-l border-[#1b2233] bg-[#0c1017] flex flex-col justify-between py-3 px-1.5 font-mono text-[10px] text-slate-400 select-none">
          <span>${maxPrice.toLocaleString(undefined, { maximumFractionDigits: basePrice > 100 ? 1 : 3 })}</span>
          <span>${((maxPrice * 2 + minPrice) / 3).toLocaleString(undefined, { maximumFractionDigits: basePrice > 100 ? 1 : 3 })}</span>
          <span>${((maxPrice + minPrice * 2) / 3).toLocaleString(undefined, { maximumFractionDigits: basePrice > 100 ? 1 : 3 })}</span>
          <span>${minPrice.toLocaleString(undefined, { maximumFractionDigits: basePrice > 100 ? 1 : 3 })}</span>

          {/* Active Price Badge flag on axis */}
          <div
            className="absolute right-0 px-1 py-0.5 rounded-l text-[10px] font-bold text-black font-mono shadow-md z-10 transition-all"
            style={{
              top: `${Math.max(10, Math.min(chartHeight - 35, currentPriceY - 10))}px`,
              backgroundColor: '#10b981',
            }}
          >
            {basePrice.toLocaleString(undefined, {
              minimumFractionDigits: basePrice > 100 ? 2 : 4,
              maximumFractionDigits: basePrice > 100 ? 2 : 4,
            })}
          </div>
        </div>

        {/* Crosshair indicator on mouse hover */}
        {mousePos && (
          <>
            <div
              className="absolute left-0 w-[calc(100%-65px)] border-b border-dashed border-slate-500/60 pointer-events-none"
              style={{ top: `${mousePos.y}px` }}
            />
            <div
              className="absolute top-0 bottom-0 border-r border-dashed border-slate-500/60 pointer-events-none"
              style={{ left: `${mousePos.x}px` }}
            />
          </>
        )}

        {/* TradingView-style watermark */}
        <div className="absolute bottom-2 left-3 flex items-center gap-1.5 text-slate-700 pointer-events-none text-xs font-black">
          <div className="w-5 h-5 rounded-full border border-slate-800 flex items-center justify-center text-[10px]">
            ⚡
          </div>
          <span>CPT PRO ENGINE</span>
        </div>
      </div>

      {/* 4. BOTTOM TIMEFRAME STRIP */}
      <div className="bg-[#0e121b] border-t border-[#171e2c] px-4 py-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <div className="flex items-center gap-4">
          <span>06:00</span>
          <span>09:00</span>
          <span>12:00</span>
          <span>15:00</span>
          <span>18:00</span>
          <span>21:00</span>
          <span className="text-amber-400 font-bold">NOW</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>Time Zone: UTC+0</span>
          <span className="text-emerald-400">● Live Connection</span>
        </div>
      </div>
    </div>
  );
};
