"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

interface NavItem {
  group?: string;
  key?: string;
  href?: string;
  iconName?: string;
  label?: string;
  badge?: string;
  badgeType?: "error" | "gold";
}

const USER_NAV: NavItem[] = [
  { key: "dashboard",     href: "/dashboard",      iconName: "dashboard", label: "Dashboard" },
  { key: "analytics",     href: "/analytics",      iconName: "monitoring", label: "Analytics" },
  { key: "send-money",    href: "/send-money",     iconName: "send",  label: "Send" },
  { key: "bulk",          href: "/bulk-payments",  iconName: "layers",  label: "Bulk", badge: "Biz", badgeType: "gold" },
  { key: "bills",         href: "/bill-payments",  iconName: "receipt_long", label: "Bills" },
  { key: "airtime",       href: "/airtime",        iconName: "smartphone", label: "Airtime" },
  { key: "scheduled",     href: "/scheduled",      iconName: "event_repeat", label: "Scheduled" },
  { key: "wallet",        href: "/wallet",         iconName: "account_balance_wallet", label: "Wallet" },
  { key: "history",       href: "/history",        iconName: "history", label: "Transactions" },
  { key: "statements",    href: "/statements",     iconName: "description", label: "Statements" },
  { key: "settings",      href: "/settings",       iconName: "settings", label: "Settings" },
];

const ADMIN_NAV: NavItem[] = [
  { key: "admin",         href: "/admin",                iconName: "dashboard", label: "Overview" },
  { key: "users",         href: "/admin/users",          iconName: "group", label: "User Management" },
  { key: "kyc-queue",     href: "/admin/kyc",            iconName: "verified_user", label: "KYC Queue", badge: "47", badgeType: "error" },
  { key: "transactions",  href: "/admin/transactions",   iconName: "credit_card", label: "Transactions" },
  { key: "fraud",         href: "/admin/fraud",          iconName: "warning", label: "Fraud Alerts", badge: "3", badgeType: "error" },
  { key: "reports",       href: "/admin/reports",        iconName: "description", label: "Reports" },
];

interface SidebarProps {
  isAdmin?: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onNavClick?: () => void;
}

export default function Sidebar({ isAdmin = false, collapsed, onToggle, onNavClick }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const navItems = isAdmin ? ADMIN_NAV : USER_NAV;

  return (
    <aside className={`h-screen bg-sidebar-light border-r border-border-subtle flex flex-col py-gutter z-50 transition-all duration-200 ${collapsed ? 'w-[72px]' : 'w-sidebar-width'}`}>
      {/* Brand logo */}
      <div className="px-6 mb-8 flex flex-col shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            account_balance
          </span>
          {!collapsed && (
            <span className="font-page-title text-page-title font-bold text-primary transition-opacity duration-200">
              GhanaPay
            </span>
          )}
        </div>
        {!collapsed && (
          <span className="text-xs text-secondary mt-1 font-medium tracking-wide uppercase">
            Enterprise Portal
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-1 custom-scrollbar px-2">
        {navItems.map((item) => {
          const isActive = item.href
            ? item.href === "/dashboard" || item.href === "/admin"
              ? pathname === item.href
              : pathname.startsWith(item.href)
            : false;

          return (
            <Link key={item.key} href={item.href!} onClick={onNavClick} className="no-underline block">
              <div
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-sidebar-active-light text-primary border-l-4 border-primary font-bold"
                    : "text-secondary hover:bg-surface-container"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.iconName}
                </span>
                {!collapsed && (
                  <span className="font-sidebar-label text-sidebar-label whitespace-nowrap">
                    {item.label}
                  </span>
                )}
                {!collapsed && item.badge && (
                  <span
                    className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      item.badgeType === "error"
                        ? "bg-error-container text-error"
                        : "bg-tertiary-fixed text-tertiary"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="mt-auto px-2 pt-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 text-secondary hover:bg-surface-container px-4 py-3 transition-colors duration-200 font-sidebar-label text-sidebar-label rounded-lg text-left"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
