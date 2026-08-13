"use client";
import React, { useState } from "react";

interface AvatarProps {
  name?: string | null;
  photoURL?: string | null;
  size?: number;
  className?: string;
}

/** Deterministic color from a name so the same person always gets the same fallback color. */
const PALETTE = ["#020259", "#1E7B9E", "#8E44AD", "#cea62c", "#2E8B57", "#C0392B"];
function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

/**
 * Shows the user's real photo (e.g. their Google account photo, populated
 * automatically by Firebase Auth into `photoURL` on Google sign-in) when
 * available. Falls back to an initials avatar in a name-derived color when
 * there's no photo — e.g. accounts created via email/password, which Google
 * never gives us a picture for.
 */
export default function Avatar({ name, photoURL, size = 36, className = "" }: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = photoURL && !imgFailed;

  if (showImage) {
    return (
      <img
        src={photoURL}
        alt={name || "User avatar"}
        onError={() => setImgFailed(true)}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer" // Google-hosted photos can 403 without this
      />
    );
  }

  const bg = colorForName(name || "?");
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 text-white font-bold ${className}`}
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.4 }}
      title={name || "User"}
    >
      {initials(name)}
    </div>
  );
}
