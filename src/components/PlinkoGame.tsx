import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Zap,
  RotateCcw,
  PlusCircle,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Currency } from '../types';
import { getCurrencySymbol } from '../utils/currency';
import { sound } from '../utils/audio';

interface PlinkoGameProps {
  userBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  currency: Currency;
  onOpenDeposit: () => void;
  onBackToLobby?: () => void;
}

export function PlinkoGame({
  userBalance,
  onUpdateBalance,
  currency,
  onOpenDeposit,
  onBackToLobby,
}: PlinkoGameProps) {
  const sym = getCurrencySymbol(currency);
  const [betAmount, setBetAmount] = useState<number>(50);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [recentMultipliers, setRecentMultipliers] = useState<number[]>([2, 0.5, 4, 1.5, 9]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Multipliers array for bottom buckets (8 rows)
  const multipliersMap = {
    low: [16, 9, 2, 1.4, 1, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  };

  const currentMultipliers = multipliersMap[riskLevel];

  const handleDropBall = () => {
    if (betAmount > userBalance) {
      alert('Insufficient wallet balance!');
      return;
    }

    sound.playBet();
    onUpdateBalance(userBalance - betAmount);

    // Random outcome from current multipliers
    const randIdx = Math.floor(Math.random() * currentMultipliers.length);
    const winMult = currentMultipliers[randIdx];

    setTimeout(() => {
      sound.playClick();
      const winPayout = Math.round(betAmount * winMult);
      if (winMult >= 2) {
        sound.playWin();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      }
      onUpdateBalance(userBalance + winPayout);
      setRecentMultipliers((prev) => [winMult, ...prev.slice(0, 7)]);
    }, 1200);
  };

  return (
    <div className="space-y-4 rounded-3xl bg-[#091533] border border-blue-500/40 p-5 sm:p-6 shadow-2xl animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-900/60 pb-4">
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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-400 p-0.5 shadow-lg">
            <div className="w-full h-full bg-[#08122c] rounded-[14px] flex items-center justify-center text-purple-300 font-black">
              PL
            </div>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white font-display flex items-center gap-2">
              <span>Plinko 1000X</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40 font-bold">
                PRO MULTIPLIER
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Drop physics balls through the peg pyramid into high multiplier buckets!
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

      {/* Arena Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Controls */}
        <div className="md:col-span-4 rounded-2xl bg-[#08122c] border border-blue-500/30 p-4 space-y-4">
          {/* Bet Stake */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Bet Amount:</span>
              <span className="font-mono text-white font-bold">{sym}{betAmount}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[20, 50, 100, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setBetAmount(amt)}
                  className={`py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                    betAmount === amt
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-[#060e22] text-slate-400 hover:text-white'
                  }`}
                >
                  {sym}{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Level */}
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400">Risk Mode:</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['low', 'medium', 'high'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRiskLevel(r)}
                  className={`py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    riskLevel === r
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                      : 'bg-[#060e22] text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Drop Action */}
          <button
            type="button"
            onClick={handleDropBall}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 hover:brightness-110 text-white font-black text-sm shadow-xl shadow-purple-900/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Zap className="w-4 h-4" />
            <span>DROP BALL ({sym}{betAmount})</span>
          </button>

          {/* Recent Multipliers History */}
          <div className="p-3 rounded-xl bg-[#060e22] border border-blue-500/20 space-y-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Recent Multipliers:</span>
            <div className="flex gap-1 overflow-x-auto py-1">
              {recentMultipliers.map((m, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                    m >= 10
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : m >= 2
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {m}x
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Pegs Pyramid Visual */}
        <div className="md:col-span-8 flex flex-col items-center justify-center p-4 rounded-2xl bg-[#060e22] border border-blue-500/30 space-y-3">
          <div className="flex flex-col items-center gap-2 py-2">
            {[3, 4, 5, 6, 7, 8, 9].map((pegsCount, rowIdx) => (
              <div key={rowIdx} className="flex gap-3 sm:gap-4 justify-center">
                {Array.from({ length: pegsCount }).map((_, pIdx) => (
                  <div
                    key={pIdx}
                    className="w-2.5 h-2.5 rounded-full bg-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Bottom Multiplier Buckets */}
          <div className="flex gap-1 sm:gap-1.5 justify-center overflow-x-auto w-full pt-2">
            {currentMultipliers.map((mult, idx) => (
              <div
                key={idx}
                className={`px-1 sm:px-2 py-1.5 rounded-lg text-center font-mono font-black text-[9px] sm:text-[11px] shrink-0 border ${
                  mult >= 100
                    ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                    : mult >= 10
                    ? 'bg-amber-500 text-slate-950 border-amber-300'
                    : mult >= 2
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-[#11234c] text-slate-300 border-blue-500/30'
                }`}
              >
                {mult}x
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
