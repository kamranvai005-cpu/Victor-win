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
  getDocs,
} from 'firebase/firestore';

// User-provided Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAODjtgCTgZW6mAX1Qa8za7hfswC2pNu4s",
  authDomain: "victor-win.firebaseapp.com",
  projectId: "victor-win",
  storageBucket: "victor-win.firebasestorage.app",
  messagingSenderId: "214768486114",
  appId: "1:214768486114:web:e2c2994eab8efda8ba80bb",
  measurementId: "G-CXH7BYHFKX"
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

export interface WithdrawalRequest {
  id: string;
  uid: string;
  username: string;
  phone?: string;
  method: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank' | 'usdt';
  accountNumber: string;
  accountName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  formattedTime: string;
  approvedAt?: number;
  rejectReason?: string;
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
  vipExp?: number;
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
  referredBy?: string; // Invitation code or UID of referring member
  referralCount?: number; // Total number of registrations using their code
  referralDepositsCount?: number; // Total number of their referrals who made deposits
  paymentMode?: 'send_money' | 'cash_out'; // এডমিন প্যানেল থেকে সেট করা সেন্ড মানি নাকি ক্যাশ আউট
  withdrawalWallet?: {
    method: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank';
    accountNumber: string;
    accountName: string;
    isBound: boolean;
    boundAt?: string;
  };
  withdrawalWallets?: UserBoundWallet[];
}

export interface UserBoundWallet {
  id: string;
  method: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank';
  accountNumber: string;
  accountName: string;
  isBound: boolean;
  boundAt: string;
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
    duration?: number;
  } | null;
  winGoDurationOverrides?: Record<number, { period: string; number: number }>;
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

export interface VipTierConfig {
  level: number;
  name: string;
  requiredDeposit: number;
  requiredBetCount: number; // 100 BDT = 1 bet
  upgradeBonus: number;
  monthlySalary: number;
  maxWithdrawDaily?: number;
}

export const DEFAULT_VIP_SETTINGS: VipTierConfig[] = [
  { level: 1, name: 'VIP 1 ব্রোঞ্জ মেম্বার', requiredDeposit: 100, requiredBetCount: 1000, upgradeBonus: 60, monthlySalary: 500, maxWithdrawDaily: 25000 },
  { level: 2, name: 'VIP 2 সিলভার মেম্বার', requiredDeposit: 500, requiredBetCount: 3000, upgradeBonus: 180, monthlySalary: 1200, maxWithdrawDaily: 50000 },
  { level: 3, name: 'VIP 3 গোল্ড মেম্বার', requiredDeposit: 2000, requiredBetCount: 8000, upgradeBonus: 680, monthlySalary: 3000, maxWithdrawDaily: 100000 },
  { level: 4, name: 'VIP 4 প্লাটিনাম মেম্বার', requiredDeposit: 5000, requiredBetCount: 20000, upgradeBonus: 1880, monthlySalary: 8000, maxWithdrawDaily: 250000 },
  { level: 5, name: 'VIP 5 ডায়মন্ড মেম্বার', requiredDeposit: 15000, requiredBetCount: 50000, upgradeBonus: 5880, monthlySalary: 20000, maxWithdrawDaily: 500000 },
  { level: 6, name: 'VIP 6 মাস্টার মেম্বার', requiredDeposit: 50000, requiredBetCount: 150000, upgradeBonus: 18880, monthlySalary: 50000, maxWithdrawDaily: 1000000 },
  { level: 7, name: 'VIP 7 ক্রাউন মেম্বার', requiredDeposit: 150000, requiredBetCount: 500000, upgradeBonus: 58880, monthlySalary: 120000, maxWithdrawDaily: 2500000 },
  { level: 8, name: 'VIP 8 লিজেন্ড মেম্বার', requiredDeposit: 500000, requiredBetCount: 1500000, upgradeBonus: 188880, monthlySalary: 300000, maxWithdrawDaily: 5000000 },
];

export interface SystemConfig {
  gameStatuses: Record<string, 'active' | 'coming_soon' | 'maintenance'>;
  gateways: Record<string, GatewayConfig>;
  commissions: CommissionSettings;
  marketControl: MarketControlSettings;
  giftCodes: GiftCodeItem[];
  noticeText?: string;
  maintenanceMode?: boolean;
  firstDepositBonus?: FirstDepositBonusConfig;
  appDownloadUrl?: string;
  vipSettings?: VipTierConfig[];
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
        vipSettings: parsed.vipSettings || DEFAULT_VIP_SETTINGS,
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
    appDownloadUrl: 'https://millionaire-bd.web.app/download/app-v2.apk',
    vipSettings: DEFAULT_VIP_SETTINGS,
  };
}

