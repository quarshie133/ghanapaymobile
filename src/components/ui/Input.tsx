"use client";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  error?: string;
  hint?: string;
}

export default function Input({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  icon,
  right,
  error,
  hint,
  id,
  name,
  disabled,
  className = "",
  ...rest
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-semibold text-on-surface-variant flex items-center gap-2"
        >
          {icon && <span className="flex items-center shrink-0">{icon}</span>}
          {label}
        </label>
      )}
      <div className="relative w-full">
        {!icon && label === undefined && icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-[44px] rounded-xl border bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all duration-200 font-sidebar-label placeholder:text-outline-variant ${
            icon ? "pl-10" : "pl-4"
          } ${right ? "pr-10" : "pr-4"} ${
            error ? "border-error" : "border-border-subtle"
          } ${disabled ? "opacity-50 cursor-not-allowed bg-surface-container" : ""} ${className}`}
          {...rest}
        />
        {right && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-all duration-200 cursor-pointer flex items-center justify-center">
            {right}
          </span>
        )}
      </div>
      {error && <span className="text-xs text-error font-medium">{error}</span>}
      {hint && !error && <span className="text-xs text-secondary">{hint}</span>}
    </div>
  );
}

