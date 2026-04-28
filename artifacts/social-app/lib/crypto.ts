/**
 * Basic encryption utility for message content.
 *
 * IMPORTANT: This is a demonstration implementation using a simple XOR cipher.
 * In a production environment, this MUST be replaced with a robust end-to-end
 * encryption library (e.g., Signal Protocol, libsignal) and proper key management.
 */

const KEY = "parallaxa-secure-msg-key-2025";

export function encrypt(text: string): string {
  if (!text) return "";
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length));
  }
  // Return as pseudo-hex for "encrypted" look
  return btoa(result);
}

export function decrypt(cipherText: string): string {
  if (!cipherText) return "";
  try {
    const text = atob(cipherText);
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length));
    }
    return result;
  } catch (e) {
    return cipherText; // Fallback to raw text if not valid base64
  }
}
