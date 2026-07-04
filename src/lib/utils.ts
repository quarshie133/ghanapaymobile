/** Format a number as a GHS cedis amount */
export function formatCurrency(amount: number, showSign = false): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (showSign) return `${amount >= 0 ? "+" : "-"}₵${formatted}`;
  return `₵${formatted}`;
}

/** Get initials from a name string */
export function getInitials(name: string, maxLen = 2): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, maxLen)
    .toUpperCase();
}

/** Truncate a string with ellipsis */
export function truncate(str: string, max = 32): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

/** Clamp a number between min and max */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}
