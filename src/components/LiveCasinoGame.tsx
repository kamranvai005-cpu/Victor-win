import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Volume2,
  RefreshCw,
  Award,
  Crown,
  Radio,
  Flame,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Currency } from '../types';
import { getCurrencySymbol } from '../utils/currency';
import { sound } from '../utils/audio';

interface LiveCasinoGameProps {
  userBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  currency: Currency;
  onOpenDeposit: () => void;
  onBackToLobby?: () => void;
  initialTable?: 'roulette' | 'baccarat' | 'dragon-tiger';
}

const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export function LiveCasinoGame({
  userBalance,
  onUpdateBalance,
  currency,
  onOpenDeposit,
  onBackToLobby,
  initialTable = 'roulette',
}: LiveCasinoGameProps) {
  const sym = getCurrencySymbol(currency);
  const [activeTable, setActiveTable] = useState<'roulette' | 'baccarat' | 'dragon-tiger'>(initialTable);
  const [selectedChip, setSelectedChip] = useState<number>(50);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [winningColor, setWinningColor] = useState<'red' | 'black' | 'green' | null>(null);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [history, setHistory] = useState<{ num: number; color: 'red' | 'black' | 'green' }[]>([
    { num: 32, color: 'red' },
    { num: 15, color: 'black' },
    { num: 19, color: 'red' },
    { num: 0, color: 'green' },
    { num: 26, color: 'black' },
    { num: 7, color: 'red' },
    { num: 11, color: 'black' },
  ]);

  // Baccarat state
  const [baccaratState, setBaccaratState] = useState<{
    playerScore: number;
    bankerScore: number;
    playerCards: string[];
    bankerCards: string[];
    winner: 'player' | 'banker' | 'tie' | null;
  }>({
    playerScore: 8,
    bankerScore: 6,
    playerCards: ['♠️ 5', '♦️ 3'],
    bankerCards: ['♥️ 2', '♣️ 4'],
    winner: 'player',
  });

  const totalBet = Object.values(bets).reduce((a: number, b: number) => a + Number(b), 0) as number;

  const placeBet = (betKey: string) => {
    if (isSpinning) return;
    if (userBalance < totalBet + selectedChip) {
      sound.playFail();
      alert('Insufficient balance! Please deposit to continue.');
      onOpenDeposit();
      return;
    }

    sound.playChip();
    setBets((prev) => ({
      ...prev,
      [betKey]: (prev[betKey] || 0) + selectedChip,
    }));
  };

  const clearBets = () => {
    if (isSpinning) return;
    sound.playClick();
    setBets({});
  };

  const handleSpinRoulette = () => {
    if (isSpinning) return;
    if (totalBet === 0) {
      alert('Please place a bet on the table first!');
      return;
    }
    if (userBalance < totalBet) {
      alert('Insufficient balance!');
      onOpenDeposit();
      return;
    }

    // Deduct balance
    onUpdateBalance(userBalance - totalBet);
    setIsSpinning(true);
    setLastWin(null);
    setWinningNumber(null);
    setWinningColor(null);

    // Random Lightning Multiplier (50x - 500x)
    const isLightning = Math.random() < 0.35;
    const lightningMult = isLightning ? [50, 100, 200, 500][Math.floor(Math.random() * 4)] : 1;
    setMultiplier(lightningMult);

    const randomRot = 1440 + Math.floor(Math.random() * 360);
    setWheelRotation((prev) => prev + randomRot);

    sound.playSpinTick();
    const tickInterval = setInterval(() => {
      sound.playSpinTick();
    }, 120);

    setTimeout(() => {
      clearInterval(tickInterval);
      const chosen = Math.floor(Math.random() * 37); // 0-36
      const color = chosen === 0 ? 'green' : RED_NUMBERS.includes(chosen) ? 'red' : 'black';

      setWinningNumber(chosen);
      setWinningColor(color);
      setIsSpinning(false);
      setHistory((prev) => [{ num: chosen, color }, ...prev.slice(0, 9)]);

      // Calculate Winnings
      let totalWon = 0;

      // Single Number Bet (36x or Lightning)
      if (bets[`num_${chosen}`]) {
        totalWon += bets[`num_${chosen}`] * (lightningMult > 1 ? lightningMult : 36);
      }

      // Color Bets (2x)
      if (color === 'red' && bets['red']) totalWon += bets['red'] * 2;
      if (color === 'black' && bets['black']) totalWon += bets['black'] * 2;

      // Odd / Even (2x)
      if (chosen > 0) {
        if (chosen % 2 === 1 && bets['odd']) totalWon += bets['odd'] * 2;
        if (chosen % 2 === 0 && bets['even']) totalWon += bets['even'] * 2;
        if (chosen <= 18 && bets['1_18']) totalWon += bets['1_18'] * 2;
        if (chosen >= 19 && bets['19_36']) totalWon += bets['19_36'] * 2;
      }

      // Dozens (3x)
      if (chosen >= 1 && chosen <= 12 && bets['1st12']) totalWon += bets['1st12'] * 3;
      if (chosen >= 13 && chosen <= 24 && bets['2nd12']) totalWon += bets['2nd12'] * 3;
      if (chosen >= 25 && chosen <= 36 && bets['3rd12']) totalWon += bets['3rd12'] * 3;

      if (totalWon > 0) {
        sound.playWin();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        onUpdateBalance(userBalance - totalBet + totalWon);
        setLastWin(totalWon);
      } else {
        sound.playFail();
      }
    }, 3200);
  };

  const handlePlayBaccarat = () => {
    if (isSpinning) return;
    if (totalBet === 0) {
      alert('Please place a bet on Player, Banker, or Tie!');
      return;
    }

    onUpdateBalance(userBalance - totalBet);
    setIsSpinning(true);
    setLastWin(null);

    setTimeout(() => {
      const p1 = Math.floor(Math.random() * 9) + 1;
      const p2 = Math.floor(Math.random() * 9) + 1;
      const b1 = Math.floor(Math.random() * 9) + 1;
      const b2 = Math.floor(Math.random() * 9) + 1;

      const pScore = (p1 + p2) % 10;
      const bScore = (b1 + b2) % 10;

      let winner: 'player' | 'banker' | 'tie' = 'player';
      if (pScore > bScore) winner = 'player';
      else if (bScore > pScore) winner = 'banker';
      else winner = 'tie';

      setBaccaratState({
        playerScore: pScore,
        bankerScore: bScore,
        playerCards: [`♠️ ${p1}`, `♦️ ${p2}`],
        bankerCards: [`♥️ ${b1}`, `♣️ ${b2}`],
        winner,
      });

      setIsSpinning(false);

      let totalWon = 0;
      if (winner === 'player' && bets['player']) totalWon += bets['player'] * 2;
      if (winner === 'banker' && bets['banker']) totalWon += bets['banker'] * 1.95;
      if (winner === 'tie' && bets['tie']) totalWon += bets['tie'] * 9;

      if (totalWon > 0) {
        sound.playWin();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        onUpdateBalance(userBalance - totalBet + totalWon);
        setLastWin(totalWon);
      } else {
        sound.playFail();
      }
    }, 2000);
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in pb-8">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#08122c] border border-blue-500/30 p-4 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          {onBackToLobby && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onBackToLobby();
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600 border border-blue-500/40 text-sky-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer mr-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Lobby</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg">
            <div className="w-full h-full bg-[#060e22] rounded-[14px] flex items-center justify-center text-amber-400 font-black text-sm">
              LIVE
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white font-display flex items-center gap-2">
              <span>Evolution Live Studio</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-bold flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse text-red-500" /> LIVE 4K
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Lightning Roulette 500X & Sexy Baccarat VIP
            </p>
          </div>
        </div>

        {/* Table Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-[#091533] p-1.5 rounded-2xl border border-blue-500/30">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTable('roulette');
              setBets({});
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTable === 'roulette'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Roulette 500X
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTable('baccarat');
              setBets({});
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTable === 'baccarat'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👑 Sexy Baccarat
          </button>
        </div>
      </div>

      {/* Main Game Stage */}
      {activeTable === 'roulette' ? (
        <div className="space-y-4">
          {/* Wheel & Live Display Screen */}
          <div className="relative rounded-3xl bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#060e22] border border-blue-500/30 p-5 shadow-2xl overflow-hidden flex flex-col items-center justify-center min-h-[260px]">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)]" />

            {/* Live Dealer Badge & Lightning status */}
            <div className="w-full flex items-center justify-between z-10 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Dealer: Sophia V.
                </span>
                {multiplier > 1 && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-black text-xs animate-bounce flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-amber-400" /> {multiplier}X MULTIPLIER!
                  </span>
                )}
              </div>

              {/* History Bar */}
              <div className="flex items-center gap-1">
                {history.map((h, i) => (
                  <span
                    key={i}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black font-mono shadow-md border ${
                      h.color === 'red'
                        ? 'bg-red-600 border-red-400 text-white'
                        : h.color === 'black'
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-emerald-600 border-emerald-400 text-white'
                    }`}
                  >
                    {h.num}
                  </span>
                ))}
              </div>
            </div>

            {/* Roulette Visual Wheel & Ball Indicator */}
            <div className="relative z-10 flex flex-col items-center my-2">
              <div
                className="w-44 h-44 sm:w-52 sm:h-52 rounded-full border-4 border-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,0.3)] flex items-center justify-center transition-transform duration-[3000ms] ease-out relative bg-[#0a1532]"
                style={{ transform: `rotate(${wheelRotation}deg)` }}
              >
                {/* Inner decorative wheel rings */}
                <div className="w-36 h-36 rounded-full border-2 border-dashed border-sky-400/40 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center shadow-inner">
                    <div className="w-16 h-16 rounded-full bg-[#08122c] flex items-center justify-center font-black text-amber-300 text-xs">
                      {isSpinning ? 'SPINNING' : winningNumber !== null ? `${winningNumber}` : 'READY'}
                    </div>
                  </div>
                </div>

                {/* Simulated Roulette Pockets */}
                <span className="absolute top-2 w-3 h-3 rounded-full bg-emerald-500 shadow-md" />
                <span className="absolute bottom-2 w-3 h-3 rounded-full bg-red-500 shadow-md" />
                <span className="absolute left-2 w-3 h-3 rounded-full bg-slate-900 border border-slate-700 shadow-md" />
                <span className="absolute right-2 w-3 h-3 rounded-full bg-red-500 shadow-md" />
              </div>

              {/* Result Popover */}
              {winningNumber !== null && !isSpinning && (
                <div className="mt-3 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-blue-900/90 to-indigo-900/90 border border-amber-500/50 shadow-2xl flex items-center gap-2 animate-in zoom-in-95">
                  <span className="text-xs text-slate-300">Winning Result:</span>
                  <span
                    className={`px-3 py-1 rounded-xl text-sm font-black font-mono shadow-md ${
                      winningColor === 'red'
                        ? 'bg-red-600 text-white'
                        : winningColor === 'black'
                        ? 'bg-slate-950 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {winningNumber} ({winningColor?.toUpperCase()})
                  </span>
                  {lastWin && lastWin > 0 && (
                    <span className="text-emerald-400 font-bold text-sm ml-2">
                      + {sym}{lastWin.toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Betting Grid Table */}
          <div className="bg-[#091533] border border-blue-500/30 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-400" /> Place Bets on Lightning Table
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Total Stake:</span>
                <span className="text-sm font-black font-mono text-emerald-400">
                  {sym}{totalBet}
                </span>
                {totalBet > 0 && (
                  <button
                    type="button"
                    onClick={clearBets}
                    className="px-2 py-0.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold hover:bg-red-500/30 cursor-pointer ml-2"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Quick Outside Bets (Red, Black, Odd, Even, 1-18, 19-36) */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <button
                type="button"
                onClick={() => placeBet('red')}
                className="py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs shadow-md border border-red-400/40 relative cursor-pointer active:scale-95"
              >
                <span>RED (2X)</span>
                {bets['red'] && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-yellow-400 text-slate-950 text-[10px] font-mono font-black shadow-md">
                    {bets['red']}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => placeBet('black')}
                className="py-3 rounded-2xl bg-gradient-to-r from-slate-900 to-zinc-950 hover:from-slate-800 hover:to-zinc-900 text-white font-black text-xs shadow-md border border-slate-700 relative cursor-pointer active:scale-95"
              >
                <span>BLACK (2X)</span>
                {bets['black'] && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-yellow-400 text-slate-950 text-[10px] font-mono font-black shadow-md">
                    {bets['black']}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => placeBet('even')}
                className="py-3 rounded-2xl bg-[#0f2452] hover:bg-[#163577] border border-blue-500/40 text-sky-200 font-black text-xs shadow-md relative cursor-pointer active:scale-95"
              >
                <span>EVEN (2X)</span>
                {bets['even'] && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-yellow-400 text-slate-950 text-[10px] font-mono font-black shadow-md">
                    {bets['even']}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => placeBet('odd')}
                className="py-3 rounded-2xl bg-[#0f2452] hover:bg-[#163577] border border-blue-500/40 text-sky-200 font-black text-xs shadow-md relative cursor-pointer active:scale-95"
              >
                <span>ODD (2X)</span>
                {bets['odd'] && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-yellow-400 text-slate-950 text-[10px] font-mono font-black shadow-md">
                    {bets['odd']}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => placeBet('1_18')}
                className="py-3 rounded-2xl bg-[#0f2452] hover:bg-[#163577] border border-blue-500/40 text-sky-200 font-black text-xs shadow-md relative cursor-pointer active:scale-95"
              >
                <span>1 - 18 (2X)</span>
                {bets['1_18'] && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-yellow-400 text-slate-950 text-[10px] font-mono font-black shadow-md">
                    {bets['1_18']}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => placeBet('19_36')}
                className="py-3 rounded-2xl bg-[#0f2452] hover:bg-[#163577] border border-blue-500/40 text-sky-200 font-black text-xs shadow-md relative cursor-pointer active:scale-95"
              >
                <span>19 - 36 (2X)</span>
                {bets['19_36'] && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-yellow-400 text-slate-950 text-[10px] font-mono font-black shadow-md">
                    {bets['19_36']}
                  </span>
                )}
              </button>
            </div>

            {/* Straight Up Numbers Grid (0-36) */}
            <div>
              <div className="text-[11px] text-slate-400 mb-1.5 font-bold">Straight Numbers (36X - 500X):</div>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                <button
                  type="button"
                  onClick={() => placeBet('num_0')}
                  className="col-span-6 sm:col-span-12 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs border border-emerald-400 relative cursor-pointer"
                >
                  <span>0 (GREEN 36X)</span>
                  {bets['num_0'] && (
                    <span className="absolute -top-2 -right-1 px-1.5 py-0.2 rounded-full bg-yellow-400 text-slate-950 text-[9px] font-mono font-black">
                      {bets['num_0']}
                    </span>
                  )}
                </button>

                {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => {
                  const isRed = RED_NUMBERS.includes(n);
                  const key = `num_${n}`;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => placeBet(key)}
                      className={`py-2 rounded-xl text-xs font-black font-mono transition-all relative cursor-pointer active:scale-90 ${
                        isRed
                          ? 'bg-red-600/90 hover:bg-red-500 text-white border border-red-400/40'
                          : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
                      }`}
                    >
                      {n}
                      {bets[key] && (
                        <span className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded-full bg-yellow-400 text-slate-950 text-[8px] font-mono font-black shadow-md">
                          {bets[key]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chips Selector & Action Bar */}
            <div className="pt-2 border-t border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {[10, 50, 100, 500, 1000, 5000].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedChip(chip);
                    }}
                    className={`w-10 h-10 rounded-full font-black text-xs font-mono shrink-0 shadow-lg border-2 transition-all cursor-pointer ${
                      selectedChip === chip
                        ? 'border-yellow-300 scale-110 shadow-yellow-500/50 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950'
                        : 'border-blue-500/40 bg-[#0d1f48] text-sky-200 hover:border-sky-400'
                    }`}
                  >
                    {chip >= 1000 ? `${chip / 1000}k` : chip}
                  </button>
                ))}
              </div>

              {/* Spin CTA Button */}
              <button
                type="button"
                onClick={handleSpinRoulette}
                disabled={isSpinning}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-900/40 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 fill-slate-950" />
                <span>{isSpinning ? 'SPINNING WHEEL...' : 'SPIN ROULETTE'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Baccarat Table */
        <div className="space-y-4">
          <div className="relative rounded-3xl bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#060e22] border border-blue-500/30 p-6 shadow-2xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold text-xs flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-pink-400" /> AE Sexy VIP Dealer: Natasha
              </span>
              <span className="text-xs text-slate-400 font-mono">Commission: 0% Super 6</span>
            </div>

            {/* Baccarat Table Board */}
            <div className="w-full max-w-2xl grid grid-cols-2 gap-4 my-4">
              {/* Player Side */}
              <div className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                baccaratState.winner === 'player' ? 'bg-blue-600/20 border-blue-400 shadow-xl' : 'bg-[#0a1532] border-blue-900/60'
              }`}>
                <span className="text-sm font-black text-blue-400 uppercase tracking-wider">PLAYER</span>
                <div className="flex gap-2">
                  {baccaratState.playerCards.map((card, i) => (
                    <div key={i} className="w-12 h-16 rounded-xl bg-white text-slate-900 flex items-center justify-center font-black text-xs shadow-lg border border-slate-300">
                      {card}
                    </div>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-300">Score: {baccaratState.playerScore}</span>
              </div>

              {/* Banker Side */}
              <div className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                baccaratState.winner === 'banker' ? 'bg-red-600/20 border-red-400 shadow-xl' : 'bg-[#0a1532] border-red-900/60'
              }`}>
                <span className="text-sm font-black text-red-400 uppercase tracking-wider">BANKER</span>
                <div className="flex gap-2">
                  {baccaratState.bankerCards.map((card, i) => (
                    <div key={i} className="w-12 h-16 rounded-xl bg-white text-slate-900 flex items-center justify-center font-black text-xs shadow-lg border border-slate-300">
                      {card}
                    </div>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-300">Score: {baccaratState.bankerScore}</span>
              </div>
            </div>

            {/* Result Tag */}
            {baccaratState.winner && (
              <div className="px-4 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm">
                Winner: {baccaratState.winner.toUpperCase()}!
              </div>
            )}
          </div>

          {/* Baccarat Betting Buttons */}
          <div className="bg-[#091533] border border-blue-500/30 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => placeBet('player')}
                className="py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-md border border-blue-400/40 relative cursor-pointer"
              >
                <span>PLAYER (1:1)</span>
                {bets['player'] && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-yellow-400 text-slate-950 text-xs font-mono font-black">
                    {bets['player']}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => placeBet('tie')}
                className="py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md border border-emerald-400/40 relative cursor-pointer"
              >
                <span>TIE (8:1)</span>
                {bets['tie'] && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-yellow-400 text-slate-950 text-xs font-mono font-black">
                    {bets['tie']}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => placeBet('banker')}
                className="py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm shadow-md border border-red-400/40 relative cursor-pointer"
              >
                <span>BANKER (0.95:1)</span>
                {bets['banker'] && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-yellow-400 text-slate-950 text-xs font-mono font-black">
                    {bets['banker']}
                  </span>
                )}
              </button>
            </div>

            {/* Chips & Deal Action */}
            <div className="pt-2 border-t border-blue-900/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {[50, 100, 500, 1000, 5000].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedChip(chip);
                    }}
                    className={`w-10 h-10 rounded-full font-black text-xs font-mono border-2 transition-all cursor-pointer ${
                      selectedChip === chip
                        ? 'border-yellow-300 scale-110 bg-yellow-400 text-slate-950'
                        : 'border-blue-500/40 bg-[#0d1f48] text-sky-200'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handlePlayBaccarat}
                disabled={isSpinning}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSpinning ? 'DEALING...' : 'DEAL CARDS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
