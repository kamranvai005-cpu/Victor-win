import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Data storage directory & file
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Interfaces
interface GatewayConfig {
  id: string;
  name: string;
  bnName: string;
  number: string;
  accountType: string;
  transferType?: 'send_money' | 'cash_out';
  bonusPercent: number;
  minDeposit?: number;
  isActive: boolean;
}

interface DepositRequest {
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

interface WithdrawalRequest {
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

interface RegisteredMember {
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
  referredBy?: string;
  referralCount?: number;
  referralDepositsCount?: number;
  paymentMode?: 'send_money' | 'cash_out';
}

interface DatabaseSchema {
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  members: RegisteredMember[];
  config: Record<string, any>;
  liveBets: any[];
}

const DEFAULT_DB: DatabaseSchema = {
  deposits: [],
  withdrawals: [
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
  ],
  members: [
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
      registeredAt: '2026-03-01 14:20:00',
      status: 'active',
      deviceIp: '103.145.12.88',
      deviceModel: 'Samsung Galaxy A54',
      browser: 'Chrome Mobile 122',
      os: 'Android 14',
      network: 'Grameenphone 4G',
      totalDeposit: 15000,
      totalWon: 24000,
      totalBet: 45000,
    },
    {
      uid: 'VW992100',
      username: 'Admin_Master',
      phone: '01700000000',
      email: 'admin@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      password: 'password123',
      countryCode: '+880',
      balance: 99999.0,
      vipLevel: 8,
      invitationCode: 'ADMINVIP',
      gender: 'all',
      registeredAt: '2026-01-01 00:00:00',
      status: 'active',
      deviceIp: '127.0.0.1',
      deviceModel: 'Master Admin Terminal',
      browser: 'Chrome Desktop',
      os: 'AdminOS',
      totalDeposit: 500000,
    },
  ],
  config: {
    gameStatuses: {
      wingo: 'active',
      aviator: 'active',
      trx_wingo: 'active',
      k3: 'active',
      '5d': 'active',
      mines: 'active',
      plinko: 'active',
      slots: 'active',
      live_casino: 'active',
      fishing: 'active',
      card_game: 'active',
      sports: 'active',
    },
    gateways: {
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
        bnName: 'USDT ক্রিপ্টো ওয়ালেট',
        number: 'TJ9xWq89KmNZ7vPqrX9L4xYY1Qe7U8K3Ld',
        accountType: 'TRC20 Address Network',
        transferType: 'send_money',
        bonusPercent: 8,
        isActive: true,
      },
    },
    commissions: {
      tier1: 0.6,
      tier2: 0.18,
      tier3: 0.054,
      tier4: 0.0162,
      tier5: 0.00486,
      tier6: 0.001458,
    },
    marketControl: {
      houseEdgeMode: 'auto',
      targetCustomNumber: 7,
      winGoNextOverride: null,
      trxNextOverride: null,
      k3NextOverride: null,
      fiveDNextOverride: null,
    },
    giftCodes: [],
    firstDepositBonus: {
      enabled: true,
      bonusPercent: 10,
      maxBonusAmount: 20000,
      minDepositAmount: 200,
      title: 'প্রথম ডিপোজিটে ১০% তাৎক্ষণিক ক্যাশ বোনাস!',
      description: 'প্রথমবার একাউন্টে সর্বনিম্ন ২০০ টাকা ডিপোজিট করলেই সাথে সাথে পেয়ে যান ১০% পর্যন্ত অতিরিক্ত ক্যাশ বোনাস!',
      bannerImage: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
    },
    noticeText: 'সতর্কবার্তা: অফিসিয়াল বিকাশ, নগদ ও রকেট এজেন্ট বা পার্সোনাল নাম্বারে ক্যাশ আউট বা সেন্ড মানি করার পর ট্রানজেকশন আইডি (TrxID) দিন।',
    appDownloadUrl: 'https://millionaire-bd.web.app/download/app-v2.apk',
  },
  liveBets: [],
};

// Database in-memory cache
let dbCache: DatabaseSchema = loadDatabase();

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        deposits: Array.isArray(parsed.deposits) ? parsed.deposits : DEFAULT_DB.deposits,
        withdrawals: Array.isArray(parsed.withdrawals) ? parsed.withdrawals : DEFAULT_DB.withdrawals,
        members: Array.isArray(parsed.members) ? parsed.members : DEFAULT_DB.members,
        config: { ...DEFAULT_DB.config, ...(parsed.config || {}) },
        liveBets: Array.isArray(parsed.liveBets) ? parsed.liveBets : [],
      };
    }
  } catch (err) {
    console.error('Error loading database file:', err);
  }
  // Initialize with defaults if not found
  saveDatabase(DEFAULT_DB);
  return DEFAULT_DB;
}

