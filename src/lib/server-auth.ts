import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "./firebase-admin";
import type { UserRole } from "./user-profile";

export class AuthRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface AuthedRequestContext {
  uid: string;
  role: UserRole;
}

/**
 * Verifies the Firebase ID token on an incoming request's Authorization
 * header and (optionally) checks the caller's Firestore role. This is the
 * ONLY place that should decide who a request is from — never trust a uid,
 * role, or amount sent in the request body itself for anything that
 * touches money.
 *
 * Throws AuthRequestError(401) if there's no valid token, or (403) if
 * `requiredRole` is set and the caller doesn't have it.
 */
export async function requireAuth(request: Request, requiredRole?: UserRole): Promise<AuthedRequestContext> {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    throw new AuthRequestError(401, "Missing bearer token");
  }

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(token);
  } catch (err: any) {
    // Log the REAL reason server-side — the client only ever sees a generic
    // "Invalid or expired token" (don't leak internals to the browser), but
    // that made this basically undebuggable before. Common real causes:
    // project-ID mismatch between the client's Firebase config and the
    // Admin SDK's service account, a malformed FIREBASE_ADMIN_PRIVATE_KEY,
    // or an actually-expired/tampered token.
    console.error("[requireAuth] Token verification failed:", err?.code || err?.message || err);
    throw new AuthRequestError(401, "Invalid or expired token");
  }

  const uid = decoded.uid;

  if (requiredRole) {
    const snap = await adminDb().collection("users").doc(uid).get();
    const role = (snap.exists ? snap.data()?.role : null) as UserRole | null;
    if (role !== requiredRole) {
      throw new AuthRequestError(403, `Requires role: ${requiredRole}`);
    }
    return { uid, role };
  }

  // Role not required for this route — still fetch it for convenience/logging,
  // defaulting to "customer" if the profile doc doesn't exist yet.
  const snap = await adminDb().collection("users").doc(uid).get();
  const role = ((snap.exists ? snap.data()?.role : null) as UserRole | null) || "customer";
  return { uid, role };
}

/** Standard error → NextResponse mapping for route handler catch blocks. */
export function authErrorResponse(err: unknown) {
  if (err instanceof AuthRequestError) {
    return NextResponse.json({ success: false, message: err.message }, { status: err.status });
  }
  console.error("[api] Unexpected error:", err);
  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}
