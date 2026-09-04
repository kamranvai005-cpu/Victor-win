import React from 'react';
import {
  Download,
  Smartphone,
  Sparkles,
  CheckCircle2,
  X,
  QrCode,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface AppDownloadModalProps {
  onClose: () => void;
}

export function AppDownloadModal({ onClose }: AppDownloadModalProps) {
  const handleDownloadApk = () => {
    sound.playClick();
    // Simulate APK download
    const link = document.createElement('a');
    link.href = '#';
    link.download = 'HGNICE_Official_v2.4.0.apk';
    alert('HGNICE Official Android App APK download started! (v2.4.0, 18.4MB)');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#060e22] border border-blue-500/40 p-5 sm:p-6 shadow-[0_0_50px_rgba(56,189,248,0.25)] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 p-0.5 shadow-md">
              <div className="w-full h-full bg-[#08122c] rounded-[10px] flex items-center justify-center text-sky-300 font-black font-display text-sm">
                HG
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white font-display flex items-center gap-1.5">
                <span>Download HGNICE App</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
                  +৳58 FREE
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Smooth 120FPS • Zero Lag • Ultra Fast Withdrawals
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

        {/* Benefits Banner */}
        <div className="p-3.5 rounded-2xl bg-[#08122c] border border-blue-500/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Exclusive App Member Rewards:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>৳58 Free Install Bonus</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Instant Push Alerts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Anti-Blocking Domain</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>24/7 VIP Speed Lane</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Android APK Download */}
          <button
            type="button"
            id="download-android-apk-btn"
            onClick={handleDownloadApk}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:brightness-110 text-white font-black text-sm shadow-xl shadow-blue-900/50 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD ANDROID APK (v2.4.0)</span>
          </button>

          {/* iOS WebApp PWA */}
          <div className="p-3 rounded-xl bg-[#0a1634] border border-blue-500/20 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-300 font-bold">
              <span>🍎 Apple iOS iPhone / iPad:</span>
              <span className="text-[10px] text-sky-400">PWA WebApp</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Tap <span className="text-white font-bold">Share (📤)</span> in Safari, then select <span className="text-white font-bold">"Add to Home Screen"</span> for fullscreen app experience!
            </p>
          </div>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Virus-Free • Verified by Google Play Protect & App Store</span>
        </div>
      </div>
    </div>
  );
}
