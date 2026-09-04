import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Flame,
  CreditCard,
  Layers,
  Gift,
  CheckCircle2,
  XCircle,
  Sliders,
  DollarSign,
  Lock,
  Sparkles,
  Clock,
  Users,
  Search,
  Plus,
  Minus,
  Copy,
  Trash2,
  UserCheck,
  UserX,
  Send,
  Zap,
  Tag,
  KeyRound,
  ShieldCheck,
  LayoutDashboard,
  Gamepad2,
  Radio,
  Share2,
  Settings,
  LogOut,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Wallet,
  Activity,
  Smartphone,
  Monitor,
  AlertTriangle,
  FileText,
  X,
} from 'lucide-react';
import {
  SystemConfig,
  GatewayConfig,
  DepositRequest,
  GiftCodeItem,
  RegisteredMember,
  getLocalConfig,
  updateSystemConfig,
  getLocalDepositRequests,
  updateDepositRequestStatus,
  subscribeSystemConfig,
  getLocalMembers,
  saveLocalMember,
  updateLocalMember,
  deleteLocalMember,
} from '../utils/firebase';
import {
  getRealtimeWinGo,
  getRealtimeAviator,
  getStoredLiveBets,
  LiveBetRecord,
} from '../utils/gameSync';
import { sound } from '../utils/audio';
import { BrandLogo } from './BrandLogo';

interface AdminPanelProps {
  onExit: () => void;
  onLogout?: () => void;
  userEmail?: string;
}

