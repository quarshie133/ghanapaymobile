"use client";
import React from "react";

interface SectionTitleProps {
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionTitle({ children, action }: SectionTitleProps) {
  return (
    <div className="flex justify-between items-center mb-4 sm:mb-6 flex-wrap gap-2">
      <h3 className="text-base sm:text-section-title font-semibold sm:font-section-title text-primary leading-tight">
        {children}
      </h3>
      {action}
    </div>
  );
}

export function Divider() {
  return <div className="h-px bg-border-subtle w-full my-3 sm:my-4" />;
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
    <div className="p-3 sm:p-5 md:p-page-padding max-w-[1600px] w-full mx-auto flex-1 flex flex-col gap-4 sm:gap-6 relative z-10">
      {/* Breadcrumb */}
      {breadcrumb && (
        <nav className="flex mb-1 text-xs sm:text-sm font-medium text-secondary/60">
          <span className="hover:text-primary transition-colors cursor-pointer">Home</span>
          <span className="mx-2">/</span>
          <span className="text-primary font-bold">{breadcrumb}</span>
        </nav>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] sm:text-[24px] md:text-page-title font-bold text-primary leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-secondary mt-0.5 text-xs sm:text-sm leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="flex items-center gap-2 shrink-0">
            {action}
          </div>
        )}
      </div>

      {/* Page body */}
      {children}
    </div>
  );
}
