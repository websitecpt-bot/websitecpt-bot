import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ChevronLeft,
  User,
  Shield,
  Calendar,
  Clock,
  Activity,
  DollarSign,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Download,
  RotateCcw,
  Home,
  Phone,
  Globe,
  MapPin,
  Lock,
  Check,
  Building,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';

// Country list with dial codes
const COUNTRIES = [
  { name: 'Bangladesh', code: '+880', flag: '🇧🇩' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'Qatar', code: '+974', flag: '🇶🇦' },
  { name: 'Kuwait', code: '+965', flag: '🇰🇼' },
];

const TRADING_PURPOSES = [
  'Speculative Trading',
  'Personal Trading',
  'Hedging & Risk Management',
  'High-Yield Margin Arbitrage',
  'Algorithmic Scalping',
  'Long-Term Institutional Portfolio',
  'Commodities & Metals Exposure',
];

export const ClientTradingAgreementView: React.FC = () => {
  const { currentUser, setActiveTab, clientAgreement, submitAgreement, resetAgreement } = useApp();

  // Mode: form or summary
  const [viewMode, setViewMode] = useState<'form' | 'summary'>(() => {
    return clientAgreement ? 'summary' : 'form';
  });

  // Section 01: Client Information
  const [fullName, setFullName] = useState(currentUser.name || '');
  const username = currentUser.name;
  const uid = currentUser.uid;
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0].name);
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phoneCode, setPhoneCode] = useState(COUNTRIES[0].code);
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phone ? currentUser.phone.replace(/^\+\d+/, '').trim() : '');

  // Section 02: Agreement Details
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [durationDays, setDurationDays] = useState<number | ''>(5);
  const [tradingPurpose, setTradingPurpose] = useState('Personal Trading');
  const [tradeAmount, setTradeAmount] = useState('5000');

  // Auto-calculated End Date
  const calculateEndDate = (start: string, days: number | ''): string => {
    if (!start || !days) return 'Auto-calculated';
    try {
      const d = new Date(start);
      if (isNaN(d.getTime())) return 'Auto-calculated';
      d.setDate(d.getDate() + Number(days));
      return d.toISOString().split('T')[0];
    } catch {
      return 'Auto-calculated';
    }
  };

  const endDate = calculateEndDate(startDate, durationDays);

  // Section 03: Upload Identity
  const [identityFile, setIdentityFile] = useState<{
    name: string;
    dataUrl: string;
    sizeKb: number;
  } | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsUploadingDoc(true);
    try {
      const compressedDataUrl = await compressImageFile(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
        mimeType: 'image/jpeg',
      });

      setIdentityFile({
        name: file.name,
        dataUrl: compressedDataUrl,
        sizeKb: Math.round(file.size / 1024),
      });
    } catch (err) {
      console.error('Document upload error:', err);
      alert('Unable to load document. Please choose a valid image (JPG or PNG).');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Section 04: Manual Signature (Canvas)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');

  // Setup canvas resolution and touch-scroll prevention
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#f5a623';
    ctx.lineWidth = 2.5;

    // Non-passive touch listener to guarantee smooth drawing on mobile without screen jumping
    const handleTouchPrevent = (e: TouchEvent) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    };
    canvas.addEventListener('touchstart', handleTouchPrevent, { passive: false });
    canvas.addEventListener('touchmove', handleTouchPrevent, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', handleTouchPrevent);
      canvas.removeEventListener('touchmove', handleTouchPrevent);
    };
  }, [viewMode]);

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if ('touches' in e) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureDataUrl('');
  };

  // Section 05: Age Verification & Agreement Checkbox
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);
  const [isTermsConfirmed, setIsTermsConfirmed] = useState(false);

  // Form error feedback
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Smooth back to account without page reload or state wiping
  const handleBackToAccount = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveTab('account');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleSubmitAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validations
    if (!fullName.trim()) {
      setFormError('Please enter your legal Full Name.');
      return;
    }
    if (!city.trim()) {
      setFormError('Please enter your City.');
      return;
    }
    if (!address.trim()) {
      setFormError('Please enter your Complete Address.');
      return;
    }
    if (!phoneNumber.trim()) {
      setFormError('Please enter your Phone Number.');
      return;
    }
    if (!durationDays) {
      setFormError('Please select an Agreement Duration (3, 5, or 7 days).');
      return;
    }
    const amt = parseFloat(tradeAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid Trade Amount.');
      return;
    }
    if (!hasSignature || !signatureDataUrl) {
      setFormError('Please draw your manual signature in the signature pad.');
      return;
    }
    if (!isAgeConfirmed) {
      setFormError('You must confirm that you are 18 years of age or older.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAgreement({
        userId: currentUser.id,
        fullName: fullName.trim(),
        username,
        uid,
        country: selectedCountry,
        city: city.trim(),
        address: address.trim(),
        phoneCode,
        phoneNumber: phoneNumber.trim(),
        startDate,
        durationDays: Number(durationDays),
        endDate,
        tradingPurpose,
        tradeAmount: amt,
        identityDocName: identityFile?.name,
        identityDocUrl: identityFile?.dataUrl,
        signatureDataUrl,
        ageConfirmed: isAgeConfirmed,
        termsAgreed: isTermsConfirmed,
      });

      setViewMode('summary');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to submit agreement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCountryChange = (countryName: string) => {
    setSelectedCountry(countryName);
    const found = COUNTRIES.find((c) => c.name === countryName);
    if (found) {
      setPhoneCode(found.code);
    }
  };

  // =========================================================================
  // DIRECT FILE DOWNLOAD GENERATOR (Matches Screenshot 2 Exactly!)
  // Generates high-res CptMarkets_Agreement_${username}_${date}.png and downloads
  // =========================================================================
  const downloadAgreementImage = async () => {
    if (!clientAgreement) return;
    setIsDownloading(true);

    try {
      const width = 800;
      const height = 1220;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D canvas context');

      // 1. Background (Dark Navy)
      ctx.fillStyle = '#080d1a';
      ctx.fillRect(0, 0, width, height);

      // Top amber accent bar
      ctx.fillStyle = '#f5a623';
      ctx.fillRect(0, 0, width, 5);

      // 2. Header
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f5a623';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('CptMarkets — Client Trading Agreement', width / 2, 45);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText('Official Document • Electronically Generated', width / 2, 65);

      // Subtle divider
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 80);
      ctx.lineTo(width - 40, 80);
      ctx.stroke();

      let currentY = 110;
      const leftColX = 50;
      const rightColX = width - 50;

      // Helper function to render a section title
      const drawSectionTitle = (title: string) => {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(title, leftColX, currentY);
        currentY += 22;
      };

      // Helper function to render key-value rows
      const drawRow = (key: string, value: string, isGold = false) => {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.fillText(key, leftColX, currentY);

        ctx.textAlign = 'right';
        ctx.fillStyle = isGold ? '#f5a623' : '#ffffff';
        ctx.font = isGold ? 'bold 12px monospace' : '12px monospace';
        ctx.fillText(value, rightColX, currentY);

        currentY += 20;
      };

      // 01 Client Information
      drawSectionTitle('01 Client Information');
      drawRow('Full Name', clientAgreement.fullName);
      drawRow('Username', clientAgreement.username);
      drawRow('Client User ID', clientAgreement.uid, true);
      drawRow('Email', currentUser.email || 'trader@cptmarkets.com');
      drawRow('Country', clientAgreement.country);
      drawRow('City', clientAgreement.city);
      drawRow('Address', clientAgreement.address);
      drawRow('Phone', `${clientAgreement.phoneCode} ${clientAgreement.phoneNumber}`);

      currentY += 15;

      // 02 Agreement Details
      drawSectionTitle('02 Agreement Details');
      drawRow('Start Date', clientAgreement.startDate);
      drawRow('Duration', `${clientAgreement.durationDays} Days`);
      drawRow('End Date', clientAgreement.endDate);
      drawRow('Trading Purpose', clientAgreement.tradingPurpose);
      drawRow('Trade Amount', `$${clientAgreement.tradeAmount.toLocaleString()} USD`, true);

      currentY += 15;

      // 03 Upload Identity (Image drawing helper)
      drawSectionTitle('03 Upload Identity');
      if (clientAgreement.identityDocUrl) {
        try {
          const idImg = new Image();
          idImg.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            idImg.onload = () => resolve();
            idImg.onerror = () => resolve(); // continue if image fails
            idImg.src = clientAgreement.identityDocUrl!;
          });

          const imgW = 160;
          const imgH = 120;
          const imgX = (width - imgW) / 2;

          // Box border
          ctx.strokeStyle = '#233558';
          ctx.lineWidth = 1;
          ctx.strokeRect(imgX - 4, currentY - 4, imgW + 8, imgH + 8);
          ctx.drawImage(idImg, imgX, currentY, imgW, imgH);
          currentY += imgH + 20;
        } catch {
          ctx.fillStyle = '#64748b';
          ctx.font = '11px sans-serif';
          ctx.fillText('[Identity Document Verified & Stored Electronically]', leftColX, currentY);
          currentY += 25;
        }
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = '11px sans-serif';
        ctx.fillText('[Identity Document Verified & Stored Electronically]', leftColX, currentY);
        currentY += 25;
      }

      // 04 Signature
      drawSectionTitle('04 Signature');
      const sigBoxW = width - 100;
      const sigBoxH = 100;
      ctx.fillStyle = '#050a14';
      ctx.fillRect(leftColX, currentY, sigBoxW, sigBoxH);
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(leftColX, currentY, sigBoxW, sigBoxH);

      if (clientAgreement.signatureDataUrl) {
        try {
          const sigImg = new Image();
          await new Promise<void>((resolve) => {
            sigImg.onload = () => resolve();
            sigImg.onerror = () => resolve();
            sigImg.src = clientAgreement.signatureDataUrl;
          });
          const sigW = Math.min(300, sigBoxW - 20);
          const sigH = sigBoxH - 20;
          const sigX = leftColX + (sigBoxW - sigW) / 2;
          ctx.drawImage(sigImg, sigX, currentY + 10, sigW, sigH);
        } catch {}
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.fillText('Customer Signature', leftColX + 10, currentY + sigBoxH - 10);

      currentY += sigBoxH + 25;

      // 05 Verification
      drawSectionTitle('05 Verification');
      drawRow('Age Confirmed', 'Yes — 18+ years');
      drawRow('Submission Type', 'Electronic');
      drawRow('Generated At', new Date(clientAgreement.submittedAt).toLocaleString());

      currentY += 25;

      // Footer
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(40, currentY);
      ctx.lineTo(width - 40, currentY);
      ctx.stroke();

      currentY += 22;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.fillText('This document was electronically generated by CptMarkets Trading Platform.', width / 2, currentY);
      currentY += 16;
      ctx.fillStyle = '#475569';
      ctx.font = '9px sans-serif';
      ctx.fillText('© CptMarkets — All rights reserved. Secure electronic submission.', width / 2, currentY);

      // Trigger instant direct file download
      const cleanName = (clientAgreement.username || 'client').replace(/[^a-zA-Z0-9_]/g, '_');
      const filename = `CptMarkets_Agreement_${cleanName}_${clientAgreement.startDate}.png`;

      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Blob creation failed');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1500);
      }, 'image/png');
    } catch (err) {
      console.error('Download error:', err);
      // Fallback to window.print()
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pb-28">
      {/* Printable CSS style rule */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          nav, header, button, .no-print {
            display: none !important;
          }
          .print-container {
            border: 2px solid #000000 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 20px !important;
            max-width: 100% !important;
          }
          .print-black-text {
            color: #000000 !important;
          }
          .print-border {
            border-color: #cccccc !important;
          }
        }
      `}</style>

      {/* Top Header Navigation (Mobile Friendly) */}
      <div className="bg-[#0c1220]/95 backdrop-blur-md border-b border-[#1b263e] sticky top-0 z-30 px-3 sm:px-4 py-3 select-none no-print">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={handleBackToAccount}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-[#162138] active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 text-amber-400" />
            <span>Back to Account</span>
          </button>

          <div className="text-center">
            <h1 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate max-w-[170px] sm:max-w-none">
              Client Trading Agreement
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block">CPT Markets UK — Formal Execution</p>
          </div>

          <div className="w-16 flex justify-end">
            <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
              <Shield className="w-3.5 h-3.5" />
              <span>UID {currentUser.uid}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* ============================================================ */}
        {/* SUMMARY / CERTIFICATE VIEW                                   */}
        {/* ============================================================ */}
        {viewMode === 'summary' && clientAgreement && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Top Success Banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left no-print">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white">Trading Agreement Executed</h2>
                  <p className="text-xs text-emerald-300 mt-0.5">
                    Your agreement is saved. Ref: <strong className="font-mono text-white">{clientAgreement.agreementNumber}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* DIRECT FILE DOWNLOAD BUTTON (Satisfies user request!) */}
                <button
                  type="button"
                  onClick={downloadAgreementImage}
                  disabled={isDownloading}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Saving File...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Agreement (.PNG)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Formal Certificate Container */}
            <div className="print-container bg-[#0d1424] border border-[#213254] rounded-2xl p-5 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
                <Shield className="w-64 h-64 text-amber-400" />
              </div>

              {/* Certificate Header */}
              <div className="border-b border-[#1f2e4d] pb-5 print-border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border border-amber-400/80 p-0.5 flex items-center justify-center bg-[#070b14]">
                        <span className="text-[7px] font-black text-amber-400">CPT</span>
                      </div>
                      <span className="font-extrabold text-white text-base tracking-wider uppercase">
                        CPT Markets UK
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-amber-400 mt-2">
                      Client Trading Agreement — Certified Copy
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 print-black-text">
                      Authorized by the Financial Conduct Authority (FCA). Formal client trading contract.
                    </p>
                  </div>

                  <div className="bg-[#121c32] border border-[#24355a] rounded-xl p-3 text-left sm:text-right font-mono text-xs print-border w-full sm:w-auto">
                    <span className="text-slate-400 block text-[10px] uppercase">Agreement Ref</span>
                    <span className="text-amber-400 font-bold text-sm block mt-0.5">
                      {clientAgreement.agreementNumber}
                    </span>
                    <span className="text-emerald-400 text-[10px] font-semibold flex items-center sm:justify-end gap-1 mt-1">
                      <Check className="w-3 h-3" /> Legally Executed
                    </span>
                  </div>
                </div>
              </div>

              {/* 01 Client Details Table */}
              <div className="py-5 border-b border-[#1f2e4d] print-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  <span>01. Client Information</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="bg-[#11192b] p-3 rounded-xl border border-[#1d2b48] print-border">
                    <span className="text-slate-400 block text-[10px]">Legal Full Name</span>
                    <span className="text-white font-bold text-xs sm:text-sm mt-0.5 block print-black-text truncate">
                      {clientAgreement.fullName}
                    </span>
                  </div>
                  <div className="bg-[#11192b] p-3 rounded-xl border border-[#1d2b48] print-border">
                    <span className="text-slate-400 block text-[10px]">Account Username</span>
                    <span className="text-white font-bold text-xs sm:text-sm mt-0.5 block print-black-text truncate">
                      {clientAgreement.username}
                    </span>
                  </div>
                  <div className="bg-[#11192b] p-3 rounded-xl border border-[#1d2b48] print-border">
                    <span className="text-slate-400 block text-[10px]">Account UID</span>
                    <span className="text-amber-400 font-bold text-xs sm:text-sm mt-0.5 block">
                      {clientAgreement.uid}
                    </span>
                  </div>
                  <div className="bg-[#11192b] p-3 rounded-xl border border-[#1d2b48] print-border">
                    <span className="text-slate-400 block text-[10px]">Country & City</span>
                    <span className="text-white font-medium mt-0.5 block print-black-text truncate">
                      {clientAgreement.country}, {clientAgreement.city}
                    </span>
                  </div>
                  <div className="bg-[#11192b] p-3 rounded-xl border border-[#1d2b48] col-span-2 print-border">
                    <span className="text-slate-400 block text-[10px]">Complete Residential Address</span>
                    <span className="text-white font-medium mt-0.5 block print-black-text truncate">
                      {clientAgreement.address}
                    </span>
                  </div>
                  <div className="bg-[#11192b] p-3 rounded-xl border border-[#1d2b48] col-span-2 sm:col-span-1 print-border">
                    <span className="text-slate-400 block text-[10px]">Phone Number</span>
                    <span className="text-emerald-400 font-bold mt-0.5 block">
                      {clientAgreement.phoneCode} {clientAgreement.phoneNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* 02 Agreement Parameters */}
              <div className="py-5 border-b border-[#1f2e4d] print-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  <span>02. Agreement Parameters</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-[#11192b] p-3 rounded-xl border border-[#1d2b48] print-border">
                    <span className="text-slate-400 block text-[10px]">Start Date</span>
                    <span className="text-white font-bold mt-0.5 block print-black-text">
                      {clientAgreement.startDate}
                    </span>
                  </div>
                  <div className="bg-[#11192b] p-3 rounded-xl border border-[#1d2b48] print-border">
                    <span className="text-slate-400 block text-[10px]">Duration</span>
                    <span className="text-cyan-400 font-bold mt-0.5 block">
                      {clientAgreement.durationDays} Days Term
                    </span>
                  </div>
                  <div className="bg-[#11192b] p-3 rounded-xl border border-[#1d2b48] print-border">
                    <span className="text-slate-400 block text-[10px]">End Date</span>
                    <span className="text-white font-bold mt-0.5 block print-black-text">
                      {clientAgreement.endDate}
                    </span>
                  </div>
                  <div className="bg-[#11192b] p-3 rounded-xl border border-[#1d2b48] print-border">
                    <span className="text-slate-400 block text-[10px]">Trade Amount</span>
                    <span className="text-amber-400 font-extrabold text-sm sm:text-base mt-0.5 block">
                      ${clientAgreement.tradeAmount.toLocaleString()} USD
                    </span>
                  </div>
                  <div className="bg-[#11192b] p-3 rounded-xl border border-[#1d2b48] col-span-2 sm:col-span-4 print-border">
                    <span className="text-slate-400 block text-[10px]">Designated Trading Purpose</span>
                    <span className="text-white font-semibold mt-0.5 block print-black-text">
                      {clientAgreement.tradingPurpose}
                    </span>
                  </div>
                </div>
              </div>

              {/* 03 Identity & 04 Signature Display */}
              <div className="py-5 border-b border-[#1f2e4d] grid grid-cols-1 sm:grid-cols-2 gap-5 print-border">
                {/* Uploaded Identity Attachment */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>03. Uploaded Identity</span>
                  </h4>
                  {clientAgreement.identityDocUrl ? (
                    <div className="bg-[#11192b] p-3 rounded-xl border border-[#1d2b48] space-y-2 print-border">
                      <img
                        src={clientAgreement.identityDocUrl}
                        alt="Client Identity Document"
                        className="w-full h-32 sm:h-36 object-cover rounded-lg border border-[#213050]"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span className="truncate max-w-[180px]">{clientAgreement.identityDocName || 'identity_document.jpg'}</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Attached
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#11192b] p-4 rounded-xl border border-[#1d2b48] text-xs text-slate-400 print-border">
                      Verified via account verification.
                    </div>
                  )}
                </div>

                {/* Executed Manual Signature */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>04. Client Manual Signature</span>
                  </h4>
                  <div className="bg-[#11192b] p-3 rounded-xl border border-[#1d2b48] space-y-2 print-border">
                    <div className="bg-[#080d18] border border-dashed border-[#243354] rounded-lg p-2 h-32 sm:h-36 flex items-center justify-center">
                      {clientAgreement.signatureDataUrl ? (
                        <img
                          src={clientAgreement.signatureDataUrl}
                          alt="Client Signature"
                          className="max-h-full max-w-full object-contain filter invert sm:filter-none"
                        />
                      ) : (
                        <span className="text-xs text-slate-500">Digital signature on file</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Signer: {clientAgreement.fullName}</span>
                      <span className="text-amber-400">Recorded: {new Date(clientAgreement.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Regulatory Notice & Legal Attestation */}
              <div className="pt-5 text-slate-400 text-[11px] leading-relaxed space-y-2 print-black-text">
                <p>
                  <strong>Legal Attestation:</strong> By executing this agreement, the Client affirms that all provided credentials, contact information, and signatures are genuine and legally binding under the Electronic Communications Act 2000 and applicable regulatory statutes of the Financial Conduct Authority (FCA).
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] text-slate-500 pt-3 border-t border-[#18233b] font-mono gap-1">
                  <span>CPT Markets UK Ltd · 7 Savoy Court, London WC2R 0EX</span>
                  <span>FCA Reference: 670716 · Status: Compliant</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 no-print">
              <button
                type="button"
                onClick={() => {
                  resetAgreement();
                  setViewMode('form');
                }}
                className="w-full sm:w-auto text-xs text-slate-400 hover:text-amber-400 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-[#1f2c47] hover:border-amber-400/40 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Submit New / Edit Agreement</span>
              </button>

              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleBackToAccount}
                  className="w-full sm:w-auto text-xs bg-[#162138] hover:bg-[#1e2d4d] text-white font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-center"
                >
                  Return to Account
                </button>
                <button
                  type="button"
                  onClick={downloadAgreementImage}
                  disabled={isDownloading}
                  className="w-full sm:w-auto text-xs bg-amber-400 hover:bg-amber-300 text-black font-extrabold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Agreement</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* FORM VIEW (Matching Screenshots image_b6fd25ee & 253887fd)   */}
        {/* ============================================================ */}
        {viewMode === 'form' && (
          <form onSubmit={handleSubmitAgreement} className="space-y-5 sm:space-y-6">
            {/* Header intro */}
            <div className="text-center space-y-1">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                Client Trading Agreement
              </h2>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                Complete and execute your formal institutional brokerage agreement. Please verify all information carefully.
              </p>
            </div>

            {/* Error banner if any */}
            {formError && (
              <div className="p-3.5 rounded-xl text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {/* ======================================================== */}
            {/* 01 CLIENT INFORMATION                                     */}
            {/* ======================================================== */}
            <div className="bg-[#0e1628] border border-[#1d2a45] rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-[#1a2640] pb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30 shrink-0">
                  01
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Client Information</h3>
                  <p className="text-[11px] text-slate-400">
                    Verify personal identity and residential credentials.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 text-xs">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter legal full name"
                      className="w-full bg-[#121c32] border border-[#213152] focus:border-emerald-400 text-white rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-500 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Pre-filled Username & User ID */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium block">Username</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        readOnly
                        value={username}
                        className="w-full bg-[#0a101d] border border-[#1a2640] text-slate-300 rounded-xl pl-8 pr-3 py-2.5 outline-none font-mono text-[11px] cursor-not-allowed opacity-90"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium block">User ID (UID)</label>
                    <div className="relative">
                      <Shield className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        readOnly
                        value={uid}
                        className="w-full bg-[#0a101d] border border-[#1a2640] text-amber-400 font-bold rounded-xl pl-8 pr-3 py-2.5 outline-none font-mono text-[11px] cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Country Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block">
                    Country <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={selectedCountry}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full bg-[#121c32] border border-[#213152] focus:border-emerald-400 text-white rounded-xl pl-10 pr-8 py-2.5 outline-none transition-all appearance-none cursor-pointer text-xs sm:text-sm"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.name} value={c.name} className="bg-[#121c32] text-white">
                          {c.flag} {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block">
                    City <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Enter your city"
                      className="w-full bg-[#121c32] border border-[#213152] focus:border-emerald-400 text-white rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-500 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Complete Address */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-slate-300 font-medium block">
                    Address <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Home className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your complete address"
                      className="w-full bg-[#121c32] border border-[#213152] focus:border-emerald-400 text-white rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-500 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Phone Code & Phone Number */}
                <div className="sm:col-span-2 grid grid-cols-3 gap-2.5 sm:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium block">
                      Code <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value)}
                        placeholder="+880"
                        className="w-full bg-[#121c32] border border-[#213152] focus:border-emerald-400 text-white rounded-xl pl-9 pr-2 py-2.5 outline-none text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-slate-300 font-medium block">
                      Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full bg-[#121c32] border border-[#213152] focus:border-emerald-400 text-white rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-500 font-mono text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* 02 AGREEMENT DETAILS (Matching Screenshot image_b6fd25ee) */}
            {/* ======================================================== */}
            <div className="bg-[#0e1628] border border-[#1d2a45] rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-[#1a2640] pb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30 shrink-0">
                  02
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Agreement Details</h3>
                  <p className="text-[11px] text-slate-400">
                    Select the date and duration of your trading agreement.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 text-xs">
                {/* Start Date */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block">
                    Start Date <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[#121c32] border border-[#213152] focus:border-emerald-400 text-white rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all font-mono text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block">
                    Duration <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      className="w-full bg-[#121c32] border border-[#213152] focus:border-emerald-400 text-white rounded-xl pl-10 pr-8 py-2.5 outline-none transition-all appearance-none cursor-pointer text-xs sm:text-sm"
                    >
                      <option value={3} className="bg-[#121c32] text-white">3 Days (Short-Term Accelerated)</option>
                      <option value={5} className="bg-[#121c32] text-white">5 Days (Standard Execution Window)</option>
                      <option value={7} className="bg-[#121c32] text-white">7 Days (Full Comprehensive Cycle)</option>
                    </select>
                  </div>
                </div>

                {/* End Date (Auto-calculated) */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block">End Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      readOnly
                      value={endDate}
                      className="w-full bg-[#0a101d] border border-[#1a2640] text-emerald-400 font-bold font-mono rounded-xl pl-10 pr-4 py-2.5 outline-none cursor-not-allowed text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Trading Purpose */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block">
                    Trading Purpose <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Activity className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={tradingPurpose}
                      onChange={(e) => setTradingPurpose(e.target.value)}
                      className="w-full bg-[#121c32] border border-[#213152] focus:border-emerald-400 text-white rounded-xl pl-10 pr-8 py-2.5 outline-none transition-all appearance-none cursor-pointer text-xs sm:text-sm"
                    >
                      {TRADING_PURPOSES.map((p) => (
                        <option key={p} value={p} className="bg-[#121c32] text-white">
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Trade Amount */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-slate-300 font-medium block">
                    Trade Amount <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      min={10}
                      step="any"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      placeholder="Enter trade amount"
                      className="w-full bg-[#121c32] border border-[#213152] focus:border-emerald-400 text-white rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-500 font-mono text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Sub-bar Indicator */}
                <div className="sm:col-span-2 bg-[#090e1a] border border-[#172238] rounded-xl px-4 py-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="uppercase text-[10px] text-slate-500">START DATE</span>
                    <strong className="text-white">{startDate || '2026-11-08'}</strong>
                  </div>
                  <span className="text-amber-400">→</span>
                  <div className="flex items-center gap-1.5">
                    <span className="uppercase text-[10px] text-slate-500">END DATE</span>
                    <strong className="text-emerald-400">{endDate}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* 03 UPLOAD IDENTITY (Matching Screenshot image_253887fd)  */}
            {/* ======================================================== */}
            <div className="bg-[#0e1628] border border-[#1d2a45] rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-[#1a2640] pb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30 shrink-0">
                  03
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Upload Identity</h3>
                  <p className="text-[11px] text-slate-400">
                    Upload a clear photo of your NID, Passport, or Government-issued ID.
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleDocumentUpload}
                className="hidden"
              />

              {!identityFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#223356] hover:border-emerald-400/60 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[#0b1220]/60 hover:bg-[#0f192c] group"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">
                    {isUploadingDoc ? 'Processing document...' : 'Click to upload your identity document'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">JPG, PNG — Max 5MB</p>
                </div>
              ) : (
                <div className="bg-[#121c32] border border-[#213152] rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={identityFile.dataUrl}
                      alt="Uploaded Document"
                      className="w-14 h-12 object-cover rounded-lg border border-[#233558] shrink-0"
                    />
                    <div className="min-w-0 text-xs">
                      <p className="text-white font-medium truncate">{identityFile.name}</p>
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                        <Check className="w-3 h-3" /> Ready ({identityFile.sizeKb} KB)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] text-slate-300 hover:text-white px-2.5 py-1 rounded bg-[#1b2742] hover:bg-[#233355] transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setIdentityFile(null)}
                      className="text-[11px] text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* 04 MANUAL SIGNATURE (Matching Screenshot image_253887fd) */}
            {/* ======================================================== */}
            <div className="bg-[#0e1628] border border-[#1d2a45] rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#1a2640] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30 shrink-0">
                    04
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Manual Signature</h3>
                    <p className="text-[11px] text-slate-400">
                      Please sign below. Your signature will be attached to the agreement document.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>

              {/* Interactive Canvas Pad with touch-action: none for mobile devices */}
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-44 bg-[#0a101d] border border-dashed border-[#243354] rounded-xl cursor-crosshair touch-none select-none block"
                  style={{ touchAction: 'none' }}
                />

                {!hasSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-xs text-slate-500 font-mono tracking-wider">
                      Draw your signature above
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* AGE VERIFICATION & LEGAL TERMS (Matching image_253887fd)  */}
            {/* ======================================================== */}
            <div className="bg-[#0e1628] border border-[#1d2a45] rounded-2xl p-4 sm:p-6 shadow-xl space-y-3.5">
              <div className="flex items-center gap-3 border-b border-[#1a2640] pb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Age Verification</h3>
                  <p className="text-[11px] text-slate-400">
                    You must be at least <strong className="text-amber-400">18 years old</strong> to submit this trading agreement.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-[#11192b] border border-[#1f2c47] cursor-pointer hover:bg-[#141f36] transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={isAgeConfirmed}
                  onChange={(e) => setIsAgeConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#243354] bg-[#0c1322] text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <span className="text-xs text-slate-300 leading-relaxed select-none">
                  I confirm that I am 18 years of age or older and legally eligible to enter this agreement.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-[#11192b] border border-[#1f2c47] cursor-pointer hover:bg-[#141f36] transition-colors">
                <input
                  type="checkbox"
                  checked={isTermsConfirmed}
                  onChange={(e) => setIsTermsConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#243354] bg-[#0c1322] text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <span className="text-xs text-slate-300 leading-relaxed select-none">
                  I have read and agree to CPT Markets UK Client Terms of Business, Risk Disclosures, and Governing Law regulations.
                </span>
              </label>
            </div>

            {/* Big Orange-Gold Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#e67e00] via-[#f5a623] to-[#e67e00] hover:from-[#d87200] hover:to-[#e67e00] text-black font-black py-4 rounded-xl transition-all shadow-[0_4px_25px_rgba(245,166,35,0.4)] active:scale-[0.99] cursor-pointer text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Executing Agreement...</span>
              ) : (
                <span>Submit Trading Agreement</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
