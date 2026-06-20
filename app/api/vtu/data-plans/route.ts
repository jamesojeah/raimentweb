import { NextRequest, NextResponse } from "next/server";
import { loadPublicDataPlans } from "@/lib/vtu/orders";

export async function GET(req: NextRequest) {
  const network = req.nextUrl.searchParams.get("network");
  if (!network) {
    return NextResponse.json({ error: "Missing 'network' query param" }, { status: 400 });
  }

  try {
    const plans = await loadPublicDataPlans(network);
    return NextResponse.json({ plans });
  } catch (err) {
    console.error("[/api/vtu/data-plans] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
