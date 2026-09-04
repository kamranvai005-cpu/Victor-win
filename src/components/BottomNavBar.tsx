import { ReactNode } from 'react';
import {
  Home,
  Gift,
  Share2,
  Wallet,
  User,
} from 'lucide-react';
import { sound } from '../utils/audio';

export type NavTab = 'home' | 'activity' | 'promotion' | 'wallet' | 'account';

interface BottomNavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenDeposit?: () => void;
}

export function BottomNavBar({
  activeTab,
  onTabChange,
}: BottomNavBarProps) {
  const tabs: {
    id: NavTab;
    labelBn: string;
    labelEn: string;
    icon: ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'home',
      labelBn: 'হোম',
      labelEn: 'Home',
      icon: <Home className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      id: 'activity',
      labelBn: 'অ্যাক্টিভিটি',
      labelEn: 'Activity',
      icon: <Gift className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      id: 'promotion',
      labelBn: 'প্রমোশন',
      labelEn: 'Promotion',
      icon: <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />,
      badge: 'PRO',
    },
    {
      id: 'wallet',
      labelBn: 'ওয়ালেট',
      labelEn: 'Wallet',
      icon: <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      id: 'account',
      labelBn: 'আমার',
      labelEn: 'Mine',
      icon: <User className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#060e22] border-t-2 border-amber-500/40 shadow-[0_-8px_30px_rgba(0,0,0,0.85)] py-2 px-2 sm:px-4"
    >
      <div className="max-w-xl mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              id={`bottom-nav-${tab.id}`}
              onClick={() => {
                sound.playClick();
                onTabChange(tab.id);
              }}
              className={`relative flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer select-none ${
                isActive
                  ? 'text-amber-400 font-black scale-105 bg-amber-500/10 border border-amber-400/30 shadow-inner'
                  : 'text-slate-300 hover:text-amber-300 hover:bg-blue-950/40'
              }`}
            >
              {tab.badge && (
                <span className="absolute -top-1.5 right-1 sm:right-3 text-[8px] font-black px-1.5 py-0.2 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md animate-pulse">
                  {tab.badge}
                </span>
              )}

              <div className="relative">
                {tab.icon}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                )}
              </div>

              {/* Clear High-Contrast Bilingual Label */}
              <div className="flex flex-col items-center leading-none mt-1">
                <span className={`text-[11px] sm:text-xs font-bold ${isActive ? 'text-amber-400 font-black' : 'text-slate-200'}`}>
                  {tab.labelBn}
                </span>
                <span className={`text-[9px] font-medium tracking-tight ${isActive ? 'text-amber-300/80' : 'text-slate-400'}`}>
                  {tab.labelEn}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

