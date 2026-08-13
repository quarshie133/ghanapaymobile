import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";

/**
 * SERVER-ONLY. "Linked accounts" here are sandbox records only — there is
 * no real integration with any bank or mobile money provider to verify
 * account ownership against. Linking succeeds immediately and is marked
 * `isVerified: true` as a sandbox convenience, matching the same
 * SandboxPaymentProvider framing used elsewhere in this project. Never
 * present this as a real bank/MoMo verification in documentation.
 */

const LINKED_ACCOUNTS = "linkedAccounts";

export interface LinkedAccountDoc {
  id: string;
  uid: string;
  type: "momo" | "bank";
  provider: string;
  accountNumber: string; // stored as-entered; only maskedNumber is ever shown in UI lists
  maskedNumber: string;
  badgeLabel: string;
  accountName: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: FirebaseFirestore.Timestamp | null;
}

function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, "");
  if (digits.length <= 4) return "••••" + digits;
  return "•••• " + digits.slice(-4);
}

export async function listLinkedAccounts(uid: string): Promise<LinkedAccountDoc[]> {
  const snap = await adminDb().collection(LINKED_ACCOUNTS).where("uid", "==", uid).orderBy("createdAt", "asc").get();
  return snap.docs.map((d) => d.data() as LinkedAccountDoc);
}

export async function linkAccount(
  uid: string,
  input: { type: "momo" | "bank"; provider: string; accountNumber: string; accountName: string }
): Promise<LinkedAccountDoc> {
  if (!input.provider || !input.accountNumber || !input.accountName) {
    throw new Error("Provider, account number, and account name are required.");
  }

  const db = adminDb();
  const collectionRef = db.collection(LINKED_ACCOUNTS);

  return db.runTransaction(async (tx) => {
    const existingSnap = await tx.get(collectionRef.where("uid", "==", uid).limit(1));
    const isFirstAccount = existingSnap.empty;

    const ref = collectionRef.doc();
    const account: Omit<LinkedAccountDoc, "createdAt"> = {
      id: ref.id,
      uid,
      type: input.type,
      provider: input.provider,
      accountNumber: input.accountNumber,
      maskedNumber: maskAccountNumber(input.accountNumber),
      badgeLabel: input.type === "bank" ? "Bank" : "Mobile Money",
      accountName: input.accountName,
      isDefault: isFirstAccount, // first linked account becomes default automatically
      isVerified: true, // sandbox — see module docstring
    };

    tx.set(ref, { ...account, createdAt: FieldValue.serverTimestamp() });
    return { ...account, createdAt: null };
  });
}

export async function unlinkAccount(uid: string, accountId: string): Promise<void> {
  const db = adminDb();
  const ref = db.collection(LINKED_ACCOUNTS).doc(accountId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Linked account not found");
    const account = snap.data() as LinkedAccountDoc;
    if (account.uid !== uid) throw new Error("Not authorized to remove this account");

    tx.delete(ref);

    // If the removed account was the default, promote another one (if any).
    if (account.isDefault) {
      const remainingSnap = await tx.get(
        db.collection(LINKED_ACCOUNTS).where("uid", "==", uid).limit(5)
      );
      const nextDefault = remainingSnap.docs.find((d) => d.id !== accountId);
      if (nextDefault) {
        tx.update(nextDefault.ref, { isDefault: true });
      }
    }
  });
}

export async function setDefaultAccount(uid: string, accountId: string): Promise<LinkedAccountDoc> {
  const db = adminDb();
  const targetRef = db.collection(LINKED_ACCOUNTS).doc(accountId);

  return db.runTransaction(async (tx) => {
    const targetSnap = await tx.get(targetRef);
    if (!targetSnap.exists) throw new Error("Linked account not found");
    const target = targetSnap.data() as LinkedAccountDoc;
    if (target.uid !== uid) throw new Error("Not authorized to modify this account");

    const allSnap = await tx.get(db.collection(LINKED_ACCOUNTS).where("uid", "==", uid));
    for (const doc of allSnap.docs) {
      if (doc.id !== accountId && doc.data().isDefault) {
        tx.update(doc.ref, { isDefault: false });
      }
    }
    tx.update(targetRef, { isDefault: true });

    return { ...target, isDefault: true };
  });
}
