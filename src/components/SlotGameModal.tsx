import { useState } from 'react';
import {
  Sparkles,
  Zap,
  RefreshCw,
  X,
  Award,
  ArrowLeft,
  Flame,
  Crown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Currency } from '../types';
import { getCurrencySymbol } from '../utils/currency';
import { sound } from '../utils/audio';

interface SlotGameModalProps {
  onClose: () => void;
  userBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  currency: Currency;
  onOpenDeposit: () => void;
  initialGameTitle?: string;
}

const SLOT_THEMES: { [key: string]: { name: string; symbols: string[]; bgGradient: string; provider: string } } = {
  'fortune-tiger': {
    name: 'Fortune Tiger 10,000X',
    symbols: ['🐯', '🧧', '🍊', '💰', '💎', '🔔', '7️⃣'],
    bgGradient: 'from-amber-950 via-[#1a0f05] to-[#0d0702]',
    provider: 'PG SOFT',
  },
  'gates-of-olympus': {
    name: 'Gates of Olympus 1000',
    symbols: ['⚡', '👑', '💎', '🏺', '💍', '🪙', '7️⃣'],
    bgGradient: 'from-purple-950 via-[#150a28] to-[#080315]',
    provider: 'PRAGMATIC PLAY',
  },
  'super-ace': {
    name: 'Super Ace Deluxe',
    symbols: ['♠️', '♥️', '♣️', '♦️', '🃏', '👑', '7️⃣'],
    bgGradient: 'from-blue-950 via-[#0a1532] to-[#040a1c]',
    provider: 'JILI GAMING',
  },
  'sweet-bonanza': {
    name: 'Sweet Bonanza 1000',
    symbols: ['🍭', '🍬', '🍇', '🍉', '🍌', '🍎', '7️⃣'],
    bgGradient: 'from-pink-950 via-[#260a1d] to-[#12030d]',
    provider: 'PRAGMATIC PLAY',
  },
};

