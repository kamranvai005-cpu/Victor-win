import {
  Sparkles,
  Zap,
  ChevronRight,
  Gem,
  Rocket,
  Gamepad2,
  Play,
} from 'lucide-react';
import { Currency } from '../types';
import { sound } from '../utils/audio';

interface MiniGamesLobbyProps {
  onSelectGame: (gameId: string) => void;
  currency: Currency;
  userBalance: number;
}

export function MiniGamesLobby({
  onSelectGame,
}: MiniGamesLobbyProps) {
  const miniGames = [
    {
      id: 'aviator-classic',
      name: 'Aviator Crash Pro',
      bengaliName: 'এভিয়েটর ক্র্যাশ প্রো',
      subtitle: 'High Multiplier Flight & Auto Cashout',
      desc: 'Watch the lucky plane take flight and cash out before it flies away! Multiplier reaches up to 1000X.',
      badge: 'HOTTEST',
      badgeColor: 'bg-rose-500 text-white',
      multiplier: '1,000X',
      players: 32450,
      themeBg: 'from-[#2b0e14] via-[#1c0f2b] to-[#12285a]',
      borderColor: 'border-rose-500/40 hover:border-rose-400',
      accentColor: 'text-rose-400',
      glowShadow: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]',
      icon: <Rocket className="w-6 h-6 text-rose-400 animate-pulse" />,
    },
    {
      id: 'mines-pro',
      name: 'Mines Pro (Original)',
      bengaliName: 'মাইনস প্রো ডায়মন্ড',
      subtitle: '5x5 Grid Custom Bomb & Diamond Reveal',
      desc: 'Pick your bomb count (1 to 24), flip glowing tiles to uncover sparkling gems, and cash out anytime.',
      badge: 'TOP CHOICE',
      badgeColor: 'bg-amber-500 text-slate-950',
      multiplier: '5,000X',
      players: 24190,
      themeBg: 'from-[#241a08] via-[#1c183b] to-[#0f234a]',
      borderColor: 'border-amber-500/40 hover:border-amber-400',
      accentColor: 'text-amber-400',
      glowShadow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      icon: <Gem className="w-6 h-6 text-amber-400" />,
    },
    {
      id: 'plinko-1000x',
      name: 'Plinko 1000X',
      bengaliName: 'প্লিঙ্কো পিরামিড',
      subtitle: 'Pyramid Pegboard Multi-ball Drop',
      desc: 'Drop vibrant bouncing balls through customizable rows (8-16) and volatility risk levels for 1000X wins.',
      badge: 'POPULAR',
      badgeColor: 'bg-purple-600 text-white',
      multiplier: '1,000X',
      players: 18760,
      themeBg: 'from-[#1e0e33] via-[#091b3b] to-[#152a5c]',
      borderColor: 'border-purple-500/40 hover:border-purple-400',
      accentColor: 'text-purple-400',
      glowShadow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      icon: <Zap className="w-6 h-6 text-purple-400" />,
    },
    {
      id: 'space-man',
      name: 'Spaceman Flight',
      bengaliName: 'স্পেসম্যান মহাকাশ যাত্রা',
      subtitle: 'Pragmatic Cosmic Multiplier',
      desc: 'Cosmic astronaut ascent with 50% partial auto-cashout mechanism and live multiplier climbs.',
      badge: 'PRAGMATIC',
      badgeColor: 'bg-sky-500 text-slate-950',
      multiplier: '5,000X',
      players: 15300,
      themeBg: 'from-[#0b2744] via-[#091d3d] to-[#162754]',
      borderColor: 'border-sky-500/40 hover:border-sky-400',
      accentColor: 'text-sky-400',
      glowShadow: 'shadow-[0_0_20px_rgba(56,189,248,0.15)]',
      icon: <Sparkles className="w-6 h-6 text-sky-400" />,
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in relative">
      {/* Category Header */}
      <div className="relative rounded-3xl overflow-hidden p-5 sm:p-6 border border-blue-500/30 shadow-2xl bg-[#08122c]">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-lg">
              <div className="w-full h-full bg-[#08122c] rounded-[14px] flex items-center justify-center text-purple-300">
                <Gamepad2 className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white font-display flex items-center gap-2">
                <span>HG Originals & Mini Games</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                  INSTANT CASHOUT
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Real-time multiplier crash and provably fair fast mini games
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-black/50 border border-purple-500/40 text-xs font-mono font-bold text-purple-300">
              ⚡ 4 Original Titles
            </span>
          </div>
        </div>
      </div>

      {/* Mini Games Window Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {miniGames.map((game) => (
          <div
            key={game.id}
            onClick={() => {
              sound.playClick();
              onSelectGame(game.id);
            }}
            className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-b ${game.themeBg} border ${game.borderColor} p-3 sm:p-4 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${game.glowShadow} cursor-pointer flex flex-col justify-between space-y-3`}
          >
            {/* Top Badges */}
            <div className="flex items-center justify-between gap-1">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${game.badgeColor} shadow`}>
                {game.badge}
              </span>
              <span className={`text-[10px] sm:text-xs font-black font-mono ${game.accentColor}`}>
                {game.multiplier}
              </span>
            </div>

            {/* Central Window Icon */}
            <div className="flex flex-col items-center text-center space-y-2 py-1">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#060e22]/90 border border-blue-500/30 shadow-inner flex items-center justify-center group-hover:scale-110 transition-transform">
                {game.icon}
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-black text-white font-display group-hover:text-amber-300 transition-colors leading-tight">
                  {game.name}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-amber-300 font-semibold mt-0.5">
                  {game.bengaliName}
                </p>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  {game.players.toLocaleString()} খেলছেন
                </span>
              </div>
            </div>

            {/* Launch CTA */}
            <button
              type="button"
              className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 group-hover:from-amber-400 group-hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all group-hover:scale-102 active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>PLAY NOW</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
