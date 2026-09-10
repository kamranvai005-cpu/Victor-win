import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowDownToLine,
  CheckCircle2,
  X,
  AlertCircle,
  PlusCircle,
  Trash2,
  Clock,
  ShieldCheck,
  History,
  Lock,
  ChevronRight,
  Info,
  Check,
  Smartphone,
  Wallet,
  Building2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Currency, UserBoundWallet } from '../types';
import { sound } from '../utils/audio';
import { getCurrencySymbol } from '../utils/currency';
import {
  saveWithdrawalRequest,
  WithdrawalRequest,
  getUserWallets,
  saveUserWallet,
  deleteUserWallet,
  isWalletNumberAlreadyUsed,
  getLocalWithdrawalRequests,
} from '../utils/firebase';

interface WithdrawModalProps {
  onClose: () => void;
  userBalance: number;
  onUpdateBalance: (newBalance: number, isBet?: boolean) => void;
  currency: Currency;
  userId?: string;
  username?: string;
  userPhone?: string;
}

const WALLET_METHODS = [
  {
    id: 'bkash' as const,
    name: 'বিকাশ',
    sub: 'bKash Wallet',
    color: 'from-[#e2136e] to-[#c2185b]',
    bgLight: 'bg-[#fdf2f7] border-[#f8bbd0]',
    textColor: 'text-[#e2136e]',
    badge: 'সবচেয়ে দ্রুত (Instant)',
    icon: '🟣',
  },
  {
    id: 'nagad' as const,
    name: 'নগদ',
    sub: 'Nagad Wallet',
    color: 'from-[#f7931e] to-[#e65100]',
    bgLight: 'bg-[#fff7ed] border-[#fed7aa]',
    textColor: 'text-[#ea580c]',
    badge: '২৪/৭ ক্যাশ আউট',
    icon: '🟠',
  },
  {
    id: 'rocket' as const,
    name: 'রকেট',
    sub: 'Rocket DBBL',
    color: 'from-[#8e24aa] to-[#6a1b9a]',
    bgLight: 'bg-[#faf5ff] border-[#e9d5ff]',
    textColor: 'text-[#8e24aa]',
    badge: 'সুরক্ষিত পেমেন্ট',
    icon: '🟣',
  },
  {
    id: 'upay' as const,
    name: 'উপায়',
    sub: 'Upay UCB',
    color: 'from-[#0284c7] to-[#0369a1]',
    bgLight: 'bg-[#f0f9ff] border-[#bae6fd]',
    textColor: 'text-[#0284c7]',
    badge: '০% ফি',
    icon: '🔵',
  },
];

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 25000];