export function saveLocalConfig(config: SystemConfig) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save local config', e);
  }
}

// Synchronize with Central Server & Firebase Firestore
export function subscribeSystemConfig(onUpdate: (config: SystemConfig) => void) {
  const local = getLocalConfig();
  onUpdate(local);

  // Immediate fetch from central server
  fetch('/api/config')
    .then((r) => (r.ok ? r.json() : null))
    .then((remote) => {
      if (remote) {
        saveLocalConfig(remote);
        onUpdate(remote);
      }
    })
    .catch(() => {});

  // 1-second real-time polling to ensure instant updates across all phones
  const serverInterval = setInterval(() => {
    fetch('/api/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((remote) => {
        if (remote) {
          saveLocalConfig(remote);
          onUpdate(remote);
        }
      })
      .catch(() => {});
  }, 1000);

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
        }
      },
      () => {}
    );

    return () => {
      clearInterval(serverInterval);
      unsubscribe();
    };
  } catch (e) {
    return () => clearInterval(serverInterval);
  }
}

// Update remote config across all phones instantly
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

  // Sync with central server immediately
  try {
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    });
  } catch (e) {
    console.warn('Central server config sync:', e);
  }

  // Backup to Firebase
  try {
    const configDocRef = doc(db, 'system', 'app_config');
    await setDoc(configDocRef, merged, { merge: true });
  } catch (e) {}
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

// Fetch remote deposits from central backend
export async function fetchRemoteDepositRequests(): Promise<DepositRequest[]> {
  try {
    const res = await fetch('/api/deposits');
    if (res.ok) {
      const serverDeposits: DepositRequest[] = await res.json();
      if (Array.isArray(serverDeposits)) {
        localStorage.setItem(DEPOSIT_REQUESTS_KEY, JSON.stringify(serverDeposits));
        return serverDeposits;
      }
    }
  } catch (e) {}
  return getLocalDepositRequests();
}

// Save deposit request (sent from any user's phone to central server immediately)
export async function saveDepositRequest(req: DepositRequest): Promise<void> {
  const list = getLocalDepositRequests();
  const updated = [req, ...list.filter((r) => r.id !== req.id)].slice(0, 500);
  localStorage.setItem(DEPOSIT_REQUESTS_KEY, JSON.stringify(updated));

  // Dispatch local notification
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('victorwin_deposit_submitted', { detail: req }));
  }

  // POST to Central Server API (so Admin Panel on ANY device gets it instantly)
  try {
    await fetch('/api/deposits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch (e) {
    console.warn('Central server deposit dispatch notice:', e);
  }

  // Dual Backup: Push to Firebase collection
  try {
    const depDocRef = doc(db, 'deposit_requests', req.id);
    setDoc(depDocRef, req, { merge: true }).catch(() => {});
  } catch (e) {}
}

