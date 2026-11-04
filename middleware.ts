import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/adminAuth";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/api/admin/login"];

// These two routes are called by the Raiment Android app, not the web admin UI - they carry a
// Firebase ID token in the Authorization header instead of the admin session cookie, and verify
// admin access themselves via requireFirebaseAdmin() (see lib/adminClaim.ts). The cookie check
// below has no way to pass for a mobile caller, so it must not gate these paths.
const MOBILE_FIREBASE_ADMIN_PATHS = ["/api/admin/pricing", "/api/admin/pricing-settings", "/api/admin/reconciliation"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_ADMIN_PATHS.includes(pathname) || MOBILE_FIREBASE_ADMIN_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const authenticated = !!secret && !!token && (await verifySessionToken(token, secret));

  if (!authenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
