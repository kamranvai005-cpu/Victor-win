import { useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  CreditCard,
  CheckCircle2,
  X,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

interface WalletNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletSaved: (wallet: {
    method: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank';
    accountNumber: string;
    accountName: string;
    isBound: boolean;
    boundAt: string;
  }) => void;
  defaultPhone?: string;
  defaultName?: string;
  currentWallet?: any;
  userName?: string;
  intent?: 'deposit' | 'withdraw';
}

export function WalletNoticeModal({
  isOpen,
  onClose,
  onWalletSaved,
  defaultPhone = '',
  defaultName = '',
  currentWallet,
  userName = '',
  intent = 'deposit',
}: WalletNoticeModalProps) {
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank'>(
    currentWallet?.method || 'bkash'
  );
  const [accountNumber, setAccountNumber] = useState<string>(
    currentWallet?.accountNumber || defaultPhone.replace(/\D/g, '') || ''
  );
  const [accountName, setAccountName] = useState<string>(
    currentWallet?.accountName || userName || defaultName || ''
  );
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!accountNumber || accountNumber.length < 10) {
      setError('অনুগ্রহ করে সঠিক মোবাইল ওয়ালেট নম্বর লিখুন (ন্যূনতম ১০ ডিজিট)');
      sound.playLose();
      return;
    }
    if (!accountName.trim()) {
      setError('অনুগ্রহ করে ওয়ালেট হোল্ডারের পুরো নাম লিখুন');
      sound.playLose();
      return;
    }

    setIsSaving(true);
    sound.playChip();

    setTimeout(() => {
      setIsSaving(false);
      sound.playWin();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

      const newWallet = {
        method,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        isBound: true,
        boundAt: new Date().toISOString(),
      };

      onWalletSaved(newWallet);
    }, 600);
  };

  const methodNames: Record<string, { bn: string; color: string; badge: string }> = {
    bkash: { bn: 'বিকাশ (bKash)', color: 'border-pink-500/50 bg-pink-950/30 text-pink-300', badge: 'সবচেয়ে দ্রুত' },
    nagad: { bn: 'নগদ (Nagad)', color: 'border-orange-500/50 bg-orange-950/30 text-orange-300', badge: 'ইনস্ট্যান্ট ক্যাশ' },
    rocket: { bn: 'রকেট (Rocket)', color: 'border-purple-500/50 bg-purple-950/30 text-purple-300', badge: 'সুরক্ষিত' },
    upay: { bn: 'উপায় (Upay)', color: 'border-blue-500/50 bg-blue-950/30 text-blue-300', badge: '২৪/৭ সক্রিয়' },
    bank: { bn: 'ব্যাংক ট্রান্সফার', color: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300', badge: 'লার্জ উইথড্র' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#060e22] border-2 border-amber-500/60 p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.3)] space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Announcement Header */}
        <div className="flex items-center gap-3 border-b border-amber-500/30 pb-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400/60 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-950/50">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-500/40">
              জরুরি নিরাপত্তা অ্যানাউন্সমেন্ট
            </span>
            <h2 className="text-base sm:text-lg font-black text-white font-display mt-0.5">
              উইথড্র ওয়ালেট বাধ্যতামূলক
            </h2>
          </div>
        </div>

        {/* Notice Explanation */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-xs text-amber-200 leading-relaxed">
          <p className="font-bold flex items-center gap-1.5 text-amber-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            ডিপোজিট করার পূর্বে উইথড্র ওয়ালেট সেট করা আবশ্যক!
          </p>
          <p className="text-[11px] text-slate-300">
            আপনার অ্যাকাউন্টের লেনদেনের শতভাগ নিরাপত্তা এবং গেম থেকে জয়ের টাকা সরাসরি আপনার নিজস্ব অ্যাকাউন্টে সুরক্ষিতভাবে পৌঁছানোর জন্য দয়া করে প্রথমে আপনার উইথড্র ওয়ালেট নম্বর ও হোল্ডার নেম যুক্ত করুন।
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Channel selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-bold block">
              ওয়ালেট মেথড নির্বাচন করুন
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['bkash', 'nagad', 'rocket'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setMethod(ch);
                  }}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    method === ch
                      ? 'border-amber-400 bg-amber-500/20 text-white font-black shadow-md'
                      : 'border-blue-500/30 bg-[#060e22] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs block font-bold">{methodNames[ch].bn}</span>
                  <span className="text-[9px] text-amber-300 opacity-90">{methodNames[ch].badge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Account Number */}
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-bold block">
              {methodNames[method].bn} পার্সোনাল নম্বর (Wallet Number)
            </label>
            <input
              type="tel"
              required
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value);
                setError('');
              }}
              placeholder="01XXXXXXXXX"
              className="w-full bg-[#060e22] border border-blue-500/30 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-bold"
            />
          </div>

          {/* Account Holder Name */}
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-bold block">
              অ্যাকাউন্ট হোল্ডারের পূর্ণ নাম (Account Name)
            </label>
            <input
              type="text"
              required
              value={accountName}
              onChange={(e) => {
                setAccountName(e.target.value);
                setError('');
              }}
              placeholder="যেমন: মোঃ সাব্বির আহমেদ"
              className="w-full bg-[#060e22] border border-blue-500/30 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-400 font-bold bg-rose-950/40 p-2 rounded-xl border border-rose-500/40">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            {isSaving ? (
              <span>সংরক্ষণ হচ্ছে...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>ওয়ালেট সেভ করুন ও ডিপোজিট আনলক করুন</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
