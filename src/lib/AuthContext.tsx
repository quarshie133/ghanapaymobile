"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "./firebase";
import { getOrCreateUserProfile, type UserProfile, type UserRole } from "./user-profile";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AppUser {
  id: string; // Firebase UID
  name: string;
  phone?: string | null;
  email?: string | null;
  tier: number;
  role: UserRole;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (details: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ─── Constants ────────────────────────────────────────────────────────────────
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/callback", "/admin-login"];

function toAppUser(profile: UserProfile): AppUser {
  return {
    id: profile.uid,
    name: profile.name,
    phone: profile.phone,
    email: profile.email,
    tier: profile.tier,
    role: profile.role,
    avatarUrl: profile.photoURL,
  };
}

/** Maps Firebase Auth error codes to human-readable messages. */
function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact support.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account already exists with this email.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Subscribe to Firebase Auth state. This is the single source of truth —
  // no manual token storage, no localStorage, no silent-refresh timers.
  // Firebase's SDK handles ID-token refresh internally.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setError(null);
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const profile = await getOrCreateUserProfile(firebaseUser);
        setUser(toAppUser(profile));
      } catch (err) {
        console.error("[AuthContext] Failed to load user profile:", err);
        setError("Failed to load your profile. Please try refreshing.");
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Route guard: redirect unauthenticated users away from protected routes,
  // and authenticated users away from auth pages.
  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));
    if (!user && !isPublic) {
      router.replace("/login");
    } else if (user && (pathname === "/login" || pathname === "/register")) {
      router.replace("/dashboard");
    }
  }, [user, loading, pathname, router]);

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged listener above will populate `user`.
    } catch (err: any) {
      const message = friendlyAuthError(err?.code || "");
      setError(message);
      throw new Error(message);
    }
  }, []);

  const register = useCallback(
    async ({ name, email, password, phone }: { name: string; email: string; password: string; phone?: string }) => {
      setError(null);
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateFirebaseProfile(credential.user, { displayName: name });
        await getOrCreateUserProfile(credential.user, { name, phone }); // creates Firestore doc, role="customer"
      } catch (err: any) {
        const message = friendlyAuthError(err?.code || "");
        setError(message);
        throw new Error(message);
      }
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged handles profile creation/lookup.
    } catch (err: any) {
      const message = friendlyAuthError(err?.code || "");
      setError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    await firebaseSignOut(auth);
    router.replace("/login");
  }, [router]);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      const message = friendlyAuthError(err?.code || "");
      setError(message);
      throw new Error(message);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, loginWithGoogle, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
