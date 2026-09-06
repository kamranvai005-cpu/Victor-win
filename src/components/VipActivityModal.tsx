import { useState } from 'react';
import { Crown, Sparkles, X, Zap, ArrowRight, CheckCircle2, AlertTriangle, Wallet } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, Currency } from '../types';
import { VIP_TIERS } from '../data/mockData';
import { getLocalConfig, DEFAULT_VIP_SETTINGS, VipTierConfig } from '../utils/firebase';
import { sound } from '../utils/audio';
import {
  DAILY_CHECKIN_DAYS,
  getCheckInState,
  saveCheckInState,
  getTodayDepositAmount,
  getTodayDateString,
  SPIN_COST,
  LOW_REWARD_SPIN_PRIZES,
  selectRandomSpinPrize,
  CheckInState,
} from '../utils/checkin';

interface VipActivityModalProps {
  user: UserProfile;
  onClose: () => void;
  currency: Currency;
  onUpdateBalance: (newBalance: number) => void;
  onOpenDeposit?: () => void;
}

export function VipActivityModal({
  user,
  onClose,
  currency,
  onUpdateBalance,
  onOpenDeposit,
}: VipActivityModalProps) {
  const [activeTab, setActiveTab] = useState<'vip' | 'attendance' | 'wheel'>('vip');
  
  // Daily checkin synced state
  const [checkInState, setCheckInState] = useState<CheckInState>(() => getCheckInState(user.id || user.username));
  const todayStr = getTodayDateString();
  const todayChecked = checkInState.lastClaimDate === todayStr;
  const isCycleCompleted = checkInState.isCycleCompleted || checkInState.currentDay > 7;
  const currentDayNum = Math.min(7, checkInState.currentDay);
  const currentDayConfig = DAILY_CHECKIN_DAYS.find((d) => d.day === currentDayNum) || DAILY_CHECKIN_DAYS[0];

  const todayDeposit = getTodayDepositAmount(user.id || user.username);
  const isDepositMet = todayDeposit >= currentDayConfig.requiredDeposit;
  const [attendanceNotice, setAttendanceNotice] = useState<string | null>(null);

  // Lucky spin state (20 BDT cost, no free spin, low reward)
  const [wheelSpinning, setWheelSpinning] = useState<boolean>(false);
  const [wheelResult, setWheelResult] = useState<number | null>(null);
  const [wheelError, setWheelError] = useState<string | null>(null);

  const sysConfig = getLocalConfig();
  const vipTiers = (sysConfig.vipSettings && sysConfig.vipSettings.length > 0)
    ? sysConfig.vipSettings
    : DEFAULT_VIP_SETTINGS;
  const currentTier = vipTiers.find((t) => t.level === user.vipLevel) || vipTiers[0];

  const getSymbol = (c: Currency) => (c === 'BDT' ? '৳' : c === 'INR' ? '₹' : '$');

  const handleClaimDay = (day: number, reward: number, requiredDeposit: number) => {
    if (isCycleCompleted) {
      setAttendanceNotice('৭ দিনের চেক-ইন সাইকেল ইতিমধ্যে সম্পন্ন হয়েছে!');
      return;
    }

    if (todayChecked) {
      setAttendanceNotice('আজকের চেক-ইন ইতিমধ্যে গ্রহণ করা হয়েছে। আগামীকাল পরবর্তী দিন আনলক হবে।');
      return;
    }

    if (day !== currentDayNum) {
      setAttendanceNotice(`অনুগ্রহ করে ধারাবাহিক অনুযায়ী ${currentDayNum}-ম দিনের চেক-ইন করুন।`);
      return;
    }

    if (todayDeposit < requiredDeposit) {
      sound.playClick();
      setAttendanceNotice(
        `${day}-ম দিনের বোনাস পেতে আজ কমপক্ষে ${getSymbol(currency)}${requiredDeposit} ডিপোজিট প্রয়োজন। (আজ জমা হয়েছে: ${getSymbol(currency)}${todayDeposit})`
      );
      return;
    }

    sound.playWin();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    
    const nextDay = checkInState.currentDay + 1;
    const nextClaimed = [...checkInState.claimedDays, day];
    const newCycleCompleted = nextDay > 7;

    const newState: CheckInState = {
      currentDay: nextDay,
      claimedDays: nextClaimed,
      lastClaimDate: todayStr,
      isCycleCompleted: newCycleCompleted,
    };

    setCheckInState(newState);
    saveCheckInState(newState, user.id || user.username);
    onUpdateBalance(user.balance + reward);
    setAttendanceNotice(null);
  };

  const handleSpinWheel = () => {
    if (wheelSpinning) return;
    setWheelError(null);
    setWheelResult(null);

    // Rule: Spin costs 20 BDT, no free spin
    if (user.balance < SPIN_COST) {
      sound.playClick();
      setWheelError(`অপর্যাপ্ত ব্যালেন্স! স্পিন করতে ওয়ালেটে কমপক্ষে ${getSymbol(currency)}${SPIN_COST} প্রয়োজন।`);
      return;
    }

    // Deduct 20 BDT immediately
    sound.playClick();
    setWheelSpinning(true);
    const balanceAfterCost = user.balance - SPIN_COST;
    onUpdateBalance(balanceAfterCost);

    const tickInterval = setInterval(() => sound.playSpinTick(), 100);

    setTimeout(() => {
      clearInterval(tickInterval);
      const { prize } = selectRandomSpinPrize();
      setWheelResult(prize.value);
      setWheelSpinning(false);

      sound.playWin();
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      onUpdateBalance(balanceAfterCost + prize.value);
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#060e22] border-2 border-amber-500/50 p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white font-display">
                VIP প্রিভিলেজ ও রিওয়ার্ড সেন্টার
              </h2>
              <p className="text-[11px] text-amber-300 font-semibold">
                ডেইলি চেক-ইন, লাকি স্পিন এবং ভিআইপি মাসিক বেতন ও ক্যাশব্যাক
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-2 bg-[#060e22] p-1.5 rounded-2xl border border-blue-500/25 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('vip');
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'vip'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            👑 VIP ক্লাব
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('attendance');
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            📅 ৭ দিনের বোনাস
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('wheel');
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'wheel'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            🎡 লাকি স্পিন
          </button>
        </div>

        {/* Tab 1: VIP Club Tier Progression */}
        {activeTab === 'vip' && (
          <div className="space-y-4 animate-in fade-in">
            {/* User Level Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-blue-950/60 to-[#08122c] border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 border border-amber-300 flex items-center justify-center p-1 text-slate-950 font-black text-sm">
                    VIP{user.vipLevel || 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {currentTier?.name || `VIP ${user.vipLevel || 1} মেম্বার`}
                    </h3>
                    <p className="text-xs text-amber-300/90 flex items-center gap-1">
                      মাসিক নিশ্চিত বেতন: <span className="font-mono font-bold text-emerald-400">{getSymbol(currency)}{(currentTier?.monthlySalary || 500).toLocaleString('en-US')}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-500/40 block">
                    {user.vipExp || 0} / {currentTier?.requiredBetCount || user.nextVipExp || 1000} EXP
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">বেট কাউন্ট: {user.vipExp || 0} বার</span>
                </div>
              </div>

              {/* VIP 1 Entry Requirement Milestone Card */}
              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span>VIP 1 এন্ট্রি অগ্রগতি (১০০ টাকা ডিপোজিট + ১০০০ বার বেট)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {user.balance >= 100 ? 'ডিপোজিট সম্পন্ন ✓' : 'ডিপোজিট বাকি'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-blue-950/50 border border-blue-500/20">
                    <span className="text-slate-400 block text-[10px]">১. রিচার্জ / ডিপোজিট:</span>
                    <span className="font-mono font-bold text-white">
                      ৳{user.balance.toFixed(0)} / ৳100
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-950/50 border border-blue-500/20">
                    <span className="text-slate-400 block text-[10px]">২. বৈধ বেট সংখ্যা (১০০ টাকায় ১ বেট):</span>
                    <span className="font-mono font-bold text-white">
                      {user.vipExp || 0} / 1,000 বার
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-blue-950 overflow-hidden border border-blue-900">
                  <div
                    style={{ width: `${Math.min(100, ((user.vipExp || 0) / 1000) * 100)}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>

            {/* VIP Monthly Salary & Status Claim Window Rule: Only on 1st of the month */}
            <div className="p-4 rounded-2xl bg-[#060e22] border border-amber-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  ভিআইপি মাসিক বেতন ও স্ট্যাটাস ক্লেইম
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  new Date().getDate() === 1
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                }`}>
                  {new Date().getDate() === 1 ? 'উইন্ডো উন্মুক্ত (আজ ১ তারিখ)' : `বন্ধ (আজ মাসের ${new Date().getDate()} তারিখ)`}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                {new Date().getDate() === 1 ? (
                  <span className="text-emerald-300 font-medium">
                    ✓ আজ মাসের ১ তারিখ! আপনার VIP{user.vipLevel || 1} মাসিক বেতন {getSymbol(currency)}{(currentTier?.monthlySalary || 500).toLocaleString('en-US')} ক্লেইম করার উইন্ডো এখন সক্রিয়।
                  </span>
                ) : (
                  <span className="text-amber-200/90 font-medium">
                    📌 নিয়মাবলী: ভিআইপি মাসিক বেতন প্রতি মাসের ১ তারিখে ক্লেইম করা যায়। আপনার বর্তমান VIP{user.vipLevel || 1} অনুযায়ী নির্ধারিত মাসিক বেতন {getSymbol(currency)}{(currentTier?.monthlySalary || 500).toLocaleString('en-US')} টাকা।
                  </span>
                )}
              </p>

              <button
                type="button"
                disabled={new Date().getDate() !== 1}
                onClick={() => {
                  if (new Date().getDate() === 1) {
                    const sal = currentTier?.monthlySalary || 500;
                    sound.playWin();
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                    onUpdateBalance(user.balance + sal);
                  }
                }}
                className={`w-full py-2.5 rounded-xl text-xs font-black transition-all shadow-md ${
                  new Date().getDate() === 1
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {new Date().getDate() === 1 ? `মাসিক বেতন ক্লেইম করুন (${getSymbol(currency)}${(currentTier?.monthlySalary || 500).toLocaleString('en-US')})` : `🔒 প্রতি মাসের ১ তারিখে বেতন ছাড় হবে (${getSymbol(currency)}${(currentTier?.monthlySalary || 500).toLocaleString('en-US')})`}
              </button>
            </div>

            {/* VIP Tiers Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>VIP লেভেল যোগ্যতা ও সুবিধা চার্ট</span>
                <span className="text-[10px] text-amber-400 font-normal">১০০ টাকা বেট = ১ বেট কাউন্ট</span>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {vipTiers.map((tier) => (
                  <div
                    key={tier.level}
                    className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-all ${
                      tier.level === user.vipLevel
                        ? 'bg-amber-500/15 border-amber-400 text-amber-200 shadow-md'
                        : 'bg-[#060e22] border-blue-500/20 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-mono font-black text-xs shrink-0">
                        V{tier.level}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black font-mono text-amber-400">{tier.name}</span>
                          {tier.level === user.vipLevel && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/30 text-emerald-300 rounded-md font-bold">
                              বর্তমান
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          শর্ত: ৳{tier.requiredDeposit} ডিপোজিট • {tier.requiredBetCount.toLocaleString('en-US')} বার বেট (১০০৳ = ১ বেট)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 font-mono text-[11px] self-end sm:self-auto">
                      <span className="text-amber-300">বোনাস: ৳{tier.upgradeBonus}</span>
                      <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                        বেতন: {getSymbol(currency)}{tier.monthlySalary.toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 7-Day Attendance Check-in */}
        {activeTab === 'attendance' && (
          <div className="space-y-3.5 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-[#060e22] border border-blue-500/30">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white font-display">
                  ৭-দিনের ডিপোজিট চেক-ইন সাইকেল
                </h4>
                <p className="text-[11px] text-slate-300">
                  প্রতিদিন ডিপোজিট করে ক্রমবর্ধিত বোনাস গ্রহণ করুন (১ম দিন ৳১০ থেকে ৭ম দিন ৳৭০ পর্যন্ত)
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/40 shrink-0 self-start sm:self-auto">
                {isCycleCompleted ? 'সাইকেল সম্পন্ন' : `দিন ${currentDayNum}/৭`}
              </span>
            </div>

            {/* Attendance Notice or Error */}
            {attendanceNotice && (
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-xs text-amber-200 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  {attendanceNotice}
                </span>
                {onOpenDeposit && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDeposit();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-[10px] hover:bg-yellow-300 shrink-0 cursor-pointer"
                  >
                    ডিপোজিট করুন
                  </button>
                )}
              </div>
            )}

            {/* 7 Days Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DAILY_CHECKIN_DAYS.map((item) => {
                const isClaimed = checkInState.claimedDays.includes(item.day);
                const isCurrent = !isCycleCompleted && item.day === currentDayNum;

                return (
                  <div
                    key={item.day}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-between text-center relative transition-all ${
                      isClaimed
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                        : isCurrent && !todayChecked
                        ? 'bg-amber-950/40 border-amber-400 text-amber-200 shadow-md ring-2 ring-amber-400/40'
                        : 'bg-[#060e22] border-blue-500/20 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-400">
                      <span>{item.day}-ম দিন</span>
                      <span className="text-amber-400 font-mono">ডিপোজিট ৳{item.requiredDeposit}</span>
                    </div>

                    <div className="text-2xl my-1.5">{item.icon}</div>

                    <span className="font-mono font-black text-sm flex items-center gap-0.5 text-amber-300">
                      +{getSymbol(currency)}{item.reward}
                    </span>

                    <button
                      type="button"
                      disabled={isClaimed || isCycleCompleted || (isCurrent && todayChecked)}
                      onClick={() => handleClaimDay(item.day, item.reward, item.requiredDeposit)}
                      className={`w-full mt-2 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        isClaimed
                          ? 'bg-emerald-800/30 text-emerald-400 border border-emerald-500/30 cursor-default'
                          : isCurrent && todayChecked
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : isCurrent
                          ? isDepositMet
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md animate-pulse'
                            : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isClaimed
                        ? 'সম্পন্ন'
                        : isCurrent
                        ? todayChecked
                          ? 'আজকের শেষ'
                          : isDepositMet
                          ? 'ক্লেইম করুন'
                          : 'শর্ত পূরণ'
                        : 'লকড'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Quick Helper / Info */}
            <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-[11px] text-slate-300 flex items-center justify-between">
              <span>
                আজ জমা হয়েছে: <strong className={isDepositMet ? 'text-emerald-400' : 'text-amber-400'}>{getSymbol(currency)}{todayDeposit}</strong> / {getSymbol(currency)}{currentDayConfig.requiredDeposit}
              </span>
              {isCycleCompleted ? (
                <span className="text-amber-400 font-bold">৭ দিনের সাইকেল সমাপ্ত</span>
              ) : !isDepositMet && onOpenDeposit ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDeposit();
                  }}
                  className="text-amber-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Wallet className="w-3 h-3" /> ডিপোজিট করুন
                </button>
              ) : (
                <span className="text-emerald-400 font-semibold">শর্ত অনুযায়ী প্রস্তুত</span>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Lucky Spin Wheel */}
        {activeTab === 'wheel' && (
          <div className="text-center space-y-4 py-2 animate-in fade-in">
            <div className="p-3 rounded-2xl bg-[#060e22] border border-blue-500/30 text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-white font-display">
                  লাকি ফরচুন স্পিন হুইল
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  নো ফ্রি স্পিন
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                প্রতি স্পিনের মূল্য {getSymbol(currency)}{SPIN_COST} টাকা। সম্ভাব্য রিওয়ার্ড: {getSymbol(currency)}২, {getSymbol(currency)}৫, {getSymbol(currency)}১০, {getSymbol(currency)}১৫ এবং সর্বোচ্চ {getSymbol(currency)}২০।
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#060e22] border border-blue-500/30 flex flex-col items-center justify-center space-y-3">
              <div
                className={`w-32 h-32 rounded-full border-4 border-amber-400 flex items-center justify-center bg-gradient-to-tr from-purple-900 via-indigo-900 to-[#0e1d44] shadow-[0_0_30px_rgba(245,158,11,0.4)] text-3xl font-black text-amber-300 ${
                  wheelSpinning ? 'animate-spin' : ''
                }`}
              >
                {wheelSpinning ? '🌀' : '🎡'}
              </div>

              {/* Spin Prize Strip Preview */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                {LOW_REWARD_SPIN_PRIZES.slice(0, 5).map((p, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold"
                    style={{ color: p.color }}
                  >
                    {p.label}
                  </span>
                ))}
              </div>

              {wheelResult !== null && (
                <p className="text-sm font-black text-emerald-400 animate-bounce">
                  🎉 অভিনন্দন! জিতেছেন +{getSymbol(currency)}{wheelResult}!
                </p>
              )}

              {wheelError && (
                <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-center gap-2">
                  <span>{wheelError}</span>
                  {onOpenDeposit && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenDeposit();
                      }}
                      className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-[10px] hover:bg-yellow-300 cursor-pointer"
                    >
                      রিচার্জ
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={wheelSpinning}
                onClick={handleSpinWheel}
                className="w-full max-w-xs py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 hover:brightness-110 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-950/50 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>
                  {wheelSpinning
                    ? 'হুইল ঘুরছে...'
                    : user.balance < SPIN_COST
                    ? `২০ টাকায় স্পিন কিনুন (ব্যালেন্স অপর্যাপ্ত)`
                    : `২০ টাকায় স্পিন করুন (${getSymbol(currency)}${SPIN_COST} কাটা হবে)`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
