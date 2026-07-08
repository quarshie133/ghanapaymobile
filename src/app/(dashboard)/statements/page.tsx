'use client';
import React, { useState } from 'react';
import { TRANSACTIONS } from '@/lib/mock-data';
import { formatCurrency, getInitials } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { SectionTitle, Divider, PageWrap } from '@/components/ui/Layout';
import {
  FaFilePdf, FaFileCsv, FaEnvelope, FaClipboardList
} from 'react-icons/fa6';
import T from '@/lib/tokens';

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

  React.useEffect(() => {
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
      action={
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" size="sm" icon={<FaFilePdf />}>Download PDF</Btn>
          <Btn variant="ghost" size="sm" icon={<FaFileCsv />}>Download CSV</Btn>
        </div>
      }
    >
      <style>{`.trow:hover { background: ${T.tableHover} !important; }`}</style>

      {/* Month Selector */}
      <Card style={{ marginBottom: 24 }}>
        <SectionTitle>Select Month</SectionTitle>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {MONTHS.map(m => (
            <button
              key={m.key}
              onClick={() => setSelectedKey(m.key)}
              style={{
                padding: '8px 20px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                border: `2px solid ${selectedKey === m.key ? T.navyMid : T.border}`,
                background: selectedKey === m.key ? T.navyMid : T.white,
                color: selectedKey === m.key ? '#fff' : T.textSec,
                transition: 'all 0.15s',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="statement-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Statement Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* KPI Row */}
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <Card style={{ background: T.surfaceLow }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, marginBottom: 8 }}>OPENING BALANCE</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.textPrimary }}>{formatCurrency(active.opening)}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Start of {active.label}</div>
            </Card>
            <Card style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.navyMid})`, color: '#fff', border: 'none' }}>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, letterSpacing: 0.5, marginBottom: 8 }}>CLOSING BALANCE</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.gold }}>{formatCurrency(active.closing)}</div>
              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>End of {active.label}</div>
            </Card>
            <Card>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, marginBottom: 8 }}>TOTAL DEBITS</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: T.error }}>{formatCurrency(active.debits)}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Money out</div>
            </Card>
            <Card>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, marginBottom: 8 }}>TOTAL CREDITS</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: T.success }}>{formatCurrency(active.credits)}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Money in</div>
            </Card>
          </div>

          {/* Mini Transaction List */}
          <Card>
            <SectionTitle action={<Badge label={active.label} type="navy" />}>
              Transactions — {active.label}
            </SectionTitle>
            <div className="responsive-table-wrap" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.surfaceLow }}>
                    {['Date', 'Description', 'Type', 'Amount'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txList.map(tx => (
                    <tr key={tx.id} className="trow" style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary }}>{tx.date}</div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>{tx.time}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: tx.amount > 0 ? T.successBg : T.errorBg,
                            color: tx.amount > 0 ? T.success : T.error,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 800, flexShrink: 0,
                          }}>
                            {getInitials(tx.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: T.textPrimary }}>{tx.name}</div>
                            <div style={{ fontSize: 11, color: T.textMuted }}>{tx.note}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <Badge
                          label={tx.type}
                          type={tx.type === 'Received' ? 'success' : tx.type === 'Sent' ? 'error' : tx.type === 'Bill' ? 'warning' : 'info'}
                        />
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: tx.amount > 0 ? T.success : T.error }}>
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

        {/* Right: Download & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.navyLight})`, border: 'none', color: '#fff' }}>
            <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 600, letterSpacing: 0.5, marginBottom: 16 }}>STATEMENT DOWNLOAD</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{active.label} Statement</div>
            <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 20 }}>Account: GHP-2026-00182</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Btn variant="gold" style={{ width: '100%', justifyContent: 'center' }} icon={<FaFilePdf />}>
                Download PDF
              </Btn>
              <Btn variant="ghost" style={{ width: '100%', justifyContent: 'center', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }} icon={<FaFileCsv />}>
                Download CSV
              </Btn>
              <Btn variant="ghost" style={{ width: '100%', justifyContent: 'center', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }} icon={<FaEnvelope />}>
                Email Statement
              </Btn>
            </div>
          </Card>

          <Card>
            <SectionTitle>Net Position</SectionTitle>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>Net Cash Flow</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: active.credits - active.debits >= 0 ? T.success : T.error }}>
                {active.credits - active.debits >= 0 ? '+' : ''}{formatCurrency(active.credits - active.debits)}
              </div>
              <div style={{ fontSize: 13, color: T.textMuted, marginTop: 6 }}>Credits − Debits</div>
            </div>
            <Divider />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Transactions', txList.length],
                ['Avg Transaction', `₵${Math.round((active.debits + active.credits) / txList.length)}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: T.textMuted }}>{k}</span>
                  <span style={{ fontWeight: 700, color: T.textPrimary }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ background: T.successBg, border: `1px solid ${T.success}33` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.success, marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
              <FaClipboardList /> Statement Tips
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: T.textSec, lineHeight: 2 }}>
              <li>Statements are available for the last 12 months</li>
              <li>PDF statements are bank-certified</li>
              <li>Share directly with employers or lenders</li>
            </ul>
          </Card>
        </div>
      </div>
    </PageWrap>
  );
}
