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

  // Requirement Modal State (Minimum 1000 deposit to claim activity rewards)
  const [showMinDepositNotice, setShowMinDepositNotice] = useState(false);

  // Daily Check-in state
  const [checkedDays, setCheckedDays] = useState<number[]>([]);
  const [todayChecked, setTodayChecked] = useState(false);

  // Gift code state
  const [giftCode, setGiftCode] = useState('');
  const [giftCodeSuccess, setGiftCodeSuccess] = useState<string | null>(null);
  const [giftCodeError, setGiftCodeError] = useState<string | null>(null);

  // Lucky Spin Wheel state
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelPrize, setWheelPrize] = useState<string | null>(null);
  const [availableSpins, setAvailableSpins] = useState(1);

  // Real-time Super Jackpot Rolling Counter
  const [jackpotAmount, setJackpotAmount] = useState(5849320.75);

  useEffect(() => {
    const interval = setInterval(() => {
      setJackpotAmount((prev) => prev + Math.floor(Math.random() * 85) + 12.35);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const checkInRewards = [
    { day: 1, amount: 18, isClaimed: checkedDays.includes(1), isToday: !todayChecked && checkedDays.length === 0, icon: '🌟' },
    { day: 2, amount: 28, isClaimed: checkedDays.includes(2), icon: '💎' },
    { day: 3, amount: 58, isClaimed: checkedDays.includes(3), icon: '🎁' },
    { day: 4, amount: 88, isClaimed: checkedDays.includes(4), icon: '🔥' },
    { day: 5, amount: 128, isClaimed: checkedDays.includes(5), icon: '⚡' },
    { day: 6, amount: 188, isClaimed: checkedDays.includes(6), icon: '👑' },
    { day: 7, amount: 588, isClaimed: checkedDays.includes(7), isSuper: true, icon: '🏆' },
  ];

  const handleClaimCheckIn = () => {
    if (todayChecked) return;

    // Strict Rule: Claiming requires daily minimum 1000 deposit / project balance
    if (user.balance < 1000) {
      sound.playClick();
      setShowMinDepositNotice(true);
      return;
    }

    sound.playWin();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    setTodayChecked(true);
    setCheckedDays((prev) => [...prev, 1]);
    const bonus = 18;
    onUpdateBalance(user.balance + bonus);
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

  const wheelPrizes = [
    { label: '৳88', value: 88, color: '#f59e0b' },
    { label: '৳188', value: 188, color: '#3b82f6' },
    { label: '৳58', value: 58, color: '#10b981' },
    { label: '৳888', value: 888, color: '#ec4899' },
    { label: '৳28', value: 28, color: '#8b5cf6' },
    { label: '৳1888', value: 1888, color: '#eab308' },
    { label: '৳588', value: 588, color: '#06b6d4' },
    { label: '৳3888', value: 3888, color: '#ef4444' },
  ];

  const handleSpinWheel = () => {
    if (isSpinning || availableSpins <= 0) return;

    // Strict Rule: Spin wheel and task claims require minimum 1000 deposit/project
    if (user.balance < 1000) {
      sound.playClick();
      setShowMinDepositNotice(true);
      return;
    }

    setIsSpinning(true);
    setWheelPrize(null);
    sound.playClick();

    const prizeIndex = Math.floor(Math.random() * wheelPrizes.length);
    const selected = wheelPrizes[prizeIndex];

    const sliceDeg = 360 / wheelPrizes.length;
    const targetDeg = 360 * 5 + (360 - prizeIndex * sliceDeg - sliceDeg / 2);

    setWheelRotation((prev) => prev + targetDeg);

    setTimeout(() => {
      setIsSpinning(false);
      setAvailableSpins((prev) => prev - 1);
      setWheelPrize(`${sym}${selected.value}`);
      sound.playWin();
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
      onUpdateBalance(user.balance + selected.value);
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
              ATTENDANCE
            </span>
            <span className="text-3xl animate-bounce">🎁</span>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white mt-2">
              ৭ দিনের ধারাবাহিক হাজিরা বোনাস
            </h3>
            <p className="text-xs text-amber-300 font-semibold mt-0.5">
              প্রতিদিন চেক-ইন করে জিতে নিন সর্বমোট {sym}588 বোনাস
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
                ৭-দিনের চেক-ইন রিওয়ার্ড গ্রিড
              </h3>
              <p className="text-[11px] text-slate-300">
                ধারাবাহিক চেক-ইনে প্রতিদিন বড় অঙ্কের রিওয়ার্ড
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/40">
            স্ট্রিক: {todayChecked ? 3 : 2} দিন
          </span>
        </div>

        {/* 7 Days Grid with official number badges */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-2.5">
          {checkInRewards.map((item) => (
            <div
              key={item.day}
              className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-between transition-all relative overflow-hidden ${
                item.isClaimed
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : item.isToday && !todayChecked
                  ? 'bg-amber-950/60 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse text-amber-200'
                  : item.isSuper
                  ? 'bg-gradient-to-b from-indigo-950 to-[#0e1d44] border-indigo-500/50 text-indigo-200 col-span-2 sm:col-span-1'
                  : 'bg-[#060e22] border-blue-500/20 text-slate-400'
              }`}
            >
              {/* Day Badge Icon */}
              <div className="text-base my-0.5">
                {item.icon}
              </div>

              <div className="my-1 font-black text-xs font-mono text-white flex items-center gap-0.5">
                <span>+{sym}{item.amount}</span>
              </div>

              {item.isClaimed ? (
                <span className="flex items-center gap-0.5 text-[9px] text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> সম্পন্ন
                </span>
              ) : item.isToday ? (
                <span className="text-[9px] text-amber-400 font-bold animate-bounce">আজকের</span>
              ) : (
                <span className="flex items-center gap-0.5 text-[9px] text-slate-500">
                  🔒 লকড
                </span>
              )}
            </div>
          ))}
        </div>

        {/* CTA Check-In Button */}
        <button
          type="button"
          onClick={handleClaimCheckIn}
          disabled={todayChecked}
          className={`w-full py-3 rounded-2xl font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
            todayChecked
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:brightness-110 text-slate-950 shadow-amber-900/40 cursor-pointer active:scale-98'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{todayChecked ? 'আজকের বোনাস গ্রহণ সম্পন্ন (+৳58)' : '৩য় দিনের এটেন্ডেন্স বোনাস নিন (+৳58)'}</span>
        </button>
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
                  স্পিন করে জিতে নিন সর্বোচ্চ {sym}3,888 ক্যাশ
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
              {availableSpins} স্পিন বাকি
            </span>
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
              {wheelPrizes.map((p, idx) => {
                const angle = (360 / wheelPrizes.length) * idx;
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
          </div>

          <button
            type="button"
            onClick={handleSpinWheel}
            disabled={isSpinning || availableSpins <= 0}
            className={`w-full py-3 rounded-2xl font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
              availableSpins <= 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 hover:brightness-110 text-white shadow-purple-900/50 cursor-pointer active:scale-98'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{isSpinning ? 'স্পিন হচ্ছে...' : `লাকি স্পিন করুন (${availableSpins} বাকি)`}</span>
          </button>
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
                placeholder="গিফট কোড লিখুন (যেমন: HGNICE888)"
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

      {/* Minimum 1000 Deposit Requirement Notice Modal */}
      {showMinDepositNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#091533] border-2 border-amber-500/60 p-6 shadow-2xl text-center space-y-4">
            <button
              type="button"
              onClick={() => setShowMinDepositNotice(false)}
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
                প্রতিদিনের এটেন্ডেন্স, লাকি স্পিন ও একটিভিটি রিওয়ার্ড ক্লেইম করতে হলে প্রতিদিন সর্বনিম্ন <span className="text-amber-400 font-bold font-mono">১,০০০</span> রিচার্জ / প্রজেক্ট সম্পন্ন থাকা বাধ্যতামূলক।
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowMinDepositNotice(false);
                  onOpenDeposit();
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Wallet className="w-4 h-4" />
                <span>এখনই ১০০০ ডিপোজিট করুন</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMinDepositNotice(false)}
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
