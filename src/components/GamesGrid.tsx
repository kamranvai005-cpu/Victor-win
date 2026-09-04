import { Flame, Sparkles, Play } from 'lucide-react';
import { GameItem, Currency } from '../types';
import { sound } from '../utils/audio';

interface GamesGridProps {
  games: GameItem[];
  currency: Currency;
  onSelectGame: (gameId: string) => void;
}

export function GamesGrid({ games, currency, onSelectGame }: GamesGridProps) {
  const getSymbol = (c: Currency) => (c === 'BDT' ? '৳' : c === 'INR' ? '₹' : '$');

  if (games.length === 0) {
    return (
      <div className="w-full py-12 text-center rounded-2xl bg-[#09152e] border border-blue-500/20">
        <p className="text-slate-400 text-xs">No games found matching your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3">
      {games.map((game) => (
        <div
          key={game.id}
          id={`game-card-${game.id}`}
          className="group relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#091533] border border-blue-500/20 hover:border-amber-400/80 shadow-md hover:shadow-xl hover:shadow-amber-950/40 transition-all duration-200 flex flex-col cursor-pointer active:scale-95"
          onClick={() => {
            sound.playClick();
            onSelectGame(game.id);
          }}
        >
          {/* Game Thumbnail / Compact Icon */}
          <div className="relative aspect-square w-full overflow-hidden bg-slate-950 rounded-t-xl sm:rounded-t-2xl">
            <img
              src={game.image}
              alt={game.title}
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#091533] via-transparent to-transparent opacity-60" />

            {/* Badges: Hot / New */}
            <div className="absolute top-1 left-1 flex items-center gap-0.5 pointer-events-none">
              {game.hot && (
                <span className="flex items-center gap-0.5 px-1 py-0.2 rounded bg-gradient-to-r from-red-600 to-amber-600 text-[8px] sm:text-[9px] font-black text-white shadow">
                  <Flame className="w-2.5 h-2.5 fill-white" /> HOT
                </span>
              )}
              {game.isNew && (
                <span className="flex items-center gap-0.5 px-1 py-0.2 rounded bg-gradient-to-r from-emerald-600 to-teal-500 text-[8px] sm:text-[9px] font-black text-white shadow">
                  <Sparkles className="w-2.5 h-2.5 fill-white" /> NEW
                </span>
              )}
            </div>

            {/* Official Start Button on Hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 border-2 border-yellow-200 p-1.5 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.9)] transform scale-80 group-hover:scale-100 transition-transform text-slate-950">
                <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
              </div>
            </div>
          </div>

          {/* Compact Game Info */}
          <div className="p-1.5 sm:p-2 flex-1 flex flex-col justify-between text-center bg-[#07112a]">
            <div>
              <p className="text-[9px] sm:text-[10px] text-amber-400 font-semibold truncate">
                {game.provider}
              </p>
              <h3 className="text-[10px] sm:text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate mt-0.5">
                {game.title}
              </h3>
            </div>

            <div className="mt-1 pt-1 border-t border-blue-950 flex items-center justify-between text-[8px] sm:text-[9px] text-slate-400 font-mono">
              <span className="text-emerald-400 font-bold">
                {getSymbol(currency)}{game.minBet}
              </span>
              <span className="text-amber-400 font-bold">
                ★ {game.rating}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

