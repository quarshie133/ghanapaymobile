'use client';
import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { SectionTitle, PageWrap } from '@/components/ui/Layout';

// ─── Network Providers ─────────────────────────────────────────────────────
type Network = {
  id: string;
  name: string;
  color: string;
  bg: string;
  prefix: string[];
  logoText: string;
  logoBg: string;
  logoColor: string;
};

const NETWORKS: Network[] = [
  {
    id: 'mtn',
    name: 'MTN MoMo',
    color: '#D68910',
    bg: '#FFFDE7',
    prefix: ['024', '054', '055', '059'],
    logoText: 'MTN',
    logoBg: 'bg-yellow-400',
    logoColor: 'text-black',
  },
  {
    id: 'telecel',
    name: 'Telecel Cash',
    color: '#C0392B',
    bg: '#FDEDEC',
    prefix: ['020', '050'],
    logoText: 'TCL',
    logoBg: 'bg-red-600',
    logoColor: 'text-white',
  },
  {
    id: 'at',
    name: 'AT Money',
    color: '#1A5276',
    bg: '#EBF5FB',
    prefix: ['026', '056', '027', '057'],
    logoText: 'AT',
    logoBg: 'bg-[#1A5276]',
    logoColor: 'text-white',
  },
  {
    id: 'glo',
    name: 'Glo',
    color: '#1E8449',
    bg: '#E9F7EF',
    prefix: ['023', '028'],
    logoText: 'Glo',
    logoBg: 'bg-green-600',
    logoColor: 'text-white',
  },
];

// ─── Quick Amount Presets ──────────────────────────────────────────────────
const QUICK_AMOUNTS = [5, 10, 20, 50, 100, 200];

// ─── Recent Airtime Entries (static demo) ─────────────────────────────────
const RECENT = [
  { name: 'Kwame Mensah',    phone: '0244123456', network: 'mtn',        amount: 10, date: 'Today 9:22 AM' },
  { name: 'Self (MTN)',      phone: '0244555900', network: 'mtn',        amount: 5,  date: 'Yesterday' },
  { name: 'Ama Boateng',     phone: '0200456789', network: 'telecel',    amount: 20, date: 'Jun 30' },
  { name: 'Kofi Asante',     phone: '0267789012', network: 'at',         amount: 15, date: 'Jun 28' },
];

function networkById(id: string) {
  return NETWORKS.find(n => n.id === id) ?? NETWORKS[0];
}

function detectNetwork(phone: string): Network | null {
  const cleanPhone = phone.replace(/\s/g, '');
  if (cleanPhone.length < 3) return null;
  const prefix = cleanPhone.substring(0, 3);
  return NETWORKS.find(n => n.prefix.includes(prefix)) ?? null;
}

type Step = 'form' | 'confirm' | 'success';

