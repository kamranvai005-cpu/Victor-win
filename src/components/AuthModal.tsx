import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, ArrowRight, Lock, KeyRound, Sparkles, CheckCircle2, Mail, Phone, ShieldAlert, AlertTriangle } from 'lucide-react';
import { PhoneInput } from './PhoneInput';
import { VerifyInput } from './VerifyInput';
import { UserProfile } from '../types';
import { sound } from '../utils/audio';
import { saveLocalMember, getLocalMembers, updateLocalMember } from '../utils/firebase';
import { getClientDeviceDetails } from '../utils/deviceInfo';
import { BrandLogo } from './BrandLogo';
import { UserBanModal } from './UserBanModal';

interface AuthModalProps {
  initialMode: 'login' | 'register';
  onClose: () => void;
  onLoginSuccess: (user: Partial<UserProfile>, wasRegister?: boolean) => void;
}

export function AuthModal({ initialMode, onClose, onLoginSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [loginType, setLoginType] = useState<'password' | 'otp'>('password');
  const [countryCode, setCountryCode] = useState<string>('+880');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [invitationCode, setInvitationCode] = useState<string>('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [logoTaps, setLogoTaps] = useState<number>(0);
  const [bannedUserPrompt, setBannedUserPrompt] = useState<{ uid: string; reason: string } | null>(null);

  // Auto-detect referral code from URL search query (?ref=..., ?invite=..., ?code=...)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const refParam = searchParams.get('ref') || searchParams.get('invite') || searchParams.get('r') || searchParams.get('code');
      if (refParam) {
        setInvitationCode(refParam.toUpperCase());
        localStorage.setItem('victor_referral_code', refParam.toUpperCase());
      } else {
        const cachedRef = localStorage.getItem('victor_referral_code');
        if (cachedRef) {
          setInvitationCode(cachedRef);
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  // Secret 5-tap trigger for direct admin access
  const handleLogoTap = () => {
    const next = logoTaps + 1;
    setLogoTaps(next);
    if (next >= 5) {
      sound.playWin();
      onLoginSuccess({
        id: 'VW_SUPER_ADMIN',
        email: 'admin@gmail.com',
        phone: '01700000000',
        countryCode: '+880',
        username: 'System_Admin',
        balance: 99999.0,
        vipLevel: 10,
        role: 'admin',
        isLoggedIn: true,
      });
      onClose();
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if logging in via email
    if (mode === 'login' && authMethod === 'email') {
      if (!email.trim()) {
        setError('অনুগ্রহ করে সঠিক ইমেইল এড্রেস লিখুন');
        return;
      }
      if (!password || password.length < 3) {
        setError('পাসওয়ার্ড প্রদান করুন');
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        const cleanEmail = email.trim().toLowerCase();
        const isAdmin =
          (cleanEmail === 'admin@gmail.com' || cleanEmail === 'admin') &&
          (password === 'admin' || password === 'admin888' || password === 'victor888');

        if (isAdmin) {
          sound.playWin();
          // Super Admin Login
          onLoginSuccess({
            id: 'VW_SUPER_ADMIN',
            email: 'admin@gmail.com',
            phone: '01700000000',
            countryCode: '+880',
            username: 'Master_Admin',
            balance: 99999.00,
            vipLevel: 10,
            role: 'admin',
            isLoggedIn: true,
            invitationCode: 'VICTOR888',
          });
          setIsSubmitting(false);
          onClose();
          return;
        }

        // Check registered member
        const members = getLocalMembers();
        const existingMember = members.find((m) => m.phone.toLowerCase() === cleanEmail || m.email?.toLowerCase() === cleanEmail);
        
        if (!existingMember) {
          setIsSubmitting(false);
          sound.playLose();
          setError('❌ এই ইমেইলে কোনো একাউন্ট পাওয়া যায়নি! অনুগ্রহ করে আগে রেজিস্ট্রেশন করুন।');
          return;
        }

        // Check if user is banned
        if (existingMember.status === 'banned') {
          setIsSubmitting(false);
          sound.playLose();
          setBannedUserPrompt({
            uid: existingMember.uid,
            reason: existingMember.banReason || 'একাধিক অ্যাকাউন্ট তৈরি বা সিকিউরিটি পলিসি লঙ্ঘনের কারণে এই একাউন্ট স্থগিত',
          });
          return;
        }

        // Strict Password Check
        if (existingMember.password && existingMember.password !== password.trim()) {
          setIsSubmitting(false);
          sound.playLose();
          setError('❌ ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড প্রদান করুন।');
          return;
        } else if (!existingMember.password) {
          updateLocalMember(existingMember.uid, { password: password.trim() });
        }

        sound.playWin();
        onLoginSuccess({
          id: existingMember.uid,
          email: existingMember.email || cleanEmail,
          phone: existingMember.phone,
          countryCode: existingMember.countryCode || '',
          username: existingMember.username,
          balance: existingMember.balance || 0.00,
          role: 'user',
          isLoggedIn: true,
          invitationCode: existingMember.invitationCode || 'VICTOR888',
        });
        setIsSubmitting(false);
        onClose();
      }, 500);
      return;
    }

    // Phone flow
    if (!phone || phone.length < 7) {
      setError('সঠিক মোবাইল নম্বর প্রদান করুন (Please enter valid phone)');
      return;
    }

    if (mode === 'login' && loginType === 'password') {
      if (!password || password.length < 3) {
        setError('পাসওয়ার্ড প্রদান করুন (Password required)');
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        const cleanPhoneDigits = phone.replace(/\D/g, '');
        const fullPhone = `${countryCode}${cleanPhoneDigits.startsWith('0') ? cleanPhoneDigits : '0' + cleanPhoneDigits}`;
        const last10Digits = cleanPhoneDigits.slice(-10);

        // Check if admin login credentials
        const isAdmin =
          (phone.toLowerCase() === 'admin' || cleanPhoneDigits === '01700000000' || cleanPhoneDigits === '1700000000') &&
          (password === 'admin888' || password === 'admin' || password === 'victor888');

        if (isAdmin) {
          sound.playWin();
          onLoginSuccess({
            id: 'VW_SUPER_ADMIN',
            phone: '01700000000',
            countryCode: '+880',
            username: 'Master_Admin',
            balance: 99999.00,
            vipLevel: 10,
            role: 'admin',
            isLoggedIn: true,
            invitationCode: 'VICTOR888',
          });
          setIsSubmitting(false);
          onClose();
          return;
        }

        // Check registered members in system
        const members = getLocalMembers();
        const existingMember = members.find((m) => {
          const mDigits = m.phone.replace(/\D/g, '');
          return (
            m.phone === fullPhone ||
            m.phone === phone ||
            mDigits === cleanPhoneDigits ||
            (last10Digits.length >= 10 && mDigits.endsWith(last10Digits))
          );
        });

        // User MUST exist in the registered member database
        if (!existingMember) {
          setIsSubmitting(false);
          sound.playLose();
          setError('❌ এই নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি! অনুগ্রহ করে আগে রেজিস্ট্রেশন করুন।');
          return;
        }

        // Check if user is banned
        if (existingMember.status === 'banned') {
          setIsSubmitting(false);
          sound.playLose();
          setBannedUserPrompt({
            uid: existingMember.uid,
            reason: existingMember.banReason || 'একাধিক অ্যাকাউন্ট তৈরি বা সিকিউরিটি পলিসি লঙ্ঘনের কারণে এই একাউন্ট স্থগিত',
          });
          return;
        }

        // STRICT PASSWORD VERIFICATION
        if (existingMember.password) {
          if (existingMember.password !== password.trim()) {
            setIsSubmitting(false);
            sound.playLose();
            setError('❌ ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড প্রদান করুন।');
            return;
          }
        } else {
          // If legacy sample member didn't have password, set it now
          updateLocalMember(existingMember.uid, { password: password.trim() });
        }

        sound.playWin();
        onLoginSuccess({
          id: existingMember.uid,
          phone: existingMember.phone,
          countryCode: existingMember.countryCode || countryCode,
          username: existingMember.username,
          balance: existingMember.balance || 0.00,
          role: 'user',
          isLoggedIn: true,
          invitationCode: existingMember.invitationCode || 'VICTOR888',
        });
        setIsSubmitting(false);
        onClose();
      }, 500);
      return;
    }

    // If OTP flow or Register
    if (mode === 'register') {
      if (!password || password.length < 4) {
        setError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে (Password min 4 chars)');
        return;
      }
      setIsSubmitting(true);
      setTimeout(() => {
        const fullPhone = `${countryCode}${phone}`;
        const members = getLocalMembers();
        const existingMember = members.find((m) => m.phone === fullPhone || m.phone.endsWith(phone.replace(/\D/g, '').slice(-10)));
        if (existingMember) {
          setIsSubmitting(false);
          sound.playLose();
          if (existingMember.status === 'banned') {
            setBannedUserPrompt({
              uid: existingMember.uid,
              reason: existingMember.banReason || 'নিরাপত্তা বিধি লঙ্ঘনের কারণে এই একাউন্ট স্থগিত',
            });
          } else {
            setError('এই মোবাইল নম্বরটি দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট খোলা হয়েছে! অনুগ্রহ করে লগ ইন করুন।');
          }
          return;
        }

        sound.playWin();
        const rawDigits = phone.replace(/\D/g, '');
        const memberNum = rawDigits.slice(-4) || '7777';
        const userUid = `VW${rawDigits.slice(-6) || Math.floor(100000 + Math.random() * 900000)}`;
        const username = `Player_${memberNum}`;
        const balance = 0.00;
        const device = getClientDeviceDetails();

        // Register member to system with password and device details
        saveLocalMember({
          uid: userUid,
          username,
          phone: fullPhone,
          password: password.trim(),
          countryCode,
          balance,
          vipLevel: 1,
          invitationCode: invitationCode || 'VICTOR888',
          gender: 'all',
          registeredAt: new Date().toISOString().split('T')[0],
          status: 'active',
          lastActive: 'Just now',
          totalDeposit: 0,
          deviceIp: device.ip,
          deviceModel: device.deviceModel,
          browser: device.browser,
          os: device.os,
          network: device.network,
        });

        onLoginSuccess(
          {
            id: userUid,
            phone: fullPhone,
            countryCode,
            username,
            balance,
            role: 'user',
            isLoggedIn: true,
            invitationCode: invitationCode || 'VICTOR888',
          },
          true
        );
        setIsSubmitting(false);
        onClose();
      }, 500);
      return;
    }

    setError('');
    sound.playClick();
    setStep('otp');
  };

  const handleCompleteOtpAuth = () => {
    if (otp.length !== 6) {
      setError('৬ ডিজিটের ওটিপি কোডটি লিখুন (Enter 6 digit OTP)');
      return;
    }

    sound.playWin();
    const rawDigits = phone.replace(/\D/g, '');
    const memberNum = rawDigits.slice(-4) || '9999';
    const userUid = `VW${rawDigits.slice(-6) || Math.floor(100000 + Math.random() * 900000)}`;
    const username = `Player_${memberNum}`;

    saveLocalMember({
      uid: userUid,
      username,
      phone: `${countryCode}${phone}`,
      countryCode,
      balance: 0.00,
      vipLevel: 1,
      invitationCode: invitationCode || 'VICTOR888',
      registeredAt: new Date().toISOString().split('T')[0],
      status: 'active',
      lastActive: 'Just now',
    });

    onLoginSuccess(
      {
        id: userUid,
        phone: `${countryCode}${phone}`,
        countryCode,
        username,
        balance: 0.00,
        role: 'user',
        isLoggedIn: true,
      },
      mode === 'register'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-md max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#060e22] border-2 border-amber-500/40 p-4 sm:p-6 shadow-2xl overflow-hidden my-auto">
        
        {/* Brand Logo in Modal */}
        <div
          onClick={handleLogoTap}
          className="flex flex-col items-center justify-center text-center space-y-1 pb-2 pt-1 shrink-0 cursor-pointer select-none"
          title="Victor Win"
        >
          <BrandLogo size="lg" showText={true} />
          <span className="text-[11px] text-amber-300/90 font-bold tracking-wide">
            অফিসিয়াল গেমিং ও লটারি প্ল্যাটফর্ম
          </span>
        </div>

        {/* Header Tabs: Login vs Register */}
        <div className="grid grid-cols-2 bg-[#060e22] p-1 rounded-2xl border border-blue-500/30 text-xs font-black shrink-0 mb-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setMode('login');
              setStep('phone');
              setError('');
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            লগ ইন (Log In)
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setMode('register');
              setStep('phone');
              setAuthMethod('phone');
              setError('');
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            রেজিস্ট্রেশন (Register)
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-white cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-medium text-center shrink-0 mb-2">
            {error}
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto pr-1 space-y-3.5 custom-scrollbar">
          {step === 'phone' ? (
            <form onSubmit={handleAuthSubmit} className="space-y-3 pb-1">
              
              {/* Method Switcher for Login: Phone vs Email */}
              {mode === 'login' && (
                <div className="grid grid-cols-2 gap-2 bg-[#040918] p-1 rounded-xl border border-blue-500/30 text-xs">
                  <button
                    type="button"
                    onClick={() => setAuthMethod('phone')}
                    className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      authMethod === 'phone'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>মোবাইল নম্বর</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthMethod('email')}
                    className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      authMethod === 'email'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>ইমেইল আইডি</span>
                  </button>
                </div>
              )}

              {/* Login Type Switcher (Only in Phone Login Mode) */}
              {mode === 'login' && authMethod === 'phone' && (
                <div className="flex items-center justify-center gap-4 text-xs">
                  <button
                    type="button"
                    onClick={() => setLoginType('password')}
                    className={`flex items-center gap-1 font-bold cursor-pointer transition-colors ${
                      loginType === 'password' ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>পাসওয়ার্ড লগ ইন</span>
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={() => setLoginType('otp')}
                    className={`flex items-center gap-1 font-bold cursor-pointer transition-colors ${
                      loginType === 'otp' ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>ওটিপি লগ ইন</span>
                  </button>
                </div>
              )}

              {/* Email Input Field (When Email Login is Selected) */}
              {mode === 'login' && authMethod === 'email' ? (
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold block">
                    ইমেইল এড্রেস (Email Address)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="আপনার ইমেইল লিখুন"
                      className="w-full bg-[#060e22] border border-blue-500/40 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              ) : (
                /* Phone input with country flags */
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold block">
                    মোবাইল নম্বর (Mobile Phone Number)
                  </label>
                  <PhoneInput
                    countryCode={countryCode}
                    onCountryCodeChange={setCountryCode}
                    phone={phone}
                    onPhoneChange={setPhone}
                    error={error}
                  />
                </div>
              )}

              {/* Password Field */}
              {(mode === 'register' || (mode === 'login' && (authMethod === 'email' || loginType === 'password'))) && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold block">
                    {mode === 'login'
                      ? 'একাউন্ট পাসওয়ার্ড (Password)'
                      : 'নতুন পাসওয়ার্ড নির্ধারণ করুন (Set Password)'}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="পাসওয়ার্ড লিখুন"
                      className="w-full bg-[#060e22] border border-blue-500/30 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              {/* Register Invitation Code */}
              {mode === 'register' && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold flex items-center justify-between">
                    <span>আমন্ত্রণ কোড (Invitation Code)</span>
                    <span className="text-[10px] text-amber-400 font-normal">বোনাস সক্রিয়</span>
                  </label>
                  <input
                    type="text"
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value)}
                    placeholder="VICTOR888"
                    className="w-full bg-[#060e22] border border-blue-500/30 rounded-xl px-3 py-2 text-xs text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono font-bold"
                  />
                </div>
              )}

              {/* Launch Banner Info */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-[11px] text-amber-200">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {mode === 'register'
                    ? 'রেজিস্ট্রেশন সম্পূর্ণ করে প্রথম ডিপোজিটে ১০০% ওয়েলকাম বোনাস উপভোগ করুন!'
                    : 'সফলভাবে লগ ইন করে আপনার ব্যালেন্স ও হিস্ট্রি চেক করুন।'}
                </span>
              </div>

              {/* Terms and Privacy notice */}
              <div className="flex items-start gap-2 text-[10px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  আমি নিশ্চিত করছি যে আমার বয়স ১৮ বছর বা তার বেশি এবং আমি প্ল্যাটফর্মের শর্তাবলী মেনে চলছি।
                </span>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-900/40 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <span>
                  {isSubmitting
                    ? 'প্রসেসিং হচ্ছে...'
                    : mode === 'login'
                    ? 'লগ ইন করুন (Log In)'
                    : 'রেজিস্ট্রেশন সম্পন্ন করুন (Register)'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-white">সিকিউরিটি ওটিপি ভেরিফিকেশন</h3>
                <p className="text-xs text-slate-400">
                  ৬-ডিজিটের ভেরিফিকেশন কোড পাঠানো হয়েছে:{' '}
                  <span className="text-amber-400 font-mono font-bold">
                    {countryCode} {phone}
                  </span>
                </p>
              </div>

              <VerifyInput
                length={6}
                value={otp}
                onChange={setOtp}
                error={error}
                onResend={() => {
                  sound.playClick();
                  setError('');
                }}
              />

              <button
                type="button"
                onClick={handleCompleteOtpAuth}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>যাচাই ও প্রবেশ করুন</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                মোবাইল নম্বর পরিবর্তন করতে ফিরে যান
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Ban Notice Modal */}
      {bannedUserPrompt && (
        <UserBanModal
          isOpen={true}
          uid={bannedUserPrompt.uid}
          reason={bannedUserPrompt.reason}
          onClose={() => setBannedUserPrompt(null)}
        />
      )}
    </div>
  );
}
