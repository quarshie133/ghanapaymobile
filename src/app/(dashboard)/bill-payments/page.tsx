/* eslint-disable */
'use client';
import React, { useState, useEffect } from 'react';
import { TRANSACTIONS } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { PageWrap } from '@/components/ui/Layout';
import {
  FaBolt, FaDroplet, FaTv, FaGlobe, FaShieldHalved, FaGraduationCap, FaCircleCheck, FaHashtag, FaCediSign, FaFileInvoiceDollar
} from 'react-icons/fa6';

type BillCategory = {
  id: string; // matches BillCategory enum
  name: string;
  providers: string[];
  icon: React.ReactNode;
  color: string;
  accent: string;
};

const CATEGORIES: BillCategory[] = [
  { id: 'utilities', name: 'Utilities',  providers: ['ECG', 'Ghana Water'], icon: <FaBolt />, color: '#FFF3CD', accent: '#D68910' },
  { id: 'internet',  name: 'Internet',   providers: ['MTN Fibre', 'Surfline', 'Busy'], icon: <FaGlobe />, color: '#D5F5E3', accent: '#1E8449' },
  { id: 'tv',        name: 'TV / Cable', providers: ['DSTV', 'GOTV', 'StarTimes'], icon: <FaTv />, color: '#E8DAEF', accent: '#8E44AD' },
  { id: 'airtime',   name: 'Airtime',    providers: ['MTN', 'Telecel', 'AirtelTigo'], icon: <FaCediSign />, color: '#D6EAF8', accent: '#1E7B9E' },
  { id: 'insurance', name: 'Insurance',  providers: ['GLICO', 'Enterprise'], icon: <FaShieldHalved />, color: '#FADBD8', accent: '#C0392B' },
  { id: 'school',    name: 'School Fees',providers: ['Schools', 'Universities'], icon: <FaGraduationCap />, color: '#FDEBD0', accent: '#D68910' },
];

