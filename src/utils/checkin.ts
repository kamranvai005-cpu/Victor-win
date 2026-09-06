/**
 * Daily Check-in & Lucky Spin Configuration & Management
 * 
 * Rules:
 * - 7 Days Check-in:
 *   - Day 1: Requires 100 BDT deposit, gives 10 BDT reward
 *   - Day 2: Requires 200 BDT deposit, gives 20 BDT reward
 *   - Day 3: Requires 300 BDT deposit, gives 30 BDT reward
 *   - Day 4: Requires 400 BDT deposit, gives 40 BDT reward
 *   - Day 5: Requires 500 BDT deposit, gives 50 BDT reward
 *   - Day 6: Requires 600 BDT deposit, gives 60 BDT reward
 *   - Day 7: Requires 700 BDT deposit, gives 70 BDT reward
 *   - After 7 days, cycle expires ("সাত দিন ওভার হয়ে যায় যদি তাইলে আর পাবে না")
 * 
 * - Lucky Spin:
 *   - No free spins ("ফ্রিতে কোনো স্পিন পাওয়া যাবে না")
 *   - Spin cost: 20 BDT per spin ("২০ টাকা দিয়ে একটা স্পিন কিনতে হবে")
 *   - Low rewards: 2 BDT, 5 BDT, 10 BDT, 15 BDT, max 20 BDT ("১০ টাকা ২০ টাকা দিবে ৫ টাকা দিবে এভাবে আর কি বেশি দিবে না")
 */

export interface CheckInDayConfig {
  day: number;
  requiredDeposit: number;
  reward: number;
  icon: string;
}

export const DAILY_CHECKIN_DAYS: CheckInDayConfig[] = [
  { day: 1, requiredDeposit: 100, reward: 10, icon: '🪙' },
  { day: 2, requiredDeposit: 200, reward: 20, icon: '💎' },
  { day: 3, requiredDeposit: 300, reward: 30, icon: '🎁' },
  { day: 4, requiredDeposit: 400, reward: 40, icon: '🔥' },
  { day: 5, requiredDeposit: 500, reward: 50, icon: '⚡' },
  { day: 6, requiredDeposit: 600, reward: 60, icon: '👑' },
  { day: 7, requiredDeposit: 700, reward: 70, icon: '🏆' },
];

export interface CheckInState {
  currentDay: number; // 1 to 7, or 8 when cycle is completed
  claimedDays: number[];
  lastClaimDate: string | null;
  isCycleCompleted: boolean;
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const CHECKIN_STORAGE_PREFIX = 'victor_daily_checkin_state_';
const DEPOSIT_STORAGE_PREFIX = 'victor_today_deposit_';

export function getCheckInState(userId?: string): CheckInState {
  const key = `${CHECKIN_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as CheckInState;
      return {
        currentDay: parsed.currentDay || 1,
        claimedDays: parsed.claimedDays || [],
        lastClaimDate: parsed.lastClaimDate || null,
        isCycleCompleted: Boolean(parsed.isCycleCompleted || parsed.currentDay > 7),
      };
    }
  } catch {}

  return {
    currentDay: 1,
    claimedDays: [],
    lastClaimDate: null,
    isCycleCompleted: false,
  };
}

export function saveCheckInState(state: CheckInState, userId?: string): void {
  const key = `${CHECKIN_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {}
}

export function getTodayDepositAmount(userId?: string): number {
  const todayStr = getTodayDateString();
  const key = `${DEPOSIT_STORAGE_PREFIX}${userId || 'guest'}_${todayStr}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return Math.max(0, parseFloat(raw) || 0);
    }
  } catch {}
  return 0;
}

export function addTodayDepositAmount(amount: number, userId?: string): number {
  const todayStr = getTodayDateString();
  const key = `${DEPOSIT_STORAGE_PREFIX}${userId || 'guest'}_${todayStr}`;
  const current = getTodayDepositAmount(userId);
  const updated = current + amount;
  try {
    localStorage.setItem(key, updated.toString());
  } catch {}
  return updated;
}

// Lucky Spin Configuration
export interface SpinWheelPrize {
  label: string;
  value: number;
  color: string;
  weight: number; // probability weight
}

export const SPIN_COST = 20; // 20 BDT per spin

export const LOW_REWARD_SPIN_PRIZES: SpinWheelPrize[] = [
  { label: '৳২', value: 2, color: '#10b981', weight: 25 },
  { label: '৳৫', value: 5, color: '#3b82f6', weight: 30 },
  { label: '৳১০', value: 10, color: '#f59e0b', weight: 20 },
  { label: '৳২', value: 2, color: '#06b6d4', weight: 20 },
  { label: '৳১৫', value: 15, color: '#8b5cf6', weight: 8 },
  { label: '৳৫', value: 5, color: '#ec4899', weight: 20 },
  { label: '৳২০', value: 20, color: '#eab308', weight: 4 }, // max reward 20 BDT
  { label: '৳২', value: 2, color: '#14b8a6', weight: 20 },
];

export function selectRandomSpinPrize(): { prize: SpinWheelPrize; index: number } {
  const totalWeight = LOW_REWARD_SPIN_PRIZES.reduce((acc, p) => acc + p.weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < LOW_REWARD_SPIN_PRIZES.length; i++) {
    const p = LOW_REWARD_SPIN_PRIZES[i];
    if (random < p.weight) {
      return { prize: p, index: i };
    }
    random -= p.weight;
  }

  return { prize: LOW_REWARD_SPIN_PRIZES[0], index: 0 };
}
