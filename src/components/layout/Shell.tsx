"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import MobileBottomNav from "./MobileBottomNav";

interface ShellProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export default function Shell({ children, isAdmin = false }: ShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Track viewport so we can correctly toggle sidebar vs drawer
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close drawer when navigating on mobile (route change)
  useEffect(() => {
    if (isMobile) setMobileDrawerOpen(false);
  }, [isMobile]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileDrawerOpen]);

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* ── Mobile Backdrop ── */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-[998] md:hidden"
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Drawer Sidebar ── */}
      <div
        className={`fixed top-0 left-0 h-screen z-[999] transition-transform duration-300 ease-in-out md:hidden ${
          mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile navigation drawer"
      >
        <Sidebar
          isAdmin={isAdmin}
          collapsed={false}
          onToggle={() => setMobileDrawerOpen(false)}
          onNavClick={() => setMobileDrawerOpen(false)}
        />
      </div>

      {/* ── Desktop Sidebar ── */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          isAdmin={isAdmin}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* ── Main Content Pane ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopNav
          isAdmin={isAdmin}
          collapsed={collapsed}
          onMenuToggle={() => {
            if (isMobile) {
              setMobileDrawerOpen((prev) => !prev);
            } else {
              setCollapsed((prev) => !prev);
            }
          }}
        />

        {/* Scrollable content area with proper bottom clearance */}
        <div className="flex-1 overflow-y-auto pt-topnav-height pb-bottom-nav bg-background relative">
          <div className="absolute inset-0 kente-pattern pointer-events-none z-0" />
          <div className="relative z-10 min-h-full">
            {children}
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
}