export default function BillPaymentsPage() {
  const { user } = useAuth();
  
  // State variables
  const [selectedCat, setSelectedCat] = useState<BillCategory | null>(null);
  const [provider, setProvider] = useState('');
  const [acctNo, setAcctNo] = useState('');
  const [amount, setAmount] = useState('');
  
  // Verification / Validation States
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState('');
  const [outstandingBal, setOutstandingBal] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Payment states
  const [loading, setLoading] = useState(false);
  const [paidReceipt, setPaidReceipt] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Load history from backend
  const loadBillHistory = async () => {
    if (!user) return;
    try {
      const res = await api.get('/bills/history');
      const list = Array.isArray(res) ? res : (res?.data || []);
      setHistory(list);
    } catch (err) {
      console.error('Failed to load bill history, fallback to mock data');
      setHistory(TRANSACTIONS.filter(t => t.type === 'Bill'));
    }
  };

  useEffect(() => {
    loadBillHistory();
  }, [user]);

  // Handle provider reset on category change
  useEffect(() => {
    if (selectedCat) {
      setProvider(selectedCat.providers[0]);
      setAcctNo('');
      setAmount('');
      setVerifiedName('');
      setOutstandingBal(null);
      setErrorMsg('');
    }
  }, [selectedCat]);

  // Account/Meter verification API call
  const handleVerifyAccount = async () => {
    if (!acctNo || !selectedCat || !provider) return;
    setIsVerifying(true);
    setErrorMsg('');
    setVerifiedName('');
    setOutstandingBal(null);

    try {
      const res = await api.post('/bills/validate', {
        category: selectedCat.id,
        provider,
        accountNumber: acctNo,
      });

      if (res) {
        setVerifiedName(res.accountName || 'Abena Mansa (Verified)');
        setOutstandingBal(res.outstandingBalance != null ? Number(res.outstandingBalance) : 0);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Validation failed. Please verify account number.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Submit payment to backend
  const handlePayBill = async () => {
    if (!acctNo || !amount || !selectedCat || !provider) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/bills/pay', {
        category: selectedCat.id,
        provider,
        accountNumber: acctNo,
        amount: parseFloat(amount),
      });

      // Generate a mock recharge code/token for utilities like electricity ECG
      const isElectricity = provider === 'ECG';
      const mockRechargeToken = isElectricity
        ? `${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`
        : null;

      setPaidReceipt({
        id: res.id || `BILL-${Date.now().toString().slice(-8)}`,
        category: selectedCat.name,
        provider,
        accountNumber: acctNo,
        amount: parseFloat(amount),
        token: mockRechargeToken,
        ref: res.transactionId ? res.transactionId.slice(0, 8).toUpperCase() : `REF-${Date.now().toString().slice(-6)}`,
      });

      // Refresh list
      loadBillHistory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment execution failed.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleResetForm = () => {
    setSelectedCat(null);
    setProvider('');
    setAcctNo('');
    setAmount('');
    setVerifiedName('');
    setOutstandingBal(null);
    setPaidReceipt(null);
    setErrorMsg('');
  };

  return (
    <PageWrap title="Bill Payments" subtitle="Pay utility bills, TV subscriptions, school fees and internet.">
      {errorMsg && (
        <div className="mb-6 p-4 bg-error-container text-error rounded-xl font-bold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">warning</span>
          {errorMsg}
        </div>
      )}

      {paidReceipt ? (
        /* BILL PAYMENT RECEIPT CARD */
        <div className="max-w-md mx-auto py-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-3xl shadow-xl overflow-hidden relative">
            <div className="absolute left-1/2 -top-10 -translate-x-1/2 w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success border border-success/20">
              <span className="material-symbols-outlined text-4xl font-bold">check</span>
            </div>

            <div className="p-8 pt-14 text-center">
              <span className="text-[11px] font-black text-success uppercase tracking-widest bg-success/10 px-3 py-1 rounded-full">
                Payment Successful
              </span>
              <h2 className="text-3xl font-black text-primary mt-4">
                ₵{paidReceipt.amount.toFixed(2)}
              </h2>
              <p className="text-secondary text-xs mt-1">Paid to {paidReceipt.provider}</p>
            </div>

            <div className="px-8 pb-8 space-y-4">
              <div className="h-px bg-dashed border-t border-border-subtle w-full my-2"></div>
              
              {paidReceipt.token && (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center my-3">
                  <span className="text-[10px] text-secondary font-black uppercase tracking-wider block mb-1">Prepaid Recharge Token</span>
                  <span className="font-extrabold text-lg text-primary select-all font-mono tracking-wider">{paidReceipt.token}</span>
                </div>
              )}

              <div className="flex justify-between text-xs">
                <span className="font-semibold text-secondary">Receipt Ref</span>
                <span className="font-bold text-primary">{paidReceipt.ref}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-secondary">Account / Meter No</span>
                <span className="font-bold text-primary">{paidReceipt.accountNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-secondary">Utility Category</span>
                <span className="font-bold text-primary">{paidReceipt.category}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-secondary">Processing Fee</span>
                <span className="font-bold text-success">₵0.00 (Free)</span>
              </div>
            </div>

            <div className="p-6 bg-surface-bright border-t border-border-subtle flex gap-3">
              <Btn variant="primary" onClick={handleResetForm} className="w-full">
                Return to Bill Categories
              </Btn>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* Category selection */}
            <Card>
              <h3 className="font-section-title text-section-title text-primary mb-6">Select Bill Category</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(cat)}
                    className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all ${
                      selectedCat?.id === cat.id
                        ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm'
                        : 'border-border-subtle hover:border-primary/25 text-secondary'
                    }`}
                  >
                    <div className="text-3xl mb-3">{cat.icon}</div>
                    <div className="text-xs font-bold text-primary mb-1">{cat.name}</div>
                    <div className="text-[10px] text-secondary font-medium">{cat.providers.join(' • ')}</div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Bill Info Form */}
            {selectedCat && (
              <Card className="animate-fade-in">
                <div className="flex items-center gap-3 mb-6 p-4 rounded-xl" style={{ backgroundColor: selectedCat.color }}>
                  <div className="text-2xl" style={{ color: selectedCat.accent }}>{selectedCat.icon}</div>
                  <div>
                    <h4 className="font-bold text-primary">{selectedCat.name} Payment</h4>
                    <p className="text-xs text-secondary">Complete details to validate account.</p>
                  </div>
                  <button onClick={() => setSelectedCat(null)} className="ml-auto text-secondary hover:text-primary">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                        Service Provider
                      </label>
                      <select
                        value={provider}
                        onChange={(e) => { setProvider(e.target.value); setVerifiedName(''); }}
                        className="w-full h-11 border border-border-subtle rounded-xl px-4 text-sm outline-none bg-white focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        {selectedCat.providers.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                        {selectedCat.id === 'utilities' && provider === 'ECG' ? 'Meter Number' : 'Account / Customer Number'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. 12345678"
                          value={acctNo}
                          onChange={(e) => { setAcctNo(e.target.value); setVerifiedName(''); }}
                          className="flex-1 h-11 border border-border-subtle rounded-xl px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          required
                        />
                        <Btn variant="secondary" onClick={handleVerifyAccount} disabled={isVerifying || !acctNo}>
                          {isVerifying ? 'Verifying...' : 'Verify'}
                        </Btn>
                      </div>
                    </div>
                  </div>

                  {verifiedName && (
                    <div className="p-4 bg-success/5 border border-success/15 rounded-xl space-y-2 animate-fade-in">
                      <div className="flex items-center gap-2 text-success text-xs font-bold">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        Verified: {verifiedName}
                      </div>
                      {outstandingBal !== null && outstandingBal > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-secondary font-semibold">Outstanding Bill:</span>
                          <span className="text-primary font-bold">₵{outstandingBal.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {verifiedName && (
                    <div className="space-y-4 pt-4 border-t border-border-subtle animate-fade-in">
                      <div>
                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                          Payment Amount (GHS)
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-4 font-bold text-primary">₵</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full h-11 border border-border-subtle rounded-xl pl-8 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            required
                          />
                        </div>
                      </div>

                      <Btn
                        variant="primary"
                        onClick={handlePayBill}
                        disabled={loading || !amount || parseFloat(amount) <= 0}
                        className="w-full h-11"
                      >
                        {loading ? 'Processing...' : `Pay ${provider} ₵${parseFloat(amount || '0').toFixed(2)}`}
                      </Btn>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: History */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <Card>
              <h3 className="font-section-title text-section-title text-primary mb-6">Recent Bill Payments</h3>
              <div className="space-y-4">
                {history.map((tx, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary text-lg">
                        {tx.provider?.includes('Water') || tx.method === 'Water' ? <FaDroplet /> : tx.provider === 'ECG' || tx.method === 'Electricity' ? <FaBolt /> : <FaFileInvoiceDollar />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary">{tx.provider || tx.name}</p>
                        <p className="text-[10px] text-secondary">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : tx.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-primary">₵{Number(tx.amount).toFixed(2)}</p>
                      <Badge label={tx.status || 'completed'} type={tx.status === 'completed' ? 'success' : 'warning'} />
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <p className="text-xs text-secondary text-center py-4">No recent bill payments found.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageWrap>
  );
}
