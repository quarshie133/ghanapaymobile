'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency, getInitials } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { SectionTitle, Divider, PageWrap } from '@/components/ui/Layout';

/**
 * Real monthly statements, backed by src/lib/statements.ts — which
 * reconstructs opening/closing balances by replaying the user's actual
 * transaction history. Previously this page had 6 hardcoded months with
 * fabricated balances that never matched anything, plus a "PDF statements
 * are bank-certified" claim that was simply false (no certification of
 * any kind exists here) — both removed.
 */

interface WalletTransactionDoc {
  id: string;
  type: 'topup' | 'withdrawal' | 'transfer_out' | 'transfer_in' | 'bill' | 'airtime';
  amount: number;
  fee: number;
  status: string;
  ref: string;
  note: string | null;
  counterpartyName: string | null;
  createdAt: any;
}

interface MonthlyStatement {
  monthKey: string;
  label: string;
  opening: number;
  closing: number;
  totalDebits: number;
  totalCredits: number;
  transactions: WalletTransactionDoc[];
}

const CREDIT_TYPES = new Set(['topup', 'transfer_in']);
const TYPE_LABELS: Record<string, string> = {
  topup: 'Top-up', withdrawal: 'Withdrawal', transfer_out: 'Sent',
  transfer_in: 'Received', bill: 'Bill', airtime: 'Airtime',
};

function formatDateTime(ts: any): { date: string; time: string } {
  const seconds = ts?._seconds ?? ts?.seconds;
  if (typeof seconds !== 'number') return { date: '—', time: '' };
  const d = new Date(seconds * 1000);
  return {
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  };
}

