import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  CreditCard,
  Sparkles,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Clock,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Currency } from '../types';
import { sound } from '../utils/audio';
import { getLocalConfig, saveDepositRequest, GatewayConfig } from '../utils/firebase';
import { addTodayDepositAmount } from '../utils/checkin';

interface DepositModalProps {
  onClose: () => void;
  userBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  currency: Currency;
  username?: string;
  userName?: string;
  userId?: string;
  userPhone?: string;
}

export function DepositModal({
  onClose,
  userBalance,
  onUpdateBalance,
  currency,
  username,
  userName = 'Player_889',
  userId = 'VW889241',
  userPhone = '01700000000',
}: DepositModalProps) {
  // Step 1: Selection | Step 2: Payment Gateway Page (আলাদা পেজ)
  const [step, setStep] = useState<1 | 2>(1);

  const [channel, setChannel] = useState<'bkash' | 'nagad' | 'rocket' | 'upay' | 'usdt'>('bkash');
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [senderNumber, setSenderNumber] = useState<string>(userPhone || '');
  const [trxId, setTrxId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingData, setPendingData] = useState<{ amount: number; bonus: number; trxId: string; method: string; senderNumber: string } | null>(null);
  const [successData, setSuccessData] = useState<{ amount: number; bonus: number } | null>(null);

  // Live Firebase Gateways
  const [liveGateways, setLiveGateways] = useState<Record<string, GatewayConfig>>(() => getLocalConfig().gateways);

  useEffect(() => {
    setLiveGateways(getLocalConfig().gateways);
  }, []);

  const getSymbol = (c: Currency) => (c === 'BDT' ? '৳' : c === 'INR' ? '₹' : '$');

  const channels = [
    {
      id: 'bkash',
      name: 'bKash (বিকাশ)',
      bnName: 'বিকাশ পেমেন্ট গেটওয়ে',
      badge: '+5% বোনাস',
      color: 'from-pink-600 to-rose-700',
      textColor: 'text-pink-400',
      borderColor: 'border-pink-500/40',
      number: liveGateways?.bkash?.number || '01799824105',
      accountType: liveGateways?.bkash?.transferType === 'cash_out' ? 'ক্যাশ আউট (Cash Out)' : 'সেন্ড মানি (Send Money)',
      transferType: liveGateways?.bkash?.transferType || 'send_money',
      instructions: [
        `আপনার bKash অ্যাপ অথবা *247# ডায়াল করে "${liveGateways?.bkash?.transferType === 'cash_out' ? 'ক্যাশ আউট (Cash Out)' : 'সেন্ড মানি (Send Money)'}" অপশনে যান।`,
        'উপরে দেওয়া অফিসিয়াল bKash নাম্বারে সঠিক পরিমাণ টাকা পাঠান।',
        'টাকা পাঠানোর পর প্রাপ্ত মেসেজ বা স্টেটমেন্ট থেকে ১০ সংখ্যার TrxID (ট্রানজেকশন আইডি) কপি করুন।',
        'নিচের বক্সে TrxID পেস্ট করে "পেমেন্ট নিশ্চিত করুন" বাটনে ক্লিক করুন।',
        '১-৩ মিনিটের মধ্যে স্বয়ংক্রিয়ভাবে ব্যালেন্স এবং ৫% অতিরিক্ত বোনাস যোগ হবে।',
      ],
    },
    {
      id: 'nagad',
      name: 'Nagad (নগদ)',
      bnName: 'নগদ পেমেন্ট গেটওয়ে',
      badge: '+5% বোনাস',
      color: 'from-orange-500 to-amber-700',
      textColor: 'text-orange-400',
      borderColor: 'border-orange-500/40',
      number: liveGateways?.nagad?.number || '01844912803',
      accountType: liveGateways?.nagad?.transferType === 'cash_out' ? 'ক্যাশ আউট (Cash Out)' : 'সেন্ড মানি (Send Money)',
      transferType: liveGateways?.nagad?.transferType || 'send_money',
      instructions: [
        `আপনার Nagad অ্যাপ অথবা *167# ডায়াল করে "${liveGateways?.nagad?.transferType === 'cash_out' ? 'ক্যাশ আউট (Cash Out)' : 'সেন্ড মানি (Send Money)'}" অপশনে যান।`,
        'সঠিক পরিমাণ টাকা পাঠানোর পর TrxID টি সংগ্রহ করুন।',
        'নিচের বক্সে TrxID ইনপুট দিন এবং সাবমিট করুন।',
        'আপনার একাউন্টে তৎক্ষণাৎ স্বয়ংক্রিয়ভাবে ব্যালেন্স জমা হবে।',
      ],
    },
    {
      id: 'rocket',
      name: 'Rocket (রকেট)',
      bnName: 'রকেট পেমেন্ট গেটওয়ে',
      badge: '+5% বোনাস',
      color: 'from-purple-600 to-indigo-800',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-500/40',
      number: liveGateways?.rocket?.number || '01912849201',
      accountType: liveGateways?.rocket?.transferType === 'cash_out' ? 'ক্যাশ আউট (Cash Out)' : 'সেন্ড মানি (Send Money)',
      transferType: liveGateways?.rocket?.transferType || 'send_money',
      instructions: [
        `আপনার Rocket একাউন্ট থেকে নির্ধারিত নাম্বারে "${liveGateways?.rocket?.transferType === 'cash_out' ? 'ক্যাশ আউট (Cash Out)' : 'সেন্ড মানি (Send Money)'}" করুন।`,
        'প্রাপ্ত TrxID সংগ্রহ করে নিচের বক্সে প্রদান করুন।',
      ],
    },
    {
      id: 'upay',
      name: 'Upay (উপায়)',
      bnName: 'উপায় পেমেন্ট গেটওয়ে',
      badge: '+5% বোনাস',
      color: 'from-emerald-600 to-teal-800',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      number: liveGateways?.upay?.number || '01711223344',
      accountType: liveGateways?.upay?.transferType === 'cash_out' ? 'ক্যাশ আউট (Cash Out)' : 'সেন্ড মানি (Send Money)',
      transferType: liveGateways?.upay?.transferType || 'send_money',
      instructions: [
        `Upay ওয়ালেট থেকে নাম্বারে "${liveGateways?.upay?.transferType === 'cash_out' ? 'ক্যাশ আউট (Cash Out)' : 'সেন্ড মানি (Send Money)'}" সম্পন্ন করুন এবং TrxID প্রদান করুন।`,
      ],
    },
    {
      id: 'usdt',
      name: 'USDT (TRC20)',
      bnName: 'ক্রিপ্টোকারেন্সি অটোমেটেড গেটওয়ে',
      badge: '+8% এক্সট্রা',
      color: 'from-teal-600 to-emerald-800',
      textColor: 'text-teal-400',
      borderColor: 'border-teal-500/40',
      number: liveGateways?.usdt?.number || 'TFx99aK8Lp2NqWvJ194xMv88aX99Victor',
      accountType: 'TRC20 Wallet Address',
      transferType: 'send_money',
      instructions: [
        'Binance বা TrustWallet থেকে TRC20 নেটওয়ার্ক সিলেক্ট করে ট্রান্সফার করুন।',
        'TXID (Transaction Hash) নিচের ফিল্ডে দিন।',
      ],
    },
  ];

  const selectedChannel = channels.find((c) => c.id === channel) || channels[0];
  const finalDepositAmount = customAmount ? parseFloat(customAmount) : amount;

  const handleCopy = () => {
    sound.playClick();
    navigator.clipboard.writeText(selectedChannel.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceedToStep2 = () => {
    if (isNaN(finalDepositAmount) || finalDepositAmount < 200) {
      alert('সর্বনিম্ন ডিপোজিট ২০০ টাকা। অনুগ্রহ করে সঠিক পরিমাণ সিলেক্ট করুন।');
      return;
    }
    sound.playClick();
    setStep(2);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTrx = trxId.trim();
    if (!cleanTrx || cleanTrx.length < 6) {
      alert('অনুগ্রহ করে সঠিক ট্রানজেকশন আইডি (TrxID) দিন (সর্বনিম্ন ৬-১০ অক্ষর)।');
      return;
    }

    const cleanSender = senderNumber.trim();
    if (!cleanSender) {
      alert('অনুগ্রহ করে যে নম্বর থেকে টাকা পাঠিয়েছেন সেই প্রেরক নম্বরটি লিখুন।');
      return;
    }

    setIsProcessing(true);
    sound.playChip();

    // 10% First Deposit / Special Bonus
    const bonus = Math.round(finalDepositAmount * 0.10);

    // Record in Firebase Realtime Deposit Queue with PENDING status for Admin Approval
    const newDepositRecord = {
      id: 'DEP_' + Date.now(),
      uid: userId || 'VW889241',
      username: username || userName,
      userName: userName,
      phone: userPhone,
      userPhone: userPhone,
      gateway: selectedChannel.name,
      method: selectedChannel.name,
      senderNumber: cleanSender,
      amount: finalDepositAmount,
      bonus,
      trxId: cleanTrx,
      status: 'pending' as const, // STRICTLY PENDING - Awaiting Admin Manual Approval
      createdAt: Date.now(),
      formattedTime: new Date().toLocaleTimeString(),
    };
    saveDepositRequest(newDepositRecord);
    addTodayDepositAmount(finalDepositAmount, userId || username);

    // After brief verification delay, show Pending Awaiting Admin Verification screen (NO auto-credit)
    setTimeout(() => {
      setIsProcessing(false);
      sound.playClick();
      setPendingData({
        amount: finalDepositAmount,
        bonus,
        trxId: cleanTrx,
        method: selectedChannel.name,
        senderNumber: cleanSender,
      });
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0c1b3d] via-[#08122c] to-[#040918] border border-blue-500/40 p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-slate-100">
        
        {/* Pending Approval Modal View */}
        {pendingData ? (
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-pulse">
              <Clock className="w-10 h-10" />
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider mb-2">
                ⏳ ডিপোজিট রিকোয়েস্ট অপেক্ষমান (Pending)
              </span>
              <h3 className="text-xl font-black text-white font-display">
                ডিপোজিট আবেদন সফলভাবে জমা হয়েছে!
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                আপনার TrxID ও পেমেন্ট রিকোয়েস্ট অ্যাডমিন প্যানেলে পাঠানো হয়েছে। অ্যাডমিন ট্রানজেকশন যাচাই করে অনুমোদন দেওয়ার সাথে সাথে ওয়ালেটে ব্যালেন্স ও ১০% ফার্স্ট ডিপোজিট বোনাস স্বয়ংক্রিয়ভাবে যুক্ত হবে।
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#060e22] border border-blue-500/30 text-left space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-blue-900/60 pb-2">
                <span className="text-slate-400">ডিপোজিট মেথড:</span>
                <span className="font-bold text-white">{pendingData.method}</span>
              </div>
              <div className="flex justify-between border-b border-blue-900/60 pb-2">
                <span className="text-slate-400">ডিপোজিট পরিমাণ:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {getSymbol(currency)}{pendingData.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-b border-blue-900/60 pb-2">
                <span className="text-slate-400">অনুমোদনে ১০% বোনাস:</span>
                <span className="font-mono font-black text-amber-300 text-sm">
                  +{getSymbol(currency)}{pendingData.bonus.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-b border-blue-900/60 pb-2">
                <span className="text-slate-400">ট্রানজেকশন আইডি (TrxID):</span>
                <span className="font-mono font-black text-amber-400 tracking-wider select-all">{pendingData.trxId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">প্রেরক নম্বর:</span>
                <span className="font-mono text-slate-200">{pendingData.senderNumber}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-left flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-300 leading-relaxed">
                সাধারণত ১ থেকে ৫ মিনিটের মধ্যে অ্যাডমিন ভেরিফিকেশন সম্পন্ন হয়। অনুমোদনের সাথে সাথে আপনার ব্যালেন্স আপডেট হয়ে যাবে।
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:brightness-110 text-white font-black text-sm shadow-xl shadow-blue-950/60 cursor-pointer transition-all active:scale-95"
            >
              ঠিক আছে (বন্ধ করুন)
            </button>
          </div>
        ) : successData ? (
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-display">ডিপোজিট সফল হয়েছে!</h3>
              <p className="text-xs text-slate-300 mt-1">
                আপনার {getSymbol(currency)}{successData.amount.toLocaleString()} + {getSymbol(currency)}{successData.bonus.toFixed(2)} বোনাস ওয়ালেটে সফলভাবে জমা হয়েছে।
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#060e22] border border-emerald-500/40 font-mono text-emerald-400 font-black text-xl">
              বর্তমান ব্যালেন্স: {getSymbol(currency)}{(userBalance).toFixed(2)}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-sm shadow-lg cursor-pointer"
            >
              এখনই গেম শুরু করুন
            </button>
          </div>
        ) : step === 1 ? (
          /* ================= STEP 1: PAYMENT METHOD & AMOUNT SELECTION ================= */
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-sky-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white font-display">
                    ডিপোজিট মেথড ও পরিমাণ সিলেক্ট করুন
                  </h2>
                  <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> ইনস্ট্যান্ট অটোমেটেড ২৪/৭ ক্রেডিট +৫% বোনাস
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Payment Channel Selector (bKash, Nagad, Rocket, Upay, USDT) */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-300 font-bold block">
                ১. পেমেন্ট মেথড নির্বাচন করুন (Select Gateway)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {channels.map((c) => {
                  const isSelected = channel === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setChannel(c.id as any);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/30 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-950/30'
                          : 'bg-[#060e22] border-blue-500/20 hover:border-blue-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{c.name}</span>
                        <span className="text-[9px] font-black text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded">
                          {c.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate">{c.bnName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Amount Selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">২. কত টাকা ডিপোজিট করবেন?</span>
                <span className="text-sky-400 font-mono">মিনিমাম ২০০ - সর্বোচ্চ ৫০,০০০</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[200, 500, 1000, 2500, 5000, 10000].map((amt) => {
                  const isSelected = amount === amt && !customAmount;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-2.5 rounded-xl text-xs font-mono font-black transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md ring-1 ring-yellow-300 font-black'
                          : 'bg-[#060e22] text-slate-300 border border-blue-500/20 hover:bg-blue-900/40'
                      }`}
                    >
                      {getSymbol(currency)}{amt}
                    </button>
                  );
                })}
              </div>

              {/* Custom Input */}
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 text-xs font-bold">
                  {getSymbol(currency)}
                </span>
                <input
                  type="number"
                  placeholder="অন্যান্য পরিমাণ লিখুন (যেমন: ১৫০০)..."
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full bg-[#060e22] border border-blue-500/30 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Selected Summary Card */}
            <div className="p-3 rounded-2xl bg-[#060e22] border border-blue-500/30 flex items-center justify-between text-xs">
              <span className="text-slate-400">মোট ডিপোজিট পরিমাণ:</span>
              <span className="font-mono text-base font-black text-amber-400">
                {getSymbol(currency)}{finalDepositAmount.toLocaleString()} (+৫% বোনাস)
              </span>
            </div>

            {/* Submit & Go To Step 2 (আলাদা পেজ) */}
            <button
              type="button"
              onClick={handleProceedToStep2}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:brightness-110 text-slate-950 font-black text-sm shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <span>সাবমিট করে পেমেন্ট পেজে যান</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* ================= STEP 2: DEDICATED PAYMENT GATEWAY PAGE (আলাদা পেজ) ================= */
          <form onSubmit={handleFinalSubmit} className="space-y-4 animate-in fade-in">
            {/* Dedicated Gateway Header with Back Button */}
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setStep(1);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#060e22] border border-blue-500/30 hover:bg-blue-600/30 text-sky-300 font-bold text-xs cursor-pointer transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>পিছনে যান</span>
              </button>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">পেমেন্ট গেটওয়ে</span>
                <span className="text-xs font-black text-amber-400 font-mono">
                  অর্ডার আইডি: #{Date.now().toString().slice(-6)}
                </span>
              </div>
            </div>

            {/* Gateway Logo & Amount Display Banner */}
            <div className={`p-4 rounded-2xl bg-gradient-to-r ${selectedChannel.color} text-white shadow-xl flex items-center justify-between`}>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black">{selectedChannel.name}</span>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    {selectedChannel.accountType}
                  </span>
                </div>
                <p className="text-xs text-white/90">
                  টাকা পাঠানোর পর ট্রানজেকশন আইডি সাবমিট করুন
                </p>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] text-white/80 block uppercase font-bold">ডিপোজিট পরিমাণ</span>
                <span className="text-xl sm:text-2xl font-black">
                  {getSymbol(currency)}{finalDepositAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Official Merchant Number Box with One-Click Copy */}
            <div className="p-4 rounded-2xl bg-[#060e22] border border-amber-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  অফিসিয়াল {selectedChannel.name} নাম্বার:
                </span>
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  পদ্ধতি: {selectedChannel.accountType}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#08122c] border border-blue-500/40">
                <span className="font-mono font-black text-amber-300 text-base sm:text-lg tracking-wider select-all">
                  {selectedChannel.number}
                </span>
                <button
                  type="button"
                  id="copy-merchant-num-btn"
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 shadow-md cursor-pointer'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'কপি হয়েছে!' : 'নাম্বার কপি করুন'}</span>
                </button>
              </div>
            </div>

            {/* Step 3: Enter Sender Number & TrxID */}
            <div className="space-y-1.5">
              <label htmlFor="sender-number-input" className="text-xs text-slate-300 font-bold flex items-center justify-between">
                <span>যে নম্বর থেকে টাকা পাঠিয়েছেন (প্রেরক নম্বর):</span>
                <span className="text-slate-400 font-mono text-[11px]">মোবাইল নম্বর</span>
              </label>
              <input
                type="tel"
                id="sender-number-input"
                required
                placeholder="যেমন: 017XXXXXXXX বা 019XXXXXXXX"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                className="w-full bg-[#060e22] border-2 border-blue-500/40 focus:border-amber-400 rounded-xl px-4 py-3 text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none tracking-wider"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="trx-id-input" className="text-xs text-slate-300 font-bold flex items-center justify-between">
                <span>ট্রানজেকশন আইডি (TrxID) বসান:</span>
                <span className="text-amber-400 font-mono text-[11px]">৮-১০ ডিজিটের কোড</span>
              </label>
              <input
                type="text"
                id="trx-id-input"
                required
                placeholder="যেমন: 9J284KSL91 বা 829410"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                className="w-full bg-[#060e22] border-2 border-blue-500/40 focus:border-amber-400 rounded-xl px-4 py-3 text-sm font-mono font-black text-white placeholder-slate-500 focus:outline-none uppercase tracking-wider"
              />
            </div>

            {/* Bengali Step-by-Step Instructions & Rules (নিয়মাবলী) */}
            <div className="p-3.5 rounded-2xl bg-[#060e22] border border-blue-500/25 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <HelpCircle className="w-4 h-4" />
                <span>পেমেন্ট নিয়মাবলী ও নির্দেশিকা (Rules):</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-300 list-decimal list-inside leading-relaxed">
                {selectedChannel.instructions.map((ins, i) => (
                  <li key={i}>{ins}</li>
                ))}
              </ul>
            </div>

            {/* Confirm Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                id="confirm-deposit-submit-btn"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:brightness-110 text-white font-black text-sm shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>ভেরিফাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>পেমেন্ট নিশ্চিত করুন (Confirm Deposit)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
