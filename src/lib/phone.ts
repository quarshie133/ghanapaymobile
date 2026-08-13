/**
 * Normalizes Ghanaian phone numbers to a single canonical form (local
 * 0XXXXXXXXX, 10 digits) so lookups work regardless of how the number was
 * typed — "024 123 4567", "0241234567", "+233241234567", "233241234567"
 * all normalize to the same value. Used both at registration (to store
 * `phoneNormalized` on the user profile) and at recipient lookup time, so
 * the two sides always match.
 *
 * Pure function, no Firebase imports — safe to use from both client and
 * server code.
 */
export function normalizeGhanaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  if (digits.startsWith("233") && digits.length === 12) {
    return "0" + digits.slice(3);
  }
  if (digits.length === 9) {
    // Missing leading 0, e.g. "241234567" → "0241234567"
    return "0" + digits;
  }
  return digits; // already 10-digit local format (or unrecognized — stored as-is)
}

export function isValidGhanaPhone(raw: string): boolean {
  const normalized = normalizeGhanaPhone(raw);
  return /^0\d{9}$/.test(normalized);
}
