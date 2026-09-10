import React, { useState } from 'react';
import {
  ShieldCheck,
  Smartphone,
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ChevronRight,
  Key,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { sound } from '../utils/audio';

interface ActiveVerifyModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
}

export function ActiveVerifyModal({
  user,
  onClose,
  onUpdateUser,
}: ActiveVerifyModalProps) {
  const [phoneVerified, setPhoneVerified] = useState(true);
  const [pinSet, setPinSet] = useState(true);
  const [bankLinked, setBankLinked] = useState(true);
  const [kycVerified, setKycVerified] = useState(false);
  const [antiPhishCode, setAntiPhishCode] = useState('VICTOR-SAFE-88');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const securityScore =
    (phoneVerified ? 25 : 0) +
    (pinSet ? 25 : 0) +
    (bankLinked ? 25 : 0) +
    (kycVerified ? 25 : 0);

  const handleVerifyKyc = () => {
    sound.playWin();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    setKycVerified(true);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#060e22] border border-blue-500/40 p-5 sm:p-6 shadow-[0_0_50px_rgba(37,99,235,0.3)] space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-sky-400 flex items-center justify-center text-sky-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white font-display flex items-center gap-1.5">
                <span>Account Security Center</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                  ACTIVE
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Safe Bank-Grade 256-bit Encryption
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Meter Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#11234c] to-[#08122c] border border-blue-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">Security Health Score:</span>
            <span className="font-black font-mono text-emerald-400 text-sm">
              {securityScore}% Protected
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-[#060e22] overflow-hidden border border-blue-950">
            <div
              style={{ width: `${securityScore}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 rounded-full transition-all duration-500"
            />
          </div>

          <p className="text-[11px] text-slate-400 pt-1">
            {securityScore === 100
              ? '✨ Maximum security reached! All withdrawal channels verified.'
              : 'Complete Level-1 KYC to unlock instant withdrawal privileges.'}
          </p>
        </div>

        {showSuccessToast && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>KYC Verification successfully submitted!</span>
          </div>
        )}

        {/* Security Checklist */}
        <div className="space-y-2">
          {/* Item 1: Phone Binding */}
          <div className="p-3 rounded-xl bg-[#08122c] border border-blue-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-sky-400" />
              <div>
                <p className="font-bold text-white">Mobile Number</p>
                <p className="text-[11px] font-mono text-slate-400">{user.phone}</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> Bound
            </span>
          </div>

          {/* Item 2: Withdrawal PIN */}
          <div className="p-3 rounded-xl bg-[#08122c] border border-blue-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-400" />
              <div>
                <p className="font-bold text-white">Withdrawal Fund PIN</p>
                <p className="text-[11px] text-slate-400">Required for cashouts</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> Set (••••)
            </span>
          </div>

          {/* Item 3: Payment Gateway Accounts */}
          <div className="p-3 rounded-xl bg-[#08122c] border border-blue-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <div>
                <p className="font-bold text-white">Payment Wallets</p>
                <p className="text-[11px] text-slate-400">bKash (01799***), Nagad (01844***)</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active
            </span>
          </div>

          {/* Item 4: Real Name / KYC */}
          <div className="p-3 rounded-xl bg-[#08122c] border border-blue-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="font-bold text-white">Real-Name Identification (KYC)</p>
                <p className="text-[11px] text-slate-400">
                  {kycVerified ? 'Kamran Ahmed (Verified)' : 'Pending verification'}
                </p>
              </div>
            </div>
            {kycVerified ? (
              <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            ) : (
              <button
                type="button"
                onClick={handleVerifyKyc}
                className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] shadow-sm cursor-pointer"
              >
                Verify Now
              </button>
            )}
          </div>

          {/* Item 5: Anti-Phishing Security Phrase */}
          <div className="p-3 rounded-xl bg-[#08122c] border border-blue-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Key className="w-4 h-4 text-yellow-400" />
              <div>
                <p className="font-bold text-white">Anti-Phishing Safety Code</p>
                <p className="text-[11px] font-mono text-amber-300">{antiPhishCode}</p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">Guaranteed Safe</span>
          </div>
        </div>

        {/* Done Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/50 cursor-pointer"
        >
          Close Security Center
        </button>
      </div>
    </div>
  );
}
