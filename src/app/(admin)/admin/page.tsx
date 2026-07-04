'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import T from '@/lib/tokens';
import { KYC_QUEUE } from '@/lib/mock-data';
import { formatCurrency, getInitials } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { PageWrap, SectionTitle } from '@/components/ui/Layout';

/* ── Mock data ─────────────────────────────────────────── */
const VOLUME_TREND = [
  { day: 'Mon', volume: 182000 },
  { day: 'Tue', volume: 247000 },
  { day: 'Wed', volume: 198000 },
  { day: 'Thu', volume: 312000 },
  { day: 'Fri', volume: 389000 },
  { day: 'Sat', volume: 274000 },
  { day: 'Sun', volume: 210000 },
];

const FRAUD_ALERTS = [
  { id: 'FR-8821', user: 'Kweku Asante', type: 'Velocity', amount: 4800, risk: 'High',   time: '14 mins ago' },
  { id: 'FR-8802', user: 'Priscilla Darko', type: 'Geo-anomaly', amount: 2200, risk: 'High', time: '1 hr ago' },
  { id: 'FR-8789', user: 'Nana Boateng', type: 'Large transfer', amount: 9500, risk: 'Medium', time: '3 hrs ago' },
];

/* ── Sub-components ─────────────────────────────────────── */
function KpiCard({
  label, value, sub, subColor, icon,
}: {
  label: string; value: string; sub: string; subColor: string; icon: string;
}) {
  return (
    <Card style={{ flex: 1, minWidth: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.navy, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 12, color: subColor, marginTop: 6, fontWeight: 600 }}>{sub}</div>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg, #e8ecff 0%, #d0d8ff 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 9999, background: T.border, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 9999, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: T.textSec, minWidth: 28, textAlign: 'right' }}>{value}%</span>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function AdminOverviewPage() {
  const [approvingId, setApprovingId] = useState<string | null>(null);

  return (
    <PageWrap
      title="Admin Overview"
      subtitle="Real-time platform health and activity summary"
      breadcrumb="Admin"
    >
      {/* ── KPI Cards ── */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <KpiCard label="Total Users" value="48,291" sub="▲ +1.2% today" subColor={T.success} icon="👥" />
        <KpiCard label="Active Wallets" value="31,400" sub="65% of total users" subColor={T.textMuted} icon="💳" />
        <KpiCard label="Today's Volume" value="₵2.4M" sub="↑ ₵312K from yesterday" subColor={T.success} icon="💰" />
        <KpiCard label="Pending KYC" value="47" sub="⚠ Urgent review required" subColor={T.warning} icon="🛡" />
      </div>

      {/* ── Charts + System Health row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 24 }}>
        {/* Volume Chart */}
        <Card>
          <SectionTitle>7-Day Transaction Volume</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={VOLUME_TREND} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: T.textMuted }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: T.textMuted }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `₵${(v / 1000).toFixed(0)}k`}
                width={52}
              />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v)), 'Volume']}
                contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13 }}
              />
              <Line
                type="monotone" dataKey="volume" stroke={T.adminAccent}
                strokeWidth={2.5} dot={{ r: 4, fill: T.adminAccent }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* System Health */}
        <Card>
          <SectionTitle>System Health</SectionTitle>
          {[
            { label: 'API Uptime', value: '99.98%', note: 'All endpoints normal' },
            { label: 'DB Latency', value: '12 ms', note: 'PostgreSQL primary' },
            { label: 'SMS Gateway', value: 'OK', note: 'Hubtel — 0 errors' },
            { label: 'MoMo Webhook', value: 'OK', note: 'MTN & Vodafone live' },
            { label: 'Fraud Engine', value: 'ACTIVE', note: 'v2.4 — 3 alerts today' },
          ].map((s) => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0', borderBottom: `1px solid ${T.border}`,
            }}>
              <span style={{
                width: 9, height: 9, borderRadius: 9999,
                background: T.success, flexShrink: 0,
                boxShadow: `0 0 0 3px ${T.successBg}`,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{s.label}</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>{s.note}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.success }}>{s.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, fontSize: 11, color: T.textMuted, textAlign: 'right' }}>
            Last checked: {new Date().toLocaleTimeString()}
          </div>
        </Card>
      </div>

      {/* ── KYC Queue preview + Fraud Alerts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* KYC Queue Preview */}
        <Card>
          <SectionTitle action={
            <Btn variant="admin" size="sm" onClick={() => { window.location.href = '/admin/kyc'; }}>
              View All →
            </Btn>
          }>
            Recent KYC Queue
          </SectionTitle>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Applicant', 'Phone', 'Doc Score', 'Face Score', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {KYC_QUEUE.slice(0, 3).map((entry) => (
                  <tr key={entry.id}
                    className="trow"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = T.tableHover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
                    style={{ borderBottom: `1px solid ${T.border}` }}
                  >
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 9999,
                          background: `linear-gradient(135deg, ${T.adminAccent} 0%, ${T.navyMid} 100%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
                        }}>
                          {getInitials(entry.name)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{entry.name}</div>
                          <div style={{ fontSize: 11, color: T.textMuted }}>{entry.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 12px', fontSize: 13, color: T.textSec }}>{entry.phone}</td>
                    <td style={{ padding: '12px 12px', minWidth: 120 }}>
                      <ScoreBar value={entry.docScore} color={entry.docScore >= 90 ? T.success : T.warning} />
                    </td>
                    <td style={{ padding: '12px 12px', minWidth: 120 }}>
                      <ScoreBar value={entry.faceScore} color={entry.faceScore >= 85 ? T.success : T.warning} />
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <Badge
                        label={entry.status === 'urgent' ? '⚠ Urgent' : 'Pending'}
                        type={entry.status === 'urgent' ? 'warning' : 'info'}
                      />
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn
                          variant="success" size="sm"
                          onClick={() => setApprovingId(entry.id)}
                        >
                          {approvingId === entry.id ? '✓' : 'Approve'}
                        </Btn>
                        <Btn variant="danger" size="sm">Reject</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Fraud Alerts */}
        <Card>
          <SectionTitle action={
            <Btn variant="ghost" size="sm" style={{ color: T.error, fontSize: 12 }}
              onClick={() => { window.location.href = '/admin/fraud'; }}>
              View All
            </Btn>
          }>
            🚨 Fraud Alerts
          </SectionTitle>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{
              flex: 1, textAlign: 'center', padding: '10px 0',
              background: T.errorBg, borderRadius: 10,
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.error }}>3</div>
              <div style={{ fontSize: 11, color: T.error, fontWeight: 600 }}>High Risk</div>
            </div>
            <div style={{
              flex: 1, textAlign: 'center', padding: '10px 0',
              background: T.warningBg, borderRadius: 10,
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.warning }}>5</div>
              <div style={{ fontSize: 11, color: T.warning, fontWeight: 600 }}>Medium</div>
            </div>
          </div>

          {FRAUD_ALERTS.map((alert) => (
            <div key={alert.id} style={{
              padding: '12px', borderRadius: 10,
              background: alert.risk === 'High' ? T.errorBg : T.warningBg,
              marginBottom: 8, border: `1px solid ${alert.risk === 'High' ? '#f5c6c2' : '#f5ddb0'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: alert.risk === 'High' ? T.error : T.warning }}>
                  {alert.id}
                </span>
                <Badge label={alert.risk} type={alert.risk === 'High' ? 'error' : 'warning'} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{alert.user}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 12, color: T.textMuted }}>{alert.type}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>{formatCurrency(alert.amount)}</span>
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{alert.time}</div>
            </div>
          ))}
        </Card>
      </div>
    </PageWrap>
  );
}
