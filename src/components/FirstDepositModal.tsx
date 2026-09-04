import React from 'react';
import { Gift, Sparkles, X, ChevronRight, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { FirstDepositBonusConfig } from '../utils/firebase';
import { sound } from '../utils/audio';

interface FirstDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeposit: () => void;
  config?: FirstDepositBonusConfig;
  userName?: string;
}

export function FirstDepositModal({
  isOpen,
  onClose,
  onOpenDeposit,
  config,
  userName,
}: FirstDepositModalProps) {
  if (!isOpen) return null;

  const bonusPercent = config?.bonusPercent || 100;
  const maxBonus = config?.maxBonusAmount || 20000;
  const minDeposit = config?.minDepositAmount || 200;
  const title = config?.title || '🎉 প্রথম ডিপোজিটে ১০০% ওয়েলকাম ক্যাশ বোনাস!';
  const description =
    config?.description ||
    'বিকাশ, নগদ বা রকেটে প্রথমবার রিচার্জ করলেই পেয়ে যাবেন দ্বিগুণ ব্যালেন্স ও ইনস্ট্যান্ট গিফট ভাউচার!';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#180d35] via-[#0d163a] to-[#060c20] border-2 border-amber-400/70 p-5 sm:p-6 shadow-2xl overflow-hidden my-auto text-center space-y-4">
        
        {/* Glow backdrop accent */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/25 blur-3xl rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer z-10 border border-slate-700"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Ribbon / Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/30 to-yellow-500/30 border border-amber-400/60 text-amber-300 text-xs font-black uppercase tracking-wider font-mono">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
          <span>NEW PLAYER EXCLUSIVE WELCOME BONUS</span>
        </div>

        {/* Gift Box / Banner Artwork */}
        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-1 shadow-xl shadow-amber-500/20 animate-bounce">
          <div className="w-full h-full rounded-[22px] bg-[#0c1228] flex items-center justify-center">
            <Gift className="w-12 h-12 sm:w-14 sm:h-14 text-amber-400 drop-shadow" />
          </div>
          <div className="absolute -bottom-2 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full shadow border border-amber-300/50">
            +{bonusPercent}% বোনাস
          </div>
        </div>

        {/* Title & Personalized Greeting */}
        <div className="space-y-1">
          {userName && (
            <p className="text-xs text-amber-300 font-bold">
              অভিনন্দন, <span className="underline">{userName}</span>!
            </p>
          )}
          <h2 className="text-lg sm:text-xl font-black text-white font-display">
            {title}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-sm mx-auto">
            {description}
          </p>
        </div>

        {/* Bonus Tier Value Cards */}
        <div className="grid grid-cols-3 gap-2 bg-[#050a18] p-3 rounded-2xl border border-blue-500/30">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-bold">ডিপোজিট</span>
            <span className="text-xs sm:text-sm font-black text-white font-mono">৳500</span>
            <span className="text-[10px] text-emerald-400 font-bold block">+৳500 ফ্রি</span>
          </div>
          <div className="space-y-0.5 border-x border-blue-900/60">
            <span className="text-[10px] text-slate-400 block font-bold">ডিপোজিট</span>
            <span className="text-xs sm:text-sm font-black text-amber-300 font-mono">৳1,000</span>
            <span className="text-[10px] text-emerald-400 font-bold block">+৳1,000 ফ্রি</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-bold">ডিপোজিট</span>
            <span className="text-xs sm:text-sm font-black text-yellow-300 font-mono">৳5,000</span>
            <span className="text-[10px] text-emerald-400 font-bold block">+৳5,000 ফ্রি</span>
          </div>
        </div>

        {/* Feature Checkpoints */}
        <div className="space-y-1.5 text-left text-xs text-slate-300 bg-[#08122a] p-3 rounded-2xl border border-blue-500/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>সর্বনিম্ন ডিপোজিট মাত্র <b>৳{minDeposit}</b></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>সর্বোচ্চ বোনাস রিওয়ার্ড <b>৳{maxBonus.toLocaleString('en-US')}</b> পর্যন্ত</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>অটো-ক্রেডিট: ডিপোজিট অ্যাপ্রুভালের সাথে সাথেই যুক্ত হবে</span>
          </div>
        </div>

        {/* Action Button: Claim & Open Deposit Flow */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={() => {
              sound.playWin();
              onClose();
              onOpenDeposit();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer border border-amber-300"
          >
            <span>এখনই ডিপোজিট করে বোনাস ক্লেইম করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            পরে ডিপোজিট করব
          </button>
        </div>
      </div>
    </div>
  );
}
