import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

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

function secureCompare(a: string, b: string): boolean {
  // Both are HMAC-SHA256 hex strings so length is always equal (64 chars),
  // but guard defensively.
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
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
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json() as {
      transaction_id?: unknown;
      tx_ref?: unknown;
      expectedAmount?: unknown;
      signature?: unknown;
    };

    const { transaction_id, tx_ref, expectedAmount, signature } = body;

    if (
      !transaction_id ||
      typeof tx_ref !== "string" ||
      typeof expectedAmount !== "number" ||
      expectedAmount <= 0 ||
      typeof signature !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid fields" },
        { status: 400, headers }
      );
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500, headers }
      );
    }

    // Verify HMAC signature — ensures the expectedAmount was set by our server
    // during /api/payment/initiate and hasn't been tampered with client-side.
    const expectedSig = createHmac("sha256", secretKey)
      .update(`${tx_ref}:${expectedAmount}`)
      .digest("hex");

    if (!secureCompare(expectedSig, signature)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment signature" },
        { status: 400, headers }
      );
    }

    // Verify transaction with Flutterwave using SECRET key (server-side only)
    const flwRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!flwRes.ok) {
      return NextResponse.json(
        { success: false, message: "Could not reach payment provider" },
        { headers }
      );
    }

    const flwData = await flwRes.json() as {
      status: string;
      data: {
        status: string;
        currency: string;
        amount: number;
        id: number;
        tx_ref: string;
        flw_ref: string;
        customer: { name: string; email: string; phone_number: string };
      };
    };

    if (flwData.status !== "success" || flwData.data?.status !== "successful") {
      return NextResponse.json(
        { success: false, message: "Payment was not successful" },
        { headers }
      );
    }

    if (flwData.data.currency !== "NGN") {
      return NextResponse.json(
        { success: false, message: "Invalid payment currency" },
        { headers }
      );
    }

    // Confirm Flutterwave charged at least the expected amount
    if (flwData.data.amount < expectedAmount) {
      return NextResponse.json(
        { success: false, message: "Payment amount does not match order total" },
        { headers }
      );
    }

    return NextResponse.json({ success: true, data: flwData.data }, { headers });
  } catch {
    return NextResponse.json(
      { success: false, message: "Payment verification failed" },
      { status: 500, headers }
    );
  }
}
