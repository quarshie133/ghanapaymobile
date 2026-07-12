'use client';
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { SectionTitle, Divider, PageWrap } from '@/components/ui/Layout';

const LINKED_ACCOUNTS = [
  { name: 'MTN Mobile Money', acct: '**** 7890', balance: 1200, color: '#FFCB05', badge: 'MoMo' },
  { name: 'Ecobank Ghana',    acct: '**** 3421', balance: 8500, color: '#003087', badge: 'Bank' },
];

const LIMITS = [
  { period: 'Daily',   used: 200,   limit: 5000  },
  { period: 'Weekly',  used: 750,   limit: 20000 },
  { period: 'Monthly', used: 2300,  limit: 80000 },
];

type ModalType = 'add' | 'withdraw' | 'transfer' | null;

export default function WalletPage() {
  const { user } = useAuth();
  const [modal, setModal]   = useState<ModalType>(null);
  const [amount, setAmount] = useState('');
  const [hidden, setHidden] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [limits, setLimits] = useState<any>(null);

  useEffect(() => {
    if (user) {
      api.get('/wallet').then(res => setWallet(res)).catch(() => {});
      api.get('/wallet/limits').then(res => setLimits(res)).catch(() => {});
    }
  }, [user]);

  // Normalise the accounts whether they come from the API (LinkedAccount entity)
  // or from the static mock. API returns: { accountName, maskedNumber, provider, badgeLabel, type }
  // Mock uses: { name, acct, balance, color, badge }
  const rawAccounts = wallet?.linkedAccounts?.length ? wallet.linkedAccounts : LINKED_ACCOUNTS;
  const linkedAccounts = rawAccounts.map((acc: any) => ({
    name:    acc.name    ?? acc.accountName  ?? acc.provider ?? 'Unknown',
    acct:    acc.acct    ?? acc.maskedNumber ?? acc.accountNumber ?? '****',
    balance: acc.balance ?? 0,
    color:   acc.color   ?? (acc.type === 'momo' ? '#FFCB05' : '#003087'),
    badge:   acc.badge   ?? acc.badgeLabel  ?? (acc.type === 'momo' ? 'MoMo' : 'Bank'),
  }));

  const displayLimits = limits ? [
    { period: 'Daily',   used: limits.dailyUsed   ?? 0, limit: limits.dailyLimit   ?? 5000  },
    { period: 'Weekly',  used: limits.weeklyUsed  ?? 0, limit: limits.weeklyLimit  ?? 20000 },
    { period: 'Monthly', used: limits.monthlyUsed ?? 0, limit: limits.monthlyLimit ?? 80000 },
  ] : LIMITS;


  return (
    <PageWrap
      title="Wallet & Accounts"
      subtitle="Manage your GhanaPay wallet, linked accounts, and limits"
      breadcrumb="Wallet"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Wallet Card and Linked Accounts (Span 8) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Main Wallet Card */}
          <div className="rounded-2xl overflow-hidden shadow-lg border border-border-subtle bg-white">
            <div className="bg-gradient-to-br from-primary via-primary-container to-surface-tint p-8 relative overflow-hidden text-white">
              {/* Decorative circles */}
              <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute bottom-[-20px] right-[60px] w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="text-xs font-bold text-white/70 uppercase tracking-widest">
                    GHANAYPAY WALLET
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge label="Tier 2 Verified" type="gold" />
                    <Badge label="Active" type="success" />
                  </div>
                </div>
                <div className="text-3xl">🇬🇭</div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-white/70 mb-2">Available Balance</div>
                <div className="flex items-center gap-4">
                  <span className="font-metric-value text-[40px] leading-none font-black text-white">
                    {hidden ? '₵ ••••••' : `₵${wallet?.balance != null ? Number(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '4,250.00'}`}
                  </span>
                  <button
                    onClick={() => setHidden(!hidden)}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center text-white focus:outline-none"
                  >
                    <span className="material-symbols-outlined">
                      {hidden ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="text-sm text-white/50 tracking-wider mb-2 font-mono">
                {wallet?.walletId || 'GHP-786-9028-5553'}
              </div>
              <div className="text-sm text-tertiary-fixed font-bold">
                {user?.name || 'Abena Mansa'}
              </div>
            </div>

            {/* Actions Panel */}
            <div className="p-6 bg-white grid grid-cols-3 gap-4">
              <Btn variant="primary" onClick={() => setModal('add')} className="w-full">
                <span className="material-symbols-outlined text-[18px] mr-1">arrow_downward</span>
                Add Money
              </Btn>
              <Btn variant="secondary" onClick={() => setModal('withdraw')} className="w-full">
                <span className="material-symbols-outlined text-[18px] mr-1">arrow_upward</span>
                Withdraw
              </Btn>
              <Btn variant="ghost" onClick={() => setModal('transfer')} className="w-full">
                <span className="material-symbols-outlined text-[18px] mr-1">swap_horiz</span>
                Transfer
              </Btn>
            </div>
          </div>

          {/* Linked Accounts */}
          <Card>
            <SectionTitle
              action={
                <Btn size="sm" variant="secondary">
                  + Link Account
                </Btn>
              }
            >
              Linked Accounts
            </SectionTitle>

            <div className="space-y-4">
              {linkedAccounts.map((acc: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border-subtle hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">
                      {acc.badge === 'MoMo' ? 'smartphone' : 'account_balance'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-primary">{acc.name}</div>
                    <div className="text-xs text-secondary flex items-center gap-2 mt-0.5">
                      <span>{acc.acct}</span>
                      <Badge label={acc.badge} type="navy" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-primary">
                      ₵{(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-secondary">Available</div>
                  </div>
                </div>
              ))}

              <button className="w-full py-4 border-2 border-dashed border-border-subtle rounded-xl text-center text-sm font-bold text-primary hover:border-primary hover:bg-surface-container-low transition-all focus:outline-none">
                ＋ Link New Account
              </button>
            </div>
          </Card>
        </div>

        {/* Right Side: Limits and Stats (Span 4) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Limits */}
          <Card>
            <SectionTitle>Transaction Limits</SectionTitle>
            <div className="space-y-4">
              {displayLimits.map((l: any, i: number) => {
                const pct = l.limit > 0 ? Math.round((l.used / l.limit) * 100) : 0;
                const colorClass = pct > 80 ? 'bg-error' : pct > 50 ? 'bg-[#D35400]' : 'bg-success';
                const textClass = pct > 80 ? 'text-error' : pct > 50 ? 'text-[#D35400]' : 'text-success';

                return (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-primary">{l.period} Limit</span>
                      <span className="text-secondary font-semibold">
                        ₵{l.used.toLocaleString()} / ₵{l.limit.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-2">
                      <div className={`h-2 rounded-full ${colorClass} transition-all`} style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className={`text-[11px] font-bold ${textClass}`}>
                      {pct}% used
                    </div>
                  </div>
                );
              })}
            </div>
            <Divider />
            <p className="text-xs text-secondary leading-relaxed">
              Upgrade to <strong>Tier 3</strong> to unlock higher monthly limits up to ₵500,000.
            </p>
            <Btn size="sm" variant="gold" className="w-full mt-4 justify-center">
              Upgrade Tier →
            </Btn>
          </Card>

          {/* This Month Stats */}
          <Card>
            <SectionTitle>This Month</SectionTitle>
            <div className="space-y-4">
              {[
                { label: 'Total Spent', val: '₵2,000.00', icon: 'payments', textClass: 'text-error' },
                { label: 'Total Received', val: '₵5,300.00', icon: 'call_received', textClass: 'text-success' },
                { label: 'Bills Paid', val: '₵340.00', icon: 'receipt_long', textClass: 'text-[#D35400]' },
                { label: 'Airtime', val: '₵50.00', icon: 'smartphone', textClass: 'text-primary' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">{s.icon}</span>
                    <span className="text-sm font-semibold text-secondary">{s.label}</span>
                  </div>
                  <span className={`text-base font-extrabold ${s.textClass}`}>{s.val}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Action Modals */}
      {modal && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-border-subtle p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-section-title text-section-title text-primary capitalize flex items-center gap-2">
                <span className="material-symbols-outlined">
                  {modal === 'add' ? 'arrow_downward' : modal === 'withdraw' ? 'arrow_upward' : 'swap_horiz'}
                </span>
                {modal === 'add' ? 'Add Money' : modal === 'withdraw' ? 'Withdraw Funds' : 'Transfer Funds'}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="text-secondary hover:text-primary transition-colors focus:outline-none"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setModal(null);
              }}
              className="space-y-4"
            >
              <Input
                label="Amount (₵)"
                placeholder="0.00"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {modal !== 'add' && (
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                    Destination Account
                  </label>
                  <select className="w-full h-11 border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white">
                    <option>MTN Mobile Money (**** 7890)</option>
                    <option>Ecobank Ghana (**** 3421)</option>
                  </select>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <Btn variant="secondary" onClick={() => setModal(null)} className="flex-1">
                  Cancel
                </Btn>
                <Btn type="submit" className="flex-1">
                  Confirm
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrap>
  );
}
