import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import { createNotification } from "./notifications";

/**
 * SERVER-ONLY wallet ledger. Every function here runs inside a Firestore
 * transaction (atomic read-modify-write) via the Admin SDK, which bypasses
 * Firestore Security Rules by design — that's fine because these functions
 * are only ever called from route handlers that have already verified the
 * caller's identity with requireAuth() (src/lib/server-auth.ts). The
 * browser NEVER computes a new balance; it only ever sends "top up ₵50" and
 * the server decides what the resulting balance is.
 */

const WALLETS = "wallets";
const WALLET_TRANSACTIONS = "walletTransactions";
const WALLET_DAILY_USAGE = "walletDailyUsage";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD", UTC
}

/**
 * Fires a notification AFTER a Firestore transaction has already committed
 * — never from inside a transaction callback, since Firestore retries
 * transaction callbacks on contention and that would risk duplicate
 * notifications for a single logical operation. Best-effort: a
 * notification failure must never surface as a failure of the money
 * operation itself.
 */
async function notifyBestEffort(uid: string, title: string, body: string) {
  try {
    await createNotification(uid, "transaction", title, body);
  } catch (err) {
    console.error("[wallet-ledger] Failed to create notification (non-fatal):", err);
  }
}

// Starter limits for a brand-new Tier 1 wallet. Not yet enforced against
// actual spend (see docs/PROJECT_AUDIT.md) — stored so the UI has real
// numbers to display, and so enforcement can be added without a schema change.
const TIER_1_LIMITS = { daily: 5000, weekly: 20000, monthly: 80000 };

export interface WalletDoc {
  uid: string;
  balance: number;
  currency: string;
  tier: number;
  limits: typeof TIER_1_LIMITS;
  createdAt: FirebaseFirestore.Timestamp | null;
  updatedAt: FirebaseFirestore.Timestamp | null;
}

export type WalletTxType = "topup" | "withdrawal" | "transfer_out" | "transfer_in" | "bill" | "airtime";
export type WalletTxStatus = "pending" | "successful" | "failed" | "reversed";

export interface WalletTransactionDoc {
  id: string;
  uid: string;
  type: WalletTxType;
  amount: number;
  fee: number;
  status: WalletTxStatus;
  ref: string;
  note: string | null;
  idempotencyKey: string | null;
  counterpartyUid: string | null;
  counterpartyName: string | null;
  createdAt: FirebaseFirestore.Timestamp | null;
}

function generateRef(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `GHP-${prefix}-${Date.now()}-${rand}`;
}

/**
 * Fetches a user's wallet, creating one with a zero balance if this is
 * their first time touching the wallet system. Safe to call repeatedly —
 * the creation path only runs once per uid (guarded inside a transaction
 * so two simultaneous first requests can't create two wallets).
 */
export async function getOrCreateWallet(uid: string): Promise<WalletDoc> {
  const db = adminDb();
  const ref = db.collection(WALLETS).doc(uid);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      return snap.data() as WalletDoc;
    }

    const wallet: WalletDoc = {
      uid,
      balance: 0,
      currency: "GHS",
      tier: 1,
      limits: TIER_1_LIMITS,
      createdAt: null, // set via serverTimestamp below, reflected on next read
      updatedAt: null,
    };
    tx.set(ref, {
      ...wallet,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return wallet;
  });
}

/**
 * Sandbox top-up: credits a wallet and writes an immutable ledger entry,
 * atomically. This simulates a top-up (e.g. from mobile money) — no real
 * payment provider is integrated (see brief §9 sandbox provider pattern).
 * Never claim this moves real money.
 *
 * Idempotent: if `idempotencyKey` matches an existing transaction for this
 * uid, the existing result is returned instead of crediting twice — guards
 * against double-submit from a flaky network/double-tap.
 */
