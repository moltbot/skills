"use strict";
/**
 * Utility Functions for Plan2Meal
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.markdownEscape = markdownEscape;
exports.generateState = generateState;
exports.isValidUrl = isValidUrl;
exports.getDomainFromUrl = getDomainFromUrl;
/**
 * Escape markdown special characters
 */
function markdownEscape(text) {
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
function generateState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
/**
 * Validate URL
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Parse recipe URL and extract domain
 */
function getDomainFromUrl(url) {
    try {
        return new URL(url).hostname;
    }
    catch {
        return 'unknown';
    }
}
//# sourceMappingURL=utils.js.map