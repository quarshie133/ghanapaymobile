'use client';
import React, { useState } from 'react';
import T from '@/lib/tokens';
import { formatCurrency } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import { SectionTitle, Divider, PageWrap } from '@/components/ui/Layout';
import {
  FaIdCard, FaCamera, FaHouse, FaBuildingColumns, FaCircleCheck, FaLock
} from 'react-icons/fa6';

type KycStepStatus = 'done' | 'active' | 'pending';

type KycStep = {
  title: string;
  desc: string;
  status: KycStepStatus;
  icon: React.ReactNode;
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

const TIER3_STEPS: KycStep[] = [
  { title: 'Ghana Card Upload',   desc: 'Upload front & back of your Ghana National ID (NIA Card)', status: 'done',    icon: <FaIdCard /> },
  { title: 'Selfie Verification', desc: 'Take a live selfie for biometric face match',              status: 'active',  icon: <FaCamera /> },
  { title: 'Address Proof',       desc: 'Upload a utility bill or bank statement',                  status: 'pending', icon: <FaHouse /> },
  { title: 'Bank Verification',   desc: 'Link and verify a licensed Ghana bank account',            status: 'pending', icon: <FaBuildingColumns /> },
];

export default function KycPage() {
  const [steps, setSteps] = useState<KycStep[]>(TIER3_STEPS);

  function advanceStep() {
    setSteps(prev => {
      const activeIdx = prev.findIndex(s => s.status === 'active');
      if (activeIdx === -1) return prev;
      return prev.map((s, i) => {
        if (i === activeIdx)     return { ...s, status: 'done' };
        if (i === activeIdx + 1) return { ...s, status: 'active' };
        return s;
      });
    });
  }

  const doneCount = steps.filter(s => s.status === 'done').length;
  const progress  = Math.round((doneCount / steps.length) * 100);
  const activeStep = steps.find(s => s.status === 'active');

  return (
    <PageWrap title="KYC Verification" subtitle="Verify your identity to unlock higher limits and features">
      <style>{`.trow:hover { background: ${T.tableHover} !important; }`}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Current Tier Card */}
          <Card style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.navyMid})`, border: 'none', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.65, fontWeight: 600, letterSpacing: 0.5, marginBottom: 8 }}>CURRENT TIER</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>Tier 2</div>
                <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>Verified · Active since Jan 2026</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <Badge label="✓ Verified" type="success" />
                <Badge label="Ghana Card" type="gold" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {TIER2_LIMITS.map(l => (
                <div key={l.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, opacity: 0.65 }}>{l.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.gold }}>{l.value}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Tier Comparison */}
          <Card>
            <SectionTitle>Tier Comparison</SectionTitle>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.surfaceLow }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: T.textMuted, fontSize: 11 }}>Limit</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: T.navyMid, fontSize: 11 }}>Tier 2 (Current)</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: T.gold, fontSize: 11 }}>Tier 3</th>
                  </tr>
                </thead>
                <tbody>
                  {TIER2_LIMITS.map((l, i) => (
                    <tr key={l.label} className="trow" style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '12px 14px', color: T.textSec, fontWeight: 600 }}>{l.label}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: T.textPrimary }}>{l.value}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, color: T.success }}>
                        {TIER3_LIMITS[i].value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Tier 3 Upgrade Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Progress Card */}
          <Card style={{ background: T.surfaceLow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>Tier 3 Upgrade Progress</span>
              <Badge label={`${doneCount}/${steps.length} done`} type={doneCount === steps.length ? 'success' : 'info'} />
            </div>
            <div style={{ height: 10, borderRadius: 8, background: T.border }}>
              <div style={{ width: `${progress}%`, height: '100%', borderRadius: 8, background: progress === 100 ? T.success : T.navyMid, transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>{progress}% complete</div>
          </Card>

          {/* Steps */}
          <Card>
            <SectionTitle>Verification Steps</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {steps.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, padding: '16px',
                  borderRadius: 12,
                  background: step.status === 'active' ? T.sidebarActive : 'transparent',
                  border: `1.5px solid ${step.status === 'active' ? T.navyMid : step.status === 'done' ? T.successBg : T.border}`,
                  marginBottom: 4,
                }}>
                  {/* Status Circle */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: step.status === 'done' ? T.success : step.status === 'active' ? T.navyMid : T.border,
                    color: '#fff', fontSize: step.status === 'done' ? 16 : 14, fontWeight: 700,
                    transition: 'all 0.3s',
                  }}>
                    {step.status === 'done' ? '✓' : step.status === 'active' ? '●' : String(i + 1)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: step.status === 'pending' ? T.textMuted : T.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{step.icon}</span> {step.title}
                        </div>
                        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3, lineHeight: 1.5 }}>{step.desc}</div>
                      </div>
                      {step.status === 'done' && <Badge label="Done" type="success" />}
                      {step.status === 'active' && <Badge label="In Progress" type="info" />}
                      {step.status === 'pending' && <Badge label="Pending" type="default" />}
                    </div>

                    {step.status === 'active' && (
                      <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                        <Btn size="sm" variant="primary" onClick={advanceStep} style={{ flex: 1, justifyContent: 'center' }}>
                          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {step.title === 'Selfie Verification' ? <><FaCamera /> Start Camera</> : step.title === 'Ghana Card Upload' ? <><FaIdCard /> Upload ID</> : <><FaHouse /> Upload Document</>}
                          </span>
                        </Btn>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {doneCount === steps.length && (
              <div style={{ marginTop: 16, padding: 20, borderRadius: 12, background: T.successBg, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8, color: T.success, display: 'flex', justifyContent: 'center' }}><FaCircleCheck /></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.success }}>All steps complete!</div>
                <div style={{ fontSize: 13, color: T.textMuted, marginTop: 6 }}>Your application is under review (1–2 business days)</div>
              </div>
            )}
          </Card>

          {/* Security Note */}
          <Card style={{ background: T.infoBg, border: `1px solid ${T.info}33` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.info, marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
              <FaLock /> Your data is safe
            </div>
            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.7 }}>
              All documents are encrypted with AES-256 and reviewed by our compliance team. We do not share your data with third parties.
            </div>
          </Card>
        </div>
      </div>
    </PageWrap>
  );
}