// Update deposit status (Approve or Reject from Admin Panel)
export async function updateDepositRequestStatus(reqId: string, status: 'approved' | 'rejected') {
  const list = getLocalDepositRequests();
  const targetReq = list.find((r) => r.id === reqId);
  const updated = list.map((r) => (r.id === reqId ? { ...r, status, approvedAt: status === 'approved' ? Date.now() : undefined } : r));
  localStorage.setItem(DEPOSIT_REQUESTS_KEY, JSON.stringify(updated));

  // Call Central Server API immediately
  try {
    await fetch(`/api/deposits/${reqId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch (e) {
    console.warn('Server deposit status update notice:', e);
  }

  // Dual Backup: Firebase update
  try {
    const depDocRef = doc(db, 'deposit_requests', reqId);
    updateDoc(depDocRef, { status, approvedAt: status === 'approved' ? Date.now() : undefined }).catch(() => {});
  } catch (e) {}

  // If approved and was not already approved, credit the member's wallet balance
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

// 1-second real-time subscription for Deposit Requests (for Admin Panel & Notification)
export function subscribeDepositRequests(onUpdate: (deposits: DepositRequest[]) => void) {
  // Yield initial local requests
  onUpdate(getLocalDepositRequests());

  // Fetch immediately from server
  fetchRemoteDepositRequests().then((deposits) => {
    if (deposits) onUpdate(deposits);
  });

  // Poll server every 1 second (1000ms) for instant cross-device updates
  const interval = setInterval(async () => {
    const fresh = await fetchRemoteDepositRequests();
    if (fresh) onUpdate(fresh);
  }, 1000);

  return () => clearInterval(interval);
}

// Withdrawal requests management for Admin & User
const WITHDRAWAL_REQUESTS_KEY = 'victorwin_withdrawal_queue_v1';

export const DEFAULT_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'WTH_1725372800100',
    uid: 'VW774102',
    username: 'Riya_Akter',
    phone: '01899112233',
    method: 'bkash',
    accountNumber: '01899112233',
    accountName: 'Riya Akter',
    amount: 1500,
    status: 'pending',
    createdAt: Date.now() - 15 * 60 * 1000,
    formattedTime: '15 mins ago',
  },
  {
    id: 'WTH_1725372800200',
    uid: 'VW558190',
    username: 'Habibur_Rahman',
    phone: '01722883344',
    method: 'nagad',
    accountNumber: '01722883344',
    accountName: 'Habibur Rahman',
    amount: 2500,
    status: 'approved',
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    formattedTime: '2 hours ago',
    approvedAt: Date.now() - 100 * 60 * 1000,
  },
];

export function getLocalWithdrawalRequests(): WithdrawalRequest[] {
  try {
    const raw = localStorage.getItem(WITHDRAWAL_REQUESTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return DEFAULT_WITHDRAWALS;
}

export async function fetchRemoteWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  try {
    const res = await fetch('/api/withdrawals');
    if (res.ok) {
      const serverWithdrawals: WithdrawalRequest[] = await res.json();
      if (Array.isArray(serverWithdrawals)) {
        localStorage.setItem(WITHDRAWAL_REQUESTS_KEY, JSON.stringify(serverWithdrawals));
        return serverWithdrawals;
      }
    }
  } catch (e) {}
  return getLocalWithdrawalRequests();
}

export async function saveWithdrawalRequest(req: WithdrawalRequest) {
  const list = getLocalWithdrawalRequests();
  const updated = [req, ...list.filter((r) => r.id !== req.id)].slice(0, 100);
  localStorage.setItem(WITHDRAWAL_REQUESTS_KEY, JSON.stringify(updated));

  // Sync to Central Server
  try {
    await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch (e) {}

  // Dual Backup to Firebase
  try {
    const wthDocRef = doc(db, 'withdrawal_requests', req.id);
    setDoc(wthDocRef, req, { merge: true }).catch(() => {});
  } catch (e) {}
}

export async function updateWithdrawalRequestStatus(
  reqId: string,
  status: 'approved' | 'rejected',
  rejectReason?: string
) {
  const list = getLocalWithdrawalRequests();
  const targetReq = list.find((r) => r.id === reqId);
  const updated = list.map((r) =>
    r.id === reqId
      ? {
          ...r,
          status,
          rejectReason: rejectReason || r.rejectReason,
          approvedAt: status === 'approved' ? Date.now() : undefined,
        }
      : r
  );
  localStorage.setItem(WITHDRAWAL_REQUESTS_KEY, JSON.stringify(updated));

  // Sync to Central Server
  try {
    await fetch(`/api/withdrawals/${reqId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejectReason }),
    });
  } catch (e) {}

  try {
    const wthDocRef = doc(db, 'withdrawal_requests', reqId);
    updateDoc(wthDocRef, {
      status,
      rejectReason: rejectReason || '',
      approvedAt: status === 'approved' ? Date.now() : undefined,
    }).catch(() => {});
  } catch (e) {}

  // If rejected, refund the money back to user wallet!
  if (status === 'rejected' && targetReq && targetReq.status === 'pending') {
    const members = getLocalMembers();
    const targetMember = members.find(
      (m) =>
        m.uid === targetReq.uid ||
        (targetReq.phone && m.phone === targetReq.phone) ||
        (targetReq.username && m.username === targetReq.username)
    );

    if (targetMember) {
      const refundAmount = targetReq.amount || 0;
      const newBal = (targetMember.balance || 0) + refundAmount;
      updateLocalMember(targetMember.uid, {
        balance: newBal,
      });

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

export function subscribeWithdrawalRequests(onUpdate: (withdrawals: WithdrawalRequest[]) => void) {
  onUpdate(getLocalWithdrawalRequests());

  fetchRemoteWithdrawalRequests().then((wths) => {
    if (wths) onUpdate(wths);
  });

  const interval = setInterval(async () => {
    const fresh = await fetchRemoteWithdrawalRequests();
    if (fresh) onUpdate(fresh);
  }, 1000);

  return () => clearInterval(interval);
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
    referredBy: 'MASTER_TOP',
    referralCount: 14,
    referralDepositsCount: 9,
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
    invitationCode: 'VICTOR888',
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
    referredBy: 'VICTOR888',
    referralCount: 6,
    referralDepositsCount: 4,
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
    referredBy: 'VICTOR888',
    referralCount: 22,
    referralDepositsCount: 18,
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
    referralCount: 45,
    referralDepositsCount: 38,
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

export async function fetchRemoteMembers(): Promise<RegisteredMember[]> {
  try {
    const res = await fetch('/api/members');
    if (res.ok) {
      const serverMembers = await res.json();
      if (Array.isArray(serverMembers) && serverMembers.length > 0) {
        localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(serverMembers));
        return serverMembers;
      }
    }
  } catch (e) {}
  return getLocalMembers();
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

  // Sync to Central Server
  try {
    fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    }).catch(() => {});
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

  // Sync to Central Server
  try {
    fetch(`/api/members/${uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    }).catch(() => {});
  } catch (e) {}
}

export function deleteLocalMember(uid: string) {
  const current = getLocalMembers();
  const updated = current.filter((m) => m.uid !== uid);
  try {
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}

  try {
    fetch(`/api/members/${uid}`, {
      method: 'DELETE',
    }).catch(() => {});
  } catch (e) {}
}

export function subscribeMembers(onUpdate: (members: RegisteredMember[]) => void) {
  onUpdate(getLocalMembers());

  fetchRemoteMembers().then((mems) => {
    if (mems) onUpdate(mems);
  });

  const interval = setInterval(async () => {
    const fresh = await fetchRemoteMembers();
    if (fresh) onUpdate(fresh);
  }, 1000);

  let unsubFirestore = () => {};
  try {
    const usersColRef = collection(db, 'users');
    unsubFirestore = onSnapshot(
      usersColRef,
      (snapshot) => {
        const remoteList: RegisteredMember[] = [];
        snapshot.forEach((d) => {
          remoteList.push(d.data() as RegisteredMember);
        });
        if (remoteList.length > 0) {
          onUpdate(remoteList);
          localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(remoteList));
        }
      },
      () => {}
    );
  } catch (e) {}

  return () => {
    clearInterval(interval);
    unsubFirestore();
  };
}

// User Withdrawal Wallets Binding & Management (Max 2 Wallets per Account & Universal Uniqueness)
export function getUserWallets(uidOrPhone: string): UserBoundWallet[] {
  if (!uidOrPhone) return [];
  try {
    const raw = localStorage.getItem(`victor_wallets_${uidOrPhone}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Check legacy single wallet
    const legacy = localStorage.getItem(`victor_wallet_${uidOrPhone}`);
    if (legacy) {
      const p = JSON.parse(legacy);
      if (p && p.accountNumber) {
        const migrated: UserBoundWallet = {
          id: 'w_' + Date.now(),
          method: p.method || 'bkash',
          accountNumber: p.accountNumber,
          accountName: p.accountName || '',
          isBound: true,
          boundAt: p.boundAt || new Date().toISOString(),
        };
        localStorage.setItem(`victor_wallets_${uidOrPhone}`, JSON.stringify([migrated]));
        return [migrated];
      }
    }
  } catch (e) {}
  return [];
}

export function isWalletNumberAlreadyUsed(accountNumber: string, currentWalletId?: string): boolean {
  const cleanNumber = (accountNumber || '').replace(/\D/g, '');
  if (!cleanNumber) return false;

  // 1. Check all members in storage
  const members = getLocalMembers();
  for (const m of members) {
    if (m.withdrawalWallets && Array.isArray(m.withdrawalWallets)) {
      for (const w of m.withdrawalWallets) {
        if (currentWalletId && w.id === currentWalletId) continue;
        if ((w.accountNumber || '').replace(/\D/g, '') === cleanNumber) {
          return true;
        }
      }
    }
    if (m.withdrawalWallet && (m.withdrawalWallet.accountNumber || '').replace(/\D/g, '') === cleanNumber) {
      return true;
    }
  }

  // 2. Check all victor_wallets_* keys in localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('victor_wallets_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const arr: UserBoundWallet[] = JSON.parse(raw);
          if (Array.isArray(arr)) {
            for (const w of arr) {
              if (currentWalletId && w.id === currentWalletId) continue;
              if ((w.accountNumber || '').replace(/\D/g, '') === cleanNumber) {
                return true;
              }
            }
          }
        }
      }
    }
  } catch (e) {}

  return false;
}

