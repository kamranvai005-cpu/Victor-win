import React, { useState } from 'react';
import {
  Bomb,
  Gem,
  DollarSign,
  Sparkles,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  Award,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Currency } from '../types';
import { getCurrencySymbol } from '../utils/currency';
import { sound } from '../utils/audio';

interface MinesGameProps {
  userBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  currency: Currency;
  onOpenDeposit: () => void;
  onBackToLobby?: () => void;
}

export function MinesGame({
  userBalance,
  onUpdateBalance,
  currency,
  onOpenDeposit,
  onBackToLobby,
}: MinesGameProps) {
  const sym = getCurrencySymbol(currency);

  const [betAmount, setBetAmount] = useState<number>(50);
  const [mineCount, setMineCount] = useState<number>(3);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [revealedCells, setRevealedCells] = useState<boolean[]>(Array(25).fill(false));
  const [mineGrid, setMineGrid] = useState<boolean[]>(Array(25).fill(false));
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gemsFound, setGemsFound] = useState<number>(0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);

  // Multiplier calculation based on mines and gems
  const calculateMultiplier = (mines: number, gems: number) => {
    let mult = 1;
    for (let i = 0; i < gems; i++) {
      mult *= (25 - i) / (25 - mines - i);
    }
    return Math.max(1, parseFloat((mult * 0.98).toFixed(2)));
  };

  const handleStartGame = () => {
    if (betAmount > userBalance) {
      alert('Insufficient wallet balance!');
      return;
    }

    sound.playBet();
    onUpdateBalance(userBalance - betAmount);

    // Generate random mines
    const grid = Array(25).fill(false);
    let placed = 0;
    while (placed < mineCount) {
      const idx = Math.floor(Math.random() * 25);
      if (!grid[idx]) {
        grid[idx] = true;
        placed++;
      }
    }

    setMineGrid(grid);
    setRevealedCells(Array(25).fill(false));
    setGemsFound(0);
    setCurrentMultiplier(1.0);
    setGameOver(false);
    setGameActive(true);
  };

  const handleCellClick = (idx: number) => {
    if (!gameActive || revealedCells[idx] || gameOver) return;

    const newRevealed = [...revealedCells];
    newRevealed[idx] = true;
    setRevealedCells(newRevealed);

    if (mineGrid[idx]) {
      // Hit mine -> Loss
      sound.playLose();
      setGameOver(true);
      setGameActive(false);
      // Reveal all
      setRevealedCells(Array(25).fill(true));
    } else {
      // Hit gem -> Win
      sound.playClick();
      const newGems = gemsFound + 1;
      setGemsFound(newGems);
      const newMult = calculateMultiplier(mineCount, newGems);
      setCurrentMultiplier(newMult);

      if (newGems === 25 - mineCount) {
        // Found all gems!
        handleCashOut();
      }
    }
  };

  const handleCashOut = () => {
    if (!gameActive || gameOver || gemsFound === 0) return;

    const winAmount = Math.round(betAmount * currentMultiplier);
    sound.playWin();
    confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
    onUpdateBalance(userBalance + winAmount);

    setGameOver(true);
    setGameActive(false);
    setRevealedCells(Array(25).fill(true));
  };

  return (
    <div className="space-y-4 rounded-3xl bg-[#091533] border border-blue-500/40 p-5 sm:p-6 shadow-2xl animate-in fade-in">
      {/* Game Header */}
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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-lg">
            <div className="w-full h-full bg-[#08122c] rounded-[14px] flex items-center justify-center text-amber-400">
              <Gem className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white font-display flex items-center gap-2">
              <span>Mines Pro (Original)</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
                HOT 99% RTP
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Find the hidden emerald gems and cash out before hitting a mine!
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
            className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Game Arena */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left: Controls Panel */}
        <div className="md:col-span-4 rounded-2xl bg-[#08122c] border border-blue-500/30 p-4 space-y-4">
          {/* Bet Amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Bet Stake:</span>
              <span className="font-mono text-white font-bold">{sym}{betAmount}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[20, 50, 100, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  disabled={gameActive}
                  onClick={() => setBetAmount(amt)}
                  className={`py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                    betAmount === amt
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-[#060e22] text-slate-400 hover:text-white'
                  }`}
                >
                  {sym}{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Mines Count Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Number of Mines:</span>
              <span className="font-mono text-rose-400 font-bold">{mineCount} Mines</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 3, 5, 10].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  disabled={gameActive}
                  onClick={() => setMineCount(cnt)}
                  className={`py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                    mineCount === cnt
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-[#060e22] text-slate-400 hover:text-white'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Multiplier / Next Gem Info */}
          <div className="p-3 rounded-xl bg-[#060e22] border border-blue-500/20 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Current Multiplier:</span>
              <span className="font-mono font-black text-amber-400">{currentMultiplier}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gems Uncovered:</span>
              <span className="font-mono font-bold text-emerald-400">{gemsFound} / {25 - mineCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Potential Payout:</span>
              <span className="font-mono font-black text-emerald-400">
                {sym}{(betAmount * currentMultiplier).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Button: Start Bet or Cash Out */}
          {!gameActive ? (
            <button
              type="button"
              onClick={handleStartGame}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-black text-sm shadow-xl shadow-emerald-900/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>START GAME ({sym}{betAmount})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCashOut}
              disabled={gemsFound === 0}
              className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
                gemsFound > 0
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-amber-900/50'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>
                CASH OUT {sym}{(betAmount * currentMultiplier).toFixed(2)} ({currentMultiplier}x)
              </span>
            </button>
          )}
        </div>

        {/* Right: 5x5 Mine Grid */}
        <div className="md:col-span-8 flex flex-col items-center justify-center">
          <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5 p-4 rounded-3xl bg-[#060e22] border border-blue-500/30 shadow-inner max-w-md w-full">
            {Array.from({ length: 25 }).map((_, idx) => {
              const isRevealed = revealedCells[idx];
              const isMine = mineGrid[idx];

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleCellClick(idx)}
                  disabled={!gameActive || isRevealed}
                  className={`aspect-square rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer select-none text-xl sm:text-2xl ${
                    !isRevealed
                      ? 'bg-gradient-to-b from-[#11234c] to-[#091533] border-blue-500/40 hover:border-sky-400 hover:scale-105 shadow-md'
                      : isMine
                      ? 'bg-gradient-to-b from-rose-900 to-rose-950 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-bounce'
                      : 'bg-gradient-to-b from-emerald-900 to-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                  }`}
                >
                  {isRevealed && (
                    isMine ? (
                      <Bomb className="w-6 h-6 sm:w-8 sm:h-8 text-rose-400" />
                    ) : (
                      <Gem className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 drop-shadow-md animate-in zoom-in" />
                    )
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
