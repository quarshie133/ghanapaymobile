"use client";
import React from "react";
import T from "@/lib/tokens";

type BadgeType = "success" | "error" | "warning" | "info" | "default" | "gold" | "navy";

interface BadgeProps {
  label: string;
  type?: BadgeType;
}

const badgeMap: Record<BadgeType, { bg: string; color: string }> = {
  success: { bg: T.successBg, color: T.success },
  error:   { bg: T.errorBg,   color: T.error   },
  warning: { bg: T.warningBg, color: T.warning  },
  info:    { bg: T.infoBg,    color: T.info     },
  default: { bg: T.border,    color: T.textSec  },
  gold:    { bg: "#FBF3D9",   color: T.goldDark },
  navy:    { bg: "#e0e0ff",   color: T.navy     },
};

export default function Badge({ label, type = "default" }: BadgeProps) {
  const { bg, color } = badgeMap[type] ?? badgeMap.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: bg, color,
      fontSize: 11, fontWeight: 600,
      padding: "3px 10px", borderRadius: 9999, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}
