'use client';

import { useState } from 'react';
import T from '@/lib/tokens';
import { formatCurrency, getInitials } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { PageWrap, SectionTitle, Divider } from '@/components/ui/Layout';
import {
  FaFileExport, FaMagnifyingGlass, FaXmark
} from 'react-icons/fa6';

/* ── Mock Users ─────────────────────────────────────────── */
type UserStatus = 'active' | 'suspended' | 'pending';

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  tier: number;
  status: UserStatus;
  balance: number;
  joined: string;
  txCount: number;
  location: string;
}

const USERS: AdminUser[] = [
  { id: 'USR-0001', name: 'Kwame Mensah',    phone: '0244 567 890', email: 'kwame.m@gmail.com',    tier: 2, status: 'active',    balance: 3240.50, joined: '12 Jan 2025', txCount: 148, location: 'Accra, Greater Accra' },
  { id: 'USR-0002', name: 'Abena Asante',    phone: '0201 234 567', email: 'abena.asante@yahoo.com',  tier: 1, status: 'active',    balance: 890.00,  joined: '03 Mar 2025', txCount: 42,  location: 'Kumasi, Ashanti' },
  { id: 'USR-0003', name: 'Yaw Darko',       phone: '0277 890 123', email: 'yaw.darko@outlook.com',   tier: 2, status: 'suspended', balance: 0,       joined: '19 Nov 2024', txCount: 211, location: 'Takoradi, Western' },
  { id: 'USR-0004', name: 'Ama Atta',        phone: '0244 111 222', email: 'ama.atta@gmail.com',       tier: 1, status: 'active',    balance: 1560.75, joined: '28 Feb 2025', txCount: 67,  location: 'Tema, Greater Accra' },
  { id: 'USR-0005', name: 'Kofi Boateng',    phone: '0554 321 000', email: 'kboateng@corp.gh',         tier: 3, status: 'active',    balance: 18450.00,joined: '05 Sep 2024', txCount: 892, location: 'Accra, Greater Accra' },
  { id: 'USR-0006', name: 'Akosua Owusu',    phone: '0209 876 543', email: 'akosua.o@gmail.com',       tier: 1, status: 'pending',   balance: 0,       joined: '01 Jul 2026', txCount: 0,   location: 'Cape Coast, Central' },
  { id: 'USR-0007', name: 'Nana Adjei',      phone: '0265 443 210', email: 'nana.adjei@icloud.com',    tier: 2, status: 'active',    balance: 5720.00, joined: '14 Jun 2025', txCount: 334, location: 'Accra, Greater Accra' },
  { id: 'USR-0008', name: 'Efua Mensah',     phone: '0248 765 432', email: 'efua.m@hotmail.com',       tier: 1, status: 'active',    balance: 215.50,  joined: '22 Apr 2026', txCount: 18,  location: 'Sunyani, Bono' },
];

