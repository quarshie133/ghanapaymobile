"use client";
import React from 'react';
import { useAuth } from '@/lib/AuthContext';

export default function DashboardProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '4px solid rgba(2,2,89,0.1)', borderTop: '4px solid #020259', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ color: '#020259', fontWeight: 600, fontSize: 14 }}>Authenticating...</div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // AuthContext will handle redirect
  }

  return <>{children}</>;
}
