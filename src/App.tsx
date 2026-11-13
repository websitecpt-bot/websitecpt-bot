import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { HomeView } from './views/HomeView';
import { MarketView } from './views/MarketView';
import { TradeView } from './views/TradeView';
import { OrderHistoryView } from './views/OrderHistoryView';
import { AccountView } from './views/AccountView';
import { AdminPanel } from './views/AdminPanel';
import { UserLoginView } from './views/UserLoginView';
import { ClientTradingAgreementView } from './views/ClientTradingAgreementView';
import { SystemMaintenanceView } from './views/SystemMaintenanceView';
import { SupportModal } from './components/SupportModal';
import { DepositModal } from './components/DepositModal';
import { TransferModal } from './components/TransferModal';
import { Headphones, Home, TrendingUp, ArrowLeftRight, Clock, User } from 'lucide-react';
import { TRANSLATIONS } from './utils/translations';

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isUserLoggedIn,
    setIsSupportOpen,
    language,
    systemSettings,
    isAdmin,
  } = useApp();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Listen to browser navigation popstate
  React.useEffect(() => {
    const handleLocation = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/admin' || path.startsWith('/admin')) {
        setActiveTab('admin');
      } else if (path === '/login' || path === '/register') {
        setActiveTab('login');
      } else if (path === '/agreement') {
        setActiveTab('agreement');
      } else if (path === '/' && !isUserLoggedIn) {
        setActiveTab('login');
      }
    };
    window.addEventListener('popstate', handleLocation);
    return () => window.removeEventListener('popstate', handleLocation);
  }, [isUserLoggedIn, setActiveTab]);

  const isMaintenanceActive = Boolean(systemSettings.maintenanceMode && !isAdmin);
  const showHeader = isUserLoggedIn && activeTab !== 'login' && activeTab !== 'admin' && activeTab !== 'agreement' && !isMaintenanceActive;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans">
      {/* Top Header - Rendered strictly for authenticated user tabs, NEVER on Login, Admin or Agreement */}
      {showHeader && <Header />}

      {/* Main Routed Content */}
      <main className="flex-1 pb-24 md:pb-12">
        {/* If user navigates to Admin tab, always show Admin Panel */}
        {activeTab === 'admin' ? (
          <AdminPanel />
        ) : isMaintenanceActive ? (
          <SystemMaintenanceView />
        ) : !isUserLoggedIn || activeTab === 'login' ? (
          <UserLoginView />
        ) : activeTab === 'agreement' ? (
          <ClientTradingAgreementView />
        ) : (
          <>
            {activeTab === 'home' && <HomeView />}
            {activeTab === 'market' && <MarketView />}
            {activeTab === 'trade' && <TradeView />}
            {activeTab === 'history' && <OrderHistoryView />}
            {activeTab === 'account' && <AccountView />}
          </>
        )}
      </main>

      {/* Persistent Modals */}
      <SupportModal />
      <DepositModal />
      <TransferModal />

      {/* Mobile Bottom Navigation Bar (Matching screenshot: Home, Market, Trade, History, Account) */}
      {isUserLoggedIn && activeTab !== 'admin' && activeTab !== 'login' && activeTab !== 'agreement' && !isMaintenanceActive && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0c1017]/95 backdrop-blur-lg border-t border-[#1a2234] py-2 px-3 flex items-center justify-around select-none shadow-[0_-4px_25px_rgba(0,0,0,0.6)]"
        >
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'home'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">{t.home}</span>
          </button>

          <button
            onClick={() => setActiveTab('market')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'market'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px]">{t.market}</span>
          </button>

          <button
            onClick={() => setActiveTab('trade')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'trade'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span className="text-[10px]">{t.trade}</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px]">{t.history}</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'account'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">{t.account}</span>
          </button>
        </nav>
      )}

      {/* Bottom Footer (Clean footer with NO admin button) */}
      {activeTab !== 'admin' && activeTab !== 'login' && isUserLoggedIn && !isMaintenanceActive && (
        <footer className="bg-[#080b10] border-t border-[#181d2a] py-6 px-4 sm:px-6 text-xs text-slate-400">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">CPT</span>
              <span className="font-extrabold text-amber-400">Markets</span>
              <span className="text-[10px] text-amber-500/80 uppercase tracking-widest ml-1 border border-amber-500/30 px-1 rounded">UK</span>
              <span className="text-slate-500 ml-2">© 2026 CPT Market UK Ltd. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-6 text-slate-400">
              <button
                onClick={() => setIsSupportOpen(true)}
                className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>24/7 Official Support</span>
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
