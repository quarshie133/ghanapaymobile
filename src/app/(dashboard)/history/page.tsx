'use client';
import React, { useState, useEffect } from 'react';
import { TRANSACTIONS } from '@/lib/mock-data';
import { formatCurrency, getInitials } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { PageWrap } from '@/components/ui/Layout';
import type { Transaction } from '@/types/transaction';

type FilterTab = 'All' | 'Sent' | 'Received' | 'Bills' | 'Airtime';

const TABS: FilterTab[] = ['All', 'Sent', 'Received', 'Bills', 'Airtime'];

const tabMap: Record<FilterTab, (t: Transaction) => boolean> = {
  All:      () => true,
  Sent:     t => t.type === 'Sent',
  Received: t => t.type === 'Received',
  Bills:    t => t.type === 'Bill',
  Airtime:  t => t.type === 'Airtime',
};

export default function HistoryPage() {
  const { user } = useAuth();
  const [tab, setTab]         = useState<FilterTab>('All');
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (user) {
      api.get('/transactions').then(res => {
        if (res.data) {
          const mapped = res.data.map((t: any) => {
            const isSent = t.type === 'TRANSFER' && t.sender?.user?.id === user.id;
            return {
              id: t.id,
              ref: t.id.slice(0, 8).toUpperCase(),
              name: isSent ? (t.recipientWallet?.user?.name || 'Unknown User') : (t.sender?.user?.name || 'Unknown User'),
              date: new Date(t.createdAt).toLocaleDateString(),
              time: new Date(t.createdAt).toLocaleTimeString(),
              amount: isSent ? -Number(t.amount) : Number(t.amount),
              type: isSent ? 'Sent' : 'Received',
              status: t.status === 'COMPLETED' ? 'completed' : t.status === 'FAILED' ? 'failed' : 'pending',
              method: 'Internal Transfer',
              fee: 0,
              note: t.metadata?.note || '',
            };
          });
          setTransactions(mapped);
        }
      }).catch(() => {
        setTransactions(TRANSACTIONS);
      });
    }
  }, [user]);

  const filtered = transactions.filter(t => {
    const matchTab    = tabMap[tab](t);
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.ref.includes(search);
    return matchTab && matchSearch;
  });

  return (
    <PageWrap
      title="Transaction History"
      subtitle="Full record of all your GhanaPay transactions"
      breadcrumb="History"
      action={
        <Btn variant="secondary" size="sm" icon={<span className="material-symbols-outlined text-[18px]">download</span>}>
          Export CSV
        </Btn>
      }
    >
      <div className={`grid grid-cols-1 gap-6 transition-all duration-300 ${selected ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Main Table Card */}
        <div className={selected ? 'lg:col-span-8' : 'w-full'}>
          <Card className="overflow-hidden">
            {/* Filter Bar */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4 px-2">
              <div className="flex gap-2 flex-wrap">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 focus:outline-none ${
                      tab === t
                        ? 'bg-primary text-white'
                        : 'bg-surface-container-low text-secondary hover:bg-surface-container'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-border-subtle bg-surface-bright focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-surface border-b border-border-subtle">
                    {['Date & Time', 'Recipient / Type', 'Method', 'Amount', 'Status', 'Action'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 font-table-header text-table-header text-secondary uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filtered.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => setSelected(selected?.id === tx.id ? null : tx)}
                      className={`group hover:bg-table-hover transition-colors duration-150 cursor-pointer ${
                        selected?.id === tx.id ? 'bg-sidebar-active-light' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-primary text-sm">{tx.date}</div>
                        <div className="text-xs text-secondary mt-0.5">{tx.time}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full font-bold flex items-center justify-center shrink-0 text-sm ${
                              tx.amount > 0 ? 'bg-[#E5F5ED] text-[#1E8449]' : 'bg-error-container text-error'
                            }`}
                          >
                            {getInitials(tx.name)}
                          </div>
                          <div>
                            <div className="font-bold text-primary">{tx.name}</div>
                            <div className="text-xs text-secondary">{tx.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-secondary text-sm">{tx.method}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-extrabold text-base ${
                            tx.amount > 0 ? 'text-success' : 'text-error'
                          }`}
                        >
                          {tx.amount > 0 ? '+' : ''}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          label={tx.status}
                          type={tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'error'}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(selected?.id === tx.id ? null : tx);
                          }}
                          className="text-secondary hover:text-primary transition-colors focus:outline-none"
                        >
                          <span className="material-symbols-outlined text-md">
                            {selected?.id === tx.id ? 'close' : 'arrow_forward'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-secondary text-sm">
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 px-6 py-4 border-t border-border-subtle flex items-center justify-between bg-surface-container-lowest">
              <span className="text-sm text-secondary">
                Showing 1 to {filtered.length} of {transactions.length} entries
              </span>
              <div className="flex gap-1">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    className={`w-8 h-8 rounded flex items-center justify-center border border-border-subtle text-sm font-bold focus:outline-none ${
                      n === 1
                        ? 'bg-primary text-white border-primary'
                        : 'text-secondary hover:bg-surface-container'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Detail Panel (Span 4) */}
        {selected && (
          <div className="lg:col-span-4 sticky top-6">
            <Card className="border-l-4 border-primary">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-section-title text-section-title text-primary">
                  Transaction Details
                </h3>
                <button
                  onClick={() => setSelected(null)}
                  className="text-secondary hover:text-primary transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="text-center mb-6">
                <div
                  className={`w-16 h-16 rounded-full font-black flex items-center justify-center mx-auto mb-3 text-lg ${
                    selected.amount > 0 ? 'bg-[#E5F5ED] text-[#1E8449]' : 'bg-error-container text-error'
                  }`}
                >
                  {getInitials(selected.name)}
                </div>
                <div className="text-lg font-bold text-primary">{selected.name}</div>
                <div
                  className={`text-[30px] font-black my-2 ${
                    selected.amount > 0 ? 'text-[#1E8449]' : 'text-error'
                  }`}
                >
                  {selected.amount > 0 ? '+' : ''}
                  {formatCurrency(selected.amount)}
                </div>
                <Badge
                  label={selected.status}
                  type={selected.status === 'completed' ? 'success' : selected.status === 'pending' ? 'warning' : 'error'}
                />
              </div>

              <div className="rounded-xl border border-border-subtle overflow-hidden divide-y divide-border-subtle">
                {[
                  ['Reference ID', selected.ref],
                  ['Timestamp', `${selected.date} • ${selected.time}`],
                  ['Transaction Type', selected.type],
                  ['Payment Method', selected.method],
                  ['Service Fee', selected.fee > 0 ? formatCurrency(selected.fee) : 'Free GHS'],
                  ['Description / Note', selected.note || 'None'],
                ].map(([k, v], i) => (
                  <div
                    key={i}
                    className={`flex justify-between p-3.5 text-xs ${
                      i % 2 === 0 ? 'bg-surface-container-low' : 'bg-white'
                    }`}
                  >
                    <span className="font-bold text-secondary">{k}</span>
                    <span className="font-bold text-primary text-right max-w-[60%] truncate">
                      {v}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Btn variant="secondary" size="sm" className="flex-1">
                  <span className="material-symbols-outlined text-[16px] mr-1">content_copy</span>
                  Copy Ref
                </Btn>
                <Btn variant="primary" size="sm" className="flex-2">
                  <span className="material-symbols-outlined text-[16px] mr-1">receipt</span>
                  Get Receipt
                </Btn>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageWrap>
  );
}
