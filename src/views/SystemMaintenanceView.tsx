import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CptLogo } from '../components/CptLogo';
import {
  Wrench,
  Shield,
  Clock,
  RefreshCw,
  Lock,
  Headphones,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const SystemMaintenanceView: React.FC = () => {
  const { systemSettings, setIsSupportOpen, setActiveTab } = useApp();
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  const handleCheckStatus = () => {
    setIsChecking(true);
    setCheckResult(null);
    setTimeout(() => {
      setIsChecking(false);
      if (!systemSettings.maintenanceMode) {
        window.location.reload();
      } else {
        setCheckResult('System upgrade is currently still underway. Please check back shortly.');
        setTimeout(() => setCheckResult(null), 4000);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-white flex flex-col items-center justify-between p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top Branding Header */}
      <header className="w-full max-w-4xl flex items-center justify-between py-4 border-b border-[#182135]/60 z-10">
        <div className="flex items-center gap-2">
          <CptLogo size={36} showText={true} />
        </div>

        <div className="flex items-center gap-2 bg-[#121826] border border-[#222e47] px-3 py-1.5 rounded-full text-xs font-mono text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span>MAINTENANCE MODE</span>
        </div>
      </header>

      {/* Center Upgrade Notice Card */}
      <main className="w-full max-w-2xl my-auto py-8 z-10 text-center space-y-6">
        {/* Animated Icon Badge */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-amber-400/10 to-transparent border border-amber-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(245,166,35,0.2)]">
            <Wrench className="w-11 h-11 text-amber-400 animate-pulse" />
          </div>
          <div className="absolute -bottom-2 bg-[#131926] border border-amber-400/40 text-amber-300 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-widest shadow-md">
            Upgrading Engine
          </div>
        </div>

        {/* Titles & Message */}
        <div className="space-y-2.5">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            System Upgrade & Maintenance
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            {systemSettings.announcement && systemSettings.announcement.trim() !== ''
              ? systemSettings.announcement
              : 'Our global trading infrastructure and database servers are undergoing scheduled performance upgrades to provide ultra-low latency execution and enhanced margin protection.'}
          </p>
        </div>

        {/* System Checklist / Security Assurance */}
        <div className="bg-[#0e1424]/90 border border-[#1d2944] rounded-2xl p-5 text-left space-y-3.5 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1b253c] text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              Platform Status Overview
            </span>
            <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              User Funds 100% Secured
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-slate-200">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>Core Trading Engine Migration</span>
              </div>
              <span className="text-amber-400 font-mono font-bold text-[11px]">In Progress (85%)</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Treasury & Wallet Balances</span>
              </div>
              <span className="text-emerald-400 font-mono font-bold text-[11px]">Safe & Verified</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-slate-200">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Estimated Restoration Time</span>
              </div>
              <span className="text-cyan-400 font-mono font-bold text-[11px]">Within 30–60 Minutes</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold px-6 py-3 rounded-xl text-xs transition-all shadow-[0_4px_25px_rgba(245,166,35,0.35)] active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking Platform Status...' : 'Check System Status'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSupportOpen(true)}
            className="w-full sm:w-auto bg-[#141b2d] hover:bg-[#1c263f] text-slate-200 border border-[#253352] font-bold px-6 py-3 rounded-xl text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Headphones className="w-4 h-4 text-amber-400" />
            <span>Contact 24/7 Live Desk</span>
          </button>
        </div>

        {checkResult && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-xl flex items-center justify-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{checkResult}</span>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl flex items-center justify-center py-4 border-t border-[#182135]/60 text-xs text-slate-500 z-10">
        <p>© 2026 CPT Markets UK. Authorized and Regulated Brokerage.</p>
      </footer>
    </div>
  );
};
