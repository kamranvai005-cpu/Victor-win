import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';

// User-provided Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBQiJXz2yBCwAXgaSQCeq8WJjSTZIrb_fw",
  authDomain: "millionaire-bd.firebaseapp.com",
  databaseURL: "https://millionaire-bd-default-rtdb.firebaseio.com",
  projectId: "millionaire-bd",
  storageBucket: "millionaire-bd.firebasestorage.app",
  messagingSenderId: "662419906885",
  appId: "1:662419906885:web:2d347e5fb099a111d35e2c",
  measurementId: "G-3R2305V2TS"
};

// Initialize or reuse Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Types for Admin and Real-time Control
export interface GatewayConfig {
  id: string;
  name: string;
  bnName: string;
  number: string;
  accountType: string;
  transferType?: 'send_money' | 'cash_out'; // সেন্ড মানি অথবা ক্যাশ আউট
  bonusPercent: number;
  minDeposit?: number;
  isActive: boolean;
}

export interface DepositRequest {
  id: string;
  uid: string;
  username: string;
  userName?: string;
  phone?: string;
  userPhone?: string;
  gateway?: string;
  method: string;
  senderNumber?: string;
  amount: number;
  bonus: number;
  trxId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  formattedTime: string;
  approvedAt?: number;
}

export interface GiftCodeItem {
  code: string;
  rewardAmount: number;
  maxClaims: number;
  claimedCount: number;
  isActive: boolean;
  createdAt: string;
  targetType?: 'all' | 'specific_uid' | 'female_only' | 'vip_only';
  targetUid?: string;
  targetCategory?: string;
  claimedUids?: string[];
  remarks?: string;
}

export interface RegisteredMember {
  uid: string;
  username: string;
  phone: string;
  avatar?: string;
  password?: string;
  email?: string;
  countryCode: string;
  balance: number;
  vipLevel: number;
  invitationCode: string;
  gender?: 'all' | 'female' | 'male';
  registeredAt: string;
  status: 'active' | 'banned' | 'bind_locked';
  bindReason?: string;
  banReason?: string;
  deviceIp?: string;
  deviceModel?: string;
  browser?: string;
  os?: string;
  network?: string;
  lastActive?: string;
  lastLoginAt?: string;
  totalDeposit?: number;
  totalWon?: number;
  totalBet?: number;
  paymentMode?: 'send_money' | 'cash_out'; // এডমিন প্যানেল থেকে সেট করা সেন্ড মানি নাকি ক্যাশ আউট
  withdrawalWallet?: {
    method: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank';
    accountNumber: string;
    accountName: string;
    isBound: boolean;
    boundAt?: string;
  };
}

export interface CommissionSettings {
  tier1: number;
  tier2: number;
  tier3: number;
  tier4: number;
  tier5: number;
  tier6: number;
}

export interface MarketControlSettings {
  winGoNextOverride?: {
    period: string;
    number: number;
  } | null;
  houseEdgeMode: 'auto' | 'auto_rng' | 'force_house_win' | 'force_player_win' | 'custom_number';
  targetCustomNumber: number;
  aiSignalEnabled?: boolean;
  aiSignalAccuracy?: number;
  aviatorCrashMode?: 'auto' | 'high_multiplier' | 'low_crash' | 'exact_override';
  aviatorNextCrashOverride?: number | null;
  aviatorWinRatePercent?: number;
  trxNextOverride?: number | null;
  k3NextOverride?: [number, number, number] | null;
  fiveDNextOverride?: [number, number, number, number, number] | null;
}

export interface FirstDepositBonusConfig {
  enabled: boolean;
  bonusPercent: number; // e.g. 100%
  maxBonusAmount: number; // e.g. 20000
  minDepositAmount: number; // e.g. 200
  title: string;
  description: string;
  bannerImage?: string;
}

export interface SystemConfig {
  gameStatuses: Record<string, 'active' | 'coming_soon' | 'maintenance'>;
  gateways: Record<string, GatewayConfig>;
  commissions: CommissionSettings;
  marketControl: MarketControlSettings;
  giftCodes: GiftCodeItem[];
  noticeText?: string;
  maintenanceMode?: boolean;
  firstDepositBonus?: FirstDepositBonusConfig;
}

