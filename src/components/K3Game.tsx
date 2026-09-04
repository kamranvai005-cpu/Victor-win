import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Flame,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Currency, K3Result } from '../types';
import { getCurrencySymbol } from '../utils/currency';
import { sound } from '../utils/audio';

interface K3GameProps {
  userBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  currency: Currency;
  onOpenDeposit: () => void;
  onBackToLobby?: () => void;
  initialDuration?: number;
}

export function K3Game({
  userBalance,
  onUpdateBalance,
  currency,
  onOpenDeposit,
  onBackToLobby,
  initialDuration = 1,
}: K3GameProps) {
  const sym = getCurrencySymbol(currency);

  const [activeDuration, setActiveDuration] = useState<number>(initialDuration);
  const [timeLeft, setTimeLeft] = useState<number>(38);
  const [currentPeriod, setCurrentPeriod] = useState<string>('202608290192');
  const [activeTab, setActiveTab] = useState<'sum' | '2same' | '3same' | 'diff'>('sum');

  // Bet options
  const [selectedBetType, setSelectedBetType] = useState<string>('');
  const [selectedBetValue, setSelectedBetValue] = useState<string>('');
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(1);
  const [baseStake, setBaseStake] = useState<number>(10);
  const [showBetModal, setShowBetModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Dice Result state
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [currentDice, setCurrentDice] = useState<[number, number, number]>([3, 5, 6]);

  // History
  const [history, setHistory] = useState<K3Result[]>([
    { period: '202608290191', dice: [2, 4, 5], sum: 11, size: 'big', parity: 'odd', time: '10:14' },
    { period: '202608290190', dice: [1, 1, 3], sum: 5, size: 'small', parity: 'odd', time: '10:13' },
    { period: '202608290189', dice: [6, 6, 4], sum: 16, size: 'big', parity: 'even', time: '10:12' },
    { period: '202608290188', dice: [3, 3, 3], sum: 9, size: 'small', parity: 'odd', time: '10:11' },
    { period: '202608290187', dice: [2, 6, 5], sum: 13, size: 'big', parity: 'odd', time: '10:10' },
  ]);

  // User active bets
  const [myBets, setMyBets] = useState<Array<{
    id: string;
    period: string;
    type: string;
    value: string;
    amount: number;
    multiplier: number;
    status: 'pending' | 'won' | 'lost';
    payout?: number;
  }>>([]);

  // Timer Tick
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
  }, [activeDuration, currentPeriod, myBets]);

  const handleDrawResult = () => {
    setIsRolling(true);
    sound.playWin();

    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const d3 = Math.floor(Math.random() * 6) + 1;
      const newDice: [number, number, number] = [d1, d2, d3];
      const sum = d1 + d2 + d3;
      const size: 'big' | 'small' = sum >= 11 ? 'big' : 'small';
      const parity: 'odd' | 'even' = sum % 2 === 1 ? 'odd' : 'even';

      setCurrentDice(newDice);
      setIsRolling(false);

      const newRecord: K3Result = {
        period: currentPeriod,
        dice: newDice,
        sum,
        size,
        parity,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setHistory((prev) => [newRecord, ...prev.slice(0, 15)]);

      // Check bets
      let totalWinnings = 0;
      setMyBets((prev) =>
        prev.map((bet) => {
          if (bet.period !== currentPeriod || bet.status !== 'pending') return bet;

          let won = false;
          let odds = 1.98;

          if (bet.type === 'sum_size') {
            if (bet.value === size) won = true;
          } else if (bet.type === 'sum_parity') {
            if (bet.value === parity) won = true;
          } else if (bet.type === 'sum_num') {
            if (parseInt(bet.value) === sum) {
              won = true;
              odds = getSumOdds(sum);
            }
          } else if (bet.type === '3same_any') {
            if (d1 === d2 && d2 === d3) {
              won = true;
              odds = 34.56;
            }
          } else if (bet.type === '3same_single') {
            const targetNum = parseInt(bet.value[0]);
            if (d1 === targetNum && d2 === targetNum && d3 === targetNum) {
              won = true;
              odds = 207.36;
            }
          }

          if (won) {
            const winAmt = Math.round(bet.amount * odds);
            totalWinnings += winAmt;
            return { ...bet, status: 'won', payout: winAmt };
          }
          return { ...bet, status: 'lost', payout: 0 };
        })
      );

      if (totalWinnings > 0) {
        sound.playWin();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        onUpdateBalance(userBalance + totalWinnings);
      }

      // Next period
      setCurrentPeriod((prev) => (BigInt(prev) + 1n).toString());
    }, 1500);
  };

  const getSumOdds = (s: number) => {
    const oddsMap: Record<number, number> = {
      3: 207.36, 4: 69.12, 5: 34.56, 6: 20.74, 7: 13.82, 8: 9.87,
      9: 7.68, 10: 6.91, 11: 6.91, 12: 7.68, 13: 9.87, 14: 13.82,
      15: 20.74, 16: 34.56, 17: 69.12, 18: 207.36
    };
    return oddsMap[s] || 1.98;
  };

  const handleOpenBet = (type: string, value: string) => {
    if (timeLeft <= 5) {
      alert('Betting closed for current round! Please wait for next draw.');
      return;
    }
    sound.playClick();
    setSelectedBetType(type);
    setSelectedBetValue(value);
    setSelectedMultiplier(1);
    setShowBetModal(true);
  };

  const handleConfirmBet = () => {
    const totalAmount = baseStake * selectedMultiplier;
    if (totalAmount > userBalance) {
      alert('Insufficient wallet balance to place bet!');
      return;
    }

    sound.playBet();
    onUpdateBalance(userBalance - totalAmount);

    const newBet = {
      id: 'K3-' + Date.now().toString().slice(-6),
      period: currentPeriod,
      type: selectedBetType,
      value: selectedBetValue,
      amount: totalAmount,
      multiplier: selectedMultiplier,
      status: 'pending' as const,
    };

    setMyBets((prev) => [newBet, ...prev]);
    setShowBetModal(false);
  };

  const diceGlyph = (num: number) => {
    const glyphs = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return glyphs[num - 1] || '⚀';
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Top Game Navigation Header */}
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

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 p-0.5 shadow-lg">
            <div className="w-full h-full bg-[#060e22] rounded-[14px] flex items-center justify-center text-orange-400 text-xl font-black">
              K3
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white font-display flex items-center gap-2">
              <span>K3 Lotre {activeDuration}Min</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold">
                207X TRIPLE
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Authentic 3-dice fast sum lottery
            </p>
          </div>
        </div>

        {/* Balance & Duration Switcher */}
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

      {/* Duration Tab Switcher */}
      <div className="grid grid-cols-4 gap-2 bg-[#091533] p-1.5 rounded-2xl border border-blue-500/30">
        {[1, 3, 5, 10].map((dur) => (
          <button
            key={dur}
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveDuration(dur);
              setTimeLeft(dur * 60 - 15);
            }}
            className={`py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
              activeDuration === dur
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md scale-[1.02]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            K3 {dur}Min
          </button>
        ))}
      </div>

      {/* Live Dice Arena & Timer Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#1c0f2b] via-[#0b1738] to-[#1a1236] border border-orange-500/30 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Period Info */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Current Period
            </span>
            <div className="font-mono text-xl sm:text-2xl font-black text-amber-400">
              {currentPeriod}
            </div>
            <p className="text-xs text-slate-400">
              Previous: <span className="font-bold text-white">Sum {currentDice[0] + currentDice[1] + currentDice[2]}</span> (
              {currentDice[0] + currentDice[1] + currentDice[2] >= 11 ? 'Big' : 'Small'} /{' '}
              {(currentDice[0] + currentDice[1] + currentDice[2]) % 2 === 1 ? 'Odd' : 'Even'})
            </p>
          </div>

          {/* 3D Dice Stage */}
          <div className="flex items-center gap-3 justify-center p-3 rounded-2xl bg-[#060e22]/90 border border-orange-500/30 shadow-inner">
            {currentDice.map((d, i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-rose-400 border-2 border-amber-300 text-white flex items-center justify-center text-3xl font-black shadow-[0_0_15px_rgba(244,63,94,0.5)] ${
                  isRolling ? 'animate-spin' : 'animate-in zoom-in'
                }`}
              >
                {diceGlyph(d)}
              </div>
            ))}
          </div>

          {/* Countdown Clock */}
          <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
            <span className="text-[11px] text-slate-400 font-semibold">Time Remaining</span>
            <div className="flex items-center gap-1.5 font-mono text-2xl sm:text-3xl font-black text-amber-400">
              <Clock className="w-5 h-5 text-amber-400 animate-spin" />
              <span>{Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}</span>
            </div>
            {timeLeft <= 5 && (
              <span className="text-[10px] font-bold text-rose-400 animate-pulse">
                Draw Closing...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Betting Tabs Selection */}
      <div className="flex gap-2 border-b border-blue-900/60 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('sum')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'sum'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow'
              : 'bg-[#08122c] text-slate-400 hover:text-white'
          }`}
        >
          Total Sum (3-18)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('2same')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === '2same'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow'
              : 'bg-[#08122c] text-slate-400 hover:text-white'
          }`}
        >
          2 of the Same
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('3same')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === '3same'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow'
              : 'bg-[#08122c] text-slate-400 hover:text-white'
          }`}
        >
          3 of the Same (207X)
        </button>
      </div>

      {/* Betting Area Body */}
      {activeTab === 'sum' && (
        <div className="space-y-3 bg-[#091533] p-4 rounded-3xl border border-blue-500/30">
          {/* Big / Small / Odd / Even Quick Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenBet('sum_size', 'big')}
              className="py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer flex flex-col items-center"
            >
              <span>BIG (11-18)</span>
              <span className="text-[10px] font-mono opacity-80">1.98X</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenBet('sum_size', 'small')}
              className="py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110 text-white font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer flex flex-col items-center"
            >
              <span>SMALL (3-10)</span>
              <span className="text-[10px] font-mono opacity-80">1.98X</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenBet('sum_parity', 'odd')}
              className="py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer flex flex-col items-center"
            >
              <span>ODD (বিজোড়)</span>
              <span className="text-[10px] font-mono opacity-80">1.98X</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenBet('sum_parity', 'even')}
              className="py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer flex flex-col items-center"
            >
              <span>EVEN (জোড়)</span>
              <span className="text-[10px] font-mono opacity-80">1.98X</span>
            </button>
          </div>

          {/* Sum Numbers Grid (3 to 18) */}
          <div className="space-y-1.5 pt-2">
            <span className="text-xs text-slate-400 font-semibold">Exact Total Sum Numbers:</span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleOpenBet('sum_num', s.toString())}
                  className="p-2.5 rounded-2xl bg-[#060e22] hover:bg-orange-600/30 border border-orange-500/30 hover:border-orange-400 transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 group"
                >
                  <span className="font-mono text-base font-black text-white group-hover:text-amber-300">
                    {s}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400">
                    {getSumOdds(s)}X
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === '3same' && (
        <div className="space-y-3 bg-[#091533] p-4 rounded-3xl border border-blue-500/30">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Any 3 of the Same (Any Triple)</h3>
              <p className="text-xs text-slate-400">If all 3 dice match any number (111, 222, 333, etc.)</p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenBet('3same_any', 'Any 3 Same')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-md cursor-pointer"
            >
              Bet 34.56X
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleOpenBet('3same_single', `${num}${num}${num}`)}
                className="p-3 rounded-2xl bg-[#060e22] border border-orange-500/30 hover:border-orange-400 flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <div className="flex gap-1 text-rose-400 text-lg">
                  <span>{diceGlyph(num)}</span>
                  <span>{diceGlyph(num)}</span>
                  <span>{diceGlyph(num)}</span>
                </div>
                <span className="text-xs font-mono font-bold text-white">{num}{num}{num}</span>
                <span className="text-[10px] font-mono text-amber-400 font-bold">207.36X</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History Records Table */}
      <div className="rounded-3xl bg-[#08122c] border border-blue-500/30 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-blue-900/50 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-white">Draw History</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Recent 10 Periods</span>
        </div>

        <div className="space-y-1.5 overflow-x-auto">
          {history.map((h) => (
            <div
              key={h.period}
              className="p-2.5 rounded-xl bg-[#060e22] border border-blue-500/20 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-400 text-[11px]">{h.period}</span>
                <div className="flex items-center gap-1 text-sm text-rose-400">
                  <span>{diceGlyph(h.dice[0])}</span>
                  <span>{diceGlyph(h.dice[1])}</span>
                  <span>{diceGlyph(h.dice[2])}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono">
                <span className="font-black text-amber-400">Sum: {h.sum}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  h.size === 'big' ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'
                }`}>
                  {h.size.toUpperCase()}
                </span>
                <span className="text-slate-400 text-[11px]">{h.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bet Modal Confirmation */}
      {showBetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#091533] border border-orange-500/40 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-blue-900/50 pb-2">
              <h3 className="text-sm font-bold text-white">Place Bet - K3 Lotre</h3>
              <button
                type="button"
                onClick={() => setShowBetModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#060e22] border border-orange-500/20 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Selection:</span>
                <span className="font-mono font-bold text-amber-400 uppercase">{selectedBetValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Period:</span>
                <span className="font-mono text-slate-300">{currentPeriod}</span>
              </div>
            </div>

            {/* Stake Chips */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-400">Base Stake ({sym}):</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[10, 50, 100, 500].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setBaseStake(s)}
                    className={`py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                      baseStake === s
                        ? 'bg-orange-500 text-slate-950 shadow'
                        : 'bg-[#060e22] text-slate-400 hover:text-white'
                    }`}
                  >
                    {sym}{s}
                  </button>
                ))}
              </div>
            </div>

            {/* Multipliers */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-400">Multiplier:</span>
              <div className="grid grid-cols-5 gap-1">
                {[1, 5, 10, 20, 50].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMultiplier(m)}
                    className={`py-1 rounded-lg font-mono text-xs font-bold transition-all ${
                      selectedMultiplier === m
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-[#060e22] text-slate-400'
                    }`}
                  >
                    {m}X
                  </button>
                ))}
              </div>
            </div>

            {/* Total Stake & Confirm */}
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
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs shadow-lg cursor-pointer"
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
