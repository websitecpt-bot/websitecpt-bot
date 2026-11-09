import React from 'react';

interface OfficialCoinIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

/**
 * High-fidelity official coin badges matching screenshots:
 * image_df93f9b4.png & image_5496d9c8.png
 * BTC, ETH, BNB, SOL, XRP, ADA, DOT, AVAX, XAU, XAG, etc.
 */
export const OfficialCoinIcon: React.FC<OfficialCoinIconProps> = ({ symbol, size = 32, className = '' }) => {
  const s = symbol.toUpperCase().replace('/USDT', '').replace('USDT', '').replace('/USD', '').replace('USD', '');

  // Helper styling for standard sized container
  const boxStyle = { width: size, height: size };

  // 1. BITCOIN (BTC) - Official Orange (#F7931A) with double-stroked ₿
  if (s === 'BTC') {
    return (
      <div
        style={boxStyle}
        className={`rounded-full bg-[#F7931A] flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-500/20 ${className}`}
      >
        <svg viewBox="0 0 32 32" className="w-[68%] h-[68%]" fill="currentColor">
          <path d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.921-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.535 2.146-4.148.986-5.318.695l.95-3.805c1.17.292 4.929.872 4.368 3.11zm.536-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.697 3.61 2.733z" />
        </svg>
      </div>
    );
  }

  // 2. ETHEREUM (ETH) - Official Blue (#627EEA) with geometric Ethereum diamond
  if (s === 'ETH') {
    return (
      <div
        style={boxStyle}
        className={`rounded-full bg-[#627EEA] flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20 ${className}`}
      >
        <svg viewBox="0 0 32 32" className="w-[62%] h-[62%]" fill="currentColor">
          <path d="M16 4L6 18.5 16 23.5 26 18.5 16 4zm0 2.2l7.7 11.2L16 21.3l-7.7-3.9L16 6.2zM6 20.3L16 28l10-7.7-10 4.7L6 20.3z" />
        </svg>
      </div>
    );
  }

  // 3. BINANCE COIN (BNB) - Official Gold/Yellow (#F3BA2F) with Binance 4-diamond mark
  if (s === 'BNB') {
    return (
      <div
        style={boxStyle}
        className={`rounded-full bg-[#F3BA2F] flex items-center justify-center text-black font-extrabold shrink-0 shadow-md shadow-yellow-500/20 ${className}`}
      >
        <svg viewBox="0 0 32 32" className="w-[62%] h-[62%]" fill="#000">
          <path d="M16 6.5l4 4-4 4-4-4 4-4zm-6.5 6.5l4 4-4 4-4-4 4-4zm13 0l4 4-4 4-4-4 4-4zm-6.5 6.5l4 4-4 4-4-4 4-4z" />
        </svg>
      </div>
    );
  }

  // 4. SOLANA (SOL) - Official Dark with 3 Cyan-Purple Gradient Slanted Bars
  if (s === 'SOL') {
    return (
      <div
        style={boxStyle}
        className={`rounded-full bg-[#181528] border border-[#2b2542] flex items-center justify-center shrink-0 shadow-md ${className}`}
      >
        <svg viewBox="0 0 32 32" className="w-[65%] h-[65%]">
          <defs>
            <linearGradient id="solGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00FFA3" />
              <stop offset="100%" stopColor="#DC1FFF" />
            </linearGradient>
          </defs>
          <path d="M8 9.5h13.5l2.5 2.5H10.5L8 9.5z" fill="url(#solGrad)" />
          <path d="M10.5 14.75h13.5l-2.5 2.5H8l2.5-2.5z" fill="url(#solGrad)" />
          <path d="M8 20h13.5l2.5 2.5H10.5L8 20z" fill="url(#solGrad)" />
        </svg>
      </div>
    );
  }

  // 5. RIPPLE / XRP - Official Dark Circle with modern curved XRP emblem
  if (s === 'XRP') {
    return (
      <div
        style={boxStyle}
        className={`rounded-full bg-[#23292F] border border-slate-600/50 flex items-center justify-center text-white font-bold shrink-0 shadow-md ${className}`}
      >
        <svg viewBox="0 0 32 32" className="w-[60%] h-[60%]" fill="#FFF">
          <path d="M24.7 7h3.3l-7.5 7.4-2.1-2.1L24.7 7zm-17.4 0H4l7.5 7.4 2.1-2.1L7.3 7zM16 18.2l-5.3 5.3 2.1 2.1 3.2-3.2 3.2 3.2 2.1-2.1-5.3-5.3zm8.7 6.8H28l-7.5-7.4-2.1 2.1 6.3 5.3zM4 25h3.3l6.3-5.3-2.1-2.1L4 25z" />
        </svg>
      </div>
    );
  }

  // 6. CARDANO (ADA) - Official Deep Blue (#0033AD) with Cardano star cluster
  if (s === 'ADA') {
    return (
      <div
        style={boxStyle}
        className={`rounded-full bg-[#0033AD] flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-600/20 ${className}`}
      >
        <svg viewBox="0 0 32 32" className="w-[65%] h-[65%]" fill="#FFF">
          <circle cx="16" cy="16" r="3" />
          <circle cx="16" cy="7" r="1.5" />
          <circle cx="16" cy="25" r="1.5" />
          <circle cx="8" cy="16" r="1.5" />
          <circle cx="24" cy="16" r="1.5" />
          <circle cx="10" cy="10" r="1.2" />
          <circle cx="22" cy="22" r="1.2" />
          <circle cx="10" cy="22" r="1.2" />
          <circle cx="22" cy="10" r="1.2" />
        </svg>
      </div>
    );
  }

  // 7. POLKADOT (DOT) - Official Magenta/Pink (#E6007A)
  if (s === 'DOT') {
    return (
      <div
        style={boxStyle}
        className={`rounded-full bg-[#E6007A] flex items-center justify-center text-white shrink-0 shadow-md shadow-pink-600/20 ${className}`}
      >
        <svg viewBox="0 0 32 32" className="w-[62%] h-[62%]" fill="#FFF">
          <circle cx="16" cy="13" r="5" />
          <circle cx="16" cy="24" r="2.5" />
          <circle cx="16" cy="4" r="1.5" />
        </svg>
      </div>
    );
  }

  // 8. AVALANCHE (AVAX) - Official Red (#E84142) with white A peak
  if (s === 'AVAX') {
    return (
      <div
        style={boxStyle}
        className={`rounded-full bg-[#E84142] flex items-center justify-center text-white shrink-0 shadow-md shadow-red-500/20 ${className}`}
      >
        <svg viewBox="0 0 32 32" className="w-[62%] h-[62%]" fill="#FFF">
          <path d="M19.5 7.5L25 17h-4l-3-5.2-1.5 2.7-2-3.5 5-3.5zm-5 4.5l-8.5 14.5h5l6-10.5-2.5-4zm5.5 5.5l-4 7h8l-4-7z" />
        </svg>
      </div>
    );
  }

  // 9. GOLD (XAU / XAUUSD) - Metallic Gold Bullion
  if (s.includes('XAU') || s === 'GOLD') {
    return (
      <div
        style={boxStyle}
        className={`rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 flex items-center justify-center text-amber-950 font-black shrink-0 shadow-md shadow-yellow-500/30 ${className}`}
      >
        <svg viewBox="0 0 24 24" className="w-[62%] h-[62%]" fill="currentColor">
          <path d="M4 18h16l-2-6H6l-2 6zm3-4h10l1 3H6l1-3zm1-6h8l2 5H6l2-5zm2 2h4l-1 2h-2l-1-2z" />
        </svg>
      </div>
    );
  }

  // 10. SILVER (XAG / XAGUSD) - Metallic Silver Bar
  if (s.includes('XAG') || s === 'SILVER') {
    return (
      <div
        style={boxStyle}
        className={`rounded-full bg-gradient-to-tr from-slate-400 via-gray-200 to-slate-400 flex items-center justify-center text-slate-800 font-black shrink-0 shadow-md ${className}`}
      >
        <svg viewBox="0 0 24 24" className="w-[62%] h-[62%]" fill="currentColor">
          <path d="M4 18h16l-2-6H6l-2 6zm3-4h10l1 3H6l1-3zm1-6h8l2 5H6l2-5z" />
        </svg>
      </div>
    );
  }

  // 11. EURO (EUR / EURUSD) - Official EU Blue with Yellow Stars
  if (s.includes('EUR')) {
    return (
      <div
        style={boxStyle}
        className={`rounded-full bg-[#003399] border border-blue-400/30 flex items-center justify-center text-yellow-300 font-extrabold text-[10px] shrink-0 shadow-md ${className}`}
      >
        <span>€</span>
      </div>
    );
  }

  // 12. BRITISH POUND (GBP / GBPUSD) - UK Flag colors with £
  if (s.includes('GBP')) {
    return (
      <div
        style={boxStyle}
        className={`rounded-full bg-[#012169] border border-red-500/60 flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-md ${className}`}
      >
        <span>£</span>
      </div>
    );
  }

  // 13. NASDAQ 100 (NAS / NASUSD) - Tech Cyan
  if (s.includes('NAS')) {
    return (
      <div
        style={boxStyle}
        className={`rounded-full bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center text-white font-black text-[10px] tracking-tight shrink-0 shadow-md shadow-cyan-500/20 ${className}`}
      >
        <span>100</span>
      </div>
    );
  }

  // 14. US WALL STREET 30 (U30 / U30USD) - Deep Purple
  if (s.includes('U30')) {
    return (
      <div
        style={boxStyle}
        className={`rounded-full bg-gradient-to-tr from-purple-700 to-indigo-500 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md ${className}`}
      >
        <span>U</span>
      </div>
    );
  }

  // 15. DASH (DSH / DSHUSD) - Official Cyan Blue
  if (s.includes('DSH')) {
    return (
      <div
        style={boxStyle}
        className={`rounded-full bg-[#008DE4] flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md ${className}`}
      >
        <span>Ð</span>
      </div>
    );
  }

  // Default clean badge
  return (
    <div
      style={boxStyle}
      className={`rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 ${className}`}
    >
      {symbol.slice(0, 2)}
    </div>
  );
};

/**
 * Returns formatted subtitle name matching screenshot image_df93f9b4.png
 */
export const getCoinFullName = (symbol: string): string => {
  const s = symbol.toUpperCase().replace('/USDT', '').replace('USDT', '').replace('/USD', '').replace('USD', '');
  switch (s) {
    case 'BTC':
      return 'Bitcoin';
    case 'ETH':
      return 'Ethereum';
    case 'BNB':
      return 'Binance Coin';
    case 'SOL':
      return 'Solana';
    case 'XRP':
      return 'Ripple';
    case 'ADA':
      return 'Cardano';
    case 'DOT':
      return 'Polkadot';
    case 'AVAX':
      return 'Avalanche';
    case 'TRX':
      return 'TRON';
    case 'XAU':
      return 'Gold Bullion';
    case 'XAG':
      return 'Silver Bullion';
    case 'EUR':
      return 'Euro';
    case 'GBP':
      return 'British Pound';
    case 'NAS':
      return 'Nasdaq 100 Index';
    case 'U30':
      return 'US Wall St 30';
    case 'DSH':
      return 'Dash';
    default:
      return symbol;
  }
};