export function saveUserWallet(
  uidOrPhone: string,
  wallet: Omit<UserBoundWallet, 'id' | 'boundAt' | 'isBound'> & { id?: string; boundAt?: string; isBound?: boolean }
): { success: boolean; message: string; wallet?: UserBoundWallet } {
  const currentWallets = getUserWallets(uidOrPhone);
  const cleanNumber = (wallet.accountNumber || '').replace(/\D/g, '');

  if (!cleanNumber || cleanNumber.length < 11) {
    return { success: false, message: 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল ব্যাংকিং নম্বর লিখুন (যেমন: 017xxxxxxxx)।' };
  }

  // Check 2 wallets limit per account
  const isEditing = wallet.id && currentWallets.some((w) => w.id === wallet.id);
  if (!isEditing && currentWallets.length >= 2) {
    return { success: false, message: 'একটি অ্যাকাউন্টে সর্বোচ্চ ২টি ওয়ালেট সেট করা যাবে।' };
  }

  // Check unique phone number rule across entire platform!
  if (isWalletNumberAlreadyUsed(cleanNumber, wallet.id)) {
    return {
      success: false,
      message: '❌ এই নাম্বারটি ইতিমধ্যে সিস্টেমে ব্যবহৃত হয়েছে! একটি নাম্বার শুধুমাত্র একবার ব্যবহার করা যাবে।',
    };
  }

  const walletItem: UserBoundWallet = {
    id: wallet.id || 'w_' + Date.now(),
    method: wallet.method,
    accountNumber: cleanNumber,
    accountName: (wallet.accountName || '').trim(),
    isBound: true,
    boundAt: wallet.boundAt || new Date().toISOString(),
  };

  let updatedWallets: UserBoundWallet[];
  if (isEditing) {
    updatedWallets = currentWallets.map((w) => (w.id === walletItem.id ? walletItem : w));
  } else {
    updatedWallets = [...currentWallets, walletItem];
  }

  try {
    localStorage.setItem(`victor_wallets_${uidOrPhone}`, JSON.stringify(updatedWallets));
    localStorage.setItem(`victor_wallet_${uidOrPhone}`, JSON.stringify(walletItem));
  } catch (e) {}

  // Update member
  const members = getLocalMembers();
  const mIndex = members.findIndex((m) => m.uid === uidOrPhone || m.phone === uidOrPhone);
  if (mIndex >= 0) {
    members[mIndex].withdrawalWallet = walletItem;
    members[mIndex].withdrawalWallets = updatedWallets;
    saveLocalMember(members[mIndex]);
  }

  return { success: true, message: 'ওয়ালেট সফলভাবে সংরক্ষিত হয়েছে!', wallet: walletItem };
}

export function deleteUserWallet(uidOrPhone: string, walletId: string): { success: boolean } {
  const currentWallets = getUserWallets(uidOrPhone);
  const updated = currentWallets.filter((w) => w.id !== walletId);
  try {
    localStorage.setItem(`victor_wallets_${uidOrPhone}`, JSON.stringify(updated));
    if (updated.length > 0) {
      localStorage.setItem(`victor_wallet_${uidOrPhone}`, JSON.stringify(updated[0]));
    } else {
      localStorage.removeItem(`victor_wallet_${uidOrPhone}`);
    }
  } catch (e) {}

  const members = getLocalMembers();
  const mIndex = members.findIndex((m) => m.uid === uidOrPhone || m.phone === uidOrPhone);
  if (mIndex >= 0) {
    members[mIndex].withdrawalWallets = updated;
    members[mIndex].withdrawalWallet = updated.length > 0 ? updated[0] : undefined;
    saveLocalMember(members[mIndex]);
  }
  return { success: true };
}

// Live Firebase Connection Check
export async function checkFirebaseLiveStatus(): Promise<{ connected: boolean; error?: string }> {
  try {
    const testDoc = doc(db, 'system', 'app_config');
    const snapshot = await getDoc(testDoc);
    return { connected: true };
  } catch (err: any) {
    console.warn('Firebase connection check notice:', err);
    return {
      connected: false,
      error: err?.code === 'permission-denied'
        ? 'Permission Denied: ফায়ারবেস রুলস লক করা আছে'
        : err?.message || 'কানেকশন সমস্যা',
    };
  }
}

// Register user with strict Firebase validation
export async function firebaseRegisterMember(
  member: RegisteredMember
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    // Attempt writing directly to Firebase Firestore
    const userDocRef = doc(db, 'users', member.uid);
    await setDoc(userDocRef, member, { merge: true });
    
    // Save to local cache as well
    saveLocalMember(member);
    return { success: true };
  } catch (err: any) {
    console.error('Firebase registration error:', err);
    const isPermissionError = err?.code === 'permission-denied' || String(err).includes('permission-denied');
    return {
      success: false,
      error: 'firebase_connection_failed',
      message: isPermissionError
        ? '⚠️ ফায়ারবেস ডাটাবেজের পারমিশন লক করা (Permission Denied)! অনুগ্রহ করে Firebase Console-এ গিয়ে Firestore Rules-এ `allow read, write: if true;` দিয়ে Publish করুন।'
        : `⚠️ ফায়ারবেস ডাটাবেজ কানেক্ট হতে পারেনি (${err?.message || 'সার্ভার সংযোগ ব্যর্থ'})। অনুগ্রহ করে ইন্টারনেট ও ফায়ারবেস চেক করুন।`,
    };
  }
}

