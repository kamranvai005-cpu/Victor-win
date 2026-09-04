export type Language = 'en' | 'bn' | 'hi';
export type Currency = 'BDT' | 'INR' | 'USD' | 'USDT';

export interface UserProfile {
  id: string;
  phone: string;
  countryCode: string;
  username: string;
  avatar: string;
  balance: number;
  unwithdrawableBalance: number;
  vipLevel: number;
  vipExp: number;
  nextVipExp: number;
  invitationCode: string;
  isLoggedIn: boolean;
  email?: string;
  role?: 'admin' | 'user';
  withdrawalWallet?: {
    method: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank';
    accountNumber: string;
    accountName: string;
    isBound: boolean;
    boundAt?: string;
  };
}

export type GameCategory = 
  | 'popular'
  | 'lottery'
  | 'mini'
  | 'slots'
  | 'casino'
  | 'sports'
  | 'fishing'
  | 'rummy'
  | 'aviator'
  | 'all';

export interface GameItem {
  id: string;
  title: string;
  category: GameCategory;
  provider: string;
  providerCode?: string;
  image: string;
  rating: number;
  hot?: boolean;
  isNew?: boolean;
  playersCount: number;
  minBet: number;
  winOdds?: number;
  gameCode?: string;
}

export type WinGoColor = 'green' | 'violet' | 'red';
export type WinGoSize = 'big' | 'small';

export interface WinGoResult {
  period: string;
  number: number;
  color: WinGoColor | 'green-violet' | 'red-violet';
  size: WinGoSize;
  time: string;
}

export interface WinGoBet {
  id: string;
  period: string;
  selectType: 'color' | 'number' | 'size';
  selection: string;
  amount: number;
  multiplier: number;
  totalStake: number;
  winAmount?: number;
  status: 'pending' | 'won' | 'lost';
  time: string;
}

export interface AviatorBet {
  id: string;
  user: string;
  avatar: string;
  betAmount: number;
  cashedOutMultiplier?: number;
  payout?: number;
  status: 'in_flight' | 'cashed_out' | 'crashed';
}

export interface SportsMatch {
  id: string;
  sport: 'cricket' | 'football' | 'tennis';
  tournament: string;
  team1: { name: string; score?: string; flag?: string };
  team2: { name: string; score?: string; flag?: string };
  status: 'LIVE' | 'UPCOMING';
  timeInfo: string;
  odds: {
    team1Win: number;
    draw?: number;
    team2Win: number;
    overRuns?: { target: number; over: number; under: number };
    nextWicket?: { yes: number; no: number };
  };
}

export interface BetSlipItem {
  id: string;
  matchId: string;
  matchTitle: string;
  marketName: string;
  selection: string;
  odds: number;
  stake: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bonus' | 'bet_win';
  method: string;
  amount: number;
  fee?: number;
  status: 'completed' | 'processing' | 'rejected';
  time: string;
  trxId?: string;
  account?: string;
}

export interface K3Result {
  period: string;
  dice: [number, number, number];
  sum: number;
  size: 'big' | 'small';
  parity: 'odd' | 'even';
  time: string;
}

export interface FiveDResult {
  period: string;
  balls: [number, number, number, number, number];
  sum: number;
  size: 'big' | 'small';
  parity: 'odd' | 'even';
  time: string;
}

export interface TrxResult {
  period: string;
  blockNumber: string;
  blockHash: string;
  number: number;
  color: WinGoColor | 'green-violet' | 'red-violet';
  size: WinGoSize;
  time: string;
}

export type ActiveGameViewType = 
  | 'none'
  | 'wingo'
  | 'k3'
  | '5d'
  | 'trx-wingo'
  | 'aviator'
  | 'mines'
  | 'plinko'
  | 'sports'
  | 'slots'
  | 'live-casino'
  | 'fishing'
  | 'card-game';
