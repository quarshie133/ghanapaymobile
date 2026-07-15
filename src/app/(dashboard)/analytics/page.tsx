'use client';
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { SectionTitle, PageWrap } from '@/components/ui/Layout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('Month');
  const [summary, setSummary] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isMerchant = user?.phone && user.phone.length <= 6;

  useEffect(() => {
    if (user) {
      setLoading(true);
      if (isMerchant) {
        Promise.all([
          api.get('/analytics/merchant/summary'),
          api.get('/analytics/merchant/weekly'),
          api.get('/analytics/merchant/payment-methods')
        ]).then(([sumRes, weekRes, methodRes]) => {
          setSummary(sumRes.data || sumRes);
          setWeeklyData(weekRes.data || weekRes);
          setPaymentMethods(methodRes.data || methodRes);
          setLoading(false);
        }).catch(() => setLoading(false));
      } else {
        Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/weekly'),
          api.get('/analytics/categories'),
          api.get('/analytics/payment-methods'),
          api.get('/analytics/savings-goals')
        ]).then(([sumRes, weekRes, catRes, methodRes, goalsRes]) => {
          setSummary(sumRes.data || sumRes);
          setWeeklyData(weekRes.data || weekRes);
          setCategories(catRes.data || catRes);
          setPaymentMethods(methodRes.data || methodRes);
          setGoals(goalsRes.data || goalsRes);
          setLoading(false);
        }).catch(() => setLoading(false));
      }
    }
  }, [user, isMerchant]);

  if (isMerchant) {
    const merchantKpis = [
      { label: 'Total Sales', value: summary ? `₵${Number(summary.totalSales).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₵0.00', icon: 'payments', delta: 'This Month sales volume' },
      { label: 'Sales Today', value: summary ? `₵${Number(summary.salesToday).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₵0.00', icon: 'store', delta: 'Today incoming payments' },
      { label: 'Transactions', value: summary ? String(summary.transactionCount) : '0', icon: 'receipt_long', delta: 'Completed client invoices' },
      { label: 'Avg Ticket Value', value: summary ? `₵${Number(summary.avgTransactionValue).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₵0.00', icon: 'analytics', delta: 'Average checkout value' },
    ];

    return (
      <PageWrap
        title="Merchant Sales Analytics"
        breadcrumb="Analytics"
        action={
          <div className="flex items-center gap-2 border border-border-subtle rounded-lg bg-surface-container-lowest px-4 py-2">
            <span className="material-symbols-outlined text-outline text-sm">calendar_month</span>
            <span className="text-sm font-medium">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          </div>
        }
      >
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {merchantKpis.map((k, idx) => (
            <Card key={idx} className="flex flex-col justify-between p-6">
              <div className="flex justify-between items-start mb-2">
                <span className="text-secondary font-medium text-sm">{k.label}</span>
                <span className="material-symbols-outlined text-outline">
                  {k.icon}
                </span>
              </div>
              <div className="font-metric-value text-metric-value text-on-surface mb-2">
                {k.value}
              </div>
              <div className="text-secondary text-sm font-medium">{k.delta}</div>
            </Card>
          ))}
        </div>

        {/* Weekly Sales Chart */}
        <Card className="p-6">
          <SectionTitle>Sales Trend</SectionTitle>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECF0" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#777682' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#777682' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #E8ECF0', fontSize: 12 }}
                  formatter={(val: any) => [`₵${val}`, 'Sales']}
                />
                <Bar dataKey="amount" fill="#020259" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Customer Wallet/Methods Breakdown */}
        <Card className="p-6">
          <h2 className="font-section-title text-section-title text-on-surface mb-6">Payment Methods Received</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {paymentMethods.map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-secondary">{m.label}</span>
                    <span className="font-bold text-primary">{m.pct}% (₵{Number(m.amount).toLocaleString()})</span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${m.bgClass || 'bg-primary'}`} style={{ width: `${m.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center">
              <PieChart width={200} height={200}>
                <Pie
                  data={paymentMethods}
                  dataKey="pct"
                  cx={100}
                  cy={100}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  {paymentMethods.map((m, i) => {
                    const colors = ['#020259', '#cea62c', '#1E7B9E', '#8E44AD'];
                    return <Cell key={i} fill={colors[i % colors.length]} />;
                  })}
                </Pie>
              </PieChart>
            </div>
          </div>
        </Card>
      </PageWrap>
    );
  }

  const userKpis = [
    { label: 'Total Spent', value: summary ? `₵${Number(summary.monthlySpent).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₵0.00', icon: 'payments', delta: 'Total spent this month' },
    { label: 'Total Received', value: summary ? `₵${Number(summary.monthlyReceived).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₵0.00', icon: 'account_balance_wallet', delta: 'Received this month' },
    { label: 'Largest Expense', value: summary ? `₵${Number(summary.largestExpense).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₵0.00', icon: 'shopping_cart', delta: 'Largest checkout item' },
    { label: 'Health Score', value: summary ? String(80 + Math.min(20, Math.max(0, Math.round(((summary.monthlyReceived - summary.monthlySpent) / (summary.monthlyReceived || 1)) * 20)))) : '80', icon: 'favorite', delta: 'Overall cash flow score', max: '/100' },
  ];

  return (
    <PageWrap
      title="Financial Analytics"
      breadcrumb="Analytics"
      action={
        <div className="flex items-center gap-2 border border-border-subtle rounded-lg bg-surface-container-lowest px-4 py-2">
          <span className="material-symbols-outlined text-outline text-sm">calendar_month</span>
          <span className="text-sm font-medium">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        </div>
      }
    >
      {/* ROW 1: Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {userKpis.map((k, idx) => (
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
            <div className="text-secondary text-sm font-medium">{k.delta}</div>
          </Card>
        ))}
      </div>

      {/* ROW 2: Main Chart */}
      <Card className="p-6">
        <SectionTitle>Spending Trend</SectionTitle>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} barSize={40}>
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
                  data={categories}
                  dataKey="pct"
                  cx={90}
                  cy={90}
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {categories.map((c, i) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div className="flex-1 w-full space-y-4">
              {categories.map((c, i) => (
                <div key={i} className="w-full">
                  <div className="flex justify-between items-center text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                      <span className="font-medium text-secondary">{c.name}</span>
                    </div>
                    <span className="font-bold text-on-surface">{c.pct}% (₵{c.amount})</span>
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
            {paymentMethods.map((m, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-secondary">{m.label}</span>
                  <span className="font-bold text-primary">{m.pct}% (₵{Number(m.amount).toLocaleString()})</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${m.bgClass || 'bg-primary'}`} style={{ width: `${m.pct}%` }}></div>
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
          {(goals || []).map((g: any, idx: number) => {
            const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100)) : 0;
            return (
              <Card key={idx} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-bright flex items-center justify-center border border-border-subtle">
                    <span className="material-symbols-outlined text-primary">
                      {g.icon || 'savings'}
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-surface-container rounded text-secondary">
                    {pct}%
                  </span>
                </div>
                <h3 className="font-semibold text-on-surface mb-1">{g.name}</h3>
                <div className="text-sm text-secondary mb-4">
                  ₵{Number(g.savedAmount).toLocaleString()} / ₵{Number(g.targetAmount).toLocaleString()}
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }}></div>
                </div>
              </Card>
            );
          })}
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
