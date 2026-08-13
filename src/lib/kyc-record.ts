import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import { createNotification } from "./notifications";

/**
 * SERVER-ONLY. A client can submit documents (via /api/kyc/document) but
 * can never set its own overall `status` to "approved" — that field only
 * changes via the admin-only PATCH route, which is itself gated by
 * requireAuth(request, "administrator"). This mirrors the same
 * "client proposes, server (with the right role) disposes" pattern used
 * for the wallet ledger.
 */

const KYC_RECORDS = "kycRecords";

export type KycStepId = "ghanaCard" | "selfie" | "addressProof";
export type KycStepStatus = "pending" | "submitted";
export type KycOverallStatus = "not_started" | "in_progress" | "pending_review" | "approved" | "rejected";

export interface KycRecord {
  uid: string;
  name: string;
  phone: string | null;
  status: KycOverallStatus;
  steps: Record<KycStepId, { status: KycStepStatus; storagePath: string | null; submittedAt: FirebaseFirestore.Timestamp | null }>;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: FirebaseFirestore.Timestamp | null;
  createdAt: FirebaseFirestore.Timestamp | null;
  updatedAt: FirebaseFirestore.Timestamp | null;
}

const REQUIRED_STEPS: KycStepId[] = ["ghanaCard", "selfie", "addressProof"];
// NOTE: the KYC page's UI also shows a 4th step ("Bank Verification") that
// isn't a document upload at all — it needs the linked-accounts subsystem,
// which doesn't exist yet (see docs/PROJECT_AUDIT.md). It's intentionally
// excluded from REQUIRED_STEPS and stays locked/pending in the UI.

function emptySteps(): KycRecord["steps"] {
  return {
    ghanaCard: { status: "pending", storagePath: null, submittedAt: null },
    selfie: { status: "pending", storagePath: null, submittedAt: null },
    addressProof: { status: "pending", storagePath: null, submittedAt: null },
  };
}

export async function getOrCreateKycRecord(uid: string): Promise<KycRecord> {
  const ref = adminDb().collection(KYC_RECORDS).doc(uid);
  const snap = await ref.get();
  if (snap.exists) return snap.data() as KycRecord;

  // Denormalize name/phone from the user profile at creation time, purely
  // so the admin queue can display who's who without an N+1 lookup per
  // row. This is a snapshot, not a live join — if the user later changes
  // their name, this record won't reflect it until they resubmit a
  // document (submitKycDocument doesn't refresh it either, deliberately
  // out of scope for this phase).
  const userSnap = await adminDb().collection("users").doc(uid).get();
  const name = userSnap.exists ? (userSnap.data()?.name as string) || "Unknown" : "Unknown";
  const phone = userSnap.exists ? (userSnap.data()?.phone as string) || null : null;

  const record: Omit<KycRecord, "createdAt" | "updatedAt"> = {
    uid,
    name,
    phone,
    status: "not_started",
    steps: emptySteps(),
    reviewNote: null,
    reviewedBy: null,
    reviewedAt: null,
  };
  await ref.set({ ...record, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  return { ...record, createdAt: null, updatedAt: null };
}

/** Records a document submission for one step. Recomputes overall status. */
export async function submitKycDocument(uid: string, stepId: KycStepId, storagePath: string): Promise<KycRecord> {
  if (!REQUIRED_STEPS.includes(stepId)) {
    throw new Error(`Unknown KYC step: ${stepId}`);
  }

  const ref = adminDb().collection(KYC_RECORDS).doc(uid);
  return adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing: KycRecord = snap.exists
      ? (snap.data() as KycRecord)
      : { uid, name: "Unknown", phone: null, status: "not_started", steps: emptySteps(), reviewNote: null, reviewedBy: null, reviewedAt: null, createdAt: null, updatedAt: null };

    const updatedSteps = {
      ...existing.steps,
      [stepId]: { status: "submitted" as const, storagePath, submittedAt: null },
    };

    const allSubmitted = REQUIRED_STEPS.every((s) => updatedSteps[s].status === "submitted");
    // Never silently downgrade an already-approved/rejected record just
    // because a document was re-uploaded — that requires a fresh admin review.
    const newStatus: KycOverallStatus =
      existing.status === "approved" || existing.status === "rejected"
        ? "pending_review"
        : allSubmitted
        ? "pending_review"
        : "in_progress";

    const next = { ...existing, steps: updatedSteps, status: newStatus };
    tx.set(
      ref,
      { ...next, updatedAt: FieldValue.serverTimestamp(), createdAt: existing.createdAt || FieldValue.serverTimestamp() },
      { merge: true }
    );
    return next;
  });
}

/** Admin-only: approve or reject a user's KYC submission. */
export async function reviewKycRecord(
  uid: string,
  action: "approve" | "reject",
  reviewerUid: string,
  note?: string
): Promise<KycRecord> {
  const ref = adminDb().collection(KYC_RECORDS).doc(uid);
  const userRef = adminDb().collection("users").doc(uid);

  const result = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("KYC record not found");
    const existing = snap.data() as KycRecord;

    const newStatus: KycOverallStatus = action === "approve" ? "approved" : "rejected";
    const next: KycRecord = {
      ...existing,
      status: newStatus,
      reviewNote: note || null,
      reviewedBy: reviewerUid,
      reviewedAt: null,
    };

    tx.set(ref, { ...next, reviewedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    if (action === "approve") {
      // Bump the user to Tier 3 on approval — matches the tier comparison
      // table already shown in the KYC page UI.
      tx.set(userRef, { tier: 3, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }

    return next;
  });

  try {
    await createNotification(
      uid,
      "kyc",
      action === "approve" ? "KYC Verification Approved" : "KYC Verification Rejected",
      action === "approve"
        ? "Your identity verification was approved. You've been upgraded to Tier 3, unlocking higher transaction limits."
        : `Your identity verification was rejected.${note ? ` Reason: ${note}` : ""} Please review and resubmit your documents.`
    );
  } catch (err) {
    console.error("[kyc-record] Failed to create notification (non-fatal):", err);
  }

  return result;
}

export async function listKycRecords(status?: KycOverallStatus, limit = 100): Promise<KycRecord[]> {
  let query = adminDb().collection(KYC_RECORDS).orderBy("updatedAt", "desc").limit(limit) as FirebaseFirestore.Query;
  if (status) {
    query = adminDb().collection(KYC_RECORDS).where("status", "==", status).orderBy("updatedAt", "desc").limit(limit);
  }
  const snap = await query.get();
  return snap.docs.map((d) => d.data() as KycRecord);
}
