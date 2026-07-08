'use client';
import React, { useState } from 'react';
import { SCHEDULED } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { SectionTitle, PageWrap } from '@/components/ui/Layout';
import type { ScheduledPayment } from '@/types/transaction';
  FaPlus, FaCalendarDays, FaRepeat, FaPause, FaPlay, FaTrashCan, FaXmark
} from 'react-icons/fa6';
import T from '@/lib/tokens';

export default function ScheduledPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<ScheduledPayment[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [deleted, setDeleted] = useState<number[]>([]);

  React.useEffect(() => {
    if (user) {
      api.get('/scheduled').then(res => {
        if (res.data) setPayments(res.data);
      }).catch(() => {
        setPayments(SCHEDULED);
      });
    }
  }, [user]);

  function toggleStatus(id: number) {
    setPayments(prev => prev.map(p =>
      p.id === id ? { ...p, status: p.status === 'active' ? 'paused' : 'active' } : p
    ));
  }

  function deletePayment(id: number) {
    setDeleted(d => [...d, id]);
    setTimeout(() => setPayments(p => p.filter(x => x.id !== id)), 400);
  }

  const visible = payments.filter(p => !deleted.includes(p.id));
  const activeCount = visible.filter(p => p.status === 'active').length;
  const totalMonthly = visible.reduce((s, p) => {
    const mult = p.freq === 'Weekly' ? 4 : 1;
    return s + p.amount * mult;
  }, 0);

  return (
    <PageWrap
      title="Scheduled Payments"
      subtitle="Manage your recurring transfers and automatic bill payments"
      action={<Btn onClick={() => setShowNew(true)} icon={<FaPlus />}>New Schedule</Btn>}
    >
      <style>{`.trow:hover { background: ${T.tableHover} !important; }`}</style>

      {/* Summary Cards */}
      <div className="scheduled-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>ACTIVE SCHEDULES</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: T.success, margin: '8px 0' }}>{activeCount}</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>of {visible.length} total</div>
        </Card>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>EST. MONTHLY OUTFLOW</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: T.textPrimary, margin: '8px 0' }}>{formatCurrency(totalMonthly)}</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>Auto-deducted</div>
        </Card>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>NEXT PAYMENT</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.navyMid, margin: '8px 0' }}>
            {visible.find(p => p.status === 'active')?.nextRun ?? '—'}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted }}>{visible.find(p => p.status === 'active')?.recipient}</div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <SectionTitle action={<span style={{ fontSize: 12, color: T.textMuted }}>{visible.length} schedule{visible.length !== 1 ? 's' : ''}</span>}>
          Payment Schedules
        </SectionTitle>
        <div className="responsive-table-wrap" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.surfaceLow }}>
                {['Recipient', 'Type', 'Amount', 'Frequency', 'Next Run', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(p => (
                <tr
                  key={p.id}
                  className="trow"
                  style={{ borderBottom: `1px solid ${T.border}`, opacity: deleted.includes(p.id) ? 0.3 : 1, transition: 'opacity 0.3s' }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, color: T.textPrimary }}>{p.recipient}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: p.type === 'Transfer' ? T.sidebarActive : p.type === 'Bill' ? T.infoBg : T.warningBg,
                      color:      p.type === 'Transfer' ? T.navyMid      : p.type === 'Bill' ? T.info     : T.warning,
                    }}>
                      {p.type}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: T.textPrimary }}>{formatCurrency(p.amount)}</td>
                  <td style={{ padding: '14px 16px', color: T.textSec }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {p.freq === 'Monthly' ? <FaCalendarDays /> : <FaRepeat />} {p.freq}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: T.textSec }}>{p.nextRun}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <Badge label={p.status === 'active' ? 'Active' : 'Paused'} type={p.status === 'active' ? 'success' : 'warning'} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => toggleStatus(p.id)}
                        style={{
                          padding: '5px 12px', borderRadius: 7, border: `1px solid ${T.border}`,
                          cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          background: p.status === 'active' ? T.warningBg : T.successBg,
                          color:      p.status === 'active' ? T.warning   : T.success,
                        }}
                      >
                        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {p.status === 'active' ? <><FaPause /> Pause</> : <><FaPlay /> Resume</>}
                        </span>
                      </button>
                      <button
                        onClick={() => deletePayment(p.id)}
                        style={{
                          padding: '5px 10px', borderRadius: 7, border: `1px solid ${T.errorBg}`,
                          cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          background: T.errorBg, color: T.error,
                        }}
                      >
                        <FaTrashCan />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: T.textMuted, fontSize: 14 }}>
                    No scheduled payments. Click &quot;New Schedule&quot; to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Schedule Modal */}
      {showNew && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(2,2,89,0.4)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowNew(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: 480, background: T.white, borderRadius: 20, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>New Scheduled Payment</h2>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.textMuted }}><FaXmark /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Recipient Name', placeholder: 'e.g. Kwame Mensah' },
                { label: 'Phone / Account', placeholder: '0244 xxx xxx' },
                { label: 'Amount (₵)', placeholder: '0.00', type: 'number' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type || 'text'} placeholder={f.placeholder} style={{
                    width: '100%', height: 44, borderRadius: 10, border: `1.5px solid ${T.borderVar}`,
                    padding: '0 14px', fontSize: 14, color: T.textPrimary,
                  }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 6 }}>Frequency</label>
                <select style={{ width: '100%', height: 44, borderRadius: 10, border: `1.5px solid ${T.borderVar}`, padding: '0 14px', fontSize: 14, color: T.textPrimary, background: T.white }}>
                  <option>Daily</option><option>Weekly</option><option>Monthly</option><option>Annually</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <Btn variant="secondary" onClick={() => setShowNew(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</Btn>
                <Btn onClick={() => setShowNew(false)} style={{ flex: 2, justifyContent: 'center' }}>Create Schedule</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWrap>
  );
}
