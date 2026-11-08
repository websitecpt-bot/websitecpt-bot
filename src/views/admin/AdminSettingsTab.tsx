import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  ShieldCheck,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export const AdminSettingsTab: React.FC = () => {
  const { systemSettings, updateSystemSettings, resetAllData } = useApp();

  const [platformName, setPlatformName] = useState(systemSettings.platformName);
  const [supportEmail, setSupportEmail] = useState(systemSettings.supportEmail);
  const [telegramSupport, setTelegramSupport] = useState(systemSettings.telegramSupport);
  const [announcement, setAnnouncement] = useState(systemSettings.announcement);
  const [tradingFeePercent, setTradingFeePercent] = useState(systemSettings.tradingFeePercent.toString());
  const [minDeposit, setMinDeposit] = useState(systemSettings.minDeposit.toString());
  const [minWithdrawal, setMinWithdrawal] = useState(systemSettings.minWithdrawal.toString());
  const [maintenanceMode, setMaintenanceMode] = useState(systemSettings.maintenanceMode);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

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
    <div className="space-y-6 max-w-4xl">
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

        <div className="flex items-center justify-between p-3.5 bg-[#161c2a] border border-[#222a3d] rounded-xl">
          <div>
            <span className="font-bold text-white block">Maintenance Mode</span>
            <span className="text-[11px] text-slate-400">
              Temporarily halts new order tickets for infrastructure maintenance.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              maintenanceMode ? 'bg-cyan-400' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-all ${
                maintenanceMode ? 'left-7' : 'left-1'
              }`}
            />
          </button>
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
