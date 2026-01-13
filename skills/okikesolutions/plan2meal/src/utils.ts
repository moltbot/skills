/**
 * Utility Functions for Plan2Meal
 */

/**
 * Escape markdown special characters
 */
export function markdownEscape(text: string): string {
  const escapeChars = [
    '*',
    '_',
    '`',
    '[',
    ']',
    '(',
    ')',
    '~',
    '>',
    '#',
    '+',
    '-',
    '=',
    '|',
    '{',
    '}',
    '.',
    '!',
  ];
  let escaped = text;
  for (const char of escapeChars) {
    escaped = escaped.split(char).join(`\\${char}`);
  }
  return escaped;
}

/**
 * Generate random state string for OAuth
 */
export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse recipe URL and extract domain
 */
export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}