// Initial Default Values
export const DEFAULT_GATEWAYS: Record<string, GatewayConfig> = {
  bkash: {
    id: 'bkash',
    name: 'bKash (বিকাশ)',
    bnName: 'বিকাশ ক্যাশ আউট / সেন্ড মানি',
    number: '01799824105',
    accountType: 'Personal / Agent Number',
    transferType: 'send_money',
    bonusPercent: 5,
    isActive: true,
  },
  nagad: {
    id: 'nagad',
    name: 'Nagad (নগদ)',
    bnName: 'নগদ ক্যাশ আউট / সেন্ড মানি',
    number: '01844912803',
    accountType: 'Personal / Merchant Number',
    transferType: 'cash_out',
    bonusPercent: 5,
    isActive: true,
  },
  rocket: {
    id: 'rocket',
    name: 'Rocket (রকেট)',
    bnName: 'রকেট পার্সোনাল / এজেন্ট',
    number: '01912849201',
    accountType: 'Personal 12 Digits',
    transferType: 'send_money',
    bonusPercent: 5,
    isActive: true,
  },
  upay: {
    id: 'upay',
    name: 'Upay (উপায়)',
    bnName: 'উপায় পেমেন্ট গেটওয়ে',
    number: '01711223344',
    accountType: 'Upay Wallet Direct',
    transferType: 'send_money',
    bonusPercent: 5,
    isActive: true,
  },
  usdt: {
    id: 'usdt',
    name: 'USDT (TRC20)',
    bnName: 'ক্রিপ্টোকারেন্সি অটোমেটেড গেটওয়ে',
    number: 'TFx99aK8Lp2NqWvJ194xMv88aX99Victor',
    accountType: 'TRC20 Wallet Address',
    transferType: 'send_money',
    bonusPercent: 8,
    isActive: true,
  },
};

export const DEFAULT_COMMISSIONS: CommissionSettings = {
  tier1: 0.80,
  tier2: 0.50,
  tier3: 0.30,
  tier4: 0.15,
  tier5: 0.10,
  tier6: 0.05,
};

export const DEFAULT_GAME_STATUSES: Record<string, 'active' | 'coming_soon' | 'maintenance'> = {
  wingo: 'active',
  k3: 'coming_soon',
  '5d': 'coming_soon',
  'trx-wingo': 'coming_soon',
  motorace: 'coming_soon',
  videowingo: 'coming_soon',
  aviator: 'active',
  mines: 'active',
  plinko: 'active',
  fishing: 'active',
  slots: 'active',
  'live-casino': 'active',
  sports: 'active',
  'card-game': 'active',
};

export const DEFAULT_FIRST_DEPOSIT_BONUS: FirstDepositBonusConfig = {
  enabled: true,
  bonusPercent: 100, // 100% match
  maxBonusAmount: 20000,
  minDepositAmount: 200,
  title: '🎉 প্রথম ডিপোজিটে ১০০% ওয়েলকাম ক্যাশ বোনাস!',
  description: 'প্রথমবার বিকাশ, নগদ, রকেট অথবা USDT দিয়ে রিচার্জ করলেই পেয়ে যাবেন দ্বিগুণ ব্যালেন্স এবং ইনস্ট্যান্ট ক্যাশব্যাক।',
  bannerImage: 'https://ossimg.crhhh.com/bdtgame/banner/Banner_202306171819486mih.jpg',
};

// Global in-memory and localStorage synced cache
const LOCAL_STORAGE_KEY = 'victorwin_system_config_v2';

export function getLocalConfig(): SystemConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        firstDepositBonus: parsed.firstDepositBonus || DEFAULT_FIRST_DEPOSIT_BONUS,
      };
    }
  } catch (e) {
    console.error('Failed to load local config', e);
  }
  return {
    gameStatuses: DEFAULT_GAME_STATUSES,
    gateways: DEFAULT_GATEWAYS,
    commissions: DEFAULT_COMMISSIONS,
    marketControl: {
      houseEdgeMode: 'auto',
      targetCustomNumber: 7,
      winGoNextOverride: null,
      trxNextOverride: null,
      k3NextOverride: null,
      fiveDNextOverride: null,
    },
    giftCodes: [], // Currently NO active gift codes as requested
    firstDepositBonus: DEFAULT_FIRST_DEPOSIT_BONUS,
  };
}

