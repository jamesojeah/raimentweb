import { NextRequest, NextResponse } from "next/server";
import { listAllDataPlans, updateDataPlanFeatured, updateDataPlanSellingPrice } from "@/lib/vtu/orders";
import { selectProvidersForDataPlan } from "@/lib/data-providers";
import { computeMargin, computeWorstCaseCost, getPricingSettings, isFailoverReady } from "@/lib/vtu/pricingSettings";
import { requireFirebaseAdmin } from "@/lib/adminClaim";

export async function GET(req: NextRequest) {
  const admin = await requireFirebaseAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [plans, settings] = await Promise.all([listAllDataPlans(), getPricingSettings()]);

    // primaryProvider mirrors deliverData()'s actual per-plan choice (cheapest
    // usable provider wins). margin uses the OPPOSITE - the worst-case
    // (failover-safe) cost - so a price that looks profitable here still is
    // after a real failover to the pricier provider.
    const rows = plans.map((plan) => {
      const worstCaseCost = computeWorstCaseCost(plan.cheapdatahubCost, plan.peyflexCost);
      return {
        planId: plan.id,
        network: plan.network,
        planName: plan.planName,
        planType: plan.planType,
        dataAmount: plan.dataAmount,
        peyflexCost: plan.peyflexCost,
        cheapDataHubCost: plan.cheapdatahubCost,
        primaryProvider: selectProvidersForDataPlan(plan).primary,
        sellingPrice: plan.sellingPrice,
        validityGroup: plan.validityGroup,
        featured: plan.featured,
        failoverReady: isFailoverReady(plan.peyflexPlanId, plan.peyflexCost),
        worstCaseCost,
        margin: computeMargin(plan.sellingPrice, worstCaseCost, settings),
      };
    });

    return NextResponse.json({ plans: rows, feePercent: settings.feePercent, vatPercent: settings.vatPercent });
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
    const body = (await req.json()) as { planId?: unknown; sellingPrice?: unknown; featured?: unknown };
    const { planId, sellingPrice, featured } = body;

    if (typeof planId !== "string" || !planId) {
      return NextResponse.json({ success: false, error: "Invalid planId" }, { status: 400 });
    }

    if (sellingPrice !== undefined) {
      if (typeof sellingPrice !== "number" || !Number.isFinite(sellingPrice) || sellingPrice < 0) {
        return NextResponse.json({ success: false, error: "Invalid sellingPrice" }, { status: 400 });
      }
      await updateDataPlanSellingPrice(planId, sellingPrice);
    }

    if (featured !== undefined) {
      if (typeof featured !== "boolean") {
        return NextResponse.json({ success: false, error: "Invalid featured" }, { status: 400 });
      }
      await updateDataPlanFeatured(planId, featured);
    }

    if (sellingPrice === undefined && featured === undefined) {
      return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update plan" },
      { status: 500 }
    );
  }
}
