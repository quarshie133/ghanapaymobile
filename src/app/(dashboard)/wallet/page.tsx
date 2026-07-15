/* eslint-disable */
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import {
  getWallet,
  getWalletLimits,
  getWalletSummary,
  getWalletTransactions,
  topupWallet,
  withdrawFromWallet,
  transferFromWallet,
  linkNewAccount,
  unlinkAccount,
  setDefaultAccount,
  generateIdempotencyKey,
} from '@/lib/wallet-api';
import type {
  WalletData,
  WalletLimits,
  WalletSummary,
  PaginatedTransactions,
  LinkedAccount,
  WalletTransaction,
} from '@/types/wallet';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { SectionTitle, Divider, PageWrap } from '@/components/ui/Layout';
import Toast from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';

// ─── Types ──────────────────────────────────────────────────────────────────

type ModalType = 'topup' | 'withdraw' | 'transfer' | 'link' | 'unlink' | null;

type FilterTab = 'all' | 'sent' | 'received' | 'topup' | 'withdrawal' | 'bills' | 'airtime';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<number, string> = {
  1: 'Tier 1',
  2: 'Tier 2 Verified',
  3: 'Tier 3 Premium',
};

const TX_FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'topup', label: 'Top-up' },
  { key: 'withdrawal', label: 'Withdrawals' },
  { key: 'sent', label: 'Sent' },
  { key: 'received', label: 'Received' },
  { key: 'bills', label: 'Bills' },
  { key: 'airtime', label: 'Airtime' },
];

/** Icon for transaction type */
function txIcon(type: string): string {
  switch (type?.toLowerCase()) {
    case 'topup': return 'add_card';
    case 'withdrawal': return 'arrow_upward';
    case 'sent':
    case 'transfer': return 'send';
    case 'received': return 'call_received';
    case 'bill': return 'receipt_long';
    case 'airtime': return 'smartphone';
    case 'bulk': return 'layers';
    default: return 'swap_horiz';
  }
}

/** Color class for transaction icon badge */
function txColor(type: string): string {
  switch (type?.toLowerCase()) {
    case 'topup':
    case 'received': return 'bg-emerald-100 text-emerald-600';
    case 'withdrawal':
    case 'sent':
    case 'transfer': return 'bg-red-50 text-red-500';
    case 'bill': return 'bg-amber-100 text-amber-600';
    case 'airtime': return 'bg-blue-100 text-blue-600';
    default: return 'bg-surface-container text-secondary';
  }
}

