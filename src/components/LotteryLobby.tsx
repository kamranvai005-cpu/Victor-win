import { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  ArrowRight,
  Flame,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { Currency } from '../types';
import { sound } from '../utils/audio';
import { getLocalConfig, subscribeSystemConfig } from '../utils/firebase';

interface LotteryLobbyProps {
  onSelectGame: (gameType: 'wingo' | 'k3' | '5d' | 'trx-wingo', duration?: number) => void;
  currency: Currency;
  userBalance: number;
}

export function LotteryLobby({
  onSelectGame,
}: LotteryLobbyProps) {
  const [comingSoonModal, setComingSoonModal] = useState<{ name: string; icon: string; releaseDate: string } | null>(null);
  const [notified, setNotified] = useState(false);

  // Live Firebase Config for dynamic game activation
  const [config, setConfig] = useState(() => getLocalConfig());

  useEffect(() => {
    const unsub = subscribeSystemConfig((newCfg) => {
      setConfig(newCfg);
    });
    return () => unsub();
  }, []);

  const rawLotteries = [
    {
      id: 'wingo' as const,
      name: 'Win Go',
      icon: 'https://ossimg.crhhh.com/bdtgame/lotterycategory/lotterycategory_20230725010909y1nq.png',
      badge: 'HOT',
    },
    {
      id: 'k3' as const,
      name: 'K3 Lotre',
      icon: 'https://ossimg.crhhh.com/bdtgame/lotterycategory/lotterycategory_20230725010913mj7d.png',
      badge: 'POPULAR',
    },
    {
      id: '5d' as const,
      name: '5D Lotre',
      icon: 'https://ossimg.crhhh.com/bdtgame/lotterycategory/lotterycategory_20230725010917k23a.png',
      badge: 'NEW',
    },
    {
      id: 'trx-wingo' as const,
      name: 'Trx Win Go',
      icon: 'https://ossimg.crhhh.com/bdtgame/lotterycategory/lotterycategory_20230725010924w4lh.png',
      badge: 'CRYPTO',
    },
    {
      id: 'motorace' as const,
      name: 'MotoRace',
      icon: 'https://ossimg.crhhh.com/bdtgame/lotterycategory/lotterycategory_20250506012221lpd7.png',
      badge: 'COMING SOON',
      releaseDate: 'October 2026',
    },
    {
      id: 'videowingo' as const,
      name: 'Video WinGo',
      icon: 'https://ossimg.crhhh.com/bdtgame/lotterycategory/lotterycategory_20250620113521afx3.png',
      badge: 'COMING SOON',
      releaseDate: 'November 2026',
    },
  ];

  const lotteries = rawLotteries.map((lottery) => {
    const status = config.gameStatuses[lottery.id];
    const isComingSoon = status ? status !== 'active' : (lottery.badge === 'COMING SOON');
    return {
      ...lottery,
      isComingSoon,
    };
  });

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Category Header */}
      <div className="relative rounded-3xl overflow-hidden p-5 sm:p-6 border border-blue-500/30 shadow-2xl bg-gradient-to-r from-[#08122c] via-[#0b1b42] to-[#08122c]">

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg">
              <div className="w-full h-full bg-[#08122c] rounded-[14px] flex items-center justify-center">
                <img
                  src="https://ossimg.crhhh.com/bdtgame/gamecategory/gamecategory_20230725010810ntvi.png"
                  alt="Lottery"
                  className="w-8 h-8 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white font-display flex items-center gap-2">
                <span>Lottery Gaming Center</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                  PROVABLY FAIR RNG
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Click any lottery game to enter the live round arena and select durations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-black/50 border border-amber-500/40 text-xs font-mono font-bold text-amber-300">
              ⚡ 6 Lottery Types
            </span>
          </div>
        </div>
      </div>

      {/* Clean Lottery Game Cards Grid: ONLY Name & Logo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
        {lotteries.map((lottery) => (
          <div
            key={lottery.id}
            onClick={() => {
              sound.playClick();
              if (lottery.isComingSoon) {
                setNotified(false);
                setComingSoonModal({
                  name: lottery.name,
                  icon: lottery.icon,
                  releaseDate: lottery.releaseDate || 'Coming Soon',
                });
              } else {
                onSelectGame(lottery.id as any, 1);
              }
            }}
            className="group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#060e24] border border-blue-500/30 hover:border-amber-400 p-4 sm:p-5 shadow-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] cursor-pointer flex flex-col items-center justify-center text-center space-y-3"
          >
            {/* Top Status Tag */}
            <div className="w-full flex items-center justify-between">
              <span
                className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  lottery.isComingSoon
                    ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                    : lottery.badge === 'HOT'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {lottery.badge}
              </span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            {/* Official Logo Art */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black/40 border border-blue-400/30 p-2 shadow-lg group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
              <img
                src={lottery.icon}
                alt={lottery.name}
                className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Clean Game Name */}
            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-black text-white font-display group-hover:text-amber-300 transition-colors">
                {lottery.name}
              </h3>
              <p className="text-[11px] text-sky-400 font-bold flex items-center justify-center gap-1">
                <span>{lottery.isComingSoon ? 'Coming Soon' : 'Play Live Arena'}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon Modal */}
      {comingSoonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#0c1b3d] border border-amber-500/40 p-6 text-center shadow-2xl space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[#060e22] border border-blue-500/40 p-3 flex items-center justify-center shadow-lg">
              <img
                src={comingSoonModal.icon}
                alt={comingSoonModal.name}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <span className="px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/40">
                COMING SOON
              </span>
              <h3 className="text-xl font-black text-white font-display mt-2">
                {comingSoonModal.name}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                This game is currently under final testing and will be launched soon!
              </p>
              <p className="text-xs text-amber-300 font-mono font-bold mt-2">
                Expected Release: {comingSoonModal.releaseDate}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playWin();
                setNotified(true);
              }}
              disabled={notified}
              className={`w-full py-3 rounded-2xl font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all ${
                notified
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:brightness-110 text-slate-950 cursor-pointer active:scale-95'
              }`}
            >
              {notified ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Notification Subscribed!</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Notify Me on Launch</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setComingSoonModal(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