function exportCSV(statement: MonthlyStatement) {
  const header = ['Date', 'Time', 'Type', 'Reference', 'Note', 'Amount', 'Fee'];
  const lines = statement.transactions.map((tx) => {
    const { date, time } = formatDateTime(tx.createdAt);
    const signed = CREDIT_TYPES.has(tx.type) ? tx.amount : -tx.amount;
    return [date, time, TYPE_LABELS[tx.type], tx.ref, (tx.note || '').replace(/,/g, ';'), signed, tx.fee].join(',');
  });
  const csv = [header.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `statement_${statement.monthKey}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StatementsPage() {
  const { user } = useAuth();
  const [months, setMonths] = useState<MonthlyStatement[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api.get('/statements')
      .then((res) => {
        const list: MonthlyStatement[] = Array.isArray(res) ? res : res?.data || [];
        setMonths(list);
        if (list.length > 0) setSelectedKey(list[0].monthKey);
      })
      .catch((err) => setError(err?.message || 'Failed to load statements.'))
      .finally(() => setLoading(false));
  }, [user]);

  const active = months.find((m) => m.monthKey === selectedKey) || null;

  const accountRef = user?.id ? `GHP-${user.id.slice(0, 8).toUpperCase()}` : '—';

  // Native browser print → "Save as PDF" is a real, honest mechanism —
  // no server-side PDF generation is implemented, and this doesn't claim
  // any bank certification (the original mock text falsely did).
  function handlePrintToPdf() {
    window.print();
  }

  if (loading) {
    return (
      <PageWrap title="Statements" subtitle="Loading your account statements..." breadcrumb="Statements">
        <Card><div className="text-center py-10 text-secondary text-sm">Loading...</div></Card>
      </PageWrap>
    );
  }

  if (error) {
    return (
      <PageWrap title="Statements" subtitle="Download and review monthly account statements" breadcrumb="Statements">
        <div className="p-4 rounded-xl bg-error-container text-error text-sm">{error}</div>
      </PageWrap>
    );
  }

  if (months.length === 0 || !active) {
    return (
      <PageWrap title="Statements" subtitle="Download and review monthly account statements" breadcrumb="Statements">
        <Card>
          <div className="text-center py-10 text-secondary text-sm">
            No transaction history yet — statements are generated automatically as you use your wallet.
          </div>
        </Card>
      </PageWrap>
    );
  }

  return (
    <PageWrap
      title="Statements"
      subtitle="Download and review monthly account statements"
      breadcrumb="Statements"
      action={
        <div className="flex items-center gap-3 print:hidden">
          <Btn variant="secondary" size="sm" className="flex items-center gap-1.5" onClick={handlePrintToPdf}>
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            Print / Save PDF
          </Btn>
          <Btn variant="ghost" size="sm" className="flex items-center gap-1.5" onClick={() => exportCSV(active)}>
            <span className="material-symbols-outlined text-[16px]">download</span>
            CSV
          </Btn>
        </div>
      }
    >
      {/* Month Selector */}
      <Card className="mb-6 print:hidden">
        <SectionTitle>Select Month</SectionTitle>
        <div className="flex gap-2 flex-wrap">
          {months.map((m) => (
            <button
              key={m.monthKey}
              onClick={() => setSelectedKey(m.monthKey)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 focus:outline-none border-2 ${
                selectedKey === m.monthKey
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
              <div className="text-2xl font-extrabold text-error">{formatCurrency(active.totalDebits)}</div>
              <div className="text-xs text-secondary mt-1">Money out</div>
            </Card>

            <Card>
              <div className="text-[11px] font-bold text-secondary uppercase tracking-widest mb-2">TOTAL CREDITS</div>
              <div className="text-2xl font-extrabold text-success">{formatCurrency(active.totalCredits)}</div>
              <div className="text-xs text-secondary mt-1">Money in</div>
            </Card>
          </div>

          {/* Transaction List */}
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
                  {active.transactions.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-secondary">No transactions this month.</td></tr>
                  ) : (
                    active.transactions.slice().reverse().map(tx => {
                      const { date, time } = formatDateTime(tx.createdAt);
                      const isCredit = CREDIT_TYPES.has(tx.type);
                      const description = tx.counterpartyName || tx.note || TYPE_LABELS[tx.type];
                      return (
                        <tr key={tx.id} className="hover:bg-table-hover transition-colors duration-150">
                          <td className="px-6 py-3.5">
                            <div className="font-semibold text-primary">{date}</div>
                            <div className="text-xs text-secondary mt-0.5">{time}</div>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full font-bold flex items-center justify-center shrink-0 text-[10px] ${
                                  isCredit ? 'bg-[#E5F5ED] text-[#1E8449]' : 'bg-error-container text-error'
                                }`}
                              >
                                {getInitials(description)}
                              </div>
                              <div>
                                <div className="font-bold text-primary">{description}</div>
                                <div className="text-xs text-secondary">{tx.ref}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <Badge
                              label={TYPE_LABELS[tx.type]}
                              type={isCredit ? 'success' : tx.type === 'bill' ? 'warning' : 'info'}
                            />
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`font-extrabold text-sm ${isCredit ? 'text-success' : 'text-error'}`}>
                              {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Sidebar Columns (Span 4) */}
        <div className="col-span-12 lg:col-span-4 space-y-6 print:hidden">
          {/* Download Box */}
          <div className="rounded-2xl bg-gradient-to-br from-primary via-primary-container to-surface-tint p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
            <div className="text-xs font-bold text-white/70 uppercase tracking-widest mb-4">STATEMENT DOWNLOAD</div>
            <div className="text-xl font-bold mb-2">{active.label} Statement</div>
            <div className="text-xs text-white/50 mb-6 font-mono">Account: {accountRef}</div>

            <div className="space-y-3">
              <Btn variant="gold" className="w-full justify-center" onClick={handlePrintToPdf}>
                <span className="material-symbols-outlined text-[18px] mr-1">picture_as_pdf</span>
                Print / Save as PDF
              </Btn>
              <button
                className="w-full h-11 border border-white/30 rounded-xl hover:bg-white/10 transition-all font-bold text-sm flex items-center justify-center gap-1.5 focus:outline-none"
                onClick={() => exportCSV(active)}
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download CSV
              </button>
              <button
                disabled
                title="Email delivery isn't implemented in this sandbox"
                className="w-full h-11 border border-white/20 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">mail</span>
                Email Statement (coming soon)
              </button>
            </div>
          </div>

          {/* Net Position */}
          <Card>
            <SectionTitle>Net Position</SectionTitle>
            <div className="text-center py-4">
              <div className="text-xs text-secondary mb-1">Net Cash Flow</div>
              <div className={`text-3xl font-black ${
                active.totalCredits - active.totalDebits >= 0 ? 'text-success' : 'text-error'
              }`}>
                {active.totalCredits - active.totalDebits >= 0 ? '+' : ''}
                {formatCurrency(active.totalCredits - active.totalDebits)}
              </div>
              <div className="text-xs text-secondary mt-1">Credits − Debits</div>
            </div>
            <Divider />
            <div className="space-y-3 text-xs">
              {[
                ['Transactions', active.transactions.length],
                ['Avg Transaction', active.transactions.length > 0
                  ? formatCurrency((active.totalDebits + active.totalCredits) / active.transactions.length)
                  : formatCurrency(0)],
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
              <li>Statements are generated from your real transaction history</li>
              <li>Use "Print / Save as PDF" to keep a copy for your records</li>
              <li>CSV export works with Excel, Google Sheets, and most accounting tools</li>
            </ul>
          </div>
        </div>
      </div>
    </PageWrap>
  );
}
