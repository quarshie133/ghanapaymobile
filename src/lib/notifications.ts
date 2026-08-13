import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";

/**
 * SERVER-ONLY. Notifications are created by the server whenever something
 * notification-worthy happens (a transaction completes, a KYC review
 * finishes) — never by the client directly. See createNotification() call
 * sites in wallet-ledger.ts and kyc-record.ts.
 */

const NOTIFICATIONS = "notifications";

export type NotificationType = "transaction" | "kyc" | "info";

export interface NotificationDoc {
  id: string;
  uid: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: FirebaseFirestore.Timestamp | null;
}

export async function createNotification(
  uid: string,
  type: NotificationType,
  title: string,
  body: string
): Promise<void> {
  const ref = adminDb().collection(NOTIFICATIONS).doc();
  await ref.set({ id: ref.id, uid, type, title, body, read: false, createdAt: FieldValue.serverTimestamp() });
}

export async function listNotifications(uid: string, limit = 30): Promise<NotificationDoc[]> {
  const snap = await adminDb()
    .collection(NOTIFICATIONS)
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data() as NotificationDoc);
}

export async function countUnreadNotifications(uid: string): Promise<number> {
  const snap = await adminDb()
    .collection(NOTIFICATIONS)
    .where("uid", "==", uid)
    .where("read", "==", false)
    .count()
    .get();
  return snap.data().count;
}

export async function markNotificationRead(uid: string, notificationId: string): Promise<void> {
  const ref = adminDb().collection(NOTIFICATIONS).doc(notificationId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Notification not found");
  if (snap.data()?.uid !== uid) throw new Error("Not authorized to modify this notification");
  await ref.update({ read: true });
}

export async function markAllNotificationsRead(uid: string): Promise<void> {
  const snap = await adminDb().collection(NOTIFICATIONS).where("uid", "==", uid).where("read", "==", false).get();
  const batch = adminDb().batch();
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}