export function SlotGameModal({
  onClose,
  userBalance,
  onUpdateBalance,
  currency,
  onOpenDeposit,
  initialGameTitle = 'fortune-tiger',
}: SlotGameModalProps) {
  const sym = getCurrencySymbol(currency);
  const [selectedThemeKey, setSelectedThemeKey] = useState<string>(
    SLOT_THEMES[initialGameTitle] ? initialGameTitle : 'fortune-tiger'
  );
  const currentTheme = SLOT_THEMES[selectedThemeKey] || SLOT_THEMES['fortune-tiger'];
  const symbols = currentTheme.symbols;

  const [reels, setReels] = useState<string[][]>([
    [symbols[0], symbols[1], symbols[2]],
    [symbols[2], symbols[0], symbols[4]],
    [symbols[1], symbols[6], symbols[0]],
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [betPerLine, setBetPerLine] = useState<number>(20);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [winMessage, setWinMessage] = useState<string>('');

  const spin = () => {
    if (isSpinning) return;
    if (userBalance < betPerLine) {
      sound.playFail();
      alert('Insufficient balance! Please top up.');
      onOpenDeposit();
      return;
    }

    sound.playChip();
    onUpdateBalance(userBalance - betPerLine);
    setIsSpinning(true);
    setLastWin(null);
    setWinMessage('');

    // Play spinning ticks
    const tickInterval = setInterval(() => {
      sound.playSpinTick();
    }, 100);

    setTimeout(() => {
      clearInterval(tickInterval);
      // Generate new reels
      const newReels = [
        [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
        ],
        [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
        ],
        [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
        ],
      ];

      // 45% chance of hit for fun gameplay
      if (Math.random() < 0.48) {
        const luckySymbol = symbols[Math.floor(Math.random() * 3)];
        newReels[0][1] = luckySymbol;
        newReels[1][1] = luckySymbol;
        newReels[2][1] = luckySymbol;
      }

      setReels(newReels);
      setIsSpinning(false);

      // Check Middle Row Win
      if (newReels[0][1] === newReels[1][1] && newReels[1][1] === newReels[2][1]) {
        const winningSym = newReels[0][1];
        let multiplier = 5;
        if (winningSym === symbols[0]) multiplier = 50;
        else if (winningSym === symbols[6]) multiplier = 30;
        else if (winningSym === symbols[4]) multiplier = 20;
        else if (winningSym === symbols[3]) multiplier = 10;

        const won = betPerLine * multiplier;
        sound.playWin();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        onUpdateBalance(userBalance - betPerLine + won);
        setLastWin(won);
        setWinMessage(`SUPER BIG WIN! ${multiplier}X`);
      } else {
        sound.playFail();
      }
    }, 1600);
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#08122c] border border-blue-500/30 p-4 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600 border border-blue-500/40 text-sky-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer mr-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Lobby</span>
          </button>

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg">
            <div className="w-full h-full bg-[#060e22] rounded-[14px] flex items-center justify-center text-amber-400 font-black text-sm">
              SLOT
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white font-display flex items-center gap-2">
              <span>{currentTheme.name}</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
                {currentTheme.provider}
              </span>
            </h1>
            <p className="text-xs text-slate-400">Match 3 symbols on the payline to win up to 500X!</p>
          </div>
        </div>

        {/* Slot Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-[#091533] p-1.5 rounded-2xl border border-blue-500/30 overflow-x-auto">
          {Object.entries(SLOT_THEMES).map(([key, t]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                sound.playClick();
                setSelectedThemeKey(key);
                setLastWin(null);
                setWinMessage('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedThemeKey === key
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Slot Machine Display Stage */}
      <div className={`relative rounded-3xl bg-gradient-to-b ${currentTheme.bgGradient} border-2 border-amber-500/40 p-6 sm:p-8 shadow-2xl flex flex-col items-center overflow-hidden`}>
        {/* Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15)_0%,transparent_70%)] pointer-events-none" />

        {/* Win Banner */}
        {winMessage && (
          <div className="mb-4 px-6 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-base shadow-2xl flex items-center gap-2 animate-bounce z-10">
            <Sparkles className="w-5 h-5 fill-slate-950" />
            <span>{winMessage} (+{sym}{lastWin?.toLocaleString()})</span>
          </div>
        )}

        {/* 3x3 Reels Container */}
        <div className="relative z-10 bg-[#050b1a] p-4 sm:p-6 rounded-3xl border-4 border-amber-500/80 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
          {/* Middle Payline Indicator */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-20 border-y-2 border-dashed border-amber-400/60 pointer-events-none z-20 flex items-center justify-between px-2">
            <span className="text-[10px] font-black text-amber-400 bg-slate-950 px-1 py-0.5 rounded border border-amber-400/40">PAYLINE</span>
            <span className="text-[10px] font-black text-amber-400 bg-slate-950 px-1 py-0.5 rounded border border-amber-400/40">PAYLINE</span>
          </div>

          {/* 3 Columns */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 relative z-10">
            {reels.map((col, colIdx) => (
              <div
                key={colIdx}
                className={`flex flex-col gap-2.5 sm:gap-3 bg-[#08122c] p-2 sm:p-3 rounded-2xl border border-blue-500/30 transition-all ${
                  isSpinning ? 'animate-pulse scale-95' : ''
                }`}
              >
                {col.map((symb, rowIdx) => (
                  <div
                    key={rowIdx}
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl shadow-inner border transition-all ${
                      rowIdx === 1
                        ? 'bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border-amber-400/70 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-[#0a1738] border-blue-900/50 opacity-60'
                    }`}
                  >
                    {symb}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Stake and Spin Control Bar */}
        <div className="w-full max-w-xl mt-6 z-10 bg-[#08122c]/90 border border-blue-500/40 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-bold">Bet / Spin:</span>
            {[10, 20, 50, 100, 500].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setBetPerLine(amt)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                  betPerLine === amt
                    ? 'bg-amber-400 border-amber-300 text-slate-950 font-black scale-105'
                    : 'bg-[#0d1f48] border-blue-500/30 text-sky-200'
                }`}
              >
                {amt}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={spin}
            disabled={isSpinning}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-900/50 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 fill-slate-950" />
            <span>{isSpinning ? 'SPINNING...' : `SPIN (${sym}${betPerLine})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
