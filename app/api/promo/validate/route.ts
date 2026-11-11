import { NextRequest, NextResponse } from "next/server";
import { PROMO_PERCENT, isValidPromoCode } from "@/lib/promo";
import { checkPromoEligibility, getRequestUid } from "@/lib/promoServer";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let promoCode: unknown;
  try {
    ({ promoCode } = (await req.json()) as { promoCode?: unknown });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof promoCode !== "string" || !isValidPromoCode(promoCode)) {
    return NextResponse.json({ error: "That promo code isn't valid" }, { status: 400 });
  }

  const uid = await getRequestUid(req);
  if (!uid) {
    return NextResponse.json({ error: "Please sign in to use a promo code" }, { status: 401 });
  }

  const eligibility = await checkPromoEligibility(uid);
  if (!eligibility.ok) {
    return NextResponse.json({ error: eligibility.error }, { status: eligibility.status });
  }

  return NextResponse.json({ valid: true, percent: PROMO_PERCENT });
}
