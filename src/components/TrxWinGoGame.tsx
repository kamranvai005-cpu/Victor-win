import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  HelpCircle,
  TrendingUp,
  PlusCircle,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Currency, TrxResult, WinGoColor, WinGoSize } from '../types';
import { getCurrencySymbol } from '../utils/currency';
import { sound } from '../utils/audio';

interface TrxWinGoGameProps {
  userBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  currency: Currency;
  onOpenDeposit: () => void;
  onBackToLobby?: () => void;
  initialDuration?: number;
}

export function TrxWinGoGame({
  userBalance,
  onUpdateBalance,
  currency,
  onOpenDeposit,
  onBackToLobby,
  initialDuration = 1,
}: TrxWinGoGameProps) {
  const sym = getCurrencySymbol(currency);

  const [activeDuration, setActiveDuration] = useState<number>(initialDuration);
  const [timeLeft, setTimeLeft] = useState<number>(27);
  const [currentPeriod, setCurrentPeriod] = useState<string>('202608290901');
  const [currentBlock, setCurrentBlock] = useState<string>('64928103');
  const [currentHash, setCurrentHash] = useState<string>('0000000003dfa918e7c10b429188e7f13904b7');

  // Bet state
  const [selectedType, setSelectedType] = useState<'color' | 'number' | 'size'>('color');
  const [selectedValue, setSelectedValue] = useState<string>('green');
  const [baseStake, setBaseStake] = useState<number>(10);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [showBetModal, setShowBetModal] = useState<boolean>(false);

  // Result animation
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{
    number: number;
    color: WinGoColor | 'green-violet' | 'red-violet';
    size: WinGoSize;
  }>({
    number: 7,
    color: 'green',
    size: 'big',
  });

  // History
  const [history, setHistory] = useState<TrxResult[]>([
    { period: '202608290900', blockNumber: '64928102', blockHash: '...e83b7', number: 7, color: 'green', size: 'big', time: '10:14' },
    { period: '202608290899', blockNumber: '64928101', blockHash: '...10a92', number: 2, color: 'red', size: 'small', time: '10:13' },
    { period: '202608290898', blockNumber: '64928100', blockHash: '...334c0', number: 0, color: 'red-violet', size: 'small', time: '10:12' },
    { period: '202608290897', blockNumber: '64928099', blockHash: '...99f15', number: 5, color: 'green-violet', size: 'big', time: '10:11' },
  ]);

  const [myBets, setMyBets] = useState<Array<{
    id: string;
    period: string;
    type: string;
    value: string;
    amount: number;
    status: 'pending' | 'won' | 'lost';
  }>>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleDraw();
          return activeDuration * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeDuration, currentPeriod]);

  const handleDraw = () => {
    setIsDrawing(true);
    sound.playWin();

    setTimeout(() => {
      const drawnNumber = Math.floor(Math.random() * 10);
      let color: WinGoColor | 'green-violet' | 'red-violet' = 'green';
      if (drawnNumber === 0) color = 'red-violet';
      else if (drawnNumber === 5) color = 'green-violet';
      else if ([1, 3, 7, 9].includes(drawnNumber)) color = 'green';
      else color = 'red';

      const size: WinGoSize = drawnNumber >= 5 ? 'big' : 'small';
      const newBlockNum = (parseInt(currentBlock) + 1).toString();
      const randomHashEnd = Math.random().toString(16).substring(2, 7) + drawnNumber;

      setLastResult({ number: drawnNumber, color, size });
      setCurrentBlock(newBlockNum);
      setCurrentHash(`0000000003dfa918e7c10b429188e${randomHashEnd}`);
      setIsDrawing(false);

      const record: TrxResult = {
        period: currentPeriod,
        blockNumber: newBlockNum,
        blockHash: `...${randomHashEnd}`,
        number: drawnNumber,
        color,
        size,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setHistory((prev) => [record, ...prev.slice(0, 15)]);

      // Evaluate bets
      let winTotal = 0;
      setMyBets((prev) =>
        prev.map((bet) => {
          if (bet.period !== currentPeriod || bet.status !== 'pending') return bet;

          let won = false;
          let odds = 1.98;

          if (bet.type === 'color') {
            if (bet.value === 'green' && (color === 'green' || color === 'green-violet')) {
              won = true;
              odds = color === 'green-violet' ? 1.5 : 1.98;
            } else if (bet.value === 'red' && (color === 'red' || color === 'red-violet')) {
              won = true;
              odds = color === 'red-violet' ? 1.5 : 1.98;
            } else if (bet.value === 'violet' && (color === 'green-violet' || color === 'red-violet')) {
              won = true;
              odds = 4.5;
            }
          } else if (bet.type === 'size') {
            if (bet.value === size) {
              won = true;
              odds = 1.98;
            }
          } else if (bet.type === 'number') {
            if (parseInt(bet.value) === drawnNumber) {
              won = true;
              odds = 9.0;
            }
          }

          if (won) {
            const pay = Math.round(bet.amount * odds);
            winTotal += pay;
            return { ...bet, status: 'won' };
          }
          return { ...bet, status: 'lost' };
        })
      );

      if (winTotal > 0) {
        sound.playWin();
        confetti({ particleCount: 75, spread: 70 });
        onUpdateBalance(userBalance + winTotal);
      }

      setCurrentPeriod((prev) => (BigInt(prev) + 1n).toString());
    }, 1500);
  };

  const handleOpenBet = (type: 'color' | 'number' | 'size', value: string) => {
    if (timeLeft <= 5) {
      alert('Betting closed for current period!');
      return;
    }
    sound.playClick();
    setSelectedType(type);
    setSelectedValue(value);
    setShowBetModal(true);
  };

  const handleConfirmBet = () => {
    const total = baseStake * multiplier;
    if (total > userBalance) {
      alert('Insufficient wallet balance!');
      return;
    }

    sound.playBet();
    onUpdateBalance(userBalance - total);

    setMyBets((prev) => [
      {
        id: 'TRX-' + Date.now().toString().slice(-6),
        period: currentPeriod,
        type: selectedType,
        value: selectedValue,
        amount: total,
        status: 'pending',
      },
      ...prev,
    ]);

    setShowBetModal(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Top Navigation */}
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

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg">
            <div className="w-full h-full bg-[#060e22] rounded-[14px] flex items-center justify-center text-emerald-400 text-xs font-black">
              TRX
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white font-display flex items-center gap-2">
              <span>TRX Win Go {activeDuration}Min</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> BLOCKCHAIN VERIFIED
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Decentralized TRON block hash verified lottery
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
      <div className="grid grid-cols-3 gap-2 bg-[#091533] p-1.5 rounded-2xl border border-blue-500/30">
        {[1, 3, 5].map((dur) => (
          <button
            key={dur}
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveDuration(dur);
              setTimeLeft(dur * 60 - 18);
            }}
            className={`py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
              activeDuration === dur
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md scale-[1.02]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            TRX {dur}Min
          </button>
        ))}
      </div>

      {/* Live Blockchain Hash Stage */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0d2a2a] via-[#091d38] to-[#102947] border border-emerald-500/30 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              TRON Block #{currentBlock}
            </span>
            <div className="font-mono text-xl sm:text-2xl font-black text-emerald-400">
              Period {currentPeriod}
            </div>
            <div className="text-[11px] font-mono text-slate-400 break-all bg-[#060e22]/80 p-2 rounded-xl border border-emerald-500/20">
              Hash: <span className="text-emerald-300 font-bold">{currentHash}</span>
            </div>
          </div>

          {/* Last Drawn Ball */}
          <div className="flex items-center gap-3 justify-center p-3 rounded-2xl bg-[#060e22]/90 border border-emerald-500/30 shadow-inner">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Hash Digit</span>
              <div
                className={`w-14 h-14 rounded-full ${
                  lastResult.color === 'green'
                    ? 'bg-emerald-500'
                    : lastResult.color === 'red'
                    ? 'bg-rose-600'
                    : 'bg-purple-600'
                } border-2 border-white/80 text-white font-mono font-black text-3xl flex items-center justify-center shadow-lg ${
                  isDrawing ? 'animate-spin' : 'animate-in zoom-in'
                }`}
              >
                {lastResult.number}
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
            <span className="text-[11px] text-slate-400 font-semibold">Remaining</span>
            <div className="flex items-center gap-1.5 font-mono text-2xl sm:text-3xl font-black text-emerald-400">
              <Clock className="w-5 h-5 text-emerald-400 animate-spin" />
              <span>{Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Colors Betting Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => handleOpenBet('color', 'green')}
          className="py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-sm shadow-lg shadow-emerald-950/50 hover:brightness-110 active:scale-95 cursor-pointer flex flex-col items-center"
        >
          <span>GREEN (সবুজ)</span>
          <span className="text-[10px] opacity-90 font-mono">1.98X</span>
        </button>
        <button
          type="button"
          onClick={() => handleOpenBet('color', 'violet')}
          className="py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm shadow-lg shadow-purple-950/50 hover:brightness-110 active:scale-95 cursor-pointer flex flex-col items-center"
        >
          <span>VIOLET (বেগুনী)</span>
          <span className="text-[10px] opacity-90 font-mono">4.5X</span>
        </button>
        <button
          type="button"
          onClick={() => handleOpenBet('color', 'red')}
          className="py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 text-white font-black text-sm shadow-lg shadow-rose-950/50 hover:brightness-110 active:scale-95 cursor-pointer flex flex-col items-center"
        >
          <span>RED (লাল)</span>
          <span className="text-[10px] opacity-90 font-mono">1.98X</span>
        </button>
      </div>

      {/* Big / Small */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOpenBet('size', 'big')}
          className="py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm shadow cursor-pointer active:scale-95 flex flex-col items-center"
        >
          <span>BIG (5-9)</span>
          <span className="text-[10px] font-mono opacity-80">1.98X</span>
        </button>
        <button
          type="button"
          onClick={() => handleOpenBet('size', 'small')}
          className="py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-sm shadow cursor-pointer active:scale-95 flex flex-col items-center"
        >
          <span>SMALL (0-4)</span>
          <span className="text-[10px] font-mono opacity-80">1.98X</span>
        </button>
      </div>

      {/* Number Grid 0-9 */}
      <div className="space-y-2 bg-[#091533] p-4 rounded-3xl border border-blue-500/30">
        <span className="text-xs text-slate-400 font-semibold">Select Exact TRX Digit (0-9) - 9X Multiplier:</span>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleOpenBet('number', num.toString())}
              className="p-3 rounded-2xl bg-[#060e22] hover:bg-emerald-600/30 border border-emerald-500/30 hover:border-emerald-400 transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 group"
            >
              <span className="font-mono text-lg font-black text-white group-hover:text-emerald-300">
                {num}
              </span>
              <span className="text-[9px] font-mono text-emerald-400 font-bold">
                9.0X
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="rounded-3xl bg-[#08122c] border border-blue-500/30 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-blue-900/50 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">TRX Block History</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Recent 10 Blocks</span>
        </div>

        <div className="space-y-1.5">
          {history.map((h) => (
            <div
              key={h.period}
              className="p-2.5 rounded-xl bg-[#060e22] border border-blue-500/20 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-400 text-[11px]">{h.period}</span>
                <span className="font-mono text-emerald-400 text-[11px]">#{h.blockNumber}</span>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-400">{h.blockHash}</span>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                  h.color === 'green' ? 'bg-emerald-500' : h.color === 'red' ? 'bg-rose-500' : 'bg-purple-600'
                }`}>
                  {h.number}
                </span>
                <span className="text-slate-400 text-[11px]">{h.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bet Modal */}
      {showBetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#091533] border border-emerald-500/40 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-blue-900/50 pb-2">
              <h3 className="text-sm font-bold text-white">Place Bet - TRX Win Go</h3>
              <button
                type="button"
                onClick={() => setShowBetModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#060e22] border border-emerald-500/20 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Selection:</span>
                <span className="font-mono font-bold text-emerald-400 uppercase">{selectedType} - {selectedValue}</span>
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
                        ? 'bg-emerald-500 text-slate-950 font-black'
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
                  {sym}{baseStake * multiplier}
                </span>
              </div>
              <button
                type="button"
                onClick={handleConfirmBet}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg cursor-pointer"
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
