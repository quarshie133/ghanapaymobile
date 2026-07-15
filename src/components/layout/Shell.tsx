"use client";
import React, { useState } from "react";
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

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Mobile Backdrop */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-[998] md:hidden"
        />
      )}

      {/* Sidebar Drawer on Mobile */}
      <div
        className={`fixed top-0 left-0 h-screen z-[999] transition-transform duration-300 md:hidden ${
          mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          isAdmin={isAdmin}
          collapsed={false}
          onToggle={() => setMobileDrawerOpen(false)}
          onNavClick={() => setMobileDrawerOpen(false)}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          isAdmin={isAdmin}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopNav
          isAdmin={isAdmin}
          collapsed={collapsed}
          onMenuToggle={() => {
            if (typeof window !== "undefined" && window.innerWidth >= 768) {
              setCollapsed(!collapsed);
            } else {
              setMobileDrawerOpen(!mobileDrawerOpen);
            }
          }}
        />
        <div className="flex-1 overflow-y-auto pt-topnav-height bg-background relative">
          <div className="absolute inset-0 kente-pattern pointer-events-none z-0"></div>
          <div className="relative z-10 min-h-full">
            {children}
          </div>
        </div>
      </div>

      {/* Bottom Nav for mobile devices */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
}
