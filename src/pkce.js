// src/pkce.js
// Tiny PKCE helper for browser-side apps
// --------------------------------------

/**
 * Create a cryptographically-random URL-safe string.
 * @param {number} length
 */
export function generateRandomString(length = 64) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

/**
 * RFC 7636 code-challenge = BASE64URL(SHA256(verifier))
 * @param {string} verifier
 * @returns {Promise<string>} codeChallenge
 */
export async function generateCodeChallenge(verifier) {
  const data   = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64urlEncode(new Uint8Array(digest));
}

/* — helpers — */
function base64urlEncode(buf) {
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

