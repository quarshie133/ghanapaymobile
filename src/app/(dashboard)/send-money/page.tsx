'use client';
import React, { useState } from 'react';
import { getInitials } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { PageWrap } from '@/components/ui/Layout';

const RECENT_RECIPIENTS = [
  { name: 'Ama Asantewaa', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApoE9jEgVO_FQtoPnQtVz_SOXERq-wnaNX-62aXnmBbwV0ElX1zLCd2NLgwlnrNGUVvap2EcUfM4M0IW1CQSaPW8AzpNf13EtD80sfU10JKMZyJIKQqAmvigrcqqrQGhTFOA93F1tf7LwNjYiGDbxRw8g2Fc3ofib8M5wxHb8Uv_1SH6Il1pn8HcJeZSPkbIYQaiMuwjS6bNTUxc92el47XSAj_BhS5P8u0U1ViCSGgWz69G2IlV8UvffONJq14Me8ZlMEgDHNI8c' },
  { name: 'Ekow Dadzie', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBujRCz1eZjyxfzbyxP1eJVYyWTsBe2kFO-dXRlHjkRMVOSDOja6dAX9rbndWrZvzOxH9OfijEPFuwi8ooVql_uUBL3gk9lRWB2KomD21cduFtV06Pmiviz2fFcErOGW8FfHrlt7tE5N2p442q33C0en1vFioDEIMu3qLG6oHBCGJiUNYEMgca7Ya4w7gfy1ZxYRV8bLepUO_POHZPeEZ_EanTqnCMAwRQ_xtS5DYT9F0K7fGOCMY4GSIi9YUf7iIFRN-SGg6Dw55Y' },
  { name: 'Kofi Boakye', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNnRB2JhkuMxyn4rhfWFQxSswVPsZdv_G_drmAS2Zdv50_S0tFx_tqn--mM_SJYuxvpif7zQRIp1jYSHPt-AnxLxMTkngWKZfxLms_emQHqQV9zFELmclK7oGbUEFnsUSv4cyRgyBgWS_ktWDJZkhT8JHGC-7-GnBYIhAubFZVmFsgYKTFuYuq7wvKO423kucuOjlDiJT6dp-mYURY26ATQrsml5VnXAakaQh-P3YIfbIB_z4Oomog-cipk0Xx71MzT6ouH_8YeP8' },
];

export default function SendMoneyPage() {
  const [method, setMethod] = useState<'ghanapay' | 'mtn' | 'voda' | 'bank'>('ghanapay');
  const [phone, setPhone] = useState('0244123456');
  const [verified, setVerified] = useState(true);
  const [amount, setAmount] = useState('1250');
  const [note, setNote] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1 = input, 2 = confirmation / success
  const [sent, setSent] = useState(false);

  const numAmount = parseFloat(amount || '0');
  const fee = numAmount > 1000 ? 1.25 : 0;
  const total = numAmount + fee;

  const handleSend = () => {
    setSent(true);
  };

  const resetForm = () => {
    setSent(false);
    setStep(1);
    setAmount('');
    setNote('');
  };

  return (
    <PageWrap
      title="Send Money"
      subtitle="Transfer funds instantly to any bank or mobile wallet in Ghana."
      breadcrumb="Send Money"
    >
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Recipient */}
          <section className="col-span-12 lg:col-span-7 space-y-6">
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
                <h3 className="font-section-title text-section-title text-primary">Recipient Details</h3>
              </div>

              {/* Method Selector */}
              <div className="mb-8">
                <label className="block text-[12px] font-bold text-secondary uppercase tracking-wider mb-3">
                  Transfer Method
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setMethod('ghanapay')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      method === 'ghanapay'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border-subtle hover:border-primary/30 text-secondary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">account_balance</span>
                    <span className="text-[12px] font-bold">GhanaPay</span>
                  </button>

                  <button
                    onClick={() => setMethod('mtn')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all group ${
                      method === 'mtn'
                        ? 'border-primary bg-yellow-400/10 text-primary'
                        : 'border-border-subtle hover:border-primary/30 text-secondary'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center font-black text-[10px] text-black">
                      MTN
                    </div>
                    <span className="text-[12px] font-semibold">MTN MoMo</span>
                  </button>

                  <button
                    onClick={() => setMethod('voda')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all group ${
                      method === 'voda'
                        ? 'border-primary bg-red-600/10 text-primary'
                        : 'border-border-subtle hover:border-primary/30 text-secondary'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-black text-[10px] text-white">
                      VODA
                    </div>
                    <span className="text-[12px] font-semibold text-center">Vodafone Cash</span>
                  </button>

                  <button
                    onClick={() => setMethod('bank')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all group ${
                      method === 'bank'
                        ? 'border-primary bg-primary-fixed text-primary'
                        : 'border-border-subtle hover:border-primary/30 text-secondary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">account_balance</span>
                    <span className="text-[12px] font-semibold">Local Bank</span>
                  </button>
                </div>
              </div>

              {/* Recipient Input */}
              <div className="space-y-4">
                <div className="relative group">
                  <label className="block text-[12px] font-bold text-secondary uppercase tracking-wider mb-2" htmlFor="recipient">
                    Recipient Phone Number
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        className="w-full h-[44px] rounded-lg border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-table-cell font-medium pl-4 pr-10 outline-none"
                        id="recipient"
                        type="text"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setVerified(false);
                        }}
                      />
                      {verified && (
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-success">
                          check_circle
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setVerified(true)}
                      className="px-6 h-[44px] bg-primary text-white font-bold rounded-lg hover:bg-primary-container transition-colors focus:outline-none"
                    >
                      Verify
                    </button>
                  </div>
                </div>

                {/* Verified Chip */}
                {verified && (
                  <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-2 rounded-lg w-fit">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span className="text-[13px] font-bold">Kwame Simple (verified)</span>
                  </div>
                )}
              </div>

              {/* Recent Recipients */}
              <div className="mt-8">
                <label className="block text-[12px] font-bold text-secondary uppercase tracking-wider mb-3">
                  Recent Recipients
                </label>
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                  {RECENT_RECIPIENTS.map((r, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPhone('0244987654');
                        setVerified(true);
                      }}
                      className="flex-shrink-0 flex flex-col items-center gap-2 group focus:outline-none"
                    >
                      <div className="w-14 h-14 rounded-full border-2 border-primary/20 p-0.5 group-hover:border-primary transition-all">
                        <img className="w-full h-full object-cover rounded-full" src={r.avatar} alt={r.name} />
                      </div>
                      <span className="text-[11px] font-bold text-secondary group-hover:text-primary">
                        {r.name}
                      </span>
                    </button>
                  ))}
                  <button className="flex-shrink-0 flex flex-col items-center gap-2 group focus:outline-none">
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-border-subtle flex items-center justify-center text-secondary group-hover:text-primary transition-all">
                      <span className="material-symbols-outlined">add</span>
                    </div>
                    <span className="text-[11px] font-bold text-secondary">View More</span>
                  </button>
                </div>
              </div>
            </Card>

            {/* Security Banner */}
            <div className="bg-primary-container text-white p-6 rounded-xl relative overflow-hidden">
              <div className="relative z-10 flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">shield</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm">Secure Transfer Enabled</h4>
                  <p className="text-[12px] opacity-80">
                    This transaction is protected by GhanaPay's 256-bit encryption. Always verify recipient names before sending.
                  </p>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full"></div>
            </div>
          </section>

          {/* Right Column: Amount & Details */}
          <section className="col-span-12 lg:col-span-5 space-y-6">
            <Card className="shadow-lg">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <h3 className="font-section-title text-section-title text-primary">Amount & Details</h3>
              </div>

              {/* Large Amount Input */}
              <div className="mb-8">
                <label className="block text-[12px] font-bold text-secondary uppercase tracking-wider mb-2">
                  Enter Amount
                </label>
                <div className="relative flex items-center border-b-2 border-border-subtle focus-within:border-primary transition-all">
                  <span className="font-metric-value text-metric-value text-primary/40 mr-2">₵</span>
                  <input
                    className="w-full py-4 font-metric-value text-metric-value text-primary outline-none bg-transparent placeholder:text-primary/10"
                    placeholder="0.00"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {['50', '100', '500', '1000'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setAmount(p)}
                      className="px-4 py-1.5 rounded-full border border-border-subtle text-[12px] font-bold text-secondary hover:border-primary hover:text-primary transition-all focus:outline-none"
                    >
                      ₵{p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note Field */}
              <div className="mb-8">
                <label className="block text-[12px] font-bold text-secondary uppercase tracking-wider mb-2" htmlFor="note">
                  Note (Optional)
                </label>
                <textarea
                  className="w-full rounded-lg border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-table-cell p-4 outline-none"
                  id="note"
                  placeholder="e.g. Payment for supplies"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                ></textarea>
              </div>

              {/* Summary */}
              <div className="space-y-3 pt-6 border-t border-border-subtle">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-secondary">Processing Fee</span>
                  <span className="font-bold text-on-surface">GHS {fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-secondary">Balance After</span>
                  <span className="font-bold text-on-surface">GHS {(16000 - total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-dashed border-border-subtle">
                  <span className="font-bold text-primary">Total to Pay</span>
                  <span className="font-metric-value text-2xl text-primary">GHS {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!verified || !amount || numAmount <= 0}
                className={`w-full mt-10 py-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 focus:outline-none ${
                  verified && amount && numAmount > 0
                    ? 'bg-primary text-white hover:bg-primary-container shadow-primary/20 active:scale-95 cursor-pointer'
                    : 'bg-surface-variant text-outline cursor-not-allowed'
                }`}
              >
                Continue to Review
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </Card>

            {/* Side Tip */}
            <div className="bg-surface-container rounded-xl p-6 border border-border-subtle">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-tertiary">lightbulb</span>
                <div className="text-[12px] leading-relaxed text-on-surface-variant">
                  <strong>Pro-tip:</strong> Transfers to GhanaPay wallets are free of charge. You can save up to ₵120 monthly by switching to GhanaPay.
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-md mx-auto">
          {!sent ? (
            <Card className="shadow-lg">
              <h3 className="font-section-title text-section-title text-primary mb-6 text-center">
                Review Transaction
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm py-2 border-b border-border-subtle">
                  <span className="text-secondary">Recipient</span>
                  <span className="font-bold text-primary">Kwame Simple</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-border-subtle">
                  <span className="text-secondary">Phone Number</span>
                  <span className="font-bold text-primary">{phone}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-border-subtle">
                  <span className="text-secondary">Transfer Method</span>
                  <span className="font-bold text-primary capitalize">{method}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-border-subtle">
                  <span className="text-secondary">Amount</span>
                  <span className="font-bold text-primary">GHS {numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-border-subtle">
                  <span className="text-secondary">Fee</span>
                  <span className="font-bold text-primary">GHS {fee.toFixed(2)}</span>
                </div>
                {note && (
                  <div className="flex justify-between text-sm py-2 border-b border-border-subtle">
                    <span className="text-secondary">Note</span>
                    <span className="font-bold text-primary">{note}</span>
                  </div>
                )}
                <div className="flex justify-between text-md py-4 border-t border-dashed border-border-subtle mt-4">
                  <span className="font-bold text-primary">Total Outflow</span>
                  <span className="font-bold text-primary text-xl">GHS {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Btn variant="secondary" onClick={() => setStep(1)} className="flex-1">
                  Cancel
                </Btn>
                <Btn onClick={handleSend} className="flex-2">
                  Confirm & Send
                </Btn>
              </div>
            </Card>
          ) : (
            <Card className="text-center p-8 shadow-xl">
              <span className="material-symbols-outlined text-[64px] text-success animate-bounce block mb-4">
                check_circle
              </span>
              <h2 className="text-2xl font-bold text-primary mb-2">Transfer Successful</h2>
              <p className="text-secondary text-sm mb-6">
                Your transfer of GHS {total.toLocaleString('en-US', { minimumFractionDigits: 2 })} to Kwame Simple has been processed.
              </p>
              <Btn onClick={resetForm} className="w-full">
                Send Another Transfer
              </Btn>
            </Card>
          )}
        </div>
      )}
    </PageWrap>
  );
}
