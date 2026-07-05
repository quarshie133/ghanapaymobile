"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Badge from "@/components/ui/Badge";
import T from "@/lib/tokens";
import {
  FaHouse,
  FaChartSimple,
  FaPaperPlane,
  FaCloudArrowUp,
  FaReceipt,
  FaCalendarDays,
  FaWallet,
  FaClockRotateLeft,
  FaFileCsv,
  FaShieldHalved,
  FaGear,
  FaGaugeHigh,
  FaUsers,
  FaUserCheck,
  FaCreditCard,
  FaTriangleExclamation,
  FaClipboardList
} from "react-icons/fa6";

interface NavItem {
  group?: string;
  key?: string;
  href?: string;
  icon?: React.ComponentType<any>;
  label?: string;
  badge?: string;
  badgeType?: "error" | "gold";
}

const USER_NAV: NavItem[] = [
  { group: "OVERVIEW" },
  { key: "dashboard",     href: "/dashboard",      icon: FaHouse, label: "Dashboard" },
  { key: "analytics",     href: "/analytics",      icon: FaChartSimple, label: "Analytics" },
  { group: "PAYMENTS" },
  { key: "send-money",    href: "/send-money",     icon: FaPaperPlane,  label: "Send Money" },
  { key: "bulk",          href: "/bulk-payments",  icon: FaCloudArrowUp,  label: "Bulk Payments", badge: "Biz", badgeType: "gold" },
  { key: "bills",         href: "/bill-payments",  icon: FaReceipt, label: "Bill Payments" },
  { key: "scheduled",     href: "/scheduled",      icon: FaCalendarDays, label: "Scheduled" },
  { group: "WALLET" },
  { key: "wallet",        href: "/wallet",         icon: FaWallet, label: "Wallet & Accounts" },
  { group: "HISTORY" },
  { key: "history",       href: "/history",        icon: FaClockRotateLeft, label: "Transactions" },
  { key: "statements",    href: "/statements",     icon: FaFileCsv, label: "Statements" },
  { group: "ACCOUNT" },
  { key: "kyc",           href: "/kyc",            icon: FaShieldHalved,  label: "KYC Verification" },
  { key: "settings",      href: "/settings",       icon: FaGear,  label: "Settings" },
];

const ADMIN_NAV: NavItem[] = [
  { key: "admin",         href: "/admin",                icon: FaGaugeHigh, label: "Overview" },
  { key: "users",         href: "/admin/users",          icon: FaUsers, label: "User Management" },
  { key: "kyc-queue",     href: "/admin/kyc",            icon: FaUserCheck, label: "KYC Queue", badge: "47", badgeType: "error" },
  { key: "transactions",  href: "/admin/transactions",   icon: FaCreditCard, label: "Transactions" },
  { key: "fraud",         href: "/admin/fraud",          icon: FaTriangleExclamation, label: "Fraud Alerts", badge: "3", badgeType: "error" },
  { key: "reports",       href: "/admin/reports",        icon: FaClipboardList, label: "Reports" },
];

interface SidebarProps {
  isAdmin?: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onNavClick?: () => void;
}

export default function Sidebar({ isAdmin = false, collapsed, onToggle, onNavClick }: SidebarProps) {
  const pathname = usePathname();
  const navItems = isAdmin ? ADMIN_NAV : USER_NAV;
  const sidebarW = collapsed ? 72 : 240;

  const bg = isAdmin ? T.adminBg : T.sidebarBg;
  const borderColor = isAdmin ? "#1e2544" : T.border;
  const textColor = isAdmin ? "#94A3B8" : T.textSec;
  const activeTextColor = isAdmin ? "#fff" : T.navyMid;
  const activeBg = isAdmin ? "#1E2544" : T.sidebarActive;
  const activeAccent = isAdmin ? T.adminAccent : T.navyMid;

  return (
    <div style={{
      width: sidebarW,
      minWidth: sidebarW,
      height: "100%",           /* ← fill parent height fully */
      transition: "width 0.2s",
      background: bg,
      borderRight: `1px solid ${borderColor}`,
      display: "flex",
      flexDirection: "column",
      overflowX: "hidden",      /* ← only clip horizontal, not vertical */
      overflowY: "hidden",
      position: "relative",
      zIndex: 10,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        height: 64, display: "flex", alignItems: "center",
        padding: "0 20px", borderBottom: `1px solid ${borderColor}`,
        gap: 10, flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: isAdmin ? T.adminAccent : T.navyMid,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0,
        }}>₵</div>
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: 16, color: isAdmin ? "#fff" : T.navy, whiteSpace: "nowrap" }}>
            GhanaPay
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 0", background: bg }}>
        {navItems.map((item, i) => {
          if (item.group) {
            if (collapsed) return null;
            return (
              <div key={i} style={{
                padding: "16px 16px 4px", fontSize: 11, fontWeight: 700,
                color: isAdmin ? "#475569" : T.textMuted, letterSpacing: "0.08em",
              }}>
                {item.group}
              </div>
            );
          }
          const isActive = item.href
            ? item.href === "/dashboard" || item.href === "/admin"
              ? pathname === item.href
              : pathname.startsWith(item.href!)
            : false;

          return (
            <Link key={item.key} href={item.href!} style={{ textDecoration: "none" }} onClick={onNavClick}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: collapsed ? "11px 22px" : "11px 14px",
                margin: "1px 8px", borderRadius: 10, cursor: "pointer",
                background: isActive ? activeBg : "transparent",
                borderLeft: isActive ? `3px solid ${activeAccent}` : "3px solid transparent",
                transition: "all 0.12s",
                color: isActive ? activeTextColor : textColor,
              }}>
                <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  {item.icon && <item.icon size={18} strokeWidth={2.2} />}
                </span>
                {!collapsed && (
                  <>
                    <span style={{
                      fontSize: 13, fontWeight: isActive ? 600 : 400,
                      flex: 1, whiteSpace: "nowrap", color: isActive ? activeTextColor : textColor,
                    }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <Badge label={item.badge} type={item.badgeType ?? "default"} />
                    )}
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Card */}
      {!collapsed && (
        <div style={{
          borderTop: `1px solid ${borderColor}`,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: bg,          /* ← match sidebar bg, no colour gap */
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9999,
            background: isAdmin ? T.adminAccent : T.navyMid,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {isAdmin ? "EA" : "AO"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: isAdmin ? "#fff" : T.navy,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {isAdmin ? "Esi Amankwah" : "Abena Owusu"}
            </div>
            <div style={{ fontSize: 11, color: isAdmin ? "#94A3B8" : T.textMuted }}>
              {isAdmin ? "Compliance Admin" : "Personal Account"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
