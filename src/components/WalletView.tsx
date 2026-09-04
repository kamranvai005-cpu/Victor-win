import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownToLine,
  PlusCircle,
  Shield,
  Lock,
  Unlock,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Currency, UserProfile, Transaction } from '../types';
import { getCurrencySymbol } from '../utils/currency';
import { sound } from '../utils/audio';

interface WalletViewProps {
  user: UserProfile;
  currency: Currency;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onUpdateBalance: (newBalance: number) => void;
}

export function WalletView({
  user,
  currency,
  onOpenDeposit,
  onOpenWithdraw,
  onUpdateBalance,
}: WalletViewProps) {
  const sym = getCurrencySymbol(currency);
  const [safeBalance, setSafeBalance] = useState(0.00);
  const [safeAmount, setSafeAmount] = useState('');
  const [safeTab, setSafeTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'deposit' | 'withdraw'>('deposit');

  const [depositHistory] = useState<Transaction[]>([]);
  const [withdrawHistory] = useState<Transaction[]>([]);

  const handleSafeAction = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(safeAmount);
    if (!val || val <= 0) return;

    if (safeTab === 'deposit') {
      if (val > user.balance) {
        alert('Insufficient wallet balance to transfer to Safe Box.');
        return;
      }
      sound.playClick();
      onUpdateBalance(user.balance - val);
      setSafeBalance((prev) => prev + val);
      setSafeAmount('');
    } else {
      if (val > safeBalance) {
        alert('Insufficient Safe Box balance to withdraw.');
        return;
      }
      sound.playClick();
      onUpdateBalance(user.balance + val);
      setSafeBalance((prev) => prev - val);
      setSafeAmount('');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Wallet Balance Hero Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0d1d44] via-[#091533] to-[#122552] border border-blue-500/40 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-sky-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-sky-400" /> Total Assets Wallet
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                {sym}{(user.balance + safeBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                (Main: {sym}{user.balance.toFixed(2)})
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenDeposit}
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Deposit</span>
            </button>

            <button
              type="button"
              onClick={onOpenWithdraw}
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-900/40 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>

        {/* Sub-Wallets breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-blue-900/50">
          <div className="p-3 rounded-2xl bg-[#08122c] border border-blue-500/20">
            <span className="text-[10px] text-slate-400">Main Account</span>
            <p className="text-sm font-black font-mono text-white mt-0.5">
              {sym}{user.balance.toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#08122c] border border-blue-500/20">
            <span className="text-[10px] text-slate-400">Safe Box (Vault)</span>
            <p className="text-sm font-black font-mono text-amber-400 mt-0.5">
              {sym}{safeBalance.toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#08122c] border border-blue-500/20 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400">Turnover Requirement</span>
            <p className="text-sm font-black font-mono text-emerald-400 mt-0.5">
              {sym}0.00 (Ready to cashout)
            </p>
          </div>
        </div>
      </div>

      {/* Safe Box (Vault / Piggy Bank) Section */}
      <div className="rounded-3xl bg-[#0a1532] border border-blue-500/30 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
                <span>Safe Box (Interest Vault)</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  +0.1% Daily APY
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Safely store funds away from betting balance and earn automatic daily interest!
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400">
            {sym}{safeBalance.toFixed(2)}
          </span>
        </div>

        {/* Transfer form */}
        <form onSubmit={handleSafeAction} className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSafeTab('deposit')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                safeTab === 'deposit'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-[#08122c] text-slate-400 hover:text-white'
              }`}
            >
              Transfer In (Wallet → Safe)
            </button>
            <button
              type="button"
              onClick={() => setSafeTab('withdraw')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                safeTab === 'withdraw'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-[#08122c] text-slate-400 hover:text-white'
              }`}
            >
              Transfer Out (Safe → Wallet)
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              value={safeAmount}
              onChange={(e) => setSafeAmount(e.target.value)}
              placeholder={`Enter amount (Available: ${safeTab === 'deposit' ? `${sym}${user.balance.toFixed(2)}` : `${sym}${safeBalance.toFixed(2)}`})`}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#060e22] border border-blue-500/30 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
            >
              Confirm Transfer
            </button>
          </div>
        </form>
      </div>

      {/* Transaction History Tabs & Table */}
      <div className="rounded-3xl bg-[#0a1532] border border-blue-500/30 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/50 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white font-display">
              Transaction Records
            </h3>
          </div>

          <div className="flex bg-[#08122c] p-1 rounded-xl border border-blue-500/20">
            <button
              type="button"
              onClick={() => setActiveHistoryTab('deposit')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeHistoryTab === 'deposit'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Deposits ({depositHistory.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveHistoryTab('withdraw')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeHistoryTab === 'withdraw'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Withdrawals ({withdrawHistory.length})
            </button>
          </div>
        </div>

        {/* Table List */}
        <div className="space-y-2">
          {activeHistoryTab === 'deposit' ? (
            depositHistory.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                কোনো ডিপোজিট রেকর্ড নেই (০ হিস্ট্রি)
              </div>
            ) : (
              depositHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-[#08122c] border border-blue-500/20 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{item.method}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.account}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Trx: {item.trxId} • {item.time}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-emerald-400 block">
                      +{sym}{item.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                      <CheckCircle2 className="w-3 h-3" /> Success
                    </span>
                  </div>
                </div>
              ))
            )
          ) : withdrawHistory.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              কোনো উইথড্র রেকর্ড নেই (০ হিস্ট্রি)
            </div>
          ) : (
            withdrawHistory.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-[#08122c] border border-blue-500/20 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{item.method}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.account}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Trx: {item.trxId} • {item.time}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black font-mono text-sky-400 block">
                    -{sym}{item.amount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3 h-3" /> Approved
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
