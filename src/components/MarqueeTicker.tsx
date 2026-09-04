import { Bell, Coins } from 'lucide-react';
import { RECENT_WINNERS } from '../data/mockData';
import { Currency } from '../types';

interface MarqueeTickerProps {
  currency: Currency;
}

export function MarqueeTicker({ currency }: MarqueeTickerProps) {
  const getSymbol = (c: Currency) => (c === 'BDT' ? '৳' : c === 'INR' ? '₹' : '$');

  return (
    <div className="w-full rounded-2xl bg-[#091738]/95 border border-blue-500/30 px-3 py-2 flex items-center gap-2.5 overflow-hidden shadow-inner backdrop-blur-sm">
      {/* Official Notice Tip Icon */}
      <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40 text-amber-300 text-xs font-black">
        <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
        <span className="font-display tracking-wide">NOTICE</span>
      </div>

      {/* Marquee ticker track */}
      <div className="relative flex-1 overflow-hidden">
        <div className="animate-marquee flex items-center gap-8 text-xs whitespace-nowrap">
          {RECENT_WINNERS.concat(RECENT_WINNERS).map((winner, idx) => (
            <div key={idx} className="inline-flex items-center gap-1.5 text-slate-300">
              <span className="text-sm">{winner.avatar}</span>
              <span className="text-slate-300 font-mono font-bold">{winner.user}</span>
              <span className="text-slate-400">won</span>
              <span className="font-extrabold font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-500/40 flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400" />
                {getSymbol(currency)}{winner.amount.toLocaleString()}
              </span>
              <span className="text-slate-400">in</span>
              <span className="text-sky-300 font-bold">{winner.game}</span>
              <span className="text-blue-500/40 ml-2">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
