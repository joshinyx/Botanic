/** Validates that a string is an http:// or https:// URL. */
export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Trims a string and enforces a maximum byte-safe length. Returns null if empty. */
export function cleanString(
  value: string | null | undefined,
  maxLength: number
): string | null {
  const s = (value ?? "").trim();
  if (!s) return null;
  // Slice at max length (Unicode-safe via spread is expensive; slice is fine for limits >100)
  return s.length > maxLength ? s.slice(0, maxLength) : s;
}

/** Returns a validation error message if the string exceeds limits, or null if OK. */
export function validateField(
  value: string | null | undefined,
  fieldName: string,
  maxLength: number,
  required = false
): string | null {
  const s = (value ?? "").trim();
  if (required && !s) return `${fieldName} is required`;
  if (s.length > maxLength) return `${fieldName} must be at most ${maxLength} characters`;
  return null;
}
