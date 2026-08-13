# API Documentation — GhanaPay Mobile

All routes are Next.js API routes under `src/app/api/`, deployed as
Netlify serverless functions. Base path in production: your Netlify
domain (e.g., `https://your-site.netlify.app/api/...`).

**Authentication**: unless noted, every route requires an
`Authorization: Bearer <Firebase ID Token>` header. Admin-only routes
additionally require the caller's Firestore `role` to be `administrator`.

**Response shape**: `{ success: boolean, data?: ..., message?: string }`
on success; `{ success: false, message: string }` with an appropriate
HTTP status on failure (401 unauthenticated, 403 wrong role, 400 bad
input, 404 not found, 500 server error).

## Wallet

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/wallet` | User | Real balance, linked accounts, limits |
| POST | `/api/wallet` | User | Sandbox top-up (idempotency key supported) |
| GET | `/api/wallet/transactions` | User | Own transaction history, filterable by `type` |
| POST | `/api/wallet/withdraw` | User | Sandbox withdrawal |
| POST | `/api/wallet/transfer` | User | Move funds to own linked account (bookkeeping-equivalent to withdrawal) |
| POST | `/api/wallet/link-account` | User | Link a sandbox external account |
| DELETE | `/api/wallet/linked-accounts/[id]` | User (owner only) | Unlink an account |
| PUT | `/api/wallet/linked-accounts/[id]/set-default` | User (owner only) | Change default account |

## Transfers

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/transactions/transfers` | User | Real peer-to-peer transfer by recipient phone number |
| GET | `/api/transactions` | User | Recent transactions (used by `/history`, `/dashboard`) |
| GET | `/api/user/lookup?phone=` | User | Recipient name verification for send-money UI |
| GET | `/api/user/me` | User | Combined profile + wallet + limits snapshot |

## Bills & Airtime

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/bills/validate` | User | Sandbox account-name lookup (deterministic, not real biller API) |
| POST | `/api/bills/pay` | User | Real wallet debit for a bill payment |
| GET | `/api/bills/history` | User | Own bill-payment history |
| POST | `/api/airtime` | User | Real wallet debit for airtime purchase |

## KYC

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/kyc/status` | User | Own KYC record |
| POST | `/api/kyc/document` | User | Record a document submission (after client-side Storage upload) |
| GET | `/api/kyc?admin=true&status=` | Admin | Review queue |
| PATCH | `/api/kyc` | Admin | Approve/reject a submission |
| GET | `/api/kyc/document-url?uid=&stepId=` | Admin | 5-minute signed URL to view a document |

## Scheduled Payments

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET / POST | `/api/scheduled` | User | List / create scheduled payments |
| PUT / DELETE | `/api/scheduled/[id]` | User (owner only) | Update (pause/resume) / cancel |
| POST | `/api/scheduled/run` | **Shared secret header** (`x-cron-secret`), not user auth | Execute all due payments — meant to be called by the Netlify Scheduled Function |

## Notifications

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/notifications` | User | List + unread count |
| PATCH | `/api/notifications/[id]/read` | User (owner only) | Mark one as read |
| POST | `/api/notifications/read-all` | User | Mark all as read |

## Analytics

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/analytics/summary` | User | Current-month spend/income summary |
| GET | `/api/analytics/weekly` | User | 7-day spending trend |
| GET | `/api/analytics/categories` | User | Spend by real transaction type |
| GET | `/api/analytics/payment-methods` | User | Honest single-source breakdown |
| GET | `/api/analytics/savings-goals` | User | Always empty — feature not implemented |
| GET | `/api/analytics/merchant/summary` \| `/weekly` \| `/payment-methods` | User (merchant) | Same pattern, scoped to `transfer_in` as "sales" |

## Statements

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/statements` | User | Real monthly statements, running-balance reconstruction |

## User Profile

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/users/update` | User | Update own name/phone (not email — see Settings page) |

## Admin

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/users` | Admin | Real user directory with Firebase Auth status + wallet balance |
| PATCH | `/api/admin/users/[id]/disable` | Admin | Real account suspend/reactivate via Firebase Auth |
| GET | `/api/admin/transactions?type=` | Admin | Real cross-user transaction ledger |
| GET | `/api/admin/overview` | Admin | Aggregated dashboard stats, same source as detail pages |

## Deliberately removed (see Defect Log DEF-010, and Phase 16 cleanup)

`/api/auth/login`, `/api/auth/session`, `/api/auth/logout` — leftover
from a pre-Firebase custom-JWT scheme, referenced a backend that no
longer existed. Root-level `/api/bills` and `/api/users` — unauthenticated
duplicates returning fabricated data, superseded by the real routes
listed above. All five were deleted rather than left as dead/insecure
surface area.
