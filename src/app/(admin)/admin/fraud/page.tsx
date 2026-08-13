'use client';

import { useState } from 'react';
import T from '@/lib/tokens';
import { formatCurrency, getInitials } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { PageWrap, SectionTitle, Divider } from '@/components/ui/Layout';
import {
  FaCircle, FaClipboardList, FaBan, FaShieldHalved
} from 'react-icons/fa6';
import {
  DEMO_FRAUD_ALERTS as FRAUD_DATA, DEMO_BLOCKED_IPS as BLOCKED_IPS,
  type FraudAlert, type RiskLevel, type AlertStatus,
} from '@/lib/demo-fraud-data';

/**
 * DEMO DATA — see src/lib/demo-fraud-data.ts. There is no real fraud
 * detection in this project (explicitly future work per the brief §26).
 * This page and the admin dashboard's fraud summary card both import the
 * same shared array, so the numbers always agree with each other.
 */

/* ── Score Bar ──────────────────────────────────────────── */
function RiskBar({ score, risk }: { score: number; risk: RiskLevel }) {
  const color = risk === 'High' ? T.error : risk === 'Medium' ? T.warning : T.success;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 90, height: 6, borderRadius: 9999, background: T.border, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 9999 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 24 }}>{score}</span>
    </div>
  );
}

function riskBadge(risk: RiskLevel) {
  const map: Record<RiskLevel, 'error' | 'warning' | 'success'> = {
    High: 'error', Medium: 'warning', Low: 'success',
  };
  return <Badge label={risk} type={map[risk]} />;
}

function statusBadge(s: AlertStatus) {
  const map: Record<AlertStatus, 'error' | 'warning' | 'default'> = {
    open: 'error', investigating: 'warning', dismissed: 'default',
  };
  const labels: Record<AlertStatus, string> = {
    open: '🔴 Open', investigating: '🔍 Investigating', dismissed: '✓ Dismissed',
  };
  return <Badge label={labels[s]} type={map[s]} />;
}

