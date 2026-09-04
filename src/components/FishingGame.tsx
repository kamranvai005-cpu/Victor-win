import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Award,
  Plus,
  Minus,
  Crosshair,
  Volume2,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Currency } from '../types';
import { getCurrencySymbol } from '../utils/currency';
import { sound } from '../utils/audio';

interface FishingGameProps {
  userBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  currency: Currency;
  onOpenDeposit: () => void;
  onBackToLobby?: () => void;
}

interface FishTarget {
  id: number;
  name: string;
  emoji: string;
  multiplier: number;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
}

export function FishingGame({
  userBalance,
  onUpdateBalance,
  currency,
  onOpenDeposit,
  onBackToLobby,
}: FishingGameProps) {
  const sym = getCurrencySymbol(currency);
  const [cannonPower, setCannonPower] = useState<number>(10);
  const [fishes, setFishes] = useState<FishTarget[]>([
    { id: 1, name: 'Golden Carp', emoji: '🐠', multiplier: 5, hp: 1, maxHp: 1, x: 20, y: 30, speed: 1.2, direction: 1 },
    { id: 2, name: 'Angelfish', emoji: '🐡', multiplier: 10, hp: 2, maxHp: 2, x: 80, y: 50, speed: 0.8, direction: -1 },
    { id: 3, name: 'Swordfish', emoji: '🐟', multiplier: 25, hp: 4, maxHp: 4, x: 10, y: 70, speed: 1.5, direction: 1 },
    { id: 4, name: 'Mega Shark', emoji: '🦈', multiplier: 80, hp: 8, maxHp: 8, x: 60, y: 25, speed: 0.6, direction: -1 },
    { id: 5, name: 'Dragon Whale', emoji: '🐋', multiplier: 300, hp: 15, maxHp: 15, x: 30, y: 60, speed: 0.4, direction: 1 },
  ]);
  const [lastCatch, setLastCatch] = useState<{ name: string; amount: number } | null>(null);
  const [laserEffect, setLaserEffect] = useState<{ x: number; y: number } | null>(null);

  // Swim animation
  useEffect(() => {
    const interval = setInterval(() => {
      setFishes((prev) =>
        prev.map((fish) => {
          let nextX = fish.x + fish.speed * fish.direction;
          let nextDir = fish.direction;

          if (nextX > 90) {
            nextX = 90;
            nextDir = -1;
          } else if (nextX < 5) {
            nextX = 5;
            nextDir = 1;
          }

          return {
            ...fish,
            x: nextX,
            direction: nextDir,
          };
        })
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const shootFish = (fish: FishTarget, e: React.MouseEvent) => {
    if (userBalance < cannonPower) {
      sound.playFail();
      alert('Insufficient balance to shoot cannon! Please deposit.');
      onOpenDeposit();
      return;
    }

    sound.playSpinTick();
    onUpdateBalance(userBalance - cannonPower);

    const rect = e.currentTarget.getBoundingClientRect();
    setLaserEffect({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setLaserEffect(null), 300);

    // Hit fish
    setFishes((prev) =>
      prev.map((f) => {
        if (f.id === fish.id) {
          const nextHp = f.hp - 1;
          if (nextHp <= 0) {
            // Fish caught!
            const winAmount = cannonPower * f.multiplier;
            sound.playWin();
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
            onUpdateBalance(userBalance - cannonPower + winAmount);
            setLastCatch({ name: f.name, amount: winAmount });

            // Respawn fish
            return {
              ...f,
              hp: f.maxHp,
              x: Math.random() * 80 + 10,
              y: Math.random() * 60 + 20,
            };
          }
          return { ...f, hp: nextHp };
        }
        return f;
      })
    );
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in pb-8">
      {/* Header */}
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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 p-0.5 shadow-lg">
            <div className="w-full h-full bg-[#060e22] rounded-[14px] flex items-center justify-center text-cyan-300 font-black text-sm">
              FISH
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white font-display flex items-center gap-2">
              <span>Mega Fishing Super 1000X</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                JILI ARCADE
              </span>
            </h1>
            <p className="text-xs text-slate-400">Click & shoot fish to catch massive multipliers!</p>
          </div>
        </div>

        {/* Cannon Bullet Bet Level */}
        <div className="flex items-center gap-2 bg-[#091533] p-2 rounded-2xl border border-blue-500/30">
          <span className="text-xs text-slate-400 font-bold">Bullet Cost:</span>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setCannonPower(Math.max(5, cannonPower - 5));
            }}
            className="w-7 h-7 rounded-lg bg-blue-600/40 hover:bg-blue-600 text-white font-bold flex items-center justify-center cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="px-3 py-1 rounded-xl bg-[#0e1d44] border border-blue-500/40 text-amber-400 font-mono font-black text-sm">
            {sym}{cannonPower}
          </span>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setCannonPower(cannonPower + 10);
            }}
            className="w-7 h-7 rounded-lg bg-blue-600/40 hover:bg-blue-600 text-white font-bold flex items-center justify-center cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Ocean Arcade Stage */}
      <div className="relative w-full h-[400px] sm:h-[460px] rounded-3xl bg-gradient-to-b from-[#06204d] via-[#041538] to-[#020b21] border-2 border-cyan-500/40 overflow-hidden shadow-2xl p-4 select-none cursor-crosshair">
        {/* Ocean bubbles & sunbeams */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.25)_0%,transparent_70%)] pointer-events-none" />

        {/* Catch announcement banner */}
        {lastCatch && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-sm shadow-2xl flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>CAUGHT {lastCatch.name.toUpperCase()}! +{sym}{lastCatch.amount.toLocaleString()}</span>
          </div>
        )}

        {/* Swimming Fish Targets */}
        {fishes.map((fish) => (
          <div
            key={fish.id}
            onClick={(e) => shootFish(fish, e)}
            className="absolute z-10 transition-all duration-100 cursor-pointer group flex flex-col items-center hover:scale-110 active:scale-95"
            style={{
              left: `${fish.x}%`,
              top: `${fish.y}%`,
              transform: `scaleX(${fish.direction})`,
            }}
          >
            {/* HP Bar */}
            <div className="w-12 h-1.5 rounded-full bg-slate-900/80 border border-cyan-400/40 overflow-hidden mb-1">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400"
                style={{ width: `${(fish.hp / fish.maxHp) * 100}%` }}
              />
            </div>

            {/* Fish Sprite */}
            <div className="text-4xl sm:text-5xl filter drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]">
              {fish.emoji}
            </div>

            {/* Multiplier Tag */}
            <span className="text-[10px] font-black font-mono px-1.5 py-0.2 rounded-full bg-cyan-900/90 text-cyan-200 border border-cyan-400/50 mt-1 shadow-md">
              {fish.multiplier}X
            </span>
          </div>
        ))}

        {/* Bottom Cannon Turret */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
          <div className="w-16 h-12 rounded-t-2xl bg-gradient-to-t from-cyan-600 to-blue-500 border-2 border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center justify-center">
            <Crosshair className="w-6 h-6 text-white animate-spin" />
          </div>
          <div className="px-3 py-1 rounded-xl bg-slate-950/90 text-cyan-300 font-mono font-bold text-xs border border-cyan-500/40">
            CANNON LVL {cannonPower / 5}
          </div>
        </div>
      </div>
    </div>
  );
}
