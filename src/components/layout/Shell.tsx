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
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

      {/* ── Mobile drawer backdrop ── */}
      {mobileDrawerOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
          style={{ zIndex: 200 }}
        />
      )}

      {/* ── Sidebar (desktop fixed, mobile drawer) ── */}
      <div
        className="sidebar-desktop"
        style={
          /* On mobile, becomes a fixed overlay drawer */
          mobileDrawerOpen
            ? {
                position: "fixed",
                top: 0,
                left: 0,
                height: "100vh",
                zIndex: 201,
                display: "flex",
                animation: "slideInLeft 0.25s ease-out",
              }
            : {}
        }
      >
        <Sidebar
          isAdmin={isAdmin}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          onNavClick={() => setMobileDrawerOpen(false)}
        />
      </div>

      {/* Mobile drawer (separate from sidebar-desktop so it's always rendered) */}
      {mobileDrawerOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            zIndex: 201,
            display: "flex",
          }}
          className="mobile-only"
        >
          <Sidebar
            isAdmin={isAdmin}
            collapsed={false}
            onToggle={() => setMobileDrawerOpen(false)}
            onNavClick={() => setMobileDrawerOpen(false)}
          />
        </div>
      )}

      {/* ── Main content area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <TopNav
          isAdmin={isAdmin}
          onMenuToggle={() => {
            setCollapsed((c) => !c);
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

      {/* ── Mobile bottom nav ── */}
      <MobileBottomNav />
    </div>
  );
}
