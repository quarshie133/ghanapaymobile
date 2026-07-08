"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import T from "@/lib/tokens";

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      // Typically the AuthContext would handle token persistence (localStorage/cookies)
      // We simulate it here if setTokens isn't explicitly exposed:
      localStorage.setItem("ghana_pay_access", accessToken);
      localStorage.setItem("ghana_pay_refresh", refreshToken);
      
      // Since AuthContext doesn't have setTokens, we just redirect.
      // Next time apiFetch runs, it should ideally grab this from localStorage.
      window.location.href = "/dashboard";
    } else {
      router.push("/login?error=auth_failed");
    }
  }, [searchParams, router, setTokens]);

  return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: T.white }}>
      <div style={{ textAlign: "center" }}>
        <div className="spinner" style={{ width: 40, height: 40, border: `4px solid ${T.navy}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 20px" }} />
        <h2 style={{ color: T.navy, marginBottom: 8 }}>Authenticating...</h2>
        <p style={{ color: T.textMuted }}>Please wait while we log you into GhanaPay.</p>
      </div>
    </div>
  );
}
