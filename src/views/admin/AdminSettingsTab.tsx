import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  ShieldCheck,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Database,
  UploadCloud,
} from 'lucide-react';
import { isFirebaseConfigured } from '../../lib/firebase';

export const AdminSettingsTab: React.FC = () => {
  const { systemSettings, updateSystemSettings, resetAllData, migrateCachedDataToFirebase } = useApp();

  const [platformName, setPlatformName] = useState(systemSettings.platformName);
  const [supportEmail, setSupportEmail] = useState(systemSettings.supportEmail);
  const [telegramSupport, setTelegramSupport] = useState(systemSettings.telegramSupport);
  const [announcement, setAnnouncement] = useState(systemSettings.announcement);
  const [tradingFeePercent, setTradingFeePercent] = useState(systemSettings.tradingFeePercent.toString());
  const [minDeposit, setMinDeposit] = useState(systemSettings.minDeposit.toString());
  const [minWithdrawal, setMinWithdrawal] = useState(systemSettings.minWithdrawal.toString());
  const [maintenanceMode, setMaintenanceMode] = useState(systemSettings.maintenanceMode);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillFeedback, setBackfillFeedback] = useState<string | null>(null);
  const firebaseConfigured = isFirebaseConfigured();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings({
      platformName,
      supportEmail,
      telegramSupport,
      announcement,
      tradingFeePercent: parseFloat(tradingFeePercent) || 0.1,
      minDeposit: parseFloat(minDeposit) || 100,
      minWithdrawal: parseFloat(minWithdrawal) || 50,
      maintenanceMode,
    });
    setSavedFeedback('Platform configuration saved successfully.');
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  const handleResetConfirm = () => {
    if (window.confirm('Reset all demo/simulated database records to clean factory defaults? This resets balances and trades.')) {
      resetAllData();
      setSavedFeedback('All state reset to factory defaults.');
    }
  };

  return (
    <div className="w-full min-w-0 max-w-4xl space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span>System & Platform Operations Settings</span>
        </h2>
        <p className="text-xs text-slate-400">
          Configure operational limits, announcements, trading fee rates, and global security policies.
        </p>
      </div>

      {savedFeedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{savedFeedback}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[#121622] border border-[#21293c] rounded-2xl p-6 shadow-xl space-y-5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-300 font-medium block mb-1">Platform Brand Name</label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 rounded-xl px-4 py-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Official Support Desk Email</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 rounded-xl px-4 py-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Official Telegram Support Channel</label>
            <input
              type="text"
              value={telegramSupport}
              onChange={(e) => setTelegramSupport(e.target.value)}
              className="w-full bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 rounded-xl px-4 py-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Trading Fee (%)</label>
            <input
              type="number"
              step="any"
              value={tradingFeePercent}
              onChange={(e) => setTradingFeePercent(e.target.value)}
              className="w-full bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 rounded-xl px-4 py-2 text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Minimum Deposit Amount ($)</label>
            <input
              type="number"
              step="any"
              value={minDeposit}
              onChange={(e) => setMinDeposit(e.target.value)}
              className="w-full bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 rounded-xl px-4 py-2 text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Minimum Withdrawal Amount ($)</label>
            <input
              type="number"
              step="any"
              value={minWithdrawal}
              onChange={(e) => setMinWithdrawal(e.target.value)}
              className="w-full bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 rounded-xl px-4 py-2 text-white font-mono outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-300 font-medium block mb-1">Global Broadcast Announcement Banner</label>
          <input
            type="text"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            className="w-full bg-[#161c2a] border border-[#242e44] focus:border-cyan-400 rounded-xl px-4 py-2 text-white outline-none"
          />
        </div>

        {/* Maintenance / Upgrade Mode Live Toggle Card */}
        <div className={`p-4 rounded-xl border transition-all ${
          maintenanceMode
            ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_25px_rgba(245,166,35,0.15)]'
            : 'bg-[#161c2a] border-[#222a3d]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">System Upgrade / Maintenance Mode</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    maintenanceMode
                      ? 'bg-amber-400 text-black animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {maintenanceMode ? '🟡 Active (Under Maintenance)' : '🟢 Platform Live'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed max-w-xl">
                {maintenanceMode
                  ? 'All public and trader traffic is currently redirected to the System Upgrade screen. As an Administrator, your management portal remains active.'
                  : 'Platform is operating normally. Turn ON when performing database updates, server upgrades, or coin recalibrations.'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const nextVal = !maintenanceMode;
                  setMaintenanceMode(nextVal);
                  updateSystemSettings({ maintenanceMode: nextVal });
                  setSavedFeedback(
                    nextVal
                      ? '⚠️ System Upgrade / Maintenance Mode is now ACTIVE. Public visitors are blocked by the Upgrade screen.'
                      : '✅ Platform is now LIVE. Trading and normal client access restored.'
                  );
                  setTimeout(() => setSavedFeedback(null), 4000);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                  maintenanceMode
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-400 hover:bg-amber-300 text-black font-extrabold shadow-amber-500/20'
                }`}
              >
                <span>{maintenanceMode ? 'Turn OFF Maintenance' : 'Turn ON Maintenance'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextVal = !maintenanceMode;
                  setMaintenanceMode(nextVal);
                  updateSystemSettings({ maintenanceMode: nextVal });
                }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  maintenanceMode ? 'bg-amber-400' : 'bg-slate-700'
                }`}
                title="Toggle Maintenance Mode"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-all ${
                    maintenanceMode ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-black font-extrabold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-cyan-500/25 cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Platform Settings</span>
          </button>
        </div>
      </form>

      {/* Shared Firebase Database Configuration */}
      <div className="bg-[#121622] border border-[#21293c] rounded-2xl p-6 shadow-xl space-y-4 text-xs">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Firebase Firestore Database</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Customer and Admin data now share the same Firebase project and update across devices in real time.
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono border ${
            firebaseConfigured
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            {firebaseConfigured ? 'FIREBASE CONFIGURED' : 'FIREBASE NOT CONFIGURED'}
          </span>
        </div>

        <div className="rounded-xl border border-[#253149] bg-[#0d1421] p-3 space-y-2">
          <div className="text-slate-400">Cloud collections used by this app</div>
          <div className="flex flex-wrap gap-2">
            {['users', 'supportTickets', 'trades', 'deposits', 'withdrawals', 'auditLogs', 'balanceAdjustments', 'marketCoins', 'marketSettings', 'systemSettings'].map((name) => (
              <span key={name} className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 font-mono text-[10px] text-cyan-200">{name}</span>
            ))}
          </div>
          <p className="text-[10px] leading-relaxed text-slate-500">
            Firestore creates each collection automatically when the app saves its first document. Do not delete collections or change the Firebase project while customer accounts and messages are in use.
          </p>
        </div>

        {!firebaseConfigured && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-[11px] leading-relaxed text-rose-200">
            Firebase configuration is missing. Check the VITE_FIREBASE_* environment variables in Vercel and redeploy before accepting customer activity.
          </p>
        )}
      </div>

      {/* Non-destructive legacy cache backfill */}
      <div className="rounded-2xl border border-amber-500/30 bg-[#151923] p-4 shadow-xl sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-300">
          <Database className="h-4 w-4" />
          <h3 className="text-sm font-bold text-white">Legacy Customer Data Backfill</h3>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-300">
          Copy the customer accounts and records retained in this browser's previous app cache into Firebase. Existing Firebase documents are never overwritten; matching accounts are linked by their account ID or email, and legacy passwords are excluded.
        </p>
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-2.5 text-[10px] leading-relaxed text-amber-100">
          Important: this copies only what is still cached in this browser. The cache may be older than the last Supabase database snapshot. Compare the customer balances against the latest source records before running it; this tool does not contact Supabase or guarantee that the browser cache is complete.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={!firebaseConfigured || isBackfilling}
            onClick={async () => {
              if (!window.confirm('Copy missing legacy records from this browser cache into Firebase? Existing Firebase records will not be overwritten, and passwords will not be copied.')) return;
              setIsBackfilling(true);
              setBackfillFeedback(null);
              try {
                const result = await migrateCachedDataToFirebase();
                setBackfillFeedback(result.summary);
              } catch (error) {
                setBackfillFeedback(error instanceof Error ? error.message : 'Legacy data backfill could not be completed.');
              } finally {
                setIsBackfilling(false);
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/15 px-4 py-2.5 text-xs font-bold text-amber-200 transition-colors hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <UploadCloud className="h-4 w-4" />
            {isBackfilling ? 'Copying Missing Records...' : 'Backfill This Browser Cache to Firebase'}
          </button>
          <span className="text-[10px] text-slate-500">Does not update existing Firebase balances or trade history.</span>
        </div>
        {backfillFeedback && (
          <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-3 text-[11px] leading-relaxed text-cyan-100 break-words">
            {backfillFeedback}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-[#1a1215] border border-rose-900/40 rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>Factory Reset System State</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Restore all mock trades, users, support tickets, and balances to their clean initial state. Useful if you want to test the entire lifecycle from scratch.
        </p>
        <button
          onClick={handleResetConfirm}
          className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
        >
          Reset All Data to Initial Demo State
        </button>
      </div>
    </div>
  );
};
