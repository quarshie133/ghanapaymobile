'use client';
import React, { useState, useEffect } from 'react';
import { TRANSACTIONS } from '@/lib/mock-data';
import { formatCurrency, getInitials } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { SectionTitle, Divider, PageWrap } from '@/components/ui/Layout';

const MONTHS = [
  { label: 'Jun 2026', key: 'jun', opening: 3750, closing: 4250, debits: 2300, credits: 2800 },
  { label: 'May 2026', key: 'may', opening: 2900, closing: 3750, debits: 1800, credits: 2650 },
  { label: 'Apr 2026', key: 'apr', opening: 2400, closing: 2900, debits: 2100, credits: 2600 },
  { label: 'Mar 2026', key: 'mar', opening: 1800, closing: 2400, debits: 1400, credits: 2000 },
  { label: 'Feb 2026', key: 'feb', opening: 1200, closing: 1800, debits: 900,  credits: 1500 },
  { label: 'Jan 2026', key: 'jan', opening: 500,  closing: 1200, debits: 800,  credits: 1500 },
];

export default function StatementsPage() {
  const { user } = useAuth();
  const [selectedKey, setSelectedKey] = useState('jun');
  const [statements, setStatements] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      api.get('/statements').then(res => setStatements(res)).catch(() => {});
    }
  }, [user]);

  const active = MONTHS.find(m => m.key === selectedKey)!;

  // For mini list, show all TRANSACTIONS (in a real app, filter by month)
  const txList = TRANSACTIONS;

  return (
    <PageWrap
      title="Statements"
      subtitle="Download and review monthly account statements"
      breadcrumb="Statements"
      action={
        <div className="flex items-center gap-3">
          <Btn variant="secondary" size="sm" className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            PDF
          </Btn>
          <Btn variant="ghost" size="sm" className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">download</span>
            CSV
          </Btn>
        </div>
      }
    >
      {/* Month Selector */}
      <Card className="mb-6">
        <SectionTitle>Select Month</SectionTitle>
        <div className="flex gap-2 flex-wrap">
          {MONTHS.map(m => (
            <button
              key={m.key}
              onClick={() => setSelectedKey(m.key)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 focus:outline-none border-2 ${
                selectedKey === m.key
                  ? 'border-primary bg-primary text-white'
                  : 'border-border-subtle hover:border-primary/30 text-secondary bg-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content Area (Span 8) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="bg-surface-container-low">
              <div className="text-[11px] font-bold text-secondary uppercase tracking-widest mb-2">OPENING BALANCE</div>
              <div className="text-2xl font-extrabold text-primary">{formatCurrency(active.opening)}</div>
              <div className="text-xs text-secondary mt-1">Start of {active.label}</div>
            </Card>

            <Card className="bg-gradient-to-br from-primary to-primary-container text-white border-none">
              <div className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-2">CLOSING BALANCE</div>
              <div className="text-2xl font-extrabold text-tertiary-fixed">{formatCurrency(active.closing)}</div>
              <div className="text-xs text-white/70 mt-1">End of {active.label}</div>
            </Card>

            <Card>
              <div className="text-[11px] font-bold text-secondary uppercase tracking-widest mb-2">TOTAL DEBITS</div>
              <div className="text-2xl font-extrabold text-error">{formatCurrency(active.debits)}</div>
              <div className="text-xs text-secondary mt-1">Money out</div>
            </Card>

            <Card>
              <div className="text-[11px] font-bold text-secondary uppercase tracking-widest mb-2">TOTAL CREDITS</div>
              <div className="text-2xl font-extrabold text-success">{formatCurrency(active.credits)}</div>
              <div className="text-xs text-secondary mt-1">Money in</div>
            </Card>
          </div>

          {/* Mini Transaction List */}
          <Card>
            <SectionTitle action={<Badge label={active.label} type="navy" />}>
              Transactions — {active.label}
            </SectionTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-surface border-b border-border-subtle">
                    {['Date', 'Description', 'Type', 'Amount'].map(h => (
                      <th key={h} className="px-6 py-3 font-table-header text-table-header text-secondary uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-sm">
                  {txList.map(tx => (
                    <tr key={tx.id} className="hover:bg-table-hover transition-colors duration-150">
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-primary">{tx.date}</div>
                        <div className="text-xs text-secondary mt-0.5">{tx.time}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full font-bold flex items-center justify-center shrink-0 text-[10px] ${
                              tx.amount > 0 ? 'bg-[#E5F5ED] text-[#1E8449]' : 'bg-error-container text-error'
                            }`}
                          >
                            {getInitials(tx.name)}
                          </div>
                          <div>
                            <div className="font-bold text-primary">{tx.name}</div>
                            <div className="text-xs text-secondary">{tx.note}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge
                          label={tx.type}
                          type={tx.type === 'Received' ? 'success' : tx.type === 'Sent' ? 'error' : tx.type === 'Bill' ? 'warning' : 'info'}
                        />
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`font-extrabold text-sm ${tx.amount > 0 ? 'text-success' : 'text-error'}`}>
                          {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Sidebar Columns (Span 4) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Download Box */}
          <div className="rounded-2xl bg-gradient-to-br from-primary via-primary-container to-surface-tint p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
            <div className="text-xs font-bold text-white/70 uppercase tracking-widest mb-4">STATEMENT DOWNLOAD</div>
            <div className="text-xl font-bold mb-2">{active.label} Statement</div>
            <div className="text-xs text-white/50 mb-6 font-mono">Account: GHP-2026-00182</div>

            <div className="space-y-3">
              <Btn variant="gold" className="w-full justify-center">
                <span className="material-symbols-outlined text-[18px] mr-1">picture_as_pdf</span>
                Download PDF
              </Btn>
              <button className="w-full h-11 border border-white/30 rounded-xl hover:bg-white/10 transition-all font-bold text-sm flex items-center justify-center gap-1.5 focus:outline-none">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download CSV
              </button>
              <button className="w-full h-11 border border-white/30 rounded-xl hover:bg-white/10 transition-all font-bold text-sm flex items-center justify-center gap-1.5 focus:outline-none">
                <span className="material-symbols-outlined text-[18px]">mail</span>
                Email Statement
              </button>
            </div>
          </div>

          {/* Net Position */}
          <Card>
            <SectionTitle>Net Position</SectionTitle>
            <div className="text-center py-4">
              <div className="text-xs text-secondary mb-1">Net Cash Flow</div>
              <div className={`text-3xl font-black ${
                active.credits - active.debits >= 0 ? 'text-success' : 'text-error'
              }`}>
                {active.credits - active.debits >= 0 ? '+' : ''}
                {formatCurrency(active.credits - active.debits)}
              </div>
              <div className="text-xs text-secondary mt-1">Credits − Debits</div>
            </div>
            <Divider />
            <div className="space-y-3 text-xs">
              {[
                ['Transactions', txList.length],
                ['Avg Transaction', `₵${Math.round((active.debits + active.credits) / txList.length)}`],
              ].map(([k, v], i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-secondary">{k}</span>
                  <span className="font-bold text-primary">{v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Tips */}
          <div className="p-5 rounded-xl bg-green-50 border border-green-200">
            <div className="flex gap-2 text-success font-bold mb-3 items-center text-sm">
              <span className="material-symbols-outlined">description</span>
              Statement Tips
            </div>
            <ul className="list-disc pl-5 text-xs text-secondary space-y-2 leading-relaxed font-semibold">
              <li>Statements are available for the last 12 months</li>
              <li>PDF statements are bank-certified</li>
              <li>Share directly with employers or lenders</li>
            </ul>
          </div>
        </div>
      </div>
    </PageWrap>
  );
}
