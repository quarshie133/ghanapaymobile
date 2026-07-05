'use client';
import React, { useState } from 'react';
import T from '@/lib/tokens';
import { TRANSACTIONS } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { SectionTitle, PageWrap } from '@/components/ui/Layout';
import {
  FaBolt, FaDroplet, FaTv, FaGlobe, FaShieldHalved, FaGraduationCap, FaCircleCheck, FaHashtag, FaCediSign, FaFileInvoiceDollar
} from 'react-icons/fa6';

type BillCategory = {
  id: string;
  name: string;
  provider: string;
  icon: React.ReactNode;
  color: string;
  accent: string;
};

const CATEGORIES: BillCategory[] = [
  { id: 'electricity', name: 'Electricity',  provider: 'ECG',      icon: <FaBolt />, color: '#FFF3CD', accent: '#D68910' },
  { id: 'water',       name: 'Water',        provider: 'GWCL',     icon: <FaDroplet />, color: '#D6EAF8', accent: '#1E7B9E' },
  { id: 'tv',          name: 'TV / Cable',   provider: 'DStv·GOtv',icon: <FaTv />, color: '#E8DAEF', accent: '#8E44AD' },
  { id: 'internet',    name: 'Internet',     provider: 'Various',  icon: <FaGlobe />, color: '#D5F5E3', accent: '#1E8449' },
  { id: 'insurance',   name: 'Insurance',    provider: 'GLICO',    icon: <FaShieldHalved />, color: '#FADBD8', accent: '#C0392B' },
  { id: 'school',      name: 'School Fees',  provider: 'Schools',  icon: <FaGraduationCap />, color: '#FDEBD0', accent: '#D68910' },
];

const RECENT_BILLS = TRANSACTIONS.filter(t => t.type === 'Bill');

export default function BillPaymentsPage() {
  const [selected, setSelected] = useState<BillCategory | null>(null);
  const [acctNo, setAcctNo]   = useState('');
  const [amount, setAmount]   = useState('');
  const [paid, setPaid]       = useState(false);

  function handlePay() {
    setPaid(true);
    setTimeout(() => { setPaid(false); setAcctNo(''); setAmount(''); setSelected(null); }, 3000);
  }

  return (
    <PageWrap title="Bill Payments" subtitle="Pay utilities, TV, internet, insurance and more">
      <style>{`.trow:hover { background: ${T.tableHover} !important; } .cat-card:hover { border-color: ${T.navyMid} !important; transform: translateY(-2px); } .cat-card { transition: all 0.18s; }`}</style>

      <div className="bill-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Category Grid */}
          <Card>
            <SectionTitle>Select Bill Type</SectionTitle>
            <div className="category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {CATEGORIES.map(cat => (
                <div
                  key={cat.id}
                  className="cat-card"
                  onClick={() => { setSelected(cat); setPaid(false); }}
                  style={{
                    padding: 20, borderRadius: 14, cursor: 'pointer',
                    border: `2px solid ${selected?.id === cat.id ? cat.accent : T.border}`,
                    background: selected?.id === cat.id ? cat.color : T.white,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{cat.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 4 }}>{cat.name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{cat.provider}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Payment Form */}
          {selected && !paid && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 14, borderRadius: 12, background: selected.color }}>
                <span style={{ fontSize: 28 }}>{selected.icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>Provider: {selected.provider}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.textMuted }}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Input
                  label={selected.id === 'electricity' ? 'Meter Number' : selected.id === 'water' ? 'Account Number' : 'Account / Customer ID'}
                  placeholder="Enter your account number"
                  value={acctNo}
                  onChange={e => setAcctNo(e.target.value)}
                  icon={<FaHashtag />}
                />

                {selected.id === 'tv' && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 6 }}>Package</label>
                    <select style={{
                      width: '100%', height: 44, borderRadius: 10, border: `1.5px solid ${T.borderVar}`,
                      padding: '0 14px', fontSize: 14, color: T.textPrimary, background: T.white,
                    }}>
                      <option>DStv Compact — ₵180</option>
                      <option>DStv Compact Plus — ₵230</option>
                      <option>GOtv Max — ₵80</option>
                      <option>GOtv Jolli — ₵55</option>
                    </select>
                  </div>
                )}

                <Input
                  label="Amount (₵)"
                  placeholder="0.00"
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  icon={<FaCediSign />}
                />

                <div style={{ padding: 14, borderRadius: 10, background: T.surfaceLow, fontSize: 13, color: T.textMuted }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>Bill Amount</span>
                    <span style={{ fontWeight: 600, color: T.textPrimary }}>{amount ? formatCurrency(parseFloat(amount)) : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Processing Fee</span>
                    <span style={{ fontWeight: 600, color: T.success }}>Free</span>
                  </div>
                </div>

                <Btn
                  variant="primary"
                  disabled={!acctNo || !amount}
                  onClick={handlePay}
                  style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '13px' }}
                >
                  Pay {selected.name} {amount ? `— ${formatCurrency(parseFloat(amount || '0'))}` : ''}
                </Btn>
              </div>
            </Card>
          )}

          {paid && (
            <Card style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 56, color: T.success, display: 'flex', justifyContent: 'center' }}><FaCircleCheck /></div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.success, marginTop: 16 }}>Bill Paid!</div>
              <div style={{ fontSize: 13, color: T.textMuted, marginTop: 8 }}>
                {selected?.name} payment of {formatCurrency(parseFloat(amount || '0'))} was successful.
              </div>
            </Card>
          )}
        </div>

        {/* Right: Recent Bills */}
        <div>
          <Card>
            <SectionTitle>Recent Bills</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {RECENT_BILLS.map(tx => (
                <div key={tx.id} className="trow" style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: T.errorBg, color: T.error,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  }}>
                    {tx.method === 'Electricity' ? <FaBolt /> : tx.method === 'Water' ? <FaDroplet /> : tx.method === 'TV' ? <FaTv /> : <FaFileInvoiceDollar />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{tx.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{tx.date} · {tx.note}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.error }}>{formatCurrency(Math.abs(tx.amount))}</div>
                    <Badge label={tx.status} type={tx.status === 'completed' ? 'success' : 'warning'} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Pay Tips */}
          <Card style={{ marginTop: 16, background: T.infoBg, border: `1px solid ${T.info}33` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.info, marginBottom: 10 }}>💡 Did you know?</div>
            <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: T.textSec, lineHeight: 2 }}>
              <li>Set up auto-pay for recurring bills</li>
              <li>Get notified 3 days before bills are due</li>
              <li>All bill payments are processed instantly</li>
              <li>Earn GhanaPay points on every bill paid</li>
            </ul>
          </Card>
        </div>
      </div>
    </PageWrap>
  );
}
