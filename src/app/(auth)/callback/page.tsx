"use client";

import React, { useEffect, Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * CallbackHandler — executed after Google redirects to /callback?accessToken=...&refreshToken=...
 *
 * Sequence:
 * 1. Extract tokens from URL (exactly once — Strict Mode guard via ref)
 * 2. Persist tokens to localStorage (synchronous)
 * 3. Fetch /user/me with the new access token
 * 4. Call setUser() on AuthContext → triggers route guard → navigates to /dashboard
 *
 * NOTE: AuthProvider's initAuth detects /callback path and immediately sets
 * loading=false without racing this handler.
 */
function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  // Strict Mode guard: useRef persists across double-invoke, useState does not
  const executed = useRef(false);

  console.log('[Callback] CallbackHandler RENDER', {
    executed: executed.current,
    hasSearchParams: !!searchParams,
    setUserIsNoop: setUser.toString() === '() => {}',
  });

  useEffect(() => {
    if (executed.current) {
      console.log('[Callback] useEffect: SKIPPED (Strict Mode remount guard)');
      return;
    }
    executed.current = true;

    console.log('[Callback] useEffect: RUNNING (execution #1)');

    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    console.log('[Callback] tokens from URL', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenPrefix: accessToken ? accessToken.substring(0, 20) + '...' : null,
    });

    if (!accessToken || !refreshToken) {
      console.error('[Callback] Missing tokens in URL → error state');
      setStatus("error");
      setTimeout(() => router.replace("/login?error=auth_failed"), 2000);
      return;
    }

    // ── Step 1: Persist tokens synchronously ────────────────────────────────
    localStorage.setItem("ghana_pay_access", accessToken);
    localStorage.setItem("ghana_pay_refresh", refreshToken);
    console.log('[Callback] Tokens saved to localStorage');

    // ── Step 1b: Also update the HttpOnly session cookie ────────────────────
    // This replaces any stale cookie from a previous phone/email login.
    // The backend guard prioritizes Bearer token, but replacing the cookie
    // ensures consistency for any cookie-reliant paths.
    fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: accessToken }),
    }).then(() => {
      console.log('[Callback] Session cookie updated');
    }).catch((err) => {
      console.warn('[Callback] Session cookie update failed (non-fatal):', err?.message);
    });

    // ── Step 2: Fetch user profile ───────────────────────────────────────────
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('[Callback] /user/me request timed out after 8s');
      controller.abort();
    }, 8000);

    console.log('[Callback] Fetching /user/me...');

    fetch(`${API_URL}/user/me`, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
    })
      .then((res) => {
        console.log('[Callback] /user/me response status:', res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        const profile = json?.data ?? json;
        console.log('[Callback] /user/me SUCCESS, calling setUser()', {
          userId: profile?.id,
          userName: profile?.name,
        });

        // ── Step 3: Hydrate AuthContext directly ─────────────────────────────
        setUser(profile);

        console.log('[Callback] setUser() called → navigating to /dashboard');
        // ── Step 4: Navigate — route guard in AuthProvider will also fire ────
        router.replace("/dashboard");
      })
      .catch((err) => {
        console.error('[Callback] /user/me FAILED, falling back to window.location', err?.message);
        // Tokens are saved — hard reload triggers initAuth which will succeed
        window.location.replace("/dashboard");
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps + executed ref = guaranteed single execution

  if (status === "error") {
    return (
      <div style={{ textAlign: "center", color: "#e74c3c", marginTop: 24 }}>
        <p style={{ fontWeight: 600 }}>Authentication failed.</p>
        <p style={{ fontSize: 13, marginTop: 4 }}>Redirecting to login…</p>
      </div>
    );
  }

  return null;
}

export default function CallbackPage() {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: "4px solid rgba(2, 2, 89, 0.12)",
            borderTop: "4px solid #020259",
            borderRadius: "50%",
            margin: "0 auto 24px",
            animation: "spin 0.85s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <h2 style={{ color: "#020259", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          Signing you in…
        </h2>
        <p style={{ color: "#8a9bae", fontSize: 14 }}>
          Please wait while we securely log you into GhanaPay.
        </p>

        <Suspense fallback={null}>
          <CallbackHandler />
        </Suspense>
      </div>
    </div>
  );
}
