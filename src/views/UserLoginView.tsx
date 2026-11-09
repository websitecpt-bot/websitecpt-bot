import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Headphones,
  Shield,
  Loader2,
} from 'lucide-react';
import { OFFICIAL_REFERRAL_CODES } from '../data/initialData';
import { CptLogo } from '../components/CptLogo';
import { isSupabaseConfigured } from '../lib/supabase';

export const UserLoginView: React.FC = () => {
  const { loginUser, registerUser, setIsSupportOpen, users } = useApp();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sign In fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register fields (matches user screenshot exactly)
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regInviteCode, setRegInviteCode] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

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
        setRegInviteCode(ref.trim());
        setMode('register');
      }
    }
  }, []);

  // Check matching inviter in real time (either existing user UID or 3 official master codes: 100001, 777888, 992282)
  const trimmedRef = regInviteCode.trim();
  const officialMatch = OFFICIAL_REFERRAL_CODES.find((o) => o.code === trimmedRef);
  const userMatch = trimmedRef ? users.find((u) => u.uid === trimmedRef) : null;

  const matchedInviter = officialMatch
    ? { uid: officialMatch.code, isOfficial: true }
    : userMatch
    ? { uid: userMatch.uid, isOfficial: false }
    : null;

  // Feedback messages
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const res = await loginUser(loginIdentifier.trim(), loginPassword);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.message || 'Invalid credentials' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Login failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (regPassword.length < 6) {
      setFeedback({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setFeedback({ type: 'error', message: 'Passwords do not match. Please verify and re-enter.' });
      return;
    }

    // Invite code validation: if provided, verify it exists. If empty, default to master code 100001
    const codeToUse = trimmedRef || '100001';
    if (trimmedRef && !matchedInviter) {
      setFeedback({
        type: 'error',
        message: 'Invalid invite code. Please enter a valid inviter UID or leave blank for default.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerUser({
        name: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
        referralCode: codeToUse,
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
            message: `Account created successfully! Your UID is ${res.user?.uid}. Please sign in with your password.`,
          });
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/login');
          }
        }, 2500);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Registration failed. Please try again.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Registration error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 relative overflow-hidden bg-[#070b14] select-none">
      {/* Radial soft blue glow matching Screenshot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#0c1f44]/40 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[440px] relative z-10 text-center space-y-5">
        {/* Top Official Logo matching main website Header exactly */}
        <div className="flex flex-col items-center justify-center">
          <CptLogo size={46} showText={true} className="justify-center" />

          <h1 className="text-2xl font-black text-amber-400 tracking-tight mt-4">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'signin' ? 'Sign in to access your trading account' : 'Join CptMarkets for global trading'}
          </p>
        </div>

        {/* Celebratory Registration Success Card */}
        {registeredSuccessUser && (
          <div className="bg-[#0e1628] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400 mx-auto flex items-center justify-center animate-bounce shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Registration Successful!</h2>
              <p className="text-xs text-emerald-300 font-medium mt-1">
                Your trader account has been created.
              </p>
            </div>

            <div className="bg-[#141f36] border border-[#213254] rounded-xl p-3.5 text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Username:</span>
                <span className="text-white font-bold">{registeredSuccessUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account UID:</span>
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
                <span>Redirecting to Sign In form...</span>
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

        {/* MAIN CARD CONTAINER */}
        {!registeredSuccessUser && (
          <div className="bg-[#0c1426]/90 border border-[#1b2a4a] rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
            {/* MODE 1: SIGN IN */}
            {mode === 'signin' && (
              <form onSubmit={handleSignInSubmit} className="space-y-4 text-left text-xs">
                {/* Username / Email */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block text-xs">
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
                      className="w-full bg-[#111c34] border border-[#223356] focus:border-amber-400 text-white rounded-xl pl-10 pr-4 py-3 outline-none transition-all placeholder:text-slate-500 text-xs shadow-inner"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block text-xs">
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
                      className="w-full bg-[#111c34] border border-[#223356] focus:border-amber-400 text-white rounded-xl pl-10 pr-10 py-3 outline-none transition-all placeholder:text-slate-500 text-xs shadow-inner font-mono"
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

                {/* Big Golden Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#e67e00] via-[#f5a623] to-[#e67e00] hover:from-[#d87200] hover:to-[#e67e00] text-black font-extrabold py-3.5 rounded-xl transition-all shadow-[0_4px_25px_rgba(245,166,35,0.4)] active:scale-[0.98] cursor-pointer text-sm tracking-wide mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Go to Sign In</span>
                  )}
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

            {/* MODE 2: CREATE ACCOUNT (Matches screenshot image_ae3f08d4.png 1:1) */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-left text-xs">
                {/* 1. Username */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block text-xs">
                    Username
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="Username"
                      className="w-full bg-[#111c34] border border-[#223356] focus:border-amber-400 text-white rounded-xl pl-10 pr-4 py-3 outline-none transition-all placeholder:text-slate-500 text-xs shadow-inner"
                    />
                  </div>
                </div>

                {/* 2. Email */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block text-xs">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full bg-[#111c34] border border-[#223356] focus:border-amber-400 text-white rounded-xl pl-10 pr-4 py-3 outline-none transition-all placeholder:text-slate-500 text-xs shadow-inner"
                    />
                  </div>
                </div>

                {/* 3. Password */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block text-xs">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Password (at least 6 characters)"
                      className="w-full bg-[#111c34] border border-[#223356] focus:border-amber-400 text-white rounded-xl pl-10 pr-10 py-3 outline-none transition-all placeholder:text-slate-500 text-xs shadow-inner font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 4. Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block text-xs">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      className="w-full bg-[#111c34] border border-[#223356] focus:border-amber-400 text-white rounded-xl pl-10 pr-10 py-3 outline-none transition-all placeholder:text-slate-500 text-xs shadow-inner font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 5. Invite Code */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block text-xs">
                    Invite Code
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regInviteCode}
                      onChange={(e) => setRegInviteCode(e.target.value)}
                      placeholder="Invite code (optional)"
                      className={`w-full bg-[#111c34] border rounded-xl pl-10 pr-4 py-3 outline-none transition-all placeholder:text-slate-500 text-xs shadow-inner font-mono ${
                        matchedInviter
                          ? 'border-emerald-500/80 text-emerald-300 focus:border-emerald-400'
                          : regInviteCode.trim()
                          ? 'border-rose-500/80 text-rose-300 focus:border-rose-400'
                          : 'border-[#223356] focus:border-amber-400 text-white'
                      }`}
                    />
                  </div>
                  {/* Verified indicator if matched */}
                  {regInviteCode.trim() && matchedInviter && (
                    <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 pt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Valid inviter code: UID {matchedInviter.uid}</span>
                    </p>
                  )}
                </div>

                {/* Big Orange-Gold Register Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#e67e00] via-[#f5a623] to-[#e67e00] hover:from-[#d87200] hover:to-[#e67e00] text-black font-extrabold py-3.5 rounded-xl transition-all shadow-[0_4px_25px_rgba(245,166,35,0.4)] active:scale-[0.98] cursor-pointer text-sm tracking-wide mt-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <span>Register</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Bottom switch link matching screenshot: "Already have an account? Go to Sign In" */}
        {!registeredSuccessUser && (
          <div className="text-center text-xs text-slate-400">
            {mode === 'register' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setFeedback(null);
                    if (typeof window !== 'undefined') {
                      window.history.pushState({}, '', '/login');
                    }
                  }}
                  className="text-amber-400 font-extrabold hover:underline cursor-pointer ml-1"
                >
                  Go to Sign In
                </button>
              </p>
            ) : (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setFeedback(null);
                    if (typeof window !== 'undefined') {
                      window.history.pushState({}, '', '/register');
                    }
                  }}
                  className="text-amber-400 font-extrabold hover:underline cursor-pointer ml-1"
                >
                  Create Account
                </button>
              </p>
            )}
          </div>
        )}

        {/* Platform Compliance & Security Footer */}
        <div className="pt-2 border-t border-[#182647]/50 text-center space-y-1.5 text-xs text-slate-500">
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
