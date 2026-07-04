'use client';

import { useState, useMemo } from 'react';
import T from '@/lib/tokens';
import { TRANSACTIONS } from '@/lib/mock-data';
import { formatCurrency, getInitials } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { PageWrap, SectionTitle } from '@/components/ui/Layout';

/* ── Helpers ────────────────────────────────────────────── */
function typeBadge(type: string) {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
    Received: 'success', Sent: 'info', Bill: 'warning', Airtime: 'default',
  };
  return <Badge label={type} type={map[type] ?? 'default'} />;
}

function statusBadge(s: string) {
  return <Badge label={s === 'completed' ? '✓ Completed' : '⏳ Pending'} type={s === 'completed' ? 'success' : 'warning'} />;
}

/* ── CSV Export ─────────────────────────────────────────── */
function exportCSV(rows: typeof TRANSACTIONS) {
  const header = ['Ref', 'Date', 'Time', 'Name', 'Type', 'Method', 'Amount', 'Status'];
  const lines = rows.map((r) =>
    [r.ref, r.date, r.time, r.name, r.type, r.method, r.amount, r.status].join(',')
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

/* ── Page ───────────────────────────────────────────────── */
export default function AdminTransactionsPage() {
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('2026-06-10');
  const [toDate, setToDate] = useState('2026-06-16');
  const [typeFilter, setTypeFilter] = useState('All');

  const TYPE_FILTERS = ['All', 'Sent', 'Received', 'Bill', 'Airtime'];

  const filtered = useMemo(() => {
    return TRANSACTIONS.filter((t) => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase())
        || t.ref.toLowerCase().includes(search.toLowerCase())
        || t.method.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'All' || t.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [search, typeFilter]);

  const totalVolume = filtered.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const avgAmount = filtered.length > 0 ? totalVolume / filtered.length : 0;

  return (
    <PageWrap
      title="Transaction Monitoring"
      subtitle="Full audit trail of platform transactions"
      breadcrumb="Admin / Transactions"
      action={
        <Btn variant="admin" icon="📤" onClick={() => exportCSV(filtered)}>
          Export CSV
        </Btn>
      }
    >
      {/* ── Date Range + Search ── */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <Input
              label="From Date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <Input
              label="To Date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div style={{ flex: 2, minWidth: 220 }}>
            <Input
              label="Search"
              placeholder="Search name, ref, method…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon="🔍"
            />
          </div>
          <div>
            <Btn variant="admin">Apply Filter</Btn>
          </div>
        </div>

        {/* Type filter pills */}
        <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
          {TYPE_FILTERS.map((f) => (
            <button key={f} onClick={() => setTypeFilter(f)} style={{
              padding: '6px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, transition: 'all 0.12s',
              background: typeFilter === f ? T.adminAccent : T.surfaceLow,
              color: typeFilter === f ? '#fff' : T.textSec,
            }}>
              {f}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Stats Row ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Transactions', value: filtered.length.toString(), icon: '📋', color: T.navy },
          { label: 'Total Volume', value: formatCurrency(totalVolume), icon: '💰', color: T.success },
          { label: 'Average Amount', value: formatCurrency(avgAmount), icon: '📊', color: T.adminAccent },
          { label: 'Pending', value: filtered.filter((t) => t.status === 'pending').length.toString(), icon: '⏳', color: T.warning },
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

      {/* ── Table ── */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <SectionTitle action={
          <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: T.textMuted }}>{filtered.length} transactions</span>
            <Btn variant="admin" size="sm" icon="📤" onClick={() => exportCSV(filtered)}>CSV</Btn>
          </div>
        }>
          <div style={{ padding: '20px 20px 0' }}>Transaction List</div>
        </SectionTitle>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.surfaceLow, borderBottom: `2px solid ${T.border}` }}>
                {['Reference', 'Date & Time', 'Name', 'Type', 'Method', 'Amount', 'Fee', 'Status'].map((h) => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: T.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx, i) => (
                <tr
                  key={tx.id}
                  className="trow"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = T.tableHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                    background: i % 2 === 0 ? T.white : '#FAFBFF',
                    cursor: 'default', transition: 'background 0.1s',
                  }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: T.adminAccent, fontWeight: 600 }}>
                      {tx.ref}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: 13, color: T.textPrimary }}>{tx.date}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{tx.time}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {tx.phone ? (
                        <div style={{
                          width: 32, height: 32, borderRadius: 9999, flexShrink: 0,
                          background: `linear-gradient(135deg, ${T.adminAccent}22 0%, ${T.navyMid}22 100%)`,
                          border: `1.5px solid ${T.adminAccent}33`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: T.adminAccent, fontSize: 11, fontWeight: 700,
                        }}>
                          {getInitials(tx.name)}
                        </div>
                      ) : (
                        <div style={{
                          width: 32, height: 32, borderRadius: 9999, flexShrink: 0,
                          background: T.surfaceLow, border: `1.5px solid ${T.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14,
                        }}>🏢</div>
                      )}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{tx.name}</div>
                        {tx.phone && <div style={{ fontSize: 11, color: T.textMuted }}>{tx.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>{typeBadge(tx.type)}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: T.textSec, whiteSpace: 'nowrap' }}>{tx.method}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: 14, fontWeight: 700,
                      color: tx.amount >= 0 ? T.success : T.textPrimary,
                    }}>
                      {tx.amount >= 0 ? '+' : '-'}₵{Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: T.textMuted }}>
                    {tx.fee > 0 ? `₵${tx.fee.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>{statusBadge(tx.status)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
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