export function WithdrawModal({
  onClose,
  userBalance,
  onUpdateBalance,
  currency,
  userId = 'VW889241',
  username = 'Player_8892',
  userPhone = '01712345678',
}: WithdrawModalProps) {
  const sym = getCurrencySymbol(currency);
  const userKey = userId || userPhone;

  // Wallets state
  const [wallets, setWallets] = useState<UserBoundWallet[]>(() => getUserWallets(userKey));
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');

  // Add wallet form state
  const [isAddingWallet, setIsAddingWallet] = useState<boolean>(false);
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank'>('bkash');
  const [newAccountNumber, setNewAccountNumber] = useState<string>('');
  const [newAccountName, setNewAccountName] = useState<string>(username || '');
  const [walletError, setWalletError] = useState<string>('');

  // Withdrawal form state
  const [amount, setAmount] = useState<string>('500');
  const [pin, setPin] = useState<string>('1234');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [submittedReq, setSubmittedReq] = useState<WithdrawalRequest | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Initialize selected wallet
  useEffect(() => {
    const fresh = getUserWallets(userKey);
    setWallets(fresh);
    if (fresh.length > 0 && !selectedWalletId) {
      setSelectedWalletId(fresh[0].id);
    }
  }, [userKey]);

  // If no wallet bound, auto show add wallet form
  useEffect(() => {
    if (wallets.length === 0) {
      setIsAddingWallet(true);
    }
  }, [wallets.length]);

  // Handle Save Wallet
  const handleSaveWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWalletError('');

    const cleanNum = newAccountNumber.replace(/\D/g, '');
    if (!cleanNum || cleanNum.length < 11) {
      setWalletError('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল ব্যাংকিং নম্বর লিখুন (যেমন: 017xxxxxxxx)');
      sound.playFail();
      return;
    }

    if (!newAccountName.trim()) {
      setWalletError('অনুগ্রহ করে ওয়ালেট হোল্ডারের নাম লিখুন।');
      sound.playFail();
      return;
    }

    if (wallets.length >= 2) {
      setWalletError('একটি একাউন্টে সর্বোচ্চ ২টি ওয়ালেট সেট করা যাবে।');
      sound.playFail();
      return;
    }

    // Universal Phone Number Uniqueness Check!
    if (isWalletNumberAlreadyUsed(cleanNum)) {
      setWalletError('❌ এই নাম্বারটি ইতিমধ্যে অন্য একটি ওয়ালেটে ব্যবহৃত হয়েছে! একটি নাম্বার শুধুমাত্র একবার ব্যবহার করা যাবে।');
      sound.playFail();
      return;
    }

    const res = saveUserWallet(userKey, {
      method,
      accountNumber: cleanNum,
      accountName: newAccountName.trim(),
    });

    if (!res.success) {
      setWalletError(res.message);
      sound.playFail();
      return;
    }

    sound.playWin();
    confetti({ particleCount: 70, spread: 60 });
    const fresh = getUserWallets(userKey);
    setWallets(fresh);
    if (res.wallet) {
      setSelectedWalletId(res.wallet.id);
    } else if (fresh.length > 0) {
      setSelectedWalletId(fresh[0].id);
    }
    setIsAddingWallet(false);
    setNewAccountNumber('');
  };

  // Handle Delete Wallet
  const handleDeleteWallet = (walletId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    if (window.confirm('আপনি কি নিশ্চিত যে এই ওয়ালেট অ্যাকাউন্টটি মুছে ফেলতে চান?')) {
      deleteUserWallet(userKey, walletId);
      const fresh = getUserWallets(userKey);
      setWallets(fresh);
      if (selectedWalletId === walletId) {
        setSelectedWalletId(fresh.length > 0 ? fresh[0].id : '');
      }
      if (fresh.length === 0) {
        setIsAddingWallet(true);
      }
    }
  };

  // Handle Withdrawal Request Submit
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount < 500) {
      alert('সর্বনিম্ন উত্তোলনের পরিমাণ ৫০০ টাকা (Minimum withdrawal amount is 500 BDT)');
      sound.playFail();
      return;
    }

    if (withdrawAmount > 50000) {
      alert('একবারে সর্বোচ্চ ৫০,০০০ টাকা উত্তোলন করা সম্ভব।');
      sound.playFail();
      return;
    }

    if (withdrawAmount > userBalance) {
      alert('আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।');
      sound.playFail();
      return;
    }

    const chosenWallet = wallets.find((w) => w.id === selectedWalletId) || wallets[0];
    if (!chosenWallet) {
      alert('অনুগ্রহ করে প্রথমে আপনার উইথড্র ওয়ালেট নির্বাচন করুন।');
      setIsAddingWallet(true);
      return;
    }

    setIsSubmitting(true);
    sound.playChip();

    const newReqId = 'WTH_' + Date.now();
    const newReq: WithdrawalRequest = {
      id: newReqId,
      uid: userId,
      username: username,
      phone: userPhone,
      method: chosenWallet.method,
      accountNumber: chosenWallet.accountNumber,
      accountName: chosenWallet.accountName,
      amount: withdrawAmount,
      status: 'pending',
      createdAt: Date.now(),
      formattedTime: new Date().toLocaleTimeString(),
    };

    saveWithdrawalRequest(newReq);
    setSubmittedReq(newReq);

    setTimeout(() => {
      setIsSubmitting(false);
      onUpdateBalance(userBalance - withdrawAmount, false);
      setSuccess(true);
      sound.playWin();
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    }, 800);
  };

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId) || wallets[0];
  const myHistory = getLocalWithdrawalRequests().filter((r) => r.uid === userId || r.phone === userPhone);

  return (
    <div className="fixed inset-0 z-50 bg-[#f4f6fb] text-slate-900 flex flex-col overflow-y-auto animate-in fade-in">
      {/* Top Mobile-App Header Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 py-3 sm:px-6 flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="flex items-center gap-2 text-slate-700 hover:text-slate-950 font-bold text-sm cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5 text-slate-800" />
          <span className="hidden sm:inline">ফিরে যান (Back)</span>
        </button>

        <h1 className="text-base sm:text-lg font-black text-slate-900 font-display flex items-center gap-2">
          <ArrowDownToLine className="w-5 h-5 text-emerald-600" />
          <span>উত্তোলন (Withdrawal)</span>
        </h1>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setShowHistory(!showHistory);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
            showHistory
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>হিস্ট্রি ({myHistory.length})</span>
        </button>
      </div>

      {/* Main Full-Screen Body Container */}
      <div className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-5 pb-24">
        {/* Withdrawable Balance Card (Balance is Deep Black as explicitly requested) */}
        <div className="relative rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  উত্তোলনযোগ্য ব্যালেন্স (Available Balance)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                  সরাসরি ক্যাশ আউট
                </span>
              </div>
              {/* BALANCE IN PURE BLACK TEXT */}
              <div className="mt-1">
                <span className="text-3xl sm:text-4xl font-black font-mono text-black tracking-tight">
                  {sym}{userBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200/60">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>নিরাপদ ও এনক্রিপ্টেড গেটওয়ে</span>
            </div>
          </div>
        </div>

        {/* History Modal Drawer / View */}
        {showHistory && (
          <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <span>আপনার সাম্প্রতিক উত্তোলনের তালিকা</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                বন্ধ করুন ✕
              </button>
            </div>

            {myHistory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">এখনো কোনো উত্তোলন রিকোয়েস্ট নেই।</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {myHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 uppercase">{item.method}</span>
                        <span className="font-mono text-slate-600">{item.accountNumber}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{item.formattedTime || new Date(item.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-black text-sm block">
                        {sym}{item.amount}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          item.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.status === 'rejected'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.status === 'approved'
                          ? 'অনুমোদিত (Paid)'
                          : item.status === 'rejected'
                          ? 'বাতিল (Rejected)'
                          : 'অপেক্ষমাণ (Pending)'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Success Confirmation View */}
        {success ? (
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 text-center space-y-5 shadow-sm animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                উইথড্র রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
                আপনার {sym}{amount} টাকা উত্তোলনের আবেদনটি সিস্টেমে জমা হয়েছে। এডমিন প্যানেলে ভেরিফাই করে সরাসরি আপনার {submittedReq?.method.toUpperCase()} ({submittedReq?.accountNumber}) নম্বরে টাকা পাঠানো হবে।
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 font-mono max-w-md mx-auto">
              <div className="flex justify-between text-slate-600">
                <span>ট্রানজেকশন আইডি:</span>
                <span className="text-slate-900 font-bold">{submittedReq?.id}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>উত্তোলন মেথড:</span>
                <span className="text-emerald-700 font-bold uppercase">{submittedReq?.method}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>প্রাপক নম্বর:</span>
                <span className="text-slate-900 font-bold">{submittedReq?.accountNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>হোল্ডারের নাম:</span>
                <span className="text-slate-900 font-bold">{submittedReq?.accountName}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                <span>স্ট্যাটাস:</span>
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 animate-spin" /> এডমিন রিভিউ পেন্ডিং (Pending)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setSuccess(false);
                onClose();
              }}
              className="w-full max-w-md mx-auto py-3.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-sm shadow-md transition-all cursor-pointer"
            >
              সম্পন্ন (Done)
            </button>
          </div>
        ) : (
          <>
            {/* Wallet Section (Max 2 Wallets & Universal Uniqueness Enforced) */}
            <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    <span>ক্যাশআউট ওয়ালেট অ্যাকাউন্ট (Withdrawal Wallet)</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    একটি অ্যাকাউন্টে সর্বোচ্চ ২টি ওয়ালেট যুক্ত করা যায় ({wallets.length}/2)
                  </p>
                </div>

                {/* Add Button styled with Red and Green colors as explicitly requested */}
                {wallets.length < 2 && !isAddingWallet && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setIsAddingWallet(true);
                      setWalletError('');
                    }}
                    className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-emerald-600 hover:from-red-500 hover:to-emerald-500 text-white font-black text-xs shadow-md shadow-red-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border border-red-400/40"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ ওয়ালেট যোগ করুন</span>
                  </button>
                )}
              </div>

              {/* Add / Bind Wallet Form */}
              {isAddingWallet ? (
                <form
                  onSubmit={handleSaveWalletSubmit}
                  className="rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:p-5 space-y-4 animate-in fade-in"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>নতুন ওয়ালেট অ্যাকাউন্ট সেট করুন (Setup Wallet)</span>
                    </span>
                    {wallets.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setIsAddingWallet(false);
                        }}
                        className="text-xs text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
                      >
                        বাতিল ✕
                      </button>
                    )}
                  </div>

                  {walletError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2 animate-in shake">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <span>{walletError}</span>
                    </div>
                  )}

                  {/* Step 1: Select Method (বিকাশ / নগদ / রকেট / উপায়) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      ১. পেমেন্ট মেথড নির্বাচন করুন (Select Method)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {WALLET_METHODS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setMethod(m.id);
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            method === m.id
                              ? `${m.bgLight} border-2 border-slate-900 shadow-sm`
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-lg">{m.icon}</span>
                            {method === m.id && <Check className="w-3.5 h-3.5 text-slate-900" />}
                          </div>
                          <div className="mt-2">
                            <span className="font-black text-xs text-slate-900 block">{m.name}</span>
                            <span className="text-[10px] text-slate-500 block leading-tight">{m.badge}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Account Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      ২. {method.toUpperCase()} মোবাইল নম্বর দিন (Phone / Account Number)
                    </label>
                    <input
                      type="tel"
                      required
                      value={newAccountNumber}
                      onChange={(e) => {
                        setNewAccountNumber(e.target.value);
                        if (walletError) setWalletError('');
                      }}
                      placeholder="যেমন: 017xxxxxxxx"
                      maxLength={11}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-xs"
                    />
                    <p className="text-[11px] text-slate-500">
                      * সতর্কতা: একটি নম্বর কেবল একটি ওয়ালেটেই ব্যবহারযোগ্য। অন্য কোনো অ্যাকাউন্টে ব্যবহৃত নম্বর গ্রহণযোগ্য নয়।
                    </p>
                  </div>

                  {/* Step 3: Account Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      ৩. ওয়ালেট হোল্ডারের পুরো নাম (Account Holder Name)
                    </label>
                    <input
                      type="text"
                      required
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      placeholder="জাতীয় পরিচয়পত্র বা অ্যাপের সাথে মিল রেখে লিখুন"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-xs"
                    />
                  </div>

                  {/* Add Button with Red and Green styling */}
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-emerald-600 hover:from-red-500 hover:to-emerald-500 text-white font-black text-sm shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 border border-red-400/40"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>ওয়ালেট সংরক্ষণ করুন (Save Wallet)</span>
                  </button>
                </form>
              ) : null}

              {/* Bound Wallets Cards List */}
              {wallets.length === 0 && !isAddingWallet ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                  <Wallet className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-bold">কোনো ওয়ালেট যুক্ত করা নেই</p>
                  <p className="text-[11px] text-slate-400">টাকা তোলার জন্য প্রথমে বিকাশ অথবা নগদ অ্যাকাউন্ট সেট করুন।</p>
                  {/* Red and Green Add Button */}
                  <button
                    type="button"
                    onClick={() => setIsAddingWallet(true)}
                    className="mt-2 inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-emerald-600 text-white font-black text-xs shadow cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>ওয়ালেট সেট করুন</span>
                  </button>
                </div>
              ) : null}

              {wallets.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {wallets.map((w) => {
                    const isSel = selectedWalletId === w.id;
                    const methodInfo = WALLET_METHODS.find((m) => m.id === w.method) || WALLET_METHODS[0];
                    return (
                      <div
                        key={w.id}
                        onClick={() => {
                          sound.playClick();
                          setSelectedWalletId(w.id);
                        }}
                        className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between shadow-xs ${
                          isSel
                            ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                            : 'bg-slate-50 border-slate-200/90 text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{methodInfo.icon}</span>
                            <div>
                              <span className="text-xs font-black uppercase tracking-wider block">
                                {methodInfo.name}
                              </span>
                              <span className={`text-[10px] font-mono ${isSel ? 'text-slate-300' : 'text-slate-500'}`}>
                                {w.accountName}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isSel ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                                ✓
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteWallet(w.id, e)}
                              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                isSel ? 'text-slate-400 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                              }`}
                              title="Delete this wallet"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200/30 flex items-center justify-between">
                          <span className={`text-sm font-mono font-black tracking-wider ${isSel ? 'text-emerald-300' : 'text-slate-900'}`}>
                            {w.accountNumber}
                          </span>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            isSel ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {isSel ? 'নির্বাচিত (Selected)' : 'ট্যাপ করুন'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Withdrawal Amount & Form */}
            <form onSubmit={handleWithdrawSubmit} className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  উত্তোলনের পরিমাণ লিখুন (Withdraw Amount)
                </span>
                <span className="text-xs text-slate-500">
                  সর্বনিম্ন: ৫০০ ৳ | সর্বোচ্চ: ৫০,০০০ ৳
                </span>
              </div>

              {/* Amount Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-xl font-mono font-black text-slate-400">{sym}</span>
                </div>
                <input
                  type="number"
                  required
                  min={500}
                  max={50000}
                  step={10}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-24 py-3.5 text-xl font-mono font-black text-black focus:bg-white focus:outline-none focus:border-slate-900 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setAmount(Math.min(50000, Math.floor(userBalance)).toString());
                  }}
                  className="absolute inset-y-1.5 right-1.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black transition-colors cursor-pointer"
                >
                  সব টাকা (All)
                </button>
              </div>

              {/* Quick Amount Chips */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {QUICK_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setAmount(val.toString());
                    }}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                      amount === val.toString()
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {sym}{val}
                  </button>
                ))}
              </div>

              {/* PIN / Password */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>সিকিউরিটি ফান্ড পাসওয়ার্ড / পিন (Fund Password)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">ডিফল্ট: 1234</span>
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-black focus:outline-none focus:border-slate-900 shadow-xs"
                />
              </div>

              {/* Summary calculations */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>উত্তোলন ফি (Processing Fee):</span>
                  <span className="font-bold text-emerald-600">০.০০ ৳ (Free)</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900">
                  <span>আপনি পাবেন (You Receive):</span>
                  <span className="font-mono text-black font-black text-sm">
                    {sym}{parseFloat(amount || '0').toLocaleString()}
                  </span>
                </div>
                {selectedWallet && (
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    <span>প্রাপক ওয়ালেট:</span>
                    <span className="font-bold uppercase text-slate-800">
                      {selectedWallet.method} ({selectedWallet.accountNumber})
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Withdrawal Button */}
              <button
                type="submit"
                disabled={isSubmitting || wallets.length === 0 || parseFloat(amount || '0') > userBalance}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-700/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    <span>প্রসেসিং হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-5 h-5" />
                    <span>উইথড্র নিশ্চিত করুন (Confirm Withdrawal)</span>
                  </>
                )}
              </button>
            </form>

            {/* Withdrawal Rules Card */}
            <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm space-y-2 text-xs text-slate-600">
              <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>উত্তোলন নির্দেশিকা ও নীতিমালা</span>
              </h4>
              <ul className="space-y-1.5 list-disc pl-4 text-slate-500 text-[11px] leading-relaxed">
                <li>উত্তোলনের সময়সীমা: সপ্তাহে ৭ দিন, ২৪ ঘণ্টা যেকোনো সময় আবেদন করা যাবে।</li>
                <li>সাধারণত আবেদনের ৫-১৫ মিনিটের মধ্যে টাকা আপনার অ্যাকাউন্টে জমা হয়ে যায়।</li>
                <li>নিরাপত্তা নীতি: একটি মোবাইল ব্যাংকিং নম্বর সিস্টেমে কেবল একটি অ্যাকাউন্টের সাথে যুক্ত হতে পারে।</li>
                <li>কোনো সমস্যা হলে অবিলম্বে আমাদের টেলিগ্রাম অথবা ২৪/৭ লাইভ সাপোর্টে যোগাযোগ করুন।</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
