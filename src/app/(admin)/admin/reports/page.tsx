'use client';

import { useState } from 'react';
import T from '@/lib/tokens';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { PageWrap, SectionTitle, Divider } from '@/components/ui/Layout';
import {
  FaMoneyBillTransfer, FaArrowTrendUp, FaShieldHalved, FaMoneyBillTrendUp, FaTriangleExclamation, FaFileInvoice, FaGear, FaHourglassHalf
} from 'react-icons/fa6';

/* ── Report Types ───────────────────────────────────────── */
interface Report {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  format: string;
  category: string;
  implemented: boolean;
}

const REPORTS: Report[] = [
  {
    id: 'RPT-001',
    icon: <FaMoneyBillTransfer />,
    title: 'Transaction Summary',
    description: 'Real CSV export of all platform transactions in the selected date range, from src/lib/admin-transactions.ts.',
    format: 'CSV',
    category: 'Operations',
    implemented: true,
  },
  {
    id: 'RPT-002',
    icon: <FaArrowTrendUp />,
    title: 'User Growth Report',
    description: 'New registrations, activation rates, churn analysis, and tier distribution over time.',
    format: 'PDF',
    category: 'Analytics',
    implemented: false,
  },
  {
    id: 'RPT-003',
    icon: <FaShieldHalved />,
    title: 'KYC Compliance',
    description: 'Approval/rejection rates and review turnaround time for identity verification submissions.',
    format: 'PDF',
    category: 'Compliance',
    implemented: false,
  },
  {
    id: 'RPT-004',
    icon: <FaTriangleExclamation />,
    title: 'Fraud & Risk Report',
    description: 'Summary of flagged alerts, false-positive rate, and resolution outcomes.',
    format: 'PDF',
    category: 'Security',
    implemented: false,
  },
  {
    id: 'RPT-005',
    icon: <FaMoneyBillTrendUp />,
    title: 'Revenue & Fees',
    description: 'Fee income breakdown by transaction type over the selected period.',
    format: 'CSV + PDF',
    category: 'Finance',
    implemented: false,
  },
  {
    id: 'RPT-006',
    icon: <FaFileInvoice />,
    title: 'Regulatory Filing',
    description: 'Formatted export for Bank of Ghana / regulatory submission requirements.',
    format: 'PDF',
    category: 'Regulatory',
    implemented: false,
  },
];

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Operations: { bg: T.infoBg,    color: T.info    },
  Analytics:  { bg: '#e8ecff',   color: T.adminAccent },
  Compliance: { bg: T.warningBg, color: T.warning  },
  Finance:    { bg: T.successBg, color: T.success  },
  Security:   { bg: T.errorBg,   color: T.error    },
  Regulatory: { bg: '#FBF3D9',   color: T.goldDark },
};

/* ── Page ───────────────────────────────────────────────── */
export default function AdminReportsPage() {
  const [fromDate, setFromDate] = useState('2026-06-01');
  const [toDate, setToDate] = useState('2026-06-30');
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleGenerateTransactionSummary = async () => {
    setGenerating('RPT-001');
    setError('');
    try {
      const res = await api.get('/admin/transactions');
      const all = Array.isArray(res) ? res : res?.data || [];
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // inclusive of the whole "to" day

      const filtered = all.filter((tx: any) => {
        const seconds = tx.createdAt?._seconds ?? tx.createdAt?.seconds;
        if (typeof seconds !== 'number') return false;
        const d = new Date(seconds * 1000);
        return d >= from && d <= to;
      });

      if (filtered.length === 0) {
        setError('No transactions found in the selected date range.');
        return;
      }

      const header = ['Reference', 'User', 'Type', 'Amount', 'Fee', 'Status', 'Note'];
      const lines = filtered.map((tx: any) =>
        [tx.ref, tx.userName, tx.type, tx.amount, tx.fee, tx.status, (tx.note || '').replace(/,/g, ';')].join(',')
      );
      const csv = [header.join(','), ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaction_summary_${fromDate}_to_${toDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate report.');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <PageWrap
      title="Reports"
      subtitle="Generate and download platform compliance and analytics reports"
      breadcrumb="Admin / Reports"
    >
      {/* ── Honesty banner ── */}
      <div style={{
        padding: '12px 16px', borderRadius: 10, background: T.warningBg,
        border: `1px solid #f5ddb0`, color: T.textSec, fontSize: 13, marginBottom: 20,
      }}>
        Only <strong>Transaction Summary</strong> generates a real report right now (a live CSV export of actual
        platform transactions). The other 5 report types below are shown to illustrate the intended catalog, but
        aren't implemented yet — their Generate/Download buttons are disabled rather than faking output.
      </div>

      {error && (
        <div style={{ padding: 14, borderRadius: 10, background: T.errorBg, color: T.error, fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* ── Date Filter ── */}
      <Card style={{ marginBottom: 24 }}>
        <SectionTitle>Report Period</SectionTitle>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <Input
              label="From"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <Input
              label="To"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Today', 'This Week', 'This Month', 'Last Month'].map((p) => (
              <button key={p} style={{
                padding: '8px 14px', borderRadius: 9999, border: `1px solid ${T.border}`,
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                color: T.textSec, background: T.surfaceLow,
                transition: 'all 0.12s',
              }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Report Cards Grid 2×3 ── */}
      <div style={{ marginBottom: 24 }}>
        <SectionTitle action={
          <Badge label={`${REPORTS.length} report types`} type="default" />
        }>
          Available Reports
        </SectionTitle>
        <div className="analytics-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {REPORTS.map((report) => {
            const catStyle = CATEGORY_COLORS[report.category] ?? { bg: T.infoBg, color: T.info };
            return (
              <Card key={report.id} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: catStyle.bg, border: `1px solid ${catStyle.color}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {report.icon}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: catStyle.bg, color: catStyle.color,
                    padding: '3px 10px', borderRadius: 9999,
                  }}>
                    {report.category}
                  </span>
                </div>

                {/* Title + Description */}
                <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 6 }}>
                  {report.title}
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6, flex: 1, marginBottom: 14 }}>
                  {report.description}
                </div>

                <Divider />

                {/* Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>Status</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: report.implemented ? T.success : T.textMuted }}>
                      {report.implemented ? 'Live — real data' : 'Not implemented'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: T.textMuted }}>Format</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>
                      {report.format}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn
                    variant="admin"
                    size="sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={report.implemented ? handleGenerateTransactionSummary : undefined}
                    disabled={!report.implemented || generating === report.id}
                    icon={generating === report.id ? <FaHourglassHalf /> : <FaGear />}
                  >
                    {generating === report.id ? 'Generating…' : report.implemented ? 'Generate & Download' : 'Not available'}
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Recent Activity ──
          Removed: the original mock invented named admins ("Esi Amankwah",
          "Kofi Admin") generating reports that never happened. This
          project doesn't track report-generation history anywhere, so
          rather than fabricate that audit trail, it's simply not shown. */}
    </PageWrap>
  );
}
