'use client';

import { useState, useEffect, useCallback } from 'react';
import T from '@/lib/tokens';
import { formatCurrency, getInitials } from '@/lib/utils';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Btn from '@/components/ui/Btn';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { PageWrap, SectionTitle, Divider } from '@/components/ui/Layout';
import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6';

/**
 * Real user directory, backed by src/lib/admin-users.ts. Previously this
 * page was a hardcoded array of 8 fake people plus fabricated summary
 * stats ("48,291 total users") that had no relationship to anything real
 * — replaced with real Firestore data and real Firebase Auth account
 * status (disabled/enabled), which is what actually gates sign-in.
 *
 * Dropped from the original mock: `location` and `txCount` fields (never
 * tracked anywhere real) and the "Pending" status filter (there was no
 * real concept behind it — account status is just enabled/disabled).
 */

type AccountStatus = 'active' | 'suspended';

interface AdminUserRow {
  uid: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  tier: number;
  balance: number | null;
  disabled: boolean;
  createdAt: any;
}

const STATUS_FILTERS = ['All', 'Active', 'Suspended'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

function statusBadge(disabled: boolean) {
  return disabled ? <Badge label="Suspended" type="error" /> : <Badge label="Active" type="success" />;
}

function tierLabel(t: number) {
  return <Badge label={`Tier ${t}`} type={t === 3 ? 'gold' : t === 2 ? 'info' : 'default'} />;
}

function formatDate(ts: any): string {
  const seconds = ts?._seconds ?? ts?.seconds;
  if (typeof seconds !== 'number') return '—';
  return new Date(seconds * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── Detail Panel ───────────────────────────────────────── */
function UserDetailPanel({
  user, onClose, onToggleStatus, busy,
}: {
  user: AdminUserRow;
  onClose: () => void;
  onToggleStatus: (uid: string, disable: boolean) => void;
  busy: boolean;
}) {
  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: 400, height: '100vh',
      background: T.white, borderLeft: `1px solid ${T.border}`,
      boxShadow: '-4px 0 24px rgba(2,2,89,0.12)',
      zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      <div style={{
        padding: '20px 24px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: T.navy,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>User Profile</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{user.uid.slice(0, 12)}…</div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: 8, color: '#fff', cursor: 'pointer',
          width: 32, height: 32, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><FaXmark /></button>
      </div>

      <div style={{ padding: 24 }}>
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
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{user.email || 'No email on file'}</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'center' }}>
            {statusBadge(user.disabled)}
            {tierLabel(user.tier)}
          </div>
        </div>

        <Divider />

        {[
          ['Phone', user.phone || '—'],
          ['Role', user.role],
          ['Joined', formatDate(user.createdAt)],
          ['Wallet Balance', user.balance != null ? formatCurrency(user.balance) : 'No wallet yet'],
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {user.disabled ? (
            <Btn variant="success" style={{ justifyContent: 'center' }} disabled={busy}
              onClick={() => onToggleStatus(user.uid, false)}>
              Reactivate Account
            </Btn>
          ) : (
            <Btn variant="danger" style={{ justifyContent: 'center' }} disabled={busy}
              onClick={() => onToggleStatus(user.uid, true)}>
              Suspend Account
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/users');
      const list: AdminUserRow[] = Array.isArray(res) ? res : res?.data || [];
      setUsers(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users. You may need administrator access.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const selected = users.find((u) => u.uid === selectedUid) || null;

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').includes(search) ||
      u.uid.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && !u.disabled) ||
      (statusFilter === 'Suspended' && u.disabled);
    return matchesSearch && matchesStatus;
  });

  async function handleToggleStatus(uid: string, disable: boolean) {
    setBusy(true);
    try {
      await api.patch(`/admin/users/${uid}/disable`, { disabled: disable });
      setSelectedUid(null);
      await loadUsers();
    } catch (err: any) {
      setError(err?.message || 'Failed to update account status.');
    } finally {
      setBusy(false);
    }
  }

  const activeCount = users.filter((u) => !u.disabled).length;
  const suspendedCount = users.filter((u) => u.disabled).length;

  return (
    <PageWrap
      title="User Management"
      subtitle={`${users.length} registered users`}
      breadcrumb="Admin / Users"
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Users', value: users.length, color: T.navy },
          { label: 'Active', value: activeCount, color: T.success },
          { label: 'Suspended', value: suspendedCount, color: T.error },
        ].map((s) => (
          <Card key={s.label} style={{ flex: 1, minWidth: 140, padding: 16 }}>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {error && (
        <div style={{ padding: 14, borderRadius: 10, background: T.errorBg, color: T.error, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

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
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <SectionTitle action={
          <span style={{ fontSize: 13, color: T.textMuted }}>{filtered.length} results</span>
        }>
          <div style={{ padding: '20px 20px 0' }}>User List</div>
        </SectionTitle>
        <div className="responsive-table-wrap" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.surfaceLow, borderBottom: `2px solid ${T.border}` }}>
                {['User', 'Phone', 'Tier', 'Status', 'Balance', 'Joined', 'Actions'].map((h) => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: T.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>Loading…</td></tr>
              )}
              {!loading && filtered.map((user) => (
                <tr
                  key={user.uid}
                  className="trow"
                  onClick={() => setSelectedUid(user.uid)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = T.tableHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
                  style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 0.1s' }}
                >
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
                        <div style={{ fontSize: 11, color: T.textMuted }}>{user.email || user.uid.slice(0, 10) + '…'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: T.textSec }}>{user.phone || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>{tierLabel(user.tier)}</td>
                  <td style={{ padding: '14px 16px' }}>{statusBadge(user.disabled)}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: T.navy }}>
                    {user.balance != null ? formatCurrency(user.balance) : '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>{formatDate(user.createdAt)}</td>
                  <td style={{ padding: '14px 16px' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn variant="admin" size="sm" onClick={() => setSelectedUid(user.uid)}>View</Btn>
                      {!user.disabled
                        ? <Btn variant="danger" size="sm" disabled={busy} onClick={() => handleToggleStatus(user.uid, true)}>Suspend</Btn>
                        : <Btn variant="success" size="sm" disabled={busy} onClick={() => handleToggleStatus(user.uid, false)}>Restore</Btn>
                      }
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && (
        <UserDetailPanel user={selected} onClose={() => setSelectedUid(null)} onToggleStatus={handleToggleStatus} busy={busy} />
      )}
    </PageWrap>
  );
}
