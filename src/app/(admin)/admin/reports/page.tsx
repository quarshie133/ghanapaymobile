'use client';

import { useState } from 'react';
import T from '@/lib/tokens';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { PageWrap, SectionTitle, Divider } from '@/components/ui/Layout';

/* ── Report Types ───────────────────────────────────────── */
interface Report {
  id: string;
  icon: string;
  title: string;
  description: string;
  lastGenerated: string;
  format: string;
  category: string;
  size: string;
}

const REPORTS: Report[] = [
  {
    id: 'RPT-001',
    icon: '💸',
    title: 'Transaction Summary',
    description: 'Complete breakdown of all transactions by type, method, and status across the selected period.',
    lastGenerated: '4 Jul 2026, 08:00',
    format: 'CSV + PDF',
    category: 'Operations',
    size: '2.4 MB',
  },
  {
    id: 'RPT-002',
    icon: '📈',
    title: 'User Growth Report',
    description: 'New registrations, activation rates, churn analysis, and tier distribution over time.',
    lastGenerated: '3 Jul 2026, 18:30',
    format: 'PDF',
    category: 'Analytics',
    size: '1.1 MB',
  },
  {
    id: 'RPT-003',
    icon: '🛡',
    title: 'KYC Compliance',
    description: 'KYC approval rates, rejection reasons, average processing time, and tier upgrade funnel.',
    lastGenerated: '4 Jul 2026, 06:00',
    format: 'PDF + XLSX',
    category: 'Compliance',
    size: '890 KB',
  },
  {
    id: 'RPT-004',
    icon: '💰',
    title: 'Revenue Report',
    description: 'Fee revenue, transaction volume, gross margin, and MoMo/Bank channel breakdown.',
    lastGenerated: '1 Jul 2026, 09:00',
    format: 'XLSX',
    category: 'Finance',
    size: '560 KB',
  },
  {
    id: 'RPT-005',
    icon: '🚨',
    title: 'Fraud Report',
    description: 'Flagged transactions, risk scores distribution, blocked IPs, and false-positive rates.',
    lastGenerated: '4 Jul 2026, 07:30',
    format: 'PDF',
    category: 'Security',
    size: '1.8 MB',
  },
  {
    id: 'RPT-006',
    icon: '📋',
    title: 'Regulatory Filing',
    description: 'Bank of Ghana AML/CTF report formatted for BoG regulatory submission requirements.',
    lastGenerated: '30 Jun 2026, 23:59',
    format: 'PDF',
    category: 'Regulatory',
    size: '3.2 MB',
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

/* ── Recent Activity ────────────────────────────────────── */
const RECENT_REPORTS = [
  { name: 'Transaction Summary', by: 'Esi Amankwah', time: 'Today 08:00', size: '2.4 MB' },
  { name: 'Fraud Report',        by: 'Kofi Admin',   time: 'Today 07:30', size: '1.8 MB' },
  { name: 'KYC Compliance',      by: 'Esi Amankwah', time: 'Today 06:00', size: '890 KB' },
  { name: 'User Growth',         by: 'System Auto',  time: 'Yesterday 18:30', size: '1.1 MB' },
];

/* ── Page ───────────────────────────────────────────────── */
export default function AdminReportsPage() {
  const [fromDate, setFromDate] = useState('2026-06-01');
  const [toDate, setToDate] = useState('2026-06-30');
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = (id: string) => {
    setGenerating(id);
    setTimeout(() => setGenerating(null), 2000);
  };

  return (
    <PageWrap
      title="Reports"
      subtitle="Generate and download platform compliance and analytics reports"
      breadcrumb="Admin / Reports"
    >
      {/* ── Quick Stats ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Generated This Month', value: '24', icon: '📊', color: T.adminAccent },
          { label: 'Scheduled Reports', value: '6',  icon: '🗓', color: T.navy },
          { label: 'Last Export',   value: 'Today',  icon: '✅', color: T.success },
          { label: 'Pending Filing', value: '1',     icon: '⚠',  color: T.warning },
        ].map((s) => (
          <Card key={s.label} style={{ flex: 1, minWidth: 160, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>

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
          <div style={{ display: 'flex', gap: 8 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {REPORTS.map((report) => {
            const catStyle = CATEGORY_COLORS[report.category] ?? { bg: T.infoBg, color: T.info };
            const isGenerating = generating === report.id;
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
                    <div style={{ fontSize: 11, color: T.textMuted }}>Last generated</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>{report.lastGenerated}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: T.textMuted }}>Format · Size</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>
                      {report.format} · {report.size}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn
                    variant="admin"
                    size="sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => handleGenerate(report.id)}
                    disabled={isGenerating}
                    icon={isGenerating ? '⏳' : '⚙'}
                  >
                    {isGenerating ? 'Generating…' : 'Generate'}
                  </Btn>
                  <Btn
                    variant="secondary"
                    size="sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                    icon="⬇"
                  >
                    Download
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <Card>
        <SectionTitle>Recent Generation Activity</SectionTitle>
        {RECENT_REPORTS.map((r, i) => (
          <div key={r.name + i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: '#e8ecff', border: `1px solid ${T.adminAccent}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>📋</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>Generated by {r.by} · {r.time}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: T.textMuted }}>{r.size}</span>
                <Btn variant="ghost" size="sm" icon="⬇" style={{ color: T.adminAccent }}>Download</Btn>
              </div>
            </div>
            {i < RECENT_REPORTS.length - 1 && <Divider />}
          </div>
        ))}
      </Card>
    </PageWrap>
  );
}
