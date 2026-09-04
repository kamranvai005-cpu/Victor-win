import { useState } from 'react';
import { Crown, Sparkles, X, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, Currency } from '../types';
import { VIP_TIERS } from '../data/mockData';
import { sound } from '../utils/audio';

interface VipActivityModalProps {
  user: UserProfile;
  onClose: () => void;
  currency: Currency;
  onUpdateBalance: (newBalance: number) => void;
}

export function VipActivityModal({
  user,
  onClose,
  currency,
  onUpdateBalance,
}: VipActivityModalProps) {
  const [activeTab, setActiveTab] = useState<'vip' | 'attendance' | 'wheel'>('vip');
  const [claimedDays, setClaimedDays] = useState<number[]>([1, 2]);
  const [wheelSpinning, setWheelSpinning] = useState<boolean>(false);
  const [wheelResult, setWheelResult] = useState<number | null>(null);

  const getSymbol = (c: Currency) => (c === 'BDT' ? '৳' : c === 'INR' ? '₹' : '$');

  const attendanceDays = [
    { day: 1, reward: 50, label: '১ম দিন', icon: '🪙' },
    { day: 2, reward: 80, label: '২য় দিন', icon: '💰' },
    { day: 3, reward: 120, label: '৩য় দিন', icon: '🎁' },
    { day: 4, reward: 200, label: '৪র্থ দিন', icon: '💎' },
    { day: 5, reward: 300, label: '৫ম দিন', icon: '🏆' },
    { day: 6, reward: 500, label: '৬ষ্ঠ দিন', icon: '👑' },
    { day: 7, reward: 1000, label: '৭ম দিন', icon: '🌟' },
  ];

  const handleClaimDay = (day: number, reward: number) => {
    if (claimedDays.includes(day)) return;

    sound.playWin();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    setClaimedDays([...claimedDays, day]);
    onUpdateBalance(user.balance + reward);
  };

  const handleSpinWheel = () => {
    if (wheelSpinning) return;
    setWheelSpinning(true);
    setWheelResult(null);

    const tickInterval = setInterval(() => sound.playSpinTick(), 100);

    setTimeout(() => {
      clearInterval(tickInterval);
      const prizes = [100, 200, 500, 1000, 2000, 5000];
      const win = prizes[Math.floor(Math.random() * prizes.length)];
      setWheelResult(win);
      setWheelSpinning(false);

      sound.playWin();
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      onUpdateBalance(user.balance + win);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#060e22] border-2 border-amber-500/50 p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white font-display">
                VIP প্রিভিলেজ ও রিওয়ার্ড সেন্টার
              </h2>
              <p className="text-[11px] text-amber-300 font-semibold">
                ডেইলি চেক-ইন, লাকি স্পিন এবং ভিআইপি মাসিক বেতন ও ক্যাশব্যাক
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-2 bg-[#060e22] p-1.5 rounded-2xl border border-blue-500/25 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('vip');
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'vip'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            👑 VIP ক্লাব
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('attendance');
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            📅 ৭ দিনের বোনাস
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('wheel');
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'wheel'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            🎡 লাকি স্পিন
          </button>
        </div>

        {/* Tab 1: VIP Club Tier Progression */}
        {activeTab === 'vip' && (
          <div className="space-y-4 animate-in fade-in">
            {/* User Level Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-blue-950/60 to-[#08122c] border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 border border-amber-300 flex items-center justify-center p-1 text-slate-950 font-black text-sm">
                    VIP{user.vipLevel}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">গোল্ড VIP মেম্বার (Level {user.vipLevel})</h3>
                    <p className="text-xs text-amber-300/90 flex items-center gap-1">
                      মাসিক বেতন: <span className="font-mono font-bold">{getSymbol(currency)}3,500</span>
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-500/40">
                  {user.vipExp} / {user.nextVipExp} EXP
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-blue-950 overflow-hidden border border-blue-900">
                <div
                  style={{ width: `${(user.vipExp / user.nextVipExp) * 100}%` }}
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full"
                />
              </div>
            </div>

            {/* VIP Monthly Salary & Status Claim Window Rule: Only on 1st of the month */}
            <div className="p-4 rounded-2xl bg-[#060e22] border border-amber-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  ভিআইপি মাসিক বেতন ও স্ট্যাটাস ক্লেইম
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  new Date().getDate() === 1
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                }`}>
                  {new Date().getDate() === 1 ? 'উইন্ডো উন্মুক্ত (আজ ১ তারিখ)' : `বন্ধ (আজ মাসের ${new Date().getDate()} তারিখ)`}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                {new Date().getDate() === 1 ? (
                  <span className="text-emerald-300 font-medium">
                    ✓ আজ মাসের ১ তারিখ! আপনার VIP{user.vipLevel} মাসিক বেতন {getSymbol(currency)}3,500 ক্লেইম করার উইন্ডো এখন সক্রিয়।
                  </span>
                ) : (
                  <span className="text-amber-200/90 font-medium">
                    ⚠️ নিয়মাবলী: ভিআইপি স্ট্যাটাস আপগ্রেড এবং মাসিক বেতন শুধুমাত্র প্রতি মাসের ১ তারিখে গ্রহণ করা যাবে। পরবর্তী উইন্ডো আগামী মাসের ১ তারিখ।
                  </span>
                )}
              </p>

              <button
                type="button"
                disabled={new Date().getDate() !== 1}
                onClick={() => {
                  if (new Date().getDate() === 1) {
                    sound.playWin();
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                    onUpdateBalance(user.balance + 3500);
                  }
                }}
                className={`w-full py-2.5 rounded-xl text-xs font-black transition-all shadow-md ${
                  new Date().getDate() === 1
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {new Date().getDate() === 1 ? `মাসিক বেতন ক্লেইম করুন (${getSymbol(currency)}3,500)` : '🔒 প্রতি মাসের ১ তারিখে সক্রিয় হবে'}
              </button>
            </div>

            {/* VIP Tiers Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300">VIP লেভেল প্রিভিলেজ চার্ট</span>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {VIP_TIERS.map((tier) => (
                  <div
                    key={tier.level}
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                      tier.level === user.vipLevel
                        ? 'bg-amber-500/15 border-amber-400 text-amber-200 shadow-md'
                        : 'bg-[#060e22] border-blue-500/20 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-mono font-black text-xs">
                        V{tier.level}
                      </div>
                      <div>
                        <span className="font-black font-mono text-amber-400 block">VIP {tier.level}</span>
                        <span className="text-[10px] text-slate-400">{tier.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span>রিবেট: {tier.rebate}</span>
                      <span className="text-emerald-400 font-bold">
                        বেতন: {getSymbol(currency)}{tier.monthlySalary}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 7-Day Attendance Check-in */}
        {activeTab === 'attendance' && (
          <div className="space-y-3 animate-in fade-in">
            <p className="text-xs text-slate-300">
              প্রতিদিন চেক-ইন করে বোনাস ক্রেডিট গ্রহণ করুন! সম্পূর্ণ ৭ দিন পূরণ করলে পাবেন {getSymbol(currency)}1,000 এর স্পেশাল ক্যাশ বোনাস।
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {attendanceDays.map((item) => {
                const isClaimed = claimedDays.includes(item.day);
                const isNext = item.day === claimedDays.length + 1;

                return (
                  <div
                    key={item.day}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-between text-center relative ${
                      isClaimed
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                        : isNext
                        ? 'bg-amber-950/40 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400/50'
                        : 'bg-[#060e22] border-blue-500/20 text-slate-400 opacity-60'
                    }`}
                  >
                    <span className="text-[11px] font-bold">{item.label}</span>
                    <div className="text-2xl my-1">
                      {item.icon}
                    </div>
                    <span className="font-mono font-black text-sm flex items-center gap-1 text-amber-300">
                      +{getSymbol(currency)}{item.reward}
                    </span>

                    <button
                      type="button"
                      disabled={isClaimed || !isNext}
                      onClick={() => handleClaimDay(item.day, item.reward)}
                      className={`w-full mt-2 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        isClaimed
                          ? 'bg-emerald-800/40 text-emerald-300 cursor-default'
                          : isNext
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isClaimed ? 'নেওয়া হয়েছে' : isNext ? 'এখনই নিন' : 'লকড'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Lucky Spin Wheel */}
        {activeTab === 'wheel' && (
          <div className="text-center space-y-4 py-3 animate-in fade-in">
            <p className="text-xs text-slate-300">
              ভাগ্য পরীক্ষা করুন! প্রতি স্পিনে সর্বোচ্চ {getSymbol(currency)}5,000 পর্যন্ত রিয়েল রিওয়ার্ড জিতুন।
            </p>

            <div className="p-6 rounded-3xl bg-[#060e22] border border-blue-500/30 flex flex-col items-center justify-center space-y-3">
              <div
                className={`w-28 h-28 rounded-full border-4 border-amber-400 flex items-center justify-center bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)] text-4xl ${
                  wheelSpinning ? 'animate-spin' : ''
                }`}
              >
                🎁
              </div>

              {wheelResult && (
                <p className="text-sm font-black text-emerald-400 animate-bounce">
                  🎉 অভিনন্দন! জিতেছেন +{getSymbol(currency)}{wheelResult}!
                </p>
              )}

              <button
                type="button"
                disabled={wheelSpinning}
                onClick={handleSpinWheel}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-950/50 cursor-pointer active:scale-95 transition-all"
              >
                {wheelSpinning ? 'হুইল ঘুরছে...' : 'লাকি স্পিন চালু করুন'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
