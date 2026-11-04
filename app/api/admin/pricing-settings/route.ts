import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseAdmin } from "@/lib/adminClaim";
import { getPricingSettings, updatePricingSettings } from "@/lib/vtu/pricingSettings";

export async function GET(req: NextRequest) {
  const admin = await requireFirebaseAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settings = await getPricingSettings();
    return NextResponse.json(settings);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load pricing settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireFirebaseAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json()) as { feePercent?: unknown; vatPercent?: unknown };
    const { feePercent, vatPercent } = body;

    if (feePercent !== undefined && (typeof feePercent !== "number" || !Number.isFinite(feePercent) || feePercent < 0)) {
      return NextResponse.json({ success: false, error: "Invalid feePercent" }, { status: 400 });
    }
    if (vatPercent !== undefined && (typeof vatPercent !== "number" || !Number.isFinite(vatPercent) || vatPercent < 0)) {
      return NextResponse.json({ success: false, error: "Invalid vatPercent" }, { status: 400 });
    }

    const settings = await updatePricingSettings({
      feePercent: feePercent as number | undefined,
      vatPercent: vatPercent as number | undefined,
    });
    return NextResponse.json({ success: true, ...settings });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update pricing settings" },
      { status: 500 }
    );
  }
}
