import React, { useState } from 'react';
import {
  Wallet,
  PlusCircle,
  ArrowDownToLine,
  RefreshCw,
  Crown,
  Copy,
  Check,
  ShieldCheck,
  Gift,
  Users,
  Lock,
} from 'lucide-react';
import { UserProfile, Currency } from '../types';
import { getCurrencySymbol } from '../utils/currency';
import { sound } from '../utils/audio';
import { WINGO_ASSETS } from '../utils/wingoAssets';

interface UserWalletCardProps {
  user: UserProfile;
  currency: Currency;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenVip: () => void;
  onOpenActivity: () => void;
  onOpenTeam?: () => void;
  onRefreshBalance: () => void;
}

export function UserWalletCard({
  user,
  currency,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenVip,
  onOpenActivity,
  onOpenTeam,
  onRefreshBalance,
}: UserWalletCardProps) {
  const sym = getCurrencySymbol(currency);
  const [copiedUid, setCopiedUid] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCopyUid = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    navigator.clipboard?.writeText?.(user.id);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    setIsRefreshing(true);
    onRefreshBalance();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div
      className="relative rounded-3xl overflow-hidden border border-amber-500/30 p-4 sm:p-5 shadow-2xl space-y-4 bg-cover bg-center"
      style={{ backgroundImage: `url(${WINGO_ASSETS.walletBg})` }}
    >
      <div className="absolute inset-0 bg-[#08122c]/85 backdrop-blur-[1px] pointer-events-none" />

      {/* Upper row: User Info & Balance */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* User Identity */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-amber-400/80 shadow-md"
            />
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[9px] flex items-center gap-0.5 border border-slate-900 shadow">
              <Crown className="w-2.5 h-2.5 fill-slate-950" />
              <span>VIP{user.vipLevel}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white font-display">
                {user.username}
              </h3>
              <button
                type="button"
                onClick={onOpenVip}
                className="px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold cursor-pointer transition-all"
              >
                VIP Benefits ›
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono">UID: {user.id}</span>
              <button
                type="button"
                onClick={handleCopyUid}
                className="hover:text-sky-300 text-slate-400 transition-colors cursor-pointer"
                title="Copy UID"
              >
                {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Balance Display */}
        <div className="flex items-center justify-between sm:justify-end gap-3 bg-[#040918]/90 border border-amber-500/30 p-2.5 sm:px-4 sm:py-2 rounded-2xl shadow-inner">
          <div>
            <span className="text-[10px] uppercase text-slate-300 font-semibold block leading-none">
              Wallet Balance (ওয়ালেট ব্যালেন্স)
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                {sym}{user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all cursor-pointer active:scale-90"
            title="Refresh Wallet Balance"
          >
            <img
              src={WINGO_ASSETS.refreshIcon}
              alt="Refresh"
              className={`w-4 h-4 object-contain transition-transform duration-500 ${isRefreshing ? 'rotate-180 scale-110' : 'hover:rotate-45'}`}
              referrerPolicy="no-referrer"
            />
          </button>
        </div>
      </div>

      {/* Action Buttons: Large Deposit & Withdraw */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenDeposit();
          }}
          className="group py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all hover:scale-[1.015] active:scale-95 cursor-pointer border border-emerald-400/40"
        >
          <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform text-white" />
          <span>DEPOSIT (ডিপোজিট)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenWithdraw();
          }}
          className="group py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-950/60 flex items-center justify-center gap-2 transition-all hover:scale-[1.015] active:scale-95 cursor-pointer border border-blue-400/40"
        >
          <ArrowDownToLine className="w-4 h-4 group-hover:translate-y-0.5 transition-transform text-white" />
          <span>WITHDRAW (উইথড্র)</span>
        </button>
      </div>

      {/* Quick Access Badges Bar */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-blue-900/40 text-center">
        <button
          type="button"
          onClick={onOpenVip}
          className="p-2 rounded-xl bg-[#060e22]/80 hover:bg-blue-600/20 border border-blue-500/20 text-slate-300 hover:text-amber-300 transition-all flex flex-col items-center gap-1 cursor-pointer"
        >
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-bold">VIP Club</span>
        </button>

        <button
          type="button"
          onClick={onOpenActivity}
          className="p-2 rounded-xl bg-[#060e22]/80 hover:bg-blue-600/20 border border-blue-500/20 text-slate-300 hover:text-emerald-300 transition-all flex flex-col items-center gap-1 cursor-pointer"
        >
          <Gift className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-bold">Activity</span>
        </button>

        <button
          type="button"
          onClick={onOpenTeam || onOpenActivity}
          className="p-2 rounded-xl bg-[#060e22]/80 hover:bg-blue-600/20 border border-blue-500/20 text-slate-300 hover:text-sky-300 transition-all flex flex-col items-center gap-1 cursor-pointer"
        >
          <Users className="w-4 h-4 text-sky-400" />
          <span className="text-[10px] font-bold">Team 6-Tier</span>
        </button>

        <button
          type="button"
          onClick={onOpenDeposit}
          className="p-2 rounded-xl bg-[#060e22]/80 hover:bg-blue-600/20 border border-blue-500/20 text-slate-300 hover:text-purple-300 transition-all flex flex-col items-center gap-1 cursor-pointer"
        >
          <Lock className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] font-bold">Safe Vault</span>
        </button>
      </div>
    </div>
  );
}
