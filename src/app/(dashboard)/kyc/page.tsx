'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import { uploadKycDocument } from '@/lib/kyc-upload';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { SectionTitle, Divider, PageWrap } from '@/components/ui/Layout';

type KycStepStatus = 'done' | 'active' | 'pending';

type KycStep = {
  title: string;
  desc: string;
  status: KycStepStatus;
  icon: string;
};

const TIER2_LIMITS = [
  { label: 'Send per day',    value: '₵5,000'  },
  { label: 'Receive per day', value: '₵10,000' },
  { label: 'Monthly limit',   value: '₵80,000' },
  { label: 'Balance cap',     value: '₵50,000' },
];

const TIER3_LIMITS = [
  { label: 'Send per day',    value: '₵20,000'  },
  { label: 'Receive per day', value: '₵50,000'  },
  { label: 'Monthly limit',   value: '₵500,000' },
  { label: 'Balance cap',     value: 'Unlimited' },
];

type KycStepId = 'ghanaCard' | 'selfie' | 'addressProof' | 'bankVerification';

const TIER3_STEPS: (KycStep & { stepId: KycStepId })[] = [
  { stepId: 'ghanaCard',      title: 'Ghana Card Upload',   desc: 'Upload front & back of your Ghana National ID (NIA Card)', status: 'active',  icon: 'id_card' },
  { stepId: 'selfie',         title: 'Selfie Verification', desc: 'Take a live selfie for biometric face match',              status: 'pending', icon: 'photo_camera' },
  { stepId: 'addressProof',   title: 'Address Proof',       desc: 'Upload a utility bill or bank statement',                  status: 'pending', icon: 'home' },
  { stepId: 'bankVerification', title: 'Bank Verification', desc: 'Link and verify a licensed Ghana bank account (coming soon — requires linked accounts, not yet built)', status: 'pending', icon: 'account_balance' },
];

