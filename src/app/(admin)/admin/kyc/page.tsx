'use client';

import { useState, useEffect, useCallback } from 'react';
import T from '@/lib/tokens';
import { getInitials } from '@/lib/utils';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { PageWrap, SectionTitle, Divider } from '@/components/ui/Layout';
import { FaIdCard, FaCamera, FaHouse } from 'react-icons/fa6';

/**
 * Real KYC review queue, backed by Firestore via src/lib/kyc-record.ts.
 * Previously this entire page was local React state over mock-data.ts —
 * approve/reject buttons didn't persist anything and reset on refresh.
 *
 * NOTE: there is no real document-authenticity or face-match scoring —
 * that was fabricated ("AI RECOMMENDATION", docScore/faceScore) in the
 * original mock UI and has been removed rather than preserved. Review here
 * is a manual human decision, which is what actually happens.
 */

type KycStepId = 'ghanaCard' | 'selfie' | 'addressProof';
type KycOverallStatus = 'not_started' | 'in_progress' | 'pending_review' | 'approved' | 'rejected';

interface KycStepData {
  status: 'pending' | 'submitted';
  storagePath: string | null;
  submittedAt: any;
}

interface KycRecord {
  uid: string;
  name: string;
  phone: string | null;
  status: KycOverallStatus;
  steps: Record<KycStepId, KycStepData>;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: any;
  updatedAt: any;
}

type TabKey = 'all' | 'pending_review' | 'approved' | 'rejected';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending_review', label: 'Pending Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const STEP_META: Record<KycStepId, { label: string; icon: React.ReactNode }> = {
  ghanaCard: { label: 'Ghana Card', icon: <FaIdCard /> },
  selfie: { label: 'Selfie Photo', icon: <FaCamera /> },
  addressProof: { label: 'Address Proof', icon: <FaHouse /> },
};

function statusBadge(s: KycOverallStatus) {
  const map: Record<KycOverallStatus, { type: 'success' | 'error' | 'warning' | 'info' | 'default'; label: string }> = {
    approved: { type: 'success', label: '✓ Approved' },
    rejected: { type: 'error', label: '✕ Rejected' },
    pending_review: { type: 'warning', label: '⏳ Pending Review' },
    in_progress: { type: 'info', label: 'In Progress' },
    not_started: { type: 'default', label: 'Not Started' },
  };
  const m = map[s];
  return <Badge label={m.label} type={m.type} />;
}

