import React from 'react';
import { ShieldAlert, AlertTriangle, Headphones, X, Lock } from 'lucide-react';
import { sound } from '../utils/audio';

interface UserBanModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  reason?: string;
  onContactSupport?: () => void;
}

export function UserBanModal({
  isOpen,
  onClose,
  uid,
  reason = 'বহু অ্যাকাউন্ট তৈরি ও সিকিউরিটি পলিসি লঙ্ঘন',
  onContactSupport,
}: UserBanModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1c0b12] via-[#14060c] to-[#0a0306] border-2 border-rose-500/60 p-6 sm:p-7 shadow-[0_0_60px_rgba(244,63,94,0.35)] space-y-5 text-center">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Big Alert Icon */}
        <div className="flex justify-center pt-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-600 to-red-500 p-0.5 shadow-xl shadow-rose-600/30">
            <div className="w-full h-full bg-[#0a0306] rounded-[22px] flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Title & UID Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-mono font-bold">
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>অ্যাকাউন্ট স্থগিত নোটিশ • UID: {uid}</span>
          </div>

          <h2 className="text-xl font-black text-white font-display">
            আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত করা হয়েছে
          </h2>
        </div>

        {/* Reason Reminder Card */}
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-left space-y-1.5">
          <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider block">
            এডমিন সিদ্ধান্তের কারণ (Reason Reminder):
          </span>
          <p className="text-sm font-semibold text-white leading-relaxed font-sans">
            {reason}
          </p>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          যদি আপনার মনে হয় এটি একটি ভুল, অনুগ্রহ করে আমাদের ২৪/৭ সাপোর্ট এজেন্টের সাথে যোগাযোগ করে অ্যাকাউন্ট ভেরিফাই করুন।
        </p>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {onContactSupport && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
                onContactSupport();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:brightness-110 text-white font-black text-sm shadow-xl shadow-rose-950/60 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <Headphones className="w-4 h-4" />
              <span>২৪/৭ কাস্টমার সার্ভিসে যোগাযোগ করুন</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#14060c] hover:bg-rose-950 border border-rose-900/60 text-slate-400 hover:text-white font-bold text-xs cursor-pointer active:scale-95 transition-all"
          >
            বন্ধ করুন (Close)
          </button>
        </div>
      </div>
    </div>
  );
}
