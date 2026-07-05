"use client";
import React from "react";
import T from "@/lib/tokens";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  padding?: number;
  id?: string;
}

export default function Card({ children, style, className, onClick, padding = 20, id }: CardProps) {
  return (
    <div id={id} className={className} onClick={onClick} style={{
      background: T.white,
      borderRadius: 16,
      padding,
      border: `1px solid ${T.border}`,
      boxShadow: "0 1px 4px rgba(27,31,107,0.07), 0 0 1px rgba(27,31,107,0.05)",
      position: "relative",
      ...style,
    }}>
      {children}
    </div>
  );
}
