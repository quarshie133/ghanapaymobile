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
  primary:   { background: T.navyMid, color: "#fff", boxShadow: `0 2px 8px ${T.navyMid}30` },
  secondary: { background: "transparent", border: `1.5px solid ${T.navyMid}`, color: T.navyMid },
  ghost:     { background: T.surfaceLow, color: T.navyMid },
  gold:      { background: T.gold, color: T.navy, boxShadow: `0 2px 8px ${T.gold}40` },
  success:   { background: T.success, color: "#fff", boxShadow: `0 2px 8px ${T.success}30` },
  danger:    { background: T.error, color: "#fff", boxShadow: `0 2px 8px ${T.error}30` },
  admin:     { background: T.adminAccent, color: "#fff", boxShadow: `0 2px 8px ${T.adminAccent}40` },
};

export default function Btn({
  children, variant = "primary", size = "md",
  onClick, disabled, style, icon, type = "button", id,
}: BtnProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontWeight: 600,
    borderRadius: 10,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.18s ease",
    border: "none",
    fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14,
    padding:
      size === "sm" ? "7px 14px" :
      size === "lg" ? "14px 26px" :
                      "10px 18px",
    letterSpacing: 0.1,
    whiteSpace: "nowrap" as const,
  };

  return (
    <button id={id} type={type} disabled={disabled} onClick={onClick}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
      }}
      onMouseLeave={e => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.opacity = "1";
      }}
    >
      {icon && <span style={{ display: "flex", alignItems: "center", fontSize: size === "sm" ? 13 : 15 }}>{icon}</span>}
      {children}
    </button>
  );
}
