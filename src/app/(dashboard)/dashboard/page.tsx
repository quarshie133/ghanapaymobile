'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, getInitials } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { PageWrap, SectionTitle } from '@/components/ui/Layout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [period, setPeriod] = useState('Month');
  const [wallet, setWallet] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isMerchant = user?.phone && user.phone.length <= 6;

  useEffect(() => {
    if (user) {
      setLoading(true);
      if (isMerchant) {
        Promise.all([
          api.get('/analytics/merchant/summary'),
          api.get('/analytics/merchant/weekly'),
          api.get('/transactions')
        ]).then(([sumRes, weekRes, txRes]) => {
          setSummary(sumRes.data || sumRes);
          setWeeklyData(weekRes.data || weekRes);
          if (txRes.data) setRecent(txRes.data.slice(0, 4));
          setLoading(false);
        }).catch(() => setLoading(false));
      } else {
        Promise.all([
          api.get('/wallet'),
          api.get('/analytics/summary'),
          api.get('/analytics/weekly'),
          api.get('/transactions')
        ]).then(([walletRes, sumRes, weekRes, txRes]) => {
          setWallet(walletRes.data || walletRes);
          setSummary(sumRes.data || sumRes);
          setWeeklyData(weekRes.data || weekRes);
          if (txRes.data) setRecent(txRes.data.slice(0, 4));
          setLoading(false);
        }).catch(() => setLoading(false));
      }
    }
  }, [user, isMerchant]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;

    const token = localStorage.getItem('ghana_pay_access');
    if (!token) return;

    const ws = new WebSocket('ws://localhost:3001/ws');

    ws.onopen = () => {
      console.log('[WebSocket] Dashboard connected');
      ws.send(JSON.stringify({ event: 'authenticate', data: { token } }));
    };

    ws.onmessage = (eventMsg) => {
      try {
        const payload = JSON.parse(eventMsg.data);
        console.log('[WebSocket] Dashboard received event:', payload);
        if (payload.event === 'wallet_balance') {
          const balanceVal = Number(payload.data.balance);
          setWallet((prev: any) => prev ? { ...prev, balance: balanceVal } : { balance: balanceVal });
          setSummary((prev: any) => prev ? { ...prev, balance: balanceVal } : { balance: balanceVal });
        } else if (payload.event === 'transaction_status') {
          const newTx = payload.data.transaction;
          setRecent((prev) => {
            const filtered = prev.filter(t => t.id !== newTx.id);
            return [newTx, ...filtered].slice(0, 4);
          });
        }
      } catch (err) {
        console.error('[WebSocket] Parsing error:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [user]);

  const QUICK_ACTIONS = [
    { label: 'Send Money',  icon: 'send', href: '/send-money',     bgClass: 'bg-primary-fixed text-primary group-hover:bg-primary group-hover:text-white' },
    { label: 'Request',     icon: 'request_quote', href: '#',               bgClass: 'bg-primary-fixed text-primary group-hover:bg-primary group-hover:text-white' },
    { label: 'Pay Bills',   icon: 'receipt_long', href: '/bill-payments',  bgClass: 'bg-primary-fixed text-primary group-hover:bg-primary group-hover:text-white' },
    { label: 'Airtime',     icon: 'smartphone', href: '#',               bgClass: 'bg-primary-fixed text-primary group-hover:bg-primary group-hover:text-white' },
    { label: 'Bulk Pay',    icon: 'layers', href: '/bulk-payments',  bgClass: 'bg-primary-fixed text-primary group-hover:bg-primary group-hover:text-white' },
    { label: 'Add Money',   icon: 'add_card', href: '/wallet',         bgClass: 'bg-primary-fixed text-primary group-hover:bg-primary group-hover:text-white' },
  ];

  if (isMerchant) {
    return (
      <PageWrap
        title={`Welcome to Merchant Console, ${user?.name || 'Store'} 🏪`}
        subtitle={`Till ID: #${user?.phone} | Platform Settlement Account Active`}
        action={
          <button className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-container transition-all active:scale-95 shadow-md">
            <span className="material-symbols-outlined text-sm">download</span>
            Sales Report
          </button>
        }
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Till Balance */}
          <Card className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-5xl">store</span>
            </div>
            <p className="text-secondary font-semibold text-xs uppercase tracking-wider mb-2">Merchant Till Balance</p>
            <div className="flex items-center justify-between">
              <p className="font-metric-value text-metric-value text-primary leading-tight">
                {balanceHidden ? '₵ ••••••' : `₵${summary?.balance != null ? Number(summary.balance).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}`}
              </p>
              <button
                onClick={() => setBalanceHidden(!balanceHidden)}
                className="text-secondary hover:text-primary transition-colors focus:outline-none"
              >
                <span className="material-symbols-outlined text-md">
                  {balanceHidden ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <div className="mt-4 flex items-center text-success text-xs font-bold">
              <span className="material-symbols-outlined text-xs mr-1">check_circle</span>
              Ready to settle to bank
            </div>
          </Card>

          {/* Sales Today */}
          <Card>
            <p className="text-secondary font-semibold text-xs uppercase tracking-wider mb-2">Sales Today</p>
            <p className="font-metric-value text-metric-value text-primary leading-tight">
              ₵{summary ? Number(summary.salesToday).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </p>
            <div className="mt-4 flex items-center text-success text-xs font-bold">
              <span className="material-symbols-outlined text-xs mr-1">trending_up</span>
              Live payments tracking active
            </div>
          </Card>

          {/* Monthly Volume */}
          <Card>
            <p className="text-secondary font-semibold text-xs uppercase tracking-wider mb-2">Monthly Sales</p>
            <p className="font-metric-value text-metric-value text-primary leading-tight">
              ₵{summary ? Number(summary.totalSales).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </p>
            <div className="mt-4 flex items-center text-secondary text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
              {summary?.transactionCount || 0} customer orders
            </div>
          </Card>

          {/* Average Ticket Size */}
          <Card>
            <p className="text-secondary font-semibold text-xs uppercase tracking-wider mb-2">Average Ticket Value</p>
            <p className="font-metric-value text-metric-value text-primary leading-tight">
              ₵{summary ? Number(summary.avgTransactionValue).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </p>
            <div className="mt-4 flex items-center text-tertiary text-xs font-bold">
              <span className="material-symbols-outlined text-xs mr-1">analytics</span>
              Based on completed payments
            </div>
          </Card>
        </div>

        {/* Main Grid Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Sales Trend Chart */}
            <Card>
              <SectionTitle>Sales Trend This Month</SectionTitle>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} barSize={32}>
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

            {/* Recent Payments Received */}
            <Card>
              <SectionTitle action={<Link href="/history" className="text-primary font-semibold text-sm hover:underline">View All Sales</Link>}>
                Recent Customer Payments
              </SectionTitle>
              <div className="space-y-4">
                {recent.length === 0 ? (
                  <div className="text-center py-6 text-secondary text-sm">No sales transactions logged yet.</div>
                ) : (
                  recent.map((tx, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container transition-colors duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center shrink-0">
                          {getInitials(tx.recipientName || tx.senderName || 'Customer')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary">{tx.recipientName || tx.senderName || 'Anonymous'}</p>
                          <p className="text-[11px] text-secondary">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Just now'} • {tx.method || 'GhanaPay'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-success">
                          +{formatCurrency(Math.abs(tx.amount))}
                        </p>
                        <Badge
                          label={tx.status}
                          type={tx.status === 'completed' ? 'success' : 'warning'}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Quick Actions */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <Card className="bg-primary text-white border-primary/20 relative overflow-hidden group">
              <div className="flex items-start gap-4 relative z-10">
                <div className="p-3 rounded-lg bg-white/10 backdrop-blur-md shrink-0">
                  <span className="material-symbols-outlined text-tertiary-fixed">qr_code_scanner</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1 text-white">Dynamic GHQR</h4>
                  <p className="text-white/90 text-sm leading-relaxed mb-4">
                    Generate dynamic GHQR payment requests for fast counter checkout.
                  </p>
                  <button className="bg-white text-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-surface-container-low transition-colors duration-200">
                    Generate QR
                  </button>
                </div>
              </div>
            </Card>

            <Card>
              <SectionTitle>Settlement Bank Account</SectionTitle>
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-6 bg-primary rounded-sm flex items-center justify-center shrink-0">
                    <span className="text-[8px] text-white font-bold">GCB</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">GCB Corporate Settlement</p>
                    <p className="text-[10px] text-secondary">**** 8821</p>
                  </div>
                </div>
                <Badge label="ACTIVE" type="success" />
              </div>
            </Card>
          </div>
        </div>
        <footer className="mt-12 text-center text-outline text-[11px] pb-8 relative z-10">
          <p>Licensed and Regulated by the Bank of Ghana. © 2026 GhanaPay Enterprise.</p>
        </footer>
      </PageWrap>
    );
  }

  return (
    <PageWrap
      title={`Good morning, ${user?.name?.split(' ')[0] || 'Abena'} 👋`}
      subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      action={
        <button className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-container transition-all active:scale-95 shadow-md">
          <span className="material-symbols-outlined text-sm">add_circle</span>
          New Transaction
        </button>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Wallet Balance */}
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-5xl">account_balance_wallet</span>
          </div>
          <p className="text-secondary font-semibold text-xs uppercase tracking-wider mb-2">Wallet Balance</p>
          <div className="flex items-center justify-between">
            <p className="font-metric-value text-metric-value text-primary leading-tight">
              {balanceHidden ? '₵ ••••••' : `₵${wallet?.balance != null ? Number(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2 }) : summary?.balance != null ? Number(summary.balance).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}`}
            </p>
            <button
              onClick={() => setBalanceHidden(!balanceHidden)}
              className="text-secondary hover:text-primary transition-colors focus:outline-none"
            >
              <span className="material-symbols-outlined text-md">
                {balanceHidden ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          <div className="mt-4 flex items-center text-success text-xs font-bold">
            <span className="material-symbols-outlined text-xs mr-1">trending_up</span>
            8.4% increase from last month
          </div>
        </Card>

        {/* Sent Today */}
        <Card>
          <p className="text-secondary font-semibold text-xs uppercase tracking-wider mb-2">Sent Today</p>
          <p className="font-metric-value text-metric-value text-primary leading-tight">
            ₵{summary ? Number(summary.sentToday).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </p>
          <div className="mt-4 flex items-center text-secondary text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-secondary mr-2"></span>
            Outbound transactions today
          </div>
        </Card>

        {/* Received Today */}
        <Card>
          <p className="text-secondary font-semibold text-xs uppercase tracking-wider mb-2">Received Today</p>
          <p className="font-metric-value text-metric-value text-primary leading-tight">
            ₵{summary ? Number(summary.receivedToday).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </p>
          <div className="mt-4 flex items-center text-success text-xs font-bold">
            <span className="material-symbols-outlined text-xs mr-1">call_received</span>
            Inbound transactions today
          </div>
        </Card>

        {/* Saved This Month */}
        <Card>
          <p className="text-secondary font-semibold text-xs uppercase tracking-wider mb-2">Saved This Month</p>
          <p className="font-metric-value text-metric-value text-primary leading-tight">
            ₵{summary ? Number(summary.savedThisMonth).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </p>
          <div className="mt-4 flex items-center text-tertiary text-xs font-bold">
            <span className="material-symbols-outlined text-xs mr-1">savings</span>
            Active goals contribution
          </div>
        </Card>
      </div>

      {/* Main Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Columns */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {/* Quick Actions */}
          <Card>
            <SectionTitle
              action={
                <button className="text-primary font-semibold text-sm flex items-center hover:underline">
                  Edit <span className="material-symbols-outlined text-sm ml-1">edit</span>
                </button>
              }
            >
              Quick Actions
            </SectionTitle>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {QUICK_ACTIONS.map((a, idx) => (
                <Link key={idx} href={a.href} className="no-underline group">
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface border border-border-subtle hover:border-primary hover:bg-sidebar-active-light transition-all duration-200">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors duration-200 ${a.bgClass}`}>
                      <span className="material-symbols-outlined">{a.icon}</span>
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-primary text-center whitespace-nowrap">
                      {a.label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* Spending Chart */}
          <Card>
            <SectionTitle
              action={
                <div className="flex items-center gap-2">
                  {['Week', 'Month', '3M'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setPeriod(t)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
                        period === t
                          ? 'bg-primary text-white'
                          : 'bg-surface-container-low text-secondary hover:bg-surface-container'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              }
            >
              Spending Trends
            </SectionTitle>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECF0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#777682' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#777682' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #E8ECF0', fontSize: 12 }}
                    formatter={(val: any) => [`₵${val}`, 'Amount']}
                  />
                  <Bar dataKey="amount" fill="#020259" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary inline-block"></span>
                <span className="text-xs font-bold text-primary uppercase">Current Period</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-tertiary-container inline-block"></span>
                <span className="text-xs font-bold text-primary uppercase">Previous Period</span>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <SectionTitle
              action={
                <Link href="/history" className="text-primary font-semibold text-sm hover:underline">
                  View All
                </Link>
              }
            >
              Recent Activity
            </SectionTitle>
            <div className="space-y-4">
              {recent.length === 0 ? (
                <div className="text-center py-6 text-secondary text-sm">No transaction records found.</div>
              ) : (
                recent.map((tx, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container transition-colors duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center shrink-0">
                        {getInitials(tx.recipientName || tx.senderName || 'Anonymous')}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">{tx.recipientName || tx.senderName || 'Anonymous'}</p>
                        <p className="text-[11px] text-secondary">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : tx.time} • {tx.note || 'Transfer'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.type === 'received' || tx.type === 'topup' ? 'text-success' : 'text-error'}`}>
                        {tx.type === 'received' || tx.type === 'topup' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                      </p>
                      <Badge
                        label={tx.status}
                        type={tx.status === 'completed' ? 'success' : 'warning'}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Columns */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* AI Insights Card */}
          <Card className="bg-primary-container text-white border-primary/20 relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-tertiary/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-300"></div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-3 rounded-lg bg-white/10 backdrop-blur-md shrink-0">
                <span className="material-symbols-outlined text-tertiary-fixed">auto_awesome</span>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1 text-white">GhanaPay AI Insight</h4>
                <p className="text-white/90 text-sm leading-relaxed mb-4">
                  You spent <span className="font-bold text-tertiary-fixed">₵{summary?.largestExpense || 0}</span> on your largest transaction this month. Consider checking your saving goal velocity.
                </p>
                <Link href="/analytics" className="bg-white text-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-surface-container-low transition-colors duration-200 no-underline inline-block">
                  View Analytics
                </Link>
              </div>
            </div>
          </Card>

          {/* Linked Accounts */}
          <Card>
            <SectionTitle
              action={
                <button className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-primary-fixed transition-colors focus:outline-none">
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              }
            >
              Linked Accounts
            </SectionTitle>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border-subtle hover:bg-surface-container transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-6 bg-primary rounded-sm flex items-center justify-center shrink-0">
                    <span className="text-[8px] text-white font-bold">GCB</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">GCB Bank Savings</p>
                    <p className="text-[10px] text-secondary">**** 8821</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-secondary cursor-pointer">more_vert</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border-subtle hover:bg-surface-container transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-6 bg-error rounded-sm flex items-center justify-center shrink-0">
                    <span className="text-[8px] text-white font-bold">ABSA</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">ABSA Corporate Card</p>
                    <p className="text-[10px] text-secondary">**** 4410</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-secondary cursor-pointer">more_vert</span>
              </div>
            </div>
          </Card>

          {/* Frequent Contacts */}
          <Card>
            <SectionTitle>Frequent Contacts</SectionTitle>
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              <div className="flex-shrink-0 flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-14 h-14 rounded-full border-2 border-primary/20 p-0.5 group-hover:border-primary transition-all duration-200">
                  <img
                    className="w-full h-full object-cover rounded-full"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuApoE9jEgVO_FQtoPnQtVz_SOXERq-wnaNX-62aXnmBbwV0ElX1zLCd2NLgwlnrNGUVvap2EcUfM4M0IW1CQSaPW8AzpNf13EtD80sfU10JKMZyJIKQqAmvigrcqqrQGhTFOA93F1tf7LwNjYiGDbxRw8g2Fc3ofib8M5wxHb8Uv_1SH6Il1pn8HcJeZSPkbIYQaiMuwjS6bNTUxc92el47XSAj_BhS5P8u0U1ViCSGgWz69G2IlV8UvffONJq14Me8ZlMEgDHNI8c"
                    alt="Ama Asantewaa"
                  />
                </div>
                <span className="text-[11px] font-bold text-secondary group-hover:text-primary">Ama Asantewaa</span>
              </div>
              <div className="flex-shrink-0 flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-14 h-14 rounded-full border-2 border-primary/20 p-0.5 group-hover:border-primary transition-all duration-200">
                  <img
                    className="w-full h-full object-cover rounded-full"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBujRCz1eZjyxfzbyxP1eJVYyWTsBe2kFO-dXRlHjkRMVOSDOja6dAX9rbndWrZvzOxH9OfijEPFuwi8ooVql_uUBL3gk9lRWB2KomD21cduFtV06Pmiviz2fFcErOGW8FfHrlt7tE5N2p442q33C0en1vFioDEIMu3qLG6oHBCGJiUNYEMgca7Ya4w7gfy1ZxYRV8bLepUO_POHZPeEZ_EanTqnCMAwRQ_xtS5DYT9F0K7fGOCMY4GSIi9YUf7iIFRN-SGg6Dw55Y"
                    alt="Ekow Dadzie"
                  />
                </div>
                <span className="text-[11px] font-bold text-secondary group-hover:text-primary">Ekow Dadzie</span>
              </div>
              <div className="flex-shrink-0 flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-14 h-14 rounded-full border-2 border-primary/20 p-0.5 group-hover:border-primary transition-all duration-200">
                  <img
                    className="w-full h-full object-cover rounded-full"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNnRB2JhkuMxyn4rhfWFQxSswVPsZdv_G_drmAS2Zdv50_S0tFx_tqn--mM_SJYuxvpif7zQRIp1jYSHPt-AnxLxMTkngWKZfxLms_emQHqQV9zFELmclK7oGbUEFnsUSv4cyRgyBgWS_ktWDJZkhT8JHGC-7-GnBYIhAubFZVmFsgYKTFuYuq7wvKO423kucuOjlDiJT6dp-mYURY26ATQrsml5VnXAakaQh-P3YIfbIB_z4Oomog-cipk0Xx71MzT6ouH_8YeP8"
                    alt="Kofi Boakye"
                  />
                </div>
                <span className="text-[11px] font-bold text-secondary group-hover:text-primary">Kofi Boakye</span>
              </div>
              <div className="flex-shrink-0 flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-border-subtle flex items-center justify-center text-secondary group-hover:text-primary transition-all duration-200">
                  <span className="material-symbols-outlined">add</span>
                </div>
                <span className="text-[11px] font-bold text-secondary">View More</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <footer className="mt-12 text-center text-outline text-[11px] pb-8 relative z-10">
        <p>Licensed and Regulated by the Bank of Ghana. © 2026 GhanaPay Enterprise.</p>
      </footer>
    </PageWrap>
  );
}
