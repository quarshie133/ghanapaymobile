"use client";
import Link from "next/link";
import T from "@/lib/tokens";

interface TopNavProps {
  onMenuToggle: () => void;
  isAdmin?: boolean;
}

export default function TopNav({ onMenuToggle, isAdmin = false }: TopNavProps) {
  return (
    <div style={{
      height: 64, background: T.white, borderBottom: `1px solid ${T.border}`,
      display: "flex", alignItems: "center", padding: "0 24px", gap: 16,
      boxShadow: "0 1px 0 #E8ECF0", flexShrink: 0, zIndex: 5,
    }}>
      {/* Hamburger */}
      <button
        id="sidebar-toggle"
        onClick={onMenuToggle}
        aria-label="Toggle sidebar"
        style={{
          background: "none", border: "none", fontSize: 20,
          cursor: "pointer", color: T.textMuted, padding: 4,
        }}>
        ☰
      </button>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 400, position: "relative" }}>
        <span style={{
          position: "absolute", left: 14, top: "50%",
          transform: "translateY(-50%)", color: T.textMuted, fontSize: 14,
          pointerEvents: "none",
        }}>🔍</span>
        <input
          id="global-search"
          placeholder="Search transactions, contacts… ⌘K"
          style={{
            width: "100%", height: 38, borderRadius: 9999,
            border: `1px solid ${T.border}`, background: T.surfaceLow,
            paddingLeft: 38, paddingRight: 16, fontSize: 13, color: T.textSec,
            outline: "none",
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Notifications */}
      <button
        id="notifications-btn"
        aria-label="Notifications"
        style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", position: "relative" }}>
        🔔
        <span style={{
          position: "absolute", top: -2, right: -2, width: 16, height: 16,
          background: T.error, borderRadius: 9999, fontSize: 9, fontWeight: 700,
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        }}>3</span>
      </button>

      <div style={{ width: 1, height: 24, background: T.border }} />

      {/* User avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9999,
          background: isAdmin ? T.adminAccent : T.navyMid,
          color: "#fff", display: "flex", alignItems: "center",
          justifyContent: "center", fontWeight: 700, fontSize: 13,
        }}>
          {isAdmin ? "EA" : "AO"}
        </div>
        <span style={{ fontSize: 14, fontWeight: 500, color: T.textPrimary }}>
          {isAdmin ? "Esi A." : "Abena O."}
        </span>
        <span style={{ color: T.textMuted }}>▾</span>
      </div>

      {/* Admin / User switch */}
      {!isAdmin ? (
        <Link href="/admin" style={{ textDecoration: "none" }}>
          <button style={{
            background: T.navyMid, color: "#fff", border: "none",
            borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            Admin ↗
          </button>
        </Link>
      ) : (
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <button style={{
            background: T.adminAccent, color: "#fff", border: "none",
            borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            User ↗
          </button>
        </Link>
      )}
    </div>
  );
}
