import { useState, useMemo, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { BannerSwiper } from './components/BannerSwiper';
import { MarqueeTicker } from './components/MarqueeTicker';
import { CategoryNav } from './components/CategoryNav';
import { LotteryLobby } from './components/LotteryLobby';
import { MiniGamesLobby } from './components/MiniGamesLobby';
import { GamesGrid } from './components/GamesGrid';
import { DailyRankLeaderboard } from './components/DailyRankLeaderboard';
import { WinGoGame } from './components/WinGoGame';
import { K3Game } from './components/K3Game';
import { FiveDGame } from './components/FiveDGame';
import { TrxWinGoGame } from './components/TrxWinGoGame';
import { AviatorGame } from './components/AviatorGame';
import { MinesGame } from './components/MinesGame';
import { PlinkoGame } from './components/PlinkoGame';
import { SlotGameModal } from './components/SlotGameModal';
import { LiveCasinoGame } from './components/LiveCasinoGame';
import { FishingGame } from './components/FishingGame';
import { CardGamesLobby } from './components/CardGamesLobby';
import { SportsbookView } from './components/SportsbookView';
import { ActivityView } from './components/ActivityView';
import { PromotionView } from './components/PromotionView';
import { WalletView } from './components/WalletView';
import { AccountView } from './components/AccountView';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { AuthModal } from './components/AuthModal';
import { VipActivityModal } from './components/VipActivityModal';
import { CustomerServiceModal } from './components/CustomerServiceModal';
import { BottomNavBar, NavTab } from './components/BottomNavBar';
import { ActiveVerifyModal } from './components/ActiveVerifyModal';
import { AppDownloadModal } from './components/AppDownloadModal';
import { AdminPanel } from './components/AdminPanel';
import { GameRestrictionModal } from './components/GameRestrictionModal';
import { BrandLogo } from './components/BrandLogo';
import { SplashScreen } from './components/SplashScreen';
import { UserBanModal } from './components/UserBanModal';
import { WalletNoticeModal } from './components/WalletNoticeModal';
import { FirstDepositModal } from './components/FirstDepositModal';
import {
  UserProfile,
  Language,
  Currency,
  GameCategory,
  ActiveGameViewType,
} from './types';
import { INITIAL_USER, GAMES_CATALOGUE } from './data/mockData';
import { sound } from './utils/audio';
import { getLocalConfig, getLocalMembers, saveLocalMember, updateLocalMember, DEFAULT_VIP_SETTINGS } from './utils/firebase';
import {
  ShieldCheck,
  Sparkles,
  Flame,
  Coins,
  Headphones,
} from 'lucide-react';

const AUTO_LOGOUT_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours of inactivity
const LAST_ACTIVE_KEY = 'victor_last_active_timestamp';
const SESSION_USER_KEY = 'victor_session_user';
const LAST_LOGIN_TIME_KEY = 'victor_last_login_time';

function loadPersistedUser(): UserProfile {
  try {
    const raw = localStorage.getItem(SESSION_USER_KEY);
    const loginTime = localStorage.getItem(LAST_LOGIN_TIME_KEY);
    if (raw && loginTime) {
      const elapsed = Date.now() - parseInt(loginTime, 10);
      if (elapsed < AUTO_LOGOUT_DURATION_MS) {
        const parsed = JSON.parse(raw);
        const members = getLocalMembers();
        const member = members.find(m => m.uid === parsed.id || (parsed.phone && m.phone === parsed.phone));
        if (member && member.status !== 'banned') {
          return {
            ...INITIAL_USER,
            ...parsed,
            balance: typeof member.balance === 'number' ? member.balance : parsed.balance,
            vipLevel: member.vipLevel || parsed.vipLevel || 1,
            vipExp: member.vipExp || parsed.vipExp || 0,
            isLoggedIn: true,
          };
        }
        return { ...INITIAL_USER, ...parsed, isLoggedIn: true };
      }
    }
  } catch (e) {}
  return INITIAL_USER;
}

export default function App() {
  // Global State with 24-hour persistence
  const [user, setUser] = useState<UserProfile>(() => loadPersistedUser());
  const betFractionRef = useRef<number>(0);
  const [language, setLanguage] = useState<Language>('bn');
  const [currency, setCurrency] = useState<Currency>('BDT');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Active Category & Navigation Tab
  const [activeCategory, setActiveCategory] = useState<GameCategory>('all');
  const [activeGameArena, setActiveGameArena] = useState<ActiveGameViewType>('none');
  const [activeDuration, setActiveDuration] = useState<number>(1);
  const [activeSlotTitle, setActiveSlotTitle] = useState<string>('fortune-tiger');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [activeBottomTab, setActiveBottomTab] = useState<NavTab>('home');

  // Modal Triggers
  const [showDeposit, setShowDeposit] = useState<boolean>(false);
  const [showWithdraw, setShowWithdraw] = useState<boolean>(false);
  const [showWalletNotice, setShowWalletNotice] = useState<{ open: boolean; intent: 'deposit' | 'withdraw' }>({
    open: false,
    intent: 'deposit',
  });
  const [showAuth, setShowAuth] = useState<{ open: boolean; mode: 'login' | 'register' }>({
    open: false,
    mode: 'login',
  });
  const [showFirstDeposit, setShowFirstDeposit] = useState<boolean>(false);
  const [showVip, setShowVip] = useState<boolean>(false);
  const [showSupport, setShowSupport] = useState<boolean>(false);
  const [showSecurity, setShowSecurity] = useState<boolean>(false);
  const [showAppDownload, setShowAppDownload] = useState<boolean>(false);
  const [showGameRestriction, setShowGameRestriction] = useState<boolean>(false);
  const [bannedUserAlert, setBannedUserAlert] = useState<{ uid: string; reason: string } | null>(null);
  const [isAdminPageActive, setIsAdminPageActive] = useState<boolean>(false);
  const [sessionExpiredToast, setSessionExpiredToast] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);

  const footerClickCount = useRef<number>(0);
  const footerClickTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-detect referral code and register route from URL (query or hash)
  useEffect(() => {
    try {
      let refCode: string | null = null;
      const searchParams = new URLSearchParams(window.location.search);
      refCode = searchParams.get('invitationCode') || searchParams.get('ref') || searchParams.get('invite') || searchParams.get('code') || searchParams.get('r');

      // Also check hash query, e.g. /#/register?invitationCode=VICTOR888
      if (!refCode && window.location.hash.includes('?')) {
        const hashQueryPart = window.location.hash.split('?')[1];
        if (hashQueryPart) {
          const hashParams = new URLSearchParams(hashQueryPart);
          refCode = hashParams.get('invitationCode') || hashParams.get('ref') || hashParams.get('invite') || hashParams.get('code') || hashParams.get('r');
        }
      }

      if (refCode) {
        localStorage.setItem('victor_referral_code', refCode.toUpperCase());
      }

      // If URL has #/register and user is not logged in, trigger register modal automatically
      if (window.location.hash.includes('/register') && !user.isLoggedIn) {
        setShowAuth({ open: true, mode: 'register' });
      }
    } catch {
      // Ignored
    }
  }, [user.isLoggedIn]);

  // Check ban status on active user
  useEffect(() => {
    if (user.isLoggedIn && user.id) {
      const members = getLocalMembers();
      const current = members.find((m) => m.uid === user.id || m.phone === user.phone);
      if (current && current.status === 'banned') {
        setUser((prev) => ({ ...prev, isLoggedIn: false }));
        setBannedUserAlert({
          uid: current.uid,
          reason: current.banReason || 'নিরাপত্তা নীতি লঙ্ঘনের কারণে অ্যাকাউন্ট সাময়িকভাবে স্থগিত',
        });
      }
    }
  }, [user.isLoggedIn, user.id, user.phone]);

  // Activity tracking for 24-hour auto logout
  useEffect(() => {
    const updateActivity = () => {
      localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
    };

    // Check on startup if 24 hours elapsed since last activity
    const savedTime = localStorage.getItem(LAST_ACTIVE_KEY);
    if (savedTime && user.isLoggedIn) {
      const elapsed = Date.now() - parseInt(savedTime, 10);
      if (elapsed > AUTO_LOGOUT_DURATION_MS) {
        setUser((prev) => ({ ...prev, isLoggedIn: false }));
        setSessionExpiredToast(true);
        setShowAuth({ open: true, mode: 'login' });
      }
    }

    // Set initial activity
    updateActivity();

    // Event listeners for user actions
    window.addEventListener('click', updateActivity, { passive: true });
    window.addEventListener('keydown', updateActivity, { passive: true });
    window.addEventListener('touchstart', updateActivity, { passive: true });

    // Periodic check every 60 seconds
    const interval = setInterval(() => {
      const last = localStorage.getItem(LAST_ACTIVE_KEY);
      if (last && user.isLoggedIn) {
        const timePassed = Date.now() - parseInt(last, 10);
        if (timePassed > AUTO_LOGOUT_DURATION_MS) {
          setUser((prev) => ({ ...prev, isLoggedIn: false }));
          setSessionExpiredToast(true);
          setShowAuth({ open: true, mode: 'login' });
        }
      }
    }, 60000);

    // Keyboard shortcut for secret admin access: Ctrl+Shift+A or Alt+Shift+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.altKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminPageActive(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, [user.isLoggedIn]);

  // Secret admin unlock via footer 5-clicks
  const handleFooterSecretClick = () => {
    footerClickCount.current += 1;
    if (footerClickTimer.current) clearTimeout(footerClickTimer.current);

    if (footerClickCount.current >= 5) {
      footerClickCount.current = 0;
      setIsAdminPageActive(true);
    } else {
      footerClickTimer.current = setTimeout(() => {
        footerClickCount.current = 0;
      }, 2000);
    }
  };

  // Toggle Sound FX
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
    if (next) sound.playClick();
  };

  // Sync logged in user profile changes to local storage session
  useEffect(() => {
    if (user.isLoggedIn && user.id) {
      try {
        localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
      } catch (e) {}
    }
  }, [user]);

  // Update Balance and VIP Experience (100 BDT bet = 1 VIP bet/exp)
  const handleUpdateBalance = (newBalance: number, isBet: boolean = true) => {
    setUser((prev) => {
      const diff = prev.balance - newBalance;
      let newVipExp = prev.vipExp || 0;
      let newVipLevel = prev.vipLevel || 1;

      if (isBet && diff > 0) {
        // Every 100 BDT bet counts as 1 VIP bet count
        const totalAccum = betFractionRef.current + diff;
        const countToAdd = Math.floor(totalAccum / 100);
        betFractionRef.current = totalAccum % 100;

        if (countToAdd > 0) {
          newVipExp += countToAdd;
          const sysCfg = getLocalConfig();
          const tiers = sysCfg.vipSettings && sysCfg.vipSettings.length > 0 ? sysCfg.vipSettings : DEFAULT_VIP_SETTINGS;
          const nextTier = tiers.find((t) => t.level === newVipLevel + 1);
          if (nextTier && newVipExp >= nextTier.requiredBetCount) {
            newVipLevel = nextTier.level;
          }
        }
      }

      const updatedUser: UserProfile = {
        ...prev,
        balance: Math.max(0, newBalance),
        vipExp: newVipExp,
        vipLevel: newVipLevel,
      };

      if (prev.id) {
        updateLocalMember(prev.id, {
          balance: updatedUser.balance,
          vipExp: updatedUser.vipExp,
          vipLevel: updatedUser.vipLevel,
        });
      }

      try {
        if (updatedUser.isLoggedIn) {
          localStorage.setItem(SESSION_USER_KEY, JSON.stringify(updatedUser));
        }
      } catch (e) {}

      return updatedUser;
    });
  };

  // Refresh Balance Trigger
  const handleRefreshBalance = () => {
    setUser((prev) => {
      const members = getLocalMembers();
      const fresh = members.find((m) => m.uid === prev.id || (prev.phone && m.phone === prev.phone));
      if (fresh) {
        return {
          ...prev,
          balance: typeof fresh.balance === 'number' ? fresh.balance : prev.balance,
          vipLevel: fresh.vipLevel || prev.vipLevel,
          vipExp: fresh.vipExp || prev.vipExp,
        };
      }
      return { ...prev };
    });
  };

  // Handle Logout
  const handleLogout = () => {
    sound.playClick();
    try {
      localStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem(LAST_LOGIN_TIME_KEY);
    } catch (e) {}
    setUser((prev) => ({
      ...prev,
      isLoggedIn: false,
    }));
    setShowAuth({ open: true, mode: 'login' });
  };

  // Filter games based on search and provider
  const filteredGames = useMemo(() => {
    return GAMES_CATALOGUE.filter((game) => {
      const matchCategory =
        activeCategory === 'all' ||
        game.category === activeCategory ||
        (activeCategory === 'popular' && (game.category === 'popular' || game.hot));
      const matchQuery =
        !searchQuery ||
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (game.providerCode && game.providerCode.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchProvider =
        !selectedProvider ||
        game.provider === selectedProvider ||
        game.providerCode === selectedProvider;

      return matchCategory && matchQuery && matchProvider;
    });
  }, [activeCategory, searchQuery, selectedProvider]);

  // Handle Game selection
  const handleSelectGame = (gameId: string) => {
    sound.playClick();

    // If guest user clicks anything, prompt registration screen immediately
    if (!user.isLoggedIn) {
      setShowAuth({ open: true, mode: 'register' });
      return;
    }

    setActiveBottomTab('home');

    if (gameId === 'wingo-1m' || gameId === 'wingo-3m') {
      setActiveCategory('lottery');
      setActiveGameArena('wingo');
      setActiveDuration(gameId === 'wingo-3m' ? 3 : 1);
    } else if (gameId === 'trx-wingo') {
      setActiveCategory('lottery');
      setActiveGameArena('trx-wingo');
      setActiveDuration(1);
    } else if (gameId === 'k3-lotre' || gameId === 'k3') {
      setActiveCategory('lottery');
      setActiveGameArena('k3');
      setActiveDuration(1);
    } else if (gameId === '5d-lotre' || gameId === '5d') {
      setActiveCategory('lottery');
      setActiveGameArena('5d');
      setActiveDuration(1);
    } else if (gameId === 'aviator-classic' || gameId === 'space-man' || gameId === 'aviator') {
      setActiveCategory('aviator');
      setActiveGameArena('aviator');
    } else {
      // User requested: Only Lottery and Aviator are active; other games show maintenance notice
      setShowGameRestriction(true);
    }
  };

  // Launch specific lottery game from Lobby
  const handleLaunchLottery = (type: 'wingo' | 'k3' | '5d' | 'trx-wingo', duration = 1) => {
    sound.playClick();
    if (!user.isLoggedIn) {
      setShowAuth({ open: true, mode: 'register' });
      return;
    }
    setActiveDuration(duration);
    setActiveGameArena(type);
  };

  // Switch Bottom Tab with Auth Intercept for guests
  const handleTabChange = (tab: NavTab) => {
    sound.playClick();
    if (!user.isLoggedIn && tab !== 'home') {
      setShowAuth({ open: true, mode: 'register' });
      return;
    }
    setActiveBottomTab(tab);
    setActiveGameArena('none');
  };

  // Wallet-checked Deposit Flow
  const handleOpenDepositFlow = () => {
    if (!user.isLoggedIn) {
      setShowAuth({ open: true, mode: 'register' });
      return;
    }
    const savedWallet = localStorage.getItem(`victor_wallet_${user.id || user.phone}`);
    const hasWallet = user.withdrawalWallet?.isBound || !!savedWallet;
    if (!hasWallet) {
      setShowWalletNotice({ open: true, intent: 'deposit' });
      return;
    }
    setShowDeposit(true);
  };

  // Wallet-checked Withdraw Flow
  const handleOpenWithdrawFlow = () => {
    if (!user.isLoggedIn) {
      setShowAuth({ open: true, mode: 'login' });
      return;
    }
    const savedWallet = localStorage.getItem(`victor_wallet_${user.id || user.phone}`);
    const hasWallet = user.withdrawalWallet?.isBound || !!savedWallet;
    if (!hasWallet) {
      setShowWalletNotice({ open: true, intent: 'withdraw' });
      return;
    }
    setShowWithdraw(true);
  };

  const handleWalletSaved = (walletData: any) => {
    localStorage.setItem(`victor_wallet_${user.id || user.phone}`, JSON.stringify(walletData));
    setUser((prev) => ({
      ...prev,
      withdrawalWallet: walletData,
    }));
    const members = getLocalMembers();
    const idx = members.findIndex((m) => m.uid === user.id || m.phone === user.phone);
    if (idx !== -1) {
      members[idx].withdrawalWallet = walletData;
      saveLocalMember(members[idx]);
    }
    const nextIntent = showWalletNotice.intent;
    setShowWalletNotice({ open: false, intent: 'deposit' });
    if (nextIntent === 'deposit') {
      setShowDeposit(true);
    } else {
      setShowWithdraw(true);
    }
  };

  // Dedicated Full-Screen Master Admin Page View
  if (isAdminPageActive) {
    return (
      <AdminPanel
        onExit={() => setIsAdminPageActive(false)}
        onLogout={() => {
          handleLogout();
          setIsAdminPageActive(false);
        }}
        userEmail={user.email || 'admin@gmail.com'}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-[#070f24] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white ${activeGameArena === 'none' ? 'pb-24 sm:pb-28' : 'pb-0'}`}>
      {/* Header Bar */}
      <Header
        user={user}
        language={language}
        onLanguageChange={setLanguage}
        currency={currency}
        onCurrencyChange={setCurrency}
        onOpenDeposit={handleOpenDepositFlow}
        onOpenWithdraw={handleOpenWithdrawFlow}
        onOpenAuth={(mode) => setShowAuth({ open: true, mode })}
        onOpenVip={() => {
          if (!user.isLoggedIn) {
            setShowAuth({ open: true, mode: 'register' });
          } else {
            setShowVip(true);
          }
        }}
        onOpenSupport={() => setShowSupport(true)}
        onToggleSound={handleToggleSound}
        soundEnabled={soundEnabled}
        onRefreshBalance={handleRefreshBalance}
        onOpenAppDownload={() => setShowAppDownload(true)}
        onOpenSecurity={() => {
          if (!user.isLoggedIn) {
            setShowAuth({ open: true, mode: 'register' });
          } else {
            setShowSecurity(true);
          }
        }}
        onOpenAdmin={() => setIsAdminPageActive(true)}
        activeBottomTab={activeBottomTab}
        onTabChange={handleTabChange}
      />


      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 space-y-6">
        {/* Router based on bottom navigation tabs */}
        {activeBottomTab === 'home' && (
          <div className="space-y-6">
            {/* If user is inside an active game arena, render the game arena */}
            {activeGameArena !== 'none' ? (
              <div className="space-y-4">
                {activeGameArena === 'wingo' && (
                  <WinGoGame
                    userBalance={user.balance}
                    onUpdateBalance={handleUpdateBalance}
                    currency={currency}
                    onOpenDeposit={() => setShowDeposit(true)}
                    onOpenWithdraw={() => setShowWithdraw(true)}
                    onBackToLobby={() => setActiveGameArena('none')}
                    initialDuration={activeDuration}
                    userPhone={user.phone}
                    userName={user.username}
                    userUid={user.id}
                  />
                )}

                {activeGameArena === 'k3' && (
                  <K3Game
                    userBalance={user.balance}
                    onUpdateBalance={handleUpdateBalance}
                    currency={currency}
                    onOpenDeposit={() => setShowDeposit(true)}
                    onBackToLobby={() => setActiveGameArena('none')}
                    initialDuration={activeDuration}
                  />
                )}

                {activeGameArena === '5d' && (
                  <FiveDGame
                    userBalance={user.balance}
                    onUpdateBalance={handleUpdateBalance}
                    currency={currency}
                    onOpenDeposit={() => setShowDeposit(true)}
                    onBackToLobby={() => setActiveGameArena('none')}
                    initialDuration={activeDuration}
                  />
                )}

                {activeGameArena === 'trx-wingo' && (
                  <TrxWinGoGame
                    userBalance={user.balance}
                    onUpdateBalance={handleUpdateBalance}
                    currency={currency}
                    onOpenDeposit={() => setShowDeposit(true)}
                    onBackToLobby={() => setActiveGameArena('none')}
                    initialDuration={activeDuration}
                  />
                )}

                {activeGameArena === 'aviator' && (
                  <AviatorGame
                    userBalance={user.balance}
                    onUpdateBalance={handleUpdateBalance}
                    currency={currency}
                    onOpenDeposit={() => setShowDeposit(true)}
                    onBackToLobby={() => setActiveGameArena('none')}
                  />
                )}

                {activeGameArena === 'mines' && (
                  <MinesGame
                    userBalance={user.balance}
                    onUpdateBalance={handleUpdateBalance}
                    currency={currency}
                    onOpenDeposit={() => setShowDeposit(true)}
                    onBackToLobby={() => setActiveGameArena('none')}
                  />
                )}

                {activeGameArena === 'plinko' && (
                  <PlinkoGame
                    userBalance={user.balance}
                    onUpdateBalance={handleUpdateBalance}
                    currency={currency}
                    onOpenDeposit={() => setShowDeposit(true)}
                    onBackToLobby={() => setActiveGameArena('none')}
                  />
                )}

                {activeGameArena === 'slots' && (
                  <SlotGameModal
                    onClose={() => setActiveGameArena('none')}
                    userBalance={user.balance}
                    onUpdateBalance={handleUpdateBalance}
                    currency={currency}
                    onOpenDeposit={() => setShowDeposit(true)}
                    initialGameTitle={activeSlotTitle}
                  />
                )}

                {activeGameArena === 'live-casino' && (
                  <LiveCasinoGame
                    userBalance={user.balance}
                    onUpdateBalance={handleUpdateBalance}
                    currency={currency}
                    onOpenDeposit={() => setShowDeposit(true)}
                    onBackToLobby={() => setActiveGameArena('none')}
                  />
                )}

                {activeGameArena === 'fishing' && (
                  <FishingGame
                    userBalance={user.balance}
                    onUpdateBalance={handleUpdateBalance}
                    currency={currency}
                    onOpenDeposit={() => setShowDeposit(true)}
                    onBackToLobby={() => setActiveGameArena('none')}
                  />
                )}

                {activeGameArena === 'card-game' && (
                  <CardGamesLobby
                    userBalance={user.balance}
                    onUpdateBalance={handleUpdateBalance}
                    currency={currency}
                    onOpenDeposit={() => setShowDeposit(true)}
                    onBackToLobby={() => setActiveGameArena('none')}
                  />
                )}
              </div>
            ) : (
              /* Pure Home Games Lobby */
              <>
                {/* Promotional Hero Carousel Banner */}
                <BannerSwiper
                  onSelectGame={handleSelectGame}
                  onOpenDeposit={() => setShowDeposit(true)}
                  onOpenVip={() => setShowVip(true)}
                />

                {/* Live Winners Marquee Ticker */}
                <MarqueeTicker currency={currency} />

                {/* Super Jackpot Live Strip on Home */}
                <div
                  onClick={() => {
                    sound.playClick();
                    setActiveBottomTab('activity');
                  }}
                  className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0d1d44] via-[#091533] to-[#122552] border border-amber-500/40 p-3 sm:p-4 shadow-lg cursor-pointer hover:border-amber-400 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src="https://hgnice.bet/assets/png/superJackpot-Dhs_EeS5.png"
                      alt="Super Jackpot"
                      className="h-8 sm:h-9 w-auto object-contain drop-shadow"
                      referrerPolicy="no-referrer"
                    />
                    <div className="hidden sm:block">
                      <span className="text-[10px] text-amber-300 font-bold uppercase">গ্র্যান্ড সুপার জ্যাকপট</span>
                      <p className="text-xs text-slate-300 font-medium">রিয়েল-টাইমে জ্যাকপট জিতুন</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-[#050c1e] px-3 py-1.5 rounded-xl border border-amber-400/60 shadow-inner">
                    <img
                      src="https://hgnice.bet/assets/png/gold-Dr9pWTeB.png"
                      alt="Gold"
                      className="w-4 h-4 object-contain animate-bounce"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-sm sm:text-base font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                      ৳5,849,320.75
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/30">
                    <span>অ্যাক্টিভিটি দেখুন</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Category Navigation & Provider Filter Ribbon */}
                <CategoryNav
                  activeCategory={activeCategory}
                  onSelectCategory={(cat) => {
                    setActiveCategory(cat);
                    setSearchQuery('');
                  }}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedProvider={selectedProvider}
                  onProviderChange={setSelectedProvider}
                />

                {/* Active Category Sections */}
                {activeCategory === 'lottery' && (
                  <LotteryLobby
                    onSelectGame={handleLaunchLottery}
                    currency={currency}
                    userBalance={user.balance}
                  />
                )}

                {activeCategory === 'mini' && (
                  <MiniGamesLobby
                    onSelectGame={handleSelectGame}
                    currency={currency}
                    userBalance={user.balance}
                  />
                )}

                {activeCategory === 'aviator' && (
                  <section className="space-y-4">
                    <AviatorGame
                      userBalance={user.balance}
                      onUpdateBalance={handleUpdateBalance}
                      currency={currency}
                      onOpenDeposit={() => setShowDeposit(true)}
                    />
                  </section>
                )}

                {activeCategory === 'sports' && (
                  <section className="space-y-4">
                    <SportsbookView
                      userBalance={user.balance}
                      onUpdateBalance={handleUpdateBalance}
                      currency={currency}
                      onOpenDeposit={handleOpenDepositFlow}
                    />
                  </section>
                )}

                {(activeCategory === 'all' ||
                  activeCategory === 'popular' ||
                  activeCategory === 'slots' ||
                  activeCategory === 'casino' ||
                  activeCategory === 'fishing' ||
                  activeCategory === 'rummy') && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-black text-white font-display flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-sky-400" />
                        <span className="capitalize">
                          {activeCategory === 'all'
                            ? 'All Games'
                            : activeCategory === 'popular'
                            ? 'Popular Hot Games'
                            : `${activeCategory} Arena`}
                        </span>
                      </h2>
                      <span className="text-xs text-slate-400 font-mono">
                        {filteredGames.length} games available
                      </span>
                    </div>

                    <GamesGrid
                      games={filteredGames}
                      currency={currency}
                      onSelectGame={handleSelectGame}
                    />
                  </section>
                )}

                {/* Daily Profit Rank Stage & Live Leaderboard */}
                <DailyRankLeaderboard currency={currency} />
              </>
            )}
          </div>
        )}

        {/* Activity Tab View */}
        {activeBottomTab === 'activity' && (
          <ActivityView
            user={user}
            currency={currency}
            onUpdateBalance={handleUpdateBalance}
            onOpenDeposit={handleOpenDepositFlow}
            onOpenVip={() => setShowVip(true)}
          />
        )}

        {/* Promotion (Agent) Tab View */}
        {activeBottomTab === 'promotion' && (
          <PromotionView
            user={user}
            currency={currency}
            onUpdateBalance={handleUpdateBalance}
            onOpenDeposit={handleOpenDepositFlow}
          />
        )}

        {/* Wallet Tab View */}
        {activeBottomTab === 'wallet' && (
          <WalletView
            user={user}
            currency={currency}
            onOpenDeposit={handleOpenDepositFlow}
            onOpenWithdraw={handleOpenWithdrawFlow}
            onUpdateBalance={handleUpdateBalance}
          />
        )}

        {/* Account ("Mine") Tab View */}
        {activeBottomTab === 'account' && (
          <AccountView
            user={user}
            currency={currency}
            language={language}
            onLanguageChange={setLanguage}
            onCurrencyChange={setCurrency}
            onOpenDeposit={handleOpenDepositFlow}
            onOpenWithdraw={handleOpenWithdrawFlow}
            onOpenVip={() => setShowVip(true)}
            onOpenSupport={() => setShowSupport(true)}
            onOpenSecurity={() => setShowSecurity(true)}
            onOpenAppDownload={() => setShowAppDownload(true)}
            onOpenAdmin={() => setIsAdminPageActive(true)}
            onToggleSound={handleToggleSound}
            soundEnabled={soundEnabled}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Floating Quick Customer Support Button - ONLY when not inside dedicated game arena */}
      {activeGameArena === 'none' && (
        <button
          type="button"
          id="floating-support-btn"
          onClick={() => {
            sound.playClick();
            setShowSupport(true);
          }}
          className="fixed right-4 bottom-20 md:bottom-8 z-40 w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white flex items-center justify-center shadow-[0_0_25px_rgba(56,189,248,0.6)] border-2 border-sky-300 hover:scale-110 active:scale-95 transition-all cursor-pointer p-2"
          title="24/7 Live Support"
        >
          <img
            src="https://hgnice.bet/assets/png/icon_sevice-CvgHVdRU.png"
            alt="Customer Support"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </button>
      )}

      {/* Footer Details - ONLY when not inside dedicated game arena */}
      {activeGameArena === 'none' && (
        <footer className="mt-auto border-t border-blue-950/80 bg-[#050c1e] py-8 text-center text-xs text-slate-400 space-y-4">
          <div className="max-w-7xl mx-auto px-4 space-y-4">
            <div className="flex justify-center">
              <BrandLogo size="lg" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-slate-300 font-bold">
              <span>🟣 bKash</span>
              <span>🟠 Nagad</span>
              <span>🟣 Rocket</span>
              <span>🟢 USDT TRC20</span>
              <span>🏦 Bank Wire</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <ShieldCheck className="w-4 h-4" /> 18+ Responsible Gaming
              </span>
              <span>•</span>
              <span>Fair Play Verified by RNG</span>
              <span>•</span>
              <span>SSL 256-bit Bank Grade Security</span>
            </div>

            <p className="text-[10px] text-slate-400 max-w-xl mx-auto leading-relaxed">
              VICTOR WIN is a licensed international online entertainment gaming platform. All games are certified with verified Random Number Generator (RNG) protocols for maximum fairness.
            </p>

            <p className="text-[10px] text-slate-400 font-mono">
              © 2026 VICTOR WIN. All rights reserved.
            </p>
          </div>
        </footer>
      )}

      {/* Responsive Bottom Mobile Navigation Bar - ONLY when not inside dedicated game arena */}
      {activeGameArena === 'none' && (
        <BottomNavBar
          activeTab={activeBottomTab}
          onTabChange={handleTabChange}
          onOpenDeposit={handleOpenDepositFlow}
        />
      )}

      {/* Mandatory Withdrawal Wallet Binding Announcement Notice Modal */}
      {showWalletNotice.open && (
        <WalletNoticeModal
          isOpen={showWalletNotice.open}
          onClose={() => setShowWalletNotice({ open: false, intent: 'deposit' })}
          onWalletSaved={handleWalletSaved}
          currentWallet={user.withdrawalWallet}
          userName={user.username}
          intent={showWalletNotice.intent}
        />
      )}

      {/* All Popups / Modals */}
      {showDeposit && (
        <DepositModal
          onClose={() => setShowDeposit(false)}
          userBalance={user.balance}
          onUpdateBalance={handleUpdateBalance}
          currency={currency}
          userPhone={user.phone}
          userName={user.username}
        />
      )}

      {showWithdraw && (
        <WithdrawModal
          onClose={() => setShowWithdraw(false)}
          userBalance={user.balance}
          onUpdateBalance={handleUpdateBalance}
          currency={currency}
          userId={user.id}
          username={user.username}
          userPhone={user.phone}
        />
      )}

      {showAuth.open && (
        <AuthModal
          initialMode={showAuth.mode}
          onClose={() => setShowAuth({ open: false, mode: 'login' })}
          onLoginSuccess={(userData, wasRegister) => {
            const updated = { ...user, ...userData, isLoggedIn: true };
            try {
              localStorage.setItem(LAST_LOGIN_TIME_KEY, String(Date.now()));
              localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
              localStorage.setItem(SESSION_USER_KEY, JSON.stringify(updated));
            } catch (e) {}
            setUser(updated);
            if (userData.role === 'admin') {
              setIsAdminPageActive(true);
            } else if (wasRegister) {
              const currentConfig = getLocalConfig();
              // Check if admin enabled the First Deposit Bonus popup
              if (currentConfig.firstDepositBonus?.enabled !== false) {
                setTimeout(() => {
                  setShowFirstDeposit(true);
                }, 400);
              }
            }
          }}
        />
      )}

      {/* First Deposit Welcome Bonus Modal Popup */}
      <FirstDepositModal
        isOpen={showFirstDeposit}
        onClose={() => setShowFirstDeposit(false)}
        onOpenDeposit={() => {
          setShowFirstDeposit(false);
          handleOpenDepositFlow();
        }}
        config={getLocalConfig().firstDepositBonus}
        userName={user.username}
      />

      {showVip && (
        <VipActivityModal
          user={user}
          onClose={() => setShowVip(false)}
          currency={currency}
          onUpdateBalance={handleUpdateBalance}
          onOpenDeposit={handleOpenDepositFlow}
        />
      )}

      {showSupport && (
        <CustomerServiceModal onClose={() => setShowSupport(false)} />
      )}

      {showSecurity && (
        <ActiveVerifyModal
          user={user}
          onClose={() => setShowSecurity(false)}
          onUpdateUser={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
        />
      )}

      {showAppDownload && (
        <AppDownloadModal onClose={() => setShowAppDownload(false)} />
      )}

      {/* Game Restriction / Lottery & Aviator Recommendation Modal */}
      {showGameRestriction && (
        <GameRestrictionModal
          isOpen={showGameRestriction}
          onClose={() => setShowGameRestriction(false)}
          onGoToLottery={() => {
            setShowGameRestriction(false);
            setActiveBottomTab('home');
            setActiveCategory('lottery');
            setActiveGameArena('wingo');
            setActiveDuration(1);
          }}
          onGoToAviator={() => {
            setShowGameRestriction(false);
            setActiveBottomTab('home');
            setActiveCategory('aviator');
            setActiveGameArena('aviator');
          }}
        />
      )}

      {/* User Ban Notice Modal */}
      {bannedUserAlert && (
        <UserBanModal
          isOpen={true}
          uid={bannedUserAlert.uid}
          reason={bannedUserAlert.reason}
          onClose={() => setBannedUserAlert(null)}
          onContactSupport={() => {
            setBannedUserAlert(null);
            setShowSupport(true);
          }}
        />
      )}

      {/* 2-3 Second Brand Logo Splash Screen on initial load */}
      {showSplash && (
        <SplashScreen
          durationMs={2500}
          onComplete={() => setShowSplash(false)}
        />
      )}
    </div>
  );
}
