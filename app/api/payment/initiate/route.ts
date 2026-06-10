import { createHmac } from "crypto";
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
    };

    const { amount, customerName, customerEmail, customerPhone } = body;

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
