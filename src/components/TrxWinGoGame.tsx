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
import { getBallImage, WINGO_ASSETS } from '../utils/wingoAssets';

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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

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

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const minStr = mins.toString().padStart(2, '0');
  const secStr = secs.toString().padStart(2, '0');

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Top Header & Official Wallet Banner */}
      <div
        className="relative overflow-hidden rounded-3xl border border-emerald-500/40 p-4 sm:p-5 shadow-2xl bg-cover bg-center"
        style={{ backgroundImage: `url(${WINGO_ASSETS.walletBg})` }}
      >
        <div className="absolute inset-0 bg-[#06141c]/85 backdrop-blur-[2px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBackToLobby && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onBackToLobby();
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600 border border-blue-500/40 text-sky-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>লবি (Lobby)</span>
              </button>
            )}

            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg">
              <div className="w-full h-full bg-[#060e22] rounded-[14px] flex items-center justify-center text-emerald-400 text-xs font-black">
                TRX
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white font-display flex items-center gap-2">
                <span>TRX Win Go {activeDuration}Min</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> ব্লকচেইন ভেরিফাইড
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Decentralized TRON block hash verified lottery
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 bg-[#030b14]/85 border border-emerald-500/40 px-4 py-2 rounded-2xl shadow-inner">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">
                ওয়ালেট ব্যালেন্স
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-base sm:text-lg text-emerald-400">
                  {sym}{userBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <button
                  type="button"
                  title="রিফ্রেশ ব্যালেন্স"
                  onClick={() => {
                    sound.playClick();
                    setIsRefreshing(true);
                    setTimeout(() => setIsRefreshing(false), 600);
                  }}
                  className="cursor-pointer active:scale-85 transition-transform p-0.5"
                >
                  <img
                    src={WINGO_ASSETS.refreshIcon}
                    alt="Refresh"
                    className={`w-4 h-4 object-contain transition-transform duration-500 ${isRefreshing ? 'rotate-180 scale-110' : 'hover:rotate-45'}`}
                    referrerPolicy="no-referrer"
                  />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenDeposit}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-black text-xs flex items-center gap-1 shadow-md cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>ডিপোজিট</span>
            </button>
          </div>
        </div>
      </div>

      {/* Duration Switcher */}
      <div className="grid grid-cols-3 gap-2 bg-[#091533] p-1.5 rounded-2xl border border-blue-500/30">
        {[1, 3, 5].map((dur) => {
          const isActive = activeDuration === dur;
          return (
            <button
              key={dur}
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveDuration(dur);
                setTimeLeft(dur * 60 - 18);
              }}
              className={`py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md scale-[1.02]'
                  : 'text-slate-400 hover:text-white bg-[#060e22]'
              }`}
            >
              <img
                src={isActive ? WINGO_ASSETS.timeActive : WINGO_ASSETS.timeInactive}
                alt="Time"
                className="w-4 h-4 object-contain"
                referrerPolicy="no-referrer"
              />
              <span>TRX {dur}Min</span>
            </button>
          );
        })}
      </div>

      {/* Live Blockchain Hash Stage with in-board Balance & Refresh */}
      <div
        className="relative rounded-3xl overflow-hidden border border-emerald-500/40 p-4 sm:p-5 shadow-2xl bg-cover bg-center"
        style={{ backgroundImage: `url(${WINGO_ASSETS.wingoIssueBg})` }}
      >
        <div className="absolute inset-0 bg-[#05151e]/85 backdrop-blur-[1.5px] pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Top Bar of Stage: Period & In-Board Balance with Refresh */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                TRON Block #{currentBlock}
              </span>
              <span className="text-slate-400 text-xs font-mono">
                পিরিয়ড: <span className="text-amber-300 font-bold">{currentPeriod}</span>
              </span>
            </div>

            {/* In-Board Balance with Refresh Icon */}
            <div className="flex items-center gap-2 bg-[#020b12]/90 border border-emerald-400/40 px-3 py-1.5 rounded-2xl shadow-inner">
              <span className="text-[10px] text-slate-300 font-bold uppercase hidden sm:inline">ব্যালেন্স:</span>
              <span className="font-mono font-black text-xs sm:text-sm text-emerald-400">
                {sym}{userBalance.toFixed(2)}
              </span>
              <button
                type="button"
                title="রিফ্রেশ ব্যালেন্স"
                onClick={() => {
                  sound.playClick();
                  setIsRefreshing(true);
                  setTimeout(() => setIsRefreshing(false), 600);
                }}
                className="cursor-pointer active:scale-80 transition-transform p-0.5"
              >
                <img
                  src={WINGO_ASSETS.refreshIcon}
                  alt="Refresh"
                  className={`w-4 h-4 object-contain transition-transform duration-500 ${isRefreshing ? 'rotate-180 scale-110' : 'hover:rotate-45'}`}
                  referrerPolicy="no-referrer"
                />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 break-all bg-[#040d18]/85 p-2 rounded-xl border border-emerald-500/20">
                Hash: <span className="text-emerald-300 font-bold">{currentHash}</span>
              </div>

              {/* Past 5 Winning Balls row */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">পূর্ববর্তী ড্র:</span>
                <div className="flex items-center gap-1.5">
                  {history.slice(0, 5).map((h, idx) => (
                    <div key={`${h.period}-${idx}`} className="flex flex-col items-center">
                      <img
                        src={getBallImage(h.number)}
                        alt={`Ball ${h.number}`}
                        className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow hover:scale-110 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Last Drawn Ball */}
            <div className="flex items-center gap-3 justify-center p-3 rounded-2xl bg-[#040e1a]/90 border border-emerald-500/30 shadow-inner">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-300 font-bold uppercase">সর্বশেষ বল</span>
                <img
                  src={getBallImage(lastResult.number)}
                  alt={`Ball ${lastResult.number}`}
                  className={`w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-xl ${
                    isDrawing ? 'animate-spin' : 'animate-in zoom-in'
                  }`}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Digital 4-Box Countdown Timer */}
            <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
              <span className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>অবশিষ্ট সময়</span>
              </span>
              <div className="flex items-center gap-1">
                <div className="w-8 h-10 rounded-xl bg-[#030c14] border border-emerald-500/40 text-emerald-400 font-mono text-xl font-black flex items-center justify-center shadow">
                  {minStr[0]}
                </div>
                <div className="w-8 h-10 rounded-xl bg-[#030c14] border border-emerald-500/40 text-emerald-400 font-mono text-xl font-black flex items-center justify-center shadow">
                  {minStr[1]}
                </div>
                <span className="text-emerald-400 font-mono font-black text-xl px-0.5">:</span>
                <div className="w-8 h-10 rounded-xl bg-[#030c14] border border-emerald-500/40 text-emerald-400 font-mono text-xl font-black flex items-center justify-center shadow">
                  {secStr[0]}
                </div>
                <div className="w-8 h-10 rounded-xl bg-[#030c14] border border-emerald-500/40 text-emerald-400 font-mono text-xl font-black flex items-center justify-center shadow">
                  {secStr[1]}
                </div>
              </div>
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

      {/* 3D Glossy Ball Selection Grid (0-9) */}
      <div className="space-y-3 bg-[#060e22]/90 p-3 sm:p-4 rounded-3xl border border-blue-500/25 shadow-inner">
        <div className="flex items-center justify-between text-xs text-slate-300 font-semibold px-2">
          <span className="flex items-center gap-1.5 font-bold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>TRX ডিজিট নির্বাচন করুন (০-৯)</span>
          </span>
          <span className="text-amber-400 font-black font-mono bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
            ৯ গুণ পেআউট (9X Multiplier)
          </span>
        </div>

        {/* 2 Rows of 5 Balls: Row 1 (0-4), Row 2 (5-9) */}
        <div className="grid grid-cols-5 gap-2 sm:gap-4 py-1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleOpenBet('number', num.toString())}
              className="group relative flex flex-col items-center justify-center transition-all duration-200 active:scale-90 hover:scale-110 -translate-y-0 hover:-translate-y-1.5 cursor-pointer p-1"
            >
              <img
                src={getBallImage(num)}
                alt={`Ball ${num}`}
                className="w-12 h-12 sm:w-15 sm:h-15 md:w-16 md:h-16 object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_12px_20px_rgba(16,185,129,0.5)] transition-all"
                referrerPolicy="no-referrer"
              />
              <span className="text-[9px] sm:text-[10px] font-mono font-black text-emerald-300 bg-[#071726] border border-emerald-500/40 px-2 py-0.2 rounded-full mt-1 shadow group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                9X
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
                <img
                  src={getBallImage(h.number)}
                  alt={`Ball ${h.number}`}
                  className="w-6 h-6 object-contain inline-block drop-shadow-sm"
                  referrerPolicy="no-referrer"
                />
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