export async function topupWallet(
  uid: string,
  amount: number,
  idempotencyKey?: string
): Promise<{ wallet: WalletDoc; transaction: WalletTransactionDoc }> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
  if (amount > 50000) {
    // Sandbox sanity cap — not a real regulatory limit, just guards against
    // obviously-bogus input while limits enforcement isn't built yet.
    throw new Error("Amount exceeds the sandbox top-up cap of ₵50,000");
  }

  const db = adminDb();
  const walletRef = db.collection(WALLETS).doc(uid);
  const txCollection = db.collection(WALLET_TRANSACTIONS);

  const result = await db.runTransaction(async (tx) => {
    // Idempotency check (inside the transaction, so concurrent duplicate
    // requests can't both pass the check before either writes).
    if (idempotencyKey) {
      const existingQuery = txCollection
        .where("uid", "==", uid)
        .where("idempotencyKey", "==", idempotencyKey)
        .limit(1);
      const existingSnap = await tx.get(existingQuery);
      if (!existingSnap.empty) {
        const existingTx = existingSnap.docs[0].data() as WalletTransactionDoc;
        const walletSnap = await tx.get(walletRef);
        return { wallet: walletSnap.data() as WalletDoc, transaction: existingTx };
      }
    }

    const walletSnap = await tx.get(walletRef);
    const currentWallet: WalletDoc = walletSnap.exists
      ? (walletSnap.data() as WalletDoc)
      : {
          uid,
          balance: 0,
          currency: "GHS",
          tier: 1,
          limits: TIER_1_LIMITS,
          createdAt: null,
          updatedAt: null,
        };

    const newBalance = Math.round((currentWallet.balance + amount) * 100) / 100; // avoid float drift
    const txRef = txCollection.doc();
    const transaction: Omit<WalletTransactionDoc, "createdAt"> = {
      id: txRef.id,
      uid,
      type: "topup",
      amount,
      fee: 0,
      status: "successful",
      ref: generateRef("TU"),
      note: "Sandbox top-up",
      idempotencyKey: idempotencyKey || null,
      counterpartyUid: null,
      counterpartyName: null,
    };

    tx.set(txRef, { ...transaction, createdAt: FieldValue.serverTimestamp() });
    tx.set(
      walletRef,
      { ...currentWallet, balance: newBalance, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    return {
      wallet: { ...currentWallet, balance: newBalance },
      transaction: { ...transaction, createdAt: null },
    };
  });

  await notifyBestEffort(uid, "Top-up successful", `₵${amount.toFixed(2)} was added to your wallet. New balance: ₵${result.wallet.balance.toFixed(2)}.`);
  return result;
}

export async function listWalletTransactions(
  uid: string,
  { limit = 20, type }: { limit?: number; type?: string } = {}
): Promise<WalletTransactionDoc[]> {
  const db = adminDb();
  let query = db.collection(WALLET_TRANSACTIONS).where("uid", "==", uid).orderBy("createdAt", "desc").limit(limit);
  if (type) {
    query = db
      .collection(WALLET_TRANSACTIONS)
      .where("uid", "==", uid)
      .where("type", "==", type)
      .orderBy("createdAt", "desc")
      .limit(limit) as typeof query;
  }
  const snap = await query.get();
  return snap.docs.map((d) => d.data() as WalletTransactionDoc);
}

/**
 * Sandbox withdrawal: debits a wallet. No real external destination
 * (bank/mobile money) is integrated — this simulates a withdrawal request
 * succeeding immediately, same sandbox pattern as top-up. Rejects if the
 * balance is insufficient (server-side check — the client's displayed
 * balance is never trusted for this decision).
 */
export async function withdrawFromWallet(
  uid: string,
  amount: number,
  idempotencyKey?: string,
  note?: string
): Promise<{ wallet: WalletDoc; transaction: WalletTransactionDoc }> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }

  const db = adminDb();
  const walletRef = db.collection(WALLETS).doc(uid);
  const txCollection = db.collection(WALLET_TRANSACTIONS);

  const result = await db.runTransaction(async (tx) => {
    if (idempotencyKey) {
      const existingSnap = await tx.get(
        txCollection.where("uid", "==", uid).where("idempotencyKey", "==", idempotencyKey).limit(1)
      );
      if (!existingSnap.empty) {
        const existingTx = existingSnap.docs[0].data() as WalletTransactionDoc;
        const walletSnap = await tx.get(walletRef);
        return { wallet: walletSnap.data() as WalletDoc, transaction: existingTx };
      }
    }

    const walletSnap = await tx.get(walletRef);
    if (!walletSnap.exists) {
      throw new Error("Wallet not found");
    }
    const currentWallet = walletSnap.data() as WalletDoc;

    if (currentWallet.balance < amount) {
      throw new Error("Insufficient wallet balance");
    }

    const newBalance = Math.round((currentWallet.balance - amount) * 100) / 100;
    const txRef = txCollection.doc();
    const transaction: Omit<WalletTransactionDoc, "createdAt"> = {
      id: txRef.id,
      uid,
      type: "withdrawal",
      amount,
      fee: 0,
      status: "successful",
      ref: generateRef("WD"),
      note: note || "Sandbox withdrawal",
      idempotencyKey: idempotencyKey || null,
      counterpartyUid: null,
      counterpartyName: null,
    };

    tx.set(txRef, { ...transaction, createdAt: FieldValue.serverTimestamp() });
    tx.update(walletRef, { balance: newBalance, updatedAt: FieldValue.serverTimestamp() });

    return { wallet: { ...currentWallet, balance: newBalance }, transaction: { ...transaction, createdAt: null } };
  });

  await notifyBestEffort(uid, "Withdrawal successful", `₵${amount.toFixed(2)} was withdrawn from your wallet. New balance: ₵${result.wallet.balance.toFixed(2)}.`);
  return result;
}

