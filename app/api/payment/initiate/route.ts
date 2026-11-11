import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isValidPromoCode } from "@/lib/promo";
import { checkPromoEligibility, getRequestUid, reservePromo } from "@/lib/promoServer";

function corsHeaders(req: NextRequest, origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
  if (origin === req.nextUrl.origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req, req.headers.get("origin")),
  });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(req, origin);

  // Block cross-origin requests — this endpoint is only called from our own checkout page
  if (origin && origin !== req.nextUrl.origin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json() as {
      amount?: unknown;
      customerName?: unknown;
      customerEmail?: unknown;
      customerPhone?: unknown;
      promoCode?: unknown;
    };

    const { amount, customerName, customerEmail, customerPhone, promoCode } = body;

    if (promoCode !== undefined && (typeof promoCode !== "string" || !isValidPromoCode(promoCode))) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 400, headers });
    }

    if (
      typeof amount !== "number" ||
      amount <= 0 ||
      typeof customerName !== "string" ||
      !customerName.trim() ||
      typeof customerEmail !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ||
      typeof customerPhone !== "string" ||
      !customerPhone.trim()
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400, headers }
      );
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500, headers }
      );
    }

    const tx_ref = `raiment-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    // First-order promo: must be a signed-in user with no prior orders / redemption. The
    // reservation ties the discount to this tx_ref so verify can redeem it afterwards.
    if (typeof promoCode === "string") {
      const uid = await getRequestUid(req);
      if (!uid) {
        return NextResponse.json(
          { error: "Please sign in to use a promo code" },
          { status: 401, headers }
        );
      }
      const eligibility = await checkPromoEligibility(uid);
      if (!eligibility.ok) {
        return NextResponse.json(
          { error: eligibility.error },
          { status: eligibility.status, headers }
        );
      }
      const reservation = await reservePromo(uid, tx_ref);
      if (!reservation.ok) {
        return NextResponse.json(
          { error: reservation.error },
          { status: reservation.status, headers }
        );
      }
    }

    // HMAC signature ties the tx_ref to the expected amount server-side
    const signature = createHmac("sha256", secretKey)
      .update(`${tx_ref}:${amount}`)
      .digest("hex");

    return NextResponse.json({ tx_ref, amount, signature }, { status: 200, headers });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers }
    );
  }
}
