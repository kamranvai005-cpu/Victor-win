import { useState } from 'react';
import { Trophy, Clock, Flame, ChevronRight, X, Trash2, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SportsMatch, BetSlipItem, Currency } from '../types';
import { SPORTS_MATCHES } from '../data/mockData';
import { sound } from '../utils/audio';

interface SportsbookViewProps {
  userBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  currency: Currency;
  onOpenDeposit: () => void;
}

export function SportsbookView({
  userBalance,
  onUpdateBalance,
  currency,
  onOpenDeposit,
}: SportsbookViewProps) {
  const [selectedSport, setSelectedSport] = useState<'all' | 'cricket' | 'football'>('all');
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
  const [betStake, setBetStake] = useState<number>(200);
  const [betSuccessMessage, setBetSuccessMessage] = useState<string | null>(null);

  const getSymbol = (c: Currency) => (c === 'BDT' ? '৳' : c === 'INR' ? '₹' : '$');

  const filteredMatches = SPORTS_MATCHES.filter((m) =>
    selectedSport === 'all' ? true : m.sport === selectedSport
  );

  const handleAddBet = (match: SportsMatch, market: string, selection: string, odds: number) => {
    sound.playChip();
    const item: BetSlipItem = {
      id: `${match.id}-${selection}-${Date.now()}`,
      matchId: match.id,
      matchTitle: `${match.team1.name} vs ${match.team2.name}`,
      marketName: market,
      selection,
      odds,
      stake: betStake,
    };
    setBetSlip([item]); // Single bet slip focus
    setBetSuccessMessage(null);
  };

  const handlePlaceBetSlip = () => {
    if (betSlip.length === 0) return;
    if (userBalance < betStake) {
      alert('Insufficient balance! Please deposit.');
      onOpenDeposit();
      return;
    }

    sound.playWin();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    onUpdateBalance(userBalance - betStake);
    setBetSuccessMessage('Bet accepted! Ticket ID: HG-' + Math.floor(100000 + Math.random() * 900000));
    setBetSlip([]);
  };

  return (
    <div className="w-full space-y-4">
      {/* Sports Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Matches' },
          { id: 'cricket', label: '🏏 Cricket (IPL / World Cup)' },
          { id: 'football', label: '⚽ Football (Champions League)' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              sound.playClick();
              setSelectedSport(tab.id as 'all' | 'cricket' | 'football');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedSport === tab.id
                ? 'bg-blue-600 text-white shadow-md border border-sky-400/40'
                : 'bg-[#0a1738] text-slate-400 hover:text-white border border-blue-500/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Matches List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              className="p-4 rounded-2xl bg-[#0a1738] border border-blue-500/25 hover:border-sky-400/50 shadow-lg space-y-3 transition-all"
            >
              {/* Header Match info */}
              <div className="flex items-center justify-between text-xs pb-2 border-b border-blue-900/40">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sky-400">{match.tournament}</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-emerald-400 font-bold">
                  {match.status === 'LIVE' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  <span>{match.timeInfo}</span>
                </div>
              </div>

              {/* Teams & Scores */}
              <div className="grid grid-cols-2 gap-2 text-sm font-bold text-white">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#08122c] border border-blue-500/20">
                  <span>{match.team1.name}</span>
                  <span className="font-mono text-sky-300 font-extrabold">{match.team1.score}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#08122c] border border-blue-500/20">
                  <span>{match.team2.name}</span>
                  <span className="font-mono text-sky-300 font-extrabold">{match.team2.score}</span>
                </div>
              </div>

              {/* Match Winner Odds */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold">Match Winner (1X2)</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleAddBet(match, 'Match Winner', `${match.team1.name} Win`, match.odds.team1Win)
                    }
                    className="p-2 rounded-xl bg-[#0e1d44] hover:bg-blue-900/60 border border-blue-500/30 text-xs flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95"
                  >
                    <span className="text-slate-300 truncate max-w-full font-medium">
                      1 ({match.team1.name.slice(0, 3)})
                    </span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {match.odds.team1Win.toFixed(2)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleAddBet(match, 'Match Winner', 'Draw', match.odds.draw || 3.50)
                    }
                    className="p-2 rounded-xl bg-[#0e1d44] hover:bg-blue-900/60 border border-blue-500/30 text-xs flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95"
                  >
                    <span className="text-slate-300 font-medium">Draw</span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {(match.odds.draw || 3.50).toFixed(2)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleAddBet(match, 'Match Winner', `${match.team2.name} Win`, match.odds.team2Win)
                    }
                    className="p-2 rounded-xl bg-[#0e1d44] hover:bg-blue-900/60 border border-blue-500/30 text-xs flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95"
                  >
                    <span className="text-slate-300 truncate max-w-full font-medium">
                      2 ({match.team2.name.slice(0, 3)})
                    </span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {match.odds.team2Win.toFixed(2)}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bet Slip Sidebar */}
        <div className="rounded-2xl bg-[#0a1738] border border-blue-500/30 p-4 sm:p-5 shadow-xl space-y-4 h-fit sticky top-20">
          <div className="flex items-center justify-between border-b border-blue-900/60 pb-2.5">
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Interactive Bet Slip</span>
            </span>
            {betSlip.length > 0 && (
              <button
                type="button"
                onClick={() => setBetSlip([])}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          {betSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{betSuccessMessage}</span>
            </div>
          )}

          {betSlip.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Click on any match odds to add selection to your bet slip.
            </div>
          ) : (
            <div className="space-y-3">
              {betSlip.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#08122c] border border-blue-500/30 text-xs space-y-1 relative"
                >
                  <button
                    type="button"
                    onClick={() => setBetSlip([])}
                    className="absolute top-2 right-2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <p className="font-bold text-white pr-4">{item.selection}</p>
                  <p className="text-[11px] text-slate-400">{item.matchTitle}</p>
                  <div className="flex items-center justify-between pt-1 text-sky-300 font-mono font-bold">
                    <span>Odds:</span>
                    <span className="text-amber-400 text-sm">{item.odds.toFixed(2)}</span>
                  </div>
                </div>
              ))}

              {/* Stake input */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Stake Amount</span>
                  <span className="font-mono text-slate-300">{getSymbol(currency)}{betStake}</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[100, 200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setBetStake(amt);
                      }}
                      className={`py-1 rounded-lg text-xs font-mono font-bold ${
                        betStake === amt
                          ? 'bg-sky-500 text-white'
                          : 'bg-[#11234c] text-slate-300 hover:bg-blue-900/50'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Return Calculation */}
              <div className="p-3 rounded-xl bg-[#0e1d44] border border-blue-500/20 text-xs flex items-center justify-between">
                <span className="text-slate-300">Est. Return:</span>
                <span className="text-base font-black font-mono text-emerald-400">
                  {getSymbol(currency)}{(betStake * (betSlip[0]?.odds || 1)).toFixed(2)}
                </span>
              </div>

              {/* Place Bet CTA */}
              <button
                type="button"
                id="place-sports-bet-btn"
                onClick={handlePlaceBetSlip}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-950/50 active:scale-95 transition-all cursor-pointer"
              >
                CONFIRM BET ({getSymbol(currency)}{betStake})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
