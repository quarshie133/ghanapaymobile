/* eslint-disable */
'use client';
import React, { useState, useEffect } from 'react';
import { formatCurrency, getInitials } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { PageWrap } from '@/components/ui/Layout';
import Modal from '@/components/ui/Modal';

// Mock list of recent recipients for user convenience
const RECENT_RECIPIENTS = [
  { name: 'Ama Asantewaa', phone: '0244987654', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApoE9jEgVO_FQtoPnQtVz_SOXERq-wnaNX-62aXnmBbwV0ElX1zLCd2NLgwlnrNGUVvap2EcUfM4M0IW1CQSaPW8AzpNf13EtD80sfU10JKMZyJIKQqAmvigrcqqrQGhTFOA93F1tf7LwNjYiGDbxRw8g2Fc3ofib8M5wxHb8Uv_1SH6Il1pn8HcJeZSPkbIYQaiMuwjS6bNTUxc92el47XSAj_BhS5P8u0U1ViCSGgWz69G2IlV8UvffONJq14Me8ZlMEgDHNI8c' },
  { name: 'Kwame Simple', phone: '0244123456', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBujRCz1eZjyxfzbyxP1eJVYyWTsBe2kFO-dXRlHjkRMVOSDOja6dAX9rbndWrZvzOxH9OfijEPFuwi8ooVql_uUBL3gk9lRWB2KomD21cduFtV06Pmiviz2fFcErOGW8FfHrlt7tE5N2p442q33C0en1vFioDEIMu3qLG6oHBCGJiUNYEMgca7Ya4w7gfy1ZxYRV8bLepUO_POHZPeEZ_EanTqnCMAwRQ_xtS5DYT9F0K7fGOCMY4GSIi9YUf7iIFRN-SGg6Dw55Y' },
  { name: 'Test User', phone: '0244000001', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNnRB2JhkuMxyn4rhfWFQxSswVPsZdv_G_drmAS2Zdv50_S0tFx_tqn--mM_SJYuxvpif7zQRIp1jYSHPt-AnxLxMTkngWKZfxLms_emQHqQV9zFELmclK7oGbUEFnsUSv4cyRgyBgWS_ktWDJZkhT8JHGC-7-GnBYIhAubFZVmFsgYKTFuYuq7wvKO423kucuOjlDiJT6dp-mYURY26ATQrsml5VnXAakaQh-P3YIfbIB_z4Oomog-cipk0Xx71MzT6ouH_8YeP8' },
];

export default function SendMoneyPage() {
  const { user } = useAuth();
  
  // Tab states: 'personal' (Send Money), 'merchant' (Merchant Pay), 'qr' (QR Payments)
  const [activeTab, setActiveTab] = useState<'personal' | 'merchant' | 'qr'>('personal');

  // Shared wallet & limits profile data
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [dailySent, setDailySent] = useState<number>(0);
  const [dailyLimit, setDailyLimit] = useState<number>(1000);
  
  // Form input states
  const [transferMethod, setTransferMethod] = useState<'ghanapay' | 'mtn' | 'voda' | 'bank'>('ghanapay');
  const [phone, setPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [tillNumber, setTillNumber] = useState('');

  // Flow & UI states
  const [step, setStep] = useState<1 | 2>(1); // 1 = input, 2 = review
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']); // 6-digit transaction PIN
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successReceipt, setSuccessReceipt] = useState<any>(null);
  
  // Verification states
  const [isVerifyingRecipient, setIsVerifyingRecipient] = useState(false);
  const [recipientVerified, setRecipientVerified] = useState(false);
  
  // QR simulation states
  const [qrSubTab, setQrSubTab] = useState<'scan' | 'my-qr'>('scan');
  const [qrScanning, setQrScanning] = useState(false);

  // Load latest wallet balance & limits from backend
  const fetchWalletProfile = async () => {
    try {
      const res = await api.get('/user/me');
      if (res) {
        setProfile(res);
        setBalance(Number(res.wallet?.balance || 0));
        setDailySent(Number(res.wallet?.dailySent || 0));
        setDailyLimit(Number(res.limits?.dailyLimit || 1000));
      }
    } catch (err) {
      console.error('Failed to load wallet profile', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWalletProfile();
    }
  }, [user]);

  // Recipient phone number verification
  const handleVerifyRecipient = async () => {
    if (!phone || phone.length < 5) return;
    setIsVerifyingRecipient(true);
    setErrorMsg('');
    setRecipientVerified(false);
    setRecipientName('');

    try {
      if (transferMethod === 'ghanapay') {
        const result = await api.get(`/user/lookup?phone=${phone}`);
        if (result) {
          setRecipientName(result.name);
          setRecipientVerified(true);
        }
      } else {
        // Simulate external network MoMo/Bank name lookup validation
        await new Promise((resolve) => setTimeout(resolve, 800));
        const matched = RECENT_RECIPIENTS.find(r => r.phone === phone);
        const randomName = matched ? matched.name : 'Kwame Kinaata (Verified)';
        setRecipientName(randomName);
        setRecipientVerified(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Recipient not found on GhanaPay.');
    } finally {
      setIsVerifyingRecipient(false);
    }
  };

  // Merchant Till Number validation
  const handleVerifyMerchant = async () => {
    if (!tillNumber || tillNumber.length < 5) return;
    setIsVerifyingRecipient(true);
    setErrorMsg('');
    setRecipientVerified(false);
    setRecipientName('');

    try {
      // Lookup merchant using user lookup API since merchants are seeded as users
      const result = await api.get(`/user/lookup?phone=${tillNumber}`);
      if (result) {
        setRecipientName(result.name);
        setRecipientVerified(true);
      }
    } catch (err: any) {
      setErrorMsg('Invalid Merchant Till Number. Please check and try again.');
    } finally {
      setIsVerifyingRecipient(false);
    }
  };

  // Fee calculation rules
  const numAmount = parseFloat(amount || '0');
  const fee = transferMethod === 'ghanapay' && activeTab === 'personal'
    ? 0 
    : activeTab === 'merchant'
      ? 0
      : numAmount > 100 ? numAmount * 0.01 : 1.20; // 1% for MoMo/Bank, free for GhanaPay/Merchants
  const totalOutflow = numAmount + fee;

  // Handles confirmation continue
  const handleContinueToReview = () => {
    setErrorMsg('');
    if (totalOutflow > balance) {
      setErrorMsg('Insufficient wallet balance.');
      return;
    }
    const projectedDailyTotal = dailySent + numAmount;
    if (projectedDailyTotal > dailyLimit) {
      setErrorMsg(`Daily limit exceeded. Remaining limit: ₵${(dailyLimit - dailySent).toFixed(2)}`);
      return;
    }
    setStep(2);
  };

  // Handle final submission transaction execution
  const handleExecutePayment = async () => {
    const pinString = pinDigits.join('');
    if (pinString.length < 4) {
      setErrorMsg('Please enter a valid PIN.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      let txResult: any;

      if (activeTab === 'personal') {
        txResult = await api.post('/transactions/transfers', {
          amount: numAmount,
          recipientPhone: phone,
          note: note || 'GhanaPay Transfer',
        });
      } else if (activeTab === 'merchant' || activeTab === 'qr') {
        // Execute transfer to merchant/QR terminal
        txResult = await api.post('/transactions/transfers', {
          amount: numAmount,
          recipientPhone: phone || tillNumber,
          note: note || `Merchant Pay Till #${phone || tillNumber}`,
        });
      }

      setSuccessReceipt({
        ref: txResult?.ref || `GHP-${Date.now().toString().slice(-8)}`,
        date: txResult?.createdAt ? new Date(txResult.createdAt).toLocaleString() : new Date().toLocaleString(),
        recipientName: recipientName,
        recipientPhone: phone || tillNumber,
        amount: numAmount,
        fee: fee,
        total: totalOutflow,
        note: note || 'None',
        type: activeTab === 'personal' ? 'Send Money' : 'Merchant Payment',
      });

      // Refresh balance and reset PIN digits
      fetchWalletProfile();
      setShowPinModal(false);
      setPinDigits(['', '', '', '', '', '']);
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment execution failed.');
      setShowPinModal(false);
      setPinDigits(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  // Reset page flow
  const handleReset = () => {
    setPhone('');
    setRecipientName('');
    setAmount('');
    setNote('');
    setTillNumber('');
    setRecipientVerified(false);
    setSuccessReceipt(null);
    setStep(1);
    setErrorMsg('');
  };

  // Simulate scanning a dynamic GHQR
  const handleSimulateScan = async (selectedMerchant: { name: string; id: string; amount?: string }) => {
    setQrScanning(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setQrScanning(false);
    
    if (selectedMerchant.id.length === 6) {
      // Merchant Till Number
      setTillNumber(selectedMerchant.id);
      setPhone(selectedMerchant.id);
    } else {
      // Phone Number
      setPhone(selectedMerchant.id);
    }

    setRecipientName(selectedMerchant.name);
    setRecipientVerified(true);
    if (selectedMerchant.amount) {
      setAmount(selectedMerchant.amount);
    }
  };

  return (
    <PageWrap
      title="Payments & Transfers"
      subtitle="Transfer funds, scan QR codes, and pay merchants instantly."
      breadcrumb="Payments"
    >
      <div className="flex border-b border-border-subtle gap-4 mb-6">
        <button
          onClick={() => { setActiveTab('personal'); handleReset(); }}
          className={`pb-3 font-semibold text-sm transition-all focus:outline-none flex items-center gap-2 border-b-2 ${
            activeTab === 'personal' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
          Send Money
        </button>
        <button
          onClick={() => { setActiveTab('merchant'); handleReset(); }}
          className={`pb-3 font-semibold text-sm transition-all focus:outline-none flex items-center gap-2 border-b-2 ${
            activeTab === 'merchant' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">storefront</span>
          Merchant Pay
        </button>
        <button
          onClick={() => { setActiveTab('qr'); handleReset(); }}
          className={`pb-3 font-semibold text-sm transition-all focus:outline-none flex items-center gap-2 border-b-2 ${
            activeTab === 'qr' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
          QR Payment
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-error-container text-error rounded-xl font-semibold text-sm flex items-center gap-2 animate-pulse">
          <span className="material-symbols-outlined text-[20px]">warning</span>
          {errorMsg}
        </div>
      )}

      {successReceipt ? (
        /* PREMIUM TRANSACTION RECEIPT */
        <div className="max-w-md mx-auto py-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-3xl shadow-xl overflow-hidden relative">
            <div className="absolute left-1/2 -top-10 -translate-x-1/2 w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success border border-success/20">
              <span className="material-symbols-outlined text-4xl font-bold">check</span>
            </div>
            
            <div className="p-8 pt-14 text-center">
              <span className="text-[11px] font-black text-success uppercase tracking-widest bg-success/10 px-3 py-1 rounded-full">
                Transaction Completed
              </span>
              <h2 className="text-3xl font-black text-primary mt-4">
                ₵{successReceipt.amount.toFixed(2)}
              </h2>
              <p className="text-secondary text-xs mt-1">Fee: ₵{successReceipt.fee.toFixed(2)} • Paid via GhanaPay</p>
            </div>

            {/* Receipt Details Panel */}
            <div className="px-8 pb-8 space-y-4">
              <div className="h-px bg-dashed border-t border-border-subtle w-full my-2"></div>
              
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-secondary">Receipt Ref</span>
                <span className="font-extrabold text-primary select-all">{successReceipt.ref}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-secondary">Date & Time</span>
                <span className="font-bold text-primary">{successReceipt.date}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-secondary">Payment Type</span>
                <span className="font-bold text-primary">{successReceipt.type}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-secondary">Recipient</span>
                <span className="font-bold text-primary">{successReceipt.recipientName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-secondary">Recipient Account</span>
                <span className="font-bold text-primary">{successReceipt.recipientPhone}</span>
              </div>
              {successReceipt.note !== 'None' && (
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-secondary">Note</span>
                  <span className="font-bold text-primary italic">"{successReceipt.note}"</span>
                </div>
              )}

              <div className="h-px bg-dashed border-t border-border-subtle w-full my-2"></div>
              
              <div className="flex justify-between items-center text-sm pt-2">
                <span className="font-bold text-primary">Total Paid</span>
                <span className="font-extrabold text-xl text-primary">₵{successReceipt.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Receipt Actions */}
            <div className="p-6 bg-surface-bright border-t border-border-subtle flex gap-3">
              <Btn variant="secondary" onClick={() => window.print()} className="flex-1 text-xs">
                <span className="material-symbols-outlined text-[16px] mr-1">print</span>
                Print Receipt
              </Btn>
              <Btn variant="primary" onClick={handleReset} className="flex-2 text-xs">
                Make Another Payment
              </Btn>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Transaction Forms */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            <Card>
              {activeTab === 'personal' && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">person_add</span>
                    </div>
                    <h3 className="font-section-title text-section-title text-primary">Recipient Details</h3>
                  </div>

                  {/* Method Selector */}
                  <div className="mb-6">
                    <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-3">
                      Transfer Network Provider
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button
                        onClick={() => { setTransferMethod('ghanapay'); setRecipientVerified(false); }}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                          transferMethod === 'ghanapay' ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-border-subtle text-secondary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">account_balance</span>
                        <span className="text-[11px]">GhanaPay</span>
                      </button>
                      <button
                        onClick={() => { setTransferMethod('mtn'); setRecipientVerified(false); }}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                          transferMethod === 'mtn' ? 'border-primary bg-yellow-400/10 text-primary font-bold' : 'border-border-subtle text-secondary'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center font-black text-[8px] text-black">MTN</div>
                        <span className="text-[11px]">MTN MoMo</span>
                      </button>
                      <button
                        onClick={() => { setTransferMethod('voda'); setRecipientVerified(false); }}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                          transferMethod === 'voda' ? 'border-primary bg-red-600/10 text-primary font-bold' : 'border-border-subtle text-secondary'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center font-black text-[8px] text-white">VODA</div>
                        <span className="text-[11px]">Telecel Cash</span>
                      </button>
                      <button
                        onClick={() => { setTransferMethod('bank'); setRecipientVerified(false); }}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                          transferMethod === 'bank' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border-subtle text-secondary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">account_balance</span>
                        <span className="text-[11px]">Local Bank</span>
                      </button>
                    </div>
                  </div>

                  {/* Recipient Input */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-2">
                        Recipient Account Number / Phone
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder={transferMethod === 'bank' ? 'Enter Bank Account' : 'e.g. 0244123456'}
                            value={phone}
                            onChange={(e) => { setPhone(e.target.value); setRecipientVerified(false); }}
                            disabled={step === 2}
                            className="w-full h-11 rounded-lg border border-border-subtle px-4 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-surface-container-low"
                          />
                        </div>
                        {step === 1 && (
                          <Btn
                            onClick={handleVerifyRecipient}
                            disabled={isVerifyingRecipient || !phone}
                            variant="secondary"
                            className="px-6 text-sm"
                          >
                            {isVerifyingRecipient ? 'Verifying...' : 'Verify'}
                          </Btn>
                        )}
                      </div>
                    </div>

                    {/* Verified Status Card */}
                    {recipientVerified && (
                      <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-2.5 rounded-lg border border-success/20 w-fit animate-fade-in">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        <span className="text-[12px] font-extrabold">{recipientName}</span>
                      </div>
                    )}
                  </div>

                  {/* Recent Contacts Shortcut */}
                  {step === 1 && (
                    <div className="mt-6">
                      <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-3">
                        Recent Recipients
                      </label>
                      <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                        {RECENT_RECIPIENTS.map((r, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setPhone(r.phone);
                              setRecipientName(r.name);
                              setRecipientVerified(true);
                            }}
                            className="flex-shrink-0 flex flex-col items-center gap-1.5 group focus:outline-none"
                          >
                            <div className="w-12 h-12 rounded-full border border-primary/20 p-0.5 group-hover:border-primary transition-all">
                              <img className="w-full h-full object-cover rounded-full" src={r.avatar} alt={r.name} />
                            </div>
                            <span className="text-[10px] font-bold text-secondary group-hover:text-primary">
                              {r.name.split(' ')[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'merchant' && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">storefront</span>
                    </div>
                    <h3 className="font-section-title text-section-title text-primary">Merchant Till Validation</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-2">
                        6-Digit Till Number / Merchant ID
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. 778899 or 112233"
                          value={tillNumber}
                          onChange={(e) => { setTillNumber(e.target.value); setRecipientVerified(false); }}
                          disabled={step === 2}
                          className="flex-1 h-11 rounded-lg border border-border-subtle px-4 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:bg-surface-container-low"
                        />
                        {step === 1 && (
                          <Btn
                            onClick={handleVerifyMerchant}
                            disabled={isVerifyingRecipient || !tillNumber}
                            variant="secondary"
                            className="px-6 text-sm"
                          >
                            {isVerifyingRecipient ? 'Validating...' : 'Validate Till'}
                          </Btn>
                        )}
                      </div>
                    </div>

                    {recipientVerified && (
                      <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-2.5 rounded-lg border border-success/20 w-fit">
                        <span className="material-symbols-outlined text-[18px]">store</span>
                        <span className="text-[12px] font-extrabold">{recipientName} (Verified Merchant)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'qr' && (
                <div>
                  <div className="flex border-b border-border-subtle mb-6 gap-4">
                    <button
                      onClick={() => setQrSubTab('scan')}
                      className={`pb-2 text-xs font-bold border-b-2 focus:outline-none ${
                        qrSubTab === 'scan' ? 'border-primary text-primary' : 'border-transparent text-secondary'
                      }`}
                    >
                      Scan QR Code
                    </button>
                    <button
                      onClick={() => setQrSubTab('my-qr')}
                      className={`pb-2 text-xs font-bold border-b-2 focus:outline-none ${
                        qrSubTab === 'my-qr' ? 'border-primary text-primary' : 'border-transparent text-secondary'
                      }`}
                    >
                      My QR Code
                    </button>
                  </div>

                  {qrSubTab === 'scan' ? (
                    <div className="space-y-6">
                      {/* Visual QR Scanner Mockup */}
                      <div className="bg-neutral-900 aspect-video rounded-2xl relative overflow-hidden flex flex-col items-center justify-center p-6 text-white border border-neutral-800">
                        {qrScanning ? (
                          <div className="text-center space-y-3 z-10">
                            <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
                            <p className="text-xs font-semibold text-neutral-400">Decoding GHQR standards payload...</p>
                          </div>
                        ) : (
                          <>
                            {/* Scanning boundary frame lines */}
                            <div className="absolute w-48 h-48 border-2 border-dashed border-white/40 rounded-xl flex items-center justify-center">
                              {/* Scanning red laser line */}
                              <div className="absolute w-full h-0.5 bg-red-500 shadow-md shadow-red-500 top-0 animate-bounce"></div>
                            </div>
                            <div className="absolute bottom-4 text-center">
                              <span className="material-symbols-outlined text-neutral-400 text-lg">videocam</span>
                              <p className="text-[10px] text-neutral-400 mt-1">Center the merchant QR code in the frame</p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Demo Simulate Scanning Buttons */}
                      <div>
                        <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-2">
                          Quick-Scan Simulation (Select Merchant QR code)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            onClick={() => handleSimulateScan({ name: "Kofi's Grocery Store", id: "778899", amount: "45.00" })}
                            className="p-2 border border-border-subtle hover:border-primary rounded-lg text-xs font-semibold text-primary bg-surface text-left flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">qr_code_2</span>
                            Scan Kofi's Grocery (₵45)
                          </button>
                          <button
                            onClick={() => handleSimulateScan({ name: "Accra Shopping Mall", id: "112233", amount: "125.00" })}
                            className="p-2 border border-border-subtle hover:border-primary rounded-lg text-xs font-semibold text-primary bg-surface text-left flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">qr_code_2</span>
                            Scan Accra Mall (₵125)
                          </button>
                          <button
                            onClick={() => handleSimulateScan({ name: "Ama Asantewaa", id: "0244987654", amount: "" })}
                            className="p-2 border border-border-subtle hover:border-primary rounded-lg text-xs font-semibold text-primary bg-surface text-left flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">person</span>
                            Scan Ama's Wallet QR
                          </button>
                        </div>
                      </div>

                      {recipientVerified && (
                        <div className="p-4 bg-success/5 border border-success/20 rounded-xl space-y-2">
                          <p className="text-xs text-secondary font-bold">QR Payload Decoded Successfully</p>
                          <div className="flex justify-between text-xs">
                            <span className="text-secondary">Merchant Name</span>
                            <span className="font-extrabold text-primary">{recipientName}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-secondary">Till / Account</span>
                            <span className="font-bold text-primary">{phone || tillNumber}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* USER RECEIVE QR CARD */
                    <div className="text-center p-6 space-y-6">
                      <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 inline-block">
                        <div className="bg-white p-4 rounded-xl border border-border-subtle inline-block shadow-sm">
                          {/* Styled SVG QR Code */}
                          <svg className="w-40 h-40 mx-auto text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3h6v6H3V3zm12 0h6v6h-6V3zM3 15h6v6H3v-6zm14 0h4v2h-4v-2zm2 2h2v4h-2v-4zm-2 2h2v2h-2v-2zm-2-2h2v2h-2v-2zm0-2h2v2h-2v-2zm-2 2h2v2h-2v-2zm-2-2h2v2h-2v-2zm2 4h2v2h-2v-2zm-2 0h2v2h-2v-2zm-2 2h2v2h-2v-2zM7 5H5v2h2V5zm12 0h-2v2h2V5zM7 17H5v2h2v-2z" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-primary text-base">{user?.name}</h4>
                        <p className="text-secondary text-xs mt-1">Receive code for wallet {user?.phone || 'GhanaPay'}</p>
                      </div>

                      <Btn variant="secondary" className="w-full text-xs">
                        <span className="material-symbols-outlined text-[16px] mr-1">download</span>
                        Download QR Code Image
                      </Btn>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Tip Panel */}
            <div className="bg-surface-container rounded-xl p-5 border border-border-subtle">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-tertiary">info</span>
                <div className="text-xs text-secondary leading-relaxed">
                  <strong>Validation Tip:</strong> Always make sure to verify recipients before proceeding. Standard external networks have a 1% fee, but all transfers to other GhanaPay accounts are entirely free of cost.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Amount & Outflow Review */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <h3 className="font-section-title text-section-title text-primary">Amount & Review</h3>
              </div>

              {step === 1 ? (
                /* STEP 1: AMOUNT INPUT */
                <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-2">
                      Enter Transfer Amount
                    </label>
                    <div className="relative flex items-center border-b-2 border-border-subtle focus-within:border-primary transition-all">
                      <span className="font-metric-value text-metric-value text-primary/40 mr-2">₵</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full py-3 font-metric-value text-metric-value text-primary outline-none bg-transparent placeholder:text-primary/10"
                      />
                    </div>

                    {/* Presets */}
                    <div className="flex gap-2 mt-4">
                      {['50', '100', '250', '500'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setAmount(p)}
                          className="px-3 py-1.5 rounded-full border border-border-subtle text-[11px] font-bold text-secondary hover:border-primary hover:text-primary transition-all focus:outline-none"
                        >
                          ₵{p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-2">
                      Description / Note (Optional)
                    </label>
                    <textarea
                      placeholder="e.g. Payment for lunch"
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full rounded-lg border border-border-subtle p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    ></textarea>
                  </div>

                  {/* Wallet Limits Bar */}
                  {profile && (
                    <div className="space-y-2 pt-4 border-t border-border-subtle">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-secondary">Remaining Daily Limit:</span>
                        <span className="text-primary font-bold">₵{(dailyLimit - dailySent).toFixed(2)} / ₵{dailyLimit.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (dailySent / dailyLimit) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleContinueToReview}
                    disabled={!recipientVerified || !amount || numAmount <= 0}
                    className={`w-full py-3.5 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 focus:outline-none ${
                      recipientVerified && amount && numAmount > 0
                        ? 'bg-primary text-white hover:bg-primary-container shadow-primary/20 active:scale-95 cursor-pointer'
                        : 'bg-surface-variant text-outline cursor-not-allowed'
                    }`}
                  >
                    Continue to Review
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              ) : (
                /* STEP 2: TRANSACTION REVIEW */
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-4 rounded-2xl bg-surface-container-low p-4 border border-border-subtle">
                    <div className="flex justify-between text-xs py-1.5 border-b border-border-subtle/50">
                      <span className="text-secondary font-semibold">Recipient</span>
                      <span className="font-bold text-primary">{recipientName}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5 border-b border-border-subtle/50">
                      <span className="text-secondary font-semibold">Account / Phone</span>
                      <span className="font-bold text-primary">{phone || tillNumber}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5 border-b border-border-subtle/50">
                      <span className="text-secondary font-semibold">Net amount</span>
                      <span className="font-bold text-primary">₵{numAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5 border-b border-border-subtle/50">
                      <span className="text-secondary font-semibold">Processing Fee</span>
                      <span className="font-bold text-primary">{fee === 0 ? '₵0.00 (Free)' : `₵${fee.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1.5">
                      <span className="font-bold text-primary">Total Outflow</span>
                      <span className="font-extrabold text-primary text-sm">₵{totalOutflow.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Btn variant="secondary" onClick={() => setStep(1)} className="flex-1 text-xs">
                      Back
                    </Btn>
                    <Btn variant="primary" onClick={() => setShowPinModal(true)} className="flex-2 text-xs">
                      Confirm & Send
                    </Btn>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TRANSACTION PIN VERIFICATION MODAL */}
      <Modal
        isOpen={showPinModal}
        onClose={() => { setShowPinModal(false); setPinDigits(['', '', '', '', '', '']); }}
        title="Enter Transaction PIN"
        size="sm"
      >
        <div className="text-center space-y-6">
          <p className="text-secondary text-xs -mt-2">Input your 6-digit transaction PIN to confirm the payment.</p>

          {/* PIN Inputs */}
          <div className="flex justify-center gap-2">
            {pinDigits.map((digit, idx) => (
              <input
                key={idx}
                id={`pin-input-${idx}`}
                type="password"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const value = e.target.value;
                  const newDigits = [...pinDigits];
                  newDigits[idx] = value.slice(-1);
                  setPinDigits(newDigits);

                  // Auto-focus next field
                  if (value && idx < 5) {
                    const nextField = document.getElementById(`pin-input-${idx + 1}`);
                    nextField?.focus();
                  }
                }}
                className="w-10 h-12 text-center text-lg font-black text-primary border border-border-subtle rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Btn variant="secondary" onClick={() => { setShowPinModal(false); setPinDigits(['', '', '', '', '', '']); }} className="flex-1 text-xs">
              Cancel
            </Btn>
            <Btn 
              onClick={handleExecutePayment} 
              disabled={loading || pinDigits.some(d => d === '')}
              variant="primary" 
              className="flex-1 text-xs"
            >
              {loading ? 'Processing...' : 'Verify & Send'}
            </Btn>
          </div>
        </div>
      </Modal>
    </PageWrap>
  );
}
