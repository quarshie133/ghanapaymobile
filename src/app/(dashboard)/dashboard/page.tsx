'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import T from '@/lib/tokens';
import { TRANSACTIONS, SPENDING_DATA } from '@/lib/mock-data';
import { formatCurrency, getInitials } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { SectionTitle, PageWrap } from '@/components/ui/Layout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  FaMobileScreen, FaBuildingColumns, FaMoneyBillTransfer, FaDownload, 
  FaFileInvoiceDollar, FaSatelliteDish, FaUsers, FaPlus, FaEye, FaEyeSlash
} from 'react-icons/fa6';

const CONTACTS = [
  { name: 'Kwame Mensah', phone: '0244 567 890' },
  { name: 'Abena Asante', phone: '0201 234 567' },
  { name: 'Ama Atta',     phone: '0244 111 222' },
];

const LINKED = [
  { name: 'MTN Mobile Money', icon: <FaMobileScreen />, balance: 1200, color: '#FFCB05' },
  { name: 'Ecobank',           icon: <FaBuildingColumns />, balance: 8500, color: '#003087' },
];

const QUICK_ACTIONS = [
  { label: 'Send Money',  icon: <FaMoneyBillTransfer />, href: '/send-money',     bg: T.navyMid,    color: '#fff' },
  { label: 'Request',     icon: <FaDownload />, href: '#',               bg: '#8E44AD',    color: '#fff' },
  { label: 'Pay Bills',   icon: <FaFileInvoiceDollar />, href: '/bill-payments',  bg: T.gold,       color: T.navy },
  { label: 'Airtime',     icon: <FaSatelliteDish />, href: '#',               bg: T.info,       color: '#fff' },
  { label: 'Bulk Pay',    icon: <FaUsers />, href: '/bulk-payments',  bg: T.success,    color: '#fff' },
  { label: 'Add Money',   icon: <FaPlus />, href: '/wallet',         bg: T.navyLight,  color: '#fff' },
];

