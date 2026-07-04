'use client';

import { useState } from 'react';
import T from '@/lib/tokens';
import { KYC_QUEUE } from '@/lib/mock-data';
import { getInitials } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { PageWrap, SectionTitle, Divider } from '@/components/ui/Layout';
import type { KycEntry } from '@/types/transaction';
import {
  FaIdCard, FaCamera, FaRobot
} from 'react-icons/fa6';

/* ── Extended KYC data ──────────────────────────────────── */
const KYC_EXTENDED = [
  ...KYC_QUEUE,
  { id: 'GHP-2026-38044', name: 'Ekow Botchway',   phone: '+233 20 998 7654', submitted: '30 mins ago', status: 'approved', docScore: 97, faceScore: 95, tier: 2 },
  { id: 'GHP-2026-37850', name: 'Akua Frimpong',   phone: '+233 54 221 3344', submitted: '5 hrs ago',   status: 'rejected', docScore: 62, faceScore: 55, tier: 2 },
  { id: 'GHP-2026-37720', name: 'Kwabena Sarpong', phone: '+233 26 556 7788', submitted: '8 hrs ago',   status: 'approved', docScore: 91, faceScore: 88, tier: 2 },
] as KycEntry[];

type KycStatus = 'all' | 'pending' | 'urgent' | 'approved' | 'rejected';

const TABS: { key: KycStatus; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'pending',  label: 'Pending' },
  { key: 'urgent',   label: 'Urgent' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 9999, background: T.border, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 9999 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: T.textSec, minWidth: 28, textAlign: 'right' }}>{value}%</span>
    </div>
  );
}

function statusBadge(s: string) {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
    approved: 'success', rejected: 'error', urgent: 'warning', pending: 'info',
  };
  const labels: Record<string, string> = {
    approved: '✓ Approved', rejected: '✕ Rejected', urgent: '⚠ Urgent', pending: '⏳ Pending',
  };
  return <Badge label={labels[s] ?? s} type={map[s] ?? 'default'} />;
}

