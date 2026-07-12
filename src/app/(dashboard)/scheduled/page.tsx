'use client';
import React, { useState, useEffect } from 'react';
import { SCHEDULED } from '@/lib/mock-data';
import { formatCurrency, getInitials } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { SectionTitle, PageWrap } from '@/components/ui/Layout';
import type { ScheduledPayment } from '@/types/transaction';

export default function ScheduledPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<ScheduledPayment[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [deleted, setDeleted] = useState<number[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
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

  const visible = payments.filter(p => !deleted.includes(p.id) && p.recipient.toLowerCase().includes(search.toLowerCase()));
  const activeCount = visible.filter(p => p.status === 'active').length;
  const totalMonthly = visible.reduce((s, p) => {
    const mult = p.freq === 'Weekly' ? 4 : 1;
    return s + p.amount * mult;
  }, 0);

  return (
    <PageWrap
      title="Scheduled & Recurring Payments"
      subtitle="Manage automated transfers, bills, and standing orders."
      action={
        <Btn onClick={() => setShowNew(true)} icon={<span className="material-symbols-outlined text-[20px]">add</span>}>
          Create New Schedule
        </Btn>
      }
    >
      {/* Summary Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Schedules */}
        <Card className="hover:border-primary-fixed-dim">
          <div className="absolute right-0 top-0 w-24 h-24 bg-surface-tint opacity-5 rounded-bl-[100px] pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#E5F5ED] text-success flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                event_available
              </span>
            </div>
            <h3 className="font-sidebar-label text-sidebar-label text-secondary">Active Schedules</h3>
          </div>
          <div className="font-metric-value text-metric-value text-primary">{activeCount}</div>
        </Card>

        {/* Total Monthly Run */}
        <Card className="hover:border-primary-fixed-dim">
          <div className="absolute right-0 top-0 w-24 h-24 bg-surface-tint opacity-5 rounded-bl-[100px] pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#FFF4E5] text-[#D35400] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_balance_wallet
              </span>
            </div>
            <h3 className="font-sidebar-label text-sidebar-label text-secondary">Total Monthly Run</h3>
          </div>
          <div className="font-metric-value text-metric-value text-primary flex items-baseline gap-1">
            <span className="text-2xl font-bold text-secondary">GHS</span> {totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </Card>

        {/* Next Payment Due */}
        <Card className="hover:border-primary-fixed-dim">
          <div className="absolute right-0 top-0 w-24 h-24 bg-surface-tint opacity-5 rounded-bl-[100px] pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#EBF0FF] text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                calendar_clock
              </span>
            </div>
            <h3 className="font-sidebar-label text-sidebar-label text-secondary">Next Payment Due</h3>
          </div>
          {visible.length > 0 ? (
            <>
              <div className="font-page-title text-page-title text-primary">
                {visible.find(p => p.status === 'active')?.nextRun || 'None'}
              </div>
              <p className="text-sm text-secondary mt-1">
                {visible.find(p => p.status === 'active')?.recipient} ({formatCurrency(visible.find(p => p.status === 'active')?.amount || 0)})
              </p>
            </>
          ) : (
            <div className="font-page-title text-page-title text-secondary">No Payments Due</div>
          )}
        </Card>
      </div>

      {/* Complex Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        {/* Table Section */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
          {/* Table Toolbar */}
          <div className="px-6 py-5 border-b border-border-subtle flex items-center justify-between bg-surface-bright">
            <h2 className="font-section-title text-section-title text-primary">Active Schedules</h2>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
                <input
                  className="h-10 pl-9 pr-4 rounded-lg border border-border-subtle bg-surface-container-lowest text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none w-48 transition-all duration-200"
                  placeholder="Search schedules..."
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-border-subtle text-secondary hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-surface border-b border-border-subtle">
                  <th className="px-6 py-3 font-table-header text-table-header text-secondary uppercase">Recipient</th>
                  <th className="px-6 py-3 font-table-header text-table-header text-secondary uppercase">Type & Freq</th>
                  <th className="px-6 py-3 font-table-header text-table-header text-secondary uppercase text-right">Amount</th>
                  <th className="px-6 py-3 font-table-header text-table-header text-secondary uppercase">Next Run</th>
                  <th className="px-6 py-3 font-table-header text-table-header text-secondary uppercase">Status</th>
                  <th className="px-6 py-3 font-table-header text-table-header text-secondary uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {visible.map((p) => (
                  <tr
                    key={p.id}
                    className={`group hover:bg-table-hover transition-colors duration-200 ${
                      p.status === 'paused' ? 'bg-[#FAFBFF]' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-secondary-container shrink-0 flex items-center justify-center text-primary font-bold text-sm">
                          {getInitials(p.recipient)}
                        </div>
                        <div>
                          <div className={`font-table-cell text-table-cell font-semibold text-primary ${p.status === 'paused' ? 'line-through opacity-70' : ''}`}>
                            {p.recipient}
                          </div>
                          <div className="text-xs text-secondary">Acc: ****{p.id}04</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-table-cell text-table-cell text-on-surface ${p.status === 'paused' ? 'opacity-70' : ''}`}>
                        {p.type === 'Transfer' ? 'Bank Transfer' : 'Utility Bill'}
                      </div>
                      <div className="text-xs text-secondary mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">refresh</span> {p.freq}, 15th
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-table-cell text-table-cell font-semibold text-primary ${p.status === 'paused' ? 'opacity-70' : ''}`}>
                        GHS {p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-table-cell text-table-cell text-on-surface ${p.status === 'paused' ? 'opacity-70' : ''}`}>
                        {p.status === 'active' ? p.nextRun : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        label={p.status === 'active' ? 'Active' : 'Paused'}
                        type={p.status === 'active' ? 'success' : 'default'}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toggleStatus(p.id)}
                          className="p-1.5 text-secondary hover:text-primary hover:bg-primary-fixed rounded-md transition-colors"
                          title={p.status === 'active' ? 'Pause' : 'Resume'}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {p.status === 'active' ? 'pause' : 'play_arrow'}
                          </span>
                        </button>
                        <button
                          onClick={() => deletePayment(p.id)}
                          className="p-1.5 text-secondary hover:text-error hover:bg-error-container rounded-md transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-secondary text-sm">
                      No matching scheduled payments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-auto px-6 py-4 border-t border-border-subtle flex items-center justify-between bg-surface-container-lowest">
            <span className="text-sm text-secondary">Showing 1 to {visible.length} of {visible.length} entries</span>
            <div className="flex gap-1">
              <button className="w-8 h-8 rounded flex items-center justify-center border border-border-subtle text-outline-variant cursor-not-allowed">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button className="w-8 h-8 rounded flex items-center justify-center bg-primary text-white">1</button>
              <button className="w-8 h-8 rounded flex items-center justify-center border border-border-subtle text-outline-variant cursor-not-allowed">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Recently Completed Widget */}
          <div className="bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-section-title text-section-title text-primary">Recently Completed</h2>
              <button className="text-sm text-admin-accent hover:underline font-medium">View All</button>
            </div>
            <div className="space-y-5">
              {/* Item 1 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0 border border-border-subtle">
                  <span className="material-symbols-outlined text-secondary text-[20px]">water_drop</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-sidebar-label text-sidebar-label font-bold text-primary truncate">Ghana Water Co.</p>
                    <p className="font-semibold text-primary text-sm whitespace-nowrap">GHS 120.00</p>
                  </div>
                  <p className="text-xs text-secondary mt-0.5">Utility Bill • Today, 08:00 AM</p>
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#E5F5ED] text-[#1E8449]">
                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                    SUCCESS
                  </div>
                </div>
              </div>
              <div className="h-px bg-border-subtle w-full"></div>

              {/* Item 2 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0 border border-border-subtle">
                  <span className="material-symbols-outlined text-secondary text-[20px]">router</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-sidebar-label text-sidebar-label font-bold text-primary truncate">MTN Broadband</p>
                    <p className="font-semibold text-primary text-sm whitespace-nowrap">GHS 350.00</p>
                  </div>
                  <p className="text-xs text-secondary mt-0.5">Internet • Yesterday, 09:15 AM</p>
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#E5F5ED] text-[#1E8449]">
                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                    SUCCESS
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Educational Bento Box */}
          <div className="bg-primary-fixed rounded-xl p-6 border border-primary-fixed-dim relative overflow-hidden">
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[100px] text-primary opacity-5 transform -rotate-12">
              lightbulb
            </span>
            <div className="flex items-center gap-2 text-primary mb-2">
              <span className="material-symbols-outlined text-[20px]">tips_and_updates</span>
              <h3 className="font-bold font-sidebar-label text-sidebar-label">Automate & Save Time</h3>
            </div>
            <p className="text-sm text-on-primary-fixed-variant leading-relaxed">
              Did you know you can link scheduled payments to specific bulk payment files? Set it up once and let GhanaPay handle your payroll automatically every month.
            </p>
          </div>
        </div>
      </div>

      {/* New Schedule Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-border-subtle p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-section-title text-section-title text-primary">New Scheduled Payment</h2>
              <button
                onClick={() => setShowNew(false)}
                className="text-secondary hover:text-primary transition-colors focus:outline-none"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowNew(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                  Recipient Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kwame Mensah"
                  className="w-full h-11 border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                  Phone / Account
                </label>
                <input
                  type="text"
                  placeholder="0244 xxx xxx"
                  className="w-full h-11 border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                  Amount (GHS)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full h-11 border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                  Frequency
                </label>
                <select className="w-full h-11 border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white">
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Annually</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <Btn variant="secondary" onClick={() => setShowNew(false)} className="flex-1">
                  Cancel
                </Btn>
                <Btn type="submit" className="flex-1">
                  Create Schedule
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrap>
  );
}
