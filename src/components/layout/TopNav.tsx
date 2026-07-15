"use client";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { getInitials } from "@/lib/utils";

interface TopNavProps {
  onMenuToggle: () => void;
  isAdmin?: boolean;
  collapsed?: boolean;
}

export default function TopNav({ onMenuToggle, isAdmin = false, collapsed = false }: TopNavProps) {
  const { user } = useAuth();
  
  return (
    <header className={`fixed top-0 right-0 h-topnav-height w-full bg-surface border-b border-border-subtle shadow-sm flex justify-between items-center px-gutter z-30 transition-all duration-200 ${
      collapsed ? 'md:w-[calc(100%-72px)]' : 'md:w-[calc(100%-240px)]'
    }`}>
      {/* Menu Toggle Icon */}
      <div className="flex items-center">
        <button
          onClick={onMenuToggle}
          className="text-on-surface-variant p-2 rounded-full hover:bg-surface-container"
          aria-label="Toggle Menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="font-page-title-mobile text-page-title-mobile font-bold text-primary ml-2 md:hidden">
          GhanaPay
        </span>
      </div>

      {/* Search Input (Desktop) */}
      <div className="hidden md:block flex-1 max-w-md">
        <div className="relative flex items-center bg-surface-container-low rounded-full px-4 py-2 w-96">
          <span className="material-symbols-outlined text-secondary mr-2">search</span>
          <input
            type="text"
            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-outline outline-none"
            placeholder="Search transactions, bills, or users..."
          />
        </div>
      </div>

      {/* Trailing Actions */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        {/* Support Link */}
        <button className="text-on-surface-variant hover:bg-surface-container-low rounded-full p-2 transition-transform scale-95 active:scale-90 flex items-center justify-center relative">
          <span className="material-symbols-outlined text-[24px]">help</span>
        </button>

        {/* Notifications */}
        <button className="text-on-surface-variant hover:bg-surface-container-low rounded-full p-2 transition-transform scale-95 active:scale-90 flex items-center justify-center relative">
          <span className="material-symbols-outlined text-[24px]">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-surface"></span>
        </button>

        <div className="h-8 w-px bg-border-subtle mx-2 hidden sm:block"></div>

        {/* Admin/User Role Switch (Desktop Only) */}
        <div className="hidden sm:block">
          {!isAdmin ? (
            <Link href="/admin">
              <button className="bg-primary-container text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary transition-all duration-200 flex items-center gap-1.5">
                Admin <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </Link>
          ) : (
            <Link href="/dashboard">
              <button className="bg-admin-accent text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-600 transition-all duration-200 flex items-center gap-1.5">
                User <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </Link>
          )}
        </div>

        {/* User Info & Avatar */}
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-primary">
              {user?.name || "Abena Mansa"}
            </p>
            <p className="text-[10px] text-secondary">
              {isAdmin ? "GhanaPay Admin" : "Enterprise Super User"}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-surface-container-low cursor-pointer hover:border-primary-fixed-dim transition-colors shrink-0">
            <img
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDS0pO9Md9GDfUJJLfTxzTq2I4fsw2wkw7kvU42uq21tNlEBwgtQkKBtMoFc_fAYkjM6dzvQUklpPZIU1R_kfLdI1C_z4a_YHZ3d9yYucjvCJAgDdjJI3LUmJtYqrYnNQ8aGva9emmigPqjaNSmuamGyo-omGuOSdNMw0FChIVNe3I4SvGa5yJZJu8YSVsv0_vN2SbeLRn8SaGPmWNvYBT3jxIQNxJdQmPu-OTACg_bNB-kBLvlSRoGx2OSa6wp_bSZNIxh919lPHc"
              alt={user?.name || "User Avatar"}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
