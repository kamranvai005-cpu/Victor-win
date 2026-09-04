import React, { useEffect, useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export function SplashScreen({ onComplete, durationMs = 2600 }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fadeState, setFadeState] = useState<'entering' | 'loading' | 'exiting'>('entering');

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / durationMs) * 100));
      setProgress(pct);

      if (elapsed >= durationMs - 400 && fadeState !== 'exiting') {
        setFadeState('exiting');
      }

      if (elapsed >= durationMs) {
        clearInterval(interval);
        onComplete();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [durationMs, onComplete, fadeState]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between bg-gradient-to-b from-[#060d21] via-[#040918] to-[#02050e] text-white p-6 transition-opacity duration-500 select-none ${
        fadeState === 'exiting' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Ambience Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/20 rounded-full blur-[90px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-[80px] pointer-events-none" />

      {/* Top Spacer */}
      <div className="w-full flex justify-end pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-[11px] font-mono text-sky-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SSL 256-BIT SECURE</span>
        </div>
      </div>

      {/* Center Brand Identity */}
      <div className="flex flex-col items-center text-center space-y-4 my-auto relative z-10">
        <div className="p-2 rounded-3xl bg-gradient-to-b from-blue-900/40 to-transparent border border-blue-400/30 shadow-[0_0_50px_rgba(59,130,246,0.3)] animate-in zoom-in-90 duration-700">
          <BrandLogo size="lg" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 font-bold text-xs tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>AUTHENTIC PREDICTION & GAMING PLATFORM</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
            লটারি ও এভিয়েটর গ্লোবাল মার্কেট
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            লাইভ রিয়েলটাইম রেজাল্ট • তাৎক্ষণিক ডিপোজিট ও উইথড্র
          </p>
        </div>
      </div>

      {/* Bottom Progress Bar & Loading Indicator */}
      <div className="w-full max-w-xs space-y-3 pb-6 relative z-10">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
          <span className="text-sky-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            সার্ভার কানেক্ট হচ্ছে...
          </span>
          <span className="text-amber-400 font-black">{progress}%</span>
        </div>

        {/* Outer Bar */}
        <div className="w-full h-2 rounded-full bg-slate-900 border border-blue-500/30 overflow-hidden p-0.5 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 via-amber-400 to-yellow-300 transition-all duration-75 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="text-center text-[10px] text-slate-500 font-mono">
          VERSION 2026.4 • ALL RIGHTS RESERVED
        </div>
      </div>
    </div>
  );
}
