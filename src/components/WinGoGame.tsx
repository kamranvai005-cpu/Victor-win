import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WinGoResult, WinGoBet, Currency } from '../types';
import { sound } from '../utils/audio';
import { getRealtimeWinGo, recordLiveBet } from '../utils/gameSync';
import { WinGoHistoryModal } from './WinGoHistoryModal';

interface WinGoGameProps {
  userBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  currency: Currency;
  onOpenDeposit: () => void;
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

  // Synchronized state from wall clock
  const [syncState, setSyncState] = useState(() => getRealtimeWinGo(durationSec, 10));
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Betting state
  const [activeTab, setActiveTab] = useState<'history' | 'chart' | 'mybets'>('history');
  const [selectedBetType, setSelectedBetType] = useState<'color' | 'number' | 'size' | null>(null);
  const [selectedBetValue, setSelectedBetValue] = useState<string | null>(null);
  const [chipAmount, setChipAmount] = useState<number>(50);
  const [chipMultiplier, setChipMultiplier] = useState<number>(1);
  const [showBetDialog, setShowBetDialog] = useState(false);

  // My Bets record
  const [myBets, setMyBets] = useState<WinGoBet[]>([]);
  const [winModalData, setWinModalData] = useState<{ win: boolean; amount: number; num: number; period: string } | null>(null);

  const getSymbol = (c: Currency) => (c === 'BDT' ? '৳' : c === 'INR' ? '₹' : '$');

  // Real-time Clock Sync Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getRealtimeWinGo(durationSec, 10);

