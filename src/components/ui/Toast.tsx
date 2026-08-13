"use client";
import { useEffect } from "react";
import T from "@/lib/tokens";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

const icons: Record<ToastType, string> = {
  success: "✓",
  error:   "✕",
  info:    "ℹ",
};

const colors: Record<ToastType, string> = {
  success: T.success,
  error:   T.error,
  info:    T.info,
};

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="toast-enter" style={{
      position: "fixed", top: 80, right: 20, zIndex: 9999,
      background: T.white, borderRadius: 12, padding: "14px 20px",
      boxShadow: "0 8px 32px rgba(27,31,107,0.18)",
      display: "flex", alignItems: "center", gap: 12,
      borderLeft: `4px solid ${colors[type]}`,
      minWidth: 320, maxWidth: 420,
    }}>
      <span style={{ fontSize: 18, color: colors[type] }}>{icons[type]}</span>
      <span style={{ fontSize: 14, color: T.textPrimary, flex: 1 }}>{message}</span>
      <span
        role="button" aria-label="Dismiss" onClick={onClose}
        style={{ cursor: "pointer", color: T.textMuted, fontSize: 18 }}>
        ✕
      </span>
    </div>
  );
}
