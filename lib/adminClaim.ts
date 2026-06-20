import type { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";

/**
 * Verifies the caller is an admin via their Firebase ID token's "admin" custom claim, falling
 * back to a comma-separated UID allowlist (ADMIN_ALLOWLISTED_UIDS env var) for use before the
 * claim is set on any account. This is the real security boundary for /api/admin/pricing and
 * /api/admin/reconciliation - the Raiment app's client-side AdminAccess gate only hides the entry
 * point and must not be trusted on its own.
 */
export async function requireFirebaseAdmin(req: NextRequest): Promise<{ uid: string } | null> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) return null;

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const allowlist = (process.env.ADMIN_ALLOWLISTED_UIDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (decoded.admin === true || allowlist.includes(decoded.uid)) {
      return { uid: decoded.uid };
    }
    return null;
  } catch {
    return null;
  }
}
