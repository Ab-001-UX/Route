const getSecret = (): string => {
  const secret = process.env.TOKEN_SIGNING_SECRET;
  if (!secret) {
    throw new Error('TOKEN_SIGNING_SECRET is not configured in environment variables');
  }
  return secret;
};

/**
 * Generates a random, cryptographically secure token string (plaintext).
 * Compatible with both Node and Convex.
 */
export function generateToken(): string {
  const array = new Uint8Array(32);
  globalThis.crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes an HMAC-SHA256 hash of a plaintext token using standard Web Crypto.
 * This runs natively in both Next.js and Convex V8 runtimes.
 */
export async function hashToken(token: string): Promise<string> {
  const secret = getSecret();
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(token);

  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    messageData
  );

  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join("");
}
