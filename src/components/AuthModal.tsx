import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  ArrowRight,
  Lock,
  Sparkles,
  Mail,
  Phone,
  AlertTriangle,
  Database,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { PhoneInput } from './PhoneInput';
import { UserProfile } from '../types';
import { sound } from '../utils/audio';
import {
  firebaseRegisterMember,
  firebaseLoginMember,
  checkFirebaseLiveStatus,
  RegisteredMember,
} from '../utils/firebase';
import { getClientDeviceDetails } from '../utils/deviceInfo';
import { getAvatarForUser } from '../utils/avatars';
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
  const [countryCode, setCountryCode] = useState<string>('+880');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPass, setShowPass] = useState<boolean>(false);
  const [invitationCode, setInvitationCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [logoTaps, setLogoTaps] = useState<number>(0);
  const [bannedUserPrompt, setBannedUserPrompt] = useState<{ uid: string; reason: string } | null>(null);

  // Live Firebase connection state
  const [firebaseStatus, setFirebaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [firebaseErrorMessage, setFirebaseErrorMessage] = useState<string>('');

  const verifyFirebase = async () => {
    setFirebaseStatus('checking');
    const res = await checkFirebaseLiveStatus();
    if (res.connected) {
      setFirebaseStatus('connected');
      setFirebaseErrorMessage('');
    } else {
      setFirebaseStatus('error');
      setFirebaseErrorMessage(res.error || 'ফায়ারবেস পারমিশন সমস্যা');
    }
  };

  useEffect(() => {
    verifyFirebase();
  }, []);

  // Auto-detect referral code from URL search query (?ref=..., ?invitationCode=...) or hash (/#/register?invitationCode=...)
  useEffect(() => {
    try {
      let refParam: string | null = null;
      const searchParams = new URLSearchParams(window.location.search);
      refParam =
        searchParams.get('invitationCode') ||
        searchParams.get('ref') ||
        searchParams.get('invite') ||
        searchParams.get('r') ||
        searchParams.get('code');

      if (!refParam && window.location.hash.includes('?')) {
        const hashQueryPart = window.location.hash.split('?')[1];
        if (hashQueryPart) {
          const hashParams = new URLSearchParams(hashQueryPart);
          refParam =
            hashParams.get('invitationCode') ||
            hashParams.get('ref') ||
            hashParams.get('invite') ||
            hashParams.get('r') ||
            hashParams.get('code');
        }
      }

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

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // ================= REGISTER MODE =================
    if (mode === 'register') {
      // Validate Identifier
      if (authMethod === 'email') {
        if (!email.trim() || !email.includes('@') || !email.includes('.')) {
          setError('অনুগ্রহ করে সঠিক ইমেইল এড্রেস লিখুন (যেমন: user@gmail.com)');
          return;
        }
      } else {
        const rawPhone = phone.replace(/\D/g, '');
        if (!rawPhone || rawPhone.length < 7) {
          setError('অনুগ্রহ করে সঠিক মোবাইল নম্বর প্রদান করুন (কমপক্ষে ৭ ডিজিট)');
          return;
        }
      }

      // Validate Password
      if (!password || password.length < 4) {
        setError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে');
        return;
      }

      // Validate Confirm Password
      if (password !== confirmPassword) {
        setError('পাসওয়ার্ড দুটি মিলছে না! পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড একই হতে হবে।');
        return;
      }

      setIsSubmitting(true);
      const cleanPhoneDigits = phone.replace(/\D/g, '');
      const fullPhone =
        authMethod === 'phone'
          ? `${countryCode}${cleanPhoneDigits.startsWith('0') ? cleanPhoneDigits : '0' + cleanPhoneDigits}`
          : '';
      const cleanEmail = authMethod === 'email' ? email.trim().toLowerCase() : '';
      const memberNum = cleanPhoneDigits.slice(-4) || cleanEmail.slice(0, 4) || '7777';
      const userUid = `VW${cleanPhoneDigits.slice(-6) || Math.floor(100000 + Math.random() * 900000)}`;
      const username = authMethod === 'phone' ? `Player_${memberNum}` : cleanEmail.split('@')[0];
      const balance = 0.0;
      const device = getClientDeviceDetails();
      const generatedAvatar = getAvatarForUser(userUid);

      const newMember: RegisteredMember = {
        uid: userUid,
        username,
        avatar: generatedAvatar,
        phone: fullPhone || cleanEmail,
        email: cleanEmail,
        password: password.trim(),
        countryCode: authMethod === 'phone' ? countryCode : '',
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
      };

      // Direct Firebase Registration (Writes to Firestore & local cache)
      const regRes = await firebaseRegisterMember(newMember);
      setIsSubmitting(false);

      if (!regRes.success) {
        sound.playLose();
        setError(regRes.message || '❌ ফায়ারবেসে একাউন্ট তৈরি ব্যর্থ হয়েছে!');
        return;
      }

      sound.playWin();
      onLoginSuccess(
        {
          id: userUid,
          phone: fullPhone || cleanEmail,
          email: cleanEmail,
          countryCode: authMethod === 'phone' ? countryCode : '',
          username,
          avatar: generatedAvatar,
          balance,
          vipLevel: 1,
          role: 'user',
          isLoggedIn: true,
          invitationCode: invitationCode || 'VICTOR888',
        },
        true
      );
      onClose();
      return;
    }

    // ================= LOGIN MODE =================
    if (mode === 'login') {
      const identifier = authMethod === 'email' ? email.trim().toLowerCase() : phone.trim();

      if (!identifier) {
        setError(authMethod === 'email' ? 'ইমেইল এড্রেস লিখুন' : 'মোবাইল নম্বর লিখুন');
        return;
      }

      if (!password || password.trim().length === 0) {
        setError('পাসওয়ার্ড প্রদান করুন');
        return;
      }

      setIsSubmitting(true);

      // Check if Admin Login credentials
      const cleanPhoneDigits = phone.replace(/\D/g, '');
      const isAdminEmail = identifier === 'admin@gmail.com' || identifier === 'admin';
      const isAdminPhone =
        cleanPhoneDigits === '01700000000' ||
        cleanPhoneDigits === '1700000000' ||
        identifier.toLowerCase() === 'admin';
      const isCorrectAdminPass =
        password === 'admin888' || password === 'admin' || password === 'victor888';

      if ((isAdminEmail || isAdminPhone) && isCorrectAdminPass) {
        sound.playWin();
        onLoginSuccess({
          id: 'VW_SUPER_ADMIN',
          email: 'admin@gmail.com',
          phone: '01700000000',
          countryCode: '+880',
          username: 'Master_Admin',
          balance: 99999.0,
          vipLevel: 10,
          role: 'admin',
          isLoggedIn: true,
          invitationCode: 'VICTOR888',
        });
        setIsSubmitting(false);
        onClose();
        return;
      } else if ((isAdminEmail || isAdminPhone) && !isCorrectAdminPass) {
        setIsSubmitting(false);
        sound.playLose();
        setError('❌ ভুল পাসওয়ার্ড! এডমিন অ্যাকাউন্টের সঠিক পাসওয়ার্ড দিন।');
        return;
      }

      // Check normal player login via Firebase & local storage
      const fullPhone =
        authMethod === 'phone'
          ? `${countryCode}${cleanPhoneDigits.startsWith('0') ? cleanPhoneDigits : '0' + cleanPhoneDigits}`
          : identifier;

      const loginRes = await firebaseLoginMember(fullPhone, password);
      setIsSubmitting(false);

      if (!loginRes.success) {
        sound.playLose();
        if (loginRes.banned) {
          setBannedUserPrompt({
            uid: loginRes.user?.uid || 'USER',
            reason: loginRes.banReason || 'সিকিউরিটি পলিসি লঙ্ঘনের কারণে এই একাউন্ট স্থগিত',
          });
        } else {
          setError(loginRes.message || '❌ ভুল পাসওয়ার্ড বা অ্যাকাউন্ট খুঁজে পাওয়া যায়নি!');
        }
        return;
      }

      const existingMember = loginRes.user!;
      const userAvatar = existingMember.avatar || getAvatarForUser(existingMember.uid, existingMember.gender);
      sound.playWin();
      onLoginSuccess({
        id: existingMember.uid,
        email: existingMember.email || (authMethod === 'email' ? identifier : undefined),
        phone: existingMember.phone,
        countryCode: existingMember.countryCode || countryCode,
        username: existingMember.username,
        avatar: userAvatar,
        balance: existingMember.balance || 0.0,
        vipLevel: existingMember.vipLevel || 1,
        role: 'user',
        isLoggedIn: true,
        invitationCode: existingMember.invitationCode || 'VICTOR888',
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl bg-gradient-to-b from-[#0c1a3e] via-[#091533] to-[#050b1a] border-2 border-amber-500/50 p-4 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Logo */}
        <div className="flex flex-col items-center justify-center text-center mb-3 shrink-0">
          <div onClick={handleLogoTap} className="cursor-pointer transition-transform active:scale-95">
            <BrandLogo size="md" />
          </div>
          <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider mt-1">
            {mode === 'login' ? 'নিরাপদ অ্যাকাউন্ট লগ ইন' : 'নতুন অ্যাকাউন্ট রেজিস্ট্রেশন'}
          </span>
        </div>

        {/* Header Tabs: Login vs Register */}
        <div className="grid grid-cols-2 bg-[#060e22] p-1 rounded-2xl border border-blue-500/30 text-xs font-black shrink-0 mb-2.5">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setMode('login');
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
          <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold text-center shrink-0 mb-2">
            {error}
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          <form onSubmit={handleAuthSubmit} className="space-y-3 pb-1">
            {/* Method Switcher: Mobile vs Email */}
            <div className="grid grid-cols-2 gap-2 bg-[#040918] p-1 rounded-xl border border-blue-500/30 text-xs">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setAuthMethod('phone');
                }}
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
                onClick={() => {
                  sound.playClick();
                  setAuthMethod('email');
                }}
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

            {/* Email Input Field */}
            {authMethod === 'email' ? (
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold block">
                  ইমেইল এড্রেস (Email Address)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@gmail.com"
                  className="w-full bg-[#060e22] border border-blue-500/40 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
                />
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
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold block">
                {mode === 'login'
                  ? 'একাউন্ট পাসওয়ার্ড (Password)'
                  : 'পাসওয়ার্ড লিখুন (Password min 4 chars)'}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড দিন"
                  className="w-full bg-[#060e22] border border-blue-500/30 rounded-xl px-3 py-2 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Only in Register Mode) */}
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold block">
                  কনফার্ম পাসওয়ার্ড (Confirm Password)
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="পুনরায় একই পাসওয়ার্ড লিখুন"
                    className={`w-full bg-[#060e22] border rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-rose-500/80 focus:border-rose-400'
                        : 'border-blue-500/30 focus:border-amber-400'
                    }`}
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <span className="text-[10px] text-rose-400 block">⚠️ পাসওয়ার্ড দুটি মিলছে না</span>
                )}
              </div>
            )}

            {/* Register Invitation Code */}
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold flex items-center justify-between">
                  <span>আমন্ত্রণ কোড (Invitation Code - ঐচ্ছিক)</span>
                  <span className="text-[10px] text-amber-400 font-normal">বোনাস সক্রিয়</span>
                </label>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  placeholder="VICTOR888"
                  className="w-full bg-[#060e22] border border-blue-500/30 rounded-xl px-3 py-2 text-xs text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono font-bold uppercase"
                />
              </div>
            )}

            {/* Launch Banner Info */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-[11px] text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {mode === 'register'
                  ? 'রেজিস্ট্রেশন সম্পূর্ণ করে ১০০% ওয়েলকাম বোনাস উপভোগ করুন!'
                  : 'একবার লগইন করলে ২৪ ঘণ্টা সেশন সক্রিয় থাকবে, বারবার লগইন করতে হবে না।'}
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
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>
                    {mode === 'register'
                      ? 'ফায়ারবেস ক্লাউডে অ্যাকাউন্ট তৈরি হচ্ছে...'
                      : 'লগইন যাচাই করা হচ্ছে...'}
                  </span>
                </div>
              ) : (
                <>
                  <span>
                    {mode === 'login' ? 'লগ ইন করুন (Log In)' : 'নিবন্ধন সম্পন্ন করুন (Complete Registration)'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Live Firebase Cloud Connection Status Indicator */}
            <div className="pt-1">
              {firebaseStatus === 'connected' ? (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold">ফায়ারবেস ক্লাউড কানেক্টেড (victor-win)</span>
                  </div>
                  <Database className="w-3.5 h-3.5 text-emerald-400 opacity-80" />
                </div>
              ) : firebaseStatus === 'error' ? (
                <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 space-y-1.5 text-left">
                  <div className="flex items-center justify-between text-xs font-bold text-red-400">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>ফায়ারবেস কানেকশন লকড / ফেইল্ড</span>
                    </div>
                    <button
                      type="button"
                      onClick={verifyFirebase}
                      className="px-2 py-0.5 rounded bg-red-800/60 hover:bg-red-700 text-white text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>রিট্রাই</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-red-300 leading-tight">
                    {firebaseErrorMessage}। ফায়ারবেস কনসোলে গিয়ে <b>Firestore Database → Rules</b> এ{' '}
                    <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">
                      allow read, write: if true;
                    </code>{' '}
                    দিয়ে <b>Publish</b> করুন।
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 py-1 text-[11px] text-slate-400">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                  <span>ফায়ারবেস ক্লাউড চেক হচ্ছে...</span>
                </div>
              )}
            </div>
          </form>
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