export default function KycPage() {
  const { user } = useAuth();
  const [steps, setSteps] = useState<(KycStep & { stepId: KycStepId })[]>(TIER3_STEPS);
  const [kycApplication, setKycApplication] = useState<any>(null);
  const [uploading, setUploading] = useState<KycStepId | null>(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingStepRef = useRef<KycStepId | null>(null);

  // Maps a real Firestore KycRecord (src/lib/kyc-record.ts) onto the
  // step-list UI shape this page already used.
  function applyRecordToSteps(record: any) {
    if (!record?.steps) return;
    setSteps((prev) => {
      let seenPending = false;
      return prev.map((s) => {
        if (s.stepId === 'bankVerification') {
          return { ...s, status: 'pending' }; // never actionable — see note above
        }
        const stepData = record.steps[s.stepId];
        const done = stepData?.status === 'submitted';
        if (done) return { ...s, status: 'done' };
        if (!seenPending) {
          seenPending = true;
          return { ...s, status: 'active' };
        }
        return { ...s, status: 'pending' };
      });
    });
  }

  useEffect(() => {
    if (user) {
      api.get('/kyc/status').then((res) => {
        setKycApplication(res);
        applyRecordToSteps(res);
      }).catch(() => {});
    }
  }, [user]);

  function triggerUpload(stepId: KycStepId) {
    if (stepId === 'bankVerification') return; // not wired — see step definition above
    pendingStepRef.current = stepId;
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const stepId = pendingStepRef.current;
    e.target.value = ''; // allow re-selecting the same file later
    if (!file || !stepId) return;

    setUploadError('');
    setUploading(stepId);
    try {
      const storagePath = await uploadKycDocument(stepId, file);
      const record = await api.post('/kyc/document', { stepId, storagePath });
      setKycApplication(record);
      applyRecordToSteps(record);
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  }

  const doneCount = steps.filter(s => s.status === 'done').length;
  const progress  = Math.round((doneCount / steps.length) * 100);

  return (
    <PageWrap
      title="KYC Verification"
      subtitle="Verify your identity to unlock higher limits and features"
      breadcrumb="KYC Verification"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Current Status & Comparison (Span 7) */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {/* Current Tier Card */}
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-container p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">CURRENT TIER</div>
                <div className="text-2xl font-black">Tier {user?.tier || 2}</div>
                <div className="text-xs text-white/70 mt-1">Verified • Active since Jan 2026</div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <Badge label="Verified" type="success" />
                <Badge label="Ghana Card" type="gold" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {TIER2_LIMITS.map((l, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-3.5 border border-white/5">
                  <div className="text-[11px] text-white/50">{l.label}</div>
                  <div className="text-base font-extrabold text-tertiary-fixed mt-0.5">{l.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tier Comparison */}
          <Card>
            <SectionTitle>Tier Comparison</SectionTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-surface border-b border-border-subtle text-xs">
                    <th className="px-6 py-3 font-bold text-secondary">Limit</th>
                    <th className="px-6 py-3 font-bold text-primary text-center">Tier 2 (Current)</th>
                    <th className="px-6 py-3 font-bold text-tertiary text-center">Tier 3</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-sm">
                  {TIER2_LIMITS.map((l, i) => (
                    <tr key={i} className="hover:bg-table-hover transition-colors duration-150">
                      <td className="px-6 py-3.5 text-secondary font-semibold">{l.label}</td>
                      <td className="px-6 py-3.5 text-primary text-center font-bold">{l.value}</td>
                      <td className="px-6 py-3.5 text-success text-center font-black">
                        {TIER3_LIMITS[i].value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Side: Steps & Progress (Span 5) */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* Progress Card */}
          <Card className="bg-surface-container-low">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-primary">Tier 3 Upgrade Progress</span>
              <Badge label={`${doneCount}/${steps.length} done`} type={doneCount === steps.length ? 'success' : 'info'} />
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  progress === 100 ? 'bg-success' : 'bg-primary'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-xs text-secondary mt-2">{progress}% complete</div>
          </Card>

          {/* Steps */}
          <Card>
            <SectionTitle>Verification Steps</SectionTitle>
            <div className="space-y-4">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className={`flex gap-4 p-4 rounded-xl border transition-all duration-200 ${
                    s.status === 'active'
                      ? 'border-primary bg-sidebar-active-light'
                      : s.status === 'done'
                      ? 'border-[#E5F5ED] bg-white'
                      : 'border-border-subtle bg-white'
                  }`}
                >
                  {/* Status Circle */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                      s.status === 'done'
                        ? 'bg-success text-white'
                        : s.status === 'active'
                        ? 'bg-primary text-white'
                        : 'bg-surface-container-high text-secondary border border-border-subtle'
                    }`}
                  >
                    {s.status === 'done' ? '✓' : s.status === 'active' ? '●' : String(i + 1)}
                  </div>

                  {/* Step Description */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className={`text-sm font-bold flex items-center gap-1.5 ${
                          s.status === 'pending' ? 'text-secondary/50' : 'text-primary'
                        }`}>
                          <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
                          {s.title}
                        </div>
                        <div className="text-xs text-secondary leading-relaxed mt-1">{s.desc}</div>
                      </div>
                    </div>

                    {s.status === 'active' && (
                      <div className="pt-2">
                        <Btn
                          size="sm"
                          onClick={() => triggerUpload(s.stepId)}
                          disabled={uploading === s.stepId || s.stepId === 'bankVerification'}
                          className="w-full justify-center"
                        >
                          <span className="material-symbols-outlined text-xs">
                            {s.title === 'Selfie Verification' ? 'photo_camera' : s.title === 'Ghana Card Upload' ? 'id_card' : 'upload_file'}
                          </span>
                          {uploading === s.stepId
                            ? 'Uploading...'
                            : s.stepId === 'bankVerification'
                            ? 'Coming soon'
                            : s.title === 'Selfie Verification' ? 'Upload Selfie Photo' : s.title === 'Ghana Card Upload' ? 'Upload ID Document' : 'Upload Document'}
                        </Btn>
                        {uploadError && s.stepId === pendingStepRef.current && (
                          <div className="text-xs text-error mt-1.5">{uploadError}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {doneCount === steps.length && (
              <div className="mt-6 p-5 bg-[#E5F5ED] text-[#1E8449] rounded-xl text-center">
                <span className="material-symbols-outlined text-[40px] block mb-2">check_circle</span>
                <div className="font-extrabold text-sm">All Steps Completed!</div>
                <div className="text-xs text-[#1E8449]/70 mt-1">Your verification is under review (1–2 business days)</div>
              </div>
            )}
          </Card>

          {/* Security details */}
          <div className="p-4 rounded-xl bg-[#EBF0FF] border border-primary-fixed-dim">
            <div className="flex gap-2 text-primary font-bold mb-2 items-center text-xs">
              <span className="material-symbols-outlined text-[16px]">lock</span>
              Your data is fully encrypted
            </div>
            <p className="text-xs text-primary/80 leading-relaxed font-semibold">
              Documents are stored privately in Firebase Storage (Google Cloud encrypts data at rest by default) and are never publicly accessible — only you and an administrator reviewing your submission can view them, via a short-lived access link.
            </p>
          </div>
        </div>
      </div>

      {/* Hidden file input driving all document uploads — see triggerUpload() */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileSelected}
      />
    </PageWrap>
  );
}
