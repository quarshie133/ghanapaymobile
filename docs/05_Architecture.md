# System Architecture — GhanaPay Mobile

## 1. High-level architecture

```mermaid
graph TB
    subgraph Client["Browser (Next.js Client Components)"]
        UI[React UI]
        FirebaseSDK[Firebase Client SDK<br/>Auth, Firestore, Storage]
    end

    subgraph Server["Netlify (Next.js API Routes = Serverless Functions)"]
        API[API Route Handlers]
        AdminSDK[Firebase Admin SDK]
        ServerAuth[requireAuth middleware]
    end

    subgraph Firebase["Firebase Project"]
        Auth[(Firebase Authentication)]
        Firestore[(Cloud Firestore)]
        Storage[(Firebase Storage)]
    end

    subgraph Scheduled["Netlify Scheduled Function"]
        Cron[run-scheduled-payments.mts<br/>fires every 15 min]
    end

    UI -->|Firebase ID Token| API
    UI --> FirebaseSDK
    FirebaseSDK -->|sign in/up, own-profile reads| Auth
    FirebaseSDK -->|KYC document upload only| Storage
    API --> ServerAuth
    ServerAuth -->|verifyIdToken| Auth
    API --> AdminSDK
    AdminSDK -->|atomic transactions, bypasses Security Rules| Firestore
    AdminSDK -->|signed URLs for admin KYC review| Storage
    Cron -->|POST with shared secret| API
```

**Key architectural decision**: the client Firebase SDK is used for
authentication and KYC document upload only. Every financial write
(wallet balance, transfers, KYC approval, admin actions) goes through a
Next.js API route using the Admin SDK — the client never has direct
Firestore write access to anything that matters. This is enforced both
architecturally (the client SDK simply isn't used for these writes) and
defensively (Firestore Security Rules deny client writes to those
collections even if someone tried).

## 2. Authentication flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FA as Firebase Auth (client SDK)
    participant API as Next.js API Route
    participant Admin as Admin SDK (server)

    U->>FA: signInWithEmailAndPassword() / signInWithPopup()
    FA-->>U: Firebase User + ID Token
    U->>API: Request with Authorization: Bearer token
    API->>Admin: verifyIdToken(token)
    Admin-->>API: decoded uid
    API->>Admin: get users/{uid} (for role, if admin route)
    Admin-->>API: profile role
    API-->>U: 200 (authorized) or 401/403
```

## 3. Wallet transfer sequence (atomic, server-side)

```mermaid
sequenceDiagram
    participant U as Sender (Browser)
    participant API as POST /api/transactions/transfers
    participant Lookup as server-user-lookup.ts
    participant Ledger as wallet-ledger.ts
    participant FS as Firestore Transaction

    U->>API: amount, recipientPhone, note + ID token
    API->>API: requireAuth() verifies token
    API->>Lookup: lookupUserByPhone(recipientPhone)
    Lookup-->>API: uid, name or null
    alt recipient not found
        API-->>U: 404
    else recipient found
        API->>Ledger: transferBetweenWallets(sender, recipient, amount)
        Ledger->>FS: runTransaction - read both wallets + daily usage
        FS-->>Ledger: current balances
        alt insufficient balance OR daily limit exceeded
            Ledger-->>API: throws Error
            API-->>U: 400 with reason
        else valid
            Ledger->>FS: debit sender, credit recipient, write 2 ledger entries, update daily usage (atomic)
            FS-->>Ledger: committed
            Ledger->>Ledger: notify both parties after commit, not inside transaction
            Ledger-->>API: wallet, transaction
            API-->>U: 201 success
        end
    end
```

## 4. KYC review workflow

```mermaid
sequenceDiagram
    participant U as User
    participant Storage as Firebase Storage
    participant API as Next.js API
    participant Admin as Administrator
    participant FS as Firestore

    U->>Storage: uploadBytes to kyc/uid/step.ext (client SDK, owner-only per Storage rules)
    U->>API: POST /api/kyc/document with stepId, storagePath
    API->>API: verify storagePath starts with kyc/own-uid/
    API->>FS: update kycRecords/uid (Admin SDK)
    Note over FS: status becomes pending_review once all 3 steps submitted
    Admin->>API: GET /api/kyc?admin=true&status=pending_review
    API->>FS: query kycRecords (admin role required)
    FS-->>API: pending records
    Admin->>API: GET /api/kyc/document-url?uid=&stepId=
    API->>Storage: generate signed URL, 5 min expiry, Admin SDK
    Storage-->>Admin: temporary viewable link
    Admin->>API: PATCH /api/kyc action approve or reject
    API->>FS: update kycRecords status + users/uid tier (atomic, Admin SDK)
    API->>FS: create notification for the user
```

## 5. Deployment architecture

```mermaid
graph LR
    Dev[Developer] -->|git push| GitHub
    GitHub -->|webhook| Netlify[Netlify Build]
    Netlify -->|Next.js Runtime| Functions[Serverless Functions - API routes]
    Netlify -->|static assets| CDN[Netlify CDN]
    Netlify -.->|Scheduled Function every 15min| ScheduledFn[run-scheduled-payments]
    Functions --> FirebaseProject[(Firebase Project - Auth + Firestore + Storage)]
    ScheduledFn -->|POST /api/scheduled/run| Functions
    Browser[End User Browser] --> CDN
    Browser --> Functions
```

## 6. Component/module map (real files, not aspirational)

| Layer | Files | Responsibility |
|---|---|---|
| Client Firebase config | `src/lib/firebase.ts` | Client SDK init, hardcoded working defaults + env override |
| Server Firebase config | `src/lib/firebase-admin.ts` | Admin SDK init from service-account env vars, server-only |
| Auth middleware | `src/lib/server-auth.ts` | `requireAuth()` — the single enforcement point for every protected route |
| Wallet core | `src/lib/wallet-ledger.ts` | Atomic top-up/withdraw/transfer/bill/airtime logic |
| KYC core | `src/lib/kyc-record.ts`, `src/lib/kyc-upload.ts` | Document submission, review, storage path handling |
| Scheduled payments | `src/lib/scheduled-payments.ts`, `src/lib/schedule-dates.ts` | CRUD + execution engine + pure date math |
| Statements | `src/lib/statements.ts`, `src/lib/statements-core.ts` | Firestore I/O vs. pure running-balance computation, split for testability |
| Notifications | `src/lib/notifications.ts` | Server-created in-app notifications |
| Admin aggregation | `src/lib/admin-overview.ts`, `admin-users.ts`, `admin-transactions.ts` | Dashboard stats derived from the same collections the detail pages query |
| Phone utilities | `src/lib/phone.ts` | Ghanaian phone normalization, used both client and server side |

## 7. Data flow principle: single source of truth

A recurring pattern across this codebase, adopted after a real
dashboard/detail-page mismatch bug found during development (see
`docs/PROJECT_AUDIT.md` Phase 12): any summary or aggregate view (the
admin overview dashboard, the sidebar's KYC badge count) queries the
**same underlying Firestore collections** the detail pages query, rather
than maintaining a separately-computed number. This makes the class of
bug where a summary count silently drifts from what you see on the detail
page structurally impossible, rather than something to remember to keep
in sync by hand.