function saveDatabase(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    dbCache = data;
  } catch (err) {
    console.error('Error writing to database file:', err);
  }
}

// ------------------- API ROUTES -------------------

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: Date.now(), totalDeposits: dbCache.deposits.length });
});

// 2. Deposit Requests API
app.get('/api/deposits', (req, res) => {
  res.json(dbCache.deposits);
});

app.post('/api/deposits', (req, res) => {
  try {
    const data = req.body as Partial<DepositRequest>;
    if (!data.amount || (!data.trxId && !data.senderNumber)) {
      return res.status(400).json({ error: 'Missing required deposit fields' });
    }

    const newReq: DepositRequest = {
      id: data.id || `DEP_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      uid: data.uid || 'UNKNOWN',
      username: data.username || data.userName || 'Player',
      userName: data.userName || data.username || 'Player',
      phone: data.phone || data.userPhone || '',
      userPhone: data.userPhone || data.phone || '',
      gateway: data.gateway || data.method || 'bKash',
      method: data.method || 'bKash',
      senderNumber: data.senderNumber || '',
      amount: Number(data.amount) || 0,
      bonus: Number(data.bonus) || 0,
      trxId: String(data.trxId || '').trim(),
      status: 'pending',
      createdAt: data.createdAt || Date.now(),
      formattedTime: data.formattedTime || new Date().toLocaleTimeString(),
    };

    // Remove any previous record with duplicate ID if resubmitted
    const filtered = dbCache.deposits.filter((d) => d.id !== newReq.id);
    const updatedDeposits = [newReq, ...filtered].slice(0, 500); // keep up to 500 records

    saveDatabase({
      ...dbCache,
      deposits: updatedDeposits,
    });

    console.log(`[API] New Deposit received: ${newReq.amount} BDT by ${newReq.username} (TrxID: ${newReq.trxId})`);
    res.status(201).json({ success: true, deposit: newReq });
  } catch (err: any) {
    console.error('Error saving deposit request:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Update deposit status (Admin Approval / Rejection)
app.put('/api/deposits/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const targetIndex = dbCache.deposits.findIndex((d) => d.id === id);
    if (targetIndex === -1) {
      return res.status(404).json({ error: 'Deposit request not found' });
    }

    const targetReq = dbCache.deposits[targetIndex];
    const previousStatus = targetReq.status;

    targetReq.status = status;
    if (status === 'approved') {
      targetReq.approvedAt = Date.now();
    }

    let updatedMember: RegisteredMember | null = null;

    // Credit user's wallet if newly approved
    if (status === 'approved' && previousStatus !== 'approved') {
      const creditTotal = (targetReq.amount || 0) + (targetReq.bonus || 0);

      const memberIndex = dbCache.members.findIndex(
        (m) =>
          m.uid === targetReq.uid ||
          (targetReq.phone && m.phone === targetReq.phone) ||
          (targetReq.userPhone && m.phone === targetReq.userPhone) ||
          (targetReq.username && m.username === targetReq.username)
      );

      if (memberIndex !== -1) {
        const mem = dbCache.members[memberIndex];
        mem.balance = (mem.balance || 0) + creditTotal;
        mem.totalDeposit = (mem.totalDeposit || 0) + (targetReq.amount || 0);
        updatedMember = mem;
        console.log(`[API] Credited ${creditTotal} BDT to member ${mem.username} (New balance: ${mem.balance})`);
      }
    }

    saveDatabase({ ...dbCache });

    res.json({
      success: true,
      deposit: targetReq,
      member: updatedMember,
    });
  } catch (err: any) {
    console.error('Error updating deposit request:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 3. Withdrawal Requests API
app.get('/api/withdrawals', (req, res) => {
  res.json(dbCache.withdrawals);
});

app.post('/api/withdrawals', (req, res) => {
  try {
    const data = req.body as Partial<WithdrawalRequest>;
    if (!data.amount || !data.accountNumber) {
      return res.status(400).json({ error: 'Missing required withdrawal fields' });
    }

    const newReq: WithdrawalRequest = {
      id: data.id || `WTH_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      uid: data.uid || 'UNKNOWN',
      username: data.username || 'Player',
      phone: data.phone || '',
      method: data.method || 'bkash',
      accountNumber: data.accountNumber,
      accountName: data.accountName || 'Member',
      amount: Number(data.amount) || 0,
      status: 'pending',
      createdAt: data.createdAt || Date.now(),
      formattedTime: data.formattedTime || new Date().toLocaleTimeString(),
    };

    // Deduct member balance
    const memberIndex = dbCache.members.findIndex(
      (m) => m.uid === newReq.uid || (newReq.phone && m.phone === newReq.phone)
    );
    if (memberIndex !== -1) {
      const mem = dbCache.members[memberIndex];
      mem.balance = Math.max(0, (mem.balance || 0) - newReq.amount);
    }

    const filtered = dbCache.withdrawals.filter((w) => w.id !== newReq.id);
    const updatedWithdrawals = [newReq, ...filtered].slice(0, 500);

    saveDatabase({
      ...dbCache,
      withdrawals: updatedWithdrawals,
    });

    console.log(`[API] New Withdrawal request: ${newReq.amount} BDT by ${newReq.username}`);
    res.status(201).json({ success: true, withdrawal: newReq });
  } catch (err: any) {
    console.error('Error creating withdrawal request:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Update withdrawal status
app.put('/api/withdrawals/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectReason } = req.body;

    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const targetIndex = dbCache.withdrawals.findIndex((w) => w.id === id);
    if (targetIndex === -1) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    const targetReq = dbCache.withdrawals[targetIndex];
    const previousStatus = targetReq.status;

    targetReq.status = status;
    if (rejectReason) targetReq.rejectReason = rejectReason;
    if (status === 'approved') targetReq.approvedAt = Date.now();

    // If rejected, refund balance to user
    if (status === 'rejected' && previousStatus === 'pending') {
      const memberIndex = dbCache.members.findIndex(
        (m) => m.uid === targetReq.uid || (targetReq.phone && m.phone === targetReq.phone)
      );
      if (memberIndex !== -1) {
        const mem = dbCache.members[memberIndex];
        mem.balance = (mem.balance || 0) + (targetReq.amount || 0);
        console.log(`[API] Refunded ${targetReq.amount} BDT to member ${mem.username}`);
      }
    }

    saveDatabase({ ...dbCache });

    res.json({ success: true, withdrawal: targetReq });
  } catch (err: any) {
    console.error('Error updating withdrawal request:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 4. System Config API (Real-time updates across all devices)
app.get('/api/config', (req, res) => {
  res.json(dbCache.config);
});

app.put('/api/config', (req, res) => {
  try {
    const incoming = req.body;
    const mergedConfig = {
      ...dbCache.config,
      ...incoming,
      gameStatuses: { ...(dbCache.config.gameStatuses || {}), ...(incoming.gameStatuses || {}) },
      gateways: { ...(dbCache.config.gateways || {}), ...(incoming.gateways || {}) },
      commissions: { ...(dbCache.config.commissions || {}), ...(incoming.commissions || {}) },
      marketControl: { ...(dbCache.config.marketControl || {}), ...(incoming.marketControl || {}) },
    };

    saveDatabase({
      ...dbCache,
      config: mergedConfig,
    });

    console.log('[API] System config updated from Admin Panel');
    res.json({ success: true, config: mergedConfig });
  } catch (err: any) {
    console.error('Error updating system config:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 5. Registered Members API
app.get('/api/members', (req, res) => {
  res.json(dbCache.members);
});

app.get('/api/members/:identifier', (req, res) => {
  const { identifier } = req.params;
  const member = dbCache.members.find(
    (m) => m.uid === identifier || m.phone === identifier || m.username === identifier
  );
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json(member);
});

app.post('/api/members', (req, res) => {
  try {
    const member = req.body as RegisteredMember;
    if (!member.uid) return res.status(400).json({ error: 'UID is required' });

    const existingIndex = dbCache.members.findIndex((m) => m.uid === member.uid);
    if (existingIndex !== -1) {
      dbCache.members[existingIndex] = { ...dbCache.members[existingIndex], ...member };
    } else {
      dbCache.members.unshift(member);
    }

    saveDatabase({ ...dbCache });
    res.json({ success: true, member });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/members/:uid', (req, res) => {
  try {
    const { uid } = req.params;
    const updates = req.body;

    const existingIndex = dbCache.members.findIndex((m) => m.uid === uid);
    if (existingIndex === -1) {
      return res.status(404).json({ error: 'Member not found' });
    }

    dbCache.members[existingIndex] = {
      ...dbCache.members[existingIndex],
      ...updates,
    };

    saveDatabase({ ...dbCache });
    res.json({ success: true, member: dbCache.members[existingIndex] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/members/:uid', (req, res) => {
  try {
    const { uid } = req.params;
    dbCache.members = dbCache.members.filter((m) => m.uid !== uid);
    saveDatabase({ ...dbCache });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Live Bets API
app.get('/api/livebets', (req, res) => {
  res.json(dbCache.liveBets || []);
});

app.post('/api/livebets', (req, res) => {
  try {
    const bet = req.body;
    const updated = [bet, ...(dbCache.liveBets || [])].slice(0, 100);
    dbCache.liveBets = updated;
    saveDatabase({ ...dbCache });
    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- VITE / STATIC SERVING -------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Victor-Win Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