/* ── Page ───────────────────────────────────────────────── */
export default function AdminFraudPage() {
  const [alertStatuses, setAlertStatuses] = useState<Record<string, AlertStatus>>(
    Object.fromEntries(FRAUD_DATA.map((a) => [a.id, a.status]))
  );
  const [riskFilter, setRiskFilter] = useState<'All' | RiskLevel>('All');

  const handleInvestigate = (id: string) => {
    setAlertStatuses((prev) => ({ ...prev, [id]: 'investigating' }));
  };
  const handleDismiss = (id: string) => {
    setAlertStatuses((prev) => ({ ...prev, [id]: 'dismissed' }));
  };

  const filtered = FRAUD_DATA.filter((a) =>
    riskFilter === 'All' || a.risk === riskFilter
  );

  const counts = {
    high: FRAUD_DATA.filter((a) => a.risk === 'High').length,
    medium: FRAUD_DATA.filter((a) => a.risk === 'Medium').length,
    low: FRAUD_DATA.filter((a) => a.risk === 'Low').length,
    open: FRAUD_DATA.filter((a) => alertStatuses[a.id] === 'open').length,
  };

  return (
    <PageWrap
      title="Fraud Alerts"
      subtitle="Demo data — no live fraud detection engine is implemented"
      breadcrumb="Admin / Fraud"
      action={
        <Badge label={`${counts.open} Open Alerts`} type="error" />
      }
    >
      <div style={{
        padding: '12px 16px', borderRadius: 10, background: T.warningBg,
        border: `1px solid #f5ddb0`, color: T.textSec, fontSize: 13, marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <FaShieldHalved style={{ color: T.warning, flexShrink: 0 }} />
        <span>
          This page shows fixed demo data for illustration, not live detection. Real fraud/anomaly detection is
          listed as future work in this project's requirements — see docs/PROJECT_AUDIT.md.
        </span>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <Card style={{ flex: 1, minWidth: 160, borderLeft: `4px solid ${T.error}` }}>
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>High Risk</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: T.error, lineHeight: 1, margin: '8px 0 4px' }}>{counts.high}</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>Requires immediate action</div>
        </Card>
        <Card style={{ flex: 1, minWidth: 160, borderLeft: `4px solid ${T.warning}` }}>
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Medium Risk</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: T.warning, lineHeight: 1, margin: '8px 0 4px' }}>{counts.medium}</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>Monitor and review</div>
        </Card>
        <Card style={{ flex: 1, minWidth: 160, borderLeft: `4px solid ${T.success}` }}>
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Low Risk</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: T.success, lineHeight: 1, margin: '8px 0 4px' }}>{counts.low}</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>Flagged for awareness</div>
        </Card>
        <Card style={{ flex: 1, minWidth: 160, borderLeft: `4px solid ${T.adminAccent}` }}>
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Open Queue</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: T.adminAccent, lineHeight: 1, margin: '8px 0 4px' }}>{counts.open}</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>Awaiting resolution</div>
        </Card>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['All', 'High', 'Medium', 'Low'] as const).map((f) => (
          <button key={f} onClick={() => setRiskFilter(f)} style={{
            padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            background: riskFilter === f ? T.adminAccent : T.white,
            color: riskFilter === f ? '#fff' : T.textSec,
            boxShadow: riskFilter === f ? 'none' : `0 1px 3px rgba(0,0,0,0.08)`,
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {f === 'High' ? <FaCircle style={{ color: T.error, fontSize: 10 }} /> : f === 'Medium' ? <FaCircle style={{ color: T.warning, fontSize: 10 }} /> : f === 'Low' ? <FaCircle style={{ color: T.success, fontSize: 10 }} /> : <FaClipboardList style={{ fontSize: 12 }} />} {f}
            </span>
          </button>
        ))}
      </div>

      {/* ── Alert Table ── */}
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <SectionTitle action={
          <span style={{ padding: '0 20px', fontSize: 13, color: T.textMuted }}>{filtered.length} alerts</span>
        }>
          <div style={{ padding: '20px 20px 0' }}>Fraud Alert Queue</div>
        </SectionTitle>
        <div className="responsive-table-wrap" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.surfaceLow, borderBottom: `2px solid ${T.border}` }}>
                {['Alert ID', 'User', 'Type', 'Risk Score', 'Amount', 'Time', 'Status', 'Action'].map((h) => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: T.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((alert) => {
                const currentStatus = alertStatuses[alert.id];
                return (
                  <tr
                    key={alert.id}
                    className="trow"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = T.tableHover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
                    style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: T.error }}>
                          {alert.id}
                        </span>
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{alert.note}</div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 9999, flexShrink: 0,
                          background: `linear-gradient(135deg, ${T.error}22 0%, ${T.error}44 100%)`,
                          border: `1.5px solid ${T.error}33`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: T.error, fontSize: 11, fontWeight: 700,
                        }}>
                          {getInitials(alert.user)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{alert.user}</div>
                          <div style={{ fontSize: 11, color: T.textMuted }}>{alert.userId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 13, color: T.textPrimary }}>{alert.type}</div>
                    </td>
                    <td style={{ padding: '14px 16px', minWidth: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RiskBar score={alert.riskScore} risk={alert.risk} />
                        {riskBadge(alert.risk)}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>
                        {formatCurrency(alert.amount)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>
                      {alert.time}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {statusBadge(currentStatus)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {currentStatus !== 'investigating' && currentStatus !== 'dismissed' && (
                          <Btn variant="admin" size="sm" onClick={() => handleInvestigate(alert.id)}>
                            Investigate
                          </Btn>
                        )}
                        {currentStatus !== 'dismissed' && (
                          <Btn variant="ghost" size="sm"
                            style={{ color: T.textMuted, border: `1px solid ${T.border}` }}
                            onClick={() => handleDismiss(alert.id)}>
                            Dismiss
                          </Btn>
                        )}
                        {currentStatus === 'dismissed' && (
                          <span style={{ fontSize: 12, color: T.textMuted }}>Closed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Blocked IPs Card ── */}
      <Card style={{ maxWidth: 640 }}>
        <SectionTitle action={
          <Btn variant="danger" size="sm" icon={<FaBan />}>Block New IP</Btn>
        }>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><FaShieldHalved /> Blocked IP Addresses</span>
        </SectionTitle>

        <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>
          {BLOCKED_IPS.length} IPs currently blocked. Access from these addresses is denied.
        </div>

        {BLOCKED_IPS.map((ip, i) => (
          <div key={ip.ip}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: T.errorBg, border: `1px solid ${T.error}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, color: T.error
                }}><FaBan /></div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: T.textPrimary }}>{ip.ip}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>
                    {ip.country} · {ip.reason} · Blocked {ip.blocked}
                  </div>
                </div>
              </div>
              <Btn variant="ghost" size="sm" style={{ color: T.error, fontSize: 12 }}>Unblock</Btn>
            </div>
            {i < BLOCKED_IPS.length - 1 && <Divider />}
          </div>
        ))}
      </Card>
    </PageWrap>
  );
}
