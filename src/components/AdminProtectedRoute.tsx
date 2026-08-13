"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

/**
 * IMPORTANT: This guard is a UX convenience only — it hides admin screens
 * from non-admins and redirects them, but a client-side check can always be
 * bypassed (disabled JS, direct API calls, tampered bundle). The real
 * enforcement boundary is Firestore Security Rules, which check
 * `request.auth.uid`'s role on every read/write to admin-only collections
 * (adminActions, auditLogs, kycRecords review fields, etc.) — see
 * firestore.rules and docs/12_Security_Architecture.md.
 */
export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role !== "administrator") {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "administrator") {
    return (
      <div style={{ display: "flex", height: "100vh", width: "100vw", alignItems: "center", justifyContent: "center", background: "#f5f7fa" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 40, height: 40, border: "4px solid rgba(2,2,89,0.1)", borderTop: "4px solid #020259", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <div style={{ color: "#020259", fontWeight: 600, fontSize: 14 }}>Checking permissions...</div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
