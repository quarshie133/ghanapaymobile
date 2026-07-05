'use client';
import React, { useState } from 'react';
import T from '@/lib/tokens';
import { formatCurrency } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { SectionTitle, PageWrap } from '@/components/ui/Layout';
import {
  FaFolderOpen, FaCircleInfo, FaBolt, FaCalendarDays, FaCheck, FaCircleCheck, FaTriangleExclamation, FaDownload
} from 'react-icons/fa6';

const SAMPLE_ENTRIES = [
  { name: 'Kwame Mensah',   phone: '0244 567 890', amount: 500,  status: 'ready'   },
  { name: 'Abena Asante',   phone: '0201 234 567', amount: 800,  status: 'ready'   },
  { name: 'Yaw Boateng',    phone: '0244 333 444', amount: 400,  status: 'ready'   },
  { name: 'Adjoa Sarpong',  phone: '0559 123 456', amount: 350,  status: 'warning' },
  { name: 'Kweku Darko',    phone: '0208 765 432', amount: 450,  status: 'ready'   },
];

export default function BulkPaymentsPage() {
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const total = SAMPLE_ENTRIES.reduce((s, e) => s + e.amount, 0);
  const ready = SAMPLE_ENTRIES.filter(e => e.status === 'ready').length;

  return (
    <PageWrap
      title="Bulk Payments"
      subtitle="Send payments to multiple recipients at once"
      breadcrumb="Dashboard / Bulk Payments"
      action={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge label="Business" type="navy" />
          <Btn size="sm" variant="secondary" icon={<FaDownload />}>Download Template</Btn>
        </div>
      }
    >
      <style>{`
        .trow:hover { background: ${T.tableHover} !important; }
        .dz-hover { border-color: ${T.navyMid} !important; background: ${T.sidebarActive} !important; }
      `}</style>

      <div className="bulk-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Upload Section */}
          {!uploaded && (
            <Card>
              <SectionTitle>Upload CSV File</SectionTitle>
              <div
                className={dragging ? 'dz-hover' : ''}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); setUploaded(true); }}
                style={{
                  border: `2px dashed ${T.border}`,
                  borderRadius: 16, padding: '48px 24px',
                  textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => setUploaded(true)}
              >
                <div style={{ fontSize: 48, marginBottom: 16, color: T.navyMid, display: 'flex', justifyContent: 'center' }}><FaFolderOpen /></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, marginBottom: 8 }}>
                  Drop your CSV file here
                </div>
                <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 20 }}>
                  or click to browse. Supports .csv and .xlsx
                </div>
                <Btn variant="secondary" size="sm">Browse Files</Btn>
              </div>
              <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: T.infoBg, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, color: T.info }}><FaCircleInfo /></span>
                <div style={{ fontSize: 12, color: T.info, lineHeight: 1.6 }}>
                  Your CSV must include columns: <strong>Name, Phone, Amount</strong> (in cedis). Download our template above to get started.
                </div>
              </div>
            </Card>
          )}

          {/* Preview Table */}
          {uploaded && (
            <Card>
              <SectionTitle
                action={
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn size="sm" variant="ghost" onClick={() => setUploaded(false)}>Re-upload</Btn>
                    <Badge label={`${ready}/${SAMPLE_ENTRIES.length} ready`} type="success" />
                  </div>
                }
              >
                Preview Recipients
              </SectionTitle>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: T.surfaceLow }}>
                      {['#', 'Name', 'Phone', 'Amount', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_ENTRIES.map((e, i) => (
                      <tr key={i} className="trow" style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '12px 14px', color: T.textMuted }}>{i + 1}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: T.textPrimary }}>{e.name}</td>
                        <td style={{ padding: '12px 14px', color: T.textSec }}>{e.phone}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: T.textPrimary }}>{formatCurrency(e.amount)}</td>
                        <td style={{ padding: '12px 14px' }}>
                          {e.status === 'ready'
                            ? <Badge label="Ready" type="success" />
                            : <Badge label="Check" type="warning" />
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Right Summary Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.navyMid})`, border: 'none', color: '#fff' }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 }}>BATCH SUMMARY</div>
            <div style={{ fontSize: 34, fontWeight: 800, margin: '8px 0', color: T.gold }}>{formatCurrency(total)}</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Total payout amount</div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', margin: '16px 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Recipients', SAMPLE_ENTRIES.length],
                ['Ready', ready],
                ['Warnings', SAMPLE_ENTRIES.length - ready],
                ['Est. Fee', 'Free'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>{k}</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle>Schedule</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Send Now', icon: <FaBolt />, desc: 'Process immediately', active: true },
                { label: 'Schedule Later', icon: <FaCalendarDays />, desc: 'Pick a date & time', active: false },
              ].map(opt => (
                <div key={opt.label} style={{
                  padding: 14, borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${opt.active ? T.navyMid : T.border}`,
                  background: opt.active ? T.sidebarActive : T.white,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: opt.active ? T.navyMid : T.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {opt.icon} {opt.label}
                  </div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </Card>

          {!confirmed ? (
            <Btn
              variant="success"
              disabled={!uploaded}
              onClick={() => setConfirmed(true)}
              style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '14px' }}
            >
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><FaCheck /> Validate &amp; Send Batch</span>
            </Btn>
          ) : (
            <Card style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 12, color: T.success, display: 'flex', justifyContent: 'center' }}><FaCircleCheck /></div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.success }}>Batch Submitted!</div>
              <div style={{ fontSize: 13, color: T.textMuted, marginTop: 6 }}>Processing {SAMPLE_ENTRIES.length} payments of {formatCurrency(total)}</div>
            </Card>
          )}

          <Card style={{ background: T.warningBg, border: `1px solid ${T.warning}22` }}>
            <div style={{ fontSize: 12, color: T.warning, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16 }}><FaTriangleExclamation /></span>
              <span>Bulk payments above ₵10,000 require additional authorization from your account admin.</span>
            </div>
          </Card>
        </div>
      </div>
    </PageWrap>
  );
}
