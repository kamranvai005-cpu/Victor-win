import { ReactNode } from 'react';
import { Download, Home, Gift, Share2, Wallet, User, Coins, Headphones } from 'lucide-react';
import { UserProfile, Language, Currency } from '../types';
import { NavTab } from './BottomNavBar';
import { sound } from '../utils/audio';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  user: UserProfile;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  currency: Currency;
  onCurrencyChange: (cur: Currency) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenVip: () => void;
  onOpenSupport: () => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
  onRefreshBalance: () => void;
  onOpenAppDownload: () => void;
  onOpenSecurity: () => void;
  onOpenAdmin?: () => void;
  activeBottomTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
}

export function Header({
  user,
  currency,
  activeBottomTab = 'home',
  onTabChange,
  onOpenAppDownload,
  onOpenSupport,
  onOpenAuth,
  onOpenDeposit,
  onOpenAdmin,
}: HeaderProps) {
  const topNavTabs: { id: NavTab; labelBn: string; labelEn: string; icon: ReactNode }[] = [
    { id: 'home', labelBn: 'হোম', labelEn: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'activity', labelBn: 'অ্যাক্টিভিটি', labelEn: 'Activity', icon: <Gift className="w-4 h-4" /> },
    { id: 'promotion', labelBn: 'প্রমোশন', labelEn: 'Promotion', icon: <Share2 className="w-4 h-4" /> },
    { id: 'wallet', labelBn: 'ওয়ালেট', labelEn: 'Wallet', icon: <Wallet className="w-4 h-4" /> },
    { id: 'account', labelBn: 'আমার', labelEn: 'Mine', icon: <User className="w-4 h-4" /> },
  ];

  const getSym = (c: Currency) => (c === 'BDT' ? '৳' : c === 'INR' ? '₹' : '$');

  return (
    <header className="sticky top-0 z-40 w-full bg-[#08122c]/98 backdrop-blur-md border-b border-blue-500/25 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange?.('home')}
            className="flex items-center cursor-pointer group"
          >
            <BrandLogo size="md" />
          </button>
        </div>

        {/* Desktop / Tablet Main Nav Menu */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#050c1e] p-1 rounded-2xl border border-blue-500/30">
          {topNavTabs.map((tab) => {
            const isActive = activeBottomTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`top-nav-${tab.id}`}
                onClick={() => {
                  sound.playClick();
                  onTabChange?.(tab.id);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md shadow-amber-950/40 scale-102'
                    : 'text-slate-200 hover:text-white hover:bg-blue-950/50'
                }`}
              >
                {tab.icon}
                <span>{tab.labelBn}</span>
                <span className="text-[10px] opacity-75 hidden lg:inline">({tab.labelEn})</span>
              </button>
            );
          })}
        </div>

        {/* Right Actions: Auth Buttons or Balance + Deposit + 24/7 Support + App */}
        <div className="flex items-center gap-2 shrink-0">
          {!user.isLoggedIn ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                id="header-login-btn"
                onClick={() => {
                  sound.playClick();
                  onOpenAuth('login');
                }}
                className="px-3 sm:px-4 py-1.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 border border-blue-400/40 text-sky-200 text-xs font-black transition-all cursor-pointer active:scale-95"
              >
                লগ ইন (Login)
              </button>
              <button
                type="button"
                id="header-register-btn"
                onClick={() => {
                  sound.playClick();
                  onOpenAuth('register');
                }}
                className="px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-900/30 cursor-pointer active:scale-95"
              >
                রেজিস্ট্রেশন (Register)
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* User Balance Chip with Deposit Quick Access */}
              <div
                onClick={() => onTabChange?.('wallet')}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-[#050c1e] border border-amber-500/40 cursor-pointer hover:border-amber-400 transition-colors"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs sm:text-sm font-black font-mono text-amber-300">
                  {getSym(currency)}{user.balance.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                id="header-deposit-btn"
                onClick={() => {
                  sound.playClick();
                  onOpenDeposit();
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-black transition-all shadow-md cursor-pointer active:scale-95"
              >
                ডিপোজিট
              </button>
            </div>
          )}

          {/* 24/7 Customer Service Header Icon Button */}
          <button
            type="button"
            id="header-support-btn"
            onClick={() => {
              sound.playClick();
              onOpenSupport();
            }}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-full bg-blue-950/80 hover:bg-blue-900 border border-blue-500/30 text-sky-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Customer Service"
          >
            <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span className="hidden lg:inline text-[11px]">24/7 Support</span>
          </button>

          {/* App Download Badge */}
          <button
            type="button"
            id="header-app-download-btn"
            onClick={() => {
              sound.playClick();
              onOpenAppDownload();
            }}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-900/30 active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">App</span>
            <span className="text-[10px] bg-slate-950 text-amber-300 px-1.5 py-0.2 rounded-full font-mono font-black">+৳58</span>
          </button>
        </div>
      </div>
    </header>
  );
}

