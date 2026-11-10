import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User as UserIcon,
  Shield,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Users,
  Headphones,
  History,
  FileText,
  Bell,
  LogOut,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Lock,
  Camera,
  Upload,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  ChevronLeft,
} from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';

export const AccountView: React.FC = () => {
  const {
    currentUser,
    balanceAdjustments,
    setIsSupportOpen,
    setIsDepositModalOpen,
    setIsTransferModalOpen,
    setActiveTab,
    submitWithdrawalRequest,
    withdrawalRequests,
    logoutUser,
    updateUserAvatar,
    clientAgreement,
    changePassword,
  } = useApp();

  const [activeSubView, setActiveSubView] = useState<
    'menu' | 'invite' | 'withdraw' | 'balanceHistory' | 'personalInfo' | 'security' | 'announcements'
  >('menu');

  // Withdrawal form state matching screenshots image_8d605e91.png & image_67dab1b6.png
  const [withdrawalType, setWithdrawalType] = useState<'USD' | 'USDT'>('USD');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountHolderName, setAccountHolderName] = useState(currentUser.name);
  const [bankOrProvider, setBankOrProvider] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [usdtAddress, setUsdtAddress] = useState('');
  const [blockchainNetwork, setBlockchainNetwork] = useState<'TRC20' | 'BEP20' | 'ERC20'>('TRC20');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showWithdrawHistory, setShowWithdrawHistory] = useState(false);
  const [withdrawSourceWallet, setWithdrawSourceWallet] = useState<'funding' | 'trading'>('funding');
  const [withdrawFeedback, setWithdrawFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);

  // Password Change state (Security View matching Screenshot 3)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordFeedback({ type: 'error', message: 'New password and confirm password do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordFeedback({ type: 'success', message: res.message });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setPasswordFeedback({ type: 'error', message: err?.message || 'Failed to update password.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Invite & Referral copy state
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { users } = useApp();

  // Dynamic real referrals attributed strictly to the logged-in user
  const myReferrals = users.filter((u) => u.referredByUid === currentUser.uid);

  const referralCode = currentUser.uid;
  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/?ref=${referralCode}` 
    : `https://cptmarkets.com/?ref=${referralCode}`;

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Profile picture upload & compression state (prevents quota error and mobile crashes)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarFeedback, setAvatarFeedback] = useState<string | null>(null);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so user can re-select the same image file if desired
    e.target.value = '';

    setIsUploadingAvatar(true);
    setAvatarFeedback(null);

    try {
      // Compress mobile gallery image to lightweight 320x320 JPEG (~25KB)
      const compressed = await compressImageFile(file, {
        maxWidth: 320,
        maxHeight: 320,
        quality: 0.85,
        mimeType: 'image/jpeg',
      });

      updateUserAvatar(compressed);
      setAvatarFeedback('Profile photo updated successfully!');
      setTimeout(() => setAvatarFeedback(null), 3500);
    } catch (err) {
      console.error('Failed to compress/upload avatar:', err);
      alert('Unable to load photo. Please choose another image file (JPG or PNG).');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // User's balance adjustments
  const userAdjustments = balanceAdjustments.filter((b) => b.userId === currentUser.id);

  // Normalize wallet values and legacy cached withdrawal rows before rendering or validating.
  const fundingBalance = Number.isFinite(Number(currentUser?.fundingBalance))
    ? Number(currentUser.fundingBalance)
    : 0;
  const tradingBalance = Number.isFinite(Number(currentUser?.tradingBalance))
    ? Number(currentUser.tradingBalance)
    : 0;

  // User's withdrawals
  const userWithdrawals = (Array.isArray(withdrawalRequests) ? withdrawalRequests : [])
    .filter((w) => Boolean(w) && w.userId === currentUser.id);

  const submitWithdrawal = async (params: Parameters<typeof submitWithdrawalRequest>[0]) => {
    if (isSubmittingWithdrawal) return;

    setIsSubmittingWithdrawal(true);
    setWithdrawFeedback(null);
    try {
      const res = await submitWithdrawalRequest(params);
      setWithdrawFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });

      if (res.success) {
        setWithdrawAmount('');
        setAccountNumber('');
        setUsdtAddress('');
        setAdditionalNotes('');
      }
    } catch (err: any) {
      setWithdrawFeedback({
        type: 'error',
        message: err?.message || 'Unable to submit your withdrawal request. Please try again.',
      });
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingWithdrawal) return;

    const amt = Number(withdrawAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setWithdrawFeedback({ type: 'error', message: 'Please enter a valid withdrawal amount.' });
      return;
    }

    const available = withdrawSourceWallet === 'funding' ? fundingBalance : tradingBalance;

    if (amt > available) {
      setWithdrawFeedback({
        type: 'error',
        message: `Insufficient ${withdrawSourceWallet === 'funding' ? 'Funding' : 'Trading'} balance. Available: $${available.toFixed(2)}`,
      });
      return;
    }

    if (withdrawalType === 'USD') {
      if (!accountHolderName.trim()) {
        setWithdrawFeedback({ type: 'error', message: 'Please enter the account holder name.' });
        return;
      }
      if (!bankOrProvider.trim()) {
        setWithdrawFeedback({ type: 'error', message: 'Please enter bank, mobile banking or payment provider.' });
        return;
      }
      if (!accountNumber.trim()) {
        setWithdrawFeedback({ type: 'error', message: 'Please enter the receiving account number.' });
        return;
      }

      await submitWithdrawal({
        amount: amt,
        accountHolderName: accountHolderName.trim(),
        bankOrAddress: `${bankOrProvider.trim()} - ${accountNumber.trim()}`,
        network: 'Bank / Local USD Transfer',
        withdrawalType: 'USD',
        wallet: withdrawSourceWallet,
        notes: additionalNotes.trim(),
      });
      return;
    }

    if (!usdtAddress.trim()) {
      setWithdrawFeedback({ type: 'error', message: 'Please enter your USDT receiving address.' });
      return;
    }

    await submitWithdrawal({
      amount: amt,
      accountHolderName: currentUser.name,
      bankOrAddress: usdtAddress.trim(),
      network: `USDT (${blockchainNetwork})`,
      withdrawalType: 'USDT',
      wallet: withdrawSourceWallet,
      notes: additionalNotes.trim(),
    });
  };

  const handleLogout = () => {
    logoutUser();
    setActiveTab('login');
  };

  const mainBalance = (currentUser.fundingBalance || 0) + (currentUser.tradingBalance || 0);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* User Header Profile Card matching Screenshot 5 */}
      <div className="bg-[#10141f] border border-[#1e2538] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-400/60 shadow-lg shadow-amber-500/20"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 text-black font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}

            {isUploadingAvatar ? (
              <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center backdrop-blur-xs">
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              </div>
            ) : (
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 bg-[#1a2336] hover:bg-[#25324d] text-amber-400 border border-amber-500/30 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-all active:scale-90"
                title="Upload profile picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </label>
            )}

            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFile}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-white capitalize truncate">{currentUser.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">UID:</span>
              <span className="font-mono text-xs font-bold text-amber-400">{currentUser.uid}</span>
              <span className="text-[11px] text-slate-400">- Main Account</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <label
                htmlFor="avatar-upload"
                className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                <Camera className="w-3 h-3" />
                <span>{isUploadingAvatar ? 'Saving photo...' : 'Set Profile Photo'}</span>
              </label>
              {currentUser.avatar && (
                <button
                  type="button"
                  onClick={() => updateUserAvatar('')}
                  className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
                >
                  • Remove
                </button>
              )}
            </div>
            {avatarFeedback && (
              <div className="text-[11px] text-emerald-400 font-medium mt-1 animate-in fade-in">
                ✓ {avatarFeedback}
              </div>
            )}
          </div>
        </div>

        {/* Main Balance Row matching Screenshot 5 */}
        <div className="pt-3 border-t border-[#1b2234]">
          <span className="text-xs text-slate-400 block font-medium">Main Balance</span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white mt-0.5 tracking-tight">
            ${mainBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
            <span>Funding: ${(currentUser.fundingBalance || 0).toFixed(2)}</span>
            <span className="text-slate-600">·</span>
            <span>Trading: ${(currentUser.tradingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Quick Mobile-Friendly Wallet Actions */}
        <div className="pt-2 grid grid-cols-3 gap-2">
          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="bg-[#161c2a] hover:bg-[#1e2638] text-emerald-400 border border-emerald-500/20 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Deposit</span>
          </button>
          <button
            onClick={() => setActiveSubView('withdraw')}
            className="bg-[#161c2a] hover:bg-[#1e2638] text-amber-400 border border-amber-500/20 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Withdraw</span>
          </button>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="bg-[#161c2a] hover:bg-[#1e2638] text-blue-400 border border-blue-500/20 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* SUBVIEW: MAIN MENU matching Screenshot 5 */}
      {activeSubView === 'menu' && (
        <div className="space-y-6">
          <div className="bg-[#10141f] border border-[#1e2538] rounded-2xl divide-y divide-[#181f30] overflow-hidden shadow-xl">
            {/* 1. Personal Info & Avatar */}
            <button
              onClick={() => setActiveSubView('personalInfo')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#151a28] transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UserIcon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-200 group-hover:text-amber-400 transition-colors">
                  Personal Info & Avatar
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </button>

            {/* 2. Deposit */}
            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#151a28] transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-200 group-hover:text-emerald-400 transition-colors">
                  Deposit
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </button>

            {/* 3. Withdraw */}
            <button
              onClick={() => setActiveSubView('withdraw')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#151a28] transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-200 group-hover:text-amber-400 transition-colors">
                  Withdraw
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </button>

            {/* 4. Transfer */}
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#151a28] transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                    Transfer
                  </span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono">
                    Funding ↔ Trading
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </button>

            {/* 5. Invite Friends (pointed by user screenshot) */}
            <button
              onClick={() => setActiveSubView('invite')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#151a28] transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200 group-hover:text-purple-400 transition-colors">
                    Invite Friends
                  </span>
                  <span className="text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-semibold">
                    {myReferrals.length} Referred
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </button>

            {/* Agreement Menu Item matching screenshot image_e34ed765.png */}
            <button
              onClick={() => {
                setActiveTab('agreement');
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/agreement');
                }
              }}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#151a28] transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center relative group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4 text-purple-300" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[7px] font-bold">
                    ✓
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200 group-hover:text-purple-300 transition-colors">
                    Agreement
                  </span>
                  {clientAgreement ? (
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                      Executed · {clientAgreement.durationDays}D
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-medium">
                      Formal Contract
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </button>

            {/* 6. Security */}
            <button
              onClick={() => setActiveSubView('security')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#151a28] transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-200 group-hover:text-emerald-400 transition-colors">
                  Security
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </button>

            {/* 7. Announcements */}
            <button
              onClick={() => setActiveSubView('announcements')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#151a28] transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Bell className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-200 group-hover:text-amber-400 transition-colors">
                  Announcements
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </button>

            {/* 8. Customer Support */}
            <button
              onClick={() => setIsSupportOpen(true)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#151a28] transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Headphones className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-200 group-hover:text-rose-400 transition-colors">
                  Costomer Support
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
            </button>
          </div>

          {/* Logout Button matching Screenshot 5 */}
          <button
            onClick={handleLogout}
            className="w-full bg-[#f43f5e] hover:bg-[#e11d48] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-rose-500/20 active:scale-[0.99] cursor-pointer text-center"
          >
            Logout
          </button>
        </div>
      )}

      {/* SUBVIEW: INVITE FRIENDS matching Screenshot 3 & 4 */}
      {activeSubView === 'invite' && (
        <div className="bg-[#10141f] border border-[#1e2538] rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#1c2336] pb-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span>Invite Friends & Earn</span>
            </h3>
            <button
              onClick={() => setActiveSubView('menu')}
              className="text-xs text-amber-400 hover:underline cursor-pointer"
            >
              ← Back to Account
            </button>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-300 leading-relaxed">
            Invite your friends to register and trade on CPT Markets. You will earn tier commission from every trade executed by your network.
          </p>

          {/* Referral Code Box */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Your Referral Code</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#151a26] border border-[#242d40] rounded-xl px-4 py-3 font-mono text-base font-bold text-amber-400 tracking-wider">
                {referralCode}
              </div>
              <button
                onClick={() => copyToClipboard(referralCode, 'code')}
                className="bg-[#20293d] hover:bg-[#28344e] text-white px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#2a3650] shrink-0 cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          {/* Referral Link Box */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Your Referral Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 bg-[#151a26] border border-[#242d40] rounded-xl px-4 py-3 font-mono text-xs text-slate-300 outline-none select-all"
              />
              <button
                onClick={() => copyToClipboard(referralLink, 'link')}
                className="bg-amber-400 hover:bg-amber-300 text-black px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-amber-400/20 shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#151a26] border border-[#20283c] rounded-xl p-4">
              <span className="text-xs text-slate-400 font-medium block">Total Referred</span>
              <div className="text-2xl font-mono font-bold text-white mt-1">{myReferrals.length}</div>
            </div>
            <div className="bg-[#151a26] border border-[#20283c] rounded-xl p-4">
              <span className="text-xs text-slate-400 font-medium block">Commission Earned</span>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">$0.00</div>
            </div>
          </div>

          {/* Referred Users Section */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Referred Users ({myReferrals.length})
            </h4>

            {myReferrals.length === 0 ? (
              <div className="bg-[#0c0f17] border border-[#1b2234] rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 mx-auto flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-white">No Referrals Yet</h5>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Share your exclusive referral code <strong className="text-amber-400 font-mono">{referralCode}</strong> with your fellow traders. When they sign up, they will appear here.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(referralLink, 'link')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1b2336] hover:bg-[#232d44] border border-[#293652] text-amber-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-[#0c0f17] border border-[#1b2234] rounded-xl divide-y divide-[#171e2e] overflow-hidden">
                {myReferrals.map((refUser) => (
                  <div key={refUser.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 capitalize">{refUser.name}</span>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                          UID: {refUser.uid}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {refUser.email} · Registered: {refUser.createdAt ? refUser.createdAt.slice(0, 16) : 'Active'}
                      </div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                        {refUser.status}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Bal: ${refUser.tradingBalance.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBVIEW: WITHDRAW matching Screenshots image_8d605e91.png & image_67dab1b6.png */}
      {activeSubView === 'withdraw' && (
        <div className="space-y-6">
          {/* Header Row matching screenshot */}
          <div className="flex items-start justify-between">
            <div>
              <button
                onClick={() => {
                  setActiveSubView('menu');
                  setShowWithdrawHistory(false);
                }}
                className="text-xs text-amber-400 hover:underline cursor-pointer mb-1 block"
              >
                ← Back to Account
              </button>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Withdraw</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Submit a withdrawal request for administrator verification.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowWithdrawHistory(!showWithdrawHistory)}
              className="px-3 py-1.5 rounded-lg bg-[#151c2a] hover:bg-[#1a2336] border border-[#232f48] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>{showWithdrawHistory ? 'Back to Form' : 'History'}</span>
            </button>
          </div>

          {/* Feedback banner */}
          {withdrawFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                withdrawFeedback.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}
            >
              {withdrawFeedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{withdrawFeedback.message}</span>
            </div>
          )}

          {/* If History view is toggled */}
          {showWithdrawHistory ? (
            <div className="bg-[#101524] border border-[#1d273d] rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#1b2234] pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Withdrawal Records ({userWithdrawals.length})
                </h3>
                <span className="text-xs text-slate-400">Manual review desk</span>
              </div>

              {userWithdrawals.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No withdrawal requests found.
                </div>
              ) : (
                <div className="divide-y divide-[#171e2e]">
                  {userWithdrawals.map((w) => (
                    <div key={w.id} className="py-3.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-sm">
                              ${Number(w.amount ?? 0).toFixed(2)}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono uppercase font-bold">
                              {w.withdrawalType || 'USD'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {w.bankOrAddress}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {w.timestamp} · {w.network}
                          </div>
                          {w.notes && (
                            <div className="text-[10px] text-slate-400 italic">
                              Note: {w.notes}
                            </div>
                          )}
                        </div>

                        <div className="text-right space-y-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              w.status === 'approved'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : w.status === 'rejected'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {w.status}
                          </span>
                        </div>
                      </div>

                      {w.status === 'rejected' && (w.rejectReason || w.notes) && (
                        <div className="mt-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 text-xs text-rose-300 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-rose-400 block">Rejection Reason:</span>
                            <span className="text-[11px] text-rose-200">{w.rejectReason || w.notes}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Main Form matching Screenshot 1 (image_8d605e91.png) & Screenshot 2 (image_67dab1b6.png) */
            <div className="bg-[#101524] border border-[#1d273d] rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6">
              <form onSubmit={handleWithdrawSubmit} className="space-y-5">
                {/* 1. Withdrawal Source Wallet (Funding Wallet vs Trading Wallet) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Withdraw From Wallet
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsTransferModalOpen(true)}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Internal Transfer ⇄</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setWithdrawSourceWallet('funding');
                        setWithdrawFeedback(null);
                      }}
                      className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                        withdrawSourceWallet === 'funding'
                          ? 'bg-[#15231c] border-emerald-500/80 shadow-md ring-1 ring-emerald-500/50'
                          : 'bg-[#0c101c] border-[#1e283e] hover:bg-[#141b2d]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Funding Wallet</span>
                        {withdrawSourceWallet === 'funding' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        )}
                      </div>
                      <div className="text-sm font-mono font-bold text-amber-400 mt-0.5">
                        ${fundingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setWithdrawSourceWallet('trading');
                        setWithdrawFeedback(null);
                      }}
                      className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                        withdrawSourceWallet === 'trading'
                          ? 'bg-[#15231c] border-emerald-500/80 shadow-md ring-1 ring-emerald-500/50'
                          : 'bg-[#0c101c] border-[#1e283e] hover:bg-[#141b2d]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Trading Wallet</span>
                        {withdrawSourceWallet === 'trading' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        )}
                      </div>
                      <div className="text-sm font-mono font-bold text-white mt-0.5">
                        ${tradingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Withdrawal Type */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Withdrawal Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWithdrawalType('USD')}
                      className={`py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                        withdrawalType === 'USD'
                          ? 'bg-[#05c075] text-white shadow-lg shadow-emerald-500/25 ring-1 ring-[#05c075]'
                          : 'bg-[#0c101c] border border-[#1e283e] text-slate-300 hover:text-white hover:bg-[#141b2d]'
                      }`}
                    >
                      USD Withdrawal
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawalType('USDT')}
                      className={`py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                        withdrawalType === 'USDT'
                          ? 'bg-[#05c075] text-white shadow-lg shadow-emerald-500/25 ring-1 ring-[#05c075]'
                          : 'bg-[#0c101c] border border-[#1e283e] text-slate-300 hover:text-white hover:bg-[#141b2d]'
                      }`}
                    >
                      USDT Withdrawal
                    </button>
                  </div>
                </div>

                {/* 3. Withdrawal Amount */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Withdrawal Amount
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Min: <strong className="text-white">${systemSettings.minWithdrawal || 50}</strong>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      required
                      min={systemSettings.minWithdrawal || 1}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full bg-[#141a29] border border-[#232f48] focus:border-[#05c075] rounded-xl px-4 py-3 text-white font-mono text-sm outline-none transition-colors pr-24"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const maxAmt = withdrawSourceWallet === 'funding' ? fundingBalance : tradingBalance;
                          setWithdrawAmount(maxAmt > 0 ? maxAmt.toString() : '');
                        }}
                        className="px-2 py-0.5 bg-amber-400/15 hover:bg-amber-400/25 text-amber-400 font-bold text-[11px] rounded transition-colors cursor-pointer"
                      >
                        MAX
                      </button>
                      <span className="text-xs font-bold text-slate-400">
                        {withdrawalType === 'USD' ? 'USD' : 'USDT'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 pt-0.5 flex justify-between">
                    <span>
                      Available in {withdrawSourceWallet === 'funding' ? 'Funding Wallet' : 'Trading Wallet'}:{' '}
                      <strong className="text-amber-400 font-mono">
                        ${(withdrawSourceWallet === 'funding' ? fundingBalance : tradingBalance).toFixed(2)} {withdrawalType === 'USD' ? 'USD' : 'USDT'}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Conditional fields: USD vs USDT */}
                {withdrawalType === 'USD' ? (
                  <>
                    {/* Account Holder Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        required
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        placeholder="Enter account holder name"
                        className="w-full bg-[#141a29] border border-[#232f48] focus:border-[#05c075] rounded-xl px-4 py-3 text-white text-xs sm:text-sm outline-none transition-colors"
                      />
                    </div>

                    {/* Bank or Payment Provider */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Bank or Payment Provider
                      </label>
                      <input
                        type="text"
                        required
                        value={bankOrProvider}
                        onChange={(e) => setBankOrProvider(e.target.value)}
                        placeholder="Bank, mobile banking or payment provider"
                        className="w-full bg-[#141a29] border border-[#232f48] focus:border-[#05c075] rounded-xl px-4 py-3 text-white text-xs sm:text-sm outline-none transition-colors"
                      />
                    </div>

                    {/* Account Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Account Number
                      </label>
                      <input
                        type="text"
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter receiving account number"
                        className="w-full bg-[#141a29] border border-[#232f48] focus:border-[#05c075] rounded-xl px-4 py-3 text-white font-mono text-xs sm:text-sm outline-none transition-colors"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Blockchain Network matching Screenshot 2 */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Blockchain Network
                      </label>
                      <div className="relative">
                        <select
                          value={blockchainNetwork}
                          onChange={(e) => setBlockchainNetwork(e.target.value as any)}
                          className="w-full bg-[#141a29] border border-[#232f48] focus:border-[#05c075] rounded-xl px-4 py-3 text-white text-xs sm:text-sm outline-none appearance-none cursor-pointer"
                        >
                          <option value="TRC20" className="bg-[#101524] text-white">TRC20</option>
                          <option value="BEP20" className="bg-[#101524] text-white">BEP20</option>
                          <option value="ERC20" className="bg-[#101524] text-white">ERC20</option>
                        </select>
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Withdrawal Address */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Withdrawal Address
                      </label>
                      <input
                        type="text"
                        required
                        value={usdtAddress}
                        onChange={(e) => setUsdtAddress(e.target.value)}
                        placeholder="Enter receiving USDT wallet address"
                        className="w-full bg-[#141a29] border border-[#232f48] focus:border-[#05c075] rounded-xl px-4 py-3 text-white font-mono text-xs sm:text-sm outline-none transition-colors"
                      />
                    </div>

                    {/* Warning banner matching Screenshot 2 */}
                    <div className="bg-[#1b140d] border border-[#3e2712] rounded-xl p-3 text-xs text-amber-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>incorrect address or network may result in loss of funds.</span>
                    </div>
                  </>
                )}

                {/* Additional Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Additional Notes
                  </label>
                  <textarea
                    rows={3}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Optional withdrawal instructions"
                    className="w-full bg-[#141a29] border border-[#232f48] focus:border-[#05c075] rounded-xl px-4 py-3 text-white text-xs sm:text-sm outline-none resize-none transition-colors"
                  />
                </div>

                {/* Submit Withdrawal Request Button matching screenshot */}
                <button
                  type="submit"
                  disabled={isSubmittingWithdrawal}
                  className="w-full bg-[#05c075] hover:bg-[#04ad69] disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.99] cursor-pointer mt-2"
                >
                  {isSubmittingWithdrawal ? 'Submitting...' : 'Submit Withdrawal Request'}
                </button>
              </form>

              {/* Bottom Notice matching screenshot */}
              <div className="bg-[#0b0f1a] border border-[#192236] rounded-xl p-4 text-xs text-slate-400 leading-relaxed text-left">
                Withdrawal requests are processed manually. After submitting your request, contact Customer Support if additional verification is required.
              </div>

              {/* Real-time Withdrawal Records & Rejection Reason Feed */}
              {userWithdrawals.length > 0 && (
                <div className="bg-[#0e1322] border border-[#1d273d] rounded-2xl p-5 space-y-3 text-left">
                  <div className="flex items-center justify-between border-b border-[#1b2234] pb-2.5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span>Your Withdrawal Records ({userWithdrawals.length})</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">Live Status & Admin Notes</span>
                  </div>

                  <div className="divide-y divide-[#171e2e]">
                    {userWithdrawals.map((w) => (
                      <div key={w.id} className="py-3 text-xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white text-sm">
                                ${Number(w.amount ?? 0).toFixed(2)}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono uppercase font-bold">
                                {w.withdrawalType || 'USD'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                              {w.bankOrAddress}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {w.timestamp} · {w.network}
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                w.status === 'approved'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : w.status === 'rejected'
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {w.status}
                            </span>
                          </div>
                        </div>

                        {w.status === 'rejected' && (w.rejectReason || w.notes) && (
                          <div className="mt-2.5 bg-rose-500/15 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-200 flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-rose-400 block text-xs">Admin Rejection Reason:</span>
                              <p className="text-[12px] text-rose-100 font-medium mt-0.5 leading-relaxed">{w.rejectReason || w.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBVIEW: PERSONAL INFO */}
      {activeSubView === 'personalInfo' && (
        <div className="bg-[#10141f] border border-[#1e2538] rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#1c2336] pb-4">
            <h3 className="text-base font-bold text-white">Personal Information</h3>
            <button
              onClick={() => setActiveSubView('menu')}
              className="text-xs text-amber-400 hover:underline cursor-pointer"
            >
              ← Back to Account
            </button>
          </div>

          {/* Avatar Management Card */}
          <div className="bg-[#141a26] border border-[#20293d] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-black font-extrabold text-xl flex items-center justify-center">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span className="font-bold text-white text-sm block">Profile Photo</span>
                <span className="text-[11px] text-slate-400">PNG, JPG, or WEBP supported</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="avatar-upload-sub"
                className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold px-3.5 py-2 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{isUploadingAvatar ? 'Saving photo...' : 'Upload Photo'}</span>
              </label>
              <input
                id="avatar-upload-sub"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFile}
              />
              {currentUser.avatar && (
                <button
                  type="button"
                  onClick={() => updateUserAvatar('')}
                  className="bg-[#1e2638] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 p-2 rounded-lg transition-colors cursor-pointer"
                  title="Remove custom photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between py-2 border-b border-[#182030]">
              <span className="text-slate-400">User Identification (UID)</span>
              <span className="font-mono font-bold text-amber-400">{currentUser.uid}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#182030]">
              <span className="text-slate-400">Full Name</span>
              <span className="font-semibold text-white capitalize">{currentUser.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#182030]">
              <span className="text-slate-400">Email Address</span>
              <span className="font-mono text-slate-200">{currentUser.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#182030]">
              <span className="text-slate-400">Account Status</span>
              <span className="text-emerald-400 font-bold uppercase">KYC Verified · Active</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#182030]">
              <span className="text-slate-400">Member Since</span>
              <span className="font-mono text-slate-300">2026-10-15</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Jurisdiction</span>
              <span className="text-slate-300">United Kingdom (FCA Gateway)</span>
            </div>
          </div>
        </div>
      )}

      {/* SUBVIEW: SECURITY matching Screenshot 3 */}
      {activeSubView === 'security' && (
        <div className="space-y-4">
          {/* Header matching Screenshot 3 */}
          <div className="flex items-center justify-between py-2 border-b border-[#1c2336] mb-2">
            <button
              onClick={() => setActiveSubView('menu')}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#161c2a] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">Security</h2>
            <div className="w-7"></div>
          </div>

          {/* Card 1: Login Password */}
          <div className="bg-[#101524] border border-[#1e273d] rounded-2xl p-4 sm:p-5 flex items-start justify-between shadow-md">
            <div className="space-y-1">
              <span className="font-bold text-white block text-sm sm:text-base">Login Password</span>
              <p className="text-slate-400 text-xs">Your primary login password is currently protected and active.</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              Active
            </span>
          </div>

          {/* Card 2: Device Protection */}
          <div className="bg-[#101524] border border-[#1e273d] rounded-2xl p-4 sm:p-5 flex items-start justify-between shadow-md">
            <div className="space-y-1">
              <span className="font-bold text-white block text-sm sm:text-base">Device Protection</span>
              <p className="text-slate-400 text-xs">New device logins are tracked for additional account safety.</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              Active
            </span>
          </div>

          {/* Card 3: Two-Factor Authentication */}
          <div className="bg-[#101524] border border-[#1e273d] rounded-2xl p-4 sm:p-5 flex items-start justify-between shadow-md">
            <div className="space-y-1">
              <span className="font-bold text-white block text-sm sm:text-base">Two-Factor Authentication</span>
              <p className="text-slate-400 text-xs">Your account uses enhanced protection inside this secure dashboard environment.</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              Active
            </span>
          </div>

          {/* Card 4: Change Password Form (Exact Match to Screenshot 3) */}
          <div className="bg-[#101524] border border-[#1e273d] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#192236] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Change Password</h3>
                  <p className="text-xs text-slate-400">Update your account login password</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>

            {/* Success or error feedback banner */}
            {passwordFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  passwordFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {passwordFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{passwordFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block text-xs">Current Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-[#0c1220] border border-[#1f2b45] focus:border-amber-400 text-white rounded-xl pl-10 pr-10 py-3 outline-none text-xs font-mono transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block text-xs">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-[#0c1220] border border-[#1f2b45] focus:border-amber-400 text-white rounded-xl pl-10 pr-10 py-3 outline-none text-xs font-mono transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block text-xs">Confirm New Password</label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full bg-[#0c1220] border border-[#1f2b45] focus:border-amber-400 text-white rounded-xl pl-10 pr-10 py-3 outline-none text-xs font-mono transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Update Password Button */}
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full bg-gradient-to-r from-[#e67e00] via-[#f5a623] to-[#e67e00] hover:from-[#d87200] hover:to-[#e67e00] text-black font-extrabold py-3.5 rounded-xl transition-all shadow-[0_4px_25px_rgba(245,166,35,0.35)] active:scale-[0.99] cursor-pointer text-sm tracking-wide mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUpdatingPassword ? <span>Updating Password...</span> : <span>Update Password</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUBVIEW: ANNOUNCEMENTS */}
      {activeSubView === 'announcements' && (
        <div className="bg-[#10141f] border border-[#1e2538] rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#1c2336] pb-4">
            <h3 className="text-base font-bold text-white">Official Announcements</h3>
            <button
              onClick={() => setActiveSubView('menu')}
              className="text-xs text-amber-400 hover:underline cursor-pointer"
            >
              ← Back to Account
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 bg-[#141a26] border border-[#20293d] rounded-xl space-y-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span className="text-amber-400 font-bold uppercase">System Update</span>
                <span>2026-11-02</span>
              </div>
              <h4 className="font-bold text-white text-sm">CPT Market UK Engine Upgrade</h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                We have upgraded our trading matching engine to provide ultra-low latency execution and automated position margin management.
              </p>
            </div>

            <div className="p-4 bg-[#141a26] border border-[#20293d] rounded-xl space-y-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span className="text-emerald-400 font-bold uppercase">Zero Fee</span>
                <span>2026-10-28</span>
              </div>
              <h4 className="font-bold text-white text-sm">Internal Wallet Transfer is 100% Free</h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Enjoy instant and free balance transfers between your Funding Wallet and Trading Wallet at any time.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
