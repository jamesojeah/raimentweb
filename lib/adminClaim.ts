import type { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

/**
 * Verifies the caller is an admin via the Firestore `users/{uid}.admin` field (an int, 1 =
 * admin) - the same flag the rest of the app (product management, dashboard, settings) already
 * gates on, so there's one admin flag instead of a separate custom-claim system nothing else
 * uses. This is the real security boundary for /api/admin/pricing and
 * /api/admin/reconciliation - the Raiment app's client-side AdminAccess gate only hides the
 * entry point and must not be trusted on its own.
 */
export async function requireFirebaseAdmin(req: NextRequest): Promise<{ uid: string } | null> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) return null;

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const snap = await getAdminDb().collection("users").doc(decoded.uid).get();
    if (snap.data()?.admin === 1) {
      return { uid: decoded.uid };
    }
    return null;
  } catch {
    return null;
  }
}