export function saveLocalConfig(config: SystemConfig) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save local config', e);
  }
}

// Synchronize with Firebase Firestore
export function subscribeSystemConfig(onUpdate: (config: SystemConfig) => void) {
  const local = getLocalConfig();
  onUpdate(local);

  try {
    const configDocRef = doc(db, 'system', 'app_config');
    const unsubscribe = onSnapshot(
      configDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data() as SystemConfig;
          const merged: SystemConfig = {
            gameStatuses: { ...DEFAULT_GAME_STATUSES, ...(remoteData.gameStatuses || {}) },
            gateways: { ...DEFAULT_GATEWAYS, ...(remoteData.gateways || {}) },
            commissions: { ...DEFAULT_COMMISSIONS, ...(remoteData.commissions || {}) },
            marketControl: {
              houseEdgeMode: 'auto',
              targetCustomNumber: 7,
              ...(remoteData.marketControl || {}),
            },
            giftCodes: remoteData.giftCodes || [],
            firstDepositBonus: remoteData.firstDepositBonus || DEFAULT_FIRST_DEPOSIT_BONUS,
          };
          saveLocalConfig(merged);
          onUpdate(merged);
        } else {
          // Initialize remote doc if missing
          setDoc(configDocRef, local, { merge: true }).catch((err) =>
            console.log('Firebase bootstrap info:', err)
          );
        }
      },
      (error) => {
        console.warn('Firestore snapshot listener falling back to local sync:', error.message);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.warn('Firebase connection notice:', e);
    return () => {};
  }
}

// Update remote Firestore config
export async function updateSystemConfig(newConfig: Partial<SystemConfig>): Promise<void> {
  const current = getLocalConfig();
  const merged: SystemConfig = {
    ...current,
    ...newConfig,
    gameStatuses: { ...current.gameStatuses, ...(newConfig.gameStatuses || {}) },
    gateways: { ...current.gateways, ...(newConfig.gateways || {}) },
    commissions: { ...current.commissions, ...(newConfig.commissions || {}) },
    marketControl: { ...current.marketControl, ...(newConfig.marketControl || {}) },
    giftCodes: newConfig.giftCodes !== undefined ? newConfig.giftCodes : current.giftCodes,
    firstDepositBonus: newConfig.firstDepositBonus !== undefined ? { ...current.firstDepositBonus, ...newConfig.firstDepositBonus } : current.firstDepositBonus,
  };

  saveLocalConfig(merged);

  try {
    const configDocRef = doc(db, 'system', 'app_config');
    await setDoc(configDocRef, merged, { merge: true });
  } catch (e) {
    console.warn('Saved locally, Firestore sync deferred:', e);
  }
}

// Deposit requests management
const DEPOSIT_REQUESTS_KEY = 'victorwin_deposit_queue_v2';