export default function AirtimePage() {
  const { user } = useAuth();

  // Form state
  const [phone, setPhone]         = useState('');
  const [network, setNetwork]     = useState<Network | null>(null);
  const [amount, setAmount]       = useState('');
  const [recipient, setRecipient] = useState('');
  const [step, setStep]           = useState<Step>('form');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Auto-detect network from phone prefix
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const detected = detectNetwork(val);
    if (detected) setNetwork(detected);
  };

  const selectedQuick = QUICK_AMOUNTS.includes(Number(amount)) ? Number(amount) : null;

  const isFormValid = phone.replace(/\s/g, '').length === 10 && Number(amount) >= 1 && network;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setError('');
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      // Simulate real API call or invoke standard path
      await api.post('/airtime', {
        phone: phone.replace(/\s/g, ''),
        network: network!.id,
        amount: Number(amount),
        recipientName: recipient || undefined,
      });
      setStep('success');
    } catch (err: any) {
      setError(err?.message ?? 'Airtime purchase failed. Please try again.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPhone('');
    setNetwork(null);
    setAmount('');
    setRecipient('');
    setError('');
    setStep('form');
  };

  // ── Success Screen ────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <PageWrap title="Airtime Top-Up" subtitle="Buy airtime for any Ghana network" breadcrumb="Airtime">
        <div className="max-w-md mx-auto">
          <Card>
            <div className="text-center py-8 px-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: 'linear-gradient(135deg, #1E8449, #27AE60)' }}
              >
                <span className="material-symbols-outlined text-white text-4xl">check_circle</span>
              </div>
              <h2 className="text-2xl font-black text-primary mb-2">Airtime Top-up Successful!</h2>
              <p className="text-secondary text-sm mb-6">
                ₵{Number(amount).toFixed(2)} airtime has been sent to{' '}
                <span className="font-bold text-primary">{phone}</span>
              </p>

              {/* Receipt card */}
              <div className="bg-surface-container-low rounded-xl p-4 text-left space-y-3 mb-6 border border-border-subtle">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Network</span>
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <div className={`w-5 h-5 rounded-full ${network?.logoBg} ${network?.logoColor} flex items-center justify-center text-[7px] font-black`}>
                      {network?.logoText}
                    </div>
                    <span>{network?.name}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Phone</span>
                  <span className="font-bold text-primary">{phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Amount</span>
                  <span className="font-bold text-success">₵{Number(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Transaction Status</span>
                  <Badge label="Successful" type="success" />
                </div>
              </div>

              <div className="flex gap-3">
                <Btn variant="secondary" onClick={handleReset} className="flex-1">
                  Buy Again
                </Btn>
                <Btn variant="primary" onClick={() => window.location.href = '/dashboard'} className="flex-1">
                  Dashboard
                </Btn>
              </div>
            </div>
          </Card>
        </div>
      </PageWrap>
    );
  }

  // ── Confirm Screen ────────────────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <PageWrap title="Airtime Top-Up" subtitle="Confirm your airtime purchase" breadcrumb="Airtime">
        <div className="max-w-md mx-auto space-y-4">
          <Card>
            <SectionTitle>Confirm Purchase</SectionTitle>

            {/* Network badge */}
            <div
              className="rounded-xl p-4 mb-4 flex items-center gap-4 border"
              style={{ background: network?.bg, borderColor: network?.color + '30' }}
            >
              <div className={`w-12 h-12 rounded-full ${network?.logoBg} ${network?.logoColor} flex items-center justify-center font-black text-xs shrink-0`}>
                {network?.logoText}
              </div>
              <div>
                <div className="text-sm font-bold text-primary">{network?.name}</div>
                <div className="text-xs text-secondary">Ghana Mobile Top-Up</div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Recipient Phone', value: phone },
                { label: 'Recipient Name',  value: recipient || 'Self' },
                { label: 'Network Operator', value: network?.name ?? '' },
                { label: 'Amount',          value: `₵${Number(amount).toFixed(2)}` },
                { label: 'Fees',            value: 'Free' },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-border-subtle last:border-0">
                  <span className="text-sm text-secondary">{row.label}</span>
                  <span className={`text-sm font-bold ${row.label === 'Amount' ? 'text-primary text-base' : 'text-primary'}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <Btn variant="secondary" onClick={() => setStep('form')} className="flex-1" disabled={loading}>
                Back
              </Btn>
              <Btn variant="primary" onClick={handleConfirm} className="flex-1" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing…
                  </span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px] mr-1">smartphone</span>
                    Confirm &amp; Topup
                  </>
                )}
              </Btn>
            </div>
          </Card>
        </div>
      </PageWrap>
    );
  }

  // ── Form Screen ───────────────────────────────────────────────────────────
  return (
    <PageWrap title="Airtime Top-Up" subtitle="Buy airtime for MTN, Telecel, AT, and Glo instantly" breadcrumb="Airtime">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── Left: Form ──────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <Card>
            <SectionTitle>Top-Up Form</SectionTitle>

            {error && (
              <div className="bg-error/10 border border-error/30 text-error rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Network selector */}
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-3">
                  Select Mobile Network
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {NETWORKS.map(n => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => setNetwork(n)}
                      className="relative rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all focus:outline-none hover:bg-surface-container-low"
                      style={{
                        borderColor: network?.id === n.id ? n.color : 'transparent',
                        background:  network?.id === n.id ? n.bg : '#F8F9FA',
                      }}
                    >
                      <div className={`w-9 h-9 rounded-full ${n.logoBg} ${n.logoColor} flex items-center justify-center font-black text-[11px] shadow-sm`}>
                        {n.logoText}
                      </div>
                      <span
                        className="text-xs font-bold"
                        style={{ color: network?.id === n.id ? n.color : '#374151' }}
                      >
                        {n.name}
                      </span>
                      {network?.id === n.id && (
                        <span
                          className="absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm"
                          style={{ background: n.color }}
                        >
                          <span className="material-symbols-outlined text-white text-[10px] font-bold">check</span>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone number */}
              <Input
                id="airtime-phone"
                label="Phone Number"
                placeholder="0244 000 000"
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
              />

              {/* Recipient name (optional) */}
              <Input
                id="airtime-recipient"
                label="Recipient Name (optional)"
                placeholder="e.g. Kwame Mensah"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />

              {/* Quick amount buttons */}
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-3">
                  Quick Amounts (₵)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                  {QUICK_AMOUNTS.map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmount(String(q))}
                      className="py-2.5 rounded-xl border-2 text-sm font-black transition-all focus:outline-none"
                      style={{
                        borderColor: selectedQuick === q ? '#020259' : '#E5E7EB',
                        background:  selectedQuick === q ? '#020259' : '#FFFFFF',
                        color:       selectedQuick === q ? '#FFFFFF' : '#374151',
                      }}
                    >
                      ₵{q}
                    </button>
                  ))}
                </div>

                <Input
                  id="airtime-amount"
                  label="Or enter custom amount (₵)"
                  placeholder="0.00"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <Btn
                type="submit"
                variant="primary"
                className="w-full justify-center mt-2"
                disabled={!isFormValid}
              >
                <span className="material-symbols-outlined text-[18px] mr-2">smartphone</span>
                Review Purchase
              </Btn>
            </form>
          </Card>
        </div>

        {/* ── Right: Recent & Info ─────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-5 space-y-6">

          {/* Recent Airtime */}
          <Card>
            <SectionTitle>Recent Airtime</SectionTitle>
            <div className="space-y-3">
              {RECENT.map((r, i) => {
                const net = networkById(r.network);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setPhone(r.phone);
                      setNetwork(net);
                      setAmount(String(r.amount));
                      setRecipient(r.name);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors text-left border border-transparent hover:border-border-subtle focus:outline-none"
                  >
                    <div className={`w-10 h-10 rounded-full ${net.logoBg} ${net.logoColor} flex items-center justify-center font-black text-[9px] shrink-0 shadow-sm`}>
                      {net.logoText}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-primary truncate">{r.name}</div>
                      <div className="text-xs text-secondary">{r.phone}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-primary">₵{r.amount}.00</div>
                      <div className="text-[11px] text-secondary">{r.date}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Info card */}
          <Card>
            <SectionTitle>Top-Up Guide</SectionTitle>
            <div className="space-y-4">
              {[
                { icon: 'smartphone',    text: 'Select the mobile network and enter the phone number' },
                { icon: 'payments',      text: 'Choose a preset amount or enter a custom value' },
                { icon: 'check_circle',  text: 'Confirm the purchase — airtime is sent instantly' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-[16px]">{step.icon}</span>
                  </div>
                  <p className="text-sm text-secondary leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-surface-container-low rounded-xl border border-border-subtle">
              <p className="text-xs text-secondary flex items-center gap-2 font-semibold">
                <span className="material-symbols-outlined text-[14px] text-success font-bold">verified</span>
                Zero processing fees on all airtime purchases
              </p>
            </div>
          </Card>
        </div>

      </div>
    </PageWrap>
  );
}
