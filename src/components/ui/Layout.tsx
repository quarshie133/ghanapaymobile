"use client";
import React from "react";
import T from "@/lib/tokens";

interface SectionTitleProps {
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionTitle({ children, action }: SectionTitleProps) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "center", marginBottom: 16,
      flexWrap: "wrap", gap: 8,
    }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: T.navyMid }}>{children}</h2>
      {action}
    </div>
  );
}

export function Divider() {
  return <div style={{ height: 1, background: T.border, margin: "16px 0" }} />;
}

interface PageWrapProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function PageWrap({ title, subtitle, breadcrumb, action, children }: PageWrapProps) {
  return (
    /* page-wrap-inner — CSS sets padding: 16px on mobile, 32px on desktop */
    <div className="page-wrap-inner" style={{ padding: 32 }}>
      <div style={{ marginBottom: 20 }}>
        {breadcrumb && (
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>{breadcrumb}</div>
        )}
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: 12,
          flexWrap: "wrap",
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.navy, marginBottom: subtitle ? 4 : 0 }}>
              {title}
            </h1>
            {subtitle && <p style={{ fontSize: 14, color: T.textMuted }}>{subtitle}</p>}
          </div>
          {action && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {action}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
