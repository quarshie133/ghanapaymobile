"use client";
import React from "react";

interface SectionTitleProps {
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionTitle({ children, action }: SectionTitleProps) {
  return (
    <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
      <h3 className="font-section-title text-section-title text-primary">{children}</h3>
      {action}
    </div>
  );
}

export function Divider() {
  return <div className="h-px bg-border-subtle w-full my-4" />;
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
    <div className="p-4 sm:p-6 md:p-page-padding max-w-[1600px] w-full mx-auto flex-1 flex flex-col gap-6 relative z-10">
      {breadcrumb && (
        <nav className="flex mb-2 text-sm font-medium text-secondary/60">
          <span className="hover:text-primary transition-colors cursor-pointer">Home</span>
          <span className="mx-2">/</span>
          <span className="text-primary font-bold">{breadcrumb}</span>
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-page-title-mobile md:font-page-title text-page-title-mobile md:text-page-title font-bold text-primary">
            {title}
          </h1>
          {subtitle && <p className="text-secondary mt-1 text-sm">{subtitle}</p>}
        </div>
        {action && (
          <div className="flex items-center gap-2">
            {action}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