export function getLocalDepositRequests(): DepositRequest[] {
  try {
    const raw = localStorage.getItem(DEPOSIT_REQUESTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveDepositRequest(req: DepositRequest) {
  const list = getLocalDepositRequests();
  const updated = [req, ...list.filter((r) => r.id !== req.id)].slice(0, 100);
  localStorage.setItem(DEPOSIT_REQUESTS_KEY, JSON.stringify(updated));

  // Try pushing to Firebase collection
  try {
    const depDocRef = doc(db, 'deposit_requests', req.id);
    setDoc(depDocRef, req, { merge: true }).catch(() => {});
  } catch (e) {}
}

export function updateDepositRequestStatus(reqId: string, status: 'approved' | 'rejected') {
  const list = getLocalDepositRequests();
  const targetReq = list.find((r) => r.id === reqId);
  const updated = list.map((r) => (r.id === reqId ? { ...r, status, approvedAt: status === 'approved' ? Date.now() : undefined } : r));
  localStorage.setItem(DEPOSIT_REQUESTS_KEY, JSON.stringify(updated));

  try {
    const depDocRef = doc(db, 'deposit_requests', reqId);
    updateDoc(depDocRef, { status, approvedAt: status === 'approved' ? Date.now() : undefined }).catch(() => {});
  } catch (e) {}

  // If approved and was not already approved, credit the member's wallet balance!
  if (status === 'approved' && targetReq && targetReq.status !== 'approved') {
    const members = getLocalMembers();
    const targetMember = members.find((m) =>
      m.uid === targetReq.uid ||
      (targetReq.phone && m.phone === targetReq.phone) ||
      (targetReq.userPhone && m.phone === targetReq.userPhone) ||
      (targetReq.username && m.username === targetReq.username)
    );

    const creditAmount = (targetReq.amount || 0) + (targetReq.bonus || 0);
    if (targetMember) {
      const newBal = (targetMember.balance || 0) + creditAmount;
      const newTotalDep = (targetMember.totalDeposit || 0) + (targetReq.amount || 0);
      updateLocalMember(targetMember.uid, {
        balance: newBal,
        totalDeposit: newTotalDep,
      });

      // Dispatch global window event so active browser window updates user balance in real-time
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('victorwin_user_balance_updated', {
            detail: { uid: targetMember.uid, phone: targetMember.phone, newBalance: newBal },
          })
        );
      }
    }
  }
}

// User / Member Registry Management for Admin
const MEMBERS_STORAGE_KEY = 'victorwin_registered_members_v2';

export const DEFAULT_MEMBERS: RegisteredMember[] = [
  {
    uid: 'VW889241',
    username: 'Player_8892',
    phone: '01712345678',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    password: 'password123',
    countryCode: '+880',
    balance: 5000.0,
    vipLevel: 3,
    invitationCode: 'VICTOR888',
    gender: 'all',
    registeredAt: '2026-08-28',
    status: 'active',
    deviceIp: '103.145.12.88',
    deviceModel: 'Samsung Galaxy S24 Ultra',
    browser: 'Chrome Mobile 128',
    os: 'Android 14',
    network: 'Grameenphone 4G',
    lastActive: 'Just now',
    lastLoginAt: '2026-09-02 12:45',
    totalDeposit: 15000,
    totalWon: 18500,
    totalBet: 22000,
  },
  {
    uid: 'VW774102',
    username: 'Riya_Akter',
    phone: '01899112233',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    password: 'password123',
    countryCode: '+880',
    balance: 2400.0,
    vipLevel: 2,
    invitationCode: 'HGNICE888',
    gender: 'female',
    registeredAt: '2026-08-30',
    status: 'active',
    deviceIp: '202.79.18.24',
    deviceModel: 'iPhone 15 Pro Max',
    browser: 'Safari Mobile 17.5',
    os: 'iOS 17.5',
    network: 'WiFi - Dhaka Fiber',
    lastActive: '5 mins ago',
    lastLoginAt: '2026-09-02 11:20',
    totalDeposit: 8000,
    totalWon: 9200,
    totalBet: 11500,
  },
  {
    uid: 'VW990145',
    username: 'Sadia_VIP',
    phone: '01988776655',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    password: 'password123',
    countryCode: '+880',
    balance: 12500.0,
    vipLevel: 5,
    invitationCode: 'VIPWIN',
    gender: 'female',
    registeredAt: '2026-08-25',
    status: 'active',
    deviceIp: '103.145.12.88', // Duplicate IP with Player_8892
    deviceModel: 'Samsung Galaxy S24 Ultra', // Duplicate Model
    browser: 'Chrome Mobile 128',
    os: 'Android 14',
    network: 'Grameenphone 4G',
    lastActive: '1 hour ago',
    lastLoginAt: '2026-09-02 09:15',
    totalDeposit: 50000,
    totalWon: 62000,
    totalBet: 75000,
  },
  {
    uid: 'VW665319',
    username: 'Kamran_Pro',
    phone: '01700000000',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    password: 'admin',
    countryCode: '+880',
    balance: 99999.0,
    vipLevel: 8,
    invitationCode: 'KAMRAN777',
    gender: 'male',
    registeredAt: '2026-08-20',
    status: 'active',
    deviceIp: '103.232.100.5',
    deviceModel: 'Xiaomi Redmi Note 13 Pro',
    browser: 'Chrome Mobile 128',
    os: 'Android 14',
    network: 'Banglalink 4G',
    lastActive: 'Online',
    lastLoginAt: '2026-09-02 13:00',
    totalDeposit: 250000,
    totalWon: 310000,
    totalBet: 400000,
  },
  {
    uid: 'VW332187',
    username: 'Tania_Sultana',
    phone: '01655443322',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    countryCode: '+880',
    balance: 850.0,
    vipLevel: 1,
    invitationCode: 'GIFT2026',
    gender: 'female',
    registeredAt: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    })(), // Registered Yesterday
    status: 'active',
    deviceIp: '27.147.201.33',
    deviceModel: 'Vivo V30 5G',
    browser: 'Chrome Mobile 128',
    os: 'Android 14',
    network: 'Robi 4G LTE',
    lastActive: '2 mins ago',
    lastLoginAt: 'Yesterday 18:50',
    totalDeposit: 2000,
    totalWon: 1800,
    totalBet: 2500,
  },
  {
    uid: 'VW558190',
    username: 'Habibur_Rahman',
    phone: '01722883344',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    countryCode: '+880',
    balance: 1420.0,
    vipLevel: 2,
    invitationCode: 'VICTOR888',
    gender: 'male',
    registeredAt: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    })(), // Registered Yesterday
    status: 'active',
    deviceIp: '103.119.24.12',
    deviceModel: 'OnePlus 12R',
    browser: 'Chrome Mobile 128',
    os: 'Android 14',
    network: 'Banglalink 4G',
    lastActive: '3 hours ago',
    lastLoginAt: 'Yesterday 21:15',
    totalDeposit: 1500,
    totalWon: 1900,
    totalBet: 3200,
  },
  {
    uid: 'VW441209',
    username: 'Rifat_Bot_Test',
    phone: '01799887711',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    countryCode: '+880',
    balance: 0.0,
    vipLevel: 1,
    invitationCode: 'VICTOR888',
    gender: 'male',
    registeredAt: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    })(), // Registered Yesterday
    status: 'banned',
    banReason: 'একাধিক ফেইক অ্যাকাউন্ট খুলে রেফারেল বোনাস অপব্যবহার',
    deviceIp: '103.145.12.88', // Duplicate IP with Player_8892 and Sadia_VIP
    deviceModel: 'Xiaomi Redmi Note 13 Pro',
    browser: 'Chrome Mobile 128',
    os: 'Android 14',
    network: 'Grameenphone 4G',
    lastActive: 'Yesterday',
    lastLoginAt: 'Yesterday 18:20',
    totalDeposit: 500,
    totalWon: 100,
    totalBet: 600,
  },
];

export function getLocalMembers(): RegisteredMember[] {
  try {
    const raw = localStorage.getItem(MEMBERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_MEMBERS;
}

export function saveLocalMember(member: RegisteredMember) {
  const current = getLocalMembers();
  const existingIndex = current.findIndex((m) => m.uid === member.uid || m.phone === member.phone);
  let updated: RegisteredMember[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = { ...updated[existingIndex], ...member };
  } else {
    updated = [member, ...current];
  }
  try {
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(updated));
    const userDocRef = doc(db, 'users', member.uid);
    setDoc(userDocRef, member, { merge: true }).catch(() => {});
  } catch (e) {}
}

export function updateLocalMember(uid: string, fields: Partial<RegisteredMember>) {
  const current = getLocalMembers();
  const updated = current.map((m) => (m.uid === uid ? { ...m, ...fields } : m));
  try {
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(updated));
    const userDocRef = doc(db, 'users', uid);
    setDoc(userDocRef, fields, { merge: true }).catch(() => {});
  } catch (e) {}
}

export function deleteLocalMember(uid: string) {
  const current = getLocalMembers();
  const updated = current.filter((m) => m.uid !== uid);
  try {
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}
}
