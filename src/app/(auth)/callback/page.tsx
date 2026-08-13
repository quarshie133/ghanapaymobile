"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

/**
 * Legacy route kept for backward compatibility with any old bookmarked links
 * from the previous custom-JWT OAuth redirect flow. Google sign-in now uses
 * Firebase's signInWithPopup (see AuthContext.loginWithGoogle), which never
 * navigates here — so this page just forwards based on current auth state.
 */
export default function CallbackPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [user, loading, router]);

  return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 48, height: 48, border: "4px solid rgba(2, 2, 89, 0.12)", borderTop: "4px solid #020259",
            borderRadius: "50%", margin: "0 auto 24px", animation: "spin 0.85s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <h2 style={{ color: "#020259", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Redirecting…</h2>
      </div>
    </div>
  );
}