export function AdminPanel({ onExit, onLogout, userEmail = 'admin@gmail.com' }: AdminPanelProps) {
  // Navigation tabs
  const [activeNav, setActiveNav] = useState<
    'dashboard' | 'users' | 'devices' | 'giftcodes' | 'market' | 'livebets' | 'deposits' | 'gateways' | 'games' | 'commissions' | 'system'
  >('dashboard');

  // Live Firebase Synchronized System Config
  const [config, setConfig] = useState<SystemConfig>(() => getLocalConfig());
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>(() => getLocalDepositRequests());
  const [members, setMembers] = useState<RegisteredMember[]>(() => getLocalMembers());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Ban Reason Modal state
  const [banModalMember, setBanModalMember] = useState<RegisteredMember | null>(null);
  const [banReasonText, setBanReasonText] = useState<string>('বহু অ্যাকাউন্ট তৈরি ও সিকিউরিটি লঙ্ঘন');

  // Member Activity Log Modal state
  const [activityModalMember, setActivityModalMember] = useState<RegisteredMember | null>(null);

  // Device Filter state
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'duplicate_ip' | 'duplicate_device'>('all');

  // User search & balance modifier state
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserUid, setSelectedUserUid] = useState<string | null>(null);
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState<number>(500);

  // Live WinGo & Aviator state for market control
  const [liveWinGo, setLiveWinGo] = useState(() => getRealtimeWinGo(30));
  const [liveAviator, setLiveAviator] = useState(() => getRealtimeAviator());
  const [aviatorCustomInput, setAviatorCustomInput] = useState<string>('5.50');

  // Advanced Gift code creation form state
  const [newCode, setNewCode] = useState('');
  const [newCodeAmount, setNewCodeAmount] = useState<number>(100);
  const [newCodeMaxClaims, setNewCodeMaxClaims] = useState<number>(50);
  const [newCodeTargetType, setNewCodeTargetType] = useState<'all' | 'specific_uid' | 'female_only' | 'vip_only'>('all');
  const [newCodeTargetUid, setNewCodeTargetUid] = useState('');
  const [newCodeCategory, setNewCodeCategory] = useState('সাধারণ বোনাস');
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Live Bets Monitoring State
  const [liveBets, setLiveBets] = useState<LiveBetRecord[]>(() => getStoredLiveBets());

  // Subscribe to Firebase real-time updates & clock
  useEffect(() => {
    const unsub = subscribeSystemConfig((newCfg) => {
      setConfig(newCfg);
    });

    const clockInterval = setInterval(() => {
      setLiveWinGo(getRealtimeWinGo(30));
      setLiveAviator(getRealtimeAviator());
      setDepositRequests(getLocalDepositRequests());
      setMembers(getLocalMembers());
      setLiveBets(getStoredLiveBets());
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    const handleBetPlaced = () => {
      setLiveBets(getStoredLiveBets());
    };
    window.addEventListener('victorwin_live_bet_placed', handleBetPlaced);

    return () => {
      unsub();
      clearInterval(clockInterval);
      window.removeEventListener('victorwin_live_bet_placed', handleBetPlaced);
    };
  }, []);

  const handleSaveConfig = async (updatedConfig: Partial<SystemConfig>) => {
    sound.playChip();
    await updateSystemConfig(updatedConfig);
    showToast('✓ সিস্টেম কনফিগারেশন রিয়েলটাইমে সেভ হয়েছে!');
  };

  const handleToggleGame = (gameKey: string) => {
    const current = config.gameStatuses[gameKey] || 'active';
    const nextStatus = current === 'active' ? 'coming_soon' : 'active';
    const updated = {
      ...config.gameStatuses,
      [gameKey]: nextStatus,
    };
    handleSaveConfig({ gameStatuses: updated });
  };

  const handleUpdateGateway = (gatewayId: string, field: keyof GatewayConfig, value: any) => {
    const currentGw = config.gateways[gatewayId];
    if (!currentGw) return;

    const updatedGw: GatewayConfig = {
      ...currentGw,
      [field]: value,
    };

    const updatedGateways = {
      ...config.gateways,
      [gatewayId]: updatedGw,
    };

    handleSaveConfig({ gateways: updatedGateways });
  };

  const handleSetWinGoOverride = (num: number) => {
    const targetPeriod = liveWinGo.period;
    handleSaveConfig({
      marketControl: {
        ...config.marketControl,
        houseEdgeMode: 'custom_number',
        targetCustomNumber: num,
        winGoNextOverride: {
          period: targetPeriod,
          number: num,
        },
      },
    });
    showToast(`উইন গো পিরিয়ড #${targetPeriod} এর ফলাফল [${num}] ফিক্সড করা হয়েছে!`);
  };

  // Aviator Crash Override Handlers
  const handleSetAviatorCrashOverride = (multiplier: number) => {
    handleSaveConfig({
      marketControl: {
        ...config.marketControl,
        aviatorCrashMode: 'exact_override',
        aviatorNextCrashOverride: multiplier,
      },
    });
    showToast(`✈️ এভিয়েটর পরবর্তী রাউন্ডের ক্র্যাশ পয়েন্ট [${multiplier.toFixed(2)}x] ফিক্সড করা হয়েছে!`);
  };

  const handleSetAviatorMode = (mode: 'auto' | 'high_multiplier' | 'low_crash') => {
    handleSaveConfig({
      marketControl: {
        ...config.marketControl,
        aviatorCrashMode: mode,
        aviatorNextCrashOverride: null,
      },
    });
    const label = mode === 'auto' ? 'অটো ডাইনামিক (স্বাভাবিক RNG)' : mode === 'high_multiplier' ? 'মুন শট ও বিগ উইন (High)' : 'লো ক্র্যাশ (Early Crash)';
    showToast(`✈️ এভিয়েটর ফ্লাইট মোড [${label}] সক্রিয় করা হয়েছে!`);
  };

  // Generate random gift code
  const handleGenerateRandomCode = () => {
    const prefixes = ['GIFT', 'VIP', 'WIN', 'FEMALE', 'BONUS', 'HERO'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setNewCode(`${randomPrefix}_${randomSuffix}`);
  };

  // Add advanced gift code
  const handleAddGiftCode = () => {
    if (!newCode.trim()) {
      showToast('অনুগ্রহ করে গিফট কোড লিখুন বা জেনারেট করুন');
      return;
    }
    const item: GiftCodeItem = {
      code: newCode.trim().toUpperCase(),
      rewardAmount: Number(newCodeAmount) || 50,
      maxClaims: Number(newCodeMaxClaims) || 100,
      claimedCount: 0,
      isActive: true,
      createdAt: new Date().toLocaleDateString(),
      targetType: newCodeTargetType,
      targetUid: newCodeTargetType === 'specific_uid' ? newCodeTargetUid.trim() : undefined,
      targetCategory: newCodeCategory,
      claimedUids: [],
    };
    const updated = [item, ...(config.giftCodes || [])];
    handleSaveConfig({ giftCodes: updated });
    sound.playWin();
    showToast(`নতুন গিফট কোড [${item.code}] সফলভাবে তৈরি হয়েছে!`);
    setNewCode('');
  };

  const handleToggleGiftCode = (codeStr: string) => {
    const updated = (config.giftCodes || []).map((c) =>
      c.code === codeStr ? { ...c, isActive: !c.isActive } : c
    );
    handleSaveConfig({ giftCodes: updated });
  };

  const handleDeleteGiftCode = (codeStr: string) => {
    const updated = (config.giftCodes || []).filter((c) => c.code !== codeStr);
    handleSaveConfig({ giftCodes: updated });
    showToast(`কোড ${codeStr} মুছে ফেলা হয়েছে!`);
  };

  const handleResetGiftCodeClaims = (codeStr: string) => {
    const updated = (config.giftCodes || []).map((c) =>
      c.code === codeStr ? { ...c, claimedCount: 0, claimedUids: [] } : c
    );
    handleSaveConfig({ giftCodes: updated });
    showToast(`কোড ${codeStr} এর ব্যবহার লিমিট রিসেট করা হয়েছে!`);
  };

  // User balance modify
  const handleAdjustUserBalance = (uid: string, delta: number) => {
    const member = members.find((m) => m.uid === uid);
    if (!member) return;
    const newBal = Math.max(0, (member.balance || 0) + delta);
    updateLocalMember(uid, { balance: newBal });
    setMembers(getLocalMembers());
    sound.playWin();
    showToast(`ইউআইডি ${uid} এর ব্যালেন্স ${delta > 0 ? '+' : ''}${delta}৳ আপডেট হয়েছে!`);
  };

  const handleToggleUserStatus = (uid: string) => {
    const member = members.find((m) => m.uid === uid);
    if (!member) return;
    const nextStatus = member.status === 'active' ? 'banned' : 'active';
    updateLocalMember(uid, { status: nextStatus });
    setMembers(getLocalMembers());
    showToast(`ইউআইডি ${uid} এর স্ট্যাটাস: ${nextStatus === 'active' ? 'সক্রিয়' : 'ব্যান'} করা হয়েছে!`);
  };

  const handleCreateGiftForUser = (user: RegisteredMember) => {
    setActiveNav('giftcodes');
    setNewCodeTargetType('specific_uid');
    setNewCodeTargetUid(user.uid);
    setNewCodeCategory(user.gender === 'female' ? 'মেয়ে স্পেশাল গিফট কোড' : `ইউজার ${user.username} স্পেশাল`);
    setNewCode(`BONUS_${user.uid.slice(-4)}`);
    showToast(`ইউআইডি ${user.uid} এর জন্য গিফট কোড ফরম প্রস্তুত করা হয়েছে!`);
  };

  const handleDepositAction = (id: string, status: 'approved' | 'rejected') => {
    sound.playWin();
    updateDepositRequestStatus(id, status);
    setDepositRequests(getLocalDepositRequests());
    setMembers(getLocalMembers());
    showToast(`ডিপোজিট রিকোয়েস্ট ${status === 'approved' ? 'অনুমোদিত ও ব্যালেন্সে টাকা যোগ' : 'প্রত্যাখ্যাত'} হয়েছে!`);
  };

  const filteredMembers = members.filter((m) => {
    const q = userSearch.toLowerCase();
    return (
      m.uid.toLowerCase().includes(q) ||
      m.username.toLowerCase().includes(q) ||
      m.phone.toLowerCase().includes(q)
    );
  });

  // Calculate platform totals
  const totalMemberBalance = members.reduce((sum, m) => sum + (m.balance || 0), 0);
  const pendingDeposits = depositRequests.filter((d) => d.status === 'pending');
  const totalApprovedDepositAmount = depositRequests
    .filter((d) => d.status === 'approved')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  interface NavItem {
    id: 'dashboard' | 'users' | 'devices' | 'giftcodes' | 'market' | 'livebets' | 'deposits' | 'gateways' | 'games' | 'commissions' | 'system';
    label: string;
    icon: any;
    count: string | number | null;
    highlight?: boolean;
  }

  // Calculate duplicate IPs and duplicate device models
  const ipOccurrences = members.reduce<Record<string, number>>((acc, m) => {
    const ip = m.deviceIp || '103.145.12.88';
    acc[ip] = (acc[ip] || 0) + 1;
    return acc;
  }, {});
  const duplicateIpCount = Object.values(ipOccurrences).filter((c) => Number(c) > 1).length;

  const deviceOccurrences = members.reduce<Record<string, number>>((acc, m) => {
    const dev = m.deviceModel || 'Samsung Galaxy S24 Ultra';
    acc[dev] = (acc[dev] || 0) + 1;
    return acc;
  }, {});
  const duplicateDeviceCount = Object.values(deviceOccurrences).filter((c) => Number(c) > 1).length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড ওভারভিউ', icon: LayoutDashboard, count: null },
    { id: 'users', label: 'মেম্বার ও UID তালিকা', icon: Users, count: members.length },
    { id: 'devices', label: 'আইপি ও ডিভাইস ট্র্যাকার', icon: Smartphone, count: duplicateIpCount > 0 ? `${duplicateIpCount} Dup IP` : 'SAFE', highlight: duplicateIpCount > 0 },
    { id: 'giftcodes', label: 'গিফট কোড স্টুডিও', icon: Gift, count: (config.giftCodes || []).length },
    { id: 'market', label: 'উইন গো ও এভিয়েটর সিগন্যাল', icon: Sliders, count: 'LIVE' },
    { id: 'livebets', label: 'লাইভ বেট মনিটরিং', icon: Activity, count: `${liveBets.length} Bets`, highlight: true },
    { id: 'deposits', label: 'ডিপোজিট অনুমোদন', icon: DollarSign, count: pendingDeposits.length || null, highlight: pendingDeposits.length > 0 },
    { id: 'gateways', label: 'পেমেন্ট গেটওয়ে সেটিং', icon: CreditCard, count: Object.keys(config.gateways).length },
    { id: 'games', label: 'গেম এক্টিভেশন কন্ট্রোল', icon: Gamepad2, count: null },
    { id: 'commissions', label: '৬-লেভেল রেফার কমিশন', icon: Share2, count: null },
    { id: 'system', label: 'সিস্টেম নোটিশ ও সিকিউরিটি', icon: Settings, count: null },
  ];

  return (
    <div className="min-h-screen w-full bg-[#050b1a] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* ================= TOP MASTER HUB HEADER ================= */}
      <header className="sticky top-0 z-40 w-full bg-[#07132e]/98 backdrop-blur-md border-b border-blue-500/30 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <BrandLogo size="md" />
          <div className="hidden sm:block border-l border-blue-500/30 pl-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider font-mono">
                MASTER ADMIN CONTROL HUB
              </span>
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Firebase Realtime Sync
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">
              প্ল্যাটফর্ম ইউজার, ব্যালেন্স, গিফট কোড ও মার্কেট ফুল কন্ট্রোল
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/40 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Admin Identity Badge */}
          <div className="flex items-center gap-2 bg-[#040918] px-3 py-1.5 rounded-2xl border border-amber-500/40">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-xs">
              👑
            </div>
            <div className="text-left hidden xs:block">
              <span className="text-xs font-bold text-amber-300 block leading-tight font-mono">
                {userEmail}
              </span>
              <span className="text-[9px] text-slate-400 block">
                Super Administrator
              </span>
            </div>
          </div>

          {/* Switch to Player Game Mode */}
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
            title="গেম মোডে ফিরে যান"
          >
            <Gamepad2 className="w-4 h-4" />
            <span className="hidden sm:inline">প্লেয়ার গেমিং মোড</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout || onExit}
            className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all cursor-pointer"
            title="এডমিন লগআউট"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ================= MAIN LAYOUT WITH SIDEBAR + WORKSPACE ================= */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Navigation Sidebar */}
        <aside className="w-full md:w-64 lg:w-72 bg-[#060e22] border-r border-blue-900/60 flex flex-row md:flex-col shrink-0 overflow-x-auto md:overflow-y-auto p-2 sm:p-3 gap-1.5 scrollbar-none">
          <div className="hidden md:block px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            মাস্টার কন্ট্রোল মেনু
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setActiveNav(item.id);
                }}
                className={`w-auto md:w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-lg shadow-amber-950/40'
                    : 'text-slate-300 hover:text-white hover:bg-[#0a1738]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.count !== null && (
                  <span
                    className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ml-2 ${
                      isActive
                        ? 'bg-slate-950 text-amber-300'
                        : item.highlight
                        ? 'bg-rose-500 text-white animate-bounce'
                        : 'bg-blue-950 text-sky-300 border border-blue-800'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}

          <div className="hidden md:block mt-auto pt-4 border-t border-blue-900/40 px-3 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>সার্ভার সময়:</span>
              <span className="font-mono text-amber-300 font-bold">{currentTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>মোট ইউজার:</span>
              <span className="font-mono text-white font-bold">{members.length} জন</span>
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6 bg-gradient-to-b from-[#08122c] to-[#040918]">
          
          {/* ================= 1. DASHBOARD OVERVIEW TAB ================= */}
          {activeNav === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Metrics Header Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-3xl bg-[#0a1738] border border-blue-500/30 shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>মোট রেজিস্টার্ড মেম্বার</span>
                    <Users className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                    {members.length}
                  </div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-bold">
                    <TrendingUp className="w-3.5 h-3.5" /> ১০০% রিয়েলটাইম ফায়ারবেস ট্র্যাকিং
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-[#0a1738] border border-blue-500/30 shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>মেম্বার মোট ওয়ালেট ব্যালেন্স</span>
                    <Wallet className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
                    ৳{totalMemberBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    সরাসরি এডমিন দ্বারা এড/ডিডাক্ট সম্ভব
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-[#0a1738] border border-blue-500/30 shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>অপেক্ষমান ডিপোজিট রিকোয়েস্ট</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                    {pendingDeposits.length} টি
                  </div>
                  <div className="text-[11px] text-slate-400">
                    ১-ক্লিক অনুমোদন ও অটো ব্যালেন্স ক্রেডিট
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-[#0a1738] border border-blue-500/30 shadow-lg space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>সক্রিয় গিফট কোড</span>
                    <Gift className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-purple-300">
                    {(config.giftCodes || []).filter((g) => g.isActive).length} টি
                  </div>
                  <div className="text-[11px] text-slate-400">
                    সকল ইউজার / নির্দিষ্ট UID / মেয়েদের জন্য
                  </div>
                </div>
              </div>

              {/* Quick WinGo Live Override Preview in Dashboard */}
              <div className="p-5 rounded-3xl bg-[#091533] border-2 border-amber-500/40 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-900/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 font-bold">
                      🎯
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">
                        উইন গো লাইভ মার্কেট রেজাল্ট ওভাররাইডার (Period #{liveWinGo.period})
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        বাকি সময়: <span className="text-amber-400 font-mono font-black">{liveWinGo.remainingSeconds}s</span>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveNav('market')}
                    className="text-xs text-amber-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>সম্পূর্ণ মার্কেট কন্ট্রোল দেখুন</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    চলতি বা পরবর্তী পিরিয়ডের ড্র নম্বর সরাসরি ফিক্সড করুন (০ - ৯):
                  </label>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                      const isRed = num === 0 || num === 2 || num === 4 || num === 6 || num === 8;
                      const isPurple = num === 0 || num === 5;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleSetWinGoOverride(num)}
                          className={`py-3 rounded-2xl font-black text-base font-mono shadow-md border active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            isPurple
                              ? 'bg-gradient-to-b from-purple-700 to-indigo-800 border-purple-400 text-white'
                              : isRed
                              ? 'bg-gradient-to-b from-rose-600 to-red-700 border-red-400 text-white'
                              : 'bg-gradient-to-b from-emerald-600 to-teal-700 border-emerald-400 text-white'
                          }`}
                        >
                          <span>{num}</span>
                          <span className="text-[9px] font-sans font-bold opacity-80">
                            {num >= 5 ? 'BIG' : 'SMALL'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Quick Aviator (ক্র্যাশ গেম) Live Override in Dashboard */}
              <div className="p-5 rounded-3xl bg-[#091533] border-2 border-rose-500/40 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-900/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center text-rose-400 font-bold">
                      ✈️
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">
                        এভিয়েটর (Aviator / বিমান) লাইভ কন্ট্রোল হাব
                      </h3>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>স্ট্যাটাস: <strong className={liveAviator.status === 'flying' ? 'text-emerald-400' : liveAviator.status === 'crashed' ? 'text-rose-400' : 'text-amber-400'}>{liveAviator.status === 'flying' ? '🚀 উড়ছে (IN FLIGHT)' : liveAviator.status === 'crashed' ? '💥 ক্র্যাশড' : '⏳ বেটিং অপেক্ষা'}</strong></span>
                        <span>| কারেন্ট মাল্টিপ্লায়ার: <strong className="text-amber-300 font-mono text-xs">{liveAviator.currentMultiplier.toFixed(2)}x</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveNav('market')}
                    className="text-xs text-rose-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>ফুল মার্কেট কন্ট্রোল</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    পরবর্তী রাউন্ডের বিমান ক্র্যাশ পয়েন্ট সেট করুন (১-ক্লিকে ফিক্সড):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {[
                      { label: '১.১৫x (Quick)', val: 1.15, color: 'from-slate-700 to-slate-900 border-slate-500' },
                      { label: '১.৮৫x (Safe)', val: 1.85, color: 'from-blue-700 to-indigo-900 border-blue-400' },
                      { label: '৩.৫০x (Double)', val: 3.50, color: 'from-emerald-700 to-teal-900 border-emerald-400' },
                      { label: '৮.০০x (High)', val: 8.00, color: 'from-amber-600 to-orange-900 border-amber-400' },
                      { label: '২৫.০০x (Mega)', val: 25.00, color: 'from-purple-700 to-pink-900 border-purple-400' },
                      { label: '১০০.০০x (Moon)', val: 100.00, color: 'from-rose-600 to-red-900 border-rose-400' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => handleSetAviatorCrashOverride(item.val)}
                        className={`p-2.5 rounded-2xl font-black text-xs font-mono shadow-md border bg-gradient-to-b ${item.color} text-white active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5`}
                      >
                        <span className="text-sm font-black">{item.val.toFixed(2)}x</span>
                        <span className="text-[9px] font-sans opacity-80">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => setActiveNav('users')}
                  className="p-5 rounded-3xl bg-[#0a1738] border border-blue-500/30 hover:border-amber-400/60 transition-all cursor-pointer shadow-lg space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-black text-white">মেম্বার UID ও ব্যালেন্স কন্ট্রোল</h4>
                  <p className="text-xs text-slate-400">
                    যেকোনো ইউজারের UID সার্চ করে সরাসরি ব্যালেন্স যোগ/বিয়োগ করুন, ব্যান বা এক্টিভ করুন।
                  </p>
                </div>

                <div
                  onClick={() => setActiveNav('giftcodes')}
                  className="p-5 rounded-3xl bg-[#0a1738] border border-blue-500/30 hover:border-amber-400/60 transition-all cursor-pointer shadow-lg space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                    <Gift className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-black text-white">গিফট কোড স্টুডিও</h4>
                  <p className="text-xs text-slate-400">
                    নির্দিষ্ট UID বা মেয়েদের জন্য ১০০% সুরক্ষিত স্পেশাল রিডিম ভাউচার তৈরি করুন।
                  </p>
                </div>

                <div
                  onClick={() => setActiveNav('deposits')}
                  className="p-5 rounded-3xl bg-[#0a1738] border border-blue-500/30 hover:border-amber-400/60 transition-all cursor-pointer shadow-lg space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-black text-white">ডিপোজিট রিকোয়েস্ট কিউ</h4>
                  <p className="text-xs text-slate-400">
                    বিকাশ, নগদ, রকেটে পাঠানো ট্রানজেকশন আইডি দেখে ১-ক্লিকে অনুমোদন দিন।
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. REGISTERED MEMBERS & UID MANAGEMENT ================= */}
          {activeNav === 'users' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#060e22] p-4 rounded-3xl border border-blue-500/30">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-400" />
                    <span>রেজিস্টার্ড মেম্বার ও UID সম্পূর্ণ ডেটাবেজ ({members.length} জন)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    প্রতিটি ইউজারের ফোন নম্বর, আইপি অ্যাড্রেস, ডিভাইস মডেল, ব্যালেন্স (+/-), UID ও ব্যান রিমাইন্ডার নিয়ন্ত্রণ
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Copy All Numbers Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const phones = members.map((m) => m.phone).join('\n');
                      navigator.clipboard.writeText(phones);
                      showToast(`মোট ${members.length} টি ফোন নম্বর ক্লিপবোর্ডে কপি করা হয়েছে!`);
                    }}
                    className="px-3 py-2 rounded-2xl bg-blue-600/30 hover:bg-blue-600 border border-blue-400/40 text-sky-200 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    title="সকল মেম্বারের ফোন নম্বর একসাথে কপি করুন"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">সব নম্বর কপি</span>
                  </button>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="UID / ফোন / ইউজারনেম / IP..."
                      className="w-full bg-[#040918] border border-blue-500/40 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Global Manual Balance Modifier Hub */}
              <div className="p-4 rounded-3xl bg-[#060e22] border border-emerald-500/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                    ৳
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">ম্যানুয়াল ব্যালেন্স এডজাস্টমেন্ট (Direct Balance Credit/Debit)</h4>
                    <p className="text-[11px] text-slate-400">নির্দিষ্ট ইউজারের UID সিলেক্ট করে সরাসরি কাঙ্ক্ষিত টাকা যোগ বা কর্তন করুন</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedUserUid || ''}
                    onChange={(e) => setSelectedUserUid(e.target.value || null)}
                    className="bg-[#040918] border border-blue-500/40 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:outline-none"
                  >
                    <option value="">-- ইউজার UID সিলেক্ট করুন --</option>
                    {members.map((m) => (
                      <option key={m.uid} value={m.uid}>
                        {m.uid} ({m.username}) - ৳{m.balance || 0}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    placeholder="টাকার পরিমাণ"
                    value={balanceAdjustAmount}
                    onChange={(e) => setBalanceAdjustAmount(Math.max(1, Number(e.target.value)))}
                    className="w-24 bg-[#040918] border border-blue-500/40 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-white focus:outline-none"
                  />

                  <button
                    type="button"
                    disabled={!selectedUserUid}
                    onClick={() => {
                      if (!selectedUserUid) return;
                      handleAdjustUserBalance(selectedUserUid, balanceAdjustAmount);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow cursor-pointer transition-all shrink-0"
                  >
                    + যোগ করুন
                  </button>

                  <button
                    type="button"
                    disabled={!selectedUserUid}
                    onClick={() => {
                      if (!selectedUserUid) return;
                      handleAdjustUserBalance(selectedUserUid, -balanceAdjustAmount);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow cursor-pointer transition-all shrink-0"
                  >
                    - কর্তন করুন
                  </button>
                </div>
              </div>

              {/* Members Data Table */}
              <div className="rounded-3xl bg-[#060e22] border border-blue-500/30 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-200">
                    <thead className="bg-[#091533] text-slate-400 text-[11px] uppercase tracking-wider border-b border-blue-900/60 font-mono">
                      <tr>
                        <th className="p-3.5">ইউজার প্রোফাইল ও UID</th>
                        <th className="p-3.5">ইউজারনেম ও ফোন নম্বর</th>
                        <th className="p-3.5">ডিভাইস মডেল ও IP অ্যাড্রেস</th>
                        <th className="p-3.5">ভিআইপি</th>
                        <th className="p-3.5">বর্তমান ব্যালেন্স</th>
                        <th className="p-3.5">স্ট্যাটাস / ব্যান রিমাইন্ডার</th>
                        <th className="p-3.5 text-center">ব্যালেন্স এডজাস্ট (+ / - ৳)</th>
                        <th className="p-3.5 text-right">একশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-950/60 font-medium">
                      {filteredMembers.map((member) => (
                        <tr key={member.uid} className="hover:bg-[#09173d] transition-colors">
                          {/* Avatar & UID with copy button */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={
                                  member.avatar ||
                                  `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`
                                }
                                alt={member.username}
                                className="w-9 h-9 rounded-full object-cover border-2 border-amber-400/60 shadow-md shrink-0 bg-slate-800"
                              />
                              <div>
                                <div className="flex items-center gap-1 font-mono font-black text-amber-300">
                                  <span>{member.uid}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(member.uid);
                                      showToast(`UID [${member.uid}] কপি করা হয়েছে!`);
                                    }}
                                    className="p-1 hover:bg-slate-700/60 rounded text-slate-400 hover:text-white cursor-pointer"
                                    title="কপি করুন"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="text-[10px] text-slate-400 block font-sans">
                                  রেজিস্টার্ড: {member.registeredAt}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Username & Phone with copy */}
                          <td className="p-3.5">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{member.username}</span>
                              {member.gender === 'female' && (
                                <span className="text-[10px] bg-pink-500/20 text-pink-300 px-1.5 py-0.2 rounded-full">
                                  ♀ ফিমেল
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-300">
                              <span>{member.phone}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(member.phone);
                                  showToast(`ফোন নম্বর [${member.phone}] কপি হয়েছে!`);
                                }}
                                className="p-0.5 hover:text-white text-slate-400 cursor-pointer"
                                title="ফোন কপি করুন"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </td>

                          {/* Device Model & IP */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1 font-bold text-white text-[11px]">
                              <Smartphone className="w-3 h-3 text-sky-400 shrink-0" />
                              <span className="truncate max-w-[130px]">{member.deviceModel || 'Samsung Galaxy S24'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-mono text-sky-300">
                              <span>{member.deviceIp || '103.145.12.88'}</span>
                              {(ipOccurrences[member.deviceIp || '103.145.12.88'] || 0) > 1 && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded border border-amber-500/40" title="একই IP তে একাধিক একাউন্ট">
                                  ডুপ্লিকেট IP
                                </span>
                              )}
                            </div>
                          </td>

                          {/* VIP Level */}
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] border border-amber-500/40">
                              VIP {member.vipLevel || 1}
                            </span>
                          </td>

                          {/* Balance */}
                          <td className="p-3.5 font-mono font-black text-emerald-400 text-sm">
                            ৳{(member.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>

                          {/* Status Badge & Ban Reminder */}
                          <td className="p-3.5">
                            <div className="space-y-1">
                              <select
                                value={member.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value as 'active' | 'banned' | 'bind_locked';
                                  if (newStatus === 'banned') {
                                    setBanModalMember(member);
                                    setBanReasonText(member.banReason || 'বহু অ্যাকাউন্ট তৈরি ও সিকিউরিটি লঙ্ঘন');
                                  } else {
                                    updateLocalMember(member.uid, { status: newStatus });
                                    setMembers(getLocalMembers());
                                    showToast(`ইউজার [${member.uid}] স্ট্যাটাস পরিবর্তিত হয়েছে!`);
                                  }
                                }}
                                className={`text-[11px] font-bold rounded-xl px-2 py-1 bg-[#040918] border focus:outline-none cursor-pointer ${
                                  member.status === 'active'
                                    ? 'border-emerald-500/60 text-emerald-300'
                                    : member.status === 'bind_locked'
                                    ? 'border-amber-500/60 text-amber-300'
                                    : 'border-rose-500/60 text-rose-300'
                                }`}
                              >
                                <option value="active" className="bg-slate-900 text-emerald-300">● সক্রিয় (Active)</option>
                                <option value="bind_locked" className="bg-slate-900 text-amber-300">🔒 লক/বাইন্ড (Locked)</option>
                                <option value="banned" className="bg-slate-900 text-rose-300">✕ ব্যান (Banned)</option>
                              </select>

                              {member.status === 'banned' && member.banReason && (
                                <div className="text-[10px] text-rose-300/90 font-sans italic truncate max-w-[140px]" title={member.banReason}>
                                  কারণ: {member.banReason}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Balance +/- Control */}
                          <td className="p-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAdjustUserBalance(member.uid, 500)}
                                className="px-2 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-[11px] transition-all cursor-pointer"
                                title="500 টাকা যোগ করুন"
                              >
                                +৳500
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustUserBalance(member.uid, 1000)}
                                className="px-2 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-[11px] transition-all cursor-pointer"
                                title="1000 টাকা যোগ করুন"
                              >
                                +৳1,000
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustUserBalance(member.uid, -500)}
                                className="px-2 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-[11px] transition-all cursor-pointer"
                                title="500 টাকা কর্তন করুন"
                              >
                                -৳500
                              </button>
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="p-3.5 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => setActivityModalMember(member)}
                              className="px-2.5 py-1.5 rounded-xl bg-sky-600/30 hover:bg-sky-600 border border-sky-400/50 text-sky-200 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              title="এই ইউজারের লগইন ও গেম অ্যাক্টিভিটি লগ দেখুন"
                            >
                              <Activity className="w-3 h-3" />
                              <span>লগ</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCreateGiftForUser(member)}
                              className="px-2.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 border border-purple-400/50 text-purple-200 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              title="এই ইউজারের জন্য পার্সোনাল গিফট কোড বানান"
                            >
                              <Gift className="w-3 h-3" />
                              <span>গিফট</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (member.status === 'active') {
                                  setBanModalMember(member);
                                  setBanReasonText(member.banReason || 'বহু অ্যাকাউন্ট তৈরি ও সিকিউরিটি লঙ্ঘন');
                                } else {
                                  updateLocalMember(member.uid, { status: 'active', banReason: undefined });
                                  setMembers(getLocalMembers());
                                  showToast(`ইউজার [${member.uid}] সক্রিয় করা হয়েছে!`);
                                }
                              }}
                              className={`p-1.5 rounded-xl border transition-all cursor-pointer inline-flex items-center ${
                                member.status === 'active'
                                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                              }`}
                              title={member.status === 'active' ? 'ব্যান ও রিমাইন্ডার কারণ দিন' : 'আনব্যান করুন'}
                            >
                              {member.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2.5 IP & DEVICE TRACKER TAB (NEW) ================= */}
          {activeNav === 'devices' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Device Overview Banner */}
              <div className="p-5 rounded-3xl bg-[#060e22] border border-blue-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      <Smartphone className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-white">
                        সরাসরি মেম্বার আইপি ও ডিভাইস মডেল ট্র্যাকিং সিস্টেম
                      </h3>
                      <p className="text-xs text-slate-400">
                        কার কোন আইপি, কাদের মোবাইল মডেল একই এবং মাল্টি-অ্যাকাউন্ট অপব্যবহার সনাক্তকারী
                      </p>
                    </div>
                  </div>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDeviceFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      deviceFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-[#040918] text-slate-400 border border-blue-500/30'
                    }`}
                  >
                    সকল ডিভাইস ({members.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceFilter('duplicate_ip')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      deviceFilter === 'duplicate_ip'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'bg-[#040918] text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>একই IP ক্লাস্টার ({duplicateIpCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceFilter('duplicate_device')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      deviceFilter === 'duplicate_device'
                        ? 'bg-purple-600 text-white shadow-md font-black'
                        : 'bg-[#040918] text-purple-300 border border-purple-500/40'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>একই মডেল ক্লাস্টার ({duplicateDeviceCount})</span>
                  </button>
                </div>
              </div>

              {/* IP Cluster Cards */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-amber-300 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  <span>আইপি অ্যাড্রেস অনুযায়ী মেম্বার বিভাজন (IP Clustered Database)</span>
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Object.entries(ipOccurrences).map(([ip, count]) => {
                    const countNum = Number(count);
                    const matchedMembers = members.filter((m) => (m.deviceIp || '103.145.12.88') === ip);
                    const isDup = countNum > 1;

                    if (deviceFilter === 'duplicate_ip' && !isDup) return null;

                    return (
                      <div
                        key={ip}
                        className={`p-4 sm:p-5 rounded-3xl bg-[#060e22] border shadow-xl space-y-3 ${
                          isDup ? 'border-amber-500/50 bg-gradient-to-br from-[#060e22] to-[#120f04]' : 'border-blue-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-blue-900/60 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-sky-300 bg-[#040918] px-2.5 py-1 rounded-xl border border-blue-500/40">
                              IP: {ip}
                            </span>
                            {isDup ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black animate-pulse">
                                ⚠️ {count} জন ইউজার এই IP তে
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                ইউনিক আইপি (১ জন)
                              </span>
                            )}
                          </div>

                          {isDup && (
                            <button
                              type="button"
                              onClick={() => {
                                matchedMembers.forEach((m) => {
                                  updateLocalMember(m.uid, {
                                    status: 'banned',
                                    banReason: `ডুপ্লিকেট IP (${ip}) এর মাধ্যমে একাধিক অ্যাকাউন্ট তৈরির কারণে ব্যান`,
                                  });
                                });
                                setMembers(getLocalMembers());
                                showToast(`IP ${ip} এর সকল ইউজারকে ব্যান করা হয়েছে!`);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-rose-600/30 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white text-[11px] font-bold transition-all cursor-pointer"
                            >
                              IP ক্লাস্টার ব্যান
                            </button>
                          )}
                        </div>

                        {/* List of members under this IP */}
                        <div className="space-y-2">
                          {matchedMembers.map((m) => (
                            <div
                              key={m.uid}
                              className="p-2.5 rounded-2xl bg-[#040918] border border-blue-900/60 flex items-center justify-between text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <strong className="font-mono text-amber-300">{m.uid}</strong>
                                  <span className="text-white font-semibold">{m.username}</span>
                                  <span className="text-slate-400 font-mono text-[11px]">{m.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                  <span className="text-sky-400 font-medium">📱 {m.deviceModel || 'Samsung Galaxy S24'}</span>
                                  <span>•</span>
                                  <span>ব্যালেন্স: <strong className="text-emerald-400 font-mono">৳{m.balance}</strong></span>
                                  <span>•</span>
                                  <span>স্ট্যাটাস: <strong className={m.status === 'banned' ? 'text-rose-400' : 'text-emerald-400'}>{m.status}</strong></span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  if (m.status === 'active') {
                                    setBanModalMember(m);
                                    setBanReasonText('ডুপ্লিকেট IP ও ডিভাইস মিল থাকায় অ্যাকাউন্ট স্থগিত');
                                  } else {
                                    updateLocalMember(m.uid, { status: 'active', banReason: undefined });
                                    setMembers(getLocalMembers());
                                    showToast(`UID ${m.uid} আনব্যান হয়েছে`);
                                  }
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  m.status === 'active'
                                    ? 'bg-rose-600/30 text-rose-300 hover:bg-rose-600 hover:text-white'
                                    : 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white'
                                }`}
                              >
                                {m.status === 'active' ? 'ব্যান' : 'আনব্যান'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Device Model Grouping */}
              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-black text-sky-300 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>ডিভাইস মডেল অনুযায়ী বিভাজন (Device Model Clusters)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(deviceOccurrences).map(([model, count]) => {
                    const countNum = Number(count);
                    const isDup = countNum > 1;
                    if (deviceFilter === 'duplicate_device' && !isDup) return null;

                    return (
                      <div
                        key={model}
                        className="p-4 rounded-2xl bg-[#060e22] border border-blue-500/30 shadow-md space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                            <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{model}</span>
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-900 text-sky-200">
                            {count} টি ডিভাইস
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          ব্যবহারকারী মেম্বার: {members.filter((m) => (m.deviceModel || 'Samsung Galaxy S24 Ultra') === model).map((m) => m.uid).join(', ')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. ADVANCED GIFT CODE STUDIO ================= */}
          {activeNav === 'giftcodes' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Creator Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#060e22] border-2 border-amber-500/40 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">
                        নতুন গিফট কোড জেনারেটর স্টুডিও
                      </h3>
                      <p className="text-xs text-slate-400">
                        সকলের জন্য, নির্দিষ্ট UID, মেয়েদের স্পেশাল অথবা ভিআইপিদের জন্য গিফট কোড তৈরি করুন
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateRandomCode}
                    className="px-3 py-1.5 rounded-xl bg-blue-600/40 hover:bg-blue-600 border border-blue-400/40 text-sky-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>অটো কোড তৈরি</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Code string */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">গিফট কোড নাম</label>
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      placeholder="e.g. VICTOR_500"
                      className="w-full bg-[#040918] border border-blue-500/40 rounded-xl px-3 py-2 text-xs font-mono font-black text-amber-300 uppercase placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Reward Amount */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">পুরস্কারের পরিমাণ (৳)</label>
                    <input
                      type="number"
                      value={newCodeAmount}
                      onChange={(e) => setNewCodeAmount(Number(e.target.value))}
                      className="w-full bg-[#040918] border border-blue-500/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Max claims */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">সর্বোচ্চ কতজন ক্লেইম করতে পারবে</label>
                    <input
                      type="number"
                      value={newCodeMaxClaims}
                      onChange={(e) => setNewCodeMaxClaims(Number(e.target.value))}
                      className="w-full bg-[#040918] border border-blue-500/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Target Audience Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">টার্গেট অডিয়েন্স ফিল্টার</label>
                    <select
                      value={newCodeTargetType}
                      onChange={(e) => setNewCodeTargetType(e.target.value as any)}
                      className="w-full bg-[#040918] border border-blue-500/40 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                    >
                      <option value="all">🌐 সবার জন্য উন্মুক্ত (Open for All)</option>
                      <option value="specific_uid">🎯 নির্দিষ্ট মেম্বার UID (Target UID Only)</option>
                      <option value="female_only">♀ শুধুমাত্র মেয়ে মেম্বার (Female Only)</option>
                      <option value="vip_only">👑 শুধুমাত্র ভিআইপি মেম্বার (VIP Only)</option>
                    </select>
                  </div>
                </div>

                {/* Specific UID input if target is specific_uid */}
                {newCodeTargetType === 'specific_uid' && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1 animate-in fade-in">
                    <label className="text-xs font-bold text-amber-300">টার্গেট ইউজারের UID লিখুন:</label>
                    <input
                      type="text"
                      value={newCodeTargetUid}
                      onChange={(e) => setNewCodeTargetUid(e.target.value)}
                      placeholder="e.g. VW889241"
                      className="w-full bg-[#040918] border border-amber-500/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddGiftCode}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-950/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>গিফট কোড পাবলিশ করুন (Publish Code)</span>
                </button>
              </div>

              {/* Gift Codes List */}
              <div className="rounded-3xl bg-[#060e22] border border-blue-500/30 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-blue-900/60 bg-[#091533] flex items-center justify-between">
                  <h4 className="text-sm font-black text-white">
                    সক্রিয় ও তৈরি করা গিফট কোডের তালিকা ({(config.giftCodes || []).length} টি)
                  </h4>
                </div>

                <div className="divide-y divide-blue-950/60">
                  {(config.giftCodes || []).map((codeItem) => (
                    <div
                      key={codeItem.code}
                      className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[#0a1738] transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-black text-amber-300 bg-[#040918] px-2.5 py-1 rounded-xl border border-amber-500/30">
                            {codeItem.code}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                            ৳{codeItem.rewardAmount}
                          </span>
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                            {codeItem.targetType === 'all'
                              ? '🌐 সবার জন্য'
                              : codeItem.targetType === 'female_only'
                              ? '♀ মেয়েদের জন্য'
                              : codeItem.targetType === 'specific_uid'
                              ? `🎯 UID: ${codeItem.targetUid}`
                              : '👑 ভিআইপি'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          ব্যবহার: {codeItem.claimedCount} / {codeItem.maxClaims} জন • তৈরি: {codeItem.createdAt}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(codeItem.code);
                            showToast(`কোড [${codeItem.code}] কপি হয়েছে!`);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-sky-300 text-xs font-bold border border-blue-800 transition-all cursor-pointer flex items-center gap-1"
                          title="কোড কপি"
                        >
                          <Copy className="w-3 h-3" />
                          <span>কপি</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResetGiftCodeClaims(codeItem.code)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                          title="ক্লেইম সংখ্যা ০ করুন"
                        >
                          রিসেট
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleGiftCode(codeItem.code)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            codeItem.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {codeItem.isActive ? 'সক্রিয়' : 'বন্ধ'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteGiftCode(codeItem.code)}
                          className="p-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-all cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= 4. WINGO MARKET RESULT OVERRIDER & AI SIGNAL ================= */}
          {activeNav === 'market' && (
            <div className="space-y-6 animate-in fade-in">
              {/* AI Auto Signal Predictor Hub */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#060e22] via-[#09153a] to-[#12082b] border-2 border-purple-500/50 shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-purple-900/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-purple-400 font-bold text-lg">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <span>উইন গো এআই অটো সিগন্যাল ও প্রিডিক্টর হাব</span>
                        <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full border border-purple-400/40 uppercase font-mono">
                          AUTO VIP AI
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300">
                        প্লেয়ারদের স্ক্রিনে স্বয়ংক্রিয়ভাবে নির্ভুল AI সিগন্যাল (BIG / SMALL / COLOR) প্রদর্শিত হবে
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.marketControl?.aiSignalEnabled !== false}
                        onChange={(e) => {
                          handleSaveConfig({
                            marketControl: {
                              ...config.marketControl,
                              aiSignalEnabled: e.target.checked,
                            },
                          });
                          showToast(e.target.checked ? 'এআই অটো সিগন্যাল চালু করা হয়েছে!' : 'এআই অটো সিগন্যাল বন্ধ করা হয়েছে!');
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      <span className="ml-2 text-xs font-bold text-white">
                        {config.marketControl?.aiSignalEnabled !== false ? 'অটো সিগন্যাল সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* AI Signal Strategy & Accuracy Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#040918]/80 border border-purple-500/30 space-y-1">
                    <span className="text-xs text-slate-400 font-bold block">সিগন্যাল স্ট্র্যাটেজি মোড:</span>
                    <select
                      value={config.marketControl?.aiSignalStrategy || 'trend_momentum'}
                      onChange={(e) => {
                        handleSaveConfig({
                          marketControl: {
                            ...config.marketControl,
                            aiSignalStrategy: e.target.value as any,
                          },
                        });
                        showToast('এআই সিগন্যাল স্ট্র্যাটেজি আপডেট হয়েছে!');
                      }}
                      className="w-full bg-[#07132e] border border-purple-500/40 rounded-xl px-2.5 py-1.5 text-xs text-purple-200 font-bold focus:outline-none"
                    >
                      <option value="trend_momentum">📈 ট্রেন্ড মোমেন্টাম ডাইনামিক</option>
                      <option value="martingale_reversal">🔄 রিভার্সাল ও মার্টিঙ্গেল</option>
                      <option value="fibonacci_pattern">🔢 ফিবোনাচি প্যাটার্ন এআই</option>
                    </select>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#040918]/80 border border-purple-500/30 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">সিগন্যাল একিউরেসি রেট:</span>
                      <span className="text-amber-300 font-mono font-black">{config.marketControl?.aiSignalAccuracy || 96}%</span>
                    </div>
                    <input
                      type="range"
                      min="85"
                      max="99"
                      value={config.marketControl?.aiSignalAccuracy || 96}
                      onChange={(e) => {
                        handleSaveConfig({
                          marketControl: {
                            ...config.marketControl,
                            aiSignalAccuracy: Number(e.target.value),
                          },
                        });
                      }}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>৮৫%</span>
                      <span>৯৫% (স্ট্যান্ডার্ড)</span>
                      <span>৯৯% (ম্যাক্স)</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#040918]/80 border border-purple-500/30 flex flex-col justify-center">
                    <span className="text-[11px] text-slate-400 block mb-1">চলতি পিরিয়ড সিগন্যাল প্রিভিউ:</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-purple-600 text-white font-black text-xs font-mono">
                        #{liveWinGo.period}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black text-xs">
                        {liveWinGo.period % 2 === 0 ? '🟢 GREEN / BIG (6,8)' : '🔴 RED / SMALL (1,3)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual Result Override Hub */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#060e22] border-2 border-amber-500/40 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
                  <div>
                    <h3 className="text-base font-black text-white">
                      উইন গো লাইভ পিরিয়ড ও মার্কেট কন্ট্রোল হাব
                    </h3>
                    <p className="text-xs text-slate-400">
                      চলতি বা পরবর্তী পিরিয়ডের ফলাফল (0-9 / Big / Small / Color) সরাসরি ফিক্সড করুন
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs text-slate-400 block">চলতি পিরিয়ড:</span>
                    <span className="text-base font-black text-amber-300">#{liveWinGo.period}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300 block">
                    সরাসরি ড্র নম্বর সেট করুন (১-ক্লিকে ফিক্সড হবে):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                      const isRed = num === 0 || num === 2 || num === 4 || num === 6 || num === 8;
                      const isPurple = num === 0 || num === 5;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleSetWinGoOverride(num)}
                          className={`py-4 rounded-2xl font-black text-lg font-mono shadow-lg border active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isPurple
                              ? 'bg-gradient-to-b from-purple-700 to-indigo-900 border-purple-400 text-white'
                              : isRed
                              ? 'bg-gradient-to-b from-rose-600 to-red-800 border-red-400 text-white'
                              : 'bg-gradient-to-b from-emerald-600 to-teal-800 border-emerald-400 text-white'
                          }`}
                        >
                          <span>{num}</span>
                          <span className="text-[10px] font-sans font-bold opacity-80">
                            {num >= 5 ? 'BIG' : 'SMALL'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveConfig({
                        marketControl: {
                          ...config.marketControl,
                          houseEdgeMode: 'auto_rng',
                        },
                      });
                      showToast('মার্কেট কন্ট্রোল: সম্পূর্ণ ফেয়ার অটোমেটিক RNG সেট করা হয়েছে!');
                    }}
                    className="p-3 rounded-2xl bg-blue-950 border border-blue-500/40 hover:border-blue-400 text-xs font-bold text-sky-200 transition-all cursor-pointer text-center"
                  >
                    🎲 ১০০% ফেয়ার অটোমেটিক RNG মোড
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSaveConfig({
                        marketControl: {
                          ...config.marketControl,
                          houseEdgeMode: 'force_house_win',
                        },
                      });
                      showToast('মার্কেট কন্ট্রোল: হাউস উইন ম্যাক্সিমাইজেশন সক্রিয়!');
                    }}
                    className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 hover:border-amber-400 text-xs font-bold text-amber-300 transition-all cursor-pointer text-center"
                  >
                    🏦 হাউস প্রফিট ম্যাক্সিমাইজার মোড
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSaveConfig({
                        marketControl: {
                          ...config.marketControl,
                          houseEdgeMode: 'force_player_win',
                        },
                      });
                      showToast('মার্কেট কন্ট্রোল: হাই পে-আউট প্লেয়ার বোনাস মোড সক্রিয়!');
                    }}
                    className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 hover:border-emerald-400 text-xs font-bold text-emerald-300 transition-all cursor-pointer text-center"
                  >
                    🎁 প্লেয়ার ফেভার মোড (High Payout)
                  </button>
                </div>
              </div>

              {/* Aviator Comprehensive Market & Flight Multiplier Studio */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#060e22] border-2 border-rose-500/40 shadow-xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-900/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center text-rose-400 font-bold text-lg">
                      ✈️
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">
                        এভিয়েটর (Aviator / বিমান) ফ্লাইট কন্ট্রোল ও ক্র্যাশ ইঞ্জিন
                      </h3>
                      <p className="text-xs text-slate-400">
                        লাইভ বিমান উড্ডয়ন, ক্র্যাশ পয়েন্ট ওভাররাইড এবং অটোপাইলট মাল্টিপ্লায়ার মোড
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-[#091533] px-3 py-1.5 rounded-2xl border border-rose-500/30">
                    <span className="text-xs text-slate-400">লাইভ গতি:</span>
                    <span className="text-base font-black font-mono text-amber-300">
                      {liveAviator.currentMultiplier.toFixed(2)}x
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      liveAviator.status === 'flying'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : liveAviator.status === 'crashed'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {liveAviator.status === 'flying' ? 'উড়ছে' : liveAviator.status === 'crashed' ? 'ক্র্যাশ' : 'কাউন্টডাউন'}
                    </span>
                  </div>
                </div>

                {/* Preset Crash Point Grid */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    পরবর্তী রাউন্ডের ক্র্যাশ পয়েন্ট নির্বাচন করুন (সরাসরি প্রয়োগ হবে):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                    {[
                      { val: 1.12, label: '১.১২x (Early Crash)', bg: 'from-slate-700 to-slate-900 border-slate-500' },
                      { val: 1.25, label: '১.২৫x (Low Win Rate)', bg: 'from-rose-800 to-rose-950 border-rose-500' },
                      { val: 1.60, label: '১.৬০x (Quick Land)', bg: 'from-blue-700 to-indigo-900 border-blue-400' },
                      { val: 2.20, label: '২.২০x (Standard)', bg: 'from-emerald-700 to-teal-900 border-emerald-400' },
                      { val: 5.00, label: '৫.০০x (High Multi)', bg: 'from-amber-600 to-orange-900 border-amber-400' },
                      { val: 88.00, label: '৮৮.০০x (Moon Shot)', bg: 'from-purple-600 to-pink-900 border-purple-400' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => handleSetAviatorCrashOverride(item.val)}
                        className={`p-3 rounded-2xl font-black text-sm font-mono shadow-md border bg-gradient-to-b ${item.bg} text-white active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5`}
                      >
                        <span>{item.val.toFixed(2)}x</span>
                        <span className="text-[10px] font-sans opacity-85 font-normal">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Exact Number Input */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#091533] p-3.5 rounded-2xl border border-rose-500/30">
                  <span className="text-xs font-bold text-slate-300 shrink-0">
                    কাস্টম ক্র্যাশ মাল্টিপ্লায়ার (Custom Crash Multiplier):
                  </span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.01"
                      min="1.05"
                      max="1000"
                      value={aviatorCustomInput}
                      onChange={(e) => setAviatorCustomInput(e.target.value)}
                      placeholder="e.g. 7.50"
                      className="w-full bg-[#040918] border border-rose-500/40 rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-rose-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">x</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const num = parseFloat(aviatorCustomInput);
                      if (num && num >= 1.05) {
                        handleSetAviatorCrashOverride(num);
                      } else {
                        showToast('অনুগ্রহ করে ১.০৫ বা তার বেশি নম্বর দিন');
                      }
                    }}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    সেভ ও ওভাররাইড
                  </button>
                </div>

                {/* Flight Mode Switcher */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSetAviatorMode('auto')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      config.marketControl?.aviatorCrashMode === 'auto'
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                        : 'bg-blue-950/60 text-sky-200 border-blue-500/40 hover:border-blue-400'
                    }`}
                  >
                    🎲 ১০০% রিয়েলিস্টিক অটো ডাইনামিক মোড
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetAviatorMode('low_crash')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      config.marketControl?.aviatorCrashMode === 'low_crash'
                        ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:border-rose-400'
                    }`}
                  >
                    💥 লো উইন-রেট ও আর্লি ক্র্যাশ মোড (1.05x - 1.60x)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetAviatorMode('high_multiplier')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      config.marketControl?.aviatorCrashMode === 'high_multiplier'
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-300 shadow-md'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:border-amber-400'
                    }`}
                  >
                    🚀 মুন শট ও হাই মাল্টিপ্লায়ার মোড (5x - 65x)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 4.2 REALTIME LIVE BET MONITORING HUB ================= */}
          {activeNav === 'livebets' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="bg-[#060e22] p-5 rounded-3xl border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <span>রিয়েল-টাইম লাইভ বেট মনিটরিং ও মার্কেট অডিট</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    কোন ইউজার কত টাকা, কোন পিরিয়ডে, Big নাকি Small, নাকি কোন নির্দিষ্ট নম্বরে বেট ধরেছে তা সরাসরি দেখুন
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-1.5 rounded-2xl bg-[#091533] border border-blue-500/40 text-right">
                    <span className="text-[10px] text-slate-400 block">চলতি পিরিয়ড (#{liveWinGo.period})</span>
                    <span className="text-xs font-black font-mono text-amber-300">
                      অবশিষ্ট সময়: {liveWinGo.remainingSeconds}s
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('victorwin_live_bets_v2');
                      setLiveBets([]);
                      showToast('লাইভ বেট হিস্ট্রি সফলভাবে ক্লিয়ার করা হয়েছে!');
                    }}
                    className="px-3 py-2 rounded-2xl bg-rose-500/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    হিস্ট্রি ক্লিয়ার
                  </button>
                </div>
              </div>

              {/* Current Period Stake Breakdown Overview */}
              {(() => {
                const currentPeriodBets = liveBets.filter((b) => b.period === liveWinGo.period);
                const currentBigTotal = currentPeriodBets
                  .filter((b) => b.selection === 'big' || (typeof b.selection === 'number' && b.selection >= 5))
                  .reduce((sum, b) => sum + b.amount, 0);
                const currentSmallTotal = currentPeriodBets
                  .filter((b) => b.selection === 'small' || (typeof b.selection === 'number' && b.selection < 5))
                  .reduce((sum, b) => sum + b.amount, 0);
                const currentTotalStake = currentPeriodBets.reduce((sum, b) => sum + b.amount, 0);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-3xl bg-[#060e22] border-2 border-blue-500/40 shadow-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-300">চলতি পিরিয়ডে মোট বেট:</span>
                        <span className="text-xs font-mono font-bold text-sky-400">{currentPeriodBets.length} টি বেট</span>
                      </div>
                      <div className="text-2xl font-black font-mono text-white">
                        ৳{currentTotalStake.toLocaleString('en-US')}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        পিরিয়ড #{liveWinGo.period} এ জমা হওয়া মূলধন
                      </span>
                    </div>

                    <div className="p-4 rounded-3xl bg-[#060e22] border-2 border-amber-500/40 shadow-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-amber-300">BIG / বড় সাইডে মোট টাকা:</span>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {currentTotalStake > 0 ? Math.round((currentBigTotal / currentTotalStake) * 100) : 0}%
                        </span>
                      </div>
                      <div className="text-2xl font-black font-mono text-amber-300">
                        ৳{currentBigTotal.toLocaleString('en-US')}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        {currentBigTotal > currentSmallTotal ? '⚠️ অতিরিক্ত বেট পড়েছে (মার্কেট Small দিবে)' : '✅ ব্যালান্সড'}
                      </span>
                    </div>

                    <div className="p-4 rounded-3xl bg-[#060e22] border-2 border-indigo-500/40 shadow-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-indigo-300">SMALL / ছোট সাইডে মোট টাকা:</span>
                        <span className="text-xs font-mono font-bold text-indigo-400">
                          {currentTotalStake > 0 ? Math.round((currentSmallTotal / currentTotalStake) * 100) : 0}%
                        </span>
                      </div>
                      <div className="text-2xl font-black font-mono text-indigo-300">
                        ৳{currentSmallTotal.toLocaleString('en-US')}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        {currentSmallTotal > currentBigTotal ? '⚠️ অতিরিক্ত বেট পড়েছে (মার্কেট Big দিবে)' : '✅ ব্যালান্সড'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Live Bets Feed Table */}
              <div className="rounded-3xl bg-[#060e22] border border-blue-500/30 overflow-hidden shadow-xl">
                <div className="p-4 bg-[#091533] border-b border-blue-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <h4 className="text-sm font-black text-white">লাইভ প্লেয়ার বেট স্ট্রিম ({liveBets.length} টি রেকর্ড)</h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">প্রতি সেকেন্ডে স্বয়ংক্রিয় রিফ্রেশ হচ্ছে</span>
                </div>

                {liveBets.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 space-y-2">
                    <Activity className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
                    <p className="text-sm font-medium">বর্তমানে কোনো লাইভ বেট রেকর্ড জমা নেই।</p>
                    <p className="text-xs text-slate-600">ইউজাররা উইন গো তে বেট ধরলে সাথে সাথে এখানে লাইভ দেখতে পাবেন।</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-200">
                      <thead className="bg-[#071129] text-slate-400 text-[11px] uppercase tracking-wider border-b border-blue-950 font-mono">
                        <tr>
                          <th className="p-3.5">প্লেয়ার UID ও নাম</th>
                          <th className="p-3.5">ফোন নম্বর</th>
                          <th className="p-3.5">গেম মোড ও পিরিয়ড</th>
                          <th className="p-3.5">বেট সিলেকশন</th>
                          <th className="p-3.5">বাজির পরিমাণ</th>
                          <th className="p-3.5 text-right">সময়</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-950/60 font-medium">
                        {liveBets.map((bet) => {
                          const isCurrent = bet.period === liveWinGo.period;

                          return (
                            <tr
                              key={bet.id}
                              className={`transition-colors ${
                                isCurrent ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-[#09173d]'
                              }`}
                            >
                              <td className="p-3.5">
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{bet.userName}</span>
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                                      চলতি
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[11px] text-amber-300 font-black">
                                  UID: {bet.userUid}
                                </span>
                              </td>

                              <td className="p-3.5 font-mono text-slate-300">
                                {bet.userPhone}
                              </td>

                              <td className="p-3.5">
                                <div className="font-bold text-sky-300">WinGo {bet.duration}s</div>
                                <div className="font-mono text-[11px] text-slate-400 font-bold">
                                  #{bet.period}
                                </div>
                              </td>

                              <td className="p-3.5">
                                <span
                                  className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase font-mono shadow-sm ${
                                    bet.selection === 'green'
                                      ? 'bg-emerald-600 text-white'
                                      : bet.selection === 'red'
                                      ? 'bg-rose-600 text-white'
                                      : bet.selection === 'violet'
                                      ? 'bg-purple-600 text-white'
                                      : bet.selection === 'big'
                                      ? 'bg-amber-500 text-slate-950'
                                      : bet.selection === 'small'
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-blue-600 text-white'
                                  }`}
                                >
                                  {typeof bet.selection === 'number' ? `নম্বর ${bet.selection}` : String(bet.selection)}
                                </span>
                              </td>

                              <td className="p-3.5 font-mono font-black text-amber-300 text-sm">
                                ৳{bet.amount.toLocaleString('en-US')}
                              </td>

                              <td className="p-3.5 text-right font-mono text-slate-400 text-[11px]">
                                {new Date(bet.timestamp).toLocaleTimeString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= 5. DEPOSIT APPROVAL QUEUE ================= */}
          {activeNav === 'deposits' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-[#060e22] p-4 rounded-3xl border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <span>ডিপোজিট রিকোয়েস্ট অনুমোদন কিউ ({depositRequests.length} টি)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    বিকাশ, নগদ, রকেট ও ইউএসডিটি প্রেরক নম্বর ও TrxID যাচাই করে ১-ক্লিকে ব্যালেন্সে টাকা যোগ করুন
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">মোট অনুমোদিত ডিপোজিট:</span>
                  <span className="text-base font-black font-mono text-emerald-400">
                    ৳{totalApprovedDepositAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: `সবগুলো (${depositRequests.length})` },
                  { id: 'pending', label: `⏳ অপেক্ষমান (${depositRequests.filter(d => d.status === 'pending').length})`, color: 'text-amber-300' },
                  { id: 'approved', label: `✓ অনুমোদিত (${depositRequests.filter(d => d.status === 'approved').length})`, color: 'text-emerald-300' },
                  { id: 'rejected', label: `✕ প্রত্যাখ্যাত (${depositRequests.filter(d => d.status === 'rejected').length})`, color: 'text-rose-300' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDepositFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      depositFilter === tab.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-[#060e22] text-slate-400 hover:text-white border border-blue-900/60'
                    }`}
                  >
                    <span className={depositFilter === tab.id ? 'text-white' : tab.color}>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="rounded-3xl bg-[#060e22] border border-blue-500/30 overflow-hidden shadow-xl">
                {(() => {
                  const filteredQueue = depositRequests.filter((d) =>
                    depositFilter === 'all' ? true : d.status === depositFilter
                  );

                  if (filteredQueue.length === 0) {
                    return (
                      <div className="p-8 text-center text-xs text-slate-400">
                        কোনো {depositFilter === 'pending' ? 'অপেক্ষমান' : depositFilter === 'approved' ? 'অনুমোদিত' : depositFilter === 'rejected' ? 'প্রত্যাখ্যাত' : ''} ডিপোজিট রিকোয়েস্ট নেই।
                      </div>
                    );
                  }

                  return (
                    <div className="divide-y divide-blue-950/60">
                      {filteredQueue.map((req) => (
                        <div
                          key={req.id}
                          className="p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-[#0a1738] transition-colors"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-900 text-sky-200 uppercase font-mono">
                                {req.gateway}
                              </span>
                              <span className="text-base font-black font-mono text-emerald-400">
                                ৳{req.amount}
                              </span>
                              {req.bonus && req.bonus > 0 ? (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  +৳{req.bonus} বোনাস (মোট: ৳{req.amount + req.bonus})
                                </span>
                              ) : null}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  req.status === 'pending'
                                    ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                                    : req.status === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                {req.status === 'pending'
                                  ? '⏳ অপেক্ষমান'
                                  : req.status === 'approved'
                                  ? '✓ অনুমোদিত'
                                  : '✕ প্রত্যাখ্যাত'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-300 pt-1">
                              <div className="bg-[#08122c] px-3 py-1.5 rounded-xl border border-blue-900/50">
                                <span className="text-slate-400 text-[10px] block">ইউজার তথ্য:</span>
                                <strong className="text-white">{req.userName || req.username}</strong>
                                <span className="text-slate-400 text-[11px] block">{req.userPhone || req.phone}</span>
                              </div>

                              <div className="bg-[#08122c] px-3 py-1.5 rounded-xl border border-blue-900/50">
                                <span className="text-slate-400 text-[10px] block">যে নম্বর থেকে পাঠানো হয়েছে:</span>
                                <strong className="text-amber-300 font-mono text-xs">{req.senderNumber || 'দেওয়া হয়নি'}</strong>
                              </div>

                              <div className="bg-[#08122c] px-3 py-1.5 rounded-xl border border-blue-900/50">
                                <span className="text-slate-400 text-[10px] block">ট্রানজেকশন আইডি (TrxID):</span>
                                <strong className="text-emerald-300 font-mono text-xs tracking-wider">{req.trxId}</strong>
                              </div>

                              <div className="bg-[#08122c] px-3 py-1.5 rounded-xl border border-blue-900/50">
                                <span className="text-slate-400 text-[10px] block">রিকোয়েস্ট সময়:</span>
                                <span className="text-slate-300 text-xs font-mono">{req.formattedTime || req.createdAt}</span>
                              </div>
                            </div>
                          </div>

                          {req.status === 'pending' ? (
                            <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                              <button
                                type="button"
                                onClick={() => handleDepositAction(req.id, 'approved')}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-lg active:scale-95 cursor-pointer flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>অনুমোদন ও ব্যালেন্স যোগ</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDepositAction(req.id, 'rejected')}
                                className="px-3 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold border border-rose-500/40 transition-all cursor-pointer"
                              >
                                বাতিল
                              </button>
                            </div>
                          ) : (
                            <div className="text-right shrink-0">
                              <span className="text-xs text-slate-400 font-mono">
                                {req.status === 'approved' ? '✓ ব্যালেন্সে যোগ সম্পন্ন' : '✕ বাতিলকৃত'}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ================= 6. PAYMENT GATEWAYS SETTING ================= */}
          {activeNav === 'gateways' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-[#060e22] p-4 rounded-3xl border border-blue-500/30">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  <span>পেমেন্ট গেটওয়ে নাম্বার ও কমিশন সেটিং</span>
                </h3>
                <p className="text-xs text-slate-400">
                  বিকাশ, নগদ, রকেট ও USDT একাউন্ট নাম্বার, সর্বনিম্ন লিমিট ও ডিপোজিট বোনাস শতকরা হার
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(config.gateways).map(([gwId, gwRaw]) => {
                  const gw = gwRaw as GatewayConfig;
                  return (
                    <div
                      key={gwId}
                      className="p-5 rounded-3xl bg-[#060e22] border border-blue-500/30 shadow-lg space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-blue-900/60 pb-2">
                        <span className="text-sm font-black text-white uppercase">{gw.name}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateGateway(gwId, 'isActive', !gw.isActive)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            gw.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {gw.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </button>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="text-slate-400 block mb-1">এজেন্ট / পার্সোনাল নম্বর:</label>
                          <input
                            type="text"
                            value={gw.number}
                            onChange={(e) => handleUpdateGateway(gwId, 'number', e.target.value)}
                            className="w-full bg-[#040918] border border-blue-500/40 rounded-xl px-3 py-2 font-mono font-bold text-amber-300 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-slate-400 block mb-1">সর্বনিম্ন ডিপোজিট (৳):</label>
                            <input
                              type="number"
                              value={gw.minDeposit || 100}
                              onChange={(e) => handleUpdateGateway(gwId, 'minDeposit', Number(e.target.value))}
                              className="w-full bg-[#040918] border border-blue-500/40 rounded-xl px-3 py-2 font-mono text-white focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-slate-400 block mb-1">ডিপোজিট বোনাস (%):</label>
                            <input
                              type="number"
                              value={gw.bonusPercent || 5}
                              onChange={(e) => handleUpdateGateway(gwId, 'bonusPercent', Number(e.target.value))}
                              className="w-full bg-[#040918] border border-blue-500/40 rounded-xl px-3 py-2 font-mono text-emerald-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= 7. GAME ACTIVATION CONTROL ================= */}
          {activeNav === 'games' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-[#060e22] p-4 rounded-3xl border border-blue-500/30">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span>গেম অ্যাক্টিভেশন ও মেইনটেন্যান্স কন্ট্রোল</span>
                </h3>
                <p className="text-xs text-slate-400">
                  নির্দিষ্ট গেম চালু অথবা কামিং সুন / মেইনটেন্যান্সে রাখুন
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { id: 'wingo', title: 'উইন গো লটারি (WinGo 1M / 3M / 5M)' },
                  { id: 'trx_wingo', title: 'টিআরএক্স উইন গো (TRX WinGo)' },
                  { id: 'aviator', title: 'এভিয়েটর ক্র্যাশ (Aviator Pro)' },
                  { id: 'fortune_tiger', title: 'ফরচুন টাইগার স্লট (PG Soft)' },
                  { id: 'mines', title: 'মাইনস প্রো (Mines Pro Multiplier)' },
                  { id: 'plinko', title: 'প্লিঙ্কো ১০০০এক্স (Plinko 1000x)' },
                  { id: 'live_casino', title: 'লাইভ ক্যাসিনো ও ব্যাকারাট (Sexy Gaming)' },
                  { id: 'fishing', title: 'মেগা ফিশিং ৩ডি (JILI Fishing)' },
                  { id: 'sports', title: 'ক্রিকেট ও ফুটবল স্পোর্টসবুক' },
                ].map((g) => {
                  const currentStatus = config.gameStatuses[g.id] || 'active';
                  const isActive = currentStatus === 'active';
                  return (
                    <div
                      key={g.id}
                      className="p-4 rounded-2xl bg-[#060e22] border border-blue-500/30 flex items-center justify-between shadow-md"
                    >
                      <span className="text-xs font-bold text-white pr-2">{g.title}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleGame(g.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {isActive ? 'সক্রিয়' : 'কামিং সুন'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= 8. REFERRAL COMMISSIONS ================= */}
          {activeNav === 'commissions' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-[#060e22] p-4 rounded-3xl border border-blue-500/30">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-amber-400" />
                  <span>৬-লেভেল রেফারেল ও সাবঅর্ডিনেট কমিশন শতকরা হার</span>
                </h3>
                <p className="text-xs text-slate-400">
                  প্রত্যেকটি লেভেলের জন্য এজেন্ট কমিশন শতকরা রেট (%) নির্ধারণ করুন
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'tier1', label: 'টায়ার ১ (সরাসরি আমন্ত্রণ)' },
                  { key: 'tier2', label: 'টায়ার ২ সাবঅর্ডিনেট' },
                  { key: 'tier3', label: 'টায়ার ৩ সাবঅর্ডিনেট' },
                  { key: 'tier4', label: 'টায়ার ৪ সাবঅর্ডিনেট' },
                  { key: 'tier5', label: 'টায়ার ৫ সাবঅর্ডিনেট' },
                  { key: 'tier6', label: 'টায়ার ৬ সাবঅর্ডিনেট' },
                ].map((t) => (
                  <div key={t.key} className="p-4 rounded-2xl bg-[#060e22] border border-blue-500/30 space-y-1.5">
                    <span className="text-xs font-bold text-white">{t.label}</span>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={(config.commissions as any)[t.key]}
                        onChange={(e) =>
                          handleSaveConfig({
                            commissions: {
                              ...config.commissions,
                              [t.key]: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full bg-[#040918] border border-blue-500/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-400"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= 9. SYSTEM SETTINGS & NOTICE ================= */}
          {activeNav === 'system' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-[#060e22] p-4 rounded-3xl border border-blue-500/30">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-400" />
                  <span>সিস্টেম নোটিশ ও সিকিউরিটি কনফিগারেশন</span>
                </h3>
                <p className="text-xs text-slate-400">
                  লাইভ স্ক্রোলিং নোটিশ, মেইনটেন্যান্স মোড এবং গ্লোবাল প্যারামিটার
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-[#060e22] border border-blue-500/30 space-y-3">
                <label className="text-xs font-bold text-slate-300 block">
                  লাইভ মার্কি স্ক্রোলিং নোটিশ (Live Announcement Banner):
                </label>
                <textarea
                  rows={3}
                  value={config.noticeText}
                  onChange={(e) => handleSaveConfig({ noticeText: e.target.value })}
                  className="w-full bg-[#040918] border border-blue-500/40 rounded-2xl p-3 text-xs text-amber-300 font-medium focus:outline-none"
                />
              </div>

              {/* First Deposit Bonus Popup & Promotion Configuration */}
              <div className="p-5 rounded-3xl bg-[#060e22] border border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="text-sm font-black text-white">ফার্স্ট ডিপোজিট বোনাস পপ-আপ সেটিংস</h4>
                      <p className="text-xs text-slate-400">নতুন অ্যাকাউন্ট রেজিস্টার করার পর স্বয়ংক্রিয় বোনাস অফার পপ-আপ প্রদর্শন</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const curr = config.firstDepositBonus || { enabled: true, bonusPercentage: 100, minDeposit: 300, maxBonus: 5000, title: 'ফার্স্ট ডিপোজিট ১০০% ওয়েলকাম বোনাস!' };
                      handleSaveConfig({
                        firstDepositBonus: {
                          ...curr,
                          enabled: !curr.enabled,
                        },
                      });
                    }}
                    className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                      config.firstDepositBonus?.enabled !== false
                        ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {config.firstDepositBonus?.enabled !== false ? 'পপ-আপ সক্রিয় (Active)' : 'পপ-আপ বন্ধ'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-[#040918] border border-blue-900/60 space-y-1">
                    <span className="text-[11px] text-slate-400 font-bold block">বোনাস পার্সেন্টেজ (%):</span>
                    <input
                      type="number"
                      value={config.firstDepositBonus?.bonusPercentage ?? 100}
                      onChange={(e) => {
                        const curr = config.firstDepositBonus || { enabled: true, bonusPercentage: 100, minDeposit: 300, maxBonus: 5000, title: 'ফার্স্ট ডিপোজিট ১০০% ওয়েলকাম বোনাস!' };
                        handleSaveConfig({
                          firstDepositBonus: {
                            ...curr,
                            bonusPercentage: Number(e.target.value) || 0,
                          },
                        });
                      }}
                      className="w-full bg-[#060e22] border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-[#040918] border border-blue-900/60 space-y-1">
                    <span className="text-[11px] text-slate-400 font-bold block">সর্বনিম্ন ডিপোজিট (৳):</span>
                    <input
                      type="number"
                      value={config.firstDepositBonus?.minDeposit ?? 300}
                      onChange={(e) => {
                        const curr = config.firstDepositBonus || { enabled: true, bonusPercentage: 100, minDeposit: 300, maxBonus: 5000, title: 'ফার্স্ট ডিপোজিট ১০০% ওয়েলকাম বোনাস!' };
                        handleSaveConfig({
                          firstDepositBonus: {
                            ...curr,
                            minDeposit: Number(e.target.value) || 0,
                          },
                        });
                      }}
                      className="w-full bg-[#060e22] border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-[#040918] border border-blue-900/60 space-y-1">
                    <span className="text-[11px] text-slate-400 font-bold block">সর্বোচ্চ বোনাস লিমিট (৳):</span>
                    <input
                      type="number"
                      value={config.firstDepositBonus?.maxBonus ?? 5000}
                      onChange={(e) => {
                        const curr = config.firstDepositBonus || { enabled: true, bonusPercentage: 100, minDeposit: 300, maxBonus: 5000, title: 'ফার্স্ট ডিপোজিট ১০০% ওয়েলকাম বোনাস!' };
                        handleSaveConfig({
                          firstDepositBonus: {
                            ...curr,
                            maxBonus: Number(e.target.value) || 0,
                          },
                        });
                      }}
                      className="w-full bg-[#060e22] border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold block">পপ-আপ ব্যানার টাইটেল:</label>
                  <input
                    type="text"
                    value={config.firstDepositBonus?.title || 'ফার্স্ট ডিপোজিট ১০০% ওয়েলকাম বোনাস!'}
                    onChange={(e) => {
                      const curr = config.firstDepositBonus || { enabled: true, bonusPercentage: 100, minDeposit: 300, maxBonus: 5000, title: 'ফার্স্ট ডিপোজিট ১০০% ওয়েলকাম বোনাস!' };
                      handleSaveConfig({
                        firstDepositBonus: {
                          ...curr,
                          title: e.target.value,
                        },
                      });
                    }}
                    className="w-full bg-[#040918] border border-blue-500/40 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[#060e22] border border-blue-500/30 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">মেইনটেন্যান্স মোড (Maintenance Lock)</h4>
                  <p className="text-xs text-slate-400">সক্রিয় করলে সাধারণ মেম্বাররা কোনো গেম খেলতে পারবে না</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveConfig({ maintenanceMode: !config.maintenanceMode })}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    config.maintenanceMode
                      ? 'bg-rose-500 text-white'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {config.maintenanceMode ? 'মেইনটেন্যান্স সক্রিয়' : 'স্বাভাবিক চালু'}
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ================= ADMIN USER BAN MODAL WITH REASON REMINDER ================= */}
      {banModalMember && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[#060e22] border-2 border-rose-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-900/60 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                <h3 className="text-base font-black text-white">ইউজার ব্যান ও সিকিউরিটি রিমাইন্ডার</h3>
              </div>
              <button
                type="button"
                onClick={() => setBanModalMember(null)}
                className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* User Target Specs */}
            <div className="p-3 rounded-2xl bg-[#040918] border border-blue-900/60 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">ইউজার UID:</span>
                <span className="font-mono font-black text-amber-300">{banModalMember.uid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">নাম ও ফোন:</span>
                <span className="text-white font-bold">{banModalMember.username} ({banModalMember.phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ডিভাইস ও IP:</span>
                <span className="text-sky-300 font-mono">{banModalMember.deviceModel || 'Unknown'} • {banModalMember.deviceIp || '103.145.12.88'}</span>
              </div>
            </div>

            {/* Quick Reason Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                ব্যান করার নির্দিষ্ট কারণ নির্বাচন করুন:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'একাধিক ফেক অ্যাকাউন্ট তৈরি ও আইপি মিল',
                  'রেফারেল বোনাস ফ্রড ও অস্বচ্ছ ট্রানজেকশন',
                  'বট বা অটোমেশন সফটওয়্যার ব্যবহার',
                  'ভুয়া ট্রানজেকশন আইডি (TrxID) প্রদান',
                  'পাসওয়ার্ড ভুল ও প্ল্যাটফর্ম সিকিউরিটি লঙ্ঘন',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setBanReasonText(reason)}
                    className={`p-2 rounded-xl text-left text-[11px] font-medium transition-all cursor-pointer border ${
                      banReasonText === reason
                        ? 'bg-rose-500/20 text-rose-300 border-rose-400'
                        : 'bg-[#040918] text-slate-400 border-blue-950 hover:border-slate-600'
                    }`}
                  >
                    • {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reason Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                কাস্টম রিমাইন্ডার মেসেজ (ইউজার লগইন করলে এই কারণ দেখতে পাবে):
              </label>
              <textarea
                rows={2}
                value={banReasonText}
                onChange={(e) => setBanReasonText(e.target.value)}
                placeholder="ব্যানের কারণ লিখুন..."
                className="w-full bg-[#040918] border border-rose-500/40 rounded-xl p-3 text-xs text-rose-200 font-medium focus:outline-none focus:border-rose-400"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-900/60">
              <button
                type="button"
                onClick={() => setBanModalMember(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                বাতিল
              </button>

              <button
                type="button"
                onClick={() => {
                  updateLocalMember(banModalMember.uid, {
                    status: 'banned',
                    banReason: banReasonText.trim() || 'নিরাপত্তা বিধি লঙ্ঘনের কারণে অ্যাকাউন্ট সাময়িকভাবে স্থগিত',
                  });
                  setMembers(getLocalMembers());
                  setBanModalMember(null);
                  showToast(`UID [${banModalMember.uid}] সফলভাবে ব্যান করা হয়েছে এবং কারণ সংরক্ষণ হয়েছে!`);
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black shadow-lg cursor-pointer"
              >
                ব্যান ও রিমাইন্ডার সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MEMBER ACTIVITY LOG AUDIT MODAL ================= */}
      {activityModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-[#091533] border-2 border-sky-500/50 p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>মেম্বার অ্যাক্টিভিটি ও অডিট হিস্ট্রি লগ</span>
                    <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40">
                      {activityModalMember.uid}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    ইউজারনেম: {activityModalMember.username} | ফোন: {activityModalMember.phone}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActivityModalMember(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-[#050b1d] border border-blue-900/50">
                <span className="text-[10px] text-slate-400 block">বর্তমান ব্যালেন্স</span>
                <span className="text-sm font-black font-mono text-emerald-400">
                  ৳{(activityModalMember.balance || 0).toLocaleString('en-US')}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#050b1d] border border-blue-900/50">
                <span className="text-[10px] text-slate-400 block">মোট ডিপোজিট</span>
                <span className="text-sm font-black font-mono text-amber-400">
                  ৳{(activityModalMember.totalDeposit || 0).toLocaleString('en-US')}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#050b1d] border border-blue-900/50">
                <span className="text-[10px] text-slate-400 block">আইপি অ্যাড্রেস</span>
                <span className="text-xs font-bold font-mono text-sky-300">
                  {activityModalMember.deviceIp || '103.145.12.88'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#050b1d] border border-blue-900/50">
                <span className="text-[10px] text-slate-400 block">ডিভাইস ও ওএস</span>
                <span className="text-xs font-bold text-slate-200 truncate block" title={activityModalMember.deviceModel}>
                  {activityModalMember.deviceModel || 'Android'} ({activityModalMember.os || 'Android'})
                </span>
              </div>
            </div>

            {/* Bets Audit for this specific user */}
            <div className="flex-1 overflow-y-auto space-y-2 border border-blue-900/40 rounded-2xl p-3 bg-[#060e22]">
              <div className="text-xs font-bold text-slate-300 pb-1 border-b border-blue-950 flex items-center justify-between">
                <span>সাম্প্রতিক বেটিং ও সেশন রেকর্ড</span>
                <span className="text-[11px] font-mono text-slate-400">
                  শেষ সক্রিয়: {activityModalMember.lastActive || 'Just now'}
                </span>
              </div>

              {(() => {
                const userBets = liveBets.filter(
                  (b) => b.userUid === activityModalMember.uid || b.userPhone === activityModalMember.phone
                );

                if (userBets.length === 0) {
                  return (
                    <div className="p-6 text-center text-slate-500 space-y-1">
                      <p className="text-xs font-medium">এই ইউজারের কোনো চলতি লাইভ বেট রেকর্ড নেই।</p>
                      <p className="text-[11px] text-slate-600">
                        রেজিস্ট্রেশন তারিখ: {activityModalMember.registeredAt || '2025-01-01'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-blue-950/60">
                    {userBets.map((b) => (
                      <div key={b.id} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-sky-300">WinGo {b.duration}s</span>{' '}
                          <span className="font-mono text-slate-400">#{b.period}</span>
                          <span className="text-[11px] text-slate-500 block font-mono">
                            {new Date(b.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase font-mono bg-blue-600/30 text-sky-300 border border-blue-500/40 inline-block mb-0.5">
                            {typeof b.selection === 'number' ? `নম্বর ${b.selection}` : String(b.selection)}
                          </span>
                          <span className="text-xs font-mono font-black text-amber-300 block">
                            ৳{b.amount.toLocaleString('en-US')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end pt-2 border-t border-blue-900/60">
              <button
                type="button"
                onClick={() => setActivityModalMember(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
