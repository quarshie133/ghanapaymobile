'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TRANSACTIONS, SPENDING_DATA } from '@/lib/mock-data';
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
  const [recent, setRecent] = useState<any[]>(TRANSACTIONS.slice(0, 4));

  useEffect(() => {
    if (user) {
      api.get('/wallet').then(res => setWallet(res.data || res)).catch(() => {});
      api.get('/transactions').then(res => {
        if (res.data) setRecent(res.data.slice(0, 4));
      }).catch(() => {});
    }
  }, [user]);

  const QUICK_ACTIONS = [
    { label: 'Send Money',  icon: 'send', href: '/send-money',     bgClass: 'bg-primary-fixed text-primary group-hover:bg-primary group-hover:text-white' },
    { label: 'Request',     icon: 'request_quote', href: '#',               bgClass: 'bg-primary-fixed text-primary group-hover:bg-primary group-hover:text-white' },
    { label: 'Pay Bills',   icon: 'receipt_long', href: '/bill-payments',  bgClass: 'bg-primary-fixed text-primary group-hover:bg-primary group-hover:text-white' },
    { label: 'Airtime',     icon: 'smartphone', href: '#',               bgClass: 'bg-primary-fixed text-primary group-hover:bg-primary group-hover:text-white' },
    { label: 'Bulk Pay',    icon: 'layers', href: '/bulk-payments',  bgClass: 'bg-primary-fixed text-primary group-hover:bg-primary group-hover:text-white' },
    { label: 'Add Money',   icon: 'add_card', href: '/wallet',         bgClass: 'bg-primary-fixed text-primary group-hover:bg-primary group-hover:text-white' },
  ];

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
              {balanceHidden ? '₵ ••••••' : `₵${wallet?.balance != null ? Number(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '4,250.00'}`}
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
            12% increase from last month
          </div>
        </Card>

        {/* Sent Today */}
        <Card>
          <p className="text-secondary font-semibold text-xs uppercase tracking-wider mb-2">Sent Today</p>
          <p className="font-metric-value text-metric-value text-primary leading-tight">₵1,820.00</p>
          <div className="mt-4 flex items-center text-secondary text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-secondary mr-2"></span>
            24 transactions today
          </div>
        </Card>

        {/* Received Today */}
        <Card>
          <p className="text-secondary font-semibold text-xs uppercase tracking-wider mb-2">Received Today</p>
          <p className="font-metric-value text-metric-value text-primary leading-tight">₵2,440.50</p>
          <div className="mt-4 flex items-center text-success text-xs font-bold">
            <span className="material-symbols-outlined text-xs mr-1">call_received</span>
            High volume alert
          </div>
        </Card>

        {/* Saved This Month */}
        <Card>
          <p className="text-secondary font-semibold text-xs uppercase tracking-wider mb-2">Saved This Month</p>
          <p className="font-metric-value text-metric-value text-primary leading-tight">₵620.00</p>
          <div className="mt-4 flex items-center text-tertiary text-xs font-bold">
            <span className="material-symbols-outlined text-xs mr-1">savings</span>
            82% of monthly goal
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
                  <select className="bg-surface border border-border-subtle rounded-md text-xs font-bold text-primary px-3 py-1 focus:ring-0 outline-none ml-2">
                    <option>Monthly</option>
                    <option>Weekly</option>
                  </select>
                </div>
              }
            >
              Spending This Month
            </SectionTitle>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SPENDING_DATA} barSize={32}>
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
                <span className="text-xs font-bold text-primary uppercase">Current Month</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 border-t border-dashed border-tertiary-container inline-block"></span>
                <span className="text-xs font-bold text-primary uppercase">Last Month</span>
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
              {recent.map((tx, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container transition-colors duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center shrink-0">
                      {getInitials(tx.name || tx.senderName || 'Anonymous')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">{tx.name || tx.senderName}</p>
                      <p className="text-[11px] text-secondary">{tx.time || tx.date} • {tx.note || 'Transfer'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.amount > 0 || tx.type === 'RECEIVE' ? 'text-success' : 'text-error'}`}>
                      {tx.amount > 0 || tx.type === 'RECEIVE' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                    </p>
                    <Badge
                      label={tx.status}
                      type={tx.status === 'completed' || tx.status === 'SUCCESS' ? 'success' : 'warning'}
                    />
                  </div>
                </div>
              ))}
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
                  You've spent <span className="font-bold text-tertiary-fixed underline decoration-tertiary-fixed/50 underline-offset-4">₵200 more</span> on Utility bills this month compared to average. Consider setting a transaction limit for the <span className="font-bold text-tertiary-fixed font-black">ECG</span> category.
                </p>


                <button className="bg-white text-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-surface-container-low transition-colors duration-200">
                  Manage Limits
                </button>
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
