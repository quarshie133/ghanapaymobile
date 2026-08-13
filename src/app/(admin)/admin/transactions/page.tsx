'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import T from '@/lib/tokens';
import { formatCurrency, getInitials } from '@/lib/utils';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { PageWrap, SectionTitle } from '@/components/ui/Layout';
import { FaFileExport, FaMagnifyingGlass, FaClipboardList, FaMoneyBillWave, FaChartBar, FaHourglassHalf } from 'react-icons/fa6';

/**
 * Real cross-user transaction ledger, backed by src/lib/admin-transactions.ts.
 * Previously this page read from TRANSACTIONS in mock-data.ts — fabricated
 * rows with no relationship to anything that actually happened.
 *
 * Dropped from the original mock: the `method` column ("Mobile Money",
 * "Bank Transfer", etc.) — never tracked anywhere real in the ledger.
 * Replaced with the transaction's `note` field, which IS real.
 */

interface AdminTransactionRow {
  id: string;
  uid: string;
  userName: string;
  type: 'topup' | 'withdrawal' | 'transfer_out' | 'transfer_in' | 'bill' | 'airtime';
  amount: number;
  fee: number;
  status: 'pending' | 'successful' | 'failed' | 'reversed';
  ref: string;
  note: string | null;
  counterpartyName: string | null;
  createdAt: any;
}

const TYPE_LABELS: Record<AdminTransactionRow['type'], string> = {
  topup: 'Top-up', withdrawal: 'Withdrawal', transfer_out: 'Transfer Sent',
  transfer_in: 'Transfer Received', bill: 'Bill Payment', airtime: 'Airtime',
};
const CREDIT_TYPES = new Set(['topup', 'transfer_in']);

function typeBadge(type: AdminTransactionRow['type']) {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
    topup: 'success', transfer_in: 'success', withdrawal: 'info',
    transfer_out: 'info', bill: 'warning', airtime: 'default',
  };
  return <Badge label={TYPE_LABELS[type]} type={map[type] ?? 'default'} />;
}

function statusBadge(s: string) {
  const map: Record<string, { type: 'success' | 'error' | 'warning'; label: string }> = {
    successful: { type: 'success', label: '✓ Successful' },
    pending: { type: 'warning', label: '⏳ Pending' },
    failed: { type: 'error', label: '✕ Failed' },
    reversed: { type: 'warning', label: '↩ Reversed' },
  };
  const m = map[s] || { type: 'warning' as const, label: s };
  return <Badge label={m.label} type={m.type} />;
}

function formatDateTime(ts: any): { date: string; time: string } {
  const seconds = ts?._seconds ?? ts?.seconds;
  if (typeof seconds !== 'number') return { date: '—', time: '' };
  const d = new Date(seconds * 1000);
  return {
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  };
}

function exportCSV(rows: AdminTransactionRow[]) {
  const header = ['Ref', 'User', 'Type', 'Amount', 'Fee', 'Status', 'Note'];
  const lines = rows.map((r) =>
    [r.ref, r.userName, TYPE_LABELS[r.type], r.amount, r.fee, r.status, (r.note || '').replace(/,/g, ';')].join(',')
  );
  const csv = [header.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transactions_export.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const TYPE_FILTERS = ['All', 'topup', 'withdrawal', 'transfer_out', 'transfer_in', 'bill', 'airtime'] as const;

export default function AdminTransactionsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<typeof TYPE_FILTERS[number]>('All');
  const [transactions, setTransactions] = useState<AdminTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = typeFilter !== 'All' ? `?type=${typeFilter}` : '';
      const res = await api.get(`/admin/transactions${query}`);
      const list: AdminTransactionRow[] = Array.isArray(res) ? res : res?.data || [];
      setTransactions(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load transactions. You may need administrator access.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        t.userName.toLowerCase().includes(search.toLowerCase()) ||
        t.ref.toLowerCase().includes(search.toLowerCase()) ||
        (t.note || '').toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [transactions, search]);

  const totalVolume = filtered.reduce((sum, t) => sum + t.amount, 0);
  const avgAmount = filtered.length > 0 ? totalVolume / filtered.length : 0;
  const pendingCount = filtered.filter((t) => t.status === 'pending').length;

  return (
    <PageWrap
      title="Transaction Monitoring"
      subtitle="Real-time audit trail of platform transactions"
      breadcrumb="Admin / Transactions"
      action={
        <Btn variant="admin" icon={<FaFileExport />} onClick={() => exportCSV(filtered)}>
          Export CSV
        </Btn>
      }
    >
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 220 }}>
            <Input
              label="Search"
              placeholder="Search user, reference, note…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<FaMagnifyingGlass />}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
          {TYPE_FILTERS.map((f) => (
            <button key={f} onClick={() => setTypeFilter(f)} style={{
              padding: '6px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, transition: 'all 0.12s',
              background: typeFilter === f ? T.adminAccent : T.surfaceLow,
              color: typeFilter === f ? '#fff' : T.textSec,
            }}>
              {f === 'All' ? 'All' : TYPE_LABELS[f]}
            </button>
          ))}
        </div>
      </Card>

      {error && (
        <div style={{ padding: 14, borderRadius: 10, background: T.errorBg, color: T.error, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Transactions', value: filtered.length.toString(), icon: <FaClipboardList />, color: T.navy },
          { label: 'Total Volume', value: formatCurrency(totalVolume), icon: <FaMoneyBillWave />, color: T.success },
          { label: 'Average Amount', value: formatCurrency(avgAmount), icon: <FaChartBar />, color: T.adminAccent },
          { label: 'Pending', value: pendingCount.toString(), icon: <FaHourglassHalf />, color: T.warning },
        ].map((s) => (
          <Card key={s.label} style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <SectionTitle action={
          <span style={{ padding: '0 20px', fontSize: 13, color: T.textMuted }}>{filtered.length} transactions</span>
        }>
          <div style={{ padding: '20px 20px 0' }}>Transaction List</div>
        </SectionTitle>

        <div className="responsive-table-wrap" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.surfaceLow, borderBottom: `2px solid ${T.border}` }}>
                {['Reference', 'Date & Time', 'User', 'Type', 'Note', 'Amount', 'Fee', 'Status'].map((h) => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: T.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>Loading…</td></tr>
              )}
              {!loading && filtered.map((tx, i) => {
                const { date, time } = formatDateTime(tx.createdAt);
                const isCredit = CREDIT_TYPES.has(tx.type);
                return (
                  <tr
                    key={tx.id}
                    className="trow"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = T.tableHover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
                    style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.white : '#FAFBFF' }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: T.adminAccent, fontWeight: 600 }}>{tx.ref}</span>
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 13, color: T.textPrimary }}>{date}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>{time}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 9999, flexShrink: 0,
                          background: `linear-gradient(135deg, ${T.adminAccent}22 0%, ${T.navyMid}22 100%)`,
                          border: `1.5px solid ${T.adminAccent}33`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: T.adminAccent, fontSize: 11, fontWeight: 700,
                        }}>
                          {getInitials(tx.userName)}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{tx.userName}</div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>{typeBadge(tx.type)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: T.textSec, maxWidth: 200 }}>{tx.note || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: isCredit ? T.success : T.textPrimary }}>
                        {isCredit ? '+' : '-'}₵{tx.amount.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: T.textMuted }}>
                      {tx.fee > 0 ? `₵${tx.fee.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>{statusBadge(tx.status)}</td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>
                    No transactions found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PageWrap>
  );
}
