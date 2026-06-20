// Edge-compatible (uses Web Crypto only — no Node "crypto" module) so this
// can be shared between middleware (Edge runtime) and API routes (Node runtime).

export const ADMIN_SESSION_COOKIE = "raiment_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12; // 12 hours
export const SESSION_DURATION_SECONDS = SESSION_DURATION_MS / 1000;

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return bufferToHex(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function createSessionToken(secret: string): Promise<string> {
  const expiry = Date.now() + SESSION_DURATION_MS;
  const sig = await hmac(secret, String(expiry));
  return `${expiry}.${sig}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  const [expiryStr, sig] = token.split(".");
  if (!expiryStr || !sig) return false;

  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  const expectedSig = await hmac(secret, expiryStr);
  return timingSafeEqual(sig, expectedSig);
}
