import { useState } from 'react';
import {
  Crown,
  CreditCard,
  Lock,
  Download,
  LogOut,
  Copy,
  CheckCircle2,
  ChevronRight,
  Wallet,
  ArrowDownToLine,
  PlusCircle,
  Volume2,
  VolumeX,
  FileText,
  HelpCircle,
  Smartphone,
  Headphones,
  Camera,
  X,
  Check,
} from 'lucide-react';
import { Currency, Language, UserProfile } from '../types';
import { getCurrencySymbol } from '../utils/currency';
import { sound } from '../utils/audio';
import { CURATED_AVATARS } from '../utils/avatars';

interface AccountViewProps {
  user: UserProfile;
  currency: Currency;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onCurrencyChange: (curr: Currency) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenVip: () => void;
  onOpenSupport: () => void;
  onOpenSecurity: () => void;
  onOpenAppDownload: () => void;
  onOpenAdmin?: () => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
  onLogout: () => void;
  onUpdateAvatar?: (avatarUrl: string) => void;
}

export function AccountView({
  user,
  currency,
  language,
  onLanguageChange,
  onCurrencyChange,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenVip,
  onOpenSupport,
  onOpenSecurity,
  onOpenAppDownload,
  onOpenAdmin,
  onToggleSound,
  soundEnabled,
  onLogout,
  onUpdateAvatar,
}: AccountViewProps) {
  const sym = getCurrencySymbol(currency);
  const [copiedUid, setCopiedUid] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  const handleCopyUid = () => {
    sound.playClick();
    navigator.clipboard.writeText(user.id);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleSelectAvatar = (url: string) => {
    sound.playWin();
    if (onUpdateAvatar) {
      onUpdateAvatar(url);
    }
    setAvatarSuccess(true);
    setTimeout(() => {
      setAvatarSuccess(false);
      setShowAvatarPicker(false);
    }, 800);
  };

  const expPercentage = Math.min(100, Math.round((user.vipExp / user.nextVipExp) * 100));

  return (
    <div className="space-y-5 animate-in fade-in pb-8">
      {/* Profile Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0e1d44] via-[#091533] to-[#122552] border border-blue-500/40 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Avatar with ornate golden ring & Edit Camera overlay */}
            <div 
              onClick={() => setShowAvatarPicker(true)}
              className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center cursor-pointer group"
              title="প্রোফাইল ছবি পরিবর্তন করুন (Click to change avatar)"
            >
              <img
                src={user.avatar}
                alt={user.username}
                className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-full border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)] group-hover:brightness-90 transition-all"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white drop-shadow" />
              </div>
              <span className="absolute -bottom-1 -right-1 px-2 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] font-mono shadow-md border border-slate-900 z-10">
                VIP{user.vipLevel}
              </span>
            </div>

            {/* Name & ID Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-white font-display">
                  {user.username}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(true)}
                  className="px-2 py-0.5 rounded-full bg-blue-600/30 hover:bg-blue-600/50 text-sky-300 border border-blue-400/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Camera className="w-3 h-3" />
                  <span>ছবি পরিবর্তন</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="font-mono">UID: {user.id}</span>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="p-1 rounded bg-[#060e22] text-slate-400 hover:text-amber-400 cursor-pointer"
                  title="Copy UID"
                >
                  {copiedUid ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-400 font-mono">
                Phone: {user.countryCode} {user.phone}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenVip}
            className="self-start sm:self-auto px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-900/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Crown className="w-4 h-4 fill-slate-950" />
            <span>VIP Rewards Club</span>
          </button>
        </div>

        {/* VIP Level EXP Progress Bar */}
        <div className="p-3 rounded-2xl bg-[#08122c] border border-blue-500/20 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-bold flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> VIP {user.vipLevel} Privileges
            </span>
            <span className="font-mono text-amber-400 font-bold">
              {user.vipExp} / {user.nextVipExp} EXP ({expPercentage}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#060e22] overflow-hidden border border-blue-950">
            <div
              style={{ width: `${expPercentage}%` }}
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* Account Wallet Quick Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Main Balance Box */}
        <div className="p-5 rounded-3xl bg-[#091533] border border-blue-500/30 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <Wallet className="w-4 h-4 text-sky-400" /> Total Balance
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded-full border border-emerald-500/30">
              Real-time
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {sym}{user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onOpenDeposit}
              className="py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Deposit</span>
            </button>
            <button
              type="button"
              onClick={onOpenWithdraw}
              className="py-2.5 rounded-2xl bg-[#0e214d] hover:bg-blue-600 border border-blue-400/40 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4 text-sky-300" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>

        {/* Currency & Audio Quick Preference Card */}
        <div className="p-5 rounded-3xl bg-[#091533] border border-blue-500/30 shadow-lg space-y-3 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-300 block mb-2">Display Currency & Sound</span>
            <div className="grid grid-cols-3 gap-2">
              {(['BDT', 'INR', 'USD'] as Currency[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onCurrencyChange(c);
                  }}
                  className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    currency === c
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'bg-[#060e22] text-slate-300 border border-blue-500/20 hover:border-blue-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-blue-900/40 flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">Sound Effects</span>
            <button
              type="button"
              onClick={onToggleSound}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account Settings Menu List */}
      <div className="rounded-3xl bg-[#091533] border border-blue-500/30 overflow-hidden divide-y divide-blue-950/80 shadow-xl">
        {/* Customer Support */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenSupport();
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-blue-900/30 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-1 flex items-center justify-center text-slate-950 shadow">
              <Headphones className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-white block">
                24/7 Customer Service
              </span>
              <span className="text-[10px] text-slate-400">
                Contact dedicated online manager anytime
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Security / Verification */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenSecurity();
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-blue-900/30 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-sky-300">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-white block">
                Security Center & Password
              </span>
              <span className="text-[10px] text-slate-400">
                Manage transaction pin, login password & KYC
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Bank & Payment Cards */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenWithdraw();
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-blue-900/30 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-white block">
                Bank Cards & Wallets
              </span>
              <span className="text-[10px] text-slate-400">
                bKash, Nagad, Rocket, USDT TRC20 addresses
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* App Download */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenAppDownload();
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-blue-900/30 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-white block">
                Download Official App (Android / iOS)
              </span>
              <span className="text-[10px] text-amber-400 font-bold">
                Download & get ৳58 instant cash reward!
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="w-full p-4 flex items-center justify-between hover:bg-rose-950/40 transition-colors text-left text-rose-400 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold block">Log Out</span>
              <span className="text-[10px] text-slate-400">Safely sign out of your account</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400/60" />
        </button>
      </div>

      {/* Interactive Avatar Gallery Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#060e22] border-2 border-blue-500/40 p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
              <div>
                <h3 className="text-base font-black text-white font-display">
                  পছন্দের প্রোফাইল অবতার নির্বাচন করুন
                </h3>
                <p className="text-[11px] text-slate-400">
                  আপনার একাউন্টের জন্য আকর্ষণীয় এইচডি প্রোফাইল ছবি বেছে নিন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {avatarSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4" />
                <span>প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে!</span>
              </div>
            )}

            <div className="grid grid-cols-4 gap-3 py-2">
              {CURATED_AVATARS.map((av) => {
                const isCurrent = user.avatar === av.url;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => handleSelectAvatar(av.url)}
                    className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all p-0.5 group active:scale-95 cursor-pointer ${
                      isCurrent
                        ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/30'
                        : 'border-blue-500/30 hover:border-blue-400 hover:scale-105'
                    }`}
                  >
                    <img
                      src={av.url}
                      alt={av.label}
                      className="w-full h-full object-cover rounded-[14px]"
                      referrerPolicy="no-referrer"
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md">
                          ✓
                        </div>
                      </div>
                    )}
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-slate-200 text-center py-0.5 font-medium truncate px-1">
                      {av.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
