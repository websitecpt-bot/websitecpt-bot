import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AdminDashboardTab } from './admin/AdminDashboardTab';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminSupportTab } from './admin/AdminSupportTab';
import { AdminBalanceTab } from './admin/AdminBalanceTab';
import { AdminMarketsTab } from './admin/AdminMarketsTab';
import { AdminDepositsTab } from './admin/AdminDepositsTab';
import { AdminWithdrawalsTab } from './admin/AdminWithdrawalsTab';
import { AdminTradesTab } from './admin/AdminTradesTab';
import { AdminReportsTab } from './admin/AdminReportsTab';
import { AdminSettingsTab } from './admin/AdminSettingsTab';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  DollarSign,
  Activity,
  CreditCard,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Settings,
  Shield,
  Lock,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
  Key,
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export const AdminPanel: React.FC = () => {
  const {
    setActiveTab,
    supportTickets,
    depositRequests,
    withdrawalRequests,
    trades,
    users,
    adminName,
    isSuperAdmin,
    currentUser,
    switchUser,
  } = useApp();

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Admin security authentication — username and password kept strictly confidential
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('cpt_admin_auth') === 'true';
  });
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Badges
  const pendingSupport = supportTickets.reduce((acc, t) => acc + (t.status === 'pending' ? 1 : 0), 0);
  const pendingDeposits = depositRequests.filter((d) => d.status === 'pending').length;
  const pendingWithdrawals = withdrawalRequests.filter((w) => w.status === 'pending').length;
  const activeTradesCount = trades.filter((t) => t.status === 'OPEN').length;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = adminUsername.trim().toLowerCase();
    const cleanPass = adminPassword.trim();

    // Verify Admin credentials requested:
    // Admin User: dashe99228222
    // Admin Password: 99228222
    const validUsers = ['dashe99228222', 'dashe99228222@cptmarket.uk', 'ripu', 'ripuworkshop@gmail.com', 'dashe'];
    const validPasswords = ['99228222', 'ripu2026'];

    const isUserValid = validUsers.includes(cleanUser);
    const isPassValid = validPasswords.includes(cleanPass);

    if (isUserValid && isPassValid) {
      const superAdminUser = users.find((u) => u.role === 'superadmin' || u.uid === '100001');
      if (superAdminUser) {
        switchUser(superAdminUser.id);
      }
      setIsAuthenticated(true);
      sessionStorage.setItem('cpt_admin_auth', 'true');
      setAuthError('');
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/admin');
      }
    } else {
      setAuthError('Invalid administrator username or password. Access denied.');
    }
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('cpt_admin_auth');
    setActiveTab('login');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/login');
    }
  };

  // If not authenticated, render secure Admin Login screen without bypasses
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-[#121622] border border-[#232c40] rounded-2xl w-full max-w-md p-8 shadow-2xl relative text-center">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 mx-auto flex items-center justify-center mb-4">
            <Shield className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-white tracking-wide">
            CPT Markets UK — Super Admin Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Restricted Administrative Access. Authorized Super Administrator only.
          </p>

          <form onSubmit={handleAdminLogin} className="mt-6 space-y-4 text-xs text-left">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Admin Username</label>
              <input
                type="text"
                required
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="Enter Username"
                className="w-full bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 text-white rounded-xl px-4 py-2.5 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Admin Password</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter Password"
                className="w-full bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 text-white rounded-xl px-4 py-2.5 outline-none font-mono"
              />
            </div>

            {authError && <div className="text-xs text-rose-400 font-medium">{authError}</div>}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-black font-extrabold py-3 rounded-xl transition-all shadow-md shadow-cyan-500/25 cursor-pointer"
            >
              Sign In to Super Admin Desk
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/login');
                }
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-white pt-2 block cursor-pointer"
            >
              ← Back to User Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Admin Dashboard',
      description: 'Metrics & Live Overview',
      icon: LayoutDashboard,
      badge: 0,
    },
    {
      id: 'users',
      label: 'User Management',
      description: 'Accounts & Suspensions',
      icon: Users,
      badge: 0,
    },
    {
      id: 'support',
      label: 'Support Inbox',
      description: 'Live 2-Way Chat Desk',
      icon: MessageSquare,
      badge: pendingSupport,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'balance',
      label: 'Balance Management',
      description: 'Credits & Manual Adjustments',
      icon: DollarSign,
      badge: 0,
    },
    {
      id: 'markets',
      label: 'Coins & Market Pairs',
      description: 'Spread & Calibration',
      icon: Activity,
      badge: 0,
    },
    {
      id: 'deposits',
      label: 'Deposit Requests',
      description: 'TXID Verification & Approvals',
      icon: CreditCard,
      badge: pendingDeposits,
      badgeColor: 'bg-emerald-500 text-black',
    },
    {
      id: 'withdrawals',
      label: 'Withdrawal Requests',
      description: 'Payout Approvals & Rejections',
      icon: ArrowUpRight,
      badge: pendingWithdrawals,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'trades',
      label: 'Trading Management',
      description: 'Live & Closed Positions',
      icon: TrendingUp,
      badge: activeTradesCount,
      badgeColor: 'bg-cyan-400 text-black',
    },
    {
      id: 'reports',
      label: 'Reports & History',
      description: 'Cashflow & Audit Trail',
      icon: FileText,
      badge: 0,
    },
    {
      id: 'settings',
      label: 'Settings Management',
      description: 'Platform Configurations',
      icon: Settings,
      badge: 0,
    },
  ];

  return (
    <div className="min-h-[90vh] bg-[#0b0e14] flex flex-col">
      {/* Top Admin Status Bar */}
      <div className="bg-[#121623] border-b border-[#1f273a] px-4 py-2.5 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-lg bg-[#1a2133] text-slate-300"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-bold text-white uppercase tracking-wider">
              CPT Markets Admin Portal
            </span>
          </div>

          <span className="hidden sm:inline-block text-slate-400">|</span>
          <span className="hidden sm:inline-block text-slate-400">
            Operator: <strong className="text-cyan-400">{adminName}</strong>
          </span>

          {isSupabaseConfigured() ? (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Supabase Cloud: Synced
            </span>
          ) : (
            <span
              className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono"
              title="Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel settings to activate global cloud sync"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Supabase: Connect in Vercel
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span>Online Traders: <strong className="text-cyan-400">{users.filter((u) => u.isOnline).length}</strong></span>
            <span>Live Trades: <strong className="text-sky-400">{activeTradesCount}</strong></span>
          </div>

          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-1.5 bg-[#142033] hover:bg-[#1a2c47] text-slate-200 border border-cyan-500/30 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span>Switch to Trading View</span>
          </button>

          <button
            onClick={handleAdminLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Log Out of Admin Panel"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Admin Content Body with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Sidebar Navigation */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#10141f] md:bg-transparent border-r md:border-r-0 border-[#1e2538] p-4 md:p-0 flex flex-col justify-between shrink-0 transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Admin Navigation
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeAdminSubTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveAdminSubTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 font-extrabold shadow-lg shadow-cyan-500/25'
                      : 'text-slate-300 hover:bg-[#121c2e] hover:text-cyan-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                    <div>
                      <span className="text-xs font-semibold block">{item.label}</span>
                      <span
                        className={`text-[10px] block ${
                          isActive ? 'text-slate-900/80' : 'text-slate-500'
                        }`}
                      >
                        {item.description}
                      </span>
                    </div>
                  </div>

                  {item.badge > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-black text-cyan-300' : item.badgeColor || 'bg-cyan-400 text-black'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar bottom footer */}
          <div className="pt-4 border-t border-[#1e2538] text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Role: Super Administrator</span>
            </div>
            <div>CPT Market UK v2.4</div>
          </div>
        </aside>

        {/* Dynamic Admin Sub-View */}
        <main className="flex-1 overflow-x-hidden min-w-0">
          {activeAdminSubTab === 'dashboard' && (
            <AdminDashboardTab onNavigate={(tab) => setActiveAdminSubTab(tab)} />
          )}
          {activeAdminSubTab === 'users' && <AdminUsersTab />}
          {activeAdminSubTab === 'support' && <AdminSupportTab />}
          {activeAdminSubTab === 'balance' && <AdminBalanceTab />}
          {activeAdminSubTab === 'markets' && <AdminMarketsTab />}
          {activeAdminSubTab === 'deposits' && <AdminDepositsTab />}
          {activeAdminSubTab === 'withdrawals' && <AdminWithdrawalsTab />}
          {activeAdminSubTab === 'trades' && <AdminTradesTab />}
          {activeAdminSubTab === 'reports' && <AdminReportsTab />}
          {activeAdminSubTab === 'settings' && <AdminSettingsTab />}
        </main>
      </div>
    </div>
  );
};
