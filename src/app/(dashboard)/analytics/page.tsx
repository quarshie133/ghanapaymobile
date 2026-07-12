'use client';
import React, { useState, useEffect } from 'react';
import { SPENDING_DATA, CATEGORIES } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { SectionTitle, PageWrap } from '@/components/ui/Layout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const PAYMENT_METHODS = [
  { label: 'GhanaPay', pct: 60, bgClass: 'bg-primary' },
  { label: 'MTN MoMo', pct: 30, bgClass: 'bg-tertiary-container' },
  { label: 'Vodafone Cash', pct: 8, bgClass: 'bg-surface-tint' },
  { label: 'Bank', pct: 2, bgClass: 'bg-outline' },
];

const SAVINGS_GOALS = [
  { icon: 'directions_car', name: 'New Car Fund', saved: 12000, target: 50000, pct: 24, textClass: 'text-tertiary-container', bgClass: 'bg-tertiary-container' },
  { icon: 'health_and_safety', name: 'Emergency Fund', saved: 15200, target: 20000, pct: 76, textClass: 'text-primary', bgClass: 'bg-primary' },
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('Month');
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (user) {
      api.get('/analytics/summary').then(res => setAnalytics(res)).catch(() => {});
    }
  }, [user]);

  const kpis = [
    { label: 'Total Spent', value: '₵2,000.00', icon: 'payments', delta: '8.4% vs May', deltaUp: false },
    { label: 'Total Received', value: '₵5,400.00', icon: 'account_balance_wallet', delta: '12.1% vs May', deltaUp: true },
    { label: 'Largest Expense', value: '₵1,500.00', icon: 'shopping_cart', delta: 'Rent Payment', deltaUp: null },
    { label: 'Health Score', value: '82', icon: 'favorite', delta: 'Excellent standing', deltaUp: null, max: '/100' },
  ];

  return (
    <PageWrap
      title="Financial Analytics"
      breadcrumb="Analytics"
      action={
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-border-subtle rounded-lg bg-surface-container-lowest overflow-hidden">
            {['Week', 'Month', '3 Months'].map((t) => (
              <button
                key={t}
                onClick={() => setPeriod(t === '3 Months' ? '3M' : t)}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  (t === '3 Months' && period === '3M') || period === t
                    ? 'bg-primary-fixed text-primary border-r border-border-subtle'
                    : 'text-secondary hover:bg-surface-container border-r border-border-subtle'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 border border-border-subtle rounded-lg bg-surface-container-lowest px-4 py-2 cursor-pointer hover:border-outline transition-colors">
            <span className="material-symbols-outlined text-outline text-sm">calendar_month</span>
            <span className="text-sm font-medium">Jun 2026</span>
          </div>
        </div>
      }
    >
      {/* ROW 1: Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((k, idx) => (
          <Card key={idx} className="flex flex-col justify-between p-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-secondary font-medium text-sm">{k.label}</span>
              <span className={`material-symbols-outlined ${idx === 3 ? 'text-primary' : 'text-outline'}`}>
                {k.icon}
              </span>
            </div>
            <div className="font-metric-value text-metric-value text-on-surface mb-2">
              {k.value}
              {k.max && <span className="text-lg text-outline">{k.max}</span>}
            </div>
            {k.deltaUp !== null ? (
              <div className="flex items-center gap-1 text-success text-sm font-medium">
                <span className="material-symbols-outlined text-sm">
                  {k.deltaUp ? 'arrow_upward' : 'arrow_downward'}
                </span>
                {k.delta}
              </div>
            ) : (
              <div className="text-secondary text-sm font-medium">{k.delta}</div>
            )}
          </Card>
        ))}
      </div>

      {/* ROW 2: Main Chart */}
      <Card className="p-6">
        <SectionTitle
          action={
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-sm"></div>
                <span className="text-secondary text-xs font-semibold">June (Current)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0 border-t-2 border-dashed border-tertiary-container"></div>
                <span className="text-secondary text-xs font-semibold">May (Previous)</span>
              </div>
            </div>
          }
        >
          Spending Trend
        </SectionTitle>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={SPENDING_DATA} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECF0" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#777682' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#777682' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid #E8ECF0', fontSize: 12 }}
                formatter={(val: any) => [`₵${val}`, 'Spending']}
              />
              <Bar dataKey="amount" fill="#020259" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ROW 3: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category breakdown (Span 7) */}
        <Card className="lg:col-span-7 p-6 flex flex-col">
          <h2 className="font-section-title text-section-title text-on-surface mb-6">Spending by Category</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 flex-1">
            <div className="shrink-0 flex items-center justify-center">
              <PieChart width={180} height={180}>
                <Pie
                  data={CATEGORIES}
                  dataKey="pct"
                  cx={90}
                  cy={90}
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {CATEGORIES.map((c, i) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div className="flex-1 w-full space-y-4">
              {CATEGORIES.map((c, i) => (
                <div key={i} className="w-full">
                  <div className="flex justify-between items-center text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                      <span className="font-medium text-secondary">{c.name}</span>
                    </div>
                    <span className="font-bold text-on-surface">{c.pct}%</span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Payment Methods (Span 5) */}
        <Card className="lg:col-span-5 p-6">
          <h2 className="font-section-title text-section-title text-on-surface mb-6">Payment Methods</h2>
          <div className="space-y-6">
            {PAYMENT_METHODS.map((m, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-secondary">{m.label}</span>
                  <span className="font-bold text-primary">{m.pct}%</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${m.bgClass}`} style={{ width: `${m.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ROW 4: Savings Goals */}
      <div>
        <h2 className="font-section-title text-section-title text-on-surface mb-4">Savings Goals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAVINGS_GOALS.map((g, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-surface-bright flex items-center justify-center border border-border-subtle">
                  <span className={`material-symbols-outlined ${g.textClass}`}>
                    {g.icon}
                  </span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-surface-container rounded text-secondary">
                  {g.pct}%
                </span>
              </div>
              <h3 className="font-semibold text-on-surface mb-1">{g.name}</h3>
              <div className="text-sm text-secondary mb-4">
                ₵{g.saved.toLocaleString()} / ₵{g.target.toLocaleString()}
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${g.bgClass}`} style={{ width: `${g.pct}%` }}></div>
              </div>
            </Card>
          ))}

          {/* Create New Goal */}
          <div className="border-2 border-dashed border-border-subtle rounded-xl p-6 flex flex-col items-center justify-center text-secondary hover:text-primary hover:border-primary hover:bg-surface-container-low transition-all cursor-pointer group min-h-[160px]">
            <span className="material-symbols-outlined text-3xl mb-2 group-hover:scale-110 transition-transform">
              add_circle
            </span>
            <span className="font-bold">Create New Goal</span>
          </div>
        </div>
      </div>
    </PageWrap>
  );
}
