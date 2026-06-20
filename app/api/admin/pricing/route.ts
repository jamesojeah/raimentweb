import { NextRequest, NextResponse } from "next/server";
import { listAllDataPlans, updateDataPlanSellingPrice } from "@/lib/vtu/orders";
import { getPrimaryDataProvider } from "@/lib/data-providers";
import { requireFirebaseAdmin } from "@/lib/adminClaim";

export async function GET(req: NextRequest) {
  const admin = await requireFirebaseAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const plans = await listAllDataPlans();
    const primaryProvider = getPrimaryDataProvider().name;

    const rows = plans.map((plan) => ({
      planId: plan.id,
      network: plan.network,
      planName: plan.planName,
      planType: plan.planType,
      peyflexCost: plan.peyflexCost,
      cheapDataHubCost: plan.cheapdatahubCost,
      primaryProvider,
      sellingPrice: plan.sellingPrice,
    }));

    return NextResponse.json({ plans: rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load pricing" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireFirebaseAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const { planId, sellingPrice } = (await req.json()) as { planId?: unknown; sellingPrice?: unknown };
    if (typeof planId !== "string" || !planId || typeof sellingPrice !== "number" || !Number.isFinite(sellingPrice) || sellingPrice < 0) {
      return NextResponse.json({ success: false, error: "Invalid planId or sellingPrice" }, { status: 400 });
    }

    await updateDataPlanSellingPrice(planId, sellingPrice);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update price" },
      { status: 500 }
    );
  }
}
