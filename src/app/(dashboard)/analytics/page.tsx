'use client';
import React, { useState } from 'react';
import T from '@/lib/tokens';
import { SPENDING_DATA, CATEGORIES } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { SectionTitle, PageWrap } from '@/components/ui/Layout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const PERIOD_TABS = ['Week', 'Month', '3M'];

const PAYMENT_METHODS = [
  { label: 'GhanaPay Wallet', pct: 60, color: T.navyMid },
  { label: 'MTN MoMo',        pct: 30, color: '#FFCB05' },
  { label: 'Vodafone Cash',   pct: 8,  color: '#E60026' },
  { label: 'Bank Transfer',   pct: 2,  color: '#555' },
];

const SAVINGS_GOALS = [
  { icon: '🚗', name: 'New Car Fund',    saved: 1200, target: 5000, pct: 24, eta: 'Dec 2026' },
  { icon: '🛡️', name: 'Emergency Fund', saved: 3800, target: 5000, pct: 76, eta: 'Sep 2026' },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('Month');

  const kpiCards = [
    { label: 'Total Spent',       value: '₵2,000', delta: '▼ 8% vs last month', deltaColor: T.success, icon: '💳' },
    { label: 'Total Received',    value: '₵5,400', delta: '▲ 15% vs last month', deltaColor: T.success, icon: '📥' },
    { label: 'Largest Expense',   value: '₵1,500', delta: 'Rent · Jun 14', deltaColor: T.textMuted, icon: '🏠' },
    { label: 'Health Score',      value: '82/100', delta: 'Good · Top 20%', deltaColor: T.info, icon: '💡' },
  ];

  return (
    <PageWrap
      title="Financial Analytics"
      subtitle="Insights into your spending patterns and financial health"
      action={
        <div style={{ display: 'flex', gap: 4 }}>
          {PERIOD_TABS.map(t => (
            <button key={t} onClick={() => setPeriod(t)} style={{
              padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: period === t ? T.navyMid : T.surfaceLow,
              color: period === t ? '#fff' : T.textMuted, transition: 'all 0.15s',
            }}>
              {t}
            </button>
          ))}
        </div>
      }
    >
      <style>{`.trow:hover { background: ${T.tableHover} !important; }`}</style>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {kpiCards.map(k => (
          <Card key={k.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, letterSpacing: 0.4 }}>{k.label.toUpperCase()}</span>
              <span style={{ fontSize: 20 }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.textPrimary, marginBottom: 6 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: k.deltaColor, fontWeight: 600 }}>{k.delta}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Spending Trend */}
        <Card>
          <SectionTitle>Spending Trend</SectionTitle>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: T.navyMid, display: 'inline-block' }} /> This Month
            </span>
            <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: T.border, border: `1px solid ${T.borderVar}`, display: 'inline-block' }} /> Last Month
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SPENDING_DATA} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: T.textMuted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: T.textMuted }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val: any) => [`₵${val}`, '']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="prev"   fill={T.border}   radius={[4,4,0,0]} name="Last Month"  />
              <Bar dataKey="amount" fill={T.navyMid}  radius={[4,4,0,0]} name="This Month" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Spending by Category Pie */}
        <Card>
          <SectionTitle>Spending by Category</SectionTitle>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: '0 0 160px' }}>
              <PieChart width={160} height={160}>
                <Pie data={CATEGORIES} dataKey="pct" cx={75} cy={75} innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {CATEGORIES.map(c => <Cell key={c.name} fill={c.color} />)}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val}%`, '']} />
              </PieChart>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
              {CATEGORIES.map(c => (
                <div key={c.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
                      {c.name}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>{c.pct}% · {formatCurrency(c.amount)}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 4, background: T.border }}>
                    <div style={{ width: `${c.pct}%`, height: '100%', borderRadius: 4, background: c.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Payment Methods */}
        <Card>
          <SectionTitle>Payment Methods</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PAYMENT_METHODS.map(m => (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.textSec }}>{m.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{m.pct}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 6, background: T.border }}>
                  <div style={{ width: `${m.pct}%`, height: '100%', borderRadius: 6, background: m.color, transition: 'width 0.6s' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Savings Goals */}
        <Card>
          <SectionTitle action={<Btn size="sm" variant="secondary">+ New Goal</Btn>}>Savings Goals</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SAVINGS_GOALS.map(g => (
              <div key={g.name} style={{ padding: 16, borderRadius: 12, border: `1px solid ${T.border}`, background: T.surfaceLow }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{g.icon}</span>{g.name}
                  </span>
                  <Badge label={`${g.pct}%`} type={g.pct >= 75 ? 'success' : 'info'} />
                </div>
                <div style={{ height: 8, borderRadius: 6, background: T.border, marginBottom: 8 }}>
                  <div style={{ width: `${g.pct}%`, height: '100%', borderRadius: 6, background: g.pct >= 75 ? T.success : T.info, transition: 'width 0.6s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textMuted }}>
                  <span>{formatCurrency(g.saved)} saved of {formatCurrency(g.target)}</span>
                  <span>ETA: {g.eta}</span>
                </div>
              </div>
            ))}
            <button style={{
              width: '100%', padding: '14px', borderRadius: 12, cursor: 'pointer',
              border: `2px dashed ${T.border}`, background: 'transparent',
              fontSize: 13, color: T.navyMid, fontWeight: 600,
            }}>
              ＋ Add New Goal
            </button>
          </div>
        </Card>
      </div>
    </PageWrap>
  );
}