      // Check countdown sound
      if (current.timeLeft <= 5 && current.timeLeft >= 1) {
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
              let hasPendingBet = false;

              const updatedBets = prevBets.map((bet) => {
                if (bet.period === endedPeriod && bet.status === 'pending') {
                  hasPendingBet = true;
                  let isWin = false;
                  let payout = 0;

                  if (bet.selectType === 'number') {
                    if (parseInt(bet.selection) === endedDraw.number) {
                      isWin = true;
                      payout = bet.totalStake * 9 * 0.98;
                    }
                  } else if (bet.selectType === 'color') {
                    if (bet.selection === 'violet' && (endedDraw.number === 0 || endedDraw.number === 5)) {
                      isWin = true;
                      payout = bet.totalStake * 4.5 * 0.98;
                    } else if (bet.selection === 'green') {
                      if ([1, 3, 7, 9].includes(endedDraw.number)) {
                        isWin = true;
                        payout = bet.totalStake * 2 * 0.98;
                      } else if (endedDraw.number === 5) {
                        isWin = true;
                        payout = bet.totalStake * 1.5 * 0.98;
                      }
                    } else if (bet.selection === 'red') {
                      if ([2, 4, 6, 8].includes(endedDraw.number)) {
                        isWin = true;
                        payout = bet.totalStake * 2 * 0.98;
                      } else if (endedDraw.number === 0) {
                        isWin = true;
                        payout = bet.totalStake * 1.5 * 0.98;
                      }
                    }
                  } else if (bet.selectType === 'size') {
                    if (bet.selection === endedDraw.size) {
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
                  onUpdateBalance(userBalance + totalWon);
                  setWinModalData({ win: true, amount: totalWon, num: endedDraw.number, period: endedPeriod });
                } else {
                  setWinModalData({ win: false, amount: 0, num: endedDraw.number, period: endedPeriod });
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
  }, [durationSec, userBalance]);

  const handleOpenBet = (type: 'color' | 'number' | 'size', value: string) => {
    if (syncState.isFreeze) return;
    sound.playChip();
    setSelectedBetType(type);
    setSelectedBetValue(value);
    setShowBetDialog(true);
  };

  const handlePlaceBet = () => {
    if (!selectedBetType || !selectedBetValue) return;
    const totalStake = chipAmount * chipMultiplier;

    if (userBalance < totalStake) {
      sound.playClick();
      alert('অপর্যাপ্ত ব্যালেন্স! অনুগ্রহ করে ওয়ালেটে রিচার্জ করুন।');
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
      multiplier: chipMultiplier,
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
      multiplier: chipMultiplier,
      totalStake,
      placedAt: newBet.time,
      timestamp: Date.now(),
      status: 'pending',
    });

    setMyBets((prev) => [newBet, ...prev]);
    setShowBetDialog(false);
  };

  const getBallClass = (num: number, color?: string) => {
    if (num === 0) return 'ball-red-violet text-white';
    if (num === 5) return 'ball-green-violet text-white';
    if ([1, 3, 7, 9].includes(num) || color === 'green') return 'ball-green text-white';
    return 'ball-red text-white';
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const durationLabel = (sec: number) => {
    if (sec === 30) return '30S';
    return `${sec / 60}Min`;
  };

  return (
    <div className="w-full space-y-3 animate-in fade-in text-slate-100 max-w-3xl mx-auto pb-10">
      {/* Top Standalone Header - Purely Market, Balance & Back button */}
      <div className="flex items-center justify-between gap-2 bg-[#08122c] border border-blue-500/30 p-3 sm:p-4 rounded-3xl shadow-xl">
        <div className="flex items-center gap-2">
          {onBackToLobby && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onBackToLobby();
              }}
              className="px-3 py-2 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 border border-blue-400/40 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-amber-300" />
              <span>লবিতে ফিরুন</span>
            </button>
          )}

          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black text-white font-display">
              Win Go {durationLabel(durationSec)}
            </span>
            <span className="text-[10px] text-amber-400 font-mono font-bold">
              মার্কেট লাইভ
            </span>
          </div>
        </div>

        {/* Live Wallet Balance inside Game Header */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#040918] border border-amber-500/40 shadow-inner">
            <Wallet className="w-3.5 h-3.5 text-amber-400" />
            <div className="flex flex-col text-right leading-none">
              <span className="text-[9px] text-slate-400 font-bold uppercase">ব্যালেন্স</span>
              <span className="font-mono font-black text-xs sm:text-sm text-emerald-400">
                {getSymbol(currency)}{userBalance.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenDeposit}
            className="px-3 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-black text-xs flex items-center gap-1 shadow-md cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ডিপোজিট</span>
          </button>
        </div>
      </div>

      {/* Duration Selector Tabs: 30S, 1M, 3M, 5M, 10M */}
      <div className="flex items-center gap-1.5 bg-[#091533] p-1.5 rounded-2xl border border-blue-500/30 overflow-x-auto scrollbar-none justify-between sm:justify-center">
        {[30, 60, 180, 300, 600].map((dur) => (
          <button
            key={dur}
            type="button"
            onClick={() => {
              sound.playClick();
              setDurationSec(dur);
              setSyncState(getRealtimeWinGo(dur));
            }}
            className={`flex-1 max-w-[90px] py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer text-center ${
              durationSec === dur
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black shadow-lg ring-1 ring-yellow-300'
                : 'text-slate-400 hover:text-white bg-[#060e22]'
            }`}
          >
            {durationLabel(dur)}
          </button>
        ))}
      </div>

      {/* Market Board: Live Period, Countdown Timer & Last Draw Ball */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0d1f48] via-[#091533] to-[#0b193d] border border-blue-500/40 p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          {/* Period Info */}
          <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-sky-300 font-bold uppercase">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>বর্তমান পিরিয়ড</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded border border-emerald-500/40 font-mono">
                  LIVE
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-amber-400 mt-0.5 tracking-tight">
                {syncState.period}
              </div>
            </div>

            {/* Last Round Result Ball */}
            {syncState.latestDraw && (
              <div className="flex items-center gap-2 bg-[#040918]/90 px-3 py-1.5 rounded-2xl border border-blue-500/30">
                <span className="text-[10px] text-slate-400 font-bold uppercase">পূর্ববর্তী:</span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm font-mono shadow-md ${getBallClass(
                    syncState.latestDraw.number,
                    syncState.latestDraw.color
                  )}`}
                >
                  {syncState.latestDraw.number}
                </div>
                <span className="text-xs font-bold text-slate-200 uppercase">
                  {syncState.latestDraw.size === 'big' ? 'বিগ' : 'স্মল'}
                </span>
              </div>
            )}
          </div>

          {/* Live Seconds Countdown Display */}
          <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
            <span className="text-[11px] font-bold uppercase text-slate-300">
              অবশিষ্ট সেকেন্ড
            </span>
            <div
              className={`font-mono text-3xl sm:text-4xl font-black tracking-widest px-4 py-1.5 rounded-2xl border shadow-xl ${
                syncState.isFreeze
                  ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.6)]'
                  : 'bg-[#040918] border-amber-500/50 text-amber-400'
              }`}
            >
              {formatSeconds(syncState.timeLeft)}
            </div>
          </div>
        </div>

        {/* 5-Second Freeze Notice */}
        {syncState.isFreeze && (
          <div className="mt-3 py-1.5 px-3 rounded-xl bg-red-600/25 border border-red-500/50 text-red-300 text-xs font-bold text-center animate-pulse">
            ⚠️ সময় শেষ! পিরিয়ড {syncState.period}-এর ড্র ফলাফল ঘোষণা হচ্ছে...
          </div>
        )}
      </div>

      {/* Primary Betting Arena */}
      <div className="rounded-3xl bg-[#0a1738] border border-blue-500/25 p-4 sm:p-5 shadow-2xl space-y-4">
        {/* Colors (Green x2, Violet x4.5, Red x2) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <button
            type="button"
            id="bet-green-btn"
            disabled={syncState.isFreeze}
            onClick={() => handleOpenBet('color', 'green')}
            className="py-3.5 sm:py-4 px-2 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-950/50 border border-emerald-400/40 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex flex-col items-center justify-center"
          >
            <span className="tracking-wide">সবুজ (Green)</span>
            <span className="text-[10px] sm:text-xs font-mono font-semibold text-emerald-100 opacity-90">
              x2 মাল্টিপ্লায়ার
            </span>
          </button>

          <button
            type="button"
            id="bet-violet-btn"
            disabled={syncState.isFreeze}
            onClick={() => handleOpenBet('color', 'violet')}
            className="py-3.5 sm:py-4 px-2 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white font-black text-sm sm:text-base shadow-lg shadow-purple-950/50 border border-purple-400/40 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex flex-col items-center justify-center"
          >
            <span className="tracking-wide">বেগুনী (Violet)</span>
            <span className="text-[10px] sm:text-xs font-mono font-semibold text-purple-100 opacity-90">
              x4.5 মাল্টিপ্লায়ার
            </span>
          </button>

          <button
            type="button"
            id="bet-red-btn"
            disabled={syncState.isFreeze}
            onClick={() => handleOpenBet('color', 'red')}
            className="py-3.5 sm:py-4 px-2 rounded-2xl bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-black text-sm sm:text-base shadow-lg shadow-red-950/50 border border-red-400/40 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex flex-col items-center justify-center"
          >
            <span className="tracking-wide">লাল (Red)</span>
            <span className="text-[10px] sm:text-xs font-mono font-semibold text-red-100 opacity-90">
              x2 মাল্টিপ্লায়ার
            </span>
          </button>
        </div>

        {/* 0 - 9 Numbers (Multiplier 9x!) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold px-1">
            <span>সংখ্যা নির্বাচন (০-৯)</span>
            <span className="text-amber-400 font-bold font-mono">৯ গুণ পেআউট (9X Multiplier)</span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const ballColorClass = getBallClass(num);
              return (
                <button
                  key={num}
                  type="button"
                  id={`bet-num-btn-${num}`}
                  disabled={syncState.isFreeze}
                  onClick={() => handleOpenBet('number', num.toString())}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center font-mono font-black text-lg sm:text-xl shadow-md transition-all active:scale-90 disabled:opacity-40 disabled:pointer-events-none hover:scale-105 cursor-pointer border border-white/20 ${ballColorClass}`}
                >
                  <span>{num}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Big (5-9) & Small (0-4) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            id="bet-big-btn"
            disabled={syncState.isFreeze}
            onClick={() => handleOpenBet('size', 'big')}
            className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-sm sm:text-base shadow-md border border-amber-400/40 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-between cursor-pointer"
          >
            <span>বিগ / Big (৫-৯)</span>
            <span className="font-mono text-xs text-amber-200">x2.0</span>
          </button>

          <button
            type="button"
            id="bet-small-btn"
            disabled={syncState.isFreeze}
            onClick={() => handleOpenBet('size', 'small')}
            className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-extrabold text-sm sm:text-base shadow-md border border-blue-400/40 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-between cursor-pointer"
          >
            <span>স্মল / Small (০-৪)</span>
            <span className="font-mono text-xs text-blue-200">x2.0</span>
          </button>
        </div>
      </div>

      {/* Tabs: Game History / Chart Trend / My Bets */}
      <div className="rounded-3xl bg-[#0a1738] border border-blue-500/25 p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/50 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="wingo-tab-history"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>লাস্ট ১০টি ড্র হিস্ট্রি</span>
            </button>

            <button
              type="button"
              id="wingo-tab-chart"
              onClick={() => setActiveTab('chart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'chart'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>ট্রেন্ড চার্ট</span>
            </button>

            <button
              type="button"
              id="wingo-tab-mybets"
              onClick={() => setActiveTab('mybets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'mybets'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>আমার বেট ({myBets.length})</span>
            </button>
          </div>

          {/* Dedicated Calendar / History Page Icon Button */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowHistoryModal(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/30 text-xs font-bold transition-all cursor-pointer"
            title="দিনের সমস্ত ড্র ফলাফল দেখুন"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>আরও রেজাল্ট (দিন রেকর্ড)</span>
            <ExternalLink className="w-3 h-3 text-amber-400/80" />
          </button>
        </div>

        {/* Tab 1: Game History Table */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-blue-900/40 text-[11px] uppercase">
                    <th className="py-2 px-3 font-semibold">পিরিয়ড</th>
                    <th className="py-2 px-3 font-semibold text-center">সংখ্যা</th>
                    <th className="py-2 px-3 font-semibold text-center">সাইজ</th>
                    <th className="py-2 px-3 font-semibold text-right">কালার</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/20">
                  {syncState.history.slice(0, 10).map((row) => (
                    <tr key={row.period} className="hover:bg-blue-950/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-300">
                        {row.period}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex w-6 h-6 rounded-full items-center justify-center font-bold text-xs font-mono shadow-sm ${getBallClass(
                            row.number,
                            row.color
                          )}`}
                        >
                          {row.number}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            row.size === 'big'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {row.size === 'big' ? 'বিগ' : 'স্মল'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {row.color === 'green' && (
                            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm" title="সবুজ" />
                          )}
                          {row.color === 'red' && (
                            <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-sm" title="লাল" />
                          )}
                          {row.color === 'green-violet' && (
                            <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-purple-500 shadow-sm" title="সবুজ + বেগুনী" />
                          )}
                          {row.color === 'red-violet' && (
                            <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-red-500 to-purple-500 shadow-sm" title="লাল + বেগুনী" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Button to view more historical pages */}
            <div className="pt-2 flex justify-center border-t border-blue-900/30">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowHistoryModal(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#060e22] hover:bg-blue-900/40 border border-blue-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>আরও বিগত ড্র ফলাফল ও পৃষ্ঠা দেখতে এখানে ক্লিক করুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Chart Trend */}
        {activeTab === 'chart' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>সংখ্যা পুনরাবৃত্তি ফ্রিকোয়েন্সি (সাম্প্রতিক ২৫ রাউন্ড)</span>
              <span className="text-sky-400 font-mono">০ থেকে ৯ বণ্টন</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#08122c] border border-blue-500/20 flex items-end justify-between gap-1 h-32">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                const count = syncState.history.filter((h) => h.number === num).length;
                const heightPercent = Math.max((count / 6) * 100, 15);
                return (
                  <div key={num} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-mono text-slate-400">{count}</span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-md transition-all ${
                        count > 0 ? 'bg-gradient-to-t from-blue-600 to-amber-400' : 'bg-blue-950'
                      }`}
                    />
                    <span className="text-xs font-bold font-mono text-slate-300">{num}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: My Bets Record */}
        {activeTab === 'mybets' && (
          <div className="space-y-2">
            {myBets.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                কোনো বেট রেকর্ড নেই। উপরে আপনার বেট নির্বাচন করুন।
              </div>
            ) : (
              myBets.map((bet) => (
                <div
                  key={bet.id}
                  className="p-3 rounded-2xl bg-[#08122c] border border-blue-500/20 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-200">
                        পিরিয়ড {bet.period}
                      </span>
                      <span className="text-slate-400">({bet.time})</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-slate-400">বেট:</span>
                      <span className="px-1.5 py-0.2 rounded font-bold uppercase bg-blue-900/60 text-amber-300 border border-blue-500/30">
                        {bet.selection}
                      </span>
                      <span className="text-slate-400">পরিমাণ:</span>
                      <span className="font-mono text-slate-200">
                        {getSymbol(currency)}{bet.totalStake}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    {bet.status === 'pending' && (
                      <span className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        পেন্ডিং
                      </span>
                    )}
                    {bet.status === 'won' && (
                      <div className="flex flex-col items-end">
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> জয়ী
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          +{getSymbol(currency)}{bet.winAmount?.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {bet.status === 'lost' && (
                      <span className="flex items-center gap-1 text-red-400 font-bold">
                        <XCircle className="w-3.5 h-3.5" /> পরাজয়
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Place Bet Dialog Modal */}
      {showBetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#0c1b3d] border border-blue-500/40 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-2">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>বেট কনফার্ম করুন - Win Go {durationLabel(durationSec)}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowBetDialog(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#08122c] border border-blue-500/20 flex items-center justify-between">
              <span className="text-xs text-slate-300">নির্বাচিত অপশন:</span>
              <span className="text-sm font-extrabold uppercase font-mono px-3 py-0.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40">
                {selectedBetValue}
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs text-slate-400">পরিমাণ নির্ধারণ</span>
              <div className="grid grid-cols-5 gap-1.5">
                {[10, 50, 100, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      sound.playChip();
                      setChipAmount(amt);
                    }}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      chipAmount === amt
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'bg-[#112450] text-slate-300 hover:bg-blue-900/50'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs text-slate-400">গুণক সংখ্যা (Multiplier)</span>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 5, 10, 20, 50].map((mul) => (
                  <button
                    key={mul}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setChipMultiplier(mul);
                    }}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      chipMultiplier === mul
                        ? 'bg-emerald-500 text-white font-black shadow-md'
                        : 'bg-[#112450] text-slate-300 hover:bg-blue-900/50'
                    }`}
                  >
                    X{mul}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-blue-900/40 flex items-center justify-between text-xs">
              <span className="text-slate-300">মোট বেট পরিমাণ:</span>
              <span className="text-base font-black font-mono text-amber-400">
                {getSymbol(currency)}{(chipAmount * chipMultiplier).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBetDialog(false)}
                className="py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                বাতিল
              </button>
              <button
                type="button"
                id="confirm-place-bet-btn"
                onClick={handlePlaceBet}
                className="py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:brightness-110 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/50 cursor-pointer"
              >
                বেট প্লেস করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Round Result Alert Modal */}
      {winModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in zoom-in-95">
          <div className="w-full max-w-xs rounded-3xl bg-[#0b1736] border border-blue-500/50 p-5 text-center shadow-2xl space-y-3">
            <div className="text-3xl">
              {winModalData.win ? '🎉' : '🎲'}
            </div>
            <h3 className="text-lg font-black text-white font-display">
              {winModalData.win ? 'অভিনন্দন! আপনি জিতেছেন!' : 'রাউন্ড সম্পন্ন'}
            </h3>
            <p className="text-xs text-slate-300">
              পিরিয়ড {winModalData.period}-এর ড্র ফলাফল: <span className="font-bold text-amber-300 font-mono text-sm">সংখ্যা {winModalData.num}</span>
            </p>

            {winModalData.win && (
              <div className="py-2 px-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono font-black text-xl">
                +{getSymbol(currency)}{winModalData.amount.toFixed(2)}
              </div>
            )}

            <button
              type="button"
              onClick={() => setWinModalData(null)}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
            >
              খেলা চালিয়ে যান
            </button>
          </div>
        </div>
      )}

      {/* Full Draw History Paginated Modal Page */}
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
