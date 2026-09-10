import { useState, useEffect, useRef } from 'react';
import {
  Clock,
  TrendingUp,
  History,
  UserCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowLeft,
  Wallet,
  PlusCircle,
  Calendar,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WinGoResult, WinGoBet, Currency } from '../types';
import { sound } from '../utils/audio';
import { getRealtimeWinGo, recordLiveBet } from '../utils/gameSync';
import { WinGoHistoryModal } from './WinGoHistoryModal';
import { WINGO_ASSETS, getBallImage } from '../utils/wingoAssets';

interface WinGoGameProps {
  userBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  currency: Currency;
  onOpenDeposit: () => void;
  onOpenWithdraw?: () => void;
  onBackToLobby?: () => void;
  initialDuration?: number;
  userPhone?: string;
  userName?: string;
  userUid?: string;
}

export function WinGoGame({
  userBalance,
  onUpdateBalance,
  currency,
  onOpenDeposit,
  onOpenWithdraw,
  onBackToLobby,
  initialDuration = 30,
  userPhone = '01712345678',
  userName = 'Player_8892',
  userUid = 'VW889241',
}: WinGoGameProps) {
  // active duration in seconds: 30, 60, 180, 300, 600
  const [durationSec, setDurationSec] = useState<number>(
    initialDuration === 1 ? 60 : initialDuration === 3 ? 180 : initialDuration === 5 ? 300 : initialDuration === 10 ? 600 : 30
  );

  const userBalanceRef = useRef(userBalance);
  useEffect(() => {
    userBalanceRef.current = userBalance;
  }, [userBalance]);

  // Synchronized state from wall clock
  const [syncState, setSyncState] = useState(() => getRealtimeWinGo(durationSec, 10));
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Betting state
  const [activeTab, setActiveTab] = useState<'history' | 'chart' | 'mybets'>('history');
  const [selectedBetType, setSelectedBetType] = useState<'color' | 'number' | 'size' | null>(null);
  const [selectedBetValue, setSelectedBetValue] = useState<string | null>(null);
  const [chipAmount, setChipAmount] = useState<number>(10);
  const [chipMultiplier, setChipMultiplier] = useState<number>(1);
  const [betQuantity, setBetQuantity] = useState<number>(1);
  const [showBetDialog, setShowBetDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [agreeRules, setAgreeRules] = useState(true);

  // My Bets record
  const [myBets, setMyBets] = useState<WinGoBet[]>([]);
  const [winModalData, setWinModalData] = useState<{
    win: boolean;
    amount: number;
    num: number;
    color: string;
    size: string;
    period: string;
    stake: number;
    selection?: string;
  } | null>(null);

  const getSymbol = (c: Currency) => (c === 'BDT' ? '৳' : c === 'INR' ? '₹' : '$');
  const sym = getSymbol(currency);

  const durationName = (sec: number) => {
    if (sec === 30) return 'WinGo 30sec';
    if (sec === 60) return 'WinGo 1 Min';
    if (sec === 180) return 'WinGo 3 Min';
    if (sec === 300) return 'WinGo 5 Min';
    return `WinGo ${sec / 60} Min`;
  };

  // Real-time Clock Sync Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getRealtimeWinGo(durationSec, 10);

      // Check countdown sound - only if page is visible and active
      if (typeof document !== 'undefined' && !document.hidden && current.timeLeft <= 5 && current.timeLeft >= 1) {
        sound.playCountdown();
      }

      // Check if period changed from previous round
      setSyncState((prev) => {
        if (prev.period !== current.period) {
          const endedPeriod = prev.period;
          const endedDraw = current.latestDraw;

          if (endedDraw && endedDraw.period === endedPeriod) {
            setMyBets((prevBets) => {
              let totalWon = 0;
              let totalStakeForRound = 0;
              let hasPendingBet = false;
              const betDescriptions: string[] = [];

              const updatedBets = prevBets.map((bet) => {
                if (bet.period === endedPeriod && bet.status === 'pending') {
                  hasPendingBet = true;
                  totalStakeForRound += bet.totalStake;
                  betDescriptions.push(`${bet.selectType}: ${bet.selection}`);
                  let isWin = false;
                  let payout = 0;

                  const sel = (bet.selection || '').toString().trim().toLowerCase();
                  const endedSize = (endedDraw.size || '').toString().trim().toLowerCase();
                  const endedNum = endedDraw.number;

                  if (bet.selectType === 'number') {
                    const parsedNum = Number(sel);
                    if (!isNaN(parsedNum) && parsedNum === endedNum) {
                      isWin = true;
                      payout = bet.totalStake * 9 * 0.98;
                    }
                  } else if (bet.selectType === 'color') {
                    if (sel === 'violet' && (endedNum === 0 || endedNum === 5)) {
                      isWin = true;
                      payout = bet.totalStake * 4.5 * 0.98;
                    } else if (sel === 'green') {
                      if ([1, 3, 7, 9].includes(endedNum)) {
                        isWin = true;
                        payout = bet.totalStake * 2 * 0.98;
                      } else if (endedNum === 5) {
                        isWin = true;
                        payout = bet.totalStake * 1.5 * 0.98;
                      }
                    } else if (sel === 'red') {
                      if ([2, 4, 6, 8].includes(endedNum)) {
                        isWin = true;
                        payout = bet.totalStake * 2 * 0.98;
                      } else if (endedNum === 0) {
                        isWin = true;
                        payout = bet.totalStake * 1.5 * 0.98;
                      }
                    }
                  } else if (bet.selectType === 'size') {
                    if (sel === endedSize) {
                      isWin = true;
                      payout = bet.totalStake * 2 * 0.98;
                    }
                  }

                  if (isWin) {
                    totalWon += payout;
                    return { ...bet, status: 'won' as const, winAmount: payout };
                  } else {
                    return { ...bet, status: 'lost' as const, winAmount: 0 };
                  }
                }
                return bet;
              });

              if (hasPendingBet) {
                if (totalWon > 0) {
                  sound.playWin();
                  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
                  const newBal = userBalanceRef.current + totalWon;
                  userBalanceRef.current = newBal;
                  onUpdateBalance(newBal);
                  setWinModalData({
                    win: true,
                    amount: totalWon,
                    num: endedDraw.number,
                    color: endedDraw.color,
                    size: endedDraw.size,
                    period: endedPeriod,
                    stake: totalStakeForRound,
                    selection: betDescriptions.join(', '),
                  });
                } else {
                  sound.playLose();
                  setWinModalData({
                    win: false,
                    amount: 0,
                    num: endedDraw.number,
                    color: endedDraw.color,
                    size: endedDraw.size,
                    period: endedPeriod,
                    stake: totalStakeForRound,
                    selection: betDescriptions.join(', '),
                  });
                }
              }

              return updatedBets;
            });
          }
        }
        return current;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [durationSec, onUpdateBalance]);

  // Auto-close win/loss modal after 5 seconds
  useEffect(() => {
    if (winModalData) {
      const timer = setTimeout(() => {
        setWinModalData(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [winModalData]);

  const handleOpenBet = (type: 'color' | 'number' | 'size', value: string) => {
    if (syncState.isFreeze) return;
    sound.playChip();
    setSelectedBetType(type);
    setSelectedBetValue(value);
    setChipAmount(1);
    setBetQuantity(1);
    setChipMultiplier(1);
    setShowBetDialog(true);
  };

  const handlePlaceBet = () => {
    if (!selectedBetType || !selectedBetValue) return;
    const totalStake = chipAmount * betQuantity * chipMultiplier;

    if (userBalance < totalStake) {
      sound.playClick();
      alert('আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই! অনুগ্রহ করে ডিপোজিট করুন।');
      onOpenDeposit();
      return;
    }

    sound.playChip();
    onUpdateBalance(userBalance - totalStake);

    const newBet: WinGoBet = {
      id: `b-${Date.now()}`,
      period: syncState.period,
      selectType: selectedBetType,
      selection: selectedBetValue,
      amount: chipAmount,
      multiplier: chipMultiplier * betQuantity,
      totalStake,
      status: 'pending',
      time: new Date().toTimeString().slice(0, 8),
    };

    // Save to real-time live bet book for automated market control & admin live monitoring
    recordLiveBet({
      id: newBet.id,
      userUid,
      username: userName,
      phone: userPhone,
      gameType: 'wingo',
      period: syncState.period,
      selectType: selectedBetType,
      selection: selectedBetValue,
      amount: chipAmount,
      multiplier: chipMultiplier * betQuantity,
      totalStake,
      placedAt: newBet.time,
      timestamp: Date.now(),
      status: 'pending',
    });

    setMyBets((prev) => [newBet, ...prev]);
    setShowBetDialog(false);
  };

  const getDigits = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    const minStr = mins.toString().padStart(2, '0');
    const secStr = secs.toString().padStart(2, '0');
    return {
      m1: minStr[0],
      m2: minStr[1],
      s1: secStr[0],
      s2: secStr[1],
    };
  };

  const digits = getDigits(syncState.timeLeft);
  const totalBetAmount = chipAmount * betQuantity * chipMultiplier;

  return (
    <div className="fixed inset-0 z-50 bg-[#f4f6fa] text-slate-900 overflow-y-auto font-sans select-none flex flex-col animate-in fade-in">
      {/* 1. Header (VICTOR WIN Full-Screen Header) */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-[#f15252] to-[#d63031] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          {onBackToLobby && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onBackToLobby();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/15 hover:bg-black/25 text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
              title="লবিতে ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">লবিতে ব্যাক</span>
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black italic tracking-wider text-white">
              VICTOR <span className="text-amber-300">WIN</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-white font-bold border border-white/30 hidden sm:inline">
              Win Go মার্কেট
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => sound.playClick()}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-sm cursor-pointer transition-transform active:scale-90"
            title="সার্ভিস"
          >
            🎧
          </button>
          <button
            type="button"
            onClick={() => sound.playClick()}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-sm cursor-pointer transition-transform active:scale-90"
            title="সাউন্ড"
          >
            🔊
          </button>
        </div>
      </div>

      {/* Main Centered Content Container for Full-Screen Layout */}
      <div className="flex-1 w-full max-w-xl mx-auto pb-16 space-y-3 px-2 sm:px-4">
        {/* 2. Wallet Card (High-Contrast Solid Pure Black Balance) */}
        <div className="mt-3 p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden text-center">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            মোট ওয়ালেট ব্যালেন্স (Wallet Balance)
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-black font-mono text-black">{sym}</span>
            <span className="text-3xl sm:text-4xl font-black font-mono text-black tracking-tight">
              {userBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsRefreshing(true);
                setTimeout(() => setIsRefreshing(false), 600);
              }}
              className="cursor-pointer active:scale-85 transition-transform p-1.5 rounded-full hover:bg-slate-100 ml-1 text-slate-700 hover:text-black"
              title="ব্যালেন্স রিফ্রেশ"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>

          <div className="w-full flex gap-3 mt-4">
            <button
              type="button"
              onClick={onOpenWithdraw}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm shadow-md shadow-red-500/20 transition-all active:scale-95 cursor-pointer text-center"
            >
              উইথড্র (Withdraw)
            </button>
            <button
              type="button"
              onClick={onOpenDeposit}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-sm shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer text-center"
            >
              ডিপোজিট (Deposit)
            </button>
          </div>
        </div>

        {/* 3. Notice Bar */}
        <div className="bg-[#fff0f0] px-3 py-2 rounded-xl flex items-center justify-between text-xs text-slate-700 shadow-sm border border-red-100">
          <div className="overflow-hidden whitespace-nowrap text-ellipsis mr-2 flex-1 font-medium">
            🔔 প্রিয় প্লেয়ার, ভিক্টর উইন (Victor Win) প্ল্যাটফর্মে আপনাকে স্বাগতম। ২৪/৭ অফিসিয়াল সেবা চালু রয়েছে।
          </div>
          <button
            type="button"
            onClick={() => sound.playClick()}
            className="bg-transparent text-[#f15252] border border-[#f15252] px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer hover:bg-red-50"
          >
            🔥 লাইভ সাপোর্ট
          </button>
        </div>

        {/* 4. Game Modes Tab (4 Modes: 30sec, 1 Min, 3 Min, 5 Min) */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { sec: 30, label: 'WinGo 30sec' },
            { sec: 60, label: 'WinGo 1 Min' },
            { sec: 180, label: 'WinGo 3 Min' },
            { sec: 300, label: 'WinGo 5 Min' },
          ].map((mode) => {
            const isActive = durationSec === mode.sec;
            return (
              <button
                key={mode.sec}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setDurationSec(mode.sec);
                  setSyncState(getRealtimeWinGo(mode.sec));
                }}
                className={`p-2.5 rounded-2xl text-center cursor-pointer flex flex-col items-center justify-center transition-all border ${
                  isActive
                    ? 'bg-gradient-to-r from-[#f15252] to-[#d63031] text-white border-transparent shadow-md scale-102 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <img
                  src={isActive ? WINGO_ASSETS.timeActive : WINGO_ASSETS.timeInactive}
                  alt="Time"
                  className="w-5 h-5 object-contain mb-1"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[11px] font-bold leading-tight line-clamp-1">{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* 5. Control Panel (The Market Stage with 5 Fast Results on Left & Time on Right) */}
        <div
          className="p-4 rounded-3xl text-white shadow-md relative overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: `url(${WINGO_ASSETS.gameMiniBg})` }}
        >
          <div className="flex justify-between items-center">
            {/* Left: How to play & Top 5 Fast Recent Balls */}
            <div>
              <button
                type="button"
                onClick={() => alert('Win Go খেলার নিয়মাবলী:\n১. কালার (Green, Violet, Red), সংখ্যা (০-৯) বা Big/Small-এ বাজি ধরুন।\n২. সংখ্যা মিললে ৯ গুণ পেআউট!\n৩. Big (৫-৯) বা Small (০-৪) মিললে দ্বিগুণ পেআউট!\n৪. শেষ ৫ সেকেন্ডে বাজি লক থাকবে।')}
                className="border border-white/90 text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors"
              >
                📖 How to play
              </button>

              {/* Top 5 Fast Draw Results */}
              <div className="flex items-center gap-1.5 mt-3">
                {syncState.history.slice(0, 5).map((draw, idx) => (
                  <div key={`${draw.period}-${idx}`} className="flex flex-col items-center">
                    <img
                      src={WINGO_ASSETS.balls[draw.number] || getBallImage(draw.number)}
                      alt={`Ball ${draw.number}`}
                      className="w-7 h-7 object-contain drop-shadow hover:scale-110 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Time Remaining & Flip Clock & Period */}
            <div className="text-right">
              <div className="text-[11px] text-white/90 mb-1 font-semibold">Time remaining</div>
              <div className="flex items-center justify-end gap-1">
                <span className="bg-white text-[#f15252] px-2 py-0.5 rounded-lg text-base font-black font-mono shadow-sm">
                  {digits.m1}
                </span>
                <span className="bg-white text-[#f15252] px-2 py-0.5 rounded-lg text-base font-black font-mono shadow-sm">
                  {digits.m2}
                </span>
                <span className="text-white font-bold text-sm px-0.5">:</span>
                <span className="bg-white text-[#f15252] px-2 py-0.5 rounded-lg text-base font-black font-mono shadow-sm">
                  {digits.s1}
                </span>
                <span className="bg-white text-[#f15252] px-2 py-0.5 rounded-lg text-base font-black font-mono shadow-sm">
                  {digits.s2}
                </span>
              </div>
              <div className="text-[11px] text-white/90 font-mono font-bold mt-1.5">
                {syncState.period}
              </div>
            </div>
          </div>
        </div>

        {/* 6. Color Betting Buttons (Green, Violet, Red) */}
        <div className="flex gap-2.5">
          <button
            type="button"
            disabled={syncState.isFreeze}
            onClick={() => handleOpenBet('color', 'Green')}
            className="flex-1 h-14 rounded-2xl text-white font-black text-sm sm:text-base shadow-lg cursor-pointer transition-all active:scale-95 bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700 hover:from-emerald-400 hover:to-green-600 border-2 border-emerald-300/60 shadow-emerald-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-200 border-2 border-white shadow-sm" />
            <span>Green</span>
          </button>
          <button
            type="button"
            disabled={syncState.isFreeze}
            onClick={() => handleOpenBet('color', 'Violet')}
            className="flex-1 h-14 rounded-2xl text-white font-black text-sm sm:text-base shadow-lg cursor-pointer transition-all active:scale-95 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 hover:from-violet-400 hover:to-purple-600 border-2 border-purple-300/60 shadow-purple-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="w-3.5 h-3.5 rounded-full bg-purple-200 border-2 border-white shadow-sm" />
            <span>Violet</span>
          </button>
          <button
            type="button"
            disabled={syncState.isFreeze}
            onClick={() => handleOpenBet('color', 'Red')}
            className="flex-1 h-14 rounded-2xl text-white font-black text-sm sm:text-base shadow-lg cursor-pointer transition-all active:scale-95 bg-gradient-to-br from-rose-500 via-red-600 to-rose-700 hover:from-rose-400 hover:to-red-600 border-2 border-rose-300/60 shadow-rose-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="w-3.5 h-3.5 rounded-full bg-rose-200 border-2 border-white shadow-sm" />
            <span>Red</span>
          </button>
        </div>

        {/* 7. Number Grid (0-9 with Authentic Glossy Balls & Numbers) */}
        <div className="grid grid-cols-5 gap-2.5">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
            const isGreen = [1, 3, 7, 9].includes(num);
            const isRed = [2, 4, 6, 8].includes(num);
            const isZero = num === 0;
            const isFive = num === 5;
            const ballBg = isZero
              ? 'from-rose-600 via-rose-600 to-purple-600'
              : isFive
              ? 'from-emerald-600 via-emerald-600 to-purple-600'
              : isGreen
              ? 'from-emerald-500 to-green-700'
              : 'from-rose-500 to-red-700';

            return (
              <button
                key={num}
                type="button"
                disabled={syncState.isFreeze}
                onClick={() => handleOpenBet('number', num.toString())}
                className="aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-90 hover:scale-105 disabled:opacity-50 relative overflow-hidden group shadow-sm p-1 bg-white border border-slate-200 hover:border-slate-300"
              >
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${ballBg} flex items-center justify-center shadow-inner relative border-2 border-white/70`}>
                  {WINGO_ASSETS.balls[num] ? (
                    <img
                      src={WINGO_ASSETS.balls[num]}
                      alt={`Ball ${num}`}
                      className="w-full h-full object-contain drop-shadow"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <span className="font-black text-white text-base sm:text-lg font-mono drop-shadow absolute inset-0 flex items-center justify-center pointer-events-none">
                    {num}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 8. Big & Small Buttons */}
        <div className="flex gap-2.5">
          <button
            type="button"
            disabled={syncState.isFreeze}
            onClick={() => handleOpenBet('size', 'Big')}
            className="flex-1 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 border border-amber-400/40"
          >
            <span>Big</span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-mono">(৫-৯)</span>
          </button>
          <button
            type="button"
            disabled={syncState.isFreeze}
            onClick={() => handleOpenBet('size', 'Small')}
            className="flex-1 py-3.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-black text-sm sm:text-base rounded-2xl shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 border border-blue-400/40"
          >
            <span>Small</span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-mono">(০-৪)</span>
          </button>
        </div>

      {/* 9. Table Section (Game History 10 Results, Chart, My Bets) */}
      <div className="bg-white mx-3 rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-3">
        {/* Table Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 text-center text-xs font-bold cursor-pointer transition-colors ${
              activeTab === 'history'
                ? 'text-[#f15252] border-b-2 border-[#f15252] bg-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Game history
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className={`flex-1 py-2.5 text-center text-xs font-bold cursor-pointer transition-colors ${
              activeTab === 'chart'
                ? 'text-[#f15252] border-b-2 border-[#f15252] bg-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Chart
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mybets')}
            className={`flex-1 py-2.5 text-center text-xs font-bold cursor-pointer transition-colors ${
              activeTab === 'mybets'
                ? 'text-[#f15252] border-b-2 border-[#f15252] bg-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            My Bets ({myBets.length})
          </button>
        </div>

        {/* Tab 1: Game History (Exactly 10 Rows) */}
        {activeTab === 'history' && (
          <div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#f15252] text-white text-[11px]">
                  <th className="py-2 px-2.5 text-center font-bold">Period</th>
                  <th className="py-2 px-2 text-center font-bold">Number</th>
                  <th className="py-2 px-2 text-center font-bold">Big Small</th>
                  <th className="py-2 px-2 text-center font-bold">Color</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {syncState.history.slice(0, 10).map((row) => {
                  const isZero = row.number === 0;
                  const isFive = row.number === 5;
                  const isGreen = [1, 3, 7, 9].includes(row.number);

                  return (
                    <tr key={row.period} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-2 text-center font-bold text-slate-700 font-mono text-[11px]">
                        {row.period}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-sm">
                        {isZero ? (
                          <span className="bg-gradient-to-r from-[#e74c3c] to-[#9b59b6] bg-clip-text text-transparent font-black">
                            0
                          </span>
                        ) : isFive ? (
                          <span className="bg-gradient-to-r from-[#2ecc71] to-[#9b59b6] bg-clip-text text-transparent font-black">
                            5
                          </span>
                        ) : isGreen ? (
                          <span className="text-[#2ecc71] font-black">{row.number}</span>
                        ) : (
                          <span className="text-[#e74c3c] font-black">{row.number}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center font-semibold text-slate-600">
                        {row.size === 'big' ? 'Big' : 'Small'}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isZero ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-[#e74c3c] inline-block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-[#9b59b6] inline-block" />
                            </>
                          ) : isFive ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-[#2ecc71] inline-block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-[#9b59b6] inline-block" />
                            </>
                          ) : isGreen ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#2ecc71] inline-block" />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#e74c3c] inline-block" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination bar & Button to open full records */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowHistoryModal(true);
                }}
                className="px-3 py-1 rounded bg-[#eaeaea] hover:bg-slate-300 text-slate-700 font-bold cursor-pointer"
              >
                ◁ পূর্ববর্তী
              </button>
              <span className="text-slate-500 font-bold font-mono">1/50</span>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowHistoryModal(true);
                }}
                className="px-3 py-1 rounded bg-[#f15252] hover:bg-[#e04545] text-white font-bold cursor-pointer"
              >
                পরবর্তী ▷
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Chart */}
        {activeTab === 'chart' && (
          <div className="p-3 space-y-2">
            <div className="text-[11px] text-slate-500 font-medium">
              ফ্রিকোয়েন্সি বণ্টন (Frequency 0-9)
            </div>
            <div className="flex items-end justify-between gap-1 h-28 bg-slate-50 p-2 rounded-xl border border-slate-100">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                const count = syncState.history.filter((h) => h.number === num).length;
                const heightPercent = Math.max((count / 5) * 100, 12);
                return (
                  <div key={num} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[9px] font-mono text-slate-500">{count}</span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full rounded-t bg-[#f15252] transition-all"
                    />
                    <span className="text-[10px] font-bold font-mono text-slate-700">{num}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: My Bets */}
        {activeTab === 'mybets' && (
          <div className="p-3 space-y-2">
            {myBets.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                কোনো বেট রেকর্ড নেই। উপরে বাজি নির্বাচন করুন।
              </div>
            ) : (
              myBets.map((bet) => (
                <div
                  key={bet.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-800">{bet.period}</span>
                      <span className="text-[10px] text-slate-400">({bet.time})</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-1.5 py-0.2 rounded bg-red-100 text-[#f15252] font-bold uppercase text-[10px]">
                        {bet.selection}
                      </span>
                      <span className="text-slate-600 font-mono font-bold">
                        {sym}{bet.totalStake.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    {bet.status === 'pending' && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-bold text-[10px]">
                        পেন্ডিং
                      </span>
                    )}
                    {bet.status === 'won' && (
                      <span className="text-[#2ecc71] font-bold font-mono text-xs">
                        +{sym}{bet.winAmount?.toFixed(2)}
                      </span>
                    )}
                    {bet.status === 'lost' && (
                      <span className="text-red-500 font-bold text-[10px]">পরাজয়</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        </div>
      </div>

      {/* 10. Countdown 5-Second Freeze Overlay */}
      {syncState.isFreeze && (
        <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center animate-in fade-in">
          <div className="flex gap-3">
            <div className="bg-white w-24 h-36 sm:w-28 sm:h-44 rounded-2xl flex items-center justify-center text-8xl sm:text-9xl font-black text-[#ff5b5b] shadow-2xl">
              0
            </div>
            <div className="bg-white w-24 h-36 sm:w-28 sm:h-44 rounded-2xl flex items-center justify-center text-8xl sm:text-9xl font-black text-[#ff5b5b] shadow-2xl">
              {syncState.timeLeft}
            </div>
          </div>
        </div>
      )}

      {/* 11. Betting Drawer (Modal with Black Balance Display) */}
      {showBetDialog && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-[1px] animate-in fade-in">
          <div className="bg-white rounded-t-3xl shadow-2xl w-full max-w-xl mx-auto pb-4 animate-in slide-in-from-bottom duration-200 overflow-hidden">
            {/* Drawer Header with dynamic color according to choice */}
            <div
              className={`text-white p-4 text-center relative ${
                selectedBetType === 'color'
                  ? selectedBetValue === 'Green'
                    ? 'bg-emerald-600'
                    : selectedBetValue === 'Violet'
                    ? 'bg-purple-600'
                    : 'bg-rose-600'
                  : selectedBetType === 'size'
                  ? selectedBetValue === 'Big'
                    ? 'bg-amber-600'
                    : 'bg-blue-700'
                  : 'bg-slate-800'
              }`}
            >
              <div className="text-xs font-bold text-white/90 uppercase tracking-wider mb-1">
                {durationName(durationSec)}
              </div>
              <div className="bg-white text-slate-900 px-5 py-1.5 rounded-full inline-block text-sm font-black shadow-md">
                সিলেক্ট: {selectedBetValue}
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-4 space-y-3.5">
              {/* Available balance indicator in SOLID BLACK */}
              <div className="flex items-center justify-between bg-slate-100 px-3.5 py-2.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600">উপলব্ধ ওয়ালেট ব্যালেন্স:</span>
                <span className="text-sm sm:text-base font-black font-mono text-black">
                  {sym}{userBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Balance Unit Selector */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-black">Balance Unit</span>
                <div className="flex gap-1.5">
                  {[1, 10, 100, 1000].map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => {
                        sound.playChip();
                        setChipAmount(unit);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black font-mono cursor-pointer transition-all ${
                        chipAmount === unit
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-black hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-black">Quantity</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      if (betQuantity > 1) setBetQuantity((q) => q - 1);
                    }}
                    className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-black font-black flex items-center justify-center cursor-pointer active:scale-90"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    readOnly
                    value={betQuantity}
                    className="w-12 text-center border border-slate-200 rounded-xl py-1 text-sm font-black text-black bg-slate-50 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setBetQuantity((q) => q + 1);
                    }}
                    className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-black font-black flex items-center justify-center cursor-pointer active:scale-90"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Multiplier Selector */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-black">Multiplier</span>
                <div className="flex gap-1 overflow-x-auto">
                  {[1, 5, 10, 20, 50, 100].map((mul) => (
                    <button
                      key={mul}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setChipMultiplier(mul);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-black font-mono cursor-pointer transition-all ${
                        chipMultiplier === mul
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-black hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      X{mul}
                    </button>
                  ))}
                </div>
              </div>

              {/* Agreement */}
              <div
                className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer"
                onClick={() => setAgreeRules(!agreeRules)}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] text-white transition-colors ${
                    agreeRules ? 'bg-slate-900 border-slate-900' : 'border-slate-300'
                  }`}
                >
                  {agreeRules && '✓'}
                </div>
                <span>I agree 《Pre-sale rules》</span>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowBetDialog(false)}
                  className="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm cursor-pointer transition-colors"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="button"
                  onClick={handlePlaceBet}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-sm shadow-md cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <span>বেট নিশ্চিত করুন</span>
                  <span className="bg-black/25 px-2 py-0.5 rounded text-white font-mono">
                    {sym}{totalBetAmount.toFixed(2)}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 12. Win / Loss Result Popup */}
      {winModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[2px] animate-in fade-in">
          <div
            className={`w-[320px] sm:w-[340px] p-5 rounded-3xl text-center text-white relative shadow-2xl animate-in zoom-in duration-200 border ${
              winModalData.win
                ? 'bg-gradient-to-br from-[#ff5e5e] via-[#ff7a45] to-[#ffaa2b] border-amber-300/40'
                : 'bg-gradient-to-br from-slate-900 via-[#2d1b2d] to-[#40121b] border-rose-500/40'
            }`}
          >
            {/* Top Badge Icon */}
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center -mt-14 mx-auto border-4 border-white shadow-xl text-4xl ${
                winModalData.win
                  ? 'bg-gradient-to-br from-amber-300 to-yellow-500'
                  : 'bg-gradient-to-br from-rose-600 to-red-800'
              }`}
            >
              {winModalData.win ? '🏆' : '💔'}
            </div>

            {/* Title */}
            <div className="text-2xl font-black mt-3 mb-1 tracking-wide">
              {winModalData.win ? 'অভিনন্দন! আপনি জিতেছেন' : 'দুঃখিত! এই রাউন্ডে হার'}
            </div>
            <div className="text-xs text-white/90 font-medium mb-3">
              {winModalData.win ? 'You Won the Round' : 'Better Luck Next Time'}
            </div>

            {/* Receipt Box */}
            <div className="bg-white rounded-2xl p-4 text-slate-800 shadow-inner text-center">
              {winModalData.win ? (
                <>
                  <div className="text-xs font-bold text-emerald-600 uppercase mb-0.5">
                    মোট জয়লাভ (Winning Bonus)
                  </div>
                  <div className="text-3xl font-black text-emerald-600 font-mono mb-2">
                    +{sym}{winModalData.amount.toFixed(2)}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold text-rose-600 uppercase mb-0.5">
                    বাজির পরিমাণ (Stake Lost)
                  </div>
                  <div className="text-3xl font-black text-rose-600 font-mono mb-2">
                    -{sym}{winModalData.stake.toFixed(2)}
                  </div>
                </>
              )}

              {/* Result Details */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-2 space-y-1.5 text-left text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">রাউন্ড (Period):</span>
                  <span className="font-mono font-bold text-slate-800">{winModalData.period}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">ড্রো ফলাফল (Draw):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono font-black flex items-center justify-center text-xs">
                      {winModalData.num}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                        winModalData.color === 'Green'
                          ? 'bg-emerald-600'
                          : winModalData.color === 'Violet'
                          ? 'bg-purple-600'
                          : 'bg-rose-600'
                      }`}
                    >
                      {winModalData.color}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
                      {winModalData.size}
                    </span>
                  </div>
                </div>
                {winModalData.selection && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500 font-medium">আপনার বাজি (Bet):</span>
                    <span className="font-bold text-slate-800">{winModalData.selection}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action button */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setWinModalData(null);
              }}
              className={`w-full mt-4 py-3 rounded-2xl font-black text-sm text-white shadow-lg cursor-pointer transition-all active:scale-98 ${
                winModalData.win
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-700/40'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 shadow-rose-700/40'
              }`}
            >
              {winModalData.win ? 'সংগ্রহ করুন ও চালিয়ে যান' : 'পরবর্তী রাউন্ডে চেষ্টা করুন'}
            </button>

            <div className="text-[11px] text-white/80 mt-2">৫ সেকেন্ডের মধ্যে স্বয়ংক্রিয় বন্ধ হবে</div>

            {/* Close Circle Button */}
            <button
              type="button"
              onClick={() => setWinModalData(null)}
              className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full border-2 border-white text-white flex items-center justify-center text-base cursor-pointer hover:bg-white/20 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 13. Full History Modal */}
      {showHistoryModal && (
        <WinGoHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          durationSeconds={durationSec}
          currency={currency}
        />
      )}
    </div>
  );
}
