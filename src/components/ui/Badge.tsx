"use client";
import React from "react";

type BadgeType = "success" | "error" | "warning" | "info" | "default" | "gold" | "navy";

interface BadgeProps {
  label: string;
  type?: BadgeType;
}

const badgeClassMap: Record<BadgeType, string> = {
  success: "bg-[#E5F5ED] text-[#1E8449]",
  error:   "bg-error-container text-error",
  warning: "bg-[#FFF4E5] text-[#D35400]",
  info:    "bg-[#EBF0FF] text-primary",
  default: "bg-surface-variant text-secondary",
  gold:    "bg-tertiary-fixed text-tertiary",
  navy:    "bg-primary-fixed text-primary",
};

export default function Badge({ label, type = "default" }: BadgeProps) {
  const badgeClass = badgeClassMap[type] ?? badgeClassMap.default;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full font-badge text-badge gap-1 whiteSpace-nowrap ${badgeClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {label}
    </span>
  );
}
