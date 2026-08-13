# Database Security Rules — GhanaPay Mobile

The authoritative source is `firestore.rules` and `storage.rules` in the
repository root — this document explains the reasoning; the actual rules
files are what Firebase enforces.

## 1. The one rule that governs everything else

Every collection in `firestore.rules` follows the same shape:

```
match /{collectionName}/{docId} {
  allow read: if isOwner(uid) || isAdmin();
  allow write: if false;
}
```

**Why `allow write: if false` on collections that clearly need writes
(wallets, transactions)?** Because every real write to these collections
already happens server-side, via the Firebase Admin SDK, which bypasses
Security Rules entirely by design (that's how Admin SDKs work — they're
trusted server credentials, not subject to client-facing rules). These
rules exist specifically to block the **client SDK** from writing
directly — which is the "balance = balance - amount from the browser"
anti-pattern the original project brief explicitly warns against. A
Firestore rule reading `allow write: if false` is not a bug or an
oversight; it's the whole point.

## 2. Full current ruleset — `firestore.rules`

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'administrator';
    }

    match /users/{uid} {
      allow read: if isOwner(uid) || isAdmin();
      allow create: if isOwner(uid)
        && request.resource.data.uid == uid
        && request.resource.data.role == 'customer'
        && request.resource.data.tier == 1;
      allow update: if isOwner(uid)
        && request.resource.data.role == resource.data.role
        && request.resource.data.tier == resource.data.tier
        && request.resource.data.uid == resource.data.uid;
      allow delete: if false;
    }

    match /wallets/{uid} {
      allow read: if isOwner(uid) || isAdmin();
      allow write: if false;
    }

    match /walletTransactions/{txId} {
      allow read: if isSignedIn() && (resource.data.uid == request.auth.uid || isAdmin());
      allow write: if false;
    }

    match /kycRecords/{uid} {
      allow read: if isOwner(uid) || isAdmin();
      allow write: if false;
    }

    match /linkedAccounts/{accountId} {
      allow read: if isSignedIn() && (resource.data.uid == request.auth.uid || isAdmin());
      allow write: if false;
    }

    match /notifications/{notificationId} {
      allow read: if isSignedIn() && resource.data.uid == request.auth.uid;
      allow write: if false;
    }

    match /scheduledPayments/{id} {
      allow read: if isSignedIn() && resource.data.uid == request.auth.uid;
      allow write: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 3. Rule-by-rule reasoning

### `users/{uid}` — the one collection with real client writes
This is the exception to the "write: false" pattern, because account
registration genuinely needs a client-side write (creating your own
profile on sign-up). The `create` rule is the critical privilege-escalation
block: **it requires `role == 'customer'` and `tier == 1`** — a client
literally cannot create their own profile with any other role. The
`update` rule additionally requires `role`, `tier`, and `uid` stay
unchanged from the existing document — a user can update their name or
phone, but not their own privilege level, ever, via any client write path.

### `wallets/{uid}`, `walletTransactions/{txId}` — the financial core
Read-only for the owner (or admin). This is what makes the wallet ledger
architecturally trustworthy: even if application code had a bug that
somehow tried a client-side balance write, Firestore itself would reject
it.

### `kycRecords/{uid}` — privacy + privilege
Read access is owner-or-admin (an admin needs to see submissions to
review them). Write is fully denied to the client — this is what actually
prevents a user from setting their own KYC status to `"approved"`,
regardless of what the application UI does or doesn't allow.

### `linkedAccounts`, `notifications`, `scheduledPayments`
Same pattern: read your own, write nothing directly. Notifications
specifically note in-code why `read` isn't allowed to be marked
client-side either — so a `read: true` flag can't be spoofed to hide
evidence of what was shown to a user, in case that ever matters for an
audit.

### The catch-all deny
`match /{document=**} { allow read, write: if false; }` — anything not
explicitly listed above is completely inaccessible. New collections added
later are unreachable until a rule is explicitly written for them; this
is deliberate default-deny, not an oversight waiting to be noticed.

## 4. Storage Rules — `storage.rules`

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() {
      return request.auth != null;
    }
    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    match /kyc/{uid}/{fileName} {
      allow read: if isOwner(uid);
      allow write: if isOwner(uid)
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*|application/pdf');
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

**Critical design note**: admin viewing of KYC documents does **not** go
through a client-readable rule extension here — deliberately. Admin
access uses a server-generated signed URL (`GET
/api/kyc/document-url`), which uses the Admin SDK and bypasses these
rules entirely, same pattern as Firestore. This avoids ever needing a
rule like `allow read: if isOwner(uid) || isAdmin()` on Storage, which
would require a Firestore `get()` call from within a Storage rule (slower
and more fragile) and would create a second path to read potentially
sensitive documents that has to be kept in sync with the Firestore-based
admin check.

## 5. What these rules do NOT protect against

See `docs/12_Security_Architecture.md` §7 — no rate limiting, no App
Check, and the rules themselves are written but **not verified against a
live emulator** (see `docs/SECURITY_TEST_REPORT.md`). Reading these rules
carefully is not the same as confirming they behave as intended —
`npm run test:rules` is the way to actually confirm that.
