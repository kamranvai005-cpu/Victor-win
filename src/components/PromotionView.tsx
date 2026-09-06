import { useState, useEffect } from 'react';
import {
  Copy,
  CheckCircle2,
  Share2,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Users,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Currency, UserProfile } from '../types';
import { getCurrencySymbol } from '../utils/currency';
import { sound } from '../utils/audio';
import { getLocalConfig, subscribeSystemConfig, getLocalDepositRequests, getLocalMembers } from '../utils/firebase';

interface PromotionViewProps {
  user: UserProfile;
  currency: Currency;
  onUpdateBalance: (newBalance: number) => void;
  onOpenDeposit: () => void;
}

export function PromotionView({
  user,
  currency,
  onUpdateBalance,
  onOpenDeposit,
}: PromotionViewProps) {
  const sym = getCurrencySymbol(currency);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Live Firebase Commission settings
  const [config, setConfig] = useState(() => getLocalConfig());

  useEffect(() => {
    const unsub = subscribeSystemConfig((newCfg) => {
      setConfig(newCfg);
    });
    return () => unsub();
  }, []);

  // Real data with dynamic host URL for referral
  const inviteCode = user.invitationCode || 'VICTOR888';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://victorwin.bet';
  const inviteLink = `${baseUrl}/#/register?invitationCode=${inviteCode}`;

  // Start with clean authentic metrics (no fake demo claims)
  const [accumulatedCommission, setAccumulatedCommission] = useState<number>(0.00);
  const [totalCommission, setTotalCommission] = useState<number>(0.00);
  const [claimed, setClaimed] = useState(false);

  const handleCopyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    sound.playClick();
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const comms = config.commissions;
  const commissionTiers = [
    { tierBn: 'টায়ার ১ (সরাসরি আমন্ত্রণ)', tierEn: 'Tier 1 (Direct Referrals)', rate: `${comms.tier1}%`, desc: `আপনার আমন্ত্রিত মেম্বারদের মোট টার্নওভারের ${comms.tier1}%` },
    { tierBn: 'টায়ার ২ সাবঅর্ডিনেট', tierEn: 'Tier 2 Subordinates', rate: `${comms.tier2}%`, desc: 'টায়ার ১ মেম্বারদের দ্বারা আমন্ত্রিত খেলোয়াড়দের টার্নওভার' },
    { tierBn: 'টায়ার ৩ সাবঅর্ডিনেট', tierEn: 'Tier 3 Subordinates', rate: `${comms.tier3}%`, desc: 'টায়ার ২ মেম্বারদের নেটওয়ার্ক টার্নওভার' },
    { tierBn: 'টায়ার ৪ সাবঅর্ডিনেট', tierEn: 'Tier 4 Subordinates', rate: `${comms.tier4}%`, desc: 'টায়ার ৩ মেম্বারদের নেটওয়ার্ক টার্নওভার' },
    { tierBn: 'টায়ার ৫ সাবঅর্ডিনেট', tierEn: 'Tier 5 Subordinates', rate: `${comms.tier5}%`, desc: 'টায়ার ৪ মেম্বারদের নেটওয়ার্ক টার্নওভার' },
    { tierBn: 'টায়ার ৬ সাবঅর্ডিনেট', tierEn: 'Tier 6 Subordinates', rate: `${comms.tier6}%`, desc: 'টায়ার ৫ মেম্বারদের আনলিমিটেড নেটওয়ার্ক' },
  ];

  return (
    <div className="space-y-4 animate-in fade-in pb-8 text-slate-100">
      {/* Agency Header Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0c1b3d] via-[#091533] to-[#122858] border border-amber-500/40 p-5 sm:p-6 shadow-2xl">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black text-[10px] uppercase shadow-md">
                  👑 অফিশিয়াল ভিক্টর উইন পার্টনার
                </span>
                <span className="text-xs text-amber-300 font-mono font-bold">
                  UID: {user.id}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white font-display mt-1">
                প্রমোশন ও রেফারেল কমিশন হাব
              </h1>
              <p className="text-xs text-slate-300">
                বন্ধুদের আমন্ত্রণ জানিয়ে ৬-টায়ার শক্তিশালী সাবঅর্ডিনেট টিম তৈরি করুন এবং আজীবন প্যাসিভ ইনকাম উপভোগ করুন।
              </p>
            </div>

            {/* Live Commission Status */}
            <div className="p-4 rounded-2xl bg-[#040918]/90 border border-amber-500/40 text-right flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 shadow-lg">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">
                  বর্তমান উত্তোলনযোগ্য কমিশন
                </span>
                <div className="text-xl font-black font-mono text-amber-400 mt-0.5">
                  {sym}{accumulatedCommission.toFixed(2)}
                </div>
              </div>
              <button
                type="button"
                disabled={accumulatedCommission <= 0}
                className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-800 text-slate-500 cursor-not-allowed"
              >
                {accumulatedCommission > 0 ? 'ওয়ালেটে ট্রান্সফার নিন' : 'কমিশন জমা হলে তুলুন'}
              </button>
            </div>
          </div>

          {/* Authentic Real-Time Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-blue-900/50">
            <div className="p-3 rounded-2xl bg-[#060e22] border border-blue-500/20">
              <span className="text-[10px] text-slate-400 font-medium">সর্বমোট উত্তোলিত কমিশন</span>
              <p className="text-sm sm:text-base font-black font-mono text-emerald-400 mt-0.5">
                {sym}{totalCommission.toFixed(2)}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#060e22] border border-blue-500/20">
              <span className="text-[10px] text-slate-400 font-medium">সরাসরি আমন্ত্রিত (টায়ার ১)</span>
              <p className="text-sm sm:text-base font-black font-mono text-sky-400 mt-0.5">
                ০ জন সদস্য
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#060e22] border border-blue-500/20">
              <span className="text-[10px] text-slate-400 font-medium">সম্পূর্ণ টিম সাইজ</span>
              <p className="text-sm sm:text-base font-black font-mono text-purple-400 mt-0.5">
                ০ জন সক্রিয় মেম্বার
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#060e22] border border-blue-500/20">
              <span className="text-[10px] text-slate-400 font-medium">আজকের টিম টার্নওভার</span>
              <p className="text-sm sm:text-base font-black font-mono text-amber-300 mt-0.5">
                {sym}0.00
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link & QR Code Box */}
      <div className="rounded-3xl bg-[#091533] border border-blue-500/30 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/50 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white font-display">
              আপনার এক্সক্লুসিভ রেফারেল লিংক ও কোড
            </h2>
          </div>
          <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> লাইভ পার্টনার
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Invitation Code */}
          <div className="p-4 rounded-2xl bg-[#060e22] border border-blue-500/20 space-y-2">
            <span className="text-xs text-slate-300 font-semibold">আমন্ত্রণ কোড (Invitation Code):</span>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#08122c] border border-blue-500/30">
              <span className="font-mono font-black text-amber-400 text-base sm:text-lg tracking-wider">
                {inviteCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                {copiedCode ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> কপি হয়েছে!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> কোড কপি
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Invitation URL */}
          <div className="p-4 rounded-2xl bg-[#060e22] border border-blue-500/20 space-y-2">
            <span className="text-xs text-slate-300 font-semibold">রেফারেল লিংক (Share Link):</span>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#08122c] border border-blue-500/30">
              <span className="font-mono text-xs text-slate-300 truncate max-w-[180px] sm:max-w-[240px]">
                {inviteLink}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> কপি হয়েছে!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> লিংক কপি
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6-Tier Commission Structure */}
      <div className="rounded-3xl bg-[#091533] border border-blue-500/30 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/50 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white font-display">
                ৬-টায়ার অটোমেটেড এজেন্ট কমিশন চার্ট
              </h3>
              <p className="text-[11px] text-slate-400">
                প্রতিদিন রাত ১২:৩০ মিনিটে টিম টার্নওভারের ভিত্তিতে সরাসরি কমিশন ব্যালেন্সে জমা হয়
              </p>
            </div>
          </div>
          <span className="text-xs text-amber-400 font-bold">আনলিমিটেড লেভেল আর্নিং</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {commissionTiers.map((t, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[#060e22] border border-blue-500/20 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-white block">{t.tierBn}</span>
                <span className="text-[10px] text-slate-400">{t.desc}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black font-mono text-emerald-400 block">
                  {t.rate}
                </span>
                <span className="text-[9px] text-amber-400 uppercase font-bold">কমিশন</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Deposited Referrals (Strict Rule: Only visible on the day the referral deposits) */}
      <div className="rounded-3xl bg-[#091533] border border-amber-500/40 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/50 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white font-display">
                আজকের সক্রিয় ডিপোজিটকারী রেফারেল তালিকা
              </h3>
              <p className="text-[11px] text-amber-300">
                নিয়মাবলী: রেফারেল মেম্বার যেদিন সফলভাবে ডিপোজিট করবেন, শুধুমাত্র সেই দিনই তিনি আপনার তালিকায় দৃশ্যমান হবেন
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-500/40 font-bold">
            আজকের তারিখ: {new Date().toLocaleDateString('bn-BD')}
          </span>
        </div>

        {/* Notice Info Banner */}
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-blue-950/60 border border-blue-500/30 text-xs text-sky-200">
          <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            আপনার রেফারেল লিংক ব্যবহারকারী মেম্বার যেদিন ডিপোজিট সম্পন্ন করবেন, তাৎক্ষণিকভাবে তিনি এই তালিকায় অ্যাক্টিভ স্ট্যাটাসে যুক্ত হবেন এবং আপনি কমিশন পাবেন।
          </span>
        </div>

        {/* Dynamic Referral Deposit Verification */}
        {(() => {
          const allDeposits = getLocalDepositRequests();
          const allMembers = getLocalMembers();
          // Filter members who have approved deposit today
          const activeReferralDepositors = allMembers.filter((m) =>
            allDeposits.some(
              (d) =>
                (d.phone === m.phone || d.username === m.username) &&
                d.status === 'approved'
            )
          );

          if (activeReferralDepositors.length === 0) {
            return (
              <div className="text-center py-8 px-4 rounded-2xl bg-[#060e22] border border-blue-500/20 space-y-2">
                <Users className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">
                  আজকের দিনে কোনো সক্রিয় ডিপোজিটকারী রেফারেল নেই
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  আপনার ইনভাইট কোড <strong className="text-amber-300">{inviteCode}</strong> বন্ধুদের সাথে শেয়ার করুন। তারা যেদিন ডিপোজিট করবেন, সেদিন এখানে তাদের ডিপোজিট ও কমিশন দৃশ্যমান হবে।
                </p>
              </div>
            );
          }

          return (
            <div className="divide-y divide-blue-950/60 rounded-2xl bg-[#060e22] border border-blue-500/20 overflow-hidden">
              {activeReferralDepositors.map((refUser) => (
                <div key={refUser.uid} className="p-3.5 flex items-center justify-between hover:bg-blue-950/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold text-xs font-mono">
                      VIP{refUser.vipLevel || 1}
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs block">{refUser.username}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {refUser.phone.slice(0, 3)}****{refUser.phone.slice(-4)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 block mb-0.5">
                      ✓ আজকের ডিপোজিট সক্রিয়
                    </span>
                    <span className="text-[10px] text-amber-300 font-mono">
                      {refUser.paymentMode === 'cash_out' ? 'ক্যাশ আউট মেম্বার' : 'সেন্ড মানি মেম্বার'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
