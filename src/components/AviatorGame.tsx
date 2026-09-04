import { useState, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  TrendingUp,
  ArrowLeft,
  Wallet,
  Volume2,
  Plane,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AviatorBet, Currency } from '../types';
import { sound } from '../utils/audio';
import { getRealtimeAviator } from '../utils/gameSync';

interface AviatorGameProps {
  userBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  currency: Currency;
  onOpenDeposit: () => void;
  onBackToLobby?: () => void;
}

export function AviatorGame({
  userBalance,
  onUpdateBalance,
  currency,
  onOpenDeposit,
  onBackToLobby,
}: AviatorGameProps) {
  // Epoch-synchronized Aviator state
  const [aviatorState, setAviatorState] = useState(() => getRealtimeAviator());

  // User Bet state
  const [betAmount, setBetAmount] = useState<number>(100);
  const [betCycleIndex, setBetCycleIndex] = useState<number | null>(null);
  const [hasCashedOut, setHasCashedOut] = useState<boolean>(false);
  const [cashedOutAt, setCashedOutAt] = useState<number | null>(null);
  const [autoCashOut, setAutoCashOut] = useState<boolean>(false);
  const [autoCashOutMultiplier, setAutoCashOutMultiplier] = useState<number>(2.00);

  // Win Celebration Screen
  const [winCelebration, setWinCelebration] = useState<{ amount: number; multiplier: number } | null>(null);

  // Live players simulated feed
  const [liveBets] = useState<AviatorBet[]>([
    { id: '1', user: 'Shakib***', avatar: '😎', betAmount: 500, status: 'in_flight' },
    { id: '2', user: 'Rony***', avatar: '🚀', betAmount: 1000, status: 'in_flight' },
    { id: '3', user: 'Tanvir***', avatar: '🔥', betAmount: 250, status: 'in_flight' },
    { id: '4', user: 'Mizan***', avatar: '💎', betAmount: 2000, status: 'in_flight' },
    { id: '5', user: 'Kamran***', avatar: '⚡', betAmount: 800, status: 'in_flight' },
  ]);

  const getSymbol = (c: Currency) => (c === 'BDT' ? '৳' : c === 'INR' ? '₹' : '$');

  // Real-time Flight Engine Loop (100ms interval for silky smooth curve)
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getRealtimeAviator();

      // Check if crash just happened
      if (aviatorState.status === 'flying' && current.status === 'crashed') {
        sound.playCrash();
      }

      // Check auto cashout
      if (
        betCycleIndex === current.cycleIndex &&
        !hasCashedOut &&
        current.status === 'flying' &&
        autoCashOut &&
        current.currentMultiplier >= autoCashOutMultiplier
      ) {
        handleCashOut(current.currentMultiplier);
      }

      setAviatorState(current);
    }, 100);

    return () => clearInterval(interval);
  }, [aviatorState, betCycleIndex, hasCashedOut, autoCashOut, autoCashOutMultiplier, userBalance]);

  const isUserBetActive = betCycleIndex === aviatorState.cycleIndex && !hasCashedOut;

  const handlePlaceBet = () => {
    if (userBalance < betAmount) {
      sound.playClick();
      alert('অপর্যাপ্ত ব্যালেন্স! অনুগ্রহ করে ওয়ালেটে রিচার্জ করুন।');
      onOpenDeposit();
      return;
    }
    sound.playChip();
    onUpdateBalance(userBalance - betAmount);
    setBetCycleIndex(aviatorState.cycleIndex);
    setHasCashedOut(false);
    setCashedOutAt(null);
  };

  const handleCashOut = (multiplierToUse?: number) => {
    const currentMult = multiplierToUse || aviatorState.currentMultiplier;
    if (!isUserBetActive || aviatorState.status !== 'flying') return;

    sound.playWin();
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    const winPayout = +(betAmount * currentMult).toFixed(2);
    onUpdateBalance(userBalance + winPayout);
    setHasCashedOut(true);
    setCashedOutAt(currentMult);
    setWinCelebration({ amount: winPayout, multiplier: currentMult });
  };

  // Airplane flight visual position calculation
  // Human-like smooth curve: normalized against a gentle 5x scale for screen bounds
  const flightProgress = Math.min(1, Math.max(0, (aviatorState.currentMultiplier - 1.0) / 4.5));
  const planeX = 12 + flightProgress * 72; // % across width
  const planeY = 78 - Math.pow(flightProgress, 0.8) * 58; // % from top
  const planeAngle = Math.min(38, 12 + flightProgress * 25);

  return (
    <div className="w-full space-y-4 animate-in fade-in max-w-4xl mx-auto pb-10">
      {/* Top Header - Standalone Page Navigation */}
      <div className="flex items-center justify-between gap-3 bg-[#08122c] border border-blue-500/30 p-3 sm:p-4 rounded-3xl shadow-xl">
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
            <span className="text-xs sm:text-sm font-black text-white font-display flex items-center gap-1.5">
              <span className="text-red-500">✈️</span> AVIATOR (বিমান)
            </span>
            <span className="text-[10px] text-amber-400 font-mono font-bold">
              রিয়েল-টাইম ফ্লাইট ইঞ্জিন
            </span>
          </div>
        </div>

        {/* Live Balance & Recharge */}
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
            className="px-3 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-md hover:brightness-110 active:scale-95 cursor-pointer"
          >
            ডিপোজিট
          </button>
        </div>
      </div>

      {/* Top Past Multipliers Pill Ribbon */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 px-3 rounded-2xl bg-[#09152e] border border-blue-500/20 scrollbar-none no-scrollbar">
        <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 mr-1 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-sky-400" /> অতীত হিস্ট্রি:
        </span>
        {aviatorState.pastMultipliers.map((m) => (
          <span
            key={m.id}
            className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black shrink-0 transition-all ${
              m.multiplier >= 10
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : m.multiplier >= 2
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-blue-900/40 text-sky-300 border border-blue-500/30'
            }`}
          >
            {m.multiplier.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Main Aviator Canvas Flight Area */}
      <div className="relative w-full h-80 sm:h-96 md:h-[420px] rounded-3xl bg-gradient-to-b from-[#08122c] via-[#091638] to-[#040a18] border-2 border-blue-500/40 p-4 shadow-2xl overflow-hidden flex flex-col justify-between select-none">
        {/* Subtle Aviation Radar Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a8a15_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute inset-0 bg-radial from-blue-600/10 via-transparent to-transparent pointer-events-none" />

        {/* Top Info Bar */}
        <div className="relative z-20 flex items-center justify-between">
          <span className="px-3 py-1 rounded-xl bg-red-600/30 border border-red-500/40 text-red-400 text-xs font-black flex items-center gap-1.5 shadow-sm">
            <Flame className="w-3.5 h-3.5 fill-red-400" /> AVIATOR PRO FLIGHT
          </span>

          <div className="text-xs text-slate-300 font-mono">
            {aviatorState.status === 'flying' ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> আকাশে উড়ছে (IN FLIGHT)
              </span>
            ) : aviatorState.status === 'crashed' ? (
              <span className="text-red-400 font-bold bg-red-950/60 px-2.5 py-1 rounded-xl border border-red-500/30">
                ক্র্যাশড (FLEW AWAY)
              </span>
            ) : (
              <span className="text-sky-300 font-bold bg-blue-950/60 px-2.5 py-1 rounded-xl border border-blue-500/30">
                পরবর্তী রাউন্ড {aviatorState.countdownSec} সেকেন্ডে
              </span>
            )}
          </div>
        </div>

        {/* Center Multiplier Display */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center pointer-events-none">
          {aviatorState.status === 'flying' && (
            <div className="text-center space-y-1 animate-in zoom-in-95">
              <div className="text-6xl sm:text-7xl md:text-8xl font-black font-mono text-white tracking-tighter drop-shadow-[0_0_35px_rgba(56,189,248,0.6)]">
                {aviatorState.currentMultiplier.toFixed(2)}x
              </div>
              <div className="text-xs sm:text-sm text-sky-300 font-bold tracking-wide">
                ✈️ মানবীয় স্বাভাবিক গতিতে উড়ছে...
              </div>
            </div>
          )}

          {aviatorState.status === 'crashed' && (
            <div className="text-center space-y-2 animate-in zoom-in-95">
              <div className="text-5xl sm:text-6xl md:text-7xl font-black font-mono text-red-500 tracking-tight drop-shadow-[0_0_30px_rgba(239,68,68,0.7)]">
                FLEW AWAY!
              </div>
              <div className="text-sm font-mono font-bold text-slate-200 bg-red-950/80 px-4 py-1.5 rounded-full border border-red-500/50 inline-block shadow-lg">
                ক্র্যাশ পয়েন্ট: {aviatorState.currentMultiplier.toFixed(2)}x
              </div>
            </div>
          )}

          {aviatorState.status === 'waiting' && (
            <div className="text-center space-y-3 animate-in zoom-in-95">
              <div className="text-slate-300 text-xs sm:text-sm uppercase font-black tracking-widest">
                পরবর্তী ফ্লাইট প্রস্তুতি নিচ্ছে
              </div>
              <div className="w-18 h-18 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                <span className="font-mono font-black text-white text-2xl">{aviatorState.countdownSec}</span>
              </div>
              <p className="text-[11px] text-slate-400">আপনার বেট প্লেস করুন</p>
            </div>
          )}
        </div>

        {/* Animated Flying Red Airplane with SVG Lift & Vapor Trail */}
        {aviatorState.status === 'flying' && (
          <div
            className="absolute z-30 transition-all duration-100 ease-linear pointer-events-none"
            style={{
              left: `${planeX}%`,
              top: `${planeY}%`,
              transform: `translate(-50%, -50%) rotate(-${planeAngle}deg)`,
            }}
          >
            {/* Jet Thrust Glow */}
            <div className="absolute -left-7 top-1/2 -translate-y-1/2 w-8 h-2 bg-gradient-to-l from-orange-400 via-amber-400 to-transparent blur-[1px] animate-pulse" />
            
            {/* Red Aerodynamic Jet Icon */}
            <svg className="w-12 h-12 sm:w-14 sm:h-14 text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] filter" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </div>
        )}

        {/* Bottom Graphic Trajectory Arc Line */}
        <div className="relative z-10 w-full h-8 flex items-end">
          <div
            style={{ width: `${Math.min((aviatorState.currentMultiplier - 1) * 22, 100)}%` }}
            className="h-2 bg-gradient-to-r from-blue-600 via-sky-400 to-rose-500 shadow-[0_0_15px_#f43f5e] transition-all duration-100 rounded-full"
          />
        </div>
      </div>

      {/* Aviator Bet Controls Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bet Control 1 */}
        <div className="rounded-3xl bg-[#0a1738] border border-blue-500/30 p-4 sm:p-5 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> বেটিং কন্ট্রোল প্যানেল
            </span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCashOut}
                  onChange={(e) => setAutoCashOut(e.target.checked)}
                  className="rounded bg-[#09152e] border-blue-500/40 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span className="font-semibold">অটো ক্যাশআউট (2.00x)</span>
              </label>
            </div>
          </div>

          {/* Amount presets */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 text-xs font-bold font-mono">
                {getSymbol(currency)}
              </span>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
                disabled={isUserBetActive}
                className="w-full bg-[#08122c] border border-blue-500/30 rounded-2xl pl-7 pr-3 py-3 text-sm font-bold font-mono text-white focus:outline-none focus:border-amber-400 shadow-inner"
              />
            </div>

            <div className="grid grid-cols-3 gap-1">
              {[50, 100, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setBetAmount(amt);
                  }}
                  disabled={isUserBetActive}
                  className="px-2 py-2.5 rounded-xl bg-[#11234c] text-xs font-mono font-bold text-slate-200 hover:bg-blue-900/50 hover:text-white transition-all cursor-pointer"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Place Bet or Cash Out Button */}
          {isUserBetActive && aviatorState.status === 'flying' ? (
            <button
              type="button"
              id="aviator-cashout-btn"
              onClick={() => handleCashOut()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-white font-black text-lg shadow-xl shadow-amber-950/60 transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center animate-pulse"
            >
              <span>ক্যাশ আউট করুন (CASH OUT)</span>
              <span className="text-xs font-mono font-bold text-amber-100 mt-0.5">
                {getSymbol(currency)}{(betAmount * aviatorState.currentMultiplier).toFixed(2)} ({aviatorState.currentMultiplier.toFixed(2)}x)
              </span>
            </button>
          ) : hasCashedOut && betCycleIndex === aviatorState.cycleIndex ? (
            <div className="w-full py-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ক্যাশআউট সফল: {cashedOutAt?.toFixed(2)}x (+{getSymbol(currency)}{(betAmount * (cashedOutAt || 1)).toFixed(2)})</span>
            </div>
          ) : (
            <button
              type="button"
              id="aviator-place-bet-btn"
              onClick={handlePlaceBet}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer"
            >
              এই রাউন্ডে বেট করুন ({getSymbol(currency)}{betAmount})
            </button>
          )}
        </div>

        {/* Live Bets by Other Players */}
        <div className="rounded-3xl bg-[#0a1738] border border-blue-500/30 p-4 sm:p-5 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-blue-900/40">
            <span>লাইভ প্লেয়ার বেটিং লিস্ট ({liveBets.length})</span>
            <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> সিনক্রোনাইজড
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {liveBets.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#08122c] border border-blue-500/20 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span>{b.avatar}</span>
                  <span className="font-mono text-slate-300">{b.user}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-200">
                    {getSymbol(currency)}{b.betAmount}
                  </span>
                  <span className="font-mono text-[11px] text-amber-400 font-bold">
                    {aviatorState.status === 'flying' ? `${aviatorState.currentMultiplier.toFixed(2)}x` : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dedicated Win Celebration Screen Modal */}
      {winCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in zoom-in-95">
          <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#060e22] border-2 border-amber-500/60 p-6 text-center shadow-[0_0_60px_rgba(245,158,11,0.35)] space-y-4">
            <button
              type="button"
              onClick={() => setWinCelebration(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400/80 flex items-center justify-center text-4xl mx-auto shadow-lg shadow-amber-950/60 animate-bounce">
              🏆
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/70 px-3 py-1 rounded-full border border-amber-500/40">
                BIG WIN CONGRATULATIONS!
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display mt-1">
                🎉 অভিনন্দন! আপনি জিতেছেন!
              </h2>
              <p className="text-xs text-slate-300">
                এভিয়েটর বিমানে <span className="text-amber-400 font-mono font-black">{winCelebration.multiplier.toFixed(2)}x</span> মাল্টিপ্লায়ারে ক্যাশআউট সম্পন্ন হয়েছে!
              </p>
            </div>

            <div className="py-3 px-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 font-mono font-black text-2xl shadow-inner">
              +{getSymbol(currency)}{winCelebration.amount.toFixed(2)}
            </div>

            <button
              type="button"
              onClick={() => setWinCelebration(null)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-950/50 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              খেলা চালিয়ে যান
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