/** Whether a transaction is a debit (negative) for the user */
function isDebit(type: string): boolean {
  return ['sent', 'transfer', 'withdrawal', 'bill', 'airtime', 'bulk'].includes(type?.toLowerCase());
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function WalletPage() {
  const { user } = useAuth();

  // ── Core data ──
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [limits, setLimits] = useState<WalletLimits | null>(null);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [txData, setTxData] = useState<PaginatedTransactions | null>(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);

  // ── UI state ──
  const [hidden, setHidden] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<LinkedAccount | null>(null);
  const [txFilter, setTxFilter] = useState<FilterTab>('all');
  const [txPage, setTxPage] = useState(1);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Form state ──
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [note, setNote] = useState('');
  const [linkForm, setLinkForm] = useState({
    type: 'momo' as 'momo' | 'bank',
    provider: '',
    accountNumber: '',
    accountName: '',
  });
  const [amountError, setAmountError] = useState('');

  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    setToast({ message, type });
  }, []);

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const fetchWalletData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [w, l, s] = await Promise.all([
        getWallet().catch(() => null),
        getWalletLimits().catch(() => null),
        getWalletSummary().catch(() => null),
      ]);
      if (w) setWallet(w);
      if (l) setLimits(l);
      if (s) setSummary(s);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTransactions = useCallback(async (filter: FilterTab, page: number) => {
    if (!user) return;
    setTxLoading(true);
    try {
      const res = await getWalletTransactions(page, 10, filter === 'all' ? undefined : filter);
      setTxData(res);
    } catch {
      // Keep existing data if fetch fails
    } finally {
      setTxLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchWalletData(); }, [fetchWalletData]);
  useEffect(() => { fetchTransactions(txFilter, txPage); }, [fetchTransactions, txFilter, txPage]);

  // Auto-select first linked account when modal opens
  useEffect(() => {
    if (modal && wallet?.linkedAccounts?.length) {
      const def = wallet.linkedAccounts.find((a) => a.isDefault) || wallet.linkedAccounts[0];
      setSelectedAccountId(def.id);
    }
    setAmount('');
    setNote('');
    setAmountError('');
    setLinkForm({ type: 'momo', provider: '', accountNumber: '', accountName: '' });
  }, [modal, wallet?.linkedAccounts]);

  // ─── Validation ───────────────────────────────────────────────────────────

  const validateAmount = useCallback((val: string): boolean => {
    const n = parseFloat(val);
    if (!val || isNaN(n)) { setAmountError('Please enter a valid amount'); return false; }
    if (n < 1) { setAmountError('Minimum amount is ₵1.00'); return false; }
    if (modal !== 'topup' && wallet && n > Number(wallet.balance)) {
      setAmountError(`Insufficient balance. Available: ${formatCurrency(Number(wallet.balance))}`);
      return false;
    }
    if (modal !== 'withdraw' && limits) {
      const remaining = limits.daily.remaining;
      if (n > remaining) {
        setAmountError(`Exceeds daily limit. Remaining: ${formatCurrency(remaining)}`);
        return false;
      }
    }
    setAmountError('');
    return true;
  }, [modal, wallet, limits]);

  // ─── Form Handlers ────────────────────────────────────────────────────────

  const handleTopup = async () => {
    if (!validateAmount(amount) || !selectedAccountId) return;
    setSubmitting(true);
    try {
      await topupWallet({
        amount: parseFloat(amount),
        sourceAccountId: selectedAccountId,
        idempotencyKey: generateIdempotencyKey('topup'),
      });
      showToast(`₵${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} added to your wallet!`);
      setModal(null);
      await fetchWalletData();
      await fetchTransactions(txFilter, 1);
      setTxPage(1);
    } catch (err: any) {
      showToast(err?.message || 'Top-up failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!validateAmount(amount) || !selectedAccountId) return;
    setSubmitting(true);
    try {
      await withdrawFromWallet({
        amount: parseFloat(amount),
        destinationAccountId: selectedAccountId,
        idempotencyKey: generateIdempotencyKey('withdraw'),
      });
      showToast('Withdrawal successful!');
      setModal(null);
      await fetchWalletData();
      await fetchTransactions(txFilter, 1);
      setTxPage(1);
    } catch (err: any) {
      showToast(err?.message || 'Withdrawal failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async () => {
    if (!validateAmount(amount) || !selectedAccountId) return;
    setSubmitting(true);
    try {
      await transferFromWallet({
        amount: parseFloat(amount),
        destinationAccountId: selectedAccountId,
        note: note || undefined,
      });
      showToast('Transfer successful!');
      setModal(null);
      await fetchWalletData();
      await fetchTransactions(txFilter, 1);
      setTxPage(1);
    } catch (err: any) {
      showToast(err?.message || 'Transfer failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkAccount = async () => {
    const { type, provider, accountNumber, accountName } = linkForm;
    if (!provider || !accountNumber || !accountName) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await linkNewAccount({ type, provider, accountNumber, accountName });
      showToast('Account linked successfully!');
      setModal(null);
      await fetchWalletData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to link account.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlink = async () => {
    if (!unlinkTarget) return;
    setSubmitting(true);
    try {
      await unlinkAccount(unlinkTarget.id);
      showToast('Account unlinked.');
      setModal(null);
      setUnlinkTarget(null);
      await fetchWalletData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to unlink account.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      await setDefaultAccount(accountId);
      showToast('Default account updated.');
      await fetchWalletData();
    } catch {
      showToast('Failed to update default account.', 'error');
    }
  };

  // ─── Derived UI Data ─────────────────────────────────────────────────────

  const displayBalance = wallet?.balance != null ? Number(wallet.balance) : null;
  const linkedAccounts = wallet?.linkedAccounts ?? [];
  const defaultAccount = linkedAccounts.find((a) => a.isDefault) ?? linkedAccounts[0];

  const limitPeriods = limits
    ? [
        { period: 'Daily', data: limits.daily },
        { period: 'Weekly', data: limits.weekly },
        { period: 'Monthly', data: limits.monthly },
      ]
    : [
        { period: 'Daily', data: { used: 0, limit: 5000, percentage: 0, remaining: 5000 } },
        { period: 'Weekly', data: { used: 0, limit: 35000, percentage: 0, remaining: 35000 } },
        { period: 'Monthly', data: { used: 0, limit: 80000, percentage: 0, remaining: 80000 } },
      ];

  const monthStats = [
    {
      label: 'Total Spent',
      val: summary ? formatCurrency(summary.totalSpent) : '₵0.00',
      icon: 'payments',
      textClass: 'text-error',
      bgClass: 'bg-red-50',
    },
    {
      label: 'Total Received',
      val: summary ? formatCurrency(summary.totalReceived) : '₵0.00',
      icon: 'call_received',
      textClass: 'text-success',
      bgClass: 'bg-emerald-50',
    },
    {
      label: 'Bills Paid',
      val: summary ? formatCurrency(summary.totalBills) : '₵0.00',
      icon: 'receipt_long',
      textClass: 'text-amber-600',
      bgClass: 'bg-amber-50',
    },
    {
      label: 'Airtime & Data',
      val: summary ? formatCurrency(summary.totalAirtime) : '₵0.00',
      icon: 'smartphone',
      textClass: 'text-primary',
      bgClass: 'bg-blue-50',
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <PageWrap
      title="Wallet & Accounts"
      subtitle="Manage your GhanaPay wallet, linked accounts, and spending limits"
      breadcrumb="Wallet"
    >
      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left column (8 cols) ── */}
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* ── Main Wallet Card ── */}
          <div className="rounded-2xl overflow-hidden shadow-xl border border-border-subtle">
            {/* Gradient Header */}
            <div className="bg-gradient-to-br from-[#020259] via-[#0a0a7a] to-[#1b1b6b] p-8 relative overflow-hidden">
              {/* Decorative blobs */}
              <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute bottom-[-24px] right-[70px] w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute top-1/2 left-[-30px] w-40 h-40 rounded-full bg-white/3 pointer-events-none" />

              {/* Top row: tier + flag */}
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <div className="text-[10px] font-bold text-white/60 uppercase tracking-[3px] mb-2">
                    GHANAPAY WALLET
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                      <span className="material-symbols-outlined text-[13px]">workspace_premium</span>
                      {TIER_LABELS[wallet?.tier ?? 2]}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      Active
                    </span>
                  </div>
                </div>
                <div className="text-4xl select-none">🇬🇭</div>
              </div>

              {/* Balance */}
              <div className="mb-6 relative z-10">
                <div className="text-xs text-white/60 mb-2 font-medium tracking-wider uppercase">
                  Available Balance
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black text-[42px] leading-none text-white tracking-tight">
                    {loading
                      ? '₵ ——'
                      : hidden
                      ? '₵ ••••••'
                      : displayBalance !== null
                      ? `₵${displayBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      : '₵ 0.00'}
                  </span>
                  <button
                    onClick={() => setHidden(!hidden)}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center text-white focus:outline-none"
                    aria-label="Toggle balance visibility"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {hidden ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {limits && (
                  <div className="mt-3 flex items-center gap-2 text-white/50 text-xs">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    <span>
                      Daily remaining: <strong className="text-white/80">{formatCurrency(limits.daily.remaining)}</strong>
                      {limits.balanceCap && (
                        <> &nbsp;·&nbsp; Balance cap: <strong className="text-white/80">{formatCurrency(limits.balanceCap)}</strong></>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Account number + name */}
              <div className="flex items-end justify-between relative z-10">
                <div>
                  <div className="font-mono text-sm text-white/50 tracking-widest mb-1">
                    {wallet?.accountNumber || 'GHP-786-9028-5553'}
                  </div>
                  <div className="text-sm text-white/80 font-bold">{user?.name || 'Account Holder'}</div>
                </div>
                {defaultAccount && (
                  <div className="text-right">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Default Account</div>
                    <div className="text-xs text-white/70 font-semibold">
                      {defaultAccount.provider} · {defaultAccount.maskedNumber}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white p-5 grid grid-cols-3 gap-3 border-t border-border-subtle">
              <button
                onClick={() => setModal('topup')}
                className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-500 transition-all duration-200 cursor-pointer border border-emerald-100 hover:border-emerald-500 hover:shadow-lg"
              >
                <span className="material-symbols-outlined text-emerald-600 group-hover:text-white text-2xl transition-colors">add_card</span>
                <span className="text-xs font-bold text-emerald-700 group-hover:text-white transition-colors">Add Money</span>
              </button>
              <button
                onClick={() => setModal('withdraw')}
                className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-orange-50 hover:bg-orange-500 transition-all duration-200 cursor-pointer border border-orange-100 hover:border-orange-500 hover:shadow-lg"
              >
                <span className="material-symbols-outlined text-orange-500 group-hover:text-white text-2xl transition-colors">arrow_upward</span>
                <span className="text-xs font-bold text-orange-600 group-hover:text-white transition-colors">Withdraw</span>
              </button>
              <button
                onClick={() => setModal('transfer')}
                className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-600 transition-all duration-200 cursor-pointer border border-blue-100 hover:border-blue-600 hover:shadow-lg"
              >
                <span className="material-symbols-outlined text-blue-600 group-hover:text-white text-2xl transition-colors">swap_horiz</span>
                <span className="text-xs font-bold text-blue-700 group-hover:text-white transition-colors">Transfer</span>
              </button>
            </div>
          </div>

          {/* ── Linked Accounts ── */}
          <Card>
            <SectionTitle
              action={
                <Btn size="sm" variant="secondary" onClick={() => setModal('link')}>
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  Link Account
                </Btn>
              }
            >
              Linked Accounts
            </SectionTitle>

            <div className="space-y-3">
              {linkedAccounts.length === 0 && !loading && (
                <div className="py-8 text-center text-secondary text-sm">
                  No linked accounts yet. Add a bank or MoMo account to get started.
                </div>
              )}
              {linkedAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border-subtle hover:bg-surface-container-low transition-colors group"
                >
                  {/* Icon */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${acc.type === 'momo' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-700'}`}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {acc.type === 'momo' ? 'smartphone' : 'account_balance'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-primary truncate">{acc.provider}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${acc.type === 'momo' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}
                      >
                        {acc.badgeLabel}
                      </span>
                      {acc.isDefault && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                          Default
                        </span>
                      )}
                      {acc.isVerified && (
                        <span className="material-symbols-outlined text-emerald-500 text-sm">verified</span>
                      )}
                    </div>
                    <div className="text-xs text-secondary mt-0.5">
                      {acc.accountName} · {acc.maskedNumber}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!acc.isDefault && (
                      <button
                        onClick={() => handleSetDefault(acc.id)}
                        className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-primary transition-colors"
                        title="Set as default"
                      >
                        <span className="material-symbols-outlined text-[16px]">star</span>
                      </button>
                    )}
                    <button
                      onClick={() => { setUnlinkTarget(acc); setModal('unlink'); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-secondary hover:text-error transition-colors"
                      title="Unlink"
                    >
                      <span className="material-symbols-outlined text-[16px]">link_off</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Add new button */}
              <button
                onClick={() => setModal('link')}
                className="w-full py-4 border-2 border-dashed border-border-subtle rounded-xl text-center text-sm font-bold text-secondary hover:border-primary hover:text-primary hover:bg-surface-container-low transition-all focus:outline-none"
              >
                <span className="material-symbols-outlined align-middle text-[16px] mr-1">add_circle</span>
                Link New Account
              </button>
            </div>
          </Card>

          {/* ── Transaction History ── */}
          <Card>
            <SectionTitle>Recent Transactions</SectionTitle>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap mb-4">
              {TX_FILTER_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setTxFilter(key); setTxPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 focus:outline-none ${
                    txFilter === key
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-container-low text-secondary hover:bg-surface-container'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Transaction List */}
            <div className="space-y-2">
              {txLoading && (
                <div className="py-8 text-center text-secondary text-sm animate-pulse">
                  Loading transactions…
                </div>
              )}
              {!txLoading && txData?.data.length === 0 && (
                <div className="py-8 text-center text-secondary text-sm">
                  No transactions found.
                </div>
              )}
              {!txLoading && txData?.data.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container-low transition-colors group"
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${txColor(tx.type)}`}>
                    <span className="material-symbols-outlined text-[18px]">{txIcon(tx.type)}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-primary truncate">
                      {tx.recipientName || tx.category}
                    </div>
                    <div className="text-xs text-secondary flex items-center gap-1 mt-0.5">
                      <span>{new Date(tx.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}</span>
                      <span>·</span>
                      <span>{tx.method || tx.category}</span>
                      {tx.note && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[120px]">{tx.note}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount + status */}
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-extrabold ${isDebit(tx.type) ? 'text-error' : 'text-success'}`}>
                      {isDebit(tx.type) ? '-' : '+'}{formatCurrency(tx.amount)}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        tx.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : tx.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {txData && txData.pages > 1 && (
              <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between">
                <span className="text-xs text-secondary">
                  Page {txData.page} of {txData.pages} · {txData.total} transactions
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={txPage <= 1}
                    onClick={() => setTxPage((p) => p - 1)}
                    className="w-8 h-8 rounded-lg border border-border-subtle flex items-center justify-center text-secondary hover:text-primary hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  </button>
                  {Array.from({ length: Math.min(txData.pages, 5) }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setTxPage(n)}
                      className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all ${
                        n === txPage
                          ? 'bg-primary text-white border-primary'
                          : 'border-border-subtle text-secondary hover:bg-surface-container'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    disabled={txPage >= txData.pages}
                    onClick={() => setTxPage((p) => p + 1)}
                    className="w-8 h-8 rounded-lg border border-border-subtle flex items-center justify-center text-secondary hover:text-primary hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ── Right column (4 cols) ── */}
        <div className="col-span-12 lg:col-span-4 space-y-6">

          {/* ── Transaction Limits ── */}
          <Card>
            <SectionTitle>Transaction Limits</SectionTitle>
            <div className="space-y-5">
              {limitPeriods.map(({ period, data }) => {
                const pct = data.percentage ?? (data.limit > 0 ? Math.round((data.used / data.limit) * 100) : 0);
                const colorClass = pct > 80 ? 'bg-error' : pct > 50 ? 'bg-amber-500' : 'bg-success';
                const textClass = pct > 80 ? 'text-error' : pct > 50 ? 'text-amber-600' : 'text-success';
                return (
                  <div key={period} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-primary">{period} Limit</span>
                      <span className="text-secondary font-semibold">
                        {formatCurrency(data.used)} / {formatCurrency(data.limit)}
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${colorClass} transition-all duration-700 ease-out`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-[11px] font-bold ${textClass}`}>{pct}% used</span>
                      <span className="text-[11px] text-secondary">
                        {formatCurrency(data.remaining)} remaining
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <Divider />

            <div className="space-y-3">
              <p className="text-xs text-secondary leading-relaxed">
                {limits?.tier === 3
                  ? 'You have the highest tier with maximum limits.'
                  : `Upgrade to Tier ${(limits?.tier ?? 1) + 1} to unlock higher limits and balance caps.`}
              </p>
              {limits && limits.tier < 3 && (
                <Btn size="sm" variant="gold" className="w-full justify-center">
                  <span className="material-symbols-outlined text-[15px]">workspace_premium</span>
                  Upgrade Tier →
                </Btn>
              )}
            </div>
          </Card>

          {/* ── This Month ── */}
          <Card>
            <SectionTitle>
              {summary?.monthLabel || 'This Month'}
            </SectionTitle>
            <div className="space-y-2">
              {monthStats.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-border-subtle transition-all duration-200 ${s.bgClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg opacity-70">{s.icon}</span>
                    <span className="text-sm font-semibold text-secondary">{s.label}</span>
                  </div>
                  <span className={`text-base font-extrabold ${s.textClass}`}>{s.val}</span>
                </div>
              ))}
            </div>

            {summary && (
              <>
                <Divider />
                <div className="text-xs text-secondary text-center">
                  {summary.transactionCount} transactions this month
                </div>
              </>
            )}
          </Card>

          {/* ── Quick Stats ── */}
          <Card className="bg-gradient-to-br from-primary to-[#1b1b8a] text-white border-0">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-amber-300">auto_awesome</span>
              </div>
              <div>
                <div className="font-bold text-sm mb-0.5">Wallet Health</div>
                <div className="text-white/70 text-xs">Your wallet is in good standing.</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Balance',
                  val: displayBalance !== null ? formatCurrency(displayBalance) : '—',
                  icon: 'account_balance_wallet',
                },
                {
                  label: 'Tier',
                  val: `Tier ${wallet?.tier ?? '—'}`,
                  icon: 'workspace_premium',
                },
                {
                  label: 'Accounts',
                  val: linkedAccounts.length.toString(),
                  icon: 'credit_card',
                },
                {
                  label: 'Limit Used',
                  val: limits ? `${limits.monthly.percentage}%` : '—',
                  icon: 'donut_small',
                },
              ].map((item, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[14px] text-white/60">{item.icon}</span>
                    <span className="text-[10px] text-white/60 uppercase tracking-wide">{item.label}</span>
                  </div>
                  <div className="text-sm font-bold text-white">{item.val}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Modals ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={modal !== null}
        onClose={() => setModal(null)}
        title={
          modal === 'topup' ? 'Add Money' :
          modal === 'withdraw' ? 'Withdraw Funds' :
          modal === 'transfer' ? 'Transfer Funds' :
          modal === 'link' ? 'Link New Account' :
          'Unlink Account'
        }
        size="md"
      >
        <div className="space-y-4 -mt-2">

          {/* ── Topup Modal ── */}
          {modal === 'topup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                  Source Account
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full h-11 border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                >
                  {linkedAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.provider} ({acc.maskedNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Input
                  label="Amount (₵)"
                  placeholder="0.00"
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); validateAmount(e.target.value); }}
                />
                {amountError && <p className="text-xs text-error mt-1">{amountError}</p>}
                {limits && (
                  <p className="text-xs text-secondary mt-1">
                    Balance cap remaining: {formatCurrency(limits.balanceCap ? Math.max(0, limits.balanceCap - (displayBalance ?? 0)) : Infinity)}
                  </p>
                )}
              </div>
            </>
          )}

          {/* ── Withdraw / Transfer Modal ── */}
          {(modal === 'withdraw' || modal === 'transfer') && (
            <>
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                  Destination Account
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full h-11 border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                >
                  {linkedAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.provider} ({acc.maskedNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Input
                  label="Amount (₵)"
                  placeholder="0.00"
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); validateAmount(e.target.value); }}
                />
                {amountError && <p className="text-xs text-error mt-1">{amountError}</p>}
                {displayBalance !== null && (
                  <p className="text-xs text-secondary mt-1">
                    Available: {formatCurrency(displayBalance)}
                  </p>
                )}
              </div>
              {modal === 'transfer' && (
                <div>
                  <Input
                    label="Note (optional)"
                    placeholder="e.g. Monthly rent"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {/* ── Link Account Modal ── */}
          {modal === 'link' && (
            <>
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['momo', 'bank'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setLinkForm((f) => ({ ...f, type: t }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        linkForm.type === t
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border-subtle text-secondary hover:border-primary/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {t === 'momo' ? 'smartphone' : 'account_balance'}
                      </span>
                      <span className="text-sm font-bold">{t === 'momo' ? 'MoMo' : 'Bank'}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label="Provider"
                placeholder={linkForm.type === 'momo' ? 'e.g. MTN Mobile Money' : 'e.g. GCB Bank'}
                value={linkForm.provider}
                onChange={(e) => setLinkForm((f) => ({ ...f, provider: e.target.value }))}
              />
              <Input
                label={linkForm.type === 'momo' ? 'Mobile Number' : 'Account Number'}
                placeholder={linkForm.type === 'momo' ? '0244567890' : '1234567890'}
                value={linkForm.accountNumber}
                onChange={(e) => setLinkForm((f) => ({ ...f, accountNumber: e.target.value }))}
              />
              <Input
                label="Account Holder Name"
                placeholder="e.g. Abena Owusu"
                value={linkForm.accountName}
                onChange={(e) => setLinkForm((f) => ({ ...f, accountName: e.target.value }))}
              />
            </>
          )}

          {/* ── Unlink Confirmation ── */}
          {modal === 'unlink' && unlinkTarget && (
            <div className="py-2">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 mb-4">
                <span className="material-symbols-outlined text-error text-2xl">warning</span>
                <div>
                  <div className="text-sm font-bold text-error">Confirm Unlink</div>
                  <div className="text-xs text-secondary mt-0.5">
                    Remove <strong>{unlinkTarget.provider}</strong> ({unlinkTarget.maskedNumber}) from your wallet?
                  </div>
                </div>
              </div>
              <p className="text-xs text-secondary">
                This action cannot be undone. Scheduled payments using this account may be affected.
              </p>
            </div>
          )}

          {/* ── Action Buttons ── */}
          <div className="flex gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setModal(null)} className="flex-1" disabled={submitting}>
              Cancel
            </Btn>
            <Btn
              className="flex-1"
              variant={modal === 'unlink' ? 'danger' : 'primary'}
              disabled={submitting || (modal !== 'link' && modal !== 'unlink' && (!amount || !!amountError))}
              onClick={
                modal === 'topup' ? handleTopup :
                modal === 'withdraw' ? handleWithdraw :
                modal === 'transfer' ? handleTransfer :
                modal === 'link' ? handleLinkAccount :
                handleUnlink
              }
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Processing…
                </span>
              ) : (
                modal === 'topup' ? 'Add Money' :
                modal === 'withdraw' ? 'Withdraw' :
                modal === 'transfer' ? 'Transfer' :
                modal === 'link' ? 'Link Account' :
                'Yes, Unlink'
              )}
            </Btn>
          </div>
        </div>
      </Modal>
    </PageWrap>
  );
}
