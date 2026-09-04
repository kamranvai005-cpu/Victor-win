import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  HelpCircle,
  TrendingUp,
  PlusCircle,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Currency, FiveDResult } from '../types';
import { getCurrencySymbol } from '../utils/currency';
import { sound } from '../utils/audio';

interface FiveDGameProps {
  userBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  currency: Currency;
  onOpenDeposit: () => void;
  onBackToLobby?: () => void;
  initialDuration?: number;
}

export function FiveDGame({
  userBalance,
  onUpdateBalance,
  currency,
  onOpenDeposit,
  onBackToLobby,
  initialDuration = 1,
}: FiveDGameProps) {
  const sym = getCurrencySymbol(currency);

  const [activeDuration, setActiveDuration] = useState<number>(initialDuration);
  const [timeLeft, setTimeLeft] = useState<number>(25);
  const [currentPeriod, setCurrentPeriod] = useState<string>('202608290501');
  const [activeBallTab, setActiveBallTab] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'SUM'>('A');

  // Bet states
  const [selectedBetType, setSelectedBetType] = useState<string>('');
  const [selectedBetValue, setSelectedBetValue] = useState<string>('');
  const [baseStake, setBaseStake] = useState<number>(10);
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(1);
  const [showBetModal, setShowBetModal] = useState<boolean>(false);

  // Balls state
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentBalls, setCurrentBalls] = useState<[number, number, number, number, number]>([4, 8, 2, 9, 1]);

  // History
  const [history, setHistory] = useState<FiveDResult[]>([
    { period: '202608290500', balls: [5, 2, 7, 1, 9], sum: 24, size: 'big', parity: 'even', time: '10:14' },
    { period: '202608290499', balls: [0, 4, 1, 8, 3], sum: 16, size: 'small', parity: 'even', time: '10:13' },
    { period: '202608290498', balls: [9, 8, 6, 4, 2], sum: 29, size: 'big', parity: 'odd', time: '10:12' },
    { period: '202608290497', balls: [2, 3, 3, 5, 1], sum: 14, size: 'small', parity: 'even', time: '10:11' },
  ]);

  const [myBets, setMyBets] = useState<Array<{
    id: string;
    period: string;
    ball: string;
    value: string;
    amount: number;
    status: 'pending' | 'won' | 'lost';
  }>>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleDrawResult();
          return activeDuration * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeDuration, currentPeriod]);

  const handleDrawResult = () => {
    setIsDrawing(true);
    sound.playWin();

    setTimeout(() => {
      const b1 = Math.floor(Math.random() * 10);
      const b2 = Math.floor(Math.random() * 10);
      const b3 = Math.floor(Math.random() * 10);
      const b4 = Math.floor(Math.random() * 10);
      const b5 = Math.floor(Math.random() * 10);
      const balls: [number, number, number, number, number] = [b1, b2, b3, b4, b5];
      const sum = b1 + b2 + b3 + b4 + b5;
      const size: 'big' | 'small' = sum >= 23 ? 'big' : 'small';
      const parity: 'odd' | 'even' = sum % 2 === 1 ? 'odd' : 'even';

      setCurrentBalls(balls);
      setIsDrawing(false);

      const record: FiveDResult = {
        period: currentPeriod,
        balls,
        sum,
        size,
        parity,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setHistory((prev) => [record, ...prev.slice(0, 15)]);

      // Evaluate bets
      let winTotal = 0;
      setMyBets((prev) =>
        prev.map((bet) => {
          if (bet.period !== currentPeriod || bet.status !== 'pending') return bet;

          let won = false;
          let ballIdx = 0;
          if (bet.ball === 'A') ballIdx = 0;
          if (bet.ball === 'B') ballIdx = 1;
          if (bet.ball === 'C') ballIdx = 2;
          if (bet.ball === 'D') ballIdx = 3;
          if (bet.ball === 'E') ballIdx = 4;

          const targetNum = balls[ballIdx];

          if (bet.value === 'big' && targetNum >= 5) won = true;
          else if (bet.value === 'small' && targetNum < 5) won = true;
          else if (bet.value === 'odd' && targetNum % 2 === 1) won = true;
          else if (bet.value === 'even' && targetNum % 2 === 0) won = true;
          else if (parseInt(bet.value) === targetNum) won = true;

          if (won) {
            const odds = isNaN(parseInt(bet.value)) ? 1.98 : 9.0;
            const payout = Math.round(bet.amount * odds);
            winTotal += payout;
            return { ...bet, status: 'won' };
          }
          return { ...bet, status: 'lost' };
        })
      );

      if (winTotal > 0) {
        sound.playWin();
        confetti({ particleCount: 70, spread: 60 });
        onUpdateBalance(userBalance + winTotal);
      }

      setCurrentPeriod((prev) => (BigInt(prev) + 1n).toString());
    }, 1500);
  };

  const handleOpenBet = (ball: string, value: string) => {
    if (timeLeft <= 5) {
      alert('Betting closed for this round!');
      return;
    }
    sound.playClick();
    setSelectedBetType(ball);
    setSelectedBetValue(value);
    setShowBetModal(true);
  };

  const handleConfirmBet = () => {
    const total = baseStake * selectedMultiplier;
    if (total > userBalance) {
      alert('Insufficient wallet balance!');
      return;
    }

    sound.playBet();
    onUpdateBalance(userBalance - total);

    setMyBets((prev) => [
      {
        id: '5D-' + Date.now().toString().slice(-6),
        period: currentPeriod,
        ball: selectedBetType,
        value: selectedBetValue,
        amount: total,
        status: 'pending',
      },
      ...prev,
    ]);

    setShowBetModal(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#08122c] border border-blue-500/30 p-4 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          {onBackToLobby && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onBackToLobby();
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600 border border-blue-500/40 text-sky-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Lobby</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 p-0.5 shadow-lg">
            <div className="w-full h-full bg-[#060e22] rounded-[14px] flex items-center justify-center text-sky-400 text-lg font-black">
              5D
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white font-display flex items-center gap-2">
              <span>5D Lotre {activeDuration}Min</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold">
                9X BALL ODDS
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              A, B, C, D, E ball lottery draws
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-[#060e22] border border-blue-500/30 font-mono text-xs text-emerald-400 font-bold">
            Balance: {sym}{userBalance.toFixed(2)}
          </div>
          <button
            type="button"
            onClick={onOpenDeposit}
            className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Duration Switcher */}
      <div className="grid grid-cols-4 gap-2 bg-[#091533] p-1.5 rounded-2xl border border-blue-500/30">
        {[1, 3, 5, 10].map((dur) => (
          <button
            key={dur}
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveDuration(dur);
              setTimeLeft(dur * 60 - 20);
            }}
            className={`py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
              activeDuration === dur
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md scale-[1.02]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            5D {dur}Min
          </button>
        ))}
      </div>

      {/* Live 5-Ball Arena Stage */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0a1e3b] via-[#0b1738] to-[#122247] border border-sky-500/30 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Draw Period
            </span>
            <div className="font-mono text-xl sm:text-2xl font-black text-sky-400">
              {currentPeriod}
            </div>
            <p className="text-xs text-slate-400">
              Total Sum: <span className="font-bold text-white">{currentBalls.reduce((a, b) => a + b, 0)}</span> (
              {currentBalls.reduce((a, b) => a + b, 0) >= 23 ? 'Big' : 'Small'})
            </p>
          </div>

          {/* 5 Ball Spheres */}
          <div className="flex items-center gap-2 sm:gap-3 justify-center p-3 rounded-2xl bg-[#060e22]/90 border border-sky-500/30 shadow-inner">
            {['A', 'B', 'C', 'D', 'E'].map((label, idx) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400">{label}</span>
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr ${
                    idx % 2 === 0
                      ? 'from-sky-600 via-sky-400 to-indigo-400'
                      : 'from-amber-600 via-amber-400 to-orange-400'
                  } border-2 border-white/60 text-white font-mono font-black text-xl flex items-center justify-center shadow-lg ${
                    isDrawing ? 'animate-bounce' : 'animate-in zoom-in'
                  }`}
                >
                  {currentBalls[idx]}
                </div>
              </div>
            ))}
          </div>

          {/* Countdown Clock */}
          <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
            <span className="text-[11px] text-slate-400 font-semibold">Remaining</span>
            <div className="flex items-center gap-1.5 font-mono text-2xl sm:text-3xl font-black text-sky-400">
              <Clock className="w-5 h-5 text-sky-400 animate-spin" />
              <span>{Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ball Tab Selection: A, B, C, D, E, SUM */}
      <div className="flex gap-2 border-b border-blue-900/60 pb-2 overflow-x-auto">
        {(['A', 'B', 'C', 'D', 'E', 'SUM'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveBallTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeBallTab === tab
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow'
                : 'bg-[#08122c] text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'SUM' ? 'Total Sum' : `Ball ${tab}`}
          </button>
        ))}
      </div>

      {/* Betting Section */}
      <div className="space-y-4 bg-[#091533] p-4 rounded-3xl border border-blue-500/30">
        {/* Quick Sizes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleOpenBet(activeBallTab, 'big')}
            className="py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow cursor-pointer active:scale-95 flex flex-col items-center"
          >
            <span>BIG (5-9)</span>
            <span className="text-[10px] opacity-80 font-mono">1.98X</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenBet(activeBallTab, 'small')}
            className="py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-xs shadow cursor-pointer active:scale-95 flex flex-col items-center"
          >
            <span>SMALL (0-4)</span>
            <span className="text-[10px] opacity-80 font-mono">1.98X</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenBet(activeBallTab, 'odd')}
            className="py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow cursor-pointer active:scale-95 flex flex-col items-center"
          >
            <span>ODD (1,3,5,7,9)</span>
            <span className="text-[10px] opacity-80 font-mono">1.98X</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenBet(activeBallTab, 'even')}
            className="py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shadow cursor-pointer active:scale-95 flex flex-col items-center"
          >
            <span>EVEN (0,2,4,6,8)</span>
            <span className="text-[10px] opacity-80 font-mono">1.98X</span>
          </button>
        </div>

        {/* Numbers 0 to 9 */}
        <div className="space-y-1.5">
          <span className="text-xs text-slate-400 font-semibold">Select Exact Ball Number (0-9) - 9X Multiplier:</span>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleOpenBet(activeBallTab, num.toString())}
                className="p-3 rounded-2xl bg-[#060e22] hover:bg-sky-600/30 border border-sky-500/30 hover:border-sky-400 transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 group"
              >
                <span className="font-mono text-lg font-black text-white group-hover:text-sky-300">
                  {num}
                </span>
                <span className="text-[9px] font-mono text-sky-400 font-bold">
                  9.0X
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="rounded-3xl bg-[#08122c] border border-blue-500/30 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-blue-900/50 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">5D Draw History</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Recent 10 Periods</span>
        </div>

        <div className="space-y-1.5">
          {history.map((h) => (
            <div
              key={h.period}
              className="p-2.5 rounded-xl bg-[#060e22] border border-blue-500/20 flex items-center justify-between text-xs"
            >
              <span className="font-mono text-slate-400 text-[11px]">{h.period}</span>
              <div className="flex items-center gap-1.5 font-mono font-black">
                {h.balls.map((b, i) => (
                  <span key={i} className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center justify-center text-xs">
                    {b}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-amber-400">Sum {h.sum}</span>
                <span className="text-slate-400 text-[11px]">{h.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bet Modal */}
      {showBetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#091533] border border-sky-500/40 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-blue-900/50 pb-2">
              <h3 className="text-sm font-bold text-white">Place Bet - 5D Lotre</h3>
              <button
                type="button"
                onClick={() => setShowBetModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#060e22] border border-sky-500/20 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Ball Target:</span>
                <span className="font-mono font-bold text-sky-400 uppercase">Ball {selectedBetType} - {selectedBetValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Period:</span>
                <span className="font-mono text-slate-300">{currentPeriod}</span>
              </div>
            </div>

            {/* Stake */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-400">Base Stake ({sym}):</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[10, 50, 100, 500].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setBaseStake(s)}
                    className={`py-1.5 rounded-xl font-mono text-xs font-bold ${
                      baseStake === s
                        ? 'bg-sky-500 text-slate-950 font-black'
                        : 'bg-[#060e22] text-slate-400 hover:text-white'
                    }`}
                  >
                    {sym}{s}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-blue-900/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Total Stake</span>
                <span className="text-base font-black font-mono text-emerald-400">
                  {sym}{baseStake * selectedMultiplier}
                </span>
              </div>
              <button
                type="button"
                onClick={handleConfirmBet}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-xs shadow-lg cursor-pointer"
              >
                Confirm Bet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
