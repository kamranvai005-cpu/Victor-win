import React, { useState } from 'react';
import { ArrowDownToLine, CheckCircle2, X, AlertCircle, Lock, Clock } from 'lucide-react';
import { Currency } from '../types';
import { sound } from '../utils/audio';
import { saveWithdrawalRequest, WithdrawalRequest } from '../utils/firebase';

interface WithdrawModalProps {
  onClose: () => void;
  userBalance: number;
  onUpdateBalance: (newBalance: number, isBet?: boolean) => void;
  currency: Currency;
  userId?: string;
  username?: string;
  userPhone?: string;
}

export function WithdrawModal({
  onClose,
  userBalance,
  onUpdateBalance,
  currency,
  userId = 'VW889241',
  username = 'Player_8892',
  userPhone = '01712345678',
}: WithdrawModalProps) {
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'bank' | 'usdt'>('bkash');
  const [accountNumber, setAccountNumber] = useState<string>(userPhone || '01799824105');
  const [accountName, setAccountName] = useState<string>(username || 'Kamran Ahmed');
  const [amount, setAmount] = useState<string>('1000');
  const [pin, setPin] = useState<string>('1234');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedReq, setSubmittedReq] = useState<WithdrawalRequest | null>(null);

  const getSymbol = (c: Currency) => (c === 'BDT' ? '৳' : c === 'INR' ? '₹' : '$');

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount < 500) {
      alert('সর্বনিম্ন উইথড্র পরিমাণ ৫০০ টাকা (Minimum withdrawal amount is 500)।');
      return;
    }

    if (withdrawAmount > userBalance) {
      alert('আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই (Withdrawal exceeds balance)।');
      return;
    }

    if (!accountNumber.trim()) {
      alert('অনুগ্রহ করে সঠিক প্রাপক নম্বর বা একাউন্ট নম্বর দিন।');
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
      method,
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
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
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#060e22] border border-blue-500/40 p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-white font-display">
                Fast Withdrawals
              </h2>
              <p className="text-[11px] text-slate-400">Available: {getSymbol(currency)}{userBalance.toFixed(2)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-display">উইথড্র রিকোয়েস্ট সফলভাবে গৃহীত!</h3>
              <p className="text-xs text-slate-300 mt-2">
                আপনার {getSymbol(currency)}{amount} টাকা উত্তোলনের রিকোয়েস্টটি এডমিন প্যানেলে অনুমোদনের অপেক্ষায় পাঠানো হয়েছে। এডমিন ভেরিফাই করে আপনার {method.toUpperCase()} ({accountNumber}) নম্বরে টাকা পাঠিয়ে দেবেন।
              </p>
            </div>
            <div className="p-3 bg-[#060e22] rounded-2xl border border-blue-500/30 text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>রিকোয়েস্ট আইডি:</span>
                <span className="text-amber-400 font-bold">{submittedReq?.id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>উইথড্র মেথড:</span>
                <span className="text-white uppercase font-bold">{method}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>একাউন্ট নম্বর:</span>
                <span className="text-white">{accountNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>স্ট্যাটাস:</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 animate-spin" /> এডমিন রিভিউ পেন্ডিং (Pending)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-900/30 transition-all cursor-pointer active:scale-95"
            >
              ঠিক আছে
            </button>
          </div>
        ) : (
          <form onSubmit={handleWithdrawSubmit} className="space-y-3.5">
            {/* Channel Selection */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Withdrawal Channel</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'bkash', name: 'bKash', logo: '🟣' },
                  { id: 'nagad', name: 'Nagad', logo: '🟠' },
                  { id: 'bank', name: 'Bank', logo: '🏦' },
                  { id: 'usdt', name: 'USDT', logo: '🟢' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setMethod(c.id as 'bkash' | 'nagad' | 'bank' | 'usdt');
                    }}
                    className={`py-2 rounded-xl border text-center transition-all ${
                      method === c.id
                        ? 'bg-blue-600/30 border-sky-400 text-white font-bold'
                        : 'bg-[#0a1634] border-blue-500/20 text-slate-400'
                    }`}
                  >
                    <span className="block text-sm">{c.logo}</span>
                    <span className="text-[11px]">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Account number */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold block">
                Receiver Account Number
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full bg-[#08122c] border border-blue-500/30 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Account holder name */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold block">
                Account Holder Name
              </label>
              <input
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full bg-[#08122c] border border-blue-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Amount ({getSymbol(currency)})</span>
                <button
                  type="button"
                  onClick={() => setAmount(userBalance.toString())}
                  className="text-sky-400 hover:underline"
                >
                  All ({getSymbol(currency)}{userBalance.toFixed(2)})
                </button>
              </div>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#08122c] border border-blue-500/30 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Security PIN */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Security Fund Password / PIN</span>
              </label>
              <input
                type="password"
                required
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-[#08122c] border border-blue-500/30 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="submit-withdraw-btn"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-black text-sm shadow-xl shadow-blue-900/50 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'PROCESSING REQUEST...' : 'CONFIRM WITHDRAWAL'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
