import { ref, uploadBytes } from "firebase/storage";
import { storage, auth } from "./firebase";

/**
 * Uploads a KYC document directly to Firebase Storage at
 * kyc/{uid}/{docType}.{ext} — enforced by storage.rules to be writable only
 * by the signed-in owner, max 10MB, image or PDF only.
 *
 * IMPORTANT: this deliberately does NOT call getDownloadURL(). Firebase's
 * default download URLs embed a token that bypasses Security Rules for
 * anyone holding the link — using one here would violate "KYC documents
 * MUST NOT be publicly accessible." Instead we store only the storage
 * *path* in Firestore; an admin views the document via a short-lived
 * signed URL generated server-side with the Admin SDK
 * (see src/app/api/kyc/document-url/route.ts), which never exposes a
 * permanent public link.
 */
export async function uploadKycDocument(docType: string, file: File): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to upload documents.");

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File is too large. Maximum size is 10MB.");
  }
  if (!/^image\/|^application\/pdf$/.test(file.type)) {
    throw new Error("Only images or PDF files are accepted.");
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `kyc/${uid}/${docType}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });

  return path; // NOT a download URL — just the storage path
}