// Login user with strict Firebase validation
export async function firebaseLoginMember(
  identifier: string,
  pass: string
): Promise<{ success: boolean; user?: RegisteredMember; error?: string; message?: string; banned?: boolean; banReason?: string }> {
  try {
    const usersColRef = collection(db, 'users');
    const snapshot = await getDocs(usersColRef);
    const remoteMembers: RegisteredMember[] = [];
    snapshot.forEach((d) => {
      remoteMembers.push(d.data() as RegisteredMember);
    });

    const cleanDigits = identifier.replace(/\D/g, '');
    const cleanLower = identifier.trim().toLowerCase();

    // Check remote members from Firebase first
    let user = remoteMembers.find((m) => {
      const mDigits = (m.phone || '').replace(/\D/g, '');
      return (
        m.uid.toLowerCase() === cleanLower ||
        m.phone === identifier ||
        (m.email && m.email.toLowerCase() === cleanLower) ||
        (cleanDigits.length >= 8 && mDigits.endsWith(cleanDigits.slice(-10)))
      );
    });

    // If not found in remote, check local fallback
    if (!user) {
      const localMembers = getLocalMembers();
      user = localMembers.find((m) => {
        const mDigits = (m.phone || '').replace(/\D/g, '');
        return (
          m.uid.toLowerCase() === cleanLower ||
          m.phone === identifier ||
          (m.email && m.email.toLowerCase() === cleanLower) ||
          (cleanDigits.length >= 8 && mDigits.endsWith(cleanDigits.slice(-10)))
        );
      });
    }

    if (!user) {
      return {
        success: false,
        error: 'user_not_found',
        message: '❌ এই অ্যাকাউন্টের কোনো তথ্য পাওয়া যায়নি! অনুগ্রহ করে আগে রেজিস্ট্রেশন করুন।',
      };
    }

    if (user.status === 'banned') {
      return {
        success: false,
        banned: true,
        banReason: user.banReason || 'নিরাপত্তা পলিসি লঙ্ঘনের কারণে এই একাউন্ট স্থগিত',
      };
    }

    if (user.password && user.password !== pass.trim()) {
      return {
        success: false,
        error: 'invalid_password',
        message: '❌ ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড প্রদান করুন।',
      };
    }

    return { success: true, user };
  } catch (err: any) {
    console.error('Firebase login check error:', err);
    const isPermissionError = err?.code === 'permission-denied' || String(err).includes('permission-denied');
    return {
      success: false,
      error: 'firebase_connection_failed',
      message: isPermissionError
        ? '⚠️ ফায়ারবেস ডাটাবেজের পারমিশন লক করা (Permission Denied)! অনুগ্রহ করে Firebase Console-এ গিয়ে Firestore Rules-এ `allow read, write: if true;` দিয়ে Publish করুন।'
        : `⚠️ ফায়ারবেস ডাটাবেজ কানেক্ট হতে পারেনি (${err?.message || 'সার্ভার সংযোগ ব্যর্থ'})।`,
    };
  }
}