const STATUS_FILTERS = ['All', 'Active', 'Suspended', 'Pending'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

/* ── Helpers ────────────────────────────────────────────── */
function statusBadge(s: UserStatus) {
  const map: Record<UserStatus, 'success' | 'error' | 'warning'> = {
    active: 'success', suspended: 'error', pending: 'warning',
  };
  return <Badge label={s.charAt(0).toUpperCase() + s.slice(1)} type={map[s]} />;
}

function tierLabel(t: number) {
  return <Badge label={`Tier ${t}`} type={t === 3 ? 'gold' : t === 2 ? 'info' : 'default'} />;
}

/* ── Detail Panel ───────────────────────────────────────── */
function UserDetailPanel({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: 400, height: '100vh',
      background: T.white, borderLeft: `1px solid ${T.border}`,
      boxShadow: '-4px 0 24px rgba(2,2,89,0.12)',
      zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: T.navy,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>User Profile</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{user.id}</div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: 8, color: '#fff', cursor: 'pointer',
          width: 32, height: 32, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><FaXmark /></button>
      </div>

      <div style={{ padding: 24 }}>
        {/* Avatar + Name */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 9999,
            background: `linear-gradient(135deg, ${T.adminAccent} 0%, ${T.navyMid} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 auto 12px',
          }}>
            {getInitials(user.name)}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{user.name}</div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{user.email}</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'center' }}>
            {statusBadge(user.status)}
            {tierLabel(user.tier)}
          </div>
        </div>

        <Divider />

        {/* Details Grid */}
        {[
          ['Phone', user.phone],
          ['Location', user.location],
          ['Joined', user.joined],
          ['Transactions', `${user.txCount} total`],
          ['Balance', formatCurrency(user.balance)],
        ].map(([k, v]) => (
          <div key={k} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '10px 0', borderBottom: `1px solid ${T.surfaceLow}`,
          }}>
            <span style={{ fontSize: 13, color: T.textMuted, fontWeight: 600 }}>{k}</span>
            <span style={{ fontSize: 13, color: T.textPrimary, fontWeight: 600 }}>{v}</span>
          </div>
        ))}

        <Divider />

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn variant="admin" style={{ justifyContent: 'center' }}>View Full Transaction History</Btn>
          {user.status === 'active' ? (
            <Btn variant="danger" style={{ justifyContent: 'center' }}>Suspend Account</Btn>
          ) : (
            <Btn variant="success" style={{ justifyContent: 'center' }}>Reactivate Account</Btn>
          )}
          <Btn variant="ghost" style={{ justifyContent: 'center', color: T.warning }}>Send Warning Notice</Btn>
          <Btn variant="ghost" style={{ justifyContent: 'center', color: T.textMuted }}>Export User Data</Btn>
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const filtered = USERS.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase())
      || u.phone.includes(search)
      || u.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All'
      || u.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <PageWrap
      title="User Management"
      subtitle={`${USERS.length} total registered users`}
      breadcrumb="Admin / Users"
      action={
        <Btn variant="admin" icon={<FaFileExport />}>Export Users</Btn>
      }
    >
      {/* ── Stats Row ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Users', value: '48,291', color: T.navy },
          { label: 'Active', value: '39,814', color: T.success },
          { label: 'Suspended', value: '1,204', color: T.error },
          { label: 'Pending KYC', value: '7,273', color: T.warning },
        ].map((s) => (
          <Card key={s.label} style={{ flex: 1, minWidth: 140, padding: 16 }}>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* ── Search + Filter ── */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Input
              placeholder="Search by name, phone, or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<FaMagnifyingGlass />}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUS_FILTERS.map((f) => (
              <button key={f} onClick={() => setStatusFilter(f)} style={{
                padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: statusFilter === f ? T.adminAccent : T.surfaceLow,
                color: statusFilter === f ? '#fff' : T.textSec,
                transition: 'all 0.15s',
              }}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Table ── */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <SectionTitle action={
          <span style={{ fontSize: 13, color: T.textMuted }}>{filtered.length} results</span>
        }>
          <div style={{ padding: '20px 20px 0' }}>User List</div>
        </SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.surfaceLow, borderBottom: `2px solid ${T.border}` }}>
                {['ID', 'Name', 'Phone', 'Tier', 'Status', 'Balance', 'Joined', 'Actions'].map((h) => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: T.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="trow"
                  onClick={() => setSelectedUser(user)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = T.tableHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}
                >
                  <td style={{ padding: '14px 16px', fontSize: 12, color: T.textMuted, fontFamily: 'monospace' }}>{user.id}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 9999, flexShrink: 0,
                        background: `linear-gradient(135deg, ${T.adminAccent}22 0%, ${T.navyMid}22 100%)`,
                        border: `2px solid ${T.adminAccent}33`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: T.adminAccent, fontSize: 12, fontWeight: 700,
                      }}>
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{user.name}</div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: T.textSec }}>{user.phone}</td>
                  <td style={{ padding: '14px 16px' }}>{tierLabel(user.tier)}</td>
                  <td style={{ padding: '14px 16px' }}>{statusBadge(user.status)}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: T.navy }}>{formatCurrency(user.balance)}</td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>{user.joined}</td>
                  <td style={{ padding: '14px 16px' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn variant="admin" size="sm" onClick={() => setSelectedUser(user)}>View</Btn>
                      {user.status === 'active'
                        ? <Btn variant="danger" size="sm">Suspend</Btn>
                        : <Btn variant="success" size="sm">Restore</Btn>
                      }
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Detail Panel ── */}
      {selectedUser && (
        <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </PageWrap>
  );
}
