'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  FaUsers, FaCreditCard, FaMoneyBillTrendUp, FaShieldHalved
} from 'react-icons/fa6';
import T from '@/lib/tokens';
import { api } from '@/lib/api';
import { formatCurrency, getInitials } from '@/lib/utils';
import { DEMO_FRAUD_ALERTS } from '@/lib/demo-fraud-data';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { PageWrap, SectionTitle } from '@/components/ui/Layout';

/* ── Sub-components ─────────────────────────────────────── */
function KpiCard({
  label, value, sub, subColor, icon,
}: {
  label: string; value: string; sub: string; subColor: string; icon: React.ReactNode;
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

/* ── Page ───────────────────────────────────────────────── */
export default function AdminOverviewPage() {
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastChecked, setLastChecked] = useState<string>('');

  const fetchOverview = () => {
    api.get('/admin/overview')
      .then(res => {
        setData(res.data || res);
        setLoading(false);
        setLastChecked(new Date().toLocaleTimeString());
      })
      .catch((err) => {
        setLoading(false);
        setError(err?.message || 'Failed to load dashboard data. You may need administrator access.');
      });
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleApproveKyc = async (uid: string) => {
    setApprovingId(uid);
    try {
      await api.patch('/kyc', { uid, action: 'approve' });
      fetchOverview();
    } catch (e) {
      console.error(e);
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectKyc = async (uid: string) => {
    try {
      await api.patch('/kyc', { uid, action: 'reject' });
      fetchOverview();
    } catch (e) {
      console.error(e);
    }
  };

  const highRiskCount = DEMO_FRAUD_ALERTS.filter((f) => f.risk === 'High').length;
  const medRiskCount = DEMO_FRAUD_ALERTS.filter((f) => f.risk !== 'High').length;

  return (
    <PageWrap
      title="Admin Overview"
      subtitle="Platform activity summary"
      breadcrumb="Admin"
    >
      {error && (
        <div style={{ padding: 14, borderRadius: 10, background: T.errorBg, color: T.error, fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <KpiCard
          label="Total Users"
          value={data ? Number(data.totalUsers).toLocaleString() : '...'}
          sub="Registered accounts"
          subColor={T.textMuted}
          icon={<FaUsers />}
        />
        <KpiCard
          label="Active Wallets"
          value={data ? Number(data.activeUsers).toLocaleString() : '...'}
          sub={data ? `${Math.round((data.activeUsers / data.totalUsers) * 100)}% of total users` : '...'}
          subColor={T.textMuted}
          icon={<FaCreditCard />}
        />
        <KpiCard
          label="Total Volume"
          value={data ? `₵${Number(data.totalVolume).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '...'}
          sub="Platform volume"
          subColor={T.success}
          icon={<FaMoneyBillTrendUp />}
        />
        <KpiCard
          label="Pending KYC"
          value={data ? String(data.pendingKyc) : '...'}
          sub={data?.pendingKyc > 0 ? "⚠ Review required" : "All clear"}
          subColor={data?.pendingKyc > 0 ? T.warning : T.success}
          icon={<FaShieldHalved />}
        />
      </div>

      {/* ── Charts + System Health row ── */}
      <div className="analytics-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 24 }}>
        {/* Volume Chart */}
        <Card>
          <SectionTitle>7-Day Transaction Volume</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.volumeTrend || []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
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

        {/* Platform Snapshot — real derived stats, not fabricated infra monitoring */}
        <Card>
          <SectionTitle>Platform Snapshot</SectionTitle>
          {[
            { label: 'Total Registered Users', value: data ? Number(data.totalUsers).toLocaleString() : '...', note: 'From Firestore users collection' },
            { label: 'Active Accounts', value: data ? Number(data.activeUsers).toLocaleString() : '...', note: 'Not suspended' },
            { label: 'Pending KYC Reviews', value: data ? String(data.pendingKyc) : '...', note: 'Awaiting admin decision' },
            { label: '7-Day Transaction Volume', value: data ? formatCurrency(data.volumeTrend?.reduce((s: number, d: any) => s + d.volume, 0) || 0) : '...', note: 'Sum of last 7 days' },
          ].map((s) => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0', borderBottom: `1px solid ${T.border}`,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{s.label}</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>{s.note}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{s.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, fontSize: 11, color: T.textMuted, textAlign: 'right' }}>
            Last refreshed: {lastChecked || '...'}
          </div>
        </Card>
      </div>

      {/* ── KYC Queue preview + Fraud Alerts row ── */}
      <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* KYC Queue Preview */}
        <Card>
          <SectionTitle action={
            <Btn variant="admin" size="sm" onClick={() => { window.location.href = '/admin/kyc'; }}>
              View All →
            </Btn>
          }>
            Recent KYC Queue
          </SectionTitle>

          <div className="responsive-table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Applicant', 'Phone', 'Documents', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.kycQueue || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
                      No pending KYC applications.
                    </td>
                  </tr>
                ) : (
                  (data.kycQueue).map((entry: any) => (
                    <tr key={entry.uid}
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
                            <div style={{ fontSize: 11, color: T.textMuted }}>{entry.uid.substring(0, 10)}...</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 12px', fontSize: 13, color: T.textSec }}>{entry.phone || '—'}</td>
                      <td style={{ padding: '12px 12px', fontSize: 13, color: T.textSec }}>{entry.submittedCount} / 3 submitted</td>
                      <td style={{ padding: '12px 12px' }}>
                        <Badge label="Pending Review" type="warning" />
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Btn
                            variant="success" size="sm"
                            disabled={approvingId === entry.uid}
                            onClick={() => handleApproveKyc(entry.uid)}
                          >
                            {approvingId === entry.uid ? '...' : 'Approve'}
                          </Btn>
                          <Btn
                            variant="danger" size="sm"
                            onClick={() => handleRejectKyc(entry.uid)}
                          >
                            Reject
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><FaShieldHalved /> Fraud Alerts</span>
          </SectionTitle>

          <div style={{ padding: '8px 12px', fontSize: 11, color: T.textMuted, fontStyle: 'italic' }}>
            Demo data — no live detection engine (see /admin/fraud for details)
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{
              flex: 1, textAlign: 'center', padding: '10px 0',
              background: T.errorBg, borderRadius: 10,
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.error }}>{highRiskCount}</div>
              <div style={{ fontSize: 11, color: T.error, fontWeight: 600 }}>High Risk</div>
            </div>
            <div style={{
              flex: 1, textAlign: 'center', padding: '10px 0',
              background: T.warningBg, borderRadius: 10,
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.warning }}>{medRiskCount}</div>
              <div style={{ fontSize: 11, color: T.warning, fontWeight: 600 }}>Medium/Low</div>
            </div>
          </div>

          {DEMO_FRAUD_ALERTS.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
              No open fraud alerts.
            </div>
          ) : (
            DEMO_FRAUD_ALERTS.map((alert) => (
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
            ))
          )}
        </Card>
      </div>
    </PageWrap>
  );
}
