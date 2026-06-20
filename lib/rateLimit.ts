// Per-instance in-memory cooldown to stop a user from double-tapping a
// purchase button. This is a best-effort guard, not the source of truth for
// double-spend protection — the Firestore transaction in the wallet
// deduction is what actually prevents balance from going negative.

const lastRequestAt = new Map<string, number>();

export function isRateLimited(key: string, cooldownMs = 4000): boolean {
  const now = Date.now();
  const last = lastRequestAt.get(key);
  if (last !== undefined && now - last < cooldownMs) {
    return true;
  }
  lastRequestAt.set(key, now);
  return false;
}