function formatTimestamp(ts: any): string {
  if (!ts) return '—';
  // Firestore Timestamps serialize over JSON as { _seconds, _nanoseconds }.
  const seconds = ts._seconds ?? ts.seconds;
  if (typeof seconds !== 'number') return '—';
  return new Date(seconds * 1000).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/* ── Detail Panel ───────────────────────────────────────── */
function KycDetailPanel({
  record, onClose, onApprove, onReject, busy,
}: {
  record: KycRecord;
  onClose: () => void;
  onApprove: (uid: string, note: string) => void;
  onReject: (uid: string, note: string) => void;
  busy: boolean;
}) {
  const [note, setNote] = useState('');
  const [viewingDoc, setViewingDoc] = useState<KycStepId | null>(null);
  const [docError, setDocError] = useState('');

  const canDecide = record.status === 'pending_review';

  async function viewDocument(stepId: KycStepId) {
    setDocError('');
    setViewingDoc(stepId);
    try {
      const res = await api.get(`/kyc/document-url?uid=${record.uid}&stepId=${stepId}`);
      const url = res?.url || res?.data?.url;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else setDocError('No document found for this step.');
    } catch (err: any) {
      setDocError(err?.message || 'Failed to load document.');
    } finally {
      setViewingDoc(null);
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: 420, height: '100vh',
      background: T.white, borderLeft: `1px solid ${T.border}`,
      boxShadow: '-4px 0 28px rgba(2,2,89,0.14)',
      zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      <div style={{
        padding: '18px 24px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyMid} 100%)`,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>KYC Review</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{record.uid}</div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: 8, color: '#fff', cursor: 'pointer',
          width: 32, height: 32, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>
      </div>

      <div style={{ padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 9999,
            background: `linear-gradient(135deg, ${T.adminAccent} 0%, ${T.navyMid} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 auto 10px',
          }}>
            {getInitials(record.name)}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{record.name}</div>
          <div style={{ fontSize: 13, color: T.textMuted }}>{record.phone || 'No phone on file'}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center' }}>
            {statusBadge(record.status)}
          </div>
        </div>

        {/* Real submitted documents — signed-URL view, never a public link */}
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec, marginBottom: 10 }}>Submitted Documents</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {(Object.keys(STEP_META) as KycStepId[]).map((stepId) => {
            const step = record.steps[stepId];
            const submitted = step?.status === 'submitted';
            return (
              <button
                key={stepId}
                disabled={!submitted || viewingDoc === stepId}
                onClick={() => viewDocument(stepId)}
                style={{
                  borderRadius: 12, border: `2px dashed ${submitted ? T.adminAccent : T.borderVar}`,
                  padding: '18px 8px', textAlign: 'center',
                  background: T.surfaceLow, cursor: submitted ? 'pointer' : 'default',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4, color: T.navyMid }}>{STEP_META[stepId].icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec }}>{STEP_META[stepId].label}</div>
                <div style={{ marginTop: 6, fontSize: 9, color: submitted ? T.adminAccent : T.textMuted, fontWeight: 600 }}>
                  {viewingDoc === stepId ? 'LOADING…' : submitted ? 'VIEW ↗' : 'NOT SUBMITTED'}
                </div>
              </button>
            );
          })}
        </div>
        {docError && <div style={{ fontSize: 12, color: T.error, marginBottom: 16 }}>{docError}</div>}

        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>
          Last updated: {formatTimestamp(record.updatedAt)}
        </div>
        {record.reviewedBy && (
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>
            Reviewed: {formatTimestamp(record.reviewedAt)}{record.reviewNote ? ` — "${record.reviewNote}"` : ''}
          </div>
        )}

        <Divider />

        {canDecide ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional review note (visible to the applicant)"
              style={{
                width: '100%', minHeight: 60, borderRadius: 10, border: `1px solid ${T.border}`,
                padding: 10, fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="success" style={{ flex: 1, justifyContent: 'center' }} disabled={busy}
                onClick={() => onApprove(record.uid, note)}>
                ✓ Approve
              </Btn>
              <Btn variant="danger" style={{ flex: 1, justifyContent: 'center' }} disabled={busy}
                onClick={() => onReject(record.uid, note)}>
                ✕ Reject
              </Btn>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: T.textMuted, textAlign: 'center', padding: '12px 0' }}>
            {record.status === 'not_started' || record.status === 'in_progress'
              ? 'Applicant has not finished submitting all required documents yet.'
              : `This application has already been ${record.status}.`}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function AdminKycPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('pending_review');
  const [records, setRecords] = useState<KycRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadRecords = useCallback(async (status?: TabKey) => {
    setLoading(true);
    setError('');
    try {
      const query = status && status !== 'all' ? `&status=${status}` : '';
      const res = await api.get(`/kyc?admin=true${query}`);
      const list: KycRecord[] = Array.isArray(res) ? res : res?.data || [];
      setRecords(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load KYC queue. You may need administrator access.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords(activeTab);
  }, [activeTab, loadRecords]);

  const selected = records.find((r) => r.uid === selectedUid) || null;

  async function handleDecision(uid: string, action: 'approve' | 'reject', note: string) {
    setBusy(true);
    try {
      await api.patch('/kyc', { uid, action, note: note || undefined });
      setSelectedUid(null);
      await loadRecords(activeTab);
    } catch (err: any) {
      setError(err?.message || `Failed to ${action} this submission.`);
    } finally {
      setBusy(false);
    }
  }

  const pendingCount = records.filter((r) => r.status === 'pending_review').length;

  return (
    <PageWrap
      title="KYC Queue"
      subtitle="Identity verification and document review"
      breadcrumb="Admin / KYC"
      action={<Badge label={`${pendingCount} Pending`} type="warning" />}
    >
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            background: activeTab === tab.key ? T.adminAccent : T.white,
            color: activeTab === tab.key ? '#fff' : T.textSec,
            boxShadow: activeTab === tab.key ? 'none' : `0 1px 3px rgba(0,0,0,0.08)`,
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: 14, borderRadius: 10, background: T.errorBg, color: T.error, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <SectionTitle action={
          <span style={{ padding: '0 20px', fontSize: 13, color: T.textMuted }}>{records.length} records</span>
        }>
          <div style={{ padding: '20px 20px 0' }}>KYC Applications</div>
        </SectionTitle>
        <div className="responsive-table-wrap" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.surfaceLow, borderBottom: `2px solid ${T.border}` }}>
                {['Applicant', 'Phone', 'Documents', 'Last Updated', 'Status', 'Actions'].map((h) => (
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
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>Loading…</td></tr>
              )}
              {!loading && records.map((record) => {
                const submittedCount = (Object.keys(STEP_META) as KycStepId[]).filter(
                  (s) => record.steps?.[s]?.status === 'submitted'
                ).length;
                return (
                  <tr
                    key={record.uid}
                    className="trow"
                    onClick={() => setSelectedUid(record.uid)}
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
                          {getInitials(record.name)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{record.name}</div>
                          <div style={{ fontSize: 11, color: T.textMuted }}>{record.uid.slice(0, 10)}…</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: T.textSec }}>{record.phone || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: T.textSec }}>{submittedCount} / 3 submitted</td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>{formatTimestamp(record.updatedAt)}</td>
                    <td style={{ padding: '14px 16px' }}>{statusBadge(record.status)}</td>
                    <td style={{ padding: '14px 16px' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {record.status === 'pending_review' ? (
                          <>
                            <Btn variant="success" size="sm" disabled={busy} onClick={() => handleDecision(record.uid, 'approve', '')}>Approve</Btn>
                            <Btn variant="danger" size="sm" disabled={busy} onClick={() => handleDecision(record.uid, 'reject', '')}>Reject</Btn>
                          </>
                        ) : (
                          <Btn variant="secondary" size="sm" onClick={() => setSelectedUid(record.uid)}>View</Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>
                    No KYC entries found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && (
        <KycDetailPanel
          record={selected}
          onClose={() => setSelectedUid(null)}
          onApprove={(uid, note) => handleDecision(uid, 'approve', note)}
          onReject={(uid, note) => handleDecision(uid, 'reject', note)}
          busy={busy}
        />
      )}
    </PageWrap>
  );
}