const PERIOD_TABS = ['Week', 'Month', '3M'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [period, setPeriod] = useState('Week');
  const [wallet, setWallet] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>(TRANSACTIONS.slice(0, 4));

  React.useEffect(() => {
    if (user) {
      api.get('/wallet').then(res => setWallet(res.data || res)).catch(() => {});
      api.get('/transactions').then(res => {
        if (res.data) setRecent(res.data.slice(0, 4));
      }).catch(() => {});
    }
  }, [user]);

  return (
    <PageWrap
      title="Dashboard"
      subtitle={`Good afternoon, ${user?.name?.split(' ')[0] || 'User'} 👋  — ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
    >
      <style>{`
        .trow:hover { background: ${T.tableHover} !important; }
        .qa-btn:hover { opacity: 0.85; transform: translateY(-2px); }
        .qa-btn { transition: all 0.18s; }
        .linked-row:hover { background: ${T.surfaceLow} !important; }
      `}</style>

      {/* KPI Cards Row */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <Card className="card-hover" style={{ background: `linear-gradient(135deg, ${T.navy} 60%, ${T.navyMid})`, color: '#fff', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.75, letterSpacing: 0.5 }}>WALLET BALANCE</span>
            <button
              onClick={() => setBalanceHidden(h => !h)}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 16, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {balanceHidden ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, margin: '12px 0 4px', letterSpacing: -1 }}>
            {balanceHidden ? '₵ ••••••' : `₵${wallet?.balance != null ? Number(wallet.balance).toFixed(2) : '0.00'}`}
          </div>
          <div style={{ fontSize: 12, opacity: 0.65 }}>{wallet?.walletId || 'Loading...'} · Tier {user?.tier || 1}</div>
          <div style={{ marginTop: 12, fontSize: 12, color: T.gold, fontWeight: 600 }}>▲ 12.4% vs last month</div>
        </Card>

        <Card className="card-hover">
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5 }}>SENT TODAY</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.error, margin: '10px 0 4px' }}>₵200.00</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>1 transaction</div>
          <div style={{ marginTop: 10, fontSize: 12, color: T.error, fontWeight: 600 }}>▼ ₵50 vs yesterday</div>
        </Card>

        <Card className="card-hover">
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5 }}>RECEIVED TODAY</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.success, margin: '10px 0 4px' }}>₵500.00</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>1 transaction</div>
          <div style={{ marginTop: 10, fontSize: 12, color: T.success, fontWeight: 600 }}>▲ ₵200 vs yesterday</div>
        </Card>

        <Card className="card-hover">
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5 }}>SAVED THIS MONTH</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.gold, margin: '10px 0 4px' }}>₵820.00</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>Emergency + Car Fund</div>
          <div style={{ marginTop: 10, fontSize: 12, color: T.gold, fontWeight: 600 }}>▲ On track for goal 🎯</div>
        </Card>
      </div>

      <div className="dashboard-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Quick Actions */}
          <Card>
            <SectionTitle>Quick Actions</SectionTitle>
            <div className="quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
              {QUICK_ACTIONS.map(a => (
                <Link key={a.label} href={a.href} style={{ textDecoration: 'none' }}>
                  <div className="qa-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 54, height: 54, borderRadius: '50%',
                      background: a.bg, color: a.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    }}>
                      {a.icon}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.textSec, textAlign: 'center' }}>{a.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* Spending Chart */}
          <Card>
            <SectionTitle
              action={
                <div style={{ display: 'flex', gap: 4 }}>
                  {PERIOD_TABS.map(t => (
                    <button key={t} onClick={() => setPeriod(t)} style={{
                      padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      background: period === t ? T.navyMid : T.surfaceLow,
                      color: period === t ? '#fff' : T.textMuted,
                      transition: 'all 0.15s',
                    }}>
                      {t}
                    </button>
                  ))}
                </div>
              }
            >
              Spending This Month
            </SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SPENDING_DATA} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: T.textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: T.textMuted }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 12 }}
                  formatter={(val: any) => [`₵${val}`, '']}
                />
                <Bar dataKey="prev"   fill={T.surfaceLow} radius={[4,4,0,0]} name="Previous" stroke={T.border} />
                <Bar dataKey="amount" fill={T.navyMid}    radius={[4,4,0,0]} name="Current"  />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
              <span style={{ fontSize: 11, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: T.navyMid }} /> This Period
              </span>
              <span style={{ fontSize: 11, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: T.surfaceLow, border: `1px solid ${T.border}` }} /> Last Period
              </span>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <SectionTitle action={<Link href="/history" style={{ fontSize: 13, color: T.navyMid, fontWeight: 600, textDecoration: 'none' }}>View All →</Link>}>
              Recent Activity
            </SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recent.map(tx => (
                <div key={tx.id} className="trow" style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: tx.amount > 0 ? T.successBg : T.errorBg,
                    color: tx.amount > 0 ? T.success : T.error,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                  }}>
                    {getInitials(tx.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{tx.name}</div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>{tx.note} · {tx.time}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: tx.amount > 0 ? T.success : T.error }}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </div>
                    <Badge label={tx.status} type={tx.status === 'completed' ? 'success' : 'warning'} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* AI Tip */}
          <Card style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.navyLight})`, border: 'none', color: '#fff' }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.65, letterSpacing: 1, marginBottom: 8 }}>✨ AI INSIGHT</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>You&apos;re on track! 🎉</div>
            <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>
              You&apos;ve spent <strong style={{ color: T.gold }}>₵1,200</strong> against your <strong style={{ color: T.gold }}>₵1,500</strong> monthly budget. 20% more saved vs last month.
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.2)' }}>
                <div style={{ width: '80%', height: '100%', borderRadius: 4, background: T.gold }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, opacity: 0.7 }}>
                <span>₵1,200 spent</span><span>₵1,500 budget</span>
              </div>
            </div>
          </Card>

          {/* Linked Accounts */}
          <Card>
            <SectionTitle>Linked Accounts</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LINKED.map(acc => (
                <div key={acc.name} className="linked-row" style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px', borderRadius: 12, border: `1px solid ${T.border}`,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: acc.color + '22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>
                    {acc.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{acc.name}</div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>Linked</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>{formatCurrency(acc.balance)}</div>
                </div>
              ))}
              <button style={{
                width: '100%', padding: '12px', borderRadius: 12, cursor: 'pointer',
                border: `2px dashed ${T.border}`, background: 'transparent',
                fontSize: 13, color: T.navyMid, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                ＋ Link Account
              </button>
            </div>
          </Card>

          {/* Frequent Contacts */}
          <Card>
            <SectionTitle>Frequent Contacts</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {CONTACTS.map(c => (
                <div key={c.name} className="trow" style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 8, cursor: 'pointer',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: T.sidebarActive, color: T.navyMid,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>
                    {getInitials(c.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{c.phone}</div>
                  </div>
                  <Link href="/send-money" style={{ textDecoration: 'none' }}>
                    <Btn size="sm" variant="secondary">Send</Btn>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageWrap>
  );
}
