"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import MobileBottomNav from "./MobileBottomNav";
import T from "@/lib/tokens";

interface ShellProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export default function Shell({ children, isAdmin = false }: ShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", position: "relative" }}>

      {/* ── Mobile backdrop overlay ── */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 2, 89, 0.55)",
            backdropFilter: "blur(2px)",
            zIndex: 200,
          }}
        />
      )}

      {/* ── Mobile drawer sidebar ── */}
      {mobileDrawerOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            zIndex: 201,
            display: "flex",
            flexDirection: "column",
            animation: "slideInLeft 0.25s ease-out",
          }}
        >
          <Sidebar
            isAdmin={isAdmin}
            collapsed={false}
            onToggle={() => setMobileDrawerOpen(false)}
            onNavClick={() => setMobileDrawerOpen(false)}
          />
        </div>
      )}

      {/* ── Desktop sidebar (hidden on mobile via CSS) ── */}
      <div className="sidebar-desktop" style={{ display: "flex", flexShrink: 0 }}>
        <Sidebar
          isAdmin={isAdmin}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </div>

      {/* ── Main content area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <TopNav
          isAdmin={isAdmin}
          onMenuToggle={() => {
            // Desktop: collapse sidebar
            setCollapsed((c) => !c);
            // Mobile: open drawer
            setMobileDrawerOpen((o) => !o);
          }}
        />
        <div
          className="page-content-wrap"
          style={{ flex: 1, overflowY: "auto", background: T.surfaceLow }}
        >
          {children}
        </div>
      </div>

      {/* ── Mobile bottom nav (CSS hides it on desktop) ── */}
      <MobileBottomNav />
    </div>
  );
}
