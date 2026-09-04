import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Trophy, Flame, Gift, ArrowRight, Play } from 'lucide-react';
import { sound } from '../utils/audio';

interface BannerSwiperProps {
  onSelectGame: (gameId: string) => void;
  onOpenDeposit: () => void;
  onOpenVip: () => void;
}

export function BannerSwiper({ onSelectGame, onOpenDeposit, onOpenVip }: BannerSwiperProps) {
  const slides = [
    {
      id: 'slide-wingo-jackpot',
      tag: '🔥 SUPER WIN GO 1M',
      badge: '৳1,000,000 DAILY POOL',
      title: 'Win Go 1-Min Lottery Jackpot',
      subtitle: 'Predict Red, Green or Violet. 9.8X Instant Payouts with Provably Fair RNG!',
      buttonText: 'Play Win Go Now',
      bgGradient: 'from-blue-950 via-[#0b1b42] to-[#06102b]',
      accentColor: 'from-amber-500 to-yellow-400',
      icon: <Sparkles className="w-5 h-5 text-amber-300" />,
      action: () => onSelectGame('wingo-1m'),
      bannerImage: 'https://ossimg.crhhh.com/bdtgame/banner/Banner_20250609152954s53v.png',
    },
    {
      id: 'slide-welcome-bonus',
      tag: '🎁 FIRST DEPOSIT OFFER',
      badge: '+100% CASH BONUS',
      title: '100% First Deposit Match Bonus',
      subtitle: 'Top up via bKash, Nagad or Rocket to get up to ৳20,000 free bonus chips instantly!',
      buttonText: 'Deposit & Claim Bonus',
      bgGradient: 'from-amber-950 via-[#231206] to-[#0c0818]',
      accentColor: 'from-amber-500 to-yellow-300',
      icon: <Gift className="w-5 h-5 text-amber-400" />,
      action: () => onOpenDeposit(),
      bannerImage: 'https://ossimg.crhhh.com/bdtgame/banner/Banner_202306171819486mih.jpg',
    },
    {
      id: 'slide-vip-rebate',
      tag: '👑 ELITE VIP CLUB',
      badge: 'WEEKLY & MONTHLY SALARY',
      title: 'VIP High-Roller Reward Program',
      subtitle: 'Level up your VIP grade to receive daily check-in mystery boxes & unlimited 1.5% betting rebates.',
      buttonText: 'Explore VIP Club',
      bgGradient: 'from-purple-950 via-[#180a32] to-[#08122c]',
      accentColor: 'from-purple-500 to-indigo-400',
      icon: <Trophy className="w-5 h-5 text-purple-300" />,
      action: () => onOpenVip(),
      bannerImage: 'https://ossimg.crhhh.com/bdtgame/other/h5setting_20250608220343iki2.png',
    },
    {
      id: 'slide-lucky-wheel',
      tag: '🎡 SUPER LUCKY WHEEL',
      badge: 'WIN UP TO ৳50,000',
      title: 'Daily Spin & Activity Center',
      subtitle: 'Complete daily betting tasks, spin the golden wheel and win guaranteed cash prizes.',
      buttonText: 'Spin & Win Cash',
      bgGradient: 'from-rose-950 via-[#260a1d] to-[#091533]',
      accentColor: 'from-rose-500 to-amber-400',
      icon: <Flame className="w-5 h-5 text-rose-400" />,
      action: () => onOpenVip(),
      bannerImage: 'https://ossimg.crhhh.com/bdtgame/other/h5setting_20250608220407uwfy.png',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    sound.playClick();
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    sound.playClick();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    sound.playClick();
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const current = slides[currentIndex];

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-blue-500/30 shadow-2xl group bg-[#08122c]">
      {/* Background container */}
      <div
        className={`w-full min-h-[220px] sm:min-h-[260px] md:min-h-[280px] bg-gradient-to-r ${current.bgGradient} p-4 sm:p-7 flex flex-col md:flex-row items-center justify-between relative overflow-hidden transition-all duration-700`}
      >
        {/* Glow orb backdrop */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

        {/* Content Side */}
        <div className="relative z-10 max-w-xl text-left flex flex-col items-start space-y-2 sm:space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-blue-400/40 text-[11px] font-bold text-sky-300 backdrop-blur-md">
              {current.icon}
              {current.tag}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] font-extrabold text-amber-300 font-mono">
              {current.badge}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display drop-shadow-md">
            {current.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed drop-shadow">
            {current.subtitle}
          </p>

          <div className="pt-2">
            <button
              type="button"
              id="banner-cta-button"
              onClick={() => {
                sound.playClick();
                current.action();
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r ${current.accentColor} text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-900/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer`}
            >
              <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>{current.buttonText}</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>

        {/* Graphic Official Banner Artwork */}
        <div className="relative z-10 hidden md:flex items-center justify-center w-72 h-56 shrink-0">
          <div className="relative w-64 h-44 rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-[0_0_35px_rgba(245,158,11,0.25)] transform hover:scale-105 transition-transform duration-300 bg-slate-950 flex items-center justify-center">
            <img
              src={current.bannerImage}
              alt={current.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060e20]/60 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Arrow Navigation */}
        <button
          type="button"
          id="banner-prev-btn"
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-blue-500/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-blue-600 transition-all z-20 cursor-pointer"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          id="banner-next-btn"
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-blue-500/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-blue-600 transition-all z-20 cursor-pointer"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Pagination Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentIndex
                  ? 'w-6 bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                  : 'w-2 bg-blue-900/80 hover:bg-blue-700'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
