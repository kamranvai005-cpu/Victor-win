import { useState, useEffect } from 'react';
import { Sparkles, Trophy, Flame, TrendingUp, Crown } from 'lucide-react';
import { Currency } from '../types';
import { getCurrencySymbol } from '../utils/currency';

interface DailyRankLeaderboardProps {
  currency: Currency;
}

interface RankUser {
  rank: number;
  phone: string;
  avatar: string;
  profit: number;
  game: string;
}

export function DailyRankLeaderboard({ currency }: DailyRankLeaderboardProps) {
  const sym = getCurrencySymbol(currency);

  const [topWinners, setTopWinners] = useState<RankUser[]>([
    {
      rank: 2,
      phone: '017****8921',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      profit: 845200,
      game: 'Win Go 1M',
    },
    {
      rank: 1,
      phone: '018****4312',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
      profit: 1492500,
      game: 'Aviator Crash',
    },
    {
      rank: 3,
      phone: '019****9904',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
      profit: 593800,
      game: 'Fortune Tiger',
    },
  ]);

  const [otherRanks] = useState<RankUser[]>([
    { rank: 4, phone: '013****1129', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', profit: 384000, game: 'K3 Lotre' },
    { rank: 5, phone: '016****4872', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', profit: 295500, game: 'Lightning Roulette' },
    { rank: 6, phone: '017****5531', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', profit: 218200, game: 'TRX Win Go' },
    { rank: 7, phone: '018****6645', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80', profit: 176400, game: '5D Lotre' },
  ]);

  // Periodic random profit tick for live feeling
  useEffect(() => {
    const timer = setInterval(() => {
      setTopWinners((prev) =>
        prev.map((u) => ({
          ...u,
          profit: u.profit + (Math.random() < 0.3 ? Math.floor(Math.random() * 800) + 100 : 0),
        }))
      );
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const rank1 = topWinners.find((w) => w.rank === 1)!;
  const rank2 = topWinners.find((w) => w.rank === 2)!;
  const rank3 = topWinners.find((w) => w.rank === 3)!;

  return (
    <div className="w-full bg-[#08122c] border border-blue-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-6 overflow-hidden relative">
      {/* Glow Effects */}
      <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-md">
            <div className="w-full h-full bg-[#060e22] rounded-[14px] flex items-center justify-center text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white font-display flex items-center gap-2">
              <span>Daily Profit Leaderboard</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" /> LIVE
              </span>
            </h2>
            <p className="text-xs text-slate-400">Top real-time winning players and payout champions</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-mono block">Updated Real-Time</span>
          <span className="text-xs font-black text-emerald-400 font-mono flex items-center gap-1 justify-end">
            <TrendingUp className="w-3.5 h-3.5" /> High RTP
          </span>
        </div>
      </div>

      {/* Podium Stage Container */}
      <div className="relative z-10 w-full pt-4 pb-2">
        <div className="relative w-full max-w-lg mx-auto flex items-end justify-center min-h-[220px] sm:min-h-[260px]">
          {/* 3 Winning Champions Columns: Rank 2 (Left), Rank 1 (Center), Rank 3 (Right) */}
          <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-4 w-full px-2 sm:px-4 items-end">
            
            {/* Rank 2 (Silver) */}
            <div className="flex flex-col items-center text-center space-y-1.5">
              <div className="text-2xl animate-bounce" style={{ animationDuration: '3.2s' }}>
                🥈
              </div>
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
                <img
                  src={rank2.avatar}
                  alt={rank2.phone}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-slate-300 shadow-[0_0_12px_rgba(203,213,225,0.4)]"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 px-2 py-0.5 rounded-full bg-slate-700 border border-slate-300 text-slate-100 font-black text-[10px]">
                  2nd
                </span>
              </div>

              <div className="mt-1">
                <span className="text-[11px] sm:text-xs font-bold text-slate-200 block truncate max-w-[90px]">
                  {rank2.phone}
                </span>
                <span className="text-[10px] sm:text-xs font-mono font-black text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-600 block mt-0.5">
                  {sym}{rank2.profit.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-16 sm:h-20 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-700/60 rounded-t-2xl border-t-2 border-slate-400/40 flex items-center justify-center font-black font-mono text-slate-400 text-sm">
                2
              </div>
            </div>

            {/* Rank 1 (Gold - Highest on Podium) */}
            <div className="flex flex-col items-center text-center space-y-1.5 -mb-2 scale-105">
              <div className="text-3xl animate-bounce drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" style={{ animationDuration: '2.5s' }}>
                👑
              </div>
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                <img
                  src={rank1.avatar}
                  alt={rank1.phone}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)]"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 border border-yellow-200 text-slate-950 font-black text-[10px] shadow">
                  1st
                </span>
              </div>

              <div className="mt-1">
                <span className="text-xs sm:text-sm font-black text-amber-300 block truncate max-w-[100px]">
                  {rank1.phone}
                </span>
                <span className="text-xs font-mono font-black text-yellow-300 bg-amber-950/90 px-2.5 py-0.5 rounded-full border border-amber-400/60 shadow-md block mt-0.5">
                  {sym}{rank1.profit.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-amber-950 via-amber-900 to-amber-700/60 rounded-t-2xl border-t-2 border-amber-400 flex items-center justify-center font-black font-mono text-amber-300 text-base shadow-[0_0_25px_rgba(245,158,11,0.3)]">
                1
              </div>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="flex flex-col items-center text-center space-y-1.5">
              <div className="text-2xl animate-bounce" style={{ animationDuration: '3.8s' }}>
                🥉
              </div>
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
                <img
                  src={rank3.avatar}
                  alt={rank3.phone}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-amber-700 shadow-[0_0_12px_rgba(180,83,9,0.4)]"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 px-2 py-0.5 rounded-full bg-amber-900 border border-amber-600 text-amber-200 font-black text-[10px]">
                  3rd
                </span>
              </div>

              <div className="mt-1">
                <span className="text-[11px] sm:text-xs font-bold text-slate-200 block truncate max-w-[90px]">
                  {rank3.phone}
                </span>
                <span className="text-[10px] sm:text-xs font-mono font-black text-amber-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-amber-700/50 block mt-0.5">
                  {sym}{rank3.profit.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-12 sm:h-16 bg-gradient-to-t from-amber-950/80 via-slate-900 to-amber-900/40 rounded-t-2xl border-t-2 border-amber-700/50 flex items-center justify-center font-black font-mono text-amber-600 text-sm">
                3
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Ranks 4 to 7 list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-blue-900/50 relative z-10">
        {otherRanks.map((r) => (
          <div
            key={r.rank}
            className="flex items-center justify-between bg-[#060e22]/90 border border-blue-500/20 hover:border-sky-500/40 p-2.5 rounded-2xl transition-all shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-950 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-xs text-sky-300">
                {r.rank}
              </span>
              <img
                src={r.avatar}
                alt={r.phone}
                className="w-8 h-8 rounded-full object-cover border border-blue-400/40"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="text-xs font-bold text-slate-200 block">{r.phone}</span>
                <span className="text-[10px] text-slate-400">{r.game}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-black text-emerald-400 block">
                +{sym}{r.profit.toLocaleString()}
              </span>
              <span className="text-[9px] text-amber-400 font-bold">WINNER</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
