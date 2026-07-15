// ─── Wallet Entity ─────────────────────────────────────────────────────────

export interface LinkedAccount {
  id: string;
  type: 'momo' | 'bank';
  accountName: string;
  accountNumber: string;
  maskedNumber: string;
  provider: string;
  badgeLabel: string;
  isDefault: boolean;
  isVerified: boolean;
  walletId: string;
  createdAt: string;
}

export interface WalletData {
  id: string;
  accountNumber: string;
  balance: number;
  tier: number;
  isActive: boolean;
  currency: string;
  dailySent: number;
  weeklySent: number;
  monthlySent: number;
  dailyReceived: number;
  userId: string;
  linkedAccounts: LinkedAccount[];
  createdAt: string;
  updatedAt: string;
}

// ─── Limits ────────────────────────────────────────────────────────────────

export interface LimitPeriod {
  used: number;
  limit: number;
  percentage: number;
  remaining: number;
}

export interface WalletLimits {
  tier: number;
  daily: LimitPeriod;
  weekly: LimitPeriod;
  monthly: LimitPeriod;
  balanceCap: number | null;
  receivePerDay: number;
}

// ─── Monthly Summary ────────────────────────────────────────────────────────

export interface WalletSummary {
  totalSpent: number;
  totalReceived: number;
  totalBills: number;
  totalAirtime: number;
  transactionCount: number;
  monthLabel: string;
}

// ─── Transaction History ────────────────────────────────────────────────────

export type WalletTxType =
  | 'sent'
  | 'received'
  | 'transfer'
  | 'topup'
  | 'withdrawal'
  | 'bill'
  | 'airtime'
  | 'bulk';

export interface WalletTransaction {
  id: string;
  ref: string;
  type: string;
  category: string;
  amount: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed' | 'reversed' | 'flagged';
  method: string | null;
  note: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  createdAt: string;
}

export interface PaginatedTransactions {
  data: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ─── Request Payloads ────────────────────────────────────────────────────────

export interface TopupPayload {
  amount: number;
  sourceAccountId: string;
  idempotencyKey?: string;
}

export interface WithdrawPayload {
  amount: number;
  destinationAccountId: string;
  idempotencyKey?: string;
}

export interface TransferPayload {
  amount: number;
  destinationAccountId: string;
  note?: string;
}

export interface LinkAccountPayload {
  type: 'momo' | 'bank';
  provider: string;
  accountNumber: string;
  accountName: string;
}
