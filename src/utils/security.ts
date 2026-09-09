// src/utils/security.ts
// Security & sanitization helpers to prevent XSS, script injection, and open redirect vulnerabilities

/**
 * Checks if a string contains ASCII control characters (U+0000 - U+001F, U+007F).
 * Avoids control regex to eliminate ReDoS and linter warnings.
 */
function hasControlCharacters(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if ((code >= 0 && code <= 31) || code === 127) {
      return true;
    }
  }
  return false;
}

/**
 * Strips dangerous control characters while preserving standard whitespace (newlines, tabs).
 */
function stripControlCharacters(str: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // Disallow 0-8, 11-12, 14-31, 127. (Permit \t = 9, \n = 10, \r = 13)
    if ((code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127) {
      continue;
    }
    result += str[i];
  }
  return result;
}

/**
 * Validates whether an external URL is safe to render as a clickable link.
 * Strictly permits only 'http:' and 'https:' protocols.
 * Rejects javascript:, data:, vbscript:, file:, blob:, and malformed URIs.
 */
export function isSafeUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;

  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 2048) return false;

  // Reject control characters
  if (hasControlCharacters(trimmed)) return false;

  // Reject dangerous protocol strings
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:')
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    try {
      if (!trimmed.includes('://') && /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed)) {
        const fallbackParsed = new URL(`https://${trimmed}`);
        return fallbackParsed.protocol === 'https:';
      }
    } catch {
      return false;
    }
    return false;
  }
}

/**
 * Normalizes an external link into a safe, valid HTTPS/HTTP URL.
 * Returns null if the URL cannot be safely verified.
 */
export function sanitizeExternalLink(url?: string | null): string | null {
  if (!isSafeUrl(url)) return null;

  const trimmed = (url || '').trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.href;
  } catch {
    if (!trimmed.includes('://') && /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed)) {
      try {
        const parsed = new URL(`https://${trimmed}`);
        return parsed.href;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Sanitizes user text input by removing dangerous control characters,
 * stripping potential HTML/script tags, and enforcing maximum length limits.
 */
export function sanitizeTextInput(input?: string | null, maxLength = 500): string {
  if (!input || typeof input !== 'string') return '';

  const withoutControlChars = stripControlCharacters(input);
  return withoutControlChars
    .replace(/<[^>]*>/g, '') // strip any HTML tags
    .trim()
    .slice(0, maxLength);
}
