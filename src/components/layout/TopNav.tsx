"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import Avatar from "@/components/ui/Avatar";
import NotificationBell from "@/components/layout/NotificationBell";

interface TopNavProps {
  onMenuToggle: () => void;
  isAdmin?: boolean;
  collapsed?: boolean;
}

export default function TopNav({ onMenuToggle, isAdmin = false, collapsed = false }: TopNavProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 h-topnav-height bg-surface border-b border-border-subtle shadow-sm flex justify-between items-center px-3 sm:px-gutter z-30 transition-all duration-200
        w-full
        md:left-auto
        ${collapsed ? "md:w-[calc(100%-72px)]" : "md:w-[calc(100%-240px)]"}
      `}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* ── Left: Menu + Brand ── */}
      <div className="flex items-center gap-1 min-w-0">
        <button
          onClick={onMenuToggle}
          className="text-on-surface-variant p-2 rounded-full hover:bg-surface-container active:bg-surface-container-high transition-colors shrink-0"
          aria-label="Toggle Menu"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>
        <span className="font-page-title-mobile text-page-title-mobile font-bold text-primary md:hidden truncate max-w-[140px]">
          GhanaPay
        </span>
      </div>

      {/* ── Center: Search (Desktop only) ── */}
      <div className="hidden md:block flex-1 max-w-md mx-4">
        <div className="relative flex items-center bg-surface-container-low rounded-full px-4 py-2 w-80 lg:w-96">
          <span className="material-symbols-outlined text-secondary mr-2 text-[20px]">search</span>
          <input
            type="text"
            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-outline outline-none"
            placeholder="Search transactions, bills..."
          />
        </div>
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
        {/* Help */}
        <button
          className="text-on-surface-variant hover:bg-surface-container-low rounded-full p-2 transition-colors flex items-center justify-center"
          aria-label="Help"
        >
          <span className="material-symbols-outlined text-[22px]">help</span>
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* Divider (sm+) */}
        <div className="h-7 w-px bg-border-subtle mx-1 hidden sm:block" />

        {/* Admin/User Switch — desktop only */}
        <div className="hidden sm:block">
          {/* Only show the Admin switch to actual administrators — every
              user used to see this button and get bounced right back by
              AdminProtectedRoute if they clicked it, which was confusing
              UX (not a security hole, since the redirect was always
              correctly enforced, but pointless for ~everyone who saw it). */}
          {!isAdmin && user?.role === "administrator" ? (
            <Link href="/admin">
              <button className="bg-primary-container text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap">
                Admin <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </Link>
          ) : isAdmin ? (
            <Link href="/dashboard">
              <button className="bg-admin-accent text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-600 transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap">
                User <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </Link>
          ) : null}
        </div>

        {/* Avatar + dropdown menu */}
        <div ref={menuRef} className="relative flex items-center gap-2 pl-1">
          {/* Name (sm+) */}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-primary leading-tight">
              {user?.name?.split(" ")[0] || "Abena"}
            </p>
            <p className="text-[10px] text-secondary leading-tight">
              {isAdmin ? "Admin" : "User"}
            </p>
          </div>
          {/* Avatar image — click opens the menu */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded-full overflow-hidden border-2 border-surface-container-low cursor-pointer hover:border-primary-fixed-dim transition-colors shrink-0"
            aria-label="Account menu"
          >
            <Avatar name={user?.name} photoURL={user?.avatarUrl} size={36} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface-bright rounded-xl shadow-xl border border-border-subtle z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border-subtle">
                <p className="text-sm font-semibold text-on-surface truncate">{user?.name || "GhanaPay User"}</p>
                <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">settings</span>
                Settings
              </Link>
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  await logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-surface-container-low transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
