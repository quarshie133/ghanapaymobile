'use client';
import React, { useState } from 'react';
import T from '@/lib/tokens';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Input from '@/components/ui/Input';
import { SectionTitle, PageWrap, Divider } from '@/components/ui/Layout';
import {
  FaUser, FaLock, FaBell, FaShieldHalved
} from 'react-icons/fa6';

const TABS = ['Profile', 'Security', 'Notifications', 'Privacy'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Profile');
  const [name, setName] = useState('Abena Owusu');
  const [phone, setPhone] = useState('+233 24 567 8901');
  const [email, setEmail] = useState('abena.owusu@example.com');
  const [isEditing, setIsEditing] = useState(false);
  const [biometrics, setBiometrics] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <PageWrap title="Settings" subtitle="Manage your profile, security settings, and notifications">
      <style>{`
        .tab-btn {
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          color: ${T.textMuted};
          border: none;
          background: transparent;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .tab-btn.active {
          color: ${T.navyMid};
          border-bottom-color: ${T.navyMid};
        }
        .tab-btn:hover {
          color: ${T.navyMid};
        }
        .toggle-btn {
          width: 44px;
          height: 24px;
          border-radius: 999px;
          border: none;
          position: relative;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .toggle-circle {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          position: absolute;
          top: 3px;
          transition: left 0.2s;
        }
      `}</style>

      <div className="settings-layout" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32, alignItems: 'start' }}>
        {/* Navigation Sidebar */}
        <Card padding={12}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === tab ? T.sidebarActive : 'transparent',
                  color: activeTab === tab ? T.navyMid : T.textSec,
                  transition: 'all 0.15s',
                }}
              >
                {tab === 'Profile' && <FaUser style={{ marginRight: 6 }} />}
                {tab === 'Security' && <FaLock style={{ marginRight: 6 }} />}
                {tab === 'Notifications' && <FaBell style={{ marginRight: 6 }} />}
                {tab === 'Privacy' && <FaShieldHalved style={{ marginRight: 6 }} />}
                {tab}
              </button>
            ))}
          </div>
        </Card>

        {/* Content Area */}
        <Card padding={32}>
          {activeTab === 'Profile' && (
            <div className="fade-in">
              <SectionTitle>Profile Details</SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: T.navyMid, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 700,
                }}>
                  AO
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary }}>Abena Owusu</h3>
                  <p style={{ fontSize: 13, color: T.textMuted }}>Personal Account · Tier 2 Verified</p>
                </div>
              </div>

              <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  label="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                {isEditing ? (
                  <>
                    <Btn variant="primary" onClick={() => setIsEditing(false)}>Save Changes</Btn>
                    <Btn variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Btn>
                  </>
                ) : (
                  <Btn variant="secondary" onClick={() => setIsEditing(true)}>Edit Profile</Btn>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="fade-in">
              <SectionTitle>Security Settings</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* PIN Change */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>Change Transaction PIN</h3>
                    <p style={{ fontSize: 12, color: T.textMuted }}>Update the 4-digit PIN used for confirming transactions</p>
                  </div>
                  <Btn variant="secondary" size="sm">Update PIN</Btn>
                </div>

                <Divider />

                {/* Biometrics */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>Biometric Authentication</h3>
                    <p style={{ fontSize: 12, color: T.textMuted }}>Use fingerprint or Face ID to quickly unlock the app</p>
                  </div>
                  <button
                    className="toggle-btn"
                    onClick={() => setBiometrics(!biometrics)}
                    style={{ backgroundColor: biometrics ? T.success : T.borderVar }}
                  >
                    <div className="toggle-circle" style={{ left: biometrics ? '23px' : '3px' }} />
                  </button>
                </div>

                <Divider />

                {/* Two-Factor Auth */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>Two-Factor Authentication (2FA)</h3>
                    <p style={{ fontSize: 12, color: T.textMuted }}>Require SMS verification code on login from new devices</p>
                  </div>
                  <button
                    className="toggle-btn"
                    onClick={() => setTwoFactor(!twoFactor)}
                    style={{ backgroundColor: twoFactor ? T.success : T.borderVar }}
                  >
                    <div className="toggle-circle" style={{ left: twoFactor ? '23px' : '3px' }} />
                  </button>
                </div>

                <Divider />

                {/* Active Sessions */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, marginBottom: 12 }}>Active Sessions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { device: 'Windows PC · Chrome', location: 'Accra, Ghana', active: true },
                      { device: 'iPhone 15 Pro · Mobile App', location: 'Accra, Ghana', active: false },
                    ].map((session, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: T.surfaceLow, borderRadius: 8 }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{session.device}</span>
                          <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 8 }}>{session.location}</span>
                        </div>
                        {session.active ? (
                          <span style={{ fontSize: 12, color: T.success, fontWeight: 600 }}>Current Session</span>
                        ) : (
                          <span style={{ fontSize: 12, color: T.error, fontWeight: 600, cursor: 'pointer' }}>Revoke</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="fade-in">
              <SectionTitle>Notification Preferences</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { title: 'Email Notifications', desc: 'Receive statements and account alerts via email' },
                  { title: 'SMS Transaction Alerts', desc: 'Get text alerts for all incoming & outgoing transfers' },
                  { title: 'Push Notifications', desc: 'Receive app updates, billing reminders, and promotions' },
                  { title: 'Weekly Reports', desc: 'Receive weekly spending insights & summaries' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{item.title}</h3>
                      <p style={{ fontSize: 12, color: T.textMuted }}>{item.desc}</p>
                    </div>
                    <button
                      className="toggle-btn"
                      style={{ backgroundColor: T.success }}
                    >
                      <div className="toggle-circle" style={{ left: '23px' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Privacy' && (
            <div className="fade-in">
              <SectionTitle>Privacy & Data</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { title: 'Share Usage Analytics', desc: 'Help us improve the system by sharing anonymous usage data' },
                  { title: 'Marketing Communications', desc: 'Receive tailored promotions, bank partner offers, and discounts' },
                  { title: 'Public Directory Profile', desc: 'Allow contacts to find your account by searching your name/phone' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{item.title}</h3>
                      <p style={{ fontSize: 12, color: T.textMuted }}>{item.desc}</p>
                    </div>
                    <button
                      className="toggle-btn"
                      style={{ backgroundColor: i === 2 ? T.success : T.borderVar }}
                    >
                      <div className="toggle-circle" style={{ left: i === 2 ? '23px' : '3px' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageWrap>
  );
}