/**
 * Sandbox payment for bills or airtime — debits the wallet atomically for a
 * fixed, non-refundable-looking amount (no real biller/telco integration;
 * this simulates the debit side of a bill/airtime purchase). Same
 * insufficient-funds guard as withdrawal. `type` is stored on the ledger
 * entry so it shows up correctly in transaction history/filters.
 */
export async function payForSandboxService(
  uid: string,
  amount: number,
  type: "bill" | "airtime",
  note: string,
  idempotencyKey?: string
): Promise<{ wallet: WalletDoc; transaction: WalletTransactionDoc }> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }

  const db = adminDb();
  const walletRef = db.collection(WALLETS).doc(uid);
  const txCollection = db.collection(WALLET_TRANSACTIONS);

  const result = await db.runTransaction(async (tx) => {
    if (idempotencyKey) {
      const existingSnap = await tx.get(
        txCollection.where("uid", "==", uid).where("idempotencyKey", "==", idempotencyKey).limit(1)
      );
      if (!existingSnap.empty) {
        const existingTx = existingSnap.docs[0].data() as WalletTransactionDoc;
        const walletSnap = await tx.get(walletRef);
        return { wallet: walletSnap.data() as WalletDoc, transaction: existingTx };
      }
    }

    const walletSnap = await tx.get(walletRef);
    if (!walletSnap.exists) {
      throw new Error("Wallet not found");
    }
    const currentWallet = walletSnap.data() as WalletDoc;

    if (currentWallet.balance < amount) {
      throw new Error("Insufficient wallet balance");
    }

    const newBalance = Math.round((currentWallet.balance - amount) * 100) / 100;
    const txRef = txCollection.doc();
    const transaction: Omit<WalletTransactionDoc, "createdAt"> = {
      id: txRef.id,
      uid,
      type,
      amount,
      fee: 0,
      status: "successful",
      ref: generateRef(type === "bill" ? "BILL" : "AIR"),
      note,
      idempotencyKey: idempotencyKey || null,
      counterpartyUid: null,
      counterpartyName: null,
    };

    tx.set(txRef, { ...transaction, createdAt: FieldValue.serverTimestamp() });
    tx.update(walletRef, { balance: newBalance, updatedAt: FieldValue.serverTimestamp() });

    return { wallet: { ...currentWallet, balance: newBalance }, transaction: { ...transaction, createdAt: null } };
  });

  const label = type === "bill" ? "Bill payment successful" : "Airtime purchase successful";
  await notifyBestEffort(uid, label, `₵${amount.toFixed(2)} — ${note}. New balance: ₵${result.wallet.balance.toFixed(2)}.`);
  return result;
}

/**
 * Peer-to-peer transfer between two GhanaPay wallets. Debits the sender and
 * credits the recipient in a SINGLE atomic transaction — either both
 * happen or neither does, so money can never be deducted from one side
 * without appearing on the other. Two ledger entries are written
 * (transfer_out for sender, transfer_in for recipient) sharing the same
 * `ref` so they can be correlated later.
 *
 * GhanaPay-to-GhanaPay transfers are fee-free, matching the fee logic
 * already shown in the send-money UI.
 */
