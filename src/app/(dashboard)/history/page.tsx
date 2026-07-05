'use client';
import React, { useState } from 'react';
import T from '@/lib/tokens';
import { TRANSACTIONS } from '@/lib/mock-data';
import { formatCurrency, getInitials } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { SectionTitle, PageWrap } from '@/components/ui/Layout';
import type { Transaction } from '@/types/transaction';
import {
  FaDownload, FaMagnifyingGlass, FaClipboard, FaFileInvoice, FaXmark, FaArrowRight
} from 'react-icons/fa6';

type FilterTab = 'All' | 'Sent' | 'Received' | 'Bills' | 'Airtime';

const TABS: FilterTab[] = ['All', 'Sent', 'Received', 'Bills', 'Airtime'];

const tabMap: Record<FilterTab, (t: Transaction) => boolean> = {
  All:      () => true,
  Sent:     t => t.type === 'Sent',
  Received: t => t.type === 'Received',
  Bills:    t => t.type === 'Bill',
  Airtime:  t => t.type === 'Airtime',
};

function statusBadge(s: string) {
  if (s === 'completed') return <Badge label="Completed" type="success" />;
  if (s === 'pending')   return <Badge label="Pending"   type="warning" />;
  return <Badge label="Failed" type="error" />;
}

export default function HistoryPage() {
  const [tab, setTab]         = useState<FilterTab>('All');
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState<Transaction | null>(null);

  const filtered = TRANSACTIONS.filter(t => {
    const matchTab    = tabMap[tab](t);
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.ref.includes(search);
    return matchTab && matchSearch;
  });

  return (
    <PageWrap
      title="Transaction History"
      subtitle="Full record of all your GhanaPay transactions"
      action={<Btn variant="secondary" size="sm" icon={<FaDownload />}>Export CSV</Btn>}
    >
      <style>{`.trow:hover { background: ${T.tableHover} !important; cursor: pointer; }`}</style>

      <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 24, transition: 'all 0.3s' }}>
        {/* Main Table Card */}
        <Card>
          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: tab === t ? T.navyMid : T.surfaceLow,
                  color: tab === t ? '#fff' : T.textMuted, transition: 'all 0.15s',
                }}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{ width: 240 }}>
              <Input placeholder="Search transactions…" value={search} onChange={e => setSearch(e.target.value)} icon={<FaMagnifyingGlass />} />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.surfaceLow }}>
                  {['Date', 'Recipient / Type', 'Method', 'Amount', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr
                    key={tx.id}
                    className="trow"
                    onClick={() => setSelected(s => s?.id === tx.id ? null : tx)}
                    style={{
                      borderBottom: `1px solid ${T.border}`,
                      background: selected?.id === tx.id ? T.sidebarActive : undefined,
                    }}
                  >
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontWeight: 600, color: T.textPrimary, fontSize: 12 }}>{tx.date}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>{tx.time}</div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: tx.amount > 0 ? T.successBg : T.errorBg,
                          color:      tx.amount > 0 ? T.success   : T.error,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 800,
                        }}>
                          {getInitials(tx.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: T.textPrimary }}>{tx.name}</div>
                          <div style={{ fontSize: 11, color: T.textMuted }}>{tx.type}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', color: T.textSec }}>{tx.method}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: tx.amount > 0 ? T.success : T.error }}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>{statusBadge(tx.status)}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <button
                        onClick={e => { e.stopPropagation(); setSelected(s => s?.id === tx.id ? null : tx); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: T.textMuted }}
                      >
                        {selected?.id === tx.id ? <FaXmark /> : <FaArrowRight />}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>No transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination hint */}
          <div style={{ padding: '14px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${T.border}`, marginTop: 8 }}>
            <span style={{ fontSize: 12, color: T.textMuted }}>Showing {filtered.length} of {TRANSACTIONS.length} transactions</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3].map(n => (
                <button key={n} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${n === 1 ? T.navyMid : T.border}`, background: n === 1 ? T.navyMid : 'transparent', color: n === 1 ? '#fff' : T.textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{n}</button>
              ))}
            </div>
          </div>
        </Card>

        {/* Detail Panel */}
        {selected && (
          <Card className="history-detail-panel" style={{ borderLeft: `3px solid ${T.navyMid}`, height: 'fit-content', position: 'sticky', top: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>Transaction Details</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.textMuted }}><FaXmark /></button>
            </div>

            {/* Avatar + Name */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', margin: '0 auto 10px',
                background: selected.amount > 0 ? T.successBg : T.errorBg,
                color: selected.amount > 0 ? T.success : T.error,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 800,
              }}>
                {getInitials(selected.name)}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.textPrimary }}>{selected.name}</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: selected.amount > 0 ? T.success : T.error, margin: '8px 0 4px' }}>
                {selected.amount > 0 ? '+' : ''}{formatCurrency(selected.amount)}
              </div>
              {statusBadge(selected.status)}
            </div>

            {/* Details Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
              {[
                ['Reference',  selected.ref],
                ['Date',       `${selected.date} · ${selected.time}`],
                ['Type',       selected.type],
                ['Method',     selected.method],
                ['Fee',        selected.fee > 0 ? formatCurrency(selected.fee) : 'Free'],
                ['Note',       selected.note || '—'],
              ].map(([k, v], i) => (
                <div key={k} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '11px 14px',
                  background: i % 2 === 0 ? T.surfaceLow : T.white,
                  borderBottom: i < 5 ? `1px solid ${T.border}` : 'none',
                }}>
                  <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>{k}</span>
                  <span style={{ fontSize: 12, color: T.textPrimary, fontWeight: 700, textAlign: 'right', maxWidth: '55%', wordBreak: 'break-all' }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Btn variant="secondary" size="sm" style={{ flex: 1, justifyContent: 'center' }} icon={<FaClipboard />}>Copy Ref</Btn>
              <Btn variant="primary" size="sm" style={{ flex: 2, justifyContent: 'center' }} icon={<FaFileInvoice />}>Download Receipt</Btn>
            </div>
          </Card>
        )}
      </div>
    </PageWrap>
  );
}
