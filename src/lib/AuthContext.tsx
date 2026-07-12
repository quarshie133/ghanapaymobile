"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { api, API_URL, ApiError } from './api';
import { useRouter, usePathname } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  tier: number;
  role?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { phone: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  setUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

// ─── Constants ────────────────────────────────────────────────────────────────
const PUBLIC_PATHS = ['/login', '/register', '/callback', '/forgot-password'];

// ─── Token Helpers ─────────────────────────────────────────────────────────────
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ghana_pay_access');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ghana_pay_refresh');
}

function clearTokens(): void {
  localStorage.removeItem('ghana_pay_access');
  localStorage.removeItem('ghana_pay_refresh');
}

/** Decode JWT payload client-side (no signature verification). */
function decodeJwt(token: string): { exp?: number } | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

/** True if the token expires within the next 60 seconds. */
function isTokenExpired(token: string): boolean {
  const decoded = decodeJwt(token);
  if (!decoded?.exp) return true;
  // Consider expired if less than 60 seconds remaining
  return decoded.exp * 1000 - Date.now() < 60 * 1000;
}

/**
 * Fetch with a hard timeout. Throws if the request takes longer than `ms`.
 */
async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

/** Silent token refresh — returns new access token string or null. */
async function silentRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetchWithTimeout(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    // Backend wraps in { success, data: { accessToken } } via ResponseInterceptor
    const newToken = data?.data?.accessToken ?? data?.accessToken;
    if (newToken) {
      localStorage.setItem('ghana_pay_access', newToken);
      return newToken;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Timer ref for proactive token refresh
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guard against Strict Mode double-invoke
  const initRan = useRef(false);
  // Effect execution counter for debugging
  const effectCountRef = useRef(0);

  /** Schedule a proactive silent refresh before the token expires. */
  const scheduleRefresh = useCallback((token: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const decoded = decodeJwt(token);
    if (!decoded?.exp) return;
    // Refresh 90 seconds before expiry
    const delay = decoded.exp * 1000 - Date.now() - 90 * 1000;
    if (delay <= 0) return;

    refreshTimerRef.current = setTimeout(async () => {
      const newToken = await silentRefresh();
      if (newToken) {
        scheduleRefresh(newToken);
      } else {
        clearTokens();
        setUserState(null);
        router.replace('/login');
      }
    }, delay);
  }, [router]);

  // ── One-time auth initialisation ──────────────────────────────────────────
  useEffect(() => {
    // Strict Mode guard: initAuth must only run once per real mount
    if (initRan.current) {
      console.log('[AuthCtx] initAuth SKIPPED — already ran (Strict Mode remount)');
      return;
    }
    initRan.current = true;
    effectCountRef.current += 1;
    const runId = effectCountRef.current;

    const initAuth = async () => {
      const token = getAccessToken();
      const refresh = getRefreshToken();
      console.log(`[AuthCtx #${runId}] initAuth START`, {
        route: pathname,
        hasToken: !!token,
        hasRefresh: !!refresh,
        loading: true,
        user: null,
      });

      // On the callback page, the callback handler owns state — don't race it
      if (pathname.startsWith('/callback')) {
        console.log(`[AuthCtx #${runId}] On /callback page — deferring to CallbackHandler`);
        setLoading(false);
        return;
      }

      try {
        let activeToken = token;

        if (!activeToken) {
          console.log(`[AuthCtx #${runId}] No token → unauthenticated`);
          return; // finally will setLoading(false)
        }

        if (isTokenExpired(activeToken)) {
          console.log(`[AuthCtx #${runId}] Token expired → silent refresh`);
          const refreshed = await silentRefresh();
          if (!refreshed) {
            console.log(`[AuthCtx #${runId}] Silent refresh failed → clearing tokens`);
            clearTokens();
            return;
          }
          activeToken = refreshed;
          console.log(`[AuthCtx #${runId}] Silent refresh OK`);
        }

        console.log(`[AuthCtx #${runId}] Calling /user/me`);
        const data = await api.get('/user/me');
        const profile = data?.data ?? data;
        console.log(`[AuthCtx #${runId}] /user/me SUCCESS`, { userId: profile?.id });
        setUserState(profile);
        scheduleRefresh(activeToken);

      } catch (err: any) {
        console.error(`[AuthCtx #${runId}] /user/me ERROR`, err?.message ?? err);
        if (err instanceof ApiError && err.status === 401) {
          const refreshed = await silentRefresh();
          if (refreshed) {
            try {
              const data = await api.get('/user/me');
              setUserState(data?.data ?? data);
              scheduleRefresh(refreshed);
              return;
            } catch {
              // second attempt failed
            }
          }
          clearTokens();
        } else if (err?.message === 'Failed to fetch' || err?.name === 'AbortError') {
          console.warn('[AuthCtx] Backend unreachable. Tokens preserved.');
        } else {
          console.error('[AuthCtx] Auth init error:', err?.message ?? err);
        }
      } finally {
        console.log(`[AuthCtx #${runId}] initAuth DONE → setLoading(false)`);
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty — runs exactly once

  // ── Route guard ───────────────────────────────────────────────────────────
  // NOTE: depends on [loading, user] only — NOT pathname, to avoid looping on every navigation
  // Pathname is read directly from the hook (always current) — not listed as dep
  useEffect(() => {
    if (loading) {
      console.log('[AuthCtx] routeGuard: loading=true, skipping');
      return;
    }

    const isPublic = PUBLIC_PATHS.some(
      p => pathname === p || pathname.startsWith(p + '?') || pathname.startsWith(p + '/')
    );

    console.log('[AuthCtx] routeGuard EVAL', {
      route: pathname,
      loading,
      authenticated: !!user,
      userId: user?.id ?? null,
      isPublic,
      tokenExists: !!getAccessToken(),
    });

    if (!isPublic && !user) {
      console.log('[AuthCtx] routeGuard: protected route, no user → /login');
      router.replace('/login');
    } else if (isPublic && user && pathname !== '/callback' && !pathname.startsWith('/callback')) {
      console.log('[AuthCtx] routeGuard: public route, user exists → /dashboard');
      router.replace('/dashboard');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]); // Deliberately excludes pathname and router to prevent redirect loops

  // ── setUser (for OAuth callback page) ─────────────────────────────────────
  const setUser = useCallback((u: User | null) => {
    console.log('[AuthCtx] setUser() called', { userId: u?.id ?? null });
    if (u) {
      setUserState(u);
    } else {
      clearTokens();
      setUserState(null);
    }
  }, []);

  // ── Phone/Email Login ──────────────────────────────────────────────────────
  const login = useCallback(async (credentials: { phone: string; password: string }) => {
    console.log('[AuthCtx] login() called');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    if (data.accessToken) {
      localStorage.setItem('ghana_pay_access', data.accessToken);
      scheduleRefresh(data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('ghana_pay_refresh', data.refreshToken);
    }

    // Prefer fetching the full profile over using the stub from login response
    try {
      const profile = await api.get('/user/me');
      setUserState(profile?.data ?? profile);
    } catch {
      setUserState(data.user ?? null);
    }

    router.replace('/dashboard');
  }, [router, scheduleRefresh]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    console.log('[AuthCtx] logout() called');
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    clearTokens();
    setUserState(null);
    router.replace('/login');
  }, [router]);

  // Render log
  console.log('[AuthCtx] RENDER', {
    route: pathname,
    loading,
    authenticated: !!user,
    userId: user?.id ?? null,
    tokenExists: !!getAccessToken(),
  });

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
