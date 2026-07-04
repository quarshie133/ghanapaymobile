"use client";
import React from "react";
import T from "@/lib/tokens";

interface InputProps {
  label?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  error?: string;
  hint?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
}

export default function Input({
  label, placeholder, type = "text", value, onChange,
  icon, right, error, hint, id, name, disabled,
}: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: T.textSec }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{
            position: "absolute", left: 14, top: "50%",
            transform: "translateY(-50%)",
            color: T.textMuted, fontSize: 15, pointerEvents: "none",
          }}>
            {icon}
          </span>
        )}
        <input
          id={id} name={name} type={type}
          value={value} onChange={onChange}
          placeholder={placeholder} disabled={disabled}
          style={{
            width: "100%", height: 44, borderRadius: 10,
            border: `1.5px solid ${error ? T.error : T.borderVar}`,
            padding: `0 ${right ? 42 : 14}px 0 ${icon ? 42 : 14}px`,
            fontSize: 14, color: T.textPrimary, background: T.white,
            opacity: disabled ? 0.6 : 1,
          }}
        />
        {right && (
          <span style={{
            position: "absolute", right: 14, top: "50%",
            transform: "translateY(-50%)",
            color: T.textMuted, cursor: "pointer",
          }}>
            {right}
          </span>
        )}
      </div>
      {error && <span style={{ fontSize: 12, color: T.error }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: 12, color: T.textMuted }}>{hint}</span>}
    </div>
  );
}
