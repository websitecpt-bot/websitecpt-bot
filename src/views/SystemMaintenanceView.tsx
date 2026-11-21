import React from 'react';
import { CptLogo } from '../components/CptLogo';
import { Wrench, Clock, RefreshCw } from 'lucide-react';

export const SystemMaintenanceView: React.FC = () => {
  const handleRefresh = () => window.location.reload();

  return (
    <div className="min-h-[100dvh] bg-[#070a12] text-white flex flex-col items-center justify-between p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <header className="w-full max-w-4xl flex items-center justify-between py-4 border-b border-[#182135]/60 z-10">
        <CptLogo size={36} showText={true} />
        <div className="flex items-center gap-2 bg-[#121826] border border-[#222e47] px-3 py-1.5 rounded-full text-xs font-mono text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>MAINTENANCE MODE</span>
        </div>
      </header>

      <main className="w-full max-w-2xl my-auto py-12 z-10 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-amber-400/10 to-transparent border border-amber-500/30 shadow-[0_0_50px_rgba(245,166,35,0.2)]">
          <Wrench className="w-11 h-11 text-amber-400 animate-pulse" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            System Maintenance &amp; Update in Progress
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            We are currently upgrading our platform and moving services to a new system.
            Login and new account registration are temporarily unavailable.
          </p>
        </div>

        <div className="bg-[#0e1424]/90 border border-[#1d2944] rounded-2xl p-5 sm:p-6 text-left space-y-3 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-3 text-amber-300 font-bold text-sm">
            <Clock className="w-5 h-5 shrink-0" />
            Please wait while we complete the update.
          </div>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Please do not try to log in or create a new account during this maintenance.
            We will restore access after the system checks are complete. Thank you for your patience.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold px-6 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-[0_4px_25px_rgba(245,166,35,0.25)] active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Check Again
        </button>
      </main>

      <footer className="w-full max-w-4xl flex items-center justify-center py-4 border-t border-[#182135]/60 text-xs text-slate-500 z-10 text-center">
        <p>© 2026 CPT Markets UK. Thank you for your patience.</p>
      </footer>
    </div>
  );
};
