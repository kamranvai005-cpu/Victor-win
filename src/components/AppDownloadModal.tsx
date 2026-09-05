import { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Sparkles,
  CheckCircle2,
  X,
  ShieldCheck,
  Monitor,
  Share2,
  PlusSquare,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { getLocalConfig, subscribeSystemConfig } from '../utils/firebase';

interface AppDownloadModalProps {
  onClose: () => void;
}

// Global declaration for beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function AppDownloadModal({ onClose }: AppDownloadModalProps) {
  const [downloadUrl, setDownloadUrl] = useState(() => {
    return getLocalConfig().appDownloadUrl || 'https://victor-win.web.app/download/victor-win.apk';
  });
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'apk' | 'pwa'>('apk');
  const [installSuccess, setInstallSuccess] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Listen for PWA prompt
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Sync admin app download url
    const unsub = subscribeSystemConfig((newCfg) => {
      if (newCfg.appDownloadUrl) {
        setDownloadUrl(newCfg.appDownloadUrl);
      }
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      unsub();
    };
  }, []);

  const handleDownloadApk = () => {
    sound.playClick();
    if (downloadUrl) {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleTriggerPwaInstall = async () => {
    sound.playClick();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallSuccess(true);
        sound.playWin();
      }
      setDeferredPrompt(null);
    } else {
      // Switch to instruction tab if automatic prompt not available
      setActiveTab('pwa');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#060e22] border-2 border-blue-500/40 p-5 sm:p-6 shadow-[0_0_50px_rgba(56,189,248,0.25)] space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/30">
              <div className="w-full h-full bg-[#08122c] rounded-[14px] flex items-center justify-center text-amber-300 font-black font-display text-base">
                VW
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white font-display flex items-center gap-2">
                <span>Victor Win অ্যাপ ডাউনলোড</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black">
                  +৳৫৮ ফ্রি
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                স্মুথ ১২০ FPS গেমিং • অ্যান্টি-ব্লকিং সিকিউরিটি • সুপারফাস্ট উইথড্র
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Benefits Banner */}
        <div className="p-3.5 rounded-2xl bg-[#08122c] border border-blue-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>অ্যাপ মেম্বারদের স্পেশাল সুবিধা:</span>
            </span>
            <span className="text-[10px] text-emerald-400">অটো আপডেট সাপোর্টেড</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>৳৫৮ ইনস্টলেশন ফ্রি গিফট</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>রিয়েল-টাইম পুশ নোটিফিকেশন</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>কোনো ভিপিএন প্রয়োজন নেই</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>১-ক্লিকে ফুল স্ক্রিন মোড</span>
            </div>
          </div>
        </div>

        {/* Dual Mode Switcher: Direct APK vs Add to Desktop/Home Screen */}
        <div className="grid grid-cols-2 gap-2 bg-[#060e22] p-1.5 rounded-2xl border border-blue-500/25 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('apk');
            }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'apk'
                ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>১. ডাইরেক্ট APK ডাউনলোড</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('pwa');
            }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>২. অ্যাড টু হোমস্ক্রিন / ডেস্কটপ</span>
          </button>
        </div>

        {/* Tab 1: Direct Android APK */}
        {activeTab === 'apk' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-[#0a1634] border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Victor Win অফিসিয়াল APK (Android)</h4>
                  <p className="text-[11px] text-slate-400">ভার্সন: v2.5.0 • সাইজ: 8.4 MB • সকল অ্যান্ড্রয়েডে সাপোর্টেড</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  ভেরিফাইড
                </span>
              </div>

              <button
                type="button"
                id="download-android-apk-btn"
                onClick={handleDownloadApk}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:brightness-110 text-white font-black text-sm shadow-xl shadow-blue-900/50 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ডাইরেক্ট APK ফাইল ডাউনলোড করুন</span>
              </button>

              <div className="text-[11px] text-slate-400 space-y-1">
                <p className="flex items-center gap-1">
                  <span className="text-amber-400 font-bold">💡 টিপস:</span> ডাউনলোড শেষে ফাইলটি ওপেন করে "Install anyway" বা "অনুমতি দিন" চাপুন।
                </p>
                <p className="text-[10px] text-slate-500 break-all">
                  সরাসরি লিঙ্ক: {downloadUrl}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Add to Desktop / Home Screen (PWA) */}
        {activeTab === 'pwa' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-[#0a1634] border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-amber-400" />
                    <span>অ্যাড টু ডেস্কটপ ও হোম স্ক্রিন (Web App)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    কোনো স্টোরেজ খরচ হবে না • সরাসরি আপনার মোবাইলে বা পিসিতে অ্যাপ আইকন তৈরি হবে
                  </p>
                </div>
              </div>

              {/* Native Prompt button if available */}
              {deferredPrompt ? (
                <button
                  type="button"
                  onClick={handleTriggerPwaInstall}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 font-black text-sm shadow-xl shadow-amber-900/50 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <PlusSquare className="w-4 h-4" />
                  <span>এখনই ১-ক্লিকে হোম স্ক্রিনে যুক্ত করুন</span>
                </button>
              ) : null}

              {installSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs text-center font-bold">
                  ✓ Victor Win সফলভাবে আপনার হোম স্ক্রিনে যুক্ত হয়েছে!
                </div>
              )}

              {/* Step-by-Step Instructions */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-amber-300 block">
                  {isIOS ? '🍎 iPhone / iPad (Safari) নির্দেশিকা:' : '📱 Android Chrome বা Computer (Edge / Chrome) নির্দেশিকা:'}
                </span>

                {isIOS ? (
                  <div className="space-y-2 text-xs text-slate-300 bg-[#060e22] p-3 rounded-xl border border-blue-500/20">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold shrink-0">1</span>
                      <span>Safari ব্রাউজারের নিচে থাকা <strong>Share (📤)</strong> আইকনে চাপুন।</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold shrink-0">2</span>
                      <span>মেনু নিচে স্ক্রল করে <strong>"Add to Home Screen (হোম স্ক্রিনে যোগ করুন)"</strong> অপশনটি বেছে নিন।</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold shrink-0">3</span>
                      <span>উপরে ডানে <strong>"Add"</strong> বাটনে ক্লিক করলেই আপনার ফোনে Victor Win ইনস্টল হয়ে যাবে!</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs text-slate-300 bg-[#060e22] p-3 rounded-xl border border-blue-500/20">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold shrink-0">1</span>
                      <span>ব্রাউজারের উপরে ডানে ৩-ডট মেনু (<strong>⋮</strong>) চাপুন।</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold shrink-0">2</span>
                      <span><strong>"Install app"</strong> বা <strong>"Add to Home screen (হোম স্ক্রিনে যোগ করুন)"</strong> সিলেক্ট করুন।</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold shrink-0">3</span>
                      <span>পপআপে <strong>"Install"</strong> চাপলেই আপনার ডেস্কটপ/মোবাইলে সরাসরি আইকন যুক্ত হবে!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>১০০% ভাইরাস-মুক্ত ও সুরক্ষিত • প্লে প্রটেক্ট এবং অ্যাপল সিকিউরিটি সার্টিফাইড</span>
        </div>
      </div>
    </div>
  );
}
