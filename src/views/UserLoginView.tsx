import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  AlertCircle,
  Headphones,
  UserPlus,
  ArrowRight,
  Gift,
} from 'lucide-react';
import { CptLogo } from '../components/CptLogo';
import { OFFICIAL_REFERRAL_CODES } from '../data/initialData';

export const UserLoginView: React.FC = () => {
  const { loginUser, registerUser, setActiveTab, setIsAdmin, setIsSupportOpen, users } = useApp();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');

  // Sign In fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regReferralCode, setRegReferralCode] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Animated registration success state
  const [registeredSuccessUser, setRegisteredSuccessUser] = useState<{
    name: string;
    uid: string;
    email: string;
  } | null>(null);

  // Read ?ref= query parameter and /login or /register path automatically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/register')) {
        setMode('register');
      } else if (path.includes('/login')) {
        setMode('signin');
      }
      const searchParams = new URLSearchParams(window.location.search);
      const ref = searchParams.get('ref');
      if (ref) {
        setRegReferralCode(ref.trim());
        setMode('register');
      }
    }
  }, []);

  // Check matching inviter in real time (either existing user UID or 3 official master codes: 100001, 777888, 992282)
  const trimmedRef = regReferralCode.trim();
  const officialMatch = OFFICIAL_REFERRAL_CODES.find((o) => o.code === trimmedRef);
  const userMatch = trimmedRef ? users.find((u) => u.uid === trimmedRef) : null;

  const matchedInviter = officialMatch
    ? { uid: officialMatch.code, isOfficial: true }
    : userMatch
    ? { uid: userMatch.uid, isOfficial: false }
    : null;

  // Feedback messages
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = loginUser(loginIdentifier, loginPassword);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (regPassword && regConfirmPassword && regPassword !== regConfirmPassword) {
      setFeedback({ type: 'error', message: 'Passwords do not match. Please re-enter.' });
      return;
    }

    const trimmedRef = regReferralCode.trim();
    if (!trimmedRef) {
      setFeedback({
        type: 'error',
        message: 'Referral Code is required to register. Please enter a valid inviter UID.',
      });
      return;
    }

    if (!matchedInviter) {
      setFeedback({
        type: 'error',
        message: 'Invalid Referral Code. Please enter a valid inviter UID.',
      });
      return;
    }

    const res = registerUser({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      referralCode: trimmedRef,
    });

    if (res.success && res.user) {
      setRegisteredSuccessUser({
        name: res.user.name,
        uid: res.user.uid,
        email: res.user.email,
      });

      // Automatically prefill login identifier with registered email/name
      setLoginIdentifier(res.user.email);
      setLoginPassword('');

      // After 2.5 seconds, automatically smoothly redirect to Sign In form
      setTimeout(() => {
        setRegisteredSuccessUser(null);
        setMode('signin');
        setFeedback({
          type: 'success',
          message: `Registration successful! Your Account UID is ${res.user?.uid}. Please enter your password to sign in.`,
        });
      }, 2500);
      return;
    }

    if (!res.success) {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 relative overflow-hidden bg-[#070b14] select-none">
      {/* Radial soft blue glow matching Screenshot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#0c1f44]/40 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] relative z-10 text-center space-y-6">
        {/* Clean Logo Header */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <CptLogo size={42} showText={true} />
          <p className="text-xs text-slate-400">
            {mode === 'signin' ? 'Sign in to access your trading account' : 'Join CPT Markets for global trading'}
          </p>
        </div>

        {/* Celebratory Registration Success Card requested by user */}
        {registeredSuccessUser && (
          <div className="bg-[#0e1628] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400 mx-auto flex items-center justify-center animate-bounce shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Registration Successful!</h2>
              <p className="text-xs text-emerald-300 font-medium mt-1">
                রেজিস্ট্রেশন সফল হয়েছে!
              </p>
            </div>

            <div className="bg-[#141f36] border border-[#213254] rounded-xl p-3.5 text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Name:</span>
                <span className="text-white font-bold">{registeredSuccessUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Your UID:</span>
                <span className="text-amber-400 font-bold">{registeredSuccessUser.uid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Status:</span>
                <span className="text-emerald-400 font-bold">Active & Ready</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>Redirecting to Sign In page...</span>
              </div>
              <div className="w-full bg-[#1b253b] rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full w-full animate-pulse"></div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRegisteredSuccessUser(null);
                  setMode('signin');
                }}
                className="w-full bg-amber-400 hover:bg-amber-300 text-black font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer mt-2"
              >
                Go to Sign In Now →
              </button>
            </div>
          </div>
        )}

        {/* Feedback message banner */}
        {!registeredSuccessUser && feedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 text-left ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* MODE 1: SIGN IN (Matches Screenshot exactly) */}
        {!registeredSuccessUser && mode === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="space-y-4 text-left text-xs">
            {/* Username / Email */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block text-[13px]">
                Username / Email
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Username / Email"
                  className="w-full bg-[#0c1426]/90 border border-[#1e2f52] focus:border-amber-400 text-white rounded-xl pl-10 pr-4 py-3 outline-none transition-all placeholder:text-slate-500 text-xs shadow-inner"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block text-[13px]">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-[#0c1426]/90 border border-[#1e2f52] focus:border-amber-400 text-white rounded-xl pl-10 pr-10 py-3 outline-none transition-all placeholder:text-slate-500 text-xs shadow-inner font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Big Golden Button matching Screenshot */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#f5a623] via-[#ffb938] to-[#e69818] hover:from-[#e69818] hover:to-[#d8890e] text-black font-extrabold py-3.5 rounded-xl transition-all shadow-[0_4px_25px_rgba(245,166,35,0.35)] active:scale-[0.98] cursor-pointer text-sm tracking-wide mt-2"
            >
              Go to Sign In
            </button>

            {/* Links */}
            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setFeedback(null);
                  if (typeof window !== 'undefined') {
                    window.history.pushState({}, '', '/register');
                  }
                }}
                className="text-[#f5a623] hover:underline flex items-center gap-1.5 font-semibold cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSupportOpen(true)}
                className="text-[#f5a623] hover:underline flex items-center gap-1.5 font-semibold cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Forgot Password / Help</span>
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: CREATE ACCOUNT (REGISTRATION) */}
        {!registeredSuccessUser && mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-left text-xs">
            <div className="text-center pb-1">
              <h3 className="text-base font-bold text-white">Create New Trader Account</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Instant registration. An exclusive UID will be assigned to you.
              </p>
            </div>

            {/* Name / Username */}
            <div className="space-y-1">
              <label className="text-slate-300 font-medium block">Username / Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Username / Full Name"
                  className="w-full bg-[#0c1426]/90 border border-[#1e2f52] focus:border-amber-400 text-white rounded-xl pl-10 pr-4 py-2.5 outline-none text-xs"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-slate-300 font-medium block">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full bg-[#0c1426]/90 border border-[#1e2f52] focus:border-amber-400 text-white rounded-xl pl-10 pr-4 py-2.5 outline-none text-xs"
                />
              </div>
            </div>

            {/* Phone (optional) */}
            <div className="space-y-1">
              <label className="text-slate-300 font-medium block">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="Phone Number (Optional)"
                  className="w-full bg-[#0c1426]/90 border border-[#1e2f52] focus:border-amber-400 text-white rounded-xl pl-10 pr-4 py-2.5 outline-none text-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">Password</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-[#0c1426]/90 border border-[#1e2f52] focus:border-amber-400 text-white rounded-xl px-3 py-2.5 outline-none text-xs font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">Confirm</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full bg-[#0c1426]/90 border border-[#1e2f52] focus:border-amber-400 text-white rounded-xl px-3 py-2.5 outline-none text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Referral Code (Mandatory Requirement) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-medium block">
                  Referral Code <span className="text-rose-400 font-bold">*</span>
                </label>
                <span className="text-[10px] text-amber-400/90 font-medium">Inviter UID required</span>
              </div>
              <div className="relative">
                <Gift className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={regReferralCode}
                  onChange={(e) => setRegReferralCode(e.target.value)}
                  placeholder="Enter Inviter UID"
                  className={`w-full bg-[#0c1426]/90 border rounded-xl pl-10 pr-4 py-2.5 outline-none text-xs font-mono transition-colors ${
                    matchedInviter
                      ? 'border-emerald-500/80 text-emerald-300 focus:border-emerald-400'
                      : regReferralCode.trim()
                      ? 'border-rose-500/80 text-rose-300 focus:border-rose-400'
                      : 'border-[#1e2f52] focus:border-amber-400 text-white'
                  }`}
                />
              </div>

              {/* Dynamic Inviter Verification Feedback */}
              {regReferralCode.trim() && (
                <div className="pt-1">
                  {matchedInviter ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>
                        Verified Inviter Code: <strong className="text-white font-mono">UID {matchedInviter.uid}</strong>
                        {matchedInviter.isOfficial && <span className="ml-1.5 text-amber-400 font-bold">(Official Master Code)</span>}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-medium bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                      <span>Invalid Referral Code. Please enter a valid inviter UID.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Registration Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#f5a623] to-[#e69818] hover:from-[#e69818] hover:to-[#d8890e] text-black font-extrabold py-3.5 rounded-xl transition-all shadow-[0_4px_25px_rgba(245,166,35,0.35)] active:scale-[0.98] cursor-pointer text-sm tracking-wide mt-2"
            >
              Create Account & Start Trading
            </button>

            {/* Back to Sign In */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setFeedback(null);
                  if (typeof window !== 'undefined') {
                    window.history.pushState({}, '', '/login');
                  }
                }}
                className="text-[#f5a623] hover:underline font-semibold cursor-pointer text-xs"
              >
                ← Already have an account? Go to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Platform Compliance & Security Footer */}
        <div className="pt-4 border-t border-[#182647] text-center space-y-2 text-xs text-slate-500">
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-amber-400/80" />
            <span>Regulated Margin Brokerage & 256-Bit SSL Encrypted</span>
          </div>
          <p className="text-[10px] text-slate-600">
            CPT Markets UK is authorized and regulated by the Financial Conduct Authority (FCA).
          </p>
        </div>
      </div>
    </div>
  );
};
