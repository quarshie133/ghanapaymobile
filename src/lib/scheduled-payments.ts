import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import { transferBetweenWallets, payForSandboxService } from "./wallet-ledger";
import { lookupUserByPhone } from "./server-user-lookup";
import { advanceScheduleDate, type ScheduleFrequency } from "./schedule-dates";

/**
 * SERVER-ONLY. Scheduled payments are stored in Firestore and executed by
 * runDueScheduledPayments(), which is meant to be invoked periodically by
 * a Netlify Scheduled Function hitting POST /api/scheduled/run — NOT by
 * anything in the browser. This is what actually satisfies the brief's
 * "the browser must not need to remain open for scheduled jobs" — a
 * button in the UI cannot make that true by itself; something has to call
 * this code on a timer independent of any open tab. See
 * docs/16_NETLIFY_DEPLOYMENT_GUIDE.md for the Netlify-side setup, which is
 * a real infrastructure step you have to do — this code alone doesn't
 * create the cron trigger.
 */

const SCHEDULED_PAYMENTS = "scheduledPayments";

export type ScheduleType = "transfer" | "bill" | "airtime";
export type { ScheduleFrequency };
export type ScheduleStatus = "active" | "paused" | "cancelled";

export interface ScheduledPaymentDoc {
  id: string;
  uid: string;
  type: ScheduleType;
  recipientName: string;
  recipientPhone: string;
  amount: number;
  frequency: ScheduleFrequency;
  note: string | null;
  status: ScheduleStatus;
  nextRunAt: FirebaseFirestore.Timestamp;
  lastRunAt: FirebaseFirestore.Timestamp | null;
  lastRunStatus: "success" | "failed" | null;
  lastRunError: string | null;
  createdAt: FirebaseFirestore.Timestamp | null;
  updatedAt: FirebaseFirestore.Timestamp | null;
}


export async function createScheduledPayment(
  uid: string,
  input: {
    type: ScheduleType;
    recipientName: string;
    recipientPhone: string;
    amount: number;
    frequency: ScheduleFrequency;
    nextRunAt: string; // ISO date string
    note?: string;
  }
): Promise<ScheduledPaymentDoc> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
  const nextRunDate = new Date(input.nextRunAt);
  if (isNaN(nextRunDate.getTime())) {
    throw new Error("Invalid nextRunAt date");
  }

  const ref = adminDb().collection(SCHEDULED_PAYMENTS).doc();
  const doc: Omit<ScheduledPaymentDoc, "createdAt" | "updatedAt" | "nextRunAt"> = {
    id: ref.id,
    uid,
    type: input.type,
    recipientName: input.recipientName,
    recipientPhone: input.recipientPhone,
    amount: input.amount,
    frequency: input.frequency,
    note: input.note || null,
    status: "active",
    lastRunAt: null,
    lastRunStatus: null,
    lastRunError: null,
  };

  await ref.set({
    ...doc,
    nextRunAt: Timestamp.fromDate(nextRunDate),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const saved = await ref.get();
  return saved.data() as ScheduledPaymentDoc;
}

export async function listScheduledPayments(uid: string): Promise<ScheduledPaymentDoc[]> {
  const snap = await adminDb()
    .collection(SCHEDULED_PAYMENTS)
    .where("uid", "==", uid)
    .orderBy("nextRunAt", "asc")
    .get();
  return snap.docs.map((d) => d.data() as ScheduledPaymentDoc);
}

export async function updateScheduledPayment(
  uid: string,
  id: string,
  updates: Partial<Pick<ScheduledPaymentDoc, "status" | "amount" | "frequency" | "note">>
): Promise<ScheduledPaymentDoc> {
  const ref = adminDb().collection(SCHEDULED_PAYMENTS).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Scheduled payment not found");
  if ((snap.data() as ScheduledPaymentDoc).uid !== uid) throw new Error("Not authorized to modify this schedule");

  await ref.update({ ...updates, updatedAt: FieldValue.serverTimestamp() });
  const updated = await ref.get();
  return updated.data() as ScheduledPaymentDoc;
}

export async function deleteScheduledPayment(uid: string, id: string): Promise<void> {
  const ref = adminDb().collection(SCHEDULED_PAYMENTS).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Scheduled payment not found");
  if ((snap.data() as ScheduledPaymentDoc).uid !== uid) throw new Error("Not authorized to delete this schedule");
  await ref.delete();
}

/**
 * Executes every active schedule whose nextRunAt has passed. Meant to be
 * called by a cron trigger (see module docstring), not by user action.
 *
 * On both success AND failure, nextRunAt advances by one frequency
 * interval — a failing schedule (e.g. insufficient balance) is recorded as
 * failed and simply tried again at its next natural occurrence, rather
 * than retried in a tight loop, which could otherwise hammer a wallet with
 * repeated failed-transaction attempts every time the cron fires.
 */
export async function runDueScheduledPayments(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const now = Timestamp.now();
  const dueSnap = await adminDb()
    .collection(SCHEDULED_PAYMENTS)
    .where("status", "==", "active")
    .where("nextRunAt", "<=", now)
    .limit(100) // sane batch size per cron tick
    .get();

  let succeeded = 0;
  let failed = 0;

  for (const doc of dueSnap.docs) {
    const schedule = doc.data() as ScheduledPaymentDoc;
    let lastRunStatus: "success" | "failed" = "success";
    let lastRunError: string | null = null;

    try {
      if (schedule.type === "transfer") {
        const recipient = await lookupUserByPhone(schedule.recipientPhone);
        if (!recipient) throw new Error(`Recipient ${schedule.recipientPhone} not found`);
        const senderSnap = await adminDb().collection("users").doc(schedule.uid).get();
        const senderName = senderSnap.exists ? (senderSnap.data()?.name as string) : null;
        await transferBetweenWallets(
          schedule.uid,
          recipient.uid,
          schedule.amount,
          schedule.note || `Scheduled transfer to ${schedule.recipientName}`,
          recipient.name,
          senderName
        );
      } else {
        await payForSandboxService(
          schedule.uid,
          schedule.amount,
          schedule.type,
          schedule.note || `Scheduled ${schedule.type} payment to ${schedule.recipientName}`
        );
      }
      succeeded++;
    } catch (err: any) {
      lastRunStatus = "failed";
      lastRunError = err?.message || "Unknown error";
      failed++;
    }

    const nextRunAt = advanceScheduleDate(schedule.nextRunAt.toDate(), schedule.frequency);
    await doc.ref.update({
      lastRunAt: FieldValue.serverTimestamp(),
      lastRunStatus,
      lastRunError,
      nextRunAt: Timestamp.fromDate(nextRunAt),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return { processed: dueSnap.size, succeeded, failed };
}
