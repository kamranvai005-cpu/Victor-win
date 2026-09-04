import { Dices, X, Sparkles, ArrowRight } from 'lucide-react';
import { sound } from '../utils/audio';

interface GameRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToLottery: () => void;
  onGoToAviator?: () => void;
}

export function GameRestrictionModal({
  isOpen,
  onClose,
  onGoToLottery,
}: GameRestrictionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#060e22] border-2 border-amber-500/60 p-6 sm:p-7 shadow-[0_0_60px_rgba(245,158,11,0.35)] space-y-5 text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Glow */}
        <div className="flex justify-center pt-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-xl shadow-amber-500/25">
            <div className="w-full h-full bg-[#060e22] rounded-[22px] flex items-center justify-center text-amber-400">
              <Dices className="w-8 h-8 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>সিস্টেম পরামর্শ নোটিশ</span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white font-display leading-snug">
            বর্তমানে এইগুলোতে না খেলে লটারিতে খেলাই ভালো
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            সর্বোচ্চ উইনিং রেট ও তাৎক্ষণিক উইথড্র পেতে সরাসরি লটারিতে (Win Go) অংশগ্রহণ করুন!
          </p>
        </div>

        {/* Single CTA Action */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
              onGoToLottery();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-950/60 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <Dices className="w-5 h-5" />
            <span>লটারি খেলুন (Play Lottery Win Go)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
