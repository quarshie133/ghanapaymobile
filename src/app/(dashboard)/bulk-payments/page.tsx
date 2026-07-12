'use client';
import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { SectionTitle, PageWrap } from '@/components/ui/Layout';

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
  const [scheduleOpt, setScheduleOpt] = useState<'now' | 'later'>('now');

  const total = SAMPLE_ENTRIES.reduce((s, e) => s + e.amount, 0);
  const ready = SAMPLE_ENTRIES.filter(e => e.status === 'ready').length;

  return (
    <PageWrap
      title="Bulk Payments"
      subtitle="Send payments to multiple recipients at once"
      breadcrumb="Bulk Payments"
      action={
        <div className="flex items-center gap-3">
          <Badge label="Business" type="navy" />
          <Btn size="sm" variant="secondary" className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">download</span>
            Template
          </Btn>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Upload or Preview Recipients (Span 8) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Upload Section */}
          {!uploaded && (
            <Card>
              <SectionTitle>Upload CSV File</SectionTitle>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); setUploaded(true); }}
                onClick={() => setUploaded(true)}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
                  dragging
                    ? 'border-primary bg-sidebar-active-light'
                    : 'border-border-subtle hover:border-primary/50 bg-white'
                }`}
              >
                <span className="material-symbols-outlined text-primary text-[48px] block mb-4">
                  folder_open
                </span>
                <div className="text-base font-extrabold text-primary mb-2">
                  Drop your CSV file here
                </div>
                <div className="text-sm text-secondary mb-6">
                  or click to browse. Supports .csv and .xlsx
                </div>
                <Btn variant="secondary" size="sm">Browse Files</Btn>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-[#EBF0FF] flex gap-3 items-start">
                <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                <p className="text-xs text-primary leading-relaxed">
                  Your CSV must include columns: <strong>Name, Phone, Amount</strong> (in GHS). Download our template above to get started.
                </p>
              </div>
            </Card>
          )}

          {/* Preview Table */}
          {uploaded && (
            <Card>
              <SectionTitle
                action={
                  <div className="flex items-center gap-3">
                    <Btn size="sm" variant="ghost" onClick={() => setUploaded(false)}>Re-upload</Btn>
                    <Badge label={`${ready}/${SAMPLE_ENTRIES.length} ready`} type="success" />
                  </div>
                }
              >
                Preview Recipients
              </SectionTitle>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-surface border-b border-border-subtle">
                      {['#', 'Name', 'Phone', 'Amount', 'Status'].map(h => (
                        <th key={h} className="px-6 py-3 font-table-header text-table-header text-secondary uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle text-sm">
                    {SAMPLE_ENTRIES.map((e, i) => (
                      <tr key={i} className="hover:bg-table-hover transition-colors duration-150">
                        <td className="px-6 py-3.5 text-secondary">{i + 1}</td>
                        <td className="px-6 py-3.5 font-bold text-primary">{e.name}</td>
                        <td className="px-6 py-3.5 text-secondary">{e.phone}</td>
                        <td className="px-6 py-3.5 font-bold text-primary">{formatCurrency(e.amount)}</td>
                        <td className="px-6 py-3.5">
                          <Badge
                            label={e.status === 'ready' ? 'Ready' : 'Check'}
                            type={e.status === 'ready' ? 'success' : 'warning'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Right Side: Batch Summary & Scheduling (Span 4) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Summary */}
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-container p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
            <div className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">BATCH SUMMARY</div>
            <div className="font-metric-value text-[34px] font-black text-tertiary-fixed leading-tight my-2">
              {formatCurrency(total)}
            </div>
            <div className="text-xs text-white/70">Total payout amount</div>
            <div className="h-px bg-white/10 w-full my-4" />
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Recipients', SAMPLE_ENTRIES.length],
                ['Ready', ready],
                ['Warnings', SAMPLE_ENTRIES.length - ready],
                ['Est. Fee', 'Free GHS'],
              ].map(([k, v], idx) => (
                <div key={idx}>
                  <div className="text-[11px] text-white/50">{k}</div>
                  <div className="text-base font-bold text-white mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <Card>
            <SectionTitle>Schedule</SectionTitle>
            <div className="space-y-3">
              {[
                { type: 'now' as const, label: 'Send Now', icon: 'bolt', desc: 'Process immediately' },
                { type: 'later' as const, label: 'Schedule Later', icon: 'calendar_today', desc: 'Pick a date & time' },
              ].map((opt, i) => (
                <div
                  key={i}
                  onClick={() => setScheduleOpt(opt.type)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    scheduleOpt === opt.type
                      ? 'border-primary bg-sidebar-active-light'
                      : 'border-border-subtle bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[20px] ${
                      scheduleOpt === opt.type ? 'text-primary' : 'text-secondary'
                    }`}>
                      {opt.icon}
                    </span>
                    <span className={`text-sm font-bold ${
                      scheduleOpt === opt.type ? 'text-primary' : 'text-primary'
                    }`}>
                      {opt.label}
                    </span>
                  </div>
                  <div className="text-xs text-secondary mt-1">{opt.desc}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Action button */}
          {!confirmed ? (
            <Btn
              variant="success"
              disabled={!uploaded}
              onClick={() => setConfirmed(true)}
              className="w-full py-4 text-base font-bold flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check</span>
              Validate & Send Batch
            </Btn>
          ) : (
            <Card className="text-center p-6 bg-white border border-border-subtle shadow-sm">
              <span className="material-symbols-outlined text-[48px] text-success animate-bounce block mb-2">
                check_circle
              </span>
              <h4 className="text-base font-bold text-success">Batch Submitted!</h4>
              <p className="text-xs text-secondary mt-2 leading-relaxed">
                Processing {SAMPLE_ENTRIES.length} payments of {formatCurrency(total)}.
              </p>
            </Card>
          )}

          {/* Warning Banner */}
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
            <div className="flex gap-3 items-start">
              <span className="material-symbols-outlined text-orange-600 text-[20px]">warning</span>
              <p className="text-xs text-orange-700 leading-relaxed font-semibold">
                Bulk payments above ₵10,000 require additional authorization from your account admin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrap>
  );
}
