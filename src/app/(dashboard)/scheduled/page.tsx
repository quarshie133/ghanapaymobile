/* eslint-disable */
'use client';
import React, { useState, useEffect } from 'react';
import { SCHEDULED } from '@/lib/mock-data';
import { formatCurrency, getInitials } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { PageWrap } from '@/components/ui/Layout';
import Modal from '@/components/ui/Modal';
import type { ScheduledPayment } from '@/types/transaction';

export default function ScheduledPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');

  // Form states for new schedule
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly'); // 'daily' | 'weekly' | 'monthly' | 'annually'
  const [type, setType] = useState('transfer'); // 'transfer' | 'bill' | 'airtime'
  const [nextRunAt, setNextRunAt] = useState('');
  const [note, setNote] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadSchedules = async () => {
    if (!user) return;
    try {
      const res = await api.get('/scheduled');
      const list = Array.isArray(res) ? res : (res?.data || []);
      
      // Map backend model properties to look nice on frontend if needed,
      // but we will support both formats dynamically in the render list.
      setPayments(list);
    } catch (err) {
      console.error('Failed to load scheduled payments from backend, falling back to mock data', err);
      setPayments(SCHEDULED);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [user]);

  // Toggle active/paused status on backend
  const handleToggleStatus = async (item: any) => {
    const newStatus = item.status === 'active' ? 'paused' : 'active';
    try {
      // Find the ID. Mock data uses number, backend uses UUID string
      await api.put(`/scheduled/${item.id}`, { status: newStatus });
      setPayments(prev => prev.map(p =>
        p.id === item.id ? { ...p, status: newStatus } : p
      ));
    } catch (err) {
      alert('Failed to update schedule status.');
    }
  };

  // Delete scheduled payment from backend
  const handleDeletePayment = async (id: string | number) => {
    try {
      await api.delete(`/scheduled/${id}`);
      setPayments(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      // If mock number, just filter it out locally
      if (typeof id === 'number') {
        setPayments(prev => prev.filter(p => p.id !== id));
      } else {
        alert('Failed to delete scheduled payment.');
      }
    }
  };

  // Create scheduled payment
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !recipientPhone || !amount || !nextRunAt) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        recipientName,
        recipientPhone,
        amount: parseFloat(amount),
        frequency: frequency.toLowerCase(),
        type: type.toLowerCase(),
        nextRunAt: new Date(nextRunAt).toISOString(),
        note: note || undefined,
      };

      await api.post('/scheduled', payload);
      await loadSchedules();
      setShowNew(false);
      
      // Clear form
      setRecipientName('');
      setRecipientPhone('');
      setAmount('');
      setFrequency('monthly');
      setNextRunAt('');
      setNote('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create scheduled payment.');
    } finally {
      setLoading(false);
    }
  };

  // Compute stats
  const filtered = payments.filter(p => {
    const name = p.recipientName || p.recipient || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const activeCount = filtered.filter(p => p.status === 'active').length;
  
  const totalMonthly = filtered.reduce((s, p) => {
    const amt = Number(p.amount || 0);
    const freqVal = p.frequency || p.freq || 'monthly';
    const mult = freqVal.toLowerCase() === 'weekly' ? 4 : freqVal.toLowerCase() === 'daily' ? 30 : 1;
    return s + (amt * mult);
  }, 0);

  const getNextDueDate = () => {
    const active = filtered.find(p => p.status === 'active');
    if (!active) return 'None';
    const dateVal = active.nextRunAt || active.nextRun;
    if (!dateVal) return 'None';
    return new Date(dateVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
            <h3 className="font-sidebar-label text-sidebar-label text-secondary">Total Monthly Projection</h3>
          </div>
          <div className="font-metric-value text-metric-value text-primary flex items-baseline gap-1">
            <span className="text-2xl font-bold text-secondary">₵</span> {totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
          {filtered.length > 0 ? (
            <>
              <div className="font-page-title text-page-title text-primary">
                {getNextDueDate()}
              </div>
              <p className="text-sm text-secondary mt-1">
                {filtered.find(p => p.status === 'active')?.recipientName || filtered.find(p => p.status === 'active')?.recipient || 'None'}
              </p>
            </>
          ) : (
            <div className="font-page-title text-page-title text-secondary">No Payments Due</div>
          )}
        </Card>
      </div>

      {/* Complex Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table Section */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
          {/* Table Toolbar */}
          <div className="px-6 py-5 border-b border-border-subtle flex items-center justify-between bg-surface-bright">
            <h2 className="font-section-title text-section-title text-primary">Schedules List</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
                <input
                  className="h-10 pl-9 pr-4 rounded-lg border border-border-subtle bg-surface-container-lowest text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none w-48 transition-all duration-200"
                  placeholder="Search schedules..."
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
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
                {filtered.map((p) => {
                  const name = p.recipientName || p.recipient || 'Unknown Recipient';
                  const phoneVal = p.recipientPhone || 'N/A';
                  const nextRunVal = p.nextRunAt || p.nextRun;
                  const freqVal = p.frequency || p.freq || 'monthly';
                  
                  return (
                    <tr
                      key={p.id}
                      className={`group hover:bg-table-hover transition-colors duration-200 ${
                        p.status === 'paused' ? 'bg-surface-variant/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-secondary-container shrink-0 flex items-center justify-center text-primary font-bold text-sm">
                            {getInitials(name)}
                          </div>
                          <div>
                            <div className={`font-table-cell text-table-cell font-bold text-primary ${p.status === 'paused' ? 'opacity-60' : ''}`}>
                              {name}
                            </div>
                            <div className="text-xs text-secondary">{phoneVal}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-table-cell text-table-cell text-on-surface capitalize ${p.status === 'paused' ? 'opacity-60' : ''}`}>
                          {p.type || 'Transfer'}
                        </div>
                        <div className="text-[11px] text-secondary mt-0.5 flex items-center gap-1 capitalize">
                          <span className="material-symbols-outlined text-[13px]">refresh</span> {freqVal}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`font-table-cell text-table-cell font-bold text-primary ${p.status === 'paused' ? 'opacity-60' : ''}`}>
                          ₵{Number(p.amount).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-table-cell text-table-cell text-on-surface ${p.status === 'paused' ? 'opacity-60' : ''}`}>
                          {p.status === 'active' && nextRunVal
                            ? new Date(nextRunVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          label={p.status === 'active' ? 'Active' : p.status === 'paused' ? 'Paused' : p.status}
                          type={p.status === 'active' ? 'success' : 'default'}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className="p-1.5 text-secondary hover:text-primary hover:bg-primary-fixed rounded-md transition-colors"
                            title={p.status === 'active' ? 'Pause' : 'Resume'}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {p.status === 'active' ? 'pause' : 'play_arrow'}
                            </span>
                          </button>
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            className="p-1.5 text-secondary hover:text-error hover:bg-error-container rounded-md transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-secondary text-sm">
                      No scheduled payments configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm p-6">
            <h2 className="font-section-title text-section-title text-primary mb-4">Payment Tips</h2>
            <div className="space-y-4 text-xs text-secondary leading-relaxed">
              <p>
                <strong>Daily Processor:</strong> GhanaPay checks and executes due transactions automatically every minute. Make sure you maintain sufficient wallet balance before the scheduled execution date.
              </p>
              <p>
                <strong>Failed Payments:</strong> If a scheduled transaction fails due to insufficient balance, the processor will automatically pause it to prevent recursive failures.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* New Schedule Modal */}
      <Modal
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        title="New Scheduled Payment"
        size="md"
      >
        {errorMsg && (
          <div className="mb-4 p-3 bg-error-container text-error rounded-xl text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
              Recipient Name
            </label>
            <input
              type="text"
              placeholder="e.g. Kwame Mensah"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full h-11 border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="0244 xxx xxx"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              className="w-full h-11 border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                Amount (GHS)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-11 border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                Type
              </label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="w-full h-11 border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
              >
                <option value="transfer">Transfer</option>
                <option value="bill">Bill Payment</option>
                <option value="airtime">Airtime</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                Frequency
              </label>
              <select 
                value={frequency} 
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full h-11 border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                Start / Next Date
              </label>
              <input
                type="date"
                value={nextRunAt}
                onChange={(e) => setNextRunAt(e.target.value)}
                className="w-full h-11 border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
              Note / Reference
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly Rent"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-11 border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Btn variant="secondary" onClick={() => setShowNew(false)} className="flex-1" disabled={loading}>
              Cancel
            </Btn>
            <Btn type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating...' : 'Create Schedule'}
            </Btn>
          </div>
        </form>
      </Modal>
    </PageWrap>
  );
}
