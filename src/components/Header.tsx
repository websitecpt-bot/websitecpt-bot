import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, MessageSquare, ChevronDown, User, Check, RefreshCw, Globe } from 'lucide-react';
import { CptLogo } from './CptLogo';
import { LANGUAGES, TRANSLATIONS } from '../utils/translations';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    users,
    switchUser,
    coins,
    supportTickets,
    depositRequests,
    withdrawalRequests,
    setIsSupportOpen,
    isAdmin,
    setIsAdmin,
    isSuperAdmin,
    language,
    setLanguage,
  } = useApp();

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // Calculate pending items for Admin indicator badge
  const pendingSupport = supportTickets.reduce((acc, t) => acc + (t.status === 'pending' ? 1 : 0), 0);
  const pendingDeposits = depositRequests.filter((d) => d.status === 'pending').length;
  const pendingWithdrawals = withdrawalRequests.filter((w) => w.status === 'pending').length;
  const totalAdminPending = pendingSupport + pendingDeposits + pendingWithdrawals;

  // Unread user support messages
  const userTicket = supportTickets.find((t) => t.userId === currentUser.id);
  const userUnread = userTicket?.unreadUserCount || 0;

  return (
    <header className="sticky top-0 z-40 bg-[#0d111a] border-b border-[#1f2637] select-none">
      {/* Top Ticker Ribbon matching screenshots */}
      <div className="bg-[#090c13] border-b border-[#181d2a] px-4 py-1.5 overflow-x-auto scrollbar-none flex items-center gap-6 text-xs text-slate-300">
        <div className="flex items-center gap-6 whitespace-nowrap min-w-full">
          {coins.slice(0, 6).map((coin) => {
            const isPos = coin.change24h >= 0;
            return (
              <div
                key={coin.symbol}
                className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors"
                onClick={() => {
                  setActiveTab('trade');
                }}
              >
                <span className="font-semibold text-slate-200">{coin.symbol}</span>
                <span className="font-mono text-slate-300">
                  ${coin.price.toLocaleString(undefined, { minimumFractionDigits: coin.price > 100 ? 2 : 4 })}
                </span>
                <span className={`font-mono text-[11px] ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPos ? '▲' : '▼'} {isPos ? '+' : ''}{coin.change24h.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <div
            onClick={() => setActiveTab('home')}
            className="cursor-pointer group"
          >
            <CptLogo size={32} showText={true} />
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'home'
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {t.home}
            </button>
            <button
              onClick={() => setActiveTab('market')}
              className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'market'
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {t.market}
            </button>
            <button
              onClick={() => setActiveTab('trade')}
              className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'trade'
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {t.trade}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {t.history}
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'account'
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {t.account}
            </button>
          </nav>
        </div>

        {/* Right side controls: Live Support, Language, and Customer UID Badge */}
        <div className="flex items-center gap-2">
          {/* Live Support Trigger with badge */}
          <button
            onClick={() => setIsSupportOpen(true)}
            className="relative flex items-center gap-1.5 bg-[#171f2e] hover:bg-[#202b3f] text-slate-200 border border-[#2b364e] px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm cursor-pointer"
            title="Open Live Support Chat"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{t.liveSupport}</span>
            {userUnread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {userUnread}
              </span>
            )}
          </button>

          {/* Language Selector Dropdown (Responsive on Mobile and Desktop) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 bg-[#121622] hover:bg-[#1a2030] active:scale-95 border border-[#242c3f] px-2 sm:px-2.5 py-1.5 rounded-md text-xs text-slate-200 transition-all cursor-pointer"
              title="Select Language"
            >
              <span className="text-sm leading-none">{currentLangObj.flag}</span>
              <span className="font-bold text-[11px] text-slate-300 uppercase">{currentLangObj.code}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <>
                {/* Backdrop overlay for mobile touch dismiss */}
                <div
                  className="fixed inset-0 z-40 bg-black/50 md:bg-transparent"
                  onClick={() => setLangDropdownOpen(false)}
                />

                {/* Dropdown Menu - Centered modal on mobile, clean dropdown on desktop */}
                <div className="fixed inset-x-4 top-24 md:static md:inset-auto md:absolute md:right-0 md:mt-2 w-auto md:w-52 max-w-xs mx-auto bg-[#131722] border border-[#262e42] rounded-xl shadow-2xl p-2 z-50">
                  <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#22293b]">
                    <span>Language / ভাষা</span>
                    <button
                      type="button"
                      onClick={() => setLangDropdownOpen(false)}
                      className="md:hidden text-slate-400 hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="py-1 max-h-60 overflow-y-auto space-y-1">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                          language === lang.code
                            ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-500/30'
                            : 'text-slate-300 hover:bg-[#1e2536] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg leading-none">{lang.flag}</span>
                          <span className="text-sm">{lang.label}</span>
                        </div>
                        {language === lang.code && <Check className="w-4 h-4 text-amber-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Single Corner UID Badge matching screenshot */}
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className="flex items-center gap-1.5 bg-[#141925] hover:bg-[#1c2333] border border-[#232c40] px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer group"
            title="My Account"
          >
            <span className="text-slate-400 text-[11px]">UID:</span>
            <span className="font-mono font-bold text-amber-400 group-hover:text-amber-300">
              {currentUser.uid}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