export async function transferBetweenWallets(
  senderUid: string,
  recipientUid: string,
  amount: number,
  note: string | null,
  recipientName: string | null,
  senderName: string | null,
  idempotencyKey?: string
): Promise<{ wallet: WalletDoc; transaction: WalletTransactionDoc }> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
  if (senderUid === recipientUid) {
    throw new Error("Cannot transfer to your own account");
  }

  const db = adminDb();
  const senderRef = db.collection(WALLETS).doc(senderUid);
  const recipientRef = db.collection(WALLETS).doc(recipientUid);
  const txCollection = db.collection(WALLET_TRANSACTIONS);

  const result = await db.runTransaction(async (tx) => {
    if (idempotencyKey) {
      const existingSnap = await tx.get(
        txCollection
          .where("uid", "==", senderUid)
          .where("idempotencyKey", "==", idempotencyKey)
          .limit(1)
      );
      if (!existingSnap.empty) {
        const existingTx = existingSnap.docs[0].data() as WalletTransactionDoc;
        const senderSnap = await tx.get(senderRef);
        const recipientSnapForDupe = await tx.get(recipientRef);
        const recipientBalance = recipientSnapForDupe.exists ? (recipientSnapForDupe.data() as WalletDoc).balance : 0;
        return { wallet: senderSnap.data() as WalletDoc, transaction: existingTx, recipientBalance };
      }
    }

    const senderSnap = await tx.get(senderRef);
    if (!senderSnap.exists) {
      throw new Error("Sender wallet not found");
    }
    const senderWallet = senderSnap.data() as WalletDoc;

    const fee = 0; // GhanaPay-to-GhanaPay transfers are fee-free (matches send-money UI)
    const totalOutflow = Math.round((amount + fee) * 100) / 100;

    if (senderWallet.balance < totalOutflow) {
      throw new Error("Insufficient wallet balance");
    }

    // Server-side daily limit check — the UI already checks this, but the
    // brief is explicit that the browser must never be the sole enforcement
    // point. This is the real gate.
    const usageKey = `${senderUid}_${todayKey()}`;
    const usageRef = db.collection(WALLET_DAILY_USAGE).doc(usageKey);
    const usageSnap = await tx.get(usageRef);
    const dailySentSoFar = (usageSnap.exists ? usageSnap.data()?.sent : 0) || 0;
    if (dailySentSoFar + amount > senderWallet.limits.daily) {
      throw new Error(
        `Daily transfer limit exceeded. Remaining today: ₵${Math.max(0, senderWallet.limits.daily - dailySentSoFar).toFixed(2)}`
      );
    }

    const recipientSnap = await tx.get(recipientRef);
    const recipientWallet: WalletDoc = recipientSnap.exists
      ? (recipientSnap.data() as WalletDoc)
      : { uid: recipientUid, balance: 0, currency: "GHS", tier: 1, limits: TIER_1_LIMITS, createdAt: null, updatedAt: null };

    const newSenderBalance = Math.round((senderWallet.balance - totalOutflow) * 100) / 100;
    const newRecipientBalance = Math.round((recipientWallet.balance + amount) * 100) / 100;

    const sharedRef = generateRef("TX");

    const outTxRef = txCollection.doc();
    const outTransaction: Omit<WalletTransactionDoc, "createdAt"> = {
      id: outTxRef.id,
      uid: senderUid,
      type: "transfer_out",
      amount,
      fee,
      status: "successful",
      ref: sharedRef,
      note: note || "Transfer",
      idempotencyKey: idempotencyKey || null,
      counterpartyUid: recipientUid,
      counterpartyName: recipientName,
    };

    const inTxRef = txCollection.doc();
    const inTransaction: Omit<WalletTransactionDoc, "createdAt"> = {
      id: inTxRef.id,
      uid: recipientUid,
      type: "transfer_in",
      amount,
      fee: 0,
      status: "successful",
      ref: sharedRef,
      note: note || "Transfer",
      idempotencyKey: null, // recipient side is never the deduped party
      counterpartyUid: senderUid,
      counterpartyName: senderName,
    };

    tx.set(outTxRef, { ...outTransaction, createdAt: FieldValue.serverTimestamp() });
    tx.set(inTxRef, { ...inTransaction, createdAt: FieldValue.serverTimestamp() });
    tx.set(senderRef, { ...senderWallet, balance: newSenderBalance, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.set(
      recipientRef,
      { ...recipientWallet, balance: newRecipientBalance, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    tx.set(usageRef, { uid: senderUid, date: todayKey(), sent: dailySentSoFar + amount }, { merge: true });

    return {
      wallet: { ...senderWallet, balance: newSenderBalance },
      transaction: { ...outTransaction, createdAt: null },
      recipientBalance: newRecipientBalance,
    };
  });

  await notifyBestEffort(
    senderUid,
    "Transfer sent",
    `You sent ₵${amount.toFixed(2)} to ${recipientName || "a GhanaPay user"}. New balance: ₵${result.wallet.balance.toFixed(2)}.`
  );
  await notifyBestEffort(
    recipientUid,
    "Money received",
    `You received ₵${amount.toFixed(2)} from ${senderName || "a GhanaPay user"}. New balance: ₵${result.recipientBalance.toFixed(2)}.`
  );

  return { wallet: result.wallet, transaction: result.transaction };
}
