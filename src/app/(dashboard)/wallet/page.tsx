'use client';
import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { SectionTitle, Divider, PageWrap } from '@/components/ui/Layout';
import {
  FaMobileScreen, FaBuildingColumns, FaArrowDown, FaArrowUp, FaArrowRightArrowLeft,
  FaMoneyBillTransfer, FaDownload, FaFileInvoiceDollar, FaSatelliteDish, FaEye, FaEyeSlash, FaCediSign
} from 'react-icons/fa6';
import T from '@/lib/tokens';

const LINKED_ACCOUNTS = [
  { name: 'MTN Mobile Money', icon: <FaMobileScreen />, acct: '**** 7890', balance: 1200, color: '#FFCB05', badge: 'MoMo' },
  { name: 'Ecobank Ghana',    icon: <FaBuildingColumns />, acct: '**** 3421', balance: 8500, color: '#003087', badge: 'Bank' },
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

  React.useEffect(() => {
    if (user) {
      api.get('/wallet').then(res => setWallet(res)).catch(() => {});
      api.get('/wallet/limits').then(res => setLimits(res)).catch(() => {});
    }
  }, [user]);

  const displayLimits = limits ? [
    { period: 'Daily',   used: limits.dailyUsed,   limit: limits.dailyLimit  },
    { period: 'Weekly',  used: limits.weeklyUsed,  limit: limits.weeklyLimit },
    { period: 'Monthly', used: limits.monthlyUsed, limit: limits.monthlyLimit },
  ] : LIMITS;

  const linkedAccounts = wallet?.linkedAccounts || LINKED_ACCOUNTS;

  return (
    <PageWrap title="Wallet & Accounts" subtitle="Manage your GhanaPay wallet, linked accounts, and limits">
      <style>{`.trow:hover { background: ${T.tableHover} !important; } .acc-row:hover { background: ${T.surfaceLow} !important; }`}</style>

      <div className="wallet-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Main Wallet Card */}
          <div style={{
            borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(2,2,89,0.18)',
          }}>
            {/* Gold gradient top */}
            <div style={{
              background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyMid} 50%, ${T.navyLight} 100%)`,
              padding: '32px 28px', position: 'relative', overflow: 'hidden',
            }}>
              {/* Decorative circles */}
              <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(206,166,44,0.1)' }} />
              <div style={{ position: 'absolute', bottom: -20, right: 60, width: 100, height: 100, borderRadius: '50%', background: 'rgba(206,166,44,0.07)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: 1 }}>GHANAYPAY WALLET</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Badge label="Tier 2 Verified" type="gold" />
                    <Badge label="Active" type="success" />
                  </div>
                </div>
                <div style={{ fontSize: 28, opacity: 0.9 }}>🇬🇭</div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Available Balance</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>
                    {hidden ? '₵ ••••••' : `₵${wallet?.balance?.toFixed(2) || '0.00'}`}
                  </span>
                  <button
                    onClick={() => setHidden(h => !h)}
                    style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 18, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {hidden ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', letterSpacing: 2, marginBottom: 4 }}>
                {wallet?.walletId || 'Loading...'}
              </div>
              <div style={{ fontSize: 12, color: T.gold }}>{user?.name || 'User'}</div>
            </div>

            {/* Action Buttons */}
            <div style={{ background: T.white, padding: '20px 28px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, borderTop: `1px solid ${T.border}` }}>
              {[
                { label: 'Add Money',  icon: <FaArrowDown />, type: 'add'      as ModalType, variant: 'primary'   as const },
                { label: 'Withdraw',   icon: <FaArrowUp />, type: 'withdraw' as ModalType, variant: 'secondary' as const },
                { label: 'Transfer',   icon: <FaArrowRightArrowLeft />, type: 'transfer' as ModalType, variant: 'ghost'     as const },
              ].map(a => (
                <Btn key={a.label} variant={a.variant} icon={a.icon} onClick={() => setModal(a.type)} style={{ justifyContent: 'center' }}>
                  {a.label}
                </Btn>
              ))}
            </div>
          </div>

          {/* Linked Accounts */}
          <Card>
            <SectionTitle action={<Btn size="sm" variant="secondary">+ Link Account</Btn>}>
              Linked Accounts
            </SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {linkedAccounts.map((acc: any, i: number) => (
                <div key={i} className="acc-row" style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px', borderRadius: 12, border: `1px solid ${T.border}`, cursor: 'pointer',
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: acc.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {acc.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>{acc.name}</div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>{acc.acct} · <Badge label={acc.badge} type="navy" /></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary }}>{formatCurrency(acc.balance)}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>Available</div>
                  </div>
                </div>
              ))}
              <button style={{
                width: '100%', padding: '14px', borderRadius: 12, cursor: 'pointer',
                border: `2px dashed ${T.border}`, background: 'transparent',
                fontSize: 13, color: T.navyMid, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                ＋ Link New Account
              </button>
            </div>
          </Card>
        </div>

        {/* Right: Transaction Limits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <SectionTitle>Transaction Limits</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {displayLimits.map((l: any) => {
                const pct = l.limit > 0 ? Math.round((l.used / l.limit) * 100) : 0;
                const color = pct > 80 ? T.error : pct > 50 ? T.warning : T.success;
                return (
                  <div key={l.period}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{l.period}</span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>
                        {formatCurrency(l.used)} / {formatCurrency(l.limit)}
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 6, background: T.border }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 6, background: color, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 600 }}>{pct}% used</div>
                  </div>
                );
              })}
            </div>
            <Divider />
            <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>
              Upgrade to <strong>Tier 3</strong> to unlock higher limits up to ₵500,000/month.
            </div>
            <Btn size="sm" variant="gold" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
              Upgrade Tier →
            </Btn>
          </Card>

          {/* Wallet Stats */}
          <Card>
            <SectionTitle>This Month</SectionTitle>
            {[
              { label: 'Total Spent',    val: '₵2,000', icon: <FaMoneyBillTransfer />, color: T.error },
              { label: 'Total Received', val: '₵5,300', icon: <FaDownload />, color: T.success },
              { label: 'Bills Paid',     val: '₵340',   icon: <FaFileInvoiceDollar />, color: T.warning },
              { label: 'Airtime',        val: '₵50',    icon: <FaSatelliteDish />, color: T.info },
            ].map(s => (
              <div key={s.label} className="trow" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 6px', borderRadius: 8 }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <span style={{ flex: 1, fontSize: 13, color: T.textSec, fontWeight: 600 }}>{s.label}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.val}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,2,89,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: 420, background: T.white, borderRadius: 20, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: T.navy, display: 'flex', gap: 8, alignItems: 'center' }}>
                {modal === 'add' ? <><FaArrowDown /> Add Money</> : modal === 'withdraw' ? <><FaArrowUp /> Withdraw</> : <><FaArrowRightArrowLeft /> Transfer</>}
              </h2>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.textMuted }}>✕</button>
            </div>
            <Input label="Amount (₵)" placeholder="0.00" type="number" value={amount} onChange={e => setAmount(e.target.value)} icon={<FaCediSign />} />
            {modal !== 'add' && (
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 6 }}>Destination</label>
                <select style={{ width: '100%', height: 44, borderRadius: 10, border: `1.5px solid ${T.borderVar}`, padding: '0 14px', fontSize: 14, color: T.textPrimary, background: T.white }}>
                  <option>MTN Mobile Money (**** 7890)</option>
                  <option>Ecobank Ghana (**** 3421)</option>
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <Btn variant="secondary" onClick={() => setModal(null)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</Btn>
              <Btn onClick={() => setModal(null)} style={{ flex: 2, justifyContent: 'center' }}>
                {modal === 'add' ? 'Add Money' : modal === 'withdraw' ? 'Withdraw' : 'Transfer'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </PageWrap>
  );
}
