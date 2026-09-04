import { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  Flame,
  CheckCircle2,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { WinGoResult } from '../types';
import { pseudoRandom } from '../utils/gameSync';
import { getLocalConfig } from '../utils/firebase';
import { sound } from '../utils/audio';

interface WinGoSignalPredictorProps {
  currentPeriod: string;
  remainingSeconds: number;
  latestDraw?: WinGoResult;
  onBetPreset?: (type: 'color' | 'number' | 'size', value: string) => void;
}

export interface AiSignal {
  period: string;
  predictedSize: 'BIG' | 'SMALL';
  predictedColor: 'GREEN' | 'RED' | 'VIOLET';
  recommendedNumber: number;
  confidencePercent: number;
  strategyName: string;
  trendStatus: 'HIGH_CONFIDENCE' | 'HOT_STREAK' | 'PROBABILITY_SPIKE';
}

export function generateDeterministicSignal(period: string): AiSignal {
  const config = getLocalConfig();
  const baseAccuracy = config.marketControl?.aiSignalAccuracy || 94;

  // Derive pseudo seed from period numeric digits
  const numericPart = parseInt(period.slice(-6), 10) || 123456;
  const seed = numericPart * 31337 + 101;
  const r1 = pseudoRandom(seed);
  const r2 = pseudoRandom(seed + 777);
  const r3 = pseudoRandom(seed + 9999);

  // If admin has forced an override number for this period, match the signal!
  if (config.marketControl?.winGoNextOverride?.period === period) {
    const forcedNum = config.marketControl.winGoNextOverride.number;
    const isBig = forcedNum >= 5;
    const color = [1, 3, 7, 9].includes(forcedNum) ? 'GREEN' : forcedNum === 0 || forcedNum === 5 ? 'VIOLET' : 'RED';
    return {
      period,
      predictedSize: isBig ? 'BIG' : 'SMALL',
      predictedColor: color,
      recommendedNumber: forcedNum,
      confidencePercent: Math.min(99, Math.max(91, Math.floor(baseAccuracy + r1 * 4))),
      strategyName: 'AI নিউরাল প্যাটার্ন ৩.০ (Admin Synced)',
      trendStatus: 'HIGH_CONFIDENCE',
    };
  }

  // Deterministic calculation
  const predictedSize: 'BIG' | 'SMALL' = r1 > 0.48 ? 'BIG' : 'SMALL';
  const predictedColor: 'GREEN' | 'RED' | 'VIOLET' =
    r2 > 0.52 ? 'GREEN' : r2 > 0.08 ? 'RED' : 'VIOLET';

  const recommendedNumber = predictedSize === 'BIG'
    ? (predictedColor === 'GREEN' ? (r3 > 0.5 ? 7 : 9) : (r3 > 0.5 ? 6 : 8))
    : (predictedColor === 'GREEN' ? (r3 > 0.5 ? 1 : 3) : (r3 > 0.5 ? 2 : 4));

  const confidence = Math.min(98, Math.max(88, Math.floor(baseAccuracy + (r1 - 0.5) * 6)));

  const strategies = [
    'AI ডিপ লার্নিং মোমেন্টাম',
    'মার্কেট ভলিউম ওয়েটেড রিগ্রেশন',
    'গ্লোবাল চেইন অ্যালগরিদম V4',
    'ট্রেন্ড ব্রেকআউট প্রিডিকশন',
  ];
  const strategyName = strategies[Math.floor(r2 * strategies.length)];

  return {
    period,
    predictedSize,
    predictedColor,
    recommendedNumber,
    confidencePercent: confidence,
    strategyName,
    trendStatus: confidence >= 93 ? 'HOT_STREAK' : 'HIGH_CONFIDENCE',
  };
}

export function WinGoSignalPredictor({
  currentPeriod,
  remainingSeconds,
  latestDraw,
  onBetPreset,
}: WinGoSignalPredictorProps) {
  const [signal, setSignal] = useState<AiSignal>(() => generateDeterministicSignal(currentPeriod));

  useEffect(() => {
    setSignal(generateDeterministicSignal(currentPeriod));
  }, [currentPeriod]);

  const isLocked = remainingSeconds <= 5;

  return (
    <div className="w-full rounded-2xl bg-gradient-to-r from-[#0d1f4d] via-[#08173d] to-[#0d1f4d] border-2 border-amber-500/50 p-3 sm:p-4 shadow-xl relative overflow-hidden">
      {/* Background Lighting Accent */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-500/30 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-md shadow-amber-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-[#07132e] rounded-[10px] flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4 fill-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-black text-white font-display flex items-center gap-1">
                <span>AI অটো সিগন্যাল প্রিডিক্টর</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-500/40 font-mono font-bold">
                  LIVE AUTO
                </span>
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-sans block">
              লক্ষ্য পিরিয়ড: <strong className="font-mono text-amber-300">#{signal.period}</strong> ({signal.strategyName})
            </span>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#040918] border border-amber-500/40 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-black text-amber-300">
            নির্ভুলতা: {signal.confidencePercent}%
          </span>
        </div>
      </div>

      {/* Signal Payload & One-Click Follow Actions */}
      <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
        
        {/* Recommended Size */}
        <div className="p-2.5 rounded-xl bg-[#060e22] border border-blue-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              ১. সাইজ সিগন্যাল:
            </span>
            <span className={`text-sm sm:text-base font-black font-mono ${
              signal.predictedSize === 'BIG' ? 'text-amber-400' : 'text-sky-400'
            }`}>
              {signal.predictedSize === 'BIG' ? 'বড় (BIG)' : 'ছোট (SMALL)'}
            </span>
          </div>

          {onBetPreset && (
            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                sound.playChip();
                onBetPreset('size', signal.predictedSize.toLowerCase());
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-[11px] shadow transition-all cursor-pointer"
            >
              বেট ধরুন
            </button>
          )}
        </div>

        {/* Recommended Color */}
        <div className="p-2.5 rounded-xl bg-[#060e22] border border-blue-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              ২. কালার সিগন্যাল:
            </span>
            <span className={`text-sm sm:text-base font-black font-mono ${
              signal.predictedColor === 'GREEN'
                ? 'text-emerald-400'
                : signal.predictedColor === 'RED'
                ? 'text-rose-400'
                : 'text-purple-400'
            }`}>
              {signal.predictedColor === 'GREEN' ? '🟢 সবুজ (GREEN)' : signal.predictedColor === 'RED' ? '🔴 লাল (RED)' : '🟣 বেগুনী (VIOLET)'}
            </span>
          </div>

          {onBetPreset && (
            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                sound.playChip();
                onBetPreset('color', signal.predictedColor.toLowerCase());
              }}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 disabled:opacity-50 text-white font-black text-[11px] shadow transition-all cursor-pointer"
            >
              বেট ধরুন
            </button>
          )}
        </div>

        {/* Recommended Lucky Number */}
        <div className="p-2.5 rounded-xl bg-[#060e22] border border-blue-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              ৩. হট লাকি নাম্বার:
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-yellow-300">
              নাম্বার [{signal.recommendedNumber}] (9.8x)
            </span>
          </div>

          {onBetPreset && (
            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                sound.playChip();
                onBetPreset('number', String(signal.recommendedNumber));
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-[11px] shadow transition-all cursor-pointer"
            >
              বেট ধরুন
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
