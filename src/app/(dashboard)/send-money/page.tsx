'use client';
import React, { useState } from 'react';
import T from '@/lib/tokens';
import { formatCurrency, getInitials } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { PageWrap } from '@/components/ui/Layout';

const CONTACTS = [
  { name: 'Kwame Mensah',   phone: '0244 567 890', method: 'MTN MoMo' },
  { name: 'Abena Asante',   phone: '0201 234 567', method: 'GhanaPay' },
  { name: 'Ama Atta',       phone: '0244 111 222', method: 'GhanaPay' },
  { name: 'Yaw Boateng',    phone: '0244 333 444', method: 'MTN MoMo' },
  { name: 'Kofi Landlord',  phone: '0277 890 123', method: 'Bank Transfer' },
  { name: 'Adjoa Sarpong',  phone: '0559 123 456', method: 'Vodafone Cash' },
];

type Step = 1 | 2 | 3;

export default function SendMoneyPage() {
  const [step, setStep] = useState<Step>(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof CONTACTS[0] | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote]     = useState('');
  const [sent, setSent]     = useState(false);

  const filtered = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const fee = parseFloat(amount || '0') > 1000 ? 2 : 0;
  const total = parseFloat(amount || '0') + fee;

  function handleSend() {
    setSent(true);
    setTimeout(() => { setSent(false); setStep(1); setSelected(null); setAmount(''); setNote(''); }, 3500);
  }

  const steps = [
    { n: 1, label: 'Recipient' },
    { n: 2, label: 'Amount' },
    { n: 3, label: 'Confirm' },
  ];

  return (
    <PageWrap title="Send Money" subtitle="Transfer funds to any GhanaPay user or mobile money account">
      <style>{`.contact-row:hover { background: ${T.tableHover} !important; }`}</style>

      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', fontWeight: 700, fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step > s.n ? T.success : step === s.n ? T.navyMid : T.border,
                  color: step >= s.n ? '#fff' : T.textMuted,
                  transition: 'all 0.3s',
                }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: step === s.n ? T.navyMid : T.textMuted }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, background: step > s.n ? T.success : T.border, margin: '0 8px', marginBottom: 20, transition: 'background 0.3s' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Recipient */}
        {step === 1 && (
          <Card>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Select Recipient</h3>
            <Input
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              icon="🔍"
            />
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filtered.map(c => (
                <div
                  key={c.phone}
                  className="contact-row"
                  onClick={() => { setSelected(c); setStep(2); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 10,
                    cursor: 'pointer', border: `1px solid ${selected?.phone === c.phone ? T.navyMid : 'transparent'}`,
                    background: selected?.phone === c.phone ? T.sidebarActive : 'transparent',
                  }}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: T.sidebarActive, color: T.navyMid,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700,
                  }}>
                    {getInitials(c.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>{c.phone}</div>
                  </div>
                  <Badge label={c.method} type="navy" />
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
                  No contacts found. Try a different search.
                </div>
              )}
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 12 }}>Or send to a new number</p>
              <Input placeholder="Enter phone number (e.g. 0244 123 456)" icon="📞" />
              <div style={{ marginTop: 12 }}>
                <Btn style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(2)}>Continue →</Btn>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Amount & Note */}
        {step === 2 && selected && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 12, background: T.surfaceLow, marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: T.sidebarActive, color: T.navyMid,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700,
              }}>
                {getInitials(selected.name)}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary }}>{selected.name}</div>
                <div style={{ fontSize: 13, color: T.textMuted }}>{selected.phone} · {selected.method}</div>
              </div>
              <button onClick={() => setStep(1)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: T.navyMid, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Change</button>
            </div>

            <h3 style={{ fontSize: 17, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Enter Amount</h3>

            <div style={{ position: 'relative', marginBottom: 16 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 20, fontWeight: 700, color: T.navyMid, zIndex: 1 }}>₵</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%', height: 60, paddingLeft: 40, paddingRight: 14,
                  fontSize: 28, fontWeight: 800, color: T.textPrimary,
                  border: `2px solid ${T.borderVar}`, borderRadius: 12, background: T.surface,
                  outline: 'none',
                }}
              />
            </div>

            {/* Quick amounts */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[50, 100, 200, 500].map(q => (
                <button key={q} onClick={() => setAmount(String(q))} style={{
                  flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${T.border}`,
                  background: amount === String(q) ? T.sidebarActive : T.white,
                  color: amount === String(q) ? T.navyMid : T.textSec,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  ₵{q}
                </button>
              ))}
            </div>

            <Input label="Note (optional)" placeholder="What's this for?" value={note} onChange={e => setNote(e.target.value)} />

            {amount && parseFloat(amount) > 0 && (
              <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: T.surfaceLow, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: T.textMuted, marginBottom: 6 }}>
                  <span>Amount</span><span style={{ fontWeight: 600, color: T.textPrimary }}>{formatCurrency(parseFloat(amount))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: T.textMuted, marginBottom: 10 }}>
                  <span>Network fee</span><span style={{ fontWeight: 600, color: fee > 0 ? T.warning : T.success }}>{fee > 0 ? formatCurrency(fee) : 'Free'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                  <span>Total</span><span style={{ color: T.navyMid }}>{formatCurrency(total)}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <Btn variant="secondary" onClick={() => setStep(1)} style={{ flex: 1, justifyContent: 'center' }}>← Back</Btn>
              <Btn onClick={() => setStep(3)} disabled={!amount || parseFloat(amount) <= 0} style={{ flex: 2, justifyContent: 'center' }}>Review →</Btn>
            </div>
          </Card>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && selected && !sent && (
          <Card>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: T.navy, marginBottom: 20 }}>Confirm Transfer</h3>
            <div style={{
              borderRadius: 16, background: `linear-gradient(135deg, ${T.navy}, ${T.navyLight})`,
              padding: 24, color: '#fff', marginBottom: 20, textAlign: 'center',
            }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>SENDING TO</div>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', margin: '0 auto 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800,
              }}>
                {getInitials(selected.name)}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{selected.name}</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>{selected.phone}</div>
              <div style={{ fontSize: 40, fontWeight: 900, margin: '16px 0 4px', color: T.gold }}>{formatCurrency(parseFloat(amount))}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>via {selected.method}</div>
            </div>

            {note && (
              <div style={{ padding: 14, borderRadius: 10, background: T.surfaceLow, marginBottom: 16, fontSize: 13, color: T.textSec }}>
                <strong>Note:</strong> {note}
              </div>
            )}

            <div style={{ padding: 14, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 20 }}>
              {[
                ['Amount', formatCurrency(parseFloat(amount))],
                ['Network Fee', fee > 0 ? formatCurrency(fee) : 'Free'],
                ['Total Deducted', formatCurrency(total)],
                ['Method', selected.method],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                  <span style={{ color: T.textMuted }}>{k}</span>
                  <span style={{ fontWeight: 700, color: T.textPrimary }}>{v}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12, color: T.textMuted, textAlign: 'center', marginBottom: 16 }}>
              By confirming, you authorize this transfer from your GhanaPay wallet.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Btn variant="secondary" onClick={() => setStep(2)} style={{ flex: 1, justifyContent: 'center' }}>← Back</Btn>
              <Btn variant="success" onClick={handleSend} style={{ flex: 2, justifyContent: 'center', fontSize: 15 }}>✓ Confirm & Send</Btn>
            </div>
          </Card>
        )}

        {/* Success State */}
        {sent && (
          <Card style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.success, marginBottom: 8 }}>Payment Sent!</div>
            <div style={{ fontSize: 15, color: T.textMuted, marginBottom: 24 }}>
              {formatCurrency(parseFloat(amount))} sent to {selected?.name}
            </div>
            <div style={{ fontSize: 12, color: T.textMuted }}>Redirecting to home…</div>
          </Card>
        )}
      </div>
    </PageWrap>
  );
}
