// Small helpers for reading and validating SvelteKit form-action data.
// CRUD stays plain SvelteKit code (see CLAUDE.md), so these are intentionally
// tiny rather than a validation framework.

/** Trimmed non-empty string, or null when the field is absent/blank. */
export function text(data: FormData, key: string): string | null {
  const value = data.get(key);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Parse a numeric field. Returns `undefined` when blank (field omitted) and
 * `null` when present but not a finite number, so callers can tell "left
 * empty" apart from "typed garbage".
 */
export function number(data: FormData, key: string): number | null | undefined {
  const raw = text(data, key);
  if (raw === null) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/** True when the string is one of the allowed enum values. */
export function isOneOf<T extends string>(value: string | null, allowed: readonly T[]): value is T {
  return value !== null && (allowed as readonly string[]).includes(value);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Loose email sanity check — enough to catch typos, not RFC-complete. */
export function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

/** True for a `YYYY-MM-DD` date that also survives a round-trip parse. */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

/** True for a syntactically valid http(s) URL. */
export function isHttpUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

/** True when a checkbox field was submitted as checked. */
export function checkbox(data: FormData, key: string): boolean {
  return data.get(key) != null;
}
