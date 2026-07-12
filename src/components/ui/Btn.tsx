"use client";
import React from "react";

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
  className?: string;
}

const variantClasses: Record<BtnVariant, string> = {
  primary:   "bg-primary text-white hover:bg-primary-container shadow-md shadow-primary/20",
  secondary: "border border-border-subtle bg-surface-container-lowest text-secondary hover:bg-surface-container-low",
  ghost:     "bg-surface text-primary hover:bg-surface-container",
  gold:      "bg-tertiary text-white hover:bg-[#584400] shadow-md",
  success:   "bg-success text-white hover:bg-green-700 shadow-md",
  danger:    "bg-error text-white hover:bg-red-700 shadow-md",
  admin:     "bg-admin-accent text-white hover:bg-blue-600 shadow-md",
};

const sizeClasses: Record<BtnSize, string> = {
  sm: "px-3 py-1.5 rounded-lg text-xs font-semibold",
  md: "px-5 py-2.5 rounded-xl text-nav-link font-semibold",
  lg: "px-6 py-3.5 rounded-xl text-md font-bold",
};

export default function Btn({
  children, variant = "primary", size = "md",
  onClick, disabled, style, icon, type = "button", id, className = "",
}: BtnProps) {
  return (
    <button
      id={id}
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] outline-none ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {icon && <span className="flex items-center shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
