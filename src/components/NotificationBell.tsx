"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

interface NotificationItem {
  id: string;
  type: "transaction" | "kyc" | "info";
  title: string;
  body: string;
  read: boolean;
  createdAt: any;
}

function timeAgo(ts: any): string {
  const seconds = ts?._seconds ?? ts?.seconds;
  if (typeof seconds !== "number") return "";
  const diffMs = Date.now() - seconds * 1000;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const TYPE_ICON: Record<NotificationItem["type"], string> = {
  transaction: "account_balance_wallet",
  kyc: "verified_user",
  info: "info",
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      const data = res?.data || res;
      setNotifications(data?.notifications || []);
      setUnreadCount(data?.unreadCount || 0);
    } catch {
      // Fail silently — a broken notification fetch shouldn't disrupt the rest of the UI.
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Poll every 30s for new notifications — this app has no real-time
  // (WebSocket/SSE) channel, so this is a simple, honest way to keep the
  // badge reasonably fresh without pretending to be push-based.
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((prev) => !prev);
    if (!open) await fetchNotifications();
  }

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await api.patch(`/notifications/${id}/read`, {});
    } catch {
      // Non-fatal — worst case the badge is slightly stale until next poll.
    }
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await api.post("/notifications/read-all", {});
    } catch {
      // Non-fatal.
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleOpen}
        className="text-on-surface-variant hover:bg-surface-container-low rounded-full p-2 transition-colors flex items-center justify-center relative"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-error rounded-full ring-2 ring-surface text-[9px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-surface-bright rounded-xl shadow-xl border border-border-subtle z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle sticky top-0 bg-surface-bright">
            <span className="font-semibold text-sm text-on-surface">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary font-medium hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {loading && notifications.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-outline">Loading...</div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-outline">No notifications yet.</div>
          )}

          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.read && markRead(n.id)}
              className={`w-full text-left px-4 py-3 border-b border-border-subtle last:border-0 flex gap-3 items-start hover:bg-surface-container-low transition-colors ${
                n.read ? "opacity-60" : ""
              }`}
            >
              <span className="material-symbols-outlined text-[18px] text-primary mt-0.5 shrink-0">
                {TYPE_ICON[n.type] || "info"}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-on-surface truncate">{n.title}</span>
                <span className="block text-xs text-on-surface-variant mt-0.5 line-clamp-2">{n.body}</span>
                <span className="block text-[11px] text-outline mt-1">{timeAgo(n.createdAt)}</span>
              </span>
              {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
