import { WinGoResult } from '../types';
import { getLocalConfig } from './firebase';

/**
 * Deterministic PRNG with Murmur3 / Mulberry32 high-entropy bit mixer
 */
export function pseudoRandom(seed: number): number {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  a = (a + 0x6d2b79f5) >>> 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Format Period String like 2026090210048
 */
export function formatPeriod(roundIndex: number, durationSeconds: number): string {
  const date = new Date(roundIndex * durationSeconds * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  // Daily sequence number
  const startOfDayMs = Date.UTC(year, date.getUTCMonth(), date.getUTCDate());
  const roundOfDay = Math.floor(((roundIndex * durationSeconds * 1000) - startOfDayMs) / (durationSeconds * 1000)) + 1;
  const seqStr = String(roundOfDay).padStart(5, '0');

  return `${year}${month}${day}1${seqStr}`;
}

export interface LiveBetRecord {
  id: string;
  userUid: string;
  username: string;
  phone: string;
  avatar?: string;
  gameType: 'wingo' | 'trx' | 'k3' | '5d' | 'aviator';
  period: string;
  selectType: 'color' | 'number' | 'size' | 'multiplier';
  selection: string;
  amount: number;
  multiplier: number;
  totalStake: number;
  placedAt: string; // ISO string or formatted time
  timestamp: number;
  status: 'pending' | 'won' | 'lost';
}

const LIVE_BETS_STORAGE_KEY = 'victorwin_live_bets_v2';

// Seed initial realistic bets for current periods
export function getStoredLiveBets(): LiveBetRecord[] {
  try {
    const raw = localStorage.getItem(LIVE_BETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load live bets', e);
  }

  // Generate initial simulated live bets from registered members
  const now = Date.now();
  const sampleBets: LiveBetRecord[] = [
    {
      id: `bet-${now - 12000}`,
      userUid: 'VW889241',
      username: 'Player_8892',
      phone: '01712345678',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      gameType: 'wingo',
      period: formatPeriod(Math.floor(now / 30000), 30),
      selectType: 'size',
      selection: 'big',
      amount: 1000,
      multiplier: 1,
      totalStake: 1000,
      placedAt: new Date(now - 12000).toTimeString().slice(0, 8),
      timestamp: now - 12000,
      status: 'pending',
    },
    {
      id: `bet-${now - 8000}`,
      userUid: 'VW774102',
      username: 'Riya_Akter',
      phone: '01899112233',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      gameType: 'wingo',
      period: formatPeriod(Math.floor(now / 30000), 30),
      selectType: 'size',
      selection: 'small',
      amount: 500,
      multiplier: 1,
      totalStake: 500,
      placedAt: new Date(now - 8000).toTimeString().slice(0, 8),
      timestamp: now - 8000,
      status: 'pending',
    },
    {
      id: `bet-${now - 5000}`,
      userUid: 'VW990145',
      username: 'Sadia_VIP',
      phone: '01988776655',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      gameType: 'wingo',
      period: formatPeriod(Math.floor(now / 30000), 30),
      selectType: 'number',
      selection: '7',
      amount: 200,
      multiplier: 2,
      totalStake: 400,
      placedAt: new Date(now - 5000).toTimeString().slice(0, 8),
      timestamp: now - 5000,
      status: 'pending',
    },
    {
      id: `bet-${now - 3000}`,
      userUid: 'VW332187',
      username: 'Tania_Sultana',
      phone: '01655443322',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      gameType: 'wingo',
      period: formatPeriod(Math.floor(now / 30000), 30),
      selectType: 'color',
      selection: 'green',
      amount: 300,
      multiplier: 1,
      totalStake: 300,
      placedAt: new Date(now - 3000).toTimeString().slice(0, 8),
      timestamp: now - 3000,
      status: 'pending',
    },
  ];

  try {
    localStorage.setItem(LIVE_BETS_STORAGE_KEY, JSON.stringify(sampleBets));
  } catch {
    // Ignored
  }
  return sampleBets;
}

export function recordLiveBet(bet: LiveBetRecord): void {
  try {
    const existing = getStoredLiveBets();
    const updated = [bet, ...existing].slice(0, 200); // keep last 200 active bets
    localStorage.setItem(LIVE_BETS_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('victorwin_live_bet_placed', { detail: bet }));
    }
  } catch (e) {
    console.error('Failed to save live bet', e);
  }
}

/**
 * Automatically calculate the optimal result for a period based on bet distribution
 * When Big has higher total bets than Small (e.g. Big 1000, Small 500), result lands on Small (0-4)
 * When Small has higher total bets, result lands on Big (5-9)
 */
export function calculateAutomatedMarketResult(period: string, fallbackRngNumber: number): number {
  const bets = getStoredLiveBets().filter((b) => b.period === period);
  if (bets.length === 0) return fallbackRngNumber;

  let bigTotal = 0;
  let smallTotal = 0;
  const numberTotals: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

  bets.forEach((b) => {
    if (b.selectType === 'size') {
      if (b.selection.toLowerCase() === 'big') bigTotal += b.totalStake;
      if (b.selection.toLowerCase() === 'small') smallTotal += b.totalStake;
    } else if (b.selectType === 'number') {
      const num = Number(b.selection);
      if (!isNaN(num) && num >= 0 && num <= 9) {
        numberTotals[num] += b.totalStake;
        if (num >= 5) bigTotal += b.totalStake;
        else smallTotal += b.totalStake;
      }
    } else if (b.selectType === 'color') {
      // green: 1,3,7,9 (and 5 half); red: 2,4,6,8 (and 0 half)
      if (b.selection === 'green') {
        [1, 3, 7, 9].forEach((n) => (numberTotals[n] += b.totalStake * 0.25));
      } else if (b.selection === 'red') {
        [2, 4, 6, 8].forEach((n) => (numberTotals[n] += b.totalStake * 0.25));
      }
    }
  });

  // If one side has lower bet amount, favor the side where less money is placed
  if (bigTotal > smallTotal) {
    // Small should win (0, 1, 2, 3, 4)
    // Pick the small number with the absolute minimum exposure
    const smallCandidates = [0, 1, 2, 3, 4].sort((a, b) => (numberTotals[a] || 0) - (numberTotals[b] || 0));
    return smallCandidates[0];
  } else if (smallTotal > bigTotal) {
    // Big should win (5, 6, 7, 8, 9)
    // Pick the big number with the absolute minimum exposure
    const bigCandidates = [5, 6, 7, 8, 9].sort((a, b) => (numberTotals[a] || 0) - (numberTotals[b] || 0));
    return bigCandidates[0];
  }

  return fallbackRngNumber;
}

/**
 * Calculate WinGo Draw Result deterministically or via Admin override
 */
export function getWinGoDraw(roundIndex: number, durationSeconds: number, isHistorical: boolean = false): WinGoResult {
  const period = formatPeriod(roundIndex, durationSeconds);
  const config = getLocalConfig();
  
  let number: number;

  // 1. Check if Admin set an exact override for this specific duration/period
  // Overrides only apply if the period matches exactly
  const durationOverride = config.marketControl?.winGoDurationOverrides?.[durationSeconds];
  const nextOverride = config.marketControl?.winGoNextOverride;

  if (durationOverride && durationOverride.period === period) {
    number = durationOverride.number;
  } else if (nextOverride && nextOverride.period === period) {
    number = nextOverride.number;
  } else if (!isHistorical && config.marketControl?.houseEdgeMode === 'custom_number' && typeof config.marketControl.targetCustomNumber === 'number' && config.marketControl.targetCustomNumber >= 0) {
    number = config.marketControl.targetCustomNumber % 10;
  } else {
    // High-entropy deterministic seed based on period index and game duration
    const seed1 = ((roundIndex * 1234567) ^ (durationSeconds * 987654)) >>> 0;
    const r1 = pseudoRandom(seed1);
    const seed2 = (((roundIndex + 739) * 314159) ^ 0xa5a5a5a5) >>> 0;
    const r2 = pseudoRandom(seed2);
    
    // Combine two random variables for uniform distribution across 0..9
    const rawRngNumber = Math.floor(((r1 * 0.6180339887 + r2 * 0.3819660113) * 10) % 10);

    // If marketControl is in automated house-edge/profit-control mode or default auto,
    // evaluate live bet amounts (less money wins rule) ONLY for active round, NEVER alter past history!
    if (!isHistorical && (config.marketControl?.houseEdgeMode === 'force_house_win' || config.marketControl?.houseEdgeMode === 'auto')) {
      number = calculateAutomatedMarketResult(period, rawRngNumber);
    } else {
      number = rawRngNumber;
    }
  }

  let color: 'green' | 'red' | 'green-violet' | 'red-violet';
  if (number === 0) color = 'red-violet';
  else if (number === 5) color = 'green-violet';
  else if ([1, 3, 7, 9].includes(number)) color = 'green';
  else color = 'red';

  const size: 'big' | 'small' = number >= 5 ? 'big' : 'small';

  const roundTime = new Date((roundIndex + 1) * durationSeconds * 1000);
  const timeStr = roundTime.toTimeString().slice(0, 8);

  return {
    period,
    number,
    color,
    size,
    time: timeStr,
  };
}

/**
 * Real-time state for WinGo game (Default: 10 results in history)
 */
export function getRealtimeWinGo(durationSeconds: number, historyCount: number = 10) {
  const now = Date.now();
  const durationMs = durationSeconds * 1000;
  const currentRoundIndex = Math.floor(now / durationMs);
  const currentPeriod = formatPeriod(currentRoundIndex, durationSeconds);
  const elapsedInRoundMs = now % durationMs;
  const timeLeft = Math.max(1, Math.ceil((durationMs - elapsedInRoundMs) / 1000));
  const isFreeze = timeLeft <= 5;

  // Generate requested number of past rounds deterministically with isHistorical=true
  // This guarantees that past rounds NEVER change when admin sets a custom number for the current period!
  const history: WinGoResult[] = [];
  for (let i = 1; i <= historyCount; i++) {
    const prevRoundIndex = currentRoundIndex - i;
    history.push(getWinGoDraw(prevRoundIndex, durationSeconds, true));
  }

  return {
    period: currentPeriod,
    roundIndex: currentRoundIndex,
    timeLeft,
    isFreeze,
    latestDraw: history[0],
    history,
  };
}

/**
 * Retrieve paginated past WinGo results (e.g. for full History Modal page)
 */
export function getWinGoPaginatedHistory(
  durationSeconds: number,
  page: number = 1,
  pageSize: number = 10
): { results: WinGoResult[]; totalPages: number; totalCount: number } {
  const now = Date.now();
  const durationMs = durationSeconds * 1000;
  const currentRoundIndex = Math.floor(now / durationMs);

  const totalCount = 100; // 100 past rounds accessible
  const totalPages = Math.ceil(totalCount / pageSize);
  const safePage = Math.max(1, Math.min(page, totalPages));

  const results: WinGoResult[] = [];
  const startOffset = (safePage - 1) * pageSize + 1;
  const endOffset = Math.min(startOffset + pageSize - 1, totalCount);

  for (let i = startOffset; i <= endOffset; i++) {
    const prevRoundIndex = currentRoundIndex - i;
    results.push(getWinGoDraw(prevRoundIndex, durationSeconds));
  }

  return {
    results,
    totalPages,
    totalCount,
  };
}

/**
 * Calculate deterministic or admin-overridden crash point for a given Aviator round
 */
export function getAviatorRoundCrashPoint(roundIndex: number, isHistorical: boolean = false): number {
  const config = getLocalConfig();

  // 1. Check if Admin set an exact override (only for active cycle, not past history)
  if (
    !isHistorical &&
    config.marketControl?.aviatorNextCrashOverride &&
    config.marketControl.aviatorNextCrashOverride > 1.0
  ) {
    return Math.round(config.marketControl.aviatorNextCrashOverride * 100) / 100;
  }

  // 2. Check Admin Crash Mode
  const mode = config.marketControl?.aviatorCrashMode || 'auto';
  const seed = roundIndex * 104729 + (roundIndex % 23) * 7919 + 4391;
  const r = pseudoRandom(seed);
  const r2 = pseudoRandom(seed + 137);

  if (mode === 'high_multiplier') {
    return Math.round((5.5 + r * 45.0 + r2 * 20.0) * 100) / 100;
  }
  if (mode === 'low_crash') {
    return Math.round((1.05 + r * 0.55) * 100) / 100;
  }

  // 3. Realistic Dynamic Variance (no repeated signals)
  let crashPoint: number;
  if (r < 0.28) {
    crashPoint = 1.05 + r * 1.8; // 1.05x - 1.55x (Early Crash)
  } else if (r < 0.68) {
    crashPoint = 1.55 + (r - 0.28) * 7.5 + r2 * 0.5; // 1.55x - 4.55x (Standard Fly)
  } else if (r < 0.88) {
    crashPoint = 4.55 + (r - 0.68) * 50.0 + r2 * 3.0; // 4.55x - 14.55x (Big Run)
  } else if (r < 0.97) {
    crashPoint = 14.55 + (r - 0.88) * 450.0; // 14.55x - 55.00x (Mega Flight)
  } else {
    crashPoint = 55.00 + (r - 0.97) * 2500.0; // 55.00x - 130.00x (Super Moon)
  }

  return Math.round(crashPoint * 100) / 100;
}

/**
 * Real-time state for Aviator game (Smooth human-like flight curve)
 */
export function getRealtimeAviator() {
  const now = Date.now();
  // Realistic cycle time base for smooth, slower flight
  const baseCycleMs = 28000;
  const currentCycleIndex = Math.floor(now / baseCycleMs);
  const elapsedMs = now % baseCycleMs;

  const crashPoint = getAviatorRoundCrashPoint(currentCycleIndex);

  const countdownDurationMs = 5000; // 5s bet preparation for human reaction
  // Slower, human-like flight speed constant: k = 0.062 for steady, graceful climb
  const flightDurationMs = Math.min(18000, Math.max(3000, (Math.log(crashPoint) / 0.062) * 1000));

  let status: 'waiting' | 'flying' | 'crashed';
  let currentMultiplier = 1.0;
  let countdownSec = 0;

  if (elapsedMs < countdownDurationMs) {
    status = 'waiting';
    countdownSec = Math.ceil((countdownDurationMs - elapsedMs) / 1000);
    currentMultiplier = 1.0;
  } else if (elapsedMs < countdownDurationMs + flightDurationMs) {
    status = 'flying';
    const flyingTimeSec = (elapsedMs - countdownDurationMs) / 1000;
    // Human-like steady exponential growth: 1.0 * e^(0.062 * t)
    const calculatedMult = Math.min(
      crashPoint,
      Math.round(Math.pow(Math.E, 0.062 * flyingTimeSec) * 100) / 100
    );
    currentMultiplier = calculatedMult;
  } else {
    status = 'crashed';
    currentMultiplier = crashPoint;
    countdownSec = Math.ceil((baseCycleMs - elapsedMs) / 1000);
  }

  // Generate past 16 flight crash multipliers with high fidelity
  const pastMultipliers: { id: number; multiplier: number }[] = [];
  for (let i = 1; i <= 16; i++) {
    const prevIdx = currentCycleIndex - i;
    const prevCrash = getAviatorRoundCrashPoint(prevIdx, true);
    pastMultipliers.push({
      id: prevIdx,
      multiplier: prevCrash,
    });
  }

  return {
    cycleIndex: currentCycleIndex,
    status,
    currentMultiplier,
    crashPoint,
    countdownSec,
    pastMultipliers,
  };
}
