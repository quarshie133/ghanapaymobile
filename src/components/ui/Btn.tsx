"use client";
import React from "react";
import T from "@/lib/tokens";

type BtnVariant = "primary" | "secondary" | "ghost" | "gold" | "success" | "danger" | "admin";
type BtnSize = "sm" | "md" | "lg";

interface BtnProps {
  children?: React.ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  id?: string;
}

const variants: Record<BtnVariant, React.CSSProperties> = {
  primary:   { background: T.navyMid, color: "#fff" },
  secondary: { background: "transparent", border: `1.5px solid ${T.navyMid}`, color: T.navyMid },
  ghost:     { background: "transparent", color: T.navyMid },
  gold:      { background: T.gold, color: T.navy },
  success:   { background: T.success, color: "#fff" },
  danger:    { background: T.error, color: "#fff" },
  admin:     { background: T.adminAccent, color: "#fff" },
};

export default function Btn({
  children, variant = "primary", size = "md",
  onClick, disabled, style, icon, type = "button", id,
}: BtnProps) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 8,
    fontWeight: 600, borderRadius: 10,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.15s", border: "none",
    fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14,
    padding: size === "sm" ? "8px 14px" : size === "lg" ? "14px 24px" : "10px 18px",
  };

  return (
    <button id={id} type={type} disabled={disabled} onClick={onClick}
      style={{ ...base, ...variants[variant], ...style }}>
      {icon && <span style={{ fontSize: size === "sm" ? 14 : 16 }}>{icon}</span>}
      {children}
    </button>
  );
}
