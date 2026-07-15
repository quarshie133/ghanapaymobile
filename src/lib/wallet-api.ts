/**
 * Typed API client for the GhanaPay Wallet module.
 * All methods unwrap the standard { success, data } response envelope.
 */
import { api } from './api';
import type {
  WalletData,
  WalletLimits,
  WalletSummary,
  PaginatedTransactions,
  TopupPayload,
  WithdrawPayload,
  TransferPayload,
  LinkAccountPayload,
  LinkedAccount,
} from '@/types/wallet';

// ─── Read ───────────────────────────────────────────────────────────────────

export async function getWallet(): Promise<WalletData> {
  return api.get('/wallet') as Promise<WalletData>;
}

export async function getWalletLimits(): Promise<WalletLimits> {
  return api.get('/wallet/limits') as Promise<WalletLimits>;
}

export async function getWalletSummary(): Promise<WalletSummary> {
  return api.get('/wallet/summary') as Promise<WalletSummary>;
}

export async function getWalletTransactions(
  page = 1,
  limit = 15,
  type?: string,
): Promise<PaginatedTransactions> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (type && type !== 'all') params.set('type', type);
  return api.get(`/wallet/transactions?${params.toString()}`) as Promise<PaginatedTransactions>;
}

// ─── Write ──────────────────────────────────────────────────────────────────

export async function topupWallet(payload: TopupPayload) {
  return api.post('/wallet/topup', payload);
}

export async function withdrawFromWallet(payload: WithdrawPayload) {
  return api.post('/wallet/withdraw', payload);
}

export async function transferFromWallet(payload: TransferPayload) {
  return api.post('/wallet/transfer', payload);
}

// ─── Linked Accounts ────────────────────────────────────────────────────────

export async function linkNewAccount(payload: LinkAccountPayload): Promise<LinkedAccount> {
  return api.post('/wallet/link-account', payload) as Promise<LinkedAccount>;
}

export async function unlinkAccount(accountId: string): Promise<void> {
  return api.delete(`/wallet/linked-accounts/${accountId}`) as Promise<void>;
}

export async function setDefaultAccount(accountId: string): Promise<LinkedAccount> {
  return api.put(`/wallet/linked-accounts/${accountId}/set-default`, {}) as Promise<LinkedAccount>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate a client-side idempotency key for a transaction. */
export function generateIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
