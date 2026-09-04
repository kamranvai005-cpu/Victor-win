import { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Award,
  Crown,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Currency } from '../types';
import { getCurrencySymbol } from '../utils/currency';
import { sound } from '../utils/audio';

interface CardGamesLobbyProps {
  userBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  currency: Currency;
  onOpenDeposit: () => void;
  onBackToLobby?: () => void;
}

const CARDS_DECK = [
  '♠️ A', '♥️ A', '♦️ A', '♣️ A',
  '♠️ K', '♥️ K', '♦️ K', '♣️ K',
  '♠️ Q', '♥️ Q', '♦️ Q', '♣️ Q',
  '♠️ J', '♥️ J', '♦️ J', '♣️ J',
  '♠️ 10', '♥️ 10', '♦️ 10', '♣️ 10',
  '♠️ 9', '♥️ 9', '♦️ 9', '♣️ 9',
  '♠️ 8', '♥️ 8', '♦️ 8', '♣️ 8',
  '♠️ 7', '♥️ 7', '♦️ 7', '♣️ 7',
];

export function CardGamesLobby({
  userBalance,
  onUpdateBalance,
  currency,
  onOpenDeposit,
  onBackToLobby,
}: CardGamesLobbyProps) {
  const sym = getCurrencySymbol(currency);
  const [activeGame, setActiveGame] = useState<'teen-patti' | 'andar-bahar'>('teen-patti');
  const [selectedChip, setSelectedChip] = useState<number>(50);
  const [betSide, setBetSide] = useState<'player' | 'dealer' | 'andar' | 'bahar' | null>(null);
  const [isDealing, setIsDealing] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);

  // Teen patti cards
  const [playerCards, setPlayerCards] = useState<string[]>(['♠️ A', '♥️ K', '♦️ Q']);
  const [dealerCards, setDealerCards] = useState<string[]>(['♣️ J', '♦️ 10', '♠️ 9']);

  // Andar Bahar cards
  const [jokerCard, setJokerCard] = useState<string>('♥️ 7');
  const [andarCards, setAndarCards] = useState<string[]>(['♠️ 4', '♦️ 8']);
  const [baharCards, setBaharCards] = useState<string[]>(['♣️ 2', '♥️ 7']);

  const playTeenPatti = (side: 'player' | 'dealer') => {
    if (isDealing) return;
    if (userBalance < selectedChip) {
      sound.playFail();
      alert('Insufficient balance! Please deposit.');
      onOpenDeposit();
      return;
    }

    sound.playChip();
    onUpdateBalance(userBalance - selectedChip);
    setIsDealing(true);
    setBetSide(side);
    setLastWin(null);

    setTimeout(() => {
      // Pick 3 random cards for player & dealer
      const shuffled = [...CARDS_DECK].sort(() => 0.5 - Math.random());
      const pCards = [shuffled[0], shuffled[1], shuffled[2]];
      const dCards = [shuffled[3], shuffled[4], shuffled[5]];

      setPlayerCards(pCards);
      setDealerCards(dCards);
      setIsDealing(false);

      // Random winner with 50% chance
      const winner = Math.random() < 0.52 ? 'player' : 'dealer';

      if (side === winner) {
        const won = selectedChip * 1.95;
        sound.playWin();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        onUpdateBalance(userBalance - selectedChip + won);
        setLastWin(won);
      } else {
        sound.playFail();
      }
    }, 1800);
  };

  const playAndarBahar = (side: 'andar' | 'bahar') => {
    if (isDealing) return;
    if (userBalance < selectedChip) {
      sound.playFail();
      alert('Insufficient balance!');
      onOpenDeposit();
      return;
    }

    sound.playChip();
    onUpdateBalance(userBalance - selectedChip);
    setIsDealing(true);
    setBetSide(side);
    setLastWin(null);

    setTimeout(() => {
      const winner = Math.random() < 0.5 ? 'andar' : 'bahar';
      setIsDealing(false);

      if (side === winner) {
        const mult = side === 'andar' ? 1.9 : 2.0;
        const won = selectedChip * mult;
        sound.playWin();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        onUpdateBalance(userBalance - selectedChip + won);
        setLastWin(won);
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

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 p-0.5 shadow-lg">
            <div className="w-full h-full bg-[#060e22] rounded-[14px] flex items-center justify-center text-rose-300 font-black text-sm">
              CARD
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white font-display flex items-center gap-2">
              <span>Card & Rummy Room</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                KINGMAKER
              </span>
            </h1>
            <p className="text-xs text-slate-400">Teen Patti 3 Card Pro & Andar Bahar Rapid</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-[#091533] p-1.5 rounded-2xl border border-blue-500/30">
          <button
            type="button"
            onClick={() => setActiveGame('teen-patti')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeGame === 'teen-patti'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🃏 Teen Patti 3 Card
          </button>
          <button
            type="button"
            onClick={() => setActiveGame('andar-bahar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeGame === 'andar-bahar'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎴 Andar Bahar Rapid
          </button>
        </div>
      </div>

      {/* Main Game Stage */}
      {activeGame === 'teen-patti' ? (
        <div className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#060e22] border border-blue-500/30 p-6 shadow-2xl flex flex-col items-center">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs mb-4">
              👑 Teen Patti High Card & Pure Sequence Table
            </span>

            {/* Table layout */}
            <div className="w-full max-w-xl grid grid-cols-2 gap-4 my-2">
              {/* Dealer Cards */}
              <div className="p-4 rounded-2xl bg-[#0a1532] border border-blue-900/60 flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-slate-400">DEALER HAND</span>
                <div className="flex gap-2">
                  {dealerCards.map((c, i) => (
                    <div key={i} className="w-12 h-16 rounded-xl bg-white text-slate-900 flex items-center justify-center font-black text-xs shadow-md border border-slate-300">
                      {isDealing ? '🂠' : c}
                    </div>
                  ))}
                </div>
              </div>

              {/* Player Cards */}
              <div className="p-4 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-blue-300">PLAYER HAND</span>
                <div className="flex gap-2">
                  {playerCards.map((c, i) => (
                    <div key={i} className="w-12 h-16 rounded-xl bg-white text-slate-900 flex items-center justify-center font-black text-xs shadow-md border border-slate-300">
                      {isDealing ? '🂠' : c}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {lastWin && lastWin > 0 && (
              <div className="mt-2 px-4 py-1.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-sm">
                🎉 YOU WON +{sym}{lastWin.toLocaleString()}!
              </div>
            )}
          </div>

          {/* Action and Bet Panel */}
          <div className="bg-[#091533] border border-blue-500/30 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => playTeenPatti('player')}
                disabled={isDealing}
                className="py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                BET PLAYER (1.95X) - {sym}{selectedChip}
              </button>

              <button
                type="button"
                onClick={() => playTeenPatti('dealer')}
                disabled={isDealing}
                className="py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                BET DEALER (1.95X) - {sym}{selectedChip}
              </button>
            </div>

            {/* Chips */}
            <div className="flex items-center gap-2 pt-2 border-t border-blue-900/60">
              <span className="text-xs text-slate-400 font-bold">Chip Stake:</span>
              {[20, 50, 100, 500, 1000].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSelectedChip(chip)}
                  className={`w-9 h-9 rounded-full font-black text-xs font-mono border-2 transition-all cursor-pointer ${
                    selectedChip === chip
                      ? 'border-yellow-300 bg-yellow-400 text-slate-950 scale-110'
                      : 'border-blue-500/40 bg-[#0d1f48] text-sky-200'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Andar Bahar */
        <div className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#060e22] border border-blue-500/30 p-6 shadow-2xl flex flex-col items-center">
            {/* Joker Card */}
            <div className="flex flex-col items-center gap-2 mb-4">
              <span className="text-xs font-bold text-amber-300 uppercase">JOKER MATCH CARD</span>
              <div className="w-14 h-20 rounded-2xl bg-white text-slate-900 flex items-center justify-center font-black text-base shadow-2xl border-2 border-amber-400">
                {jokerCard}
              </div>
            </div>

            {/* Andar / Bahar Sides */}
            <div className="w-full max-w-xl grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex flex-col items-center gap-2">
                <span className="text-sm font-black text-blue-300">ANDAR (INSIDE)</span>
                <span className="text-xs text-slate-400">Payout 1.90X</span>
              </div>
              <div className="p-4 rounded-2xl bg-red-600/20 border border-red-500/40 flex flex-col items-center gap-2">
                <span className="text-sm font-black text-red-300">BAHAR (OUTSIDE)</span>
                <span className="text-xs text-slate-400">Payout 2.00X</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-[#091533] border border-blue-500/30 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => playAndarBahar('andar')}
                disabled={isDealing}
                className="py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                BET ANDAR (1.90X) - {sym}{selectedChip}
              </button>

              <button
                type="button"
                onClick={() => playAndarBahar('bahar')}
                disabled={isDealing}
                className="py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                BET BAHAR (2.00X) - {sym}{selectedChip}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