/* ── KYC Detail Slide-in ────────────────────────────────── */
function KycDetailPanel({ entry, onClose, onApprove, onReject }: {
  entry: KycEntry;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const docColor = entry.docScore >= 90 ? T.success : entry.docScore >= 75 ? T.warning : T.error;
  const faceColor = entry.faceScore >= 85 ? T.success : entry.faceScore >= 70 ? T.warning : T.error;
  const aiRec = entry.docScore >= 88 && entry.faceScore >= 85 ? 'APPROVE' : entry.docScore < 70 ? 'REJECT' : 'MANUAL REVIEW';
  const aiColor = aiRec === 'APPROVE' ? T.success : aiRec === 'REJECT' ? T.error : T.warning;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: 420, height: '100vh',
      background: T.white, borderLeft: `1px solid ${T.border}`,
      boxShadow: '-4px 0 28px rgba(2,2,89,0.14)',
      zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 24px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyMid} 100%)`,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>KYC Review</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{entry.id}</div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: 8, color: '#fff', cursor: 'pointer',
          width: 32, height: 32, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>
      </div>

      <div style={{ padding: 24 }}>
        {/* Applicant */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 9999,
            background: `linear-gradient(135deg, ${T.adminAccent} 0%, ${T.navyMid} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 auto 10px',
          }}>
            {getInitials(entry.name)}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{entry.name}</div>
          <div style={{ fontSize: 13, color: T.textMuted }}>{entry.phone}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center' }}>
            {statusBadge(entry.status)}
            <Badge label={`Tier ${entry.tier} Request`} type="navy" />
          </div>
        </div>

        {/* Document placeholders */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'ID Document', note: 'Ghana Card front', icon: <FaIdCard /> },
            { label: 'Selfie Photo', note: 'Face match source', icon: <FaCamera /> },
          ].map((d) => (
            <div key={d.label} style={{
              borderRadius: 12, border: `2px dashed ${T.borderVar}`,
              padding: '24px 12px', textAlign: 'center',
              background: T.surfaceLow,
            }}>
              <div style={{ fontSize: 24, marginBottom: 6, color: T.navyMid }}>{d.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>{d.label}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{d.note}</div>
              <div style={{ marginTop: 10, fontSize: 10, color: T.adminAccent, fontWeight: 600 }}>UPLOADED ✓</div>
            </div>
          ))}
        </div>

        {/* Score Breakdown */}
        <Card style={{ marginBottom: 16, background: T.surfaceLow, border: 'none' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Score Breakdown</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: T.textSec }}>Document Authenticity</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: docColor }}>{entry.docScore}%</span>
            </div>
            <ScoreBar value={entry.docScore} color={docColor} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: T.textSec }}>Face Match Confidence</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: faceColor }}>{entry.faceScore}%</span>
            </div>
            <ScoreBar value={entry.faceScore} color={faceColor} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: T.textSec }}>Liveness Detection</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.success }}>PASS</span>
            </div>
            <ScoreBar value={100} color={T.success} />
          </div>
        </Card>

        {/* AI Recommendation */}
        <div style={{
          borderRadius: 12, padding: 16, marginBottom: 20,
          background: aiRec === 'APPROVE' ? T.successBg : aiRec === 'REJECT' ? T.errorBg : T.warningBg,
          border: `1px solid ${aiColor}44`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: aiColor, letterSpacing: '0.1em', marginBottom: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
            <FaRobot /> AI RECOMMENDATION
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: aiColor }}>{aiRec}</div>
          <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>
            {aiRec === 'APPROVE'
              ? 'All verification checks passed. Documents appear authentic.'
              : aiRec === 'REJECT'
              ? 'Document scores below acceptable threshold. Further investigation needed.'
              : 'Borderline scores detected. Manual human review recommended.'}
          </div>
        </div>

        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>Submitted: {entry.submitted}</div>

        <Divider />

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="success" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => onApprove(entry.id)}>
              ✓ Approve
            </Btn>
            <Btn variant="danger" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => onReject(entry.id)}>
              ✕ Reject
            </Btn>
          </div>
          <Btn variant="secondary" style={{ justifyContent: 'center' }}>⚑ Flag for Manual Review</Btn>
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function AdminKycPage() {
  const [activeTab, setActiveTab] = useState<KycStatus>('all');
  const [selectedEntry, setSelectedEntry] = useState<KycEntry | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(KYC_EXTENDED.map((e) => [e.id, e.status]))
  );

  const filtered = KYC_EXTENDED.filter((e) =>
    activeTab === 'all' ? true : statuses[e.id] === activeTab
  );

  const handleApprove = (id: string) => {
    setStatuses((prev) => ({ ...prev, [id]: 'approved' }));
    setSelectedEntry(null);
  };
  const handleReject = (id: string) => {
    setStatuses((prev) => ({ ...prev, [id]: 'rejected' }));
    setSelectedEntry(null);
  };

  const counts = {
    all: KYC_EXTENDED.length,
    pending: KYC_EXTENDED.filter((e) => statuses[e.id] === 'pending').length,
    urgent: KYC_EXTENDED.filter((e) => statuses[e.id] === 'urgent').length,
    approved: KYC_EXTENDED.filter((e) => statuses[e.id] === 'approved').length,
    rejected: KYC_EXTENDED.filter((e) => statuses[e.id] === 'rejected').length,
  };

  return (
    <PageWrap
      title="KYC Queue"
      subtitle="Identity verification and document review"
      breadcrumb="Admin / KYC"
      action={
        <Badge label={`${counts.urgent} Urgent`} type="warning" />
      }
    >
      {/* ── Summary cards ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Queue', value: counts.all, color: T.navy },
          { label: 'Pending', value: counts.pending, color: T.info },
          { label: 'Urgent', value: counts.urgent, color: T.warning },
          { label: 'Approved Today', value: counts.approved, color: T.success },
          { label: 'Rejected Today', value: counts.rejected, color: T.error },
        ].map((s) => (
          <Card key={s.label} style={{ flex: 1, minWidth: 120, padding: 14 }}>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* ── Filter Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            background: activeTab === tab.key ? T.adminAccent : T.white,
            color: activeTab === tab.key ? '#fff' : T.textSec,
            boxShadow: activeTab === tab.key ? 'none' : `0 1px 3px rgba(0,0,0,0.08)`,
          }}>
            {tab.label}
            <span style={{
              marginLeft: 6, fontSize: 11,
              background: activeTab === tab.key ? 'rgba(255,255,255,0.3)' : T.border,
              color: activeTab === tab.key ? '#fff' : T.textMuted,
              borderRadius: 9999, padding: '1px 7px',
            }}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <SectionTitle action={
          <span style={{ padding: '0 20px', fontSize: 13, color: T.textMuted }}>{filtered.length} records</span>
        }>
          <div style={{ padding: '20px 20px 0' }}>KYC Applications</div>
        </SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.surfaceLow, borderBottom: `2px solid ${T.border}` }}>
                {['Applicant', 'Phone', 'Submitted', 'Doc Score', 'Face Score', 'Tier Req.', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: T.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => {
                const currentStatus = statuses[entry.id];
                const dColor = entry.docScore >= 90 ? T.success : entry.docScore >= 75 ? T.warning : T.error;
                const fColor = entry.faceScore >= 85 ? T.success : entry.faceScore >= 70 ? T.warning : T.error;
                return (
                  <tr
                    key={entry.id}
                    className="trow"
                    onClick={() => setSelectedEntry(entry)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = T.tableHover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
                    style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 0.1s' }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 9999, flexShrink: 0,
                          background: `linear-gradient(135deg, ${T.adminAccent} 0%, ${T.navyMid} 100%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 12, fontWeight: 700,
                        }}>
                          {getInitials(entry.name)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{entry.name}</div>
                          <div style={{ fontSize: 11, color: T.textMuted }}>{entry.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: T.textSec }}>{entry.phone}</td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>{entry.submitted}</td>
                    <td style={{ padding: '14px 16px', minWidth: 130 }}>
                      <ScoreBar value={entry.docScore} color={dColor} />
                    </td>
                    <td style={{ padding: '14px 16px', minWidth: 130 }}>
                      <ScoreBar value={entry.faceScore} color={fColor} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <Badge label={`Tier ${entry.tier}`} type="navy" />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {statusBadge(currentStatus)}
                    </td>
                    <td style={{ padding: '14px 16px' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn variant="success" size="sm" onClick={() => handleApprove(entry.id)}>Approve</Btn>
                        <Btn variant="danger" size="sm" onClick={() => handleReject(entry.id)}>Reject</Btn>
                        <Btn variant="secondary" size="sm">Flag</Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>
                    No KYC entries found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Detail Panel ── */}
      {selectedEntry && (
        <KycDetailPanel
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </PageWrap>
  );
}
