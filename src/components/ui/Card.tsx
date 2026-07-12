"use client";
import React from "react";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  id?: string;
}

export default function Card({ children, style, className = "", onClick, id }: CardProps) {
  const hasBg = className.split(' ').some(c => c.startsWith('bg-'));
  const hasBorder = className.split(' ').some(c => c.startsWith('border-') || c === 'border-none');
  const bgClass = hasBg ? '' : 'bg-surface-container-lowest';
  const borderClass = hasBorder ? '' : 'border border-border-subtle';

  return (
    <div
      id={id}
      onClick={onClick}
      style={style}
      className={`${bgClass} ${borderClass} rounded-xl p-card-padding shadow-sm relative overflow-hidden transition-all duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

