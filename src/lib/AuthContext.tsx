"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tier: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      if (pathname === '/callback') {
        setLoading(false);
        return;
      }
      try {
        const data = await api.get('/user/me');
        console.log('AuthContext checkAuth user data:', data);
        const userProfile = data.data || data;
        setUser(userProfile);
      } catch (error: any) {
        if (error.status === 401) {
          fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
          localStorage.removeItem("ghana_pay_access");
          localStorage.removeItem("ghana_pay_refresh");
        }
        if (error.message === 'Failed to fetch') {
          console.warn('⚠️ API Server is offline or unreachable. Please ensure the NestJS backend is running on http://localhost:3001 and CORS is configured.');
        }
        console.error('❌ AuthContext checkAuth failed!');
        console.error('Error Message:', error.message || 'Unknown error');
        if (error.status) console.error('HTTP Status:', error.status);
        if (error.data) console.error('Response Data:', error.data);
        if (error.stack) console.error('Stack Trace:', error.stack);
        
        setUser(null);
        if (pathname !== '/login' && pathname !== '/register' && pathname !== '/callback') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [pathname, router]);

  const login = async (credentials: any) => {
    // Call the Next.js proxy route which sets the HttpOnly cookie
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    
    if (data.accessToken) {
      localStorage.setItem("ghana_pay_access", data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem("ghana_pay_refresh", data.refreshToken);
    }
    
    setUser(data.user);
    router.push('/dashboard');
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem("ghana_pay_access");
    localStorage.removeItem("ghana_pay_refresh");
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
