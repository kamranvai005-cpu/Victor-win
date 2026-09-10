import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Flame,
  Zap,
  Crown,
  AlertTriangle,
  X,
  Wallet,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Currency, UserProfile } from '../types';
import { getCurrencySymbol } from '../utils/currency';
import { sound } from '../utils/audio';
import { getLocalConfig, updateSystemConfig } from '../utils/firebase';
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

interface ActivityViewProps {
  user: UserProfile;
  currency: Currency;
  onUpdateBalance: (newBalance: number) => void;
  onOpenDeposit: () => void;
  onOpenVip: () => void;
}

export function ActivityView({
  user,
  currency,
  onUpdateBalance,
  onOpenDeposit,
  onOpenVip,
}: ActivityViewProps) {
  const sym = getCurrencySymbol(currency);

  // Requirement Modal State for Check-in Deposit Requirement
  const [showCheckInDepositNotice, setShowCheckInDepositNotice] = useState(false);

  // Daily Check-in state
  const [checkInState, setCheckInState] = useState<CheckInState>(() => getCheckInState(user.id || user.username));
  const todayStr = getTodayDateString();
  const todayChecked = checkInState.lastClaimDate === todayStr;
  const isCycleCompleted = checkInState.isCycleCompleted || checkInState.currentDay > 7;
  const currentDayNum = Math.min(7, checkInState.currentDay);
  const currentDayConfig = DAILY_CHECKIN_DAYS.find((d) => d.day === currentDayNum) || DAILY_CHECKIN_DAYS[0];

  const todayDeposit = getTodayDepositAmount(user.id || user.username);
  const isDepositMet = todayDeposit >= currentDayConfig.requiredDeposit;

  // Gift code state
  const [giftCode, setGiftCode] = useState('');
  const [giftCodeSuccess, setGiftCodeSuccess] = useState<string | null>(null);
  const [giftCodeError, setGiftCodeError] = useState<string | null>(null);

  // Lucky Spin Wheel state - STRICT: 20 BDT per spin, NO free spins, low realistic rewards
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelPrize, setWheelPrize] = useState<string | null>(null);
  const [spinError, setSpinError] = useState<string | null>(null);

  // Real-time Super Jackpot Rolling Counter
  const [jackpotAmount, setJackpotAmount] = useState(5849320.75);

  useEffect(() => {
    const interval = setInterval(() => {
      setJackpotAmount((prev) => prev + Math.floor(Math.random() * 85) + 12.35);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleClaimCheckIn = () => {
    if (isCycleCompleted) {
      sound.playClick();
      return;
    }

    if (todayChecked) {
      sound.playClick();
      return;
    }

    // User must deposit that day's required amount (Day 1: 100, Day 2: 200, ..., Day 7: 700)
    if (!isDepositMet) {
      sound.playClick();
      setShowCheckInDepositNotice(true);
      return;
    }

    sound.playWin();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

    const reward = currentDayConfig.reward;
    const nextDay = checkInState.currentDay + 1;
    const nextClaimed = [...checkInState.claimedDays, currentDayNum];
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
  };

  const handleRedeemCode = (e: React.FormEvent) => {
    e.preventDefault();
    setGiftCodeSuccess(null);
    setGiftCodeError(null);
    const code = giftCode.trim().toUpperCase();

    if (!code) {
      setGiftCodeError('অনুগ্রহ করে সঠিক গিফট কোড প্রদান করুন');
      return;
    }

    const config = getLocalConfig();
    const matched = (config.giftCodes || []).find(
      (g) => g.code === code && g.isActive
    );

    if (!matched) {
      sound.playClick();
      setGiftCodeError('মেয়াদোত্তীর্ণ বা ভুল গিফট কোড! অনুগ্রহ করে সক্রিয় এডমিন কোড দিন।');
      return;
    }

    if (matched.claimedCount >= matched.maxClaims) {
      sound.playClick();
      setGiftCodeError('এই গিফট কোডের সর্বোচ্চ ব্যবহারের সীমা শেষ হয়ে গেছে!');
      return;
    }

    // Check if user has already claimed this code
    const currentUid = user.id || user.username;
    if (matched.claimedUids && matched.claimedUids.includes(currentUid)) {
      sound.playClick();
      setGiftCodeError('আপনি ইতিমধ্যে এই গিফট কোডটি ক্লেইম করেছেন!');
      return;
    }

    // Targeted UID check
    if (matched.targetType === 'specific_uid' && matched.targetUid) {
      const target = matched.targetUid.trim().toLowerCase();
      const userUidMatch = (user.id || '').toLowerCase() === target;
      const userPhoneMatch = (user.phone || '').toLowerCase().includes(target);
      const userNameMatch = (user.username || '').toLowerCase() === target;

      if (!userUidMatch && !userPhoneMatch && !userNameMatch) {
        sound.playClick();
        setGiftCodeError(`এই স্পেশাল গিফট কোডটি শুধুমাত্র নির্দিষ্ট ইউআইডি (${matched.targetUid}) এর জন্য বরাদ্দকৃত!`);
        return;
      }
    }

    const reward = matched.rewardAmount;
    sound.playWin();
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
    
    const categoryInfo = matched.targetCategory ? ` [${matched.targetCategory}]` : '';
    setGiftCodeSuccess(`অভিনন্দন!${categoryInfo} ${sym}${reward} রিয়েল ক্যাশ আপনার ওয়ালেটে সফলভাবে যোগ হয়েছে!`);
    onUpdateBalance(user.balance + reward);

    // Increment claimed count & append user UID in Firebase / Local
    const updatedCodes = (config.giftCodes || []).map((g) => {
      if (g.code === code) {
        const uids = g.claimedUids || [];
        return {
          ...g,
          claimedCount: g.claimedCount + 1,
          claimedUids: [...uids, currentUid],
        };
      }
      return g;
    });

    updateSystemConfig({ giftCodes: updatedCodes });
    setGiftCode('');
  };

  const handleSpinWheel = () => {
    if (isSpinning) return;
    setSpinError(null);
    setWheelPrize(null);

    // User requirement: Spin costs 20 BDT, no free spin
    if (user.balance < SPIN_COST) {
      sound.playClick();
      setSpinError(`অপর্যাপ্ত ব্যালেন্স! ১টি স্পিন কিনতে ওয়ালেটে কমপক্ষে ৳${SPIN_COST} থাকতে হবে।`);
      return;
    }

    // Deduct 20 BDT immediately to buy the spin
    sound.playClick();
    setIsSpinning(true);
    const balanceAfterCost = user.balance - SPIN_COST;
    onUpdateBalance(balanceAfterCost);

    const { prize, index } = selectRandomSpinPrize();
    const sliceDeg = 360 / LOW_REWARD_SPIN_PRIZES.length;
    // Target rotation to land the top pointer precisely on the winning prize slice
    const targetDeg = 360 * 5 + (360 - index * sliceDeg - sliceDeg / 2);

    setWheelRotation((prev) => prev + targetDeg);

    const tickInterval = setInterval(() => {
      sound.playSpinTick();
    }, 140);

    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      setWheelPrize(`+${sym}${prize.value}`);
      sound.playWin();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      onUpdateBalance(balanceAfterCost + prize.value);
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-8">
      {/* Official Activity Reward Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0d1d44] via-[#091533] to-[#122552] border border-amber-500/40 p-4 sm:p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/30 border border-amber-400/40 shrink-0 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              🎁
            </div>

            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black uppercase shadow">
                  অফিসিয়াল ইভেন্ট সেন্টার
                </span>
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                  <Flame className="w-3.5 h-3.5" /> High Bonus
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-white font-display">
                Activity & Reward Center
              </h1>
              <p className="text-xs text-slate-300">
                দৈনিক এটেন্ডেন্স, গিফট কোড রিডিম, রিয়েল-টাইম বেটিং রিবেট এবং সুপার জ্যাকপট বোনাস!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenVip}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-950/50 flex items-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Crown className="w-4 h-4 text-slate-950" />
            <span>VIP ক্লাব রিওয়ার্ড</span>
          </button>
        </div>
      </div>

      {/* 2 Main Featured Event Cards: Sign-In Banner & Member Gift */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Daily Attendance Sign-In Banner */}
        <div
          onClick={handleClaimCheckIn}
          className="relative rounded-3xl overflow-hidden border border-amber-500/40 shadow-xl bg-gradient-to-br from-amber-950/80 via-[#0a1838] to-[#060e22] p-5 group cursor-pointer active:scale-98 transition-all flex flex-col justify-between min-h-[160px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider">
              DAILY ATTENDANCE
            </span>
            <span className="text-3xl animate-bounce">🎁</span>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white mt-2">
              ৭ দিনের ডিপোজিট চেক-ইন বোনাস
            </h3>
            <p className="text-xs text-amber-300 font-semibold mt-0.5">
              প্রতিদিন নির্দিষ্ট ডিপোজিট সম্পন্ন করে জিতে নিন মোট {sym}২৮০ রিওয়ার্ড (১ম দিন: {sym}১০ থেকে ৭ম দিন: {sym}৭০)
            </p>
          </div>
        </div>

        {/* Card 2: Member Gift Package & First Deposit */}
        <div
          onClick={onOpenDeposit}
          className="relative rounded-3xl overflow-hidden border border-emerald-500/40 shadow-xl bg-gradient-to-br from-emerald-950/80 via-[#0a1838] to-[#060e22] p-5 group cursor-pointer active:scale-98 transition-all flex flex-col justify-between min-h-[160px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 uppercase tracking-wider">
              FIRST DEPOSIT
            </span>
            <span className="text-3xl">🚀</span>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white mt-2">
              নতুন মেম্বার গিফট ও ১০০% ডিপোজিট ম্যাচ
            </h3>
            <p className="text-xs text-emerald-300 font-semibold mt-0.5">
              প্রথম রিচার্জে ১০০% ক্যাশব্যাক বোনাস পান
            </p>
          </div>
        </div>
      </div>

      {/* 7-Day Attendance Interactive Strip */}
      <div className="relative rounded-3xl bg-[#091533] border border-blue-500/30 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-base">
              🎁
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-display">
                ৭-দিনের ডিপোজিট চেক-ইন গ্রিড
              </h3>
              <p className="text-[11px] text-slate-300">
                প্রতিদিন ডিপোজিট করে ধারাবাহিকভাবে ৭ দিন পর্যন্ত বোনাস ক্লেইম করুন (সর্বোচ্চ ৭ দিন)
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/40">
            {isCycleCompleted
              ? 'সাইকেল সমাপ্ত'
              : `দিন ${currentDayNum}/৭`}
          </span>
        </div>

        {/* 7 Days Grid with progressive deposit requirement and reward */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {DAILY_CHECKIN_DAYS.map((item) => {
            const isClaimed = checkInState.claimedDays.includes(item.day);
            const isCurrent = !isCycleCompleted && checkInState.currentDay === item.day;
            const isSuper = item.day === 7;

            return (
              <div
                key={item.day}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between transition-all relative overflow-hidden ${
                  isClaimed
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : isCurrent && !todayChecked
                    ? 'bg-amber-950/60 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] ring-2 ring-amber-400/40 text-amber-200'
                    : isSuper
                    ? 'bg-gradient-to-b from-indigo-950 to-[#0e1d44] border-indigo-500/40 text-indigo-200'
                    : 'bg-[#060e22] border-blue-500/20 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-400">
                  <span>{item.day}-ম দিন</span>
                  <span className="text-amber-400/80 font-mono">ডিপোজিট ৳{item.requiredDeposit}</span>
                </div>

                {/* Day Icon */}
                <div className="text-2xl my-1.5">
                  {item.icon}
                </div>

                {/* Reward Amount */}
                <div className="my-1 font-black text-sm font-mono text-white flex items-center gap-0.5">
                  <span className="text-amber-300">+{sym}{item.reward}</span>
                </div>

                {/* Status Indicator */}
                {isClaimed ? (
                  <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3 h-3" /> সম্পন্ন
                  </span>
                ) : isCurrent ? (
                  <span className="text-[10px] text-amber-400 font-bold">
                    {todayChecked ? 'আজকের শেষ' : 'আজকের দিন'}
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                    🔒 লকড
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Today's Deposit Progress Panel */}
        {!isCycleCompleted ? (
          <div className="p-3.5 rounded-2xl bg-[#060e22] border border-blue-500/30 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">আজকের টার্গেট ({currentDayConfig.day}-ম দিন):</span>
                <span className="text-amber-300 font-mono font-bold">
                  প্রয়োজনীয় ডিপোজিট {sym}{currentDayConfig.requiredDeposit} ➔ বোনাস {sym}{currentDayConfig.reward}
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-300">
                আজকের ডিপোজিট: <strong className={isDepositMet ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{sym}{todayDeposit}</strong> / {sym}{currentDayConfig.requiredDeposit}
              </span>
            </div>

            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isDepositMet
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                }`}
                style={{ width: `${Math.min(100, (todayDeposit / currentDayConfig.requiredDeposit) * 100)}%` }}
              />
            </div>

            {!isDepositMet && !todayChecked && (
              <p className="text-[11px] text-amber-400/90 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {currentDayConfig.day}-ম দিনের চেক-ইন বোনাস (+{sym}{currentDayConfig.reward}) আনলক করতে আজ আরও <strong className="text-amber-300 font-mono">{sym}{Math.max(0, currentDayConfig.requiredDeposit - todayDeposit)}</strong> ডিপোজিট প্রয়োজন।
                </span>
              </p>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-center text-xs text-amber-200 font-semibold">
            🎉 আপনার ৭ দিনের চেক-ইন সাইকেল সফলভাবে সম্পন্ন হয়েছে! নিয়ম অনুযায়ী ৭ দিন পূর্ণ হওয়ার পর আর কোনো চেক-ইন বোনাস প্রযোজ্য নয়।
          </div>
        )}

        {/* CTA Check-In / Deposit Button */}
        {isCycleCompleted ? (
          <button
            type="button"
            disabled
            className="w-full py-3 rounded-2xl font-black text-xs sm:text-sm bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700 flex items-center justify-center gap-2"
          >
            <span>৭ দিনের চেক-ইন সাইকেল সম্পন্ন (অফার সমাপ্ত)</span>
          </button>
        ) : todayChecked ? (
          <button
            type="button"
            disabled
            className="w-full py-3 rounded-2xl font-black text-xs sm:text-sm bg-emerald-950/60 text-emerald-300 cursor-not-allowed border border-emerald-500/40 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>আজকের ({currentDayConfig.day}-ম দিন) বোনাস গ্রহণ সম্পন্ন (+{sym}{currentDayConfig.reward}) — আগামীকাল পরবর্তী দিন আনলক হবে</span>
          </button>
        ) : !isDepositMet ? (
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenDeposit();
            }}
            className="w-full py-3 rounded-2xl font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:brightness-110 text-slate-950 shadow-amber-900/40 cursor-pointer active:scale-98"
          >
            <Wallet className="w-4 h-4" />
            <span>আজকের প্রয়োজনীয় {sym}{Math.max(0, currentDayConfig.requiredDeposit - todayDeposit)} ডিপোজিট করুন</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleClaimCheckIn}
            className="w-full py-3 rounded-2xl font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 hover:brightness-110 text-slate-950 shadow-emerald-900/40 cursor-pointer active:scale-98 animate-pulse"
          >
            <Sparkles className="w-4 h-4" />
            <span>🎉 {currentDayConfig.day}-ম দিনের চেক-ইন বোনাস গ্রহণ করুন (+{sym}{currentDayConfig.reward})</span>
          </button>
        )}
      </div>

      {/* Super Jackpot & Betting Rebate Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Super Jackpot Live Rolling Box */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#102452] via-[#091533] to-[#12285a] border border-amber-500/50 p-5 shadow-2xl flex flex-col justify-between">
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎰</span>
                <span className="text-base font-black text-white font-display">সুপার জ্যাকপট পুল</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black animate-pulse">
                🔴 লাইভ জ্যাকপট
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Win Go এবং স্লটস গেমে যেকোনো স্পিনে আনলক করুন মেগা জ্যাকপট!
            </p>

            {/* Jackpot Rolling Digits Counter */}
            <div className="p-4 rounded-2xl bg-[#050c1e] border-2 border-amber-400/80 shadow-inner flex items-center justify-center gap-2">
              <span className="text-2xl animate-bounce">🪙</span>
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.6)]">
                {sym}{jackpotAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="relative z-10 pt-3 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 text-amber-300 font-bold">
              💡 প্রতি মিনিটে রিয়েল-টাইমে জ্যাকপটের পরিমাণ বৃদ্ধি পায়
            </span>
            <span className="text-emerald-400 font-mono font-bold">৯৯.৮% পেআউট</span>
          </div>
        </div>

        {/* Real-time Betting Rebate Card */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0e1f48] via-[#091533] to-[#12285a] border border-blue-500/40 p-5 shadow-2xl flex flex-col justify-between">
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <span className="text-sm sm:text-base font-bold text-white font-display">বেটিং রিবেট বোনাস</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-sky-300 border border-blue-500/40 text-[10px] font-bold">
                সর্বোচ্চ ১.৫% রিবেট
              </span>
            </div>

            <p className="text-xs text-slate-300">
              আপনার প্রতিটি বেটে স্বয়ংক্রিয়ভাবে ক্যাশব্যাক রিবেট জমা হয়। জিতি বা হারি, লাভ নিশ্চিত!
            </p>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-[#050c1e] border border-blue-500/20">
                <span className="text-[10px] text-slate-400 block">লটারি / Win Go</span>
                <span className="text-xs font-mono font-black text-amber-400">০.৮০%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#050c1e] border border-blue-500/20">
                <span className="text-[10px] text-slate-400 block">স্লটস / ইলেকট্রনিক</span>
                <span className="text-xs font-mono font-black text-emerald-400">১.৫০%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#050c1e] border border-blue-500/20">
                <span className="text-[10px] text-slate-400 block">লাইভ ক্যাসিনো</span>
                <span className="text-xs font-mono font-black text-sky-400">০.৬০%</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-3 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">প্রতিদিন রাত ১২:০০ টায় অটো-সেটেলমেন্ট</span>
            <button
              type="button"
              onClick={onOpenVip}
              className="text-xs text-amber-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              ভিআইপি টেবিল দেখুন <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Lucky Fortune Spin Wheel & Gift Code Redeem */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lucky Fortune Spin Wheel */}
        <div className="rounded-3xl bg-[#091533] border border-blue-500/30 p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-blue-900/50 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-display">
                  লাকি ফরচুন স্পিন হুইল
                </h3>
                <p className="text-[11px] text-slate-400">
                  প্রতি স্পিন {sym}{SPIN_COST} | রিওয়ার্ড {sym}২ থেকে {sym}২০ পর্যন্ত
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                নো ফ্রি স্পিন
              </span>
              <span className="text-[11px] text-slate-300 font-mono mt-0.5">
                মূল্য: {sym}{SPIN_COST}/স্পিন
              </span>
            </div>
          </div>

          {/* Wheel Visual */}
          <div className="flex flex-col items-center justify-center py-2 relative">
            <div className="absolute top-0 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)]" />

            <div
              style={{
                transform: `rotate(${wheelRotation}deg)`,
                transition: isSpinning ? 'transform 4s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
              }}
              className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.3)] relative overflow-hidden bg-[#0e1d44]"
            >
              {LOW_REWARD_SPIN_PRIZES.map((p, idx) => {
                const angle = (360 / LOW_REWARD_SPIN_PRIZES.length) * idx;
                return (
                  <div
                    key={idx}
                    style={{
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: '50% 50%',
                    }}
                    className="absolute inset-0 flex items-start justify-center pt-2"
                  >
                    <span
                      style={{ color: p.color }}
                      className="text-xs font-black font-mono drop-shadow-md"
                    >
                      {p.label}
                    </span>
                  </div>
                );
              })}

              {/* Center Hub */}
              <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-slate-900 flex items-center justify-center shadow-lg text-slate-950 font-black text-[10px]">
                SPIN
              </div>
            </div>

            {wheelPrize && (
              <p className="text-xs font-bold text-emerald-400 mt-2 animate-bounce">
                🎉 অভিনন্দন! {wheelPrize} ক্যাশ আপনার একাউন্টে যোগ হয়েছে!
              </p>
            )}

            {spinError && (
              <p className="text-xs font-bold text-rose-400 mt-2 text-center">
                ⚠️ {spinError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleSpinWheel}
              disabled={isSpinning}
              className={`w-full py-3 rounded-2xl font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                user.balance < SPIN_COST
                  ? 'bg-gradient-to-r from-amber-600/80 to-yellow-600/80 hover:brightness-110 text-white border border-amber-500/50 active:scale-98'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 hover:brightness-110 text-white shadow-purple-900/50 active:scale-98'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>
                {isSpinning
                  ? 'স্পিন হচ্ছে...'
                  : user.balance < SPIN_COST
                  ? `২০ টাকায় স্পিন কিনুন (ব্যালেন্স অপর্যাপ্ত)`
                  : `২০ টাকায় স্পিন করুন (${sym}${SPIN_COST} কাটা হবে)`}
              </span>
            </button>
            <p className="text-[10px] text-center text-slate-400">
              * ফ্রিতে কোনো স্পিন নেই। প্রতি স্পিনে ওয়ালেট থেকে {sym}{SPIN_COST} কাটা হবে। সম্ভাব্য রিওয়ার্ড: {sym}২, {sym}৫, {sym}১০, {sym}১৫ ও সর্বোচ্চ {sym}২০।
            </p>
          </div>
        </div>

        {/* Gift Code Redeem Banner Card */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0e1d44] via-[#091533] to-[#0e1d44] border border-amber-500/40 p-5 shadow-xl flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎟️</span>
                <span className="text-base font-black text-white font-display">গিফট কোড রিডিম</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                গিফট কোড
              </span>
            </div>

            <p className="text-xs text-slate-300">
              অফিসিয়াল টেলিগ্রাম চ্যানেল অথবা এজেন্টের দেওয়া গিফট কোড প্রবেশ করিয়ে ইনস্ট্যান্ট ক্যাশ রিওয়ার্ড রিডিম করুন।
            </p>

            <form onSubmit={handleRedeemCode} className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="text"
                value={giftCode}
                onChange={(e) => setGiftCode(e.target.value)}
                placeholder="গিফট কোড লিখুন (যেমন: VICTOR888)"
                className="flex-1 px-4 py-2.5 rounded-2xl bg-[#060e22] border border-blue-500/30 text-white placeholder-slate-500 font-mono text-xs sm:text-sm focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/40 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                রিডিম করুন
              </button>
            </form>

            {giftCodeSuccess && (
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {giftCodeSuccess}
              </p>
            )}
            {giftCodeError && (
              <p className="text-xs font-semibold text-rose-400 animate-in fade-in">
                ⚠️ {giftCodeError}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-blue-950 flex items-center justify-between text-[11px] text-slate-400">
            <span>কমিউনিটি ইভেন্ট ও গিফট কোড</span>
            <span className="text-amber-300 font-bold">২৪/৭ রিডেম্পশন</span>
          </div>
        </div>
      </div>

      {/* Check-In Progressive Deposit Requirement Notice Modal */}
      {showCheckInDepositNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#091533] border-2 border-amber-500/60 p-6 shadow-2xl text-center space-y-4">
            <button
              type="button"
              onClick={() => setShowCheckInDepositNotice(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 mx-auto flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-white font-display">
                ডিপোজিট শর্ত প্রযোজ্য
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-amber-300">{currentDayConfig.day}-ম দিনের</strong> হাজিরা বোনাস (+{sym}{currentDayConfig.reward}) ক্লেইম করতে আজ কমপক্ষে <strong className="text-amber-400">{sym}{currentDayConfig.requiredDeposit}</strong> ডিপোজিট করতে হবে।
              </p>
            </div>

            {/* Target Breakdown Box */}
            <div className="p-3 rounded-2xl bg-[#060e22] border border-blue-500/30 text-xs space-y-1.5 text-left">
              <div className="flex justify-between text-slate-300">
                <span>আজকের প্রয়োজনীয় ডিপোজিট:</span>
                <span className="font-mono font-bold text-white">{sym}{currentDayConfig.requiredDeposit}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>আজ জমা হয়েছে:</span>
                <span className="font-mono font-bold text-emerald-400">{sym}{todayDeposit}</span>
              </div>
              <div className="flex justify-between border-t border-blue-900/60 pt-1.5 font-bold">
                <span className="text-amber-300">আর বাকি প্রয়োজন:</span>
                <span className="font-mono text-amber-400 font-black">{sym}{Math.max(0, currentDayConfig.requiredDeposit - todayDeposit)}</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowCheckInDepositNotice(false);
                  onOpenDeposit();
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Wallet className="w-4 h-4" />
                <span>এখনই {sym}{Math.max(0, currentDayConfig.requiredDeposit - todayDeposit)} ডিপোজিট করুন</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCheckInDepositNotice(false)}
                className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                পরে করব
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
