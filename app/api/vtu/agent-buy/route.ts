import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rateLimit";
import { createTransaction, getProviderCost, loadDataPlan } from "@/lib/vtu/orders";
import {
  InsufficientBalanceError,
  chargeWallet,
  getUserIsSubAgent,
  refundWallet,
  verifyFirebaseIdToken,
} from "@/lib/vtuWallet";
import { getPrimaryDataProvider } from "@/lib/data-providers";
import { deliverData } from "@/lib/data-providers/deliver";
import type { VtuTransactionType } from "@/types/vtu";

function agentAirtimeDiscountRate(): number {
  const percent = Number(process.env.AGENT_AIRTIME_DISCOUNT_PERCENT ?? "0");
  return Number.isFinite(percent) && percent > 0 ? percent / 100 : 0;
}

interface AgentBuyBody {
  firebaseIdToken?: unknown;
  type?: unknown;
  network?: unknown;
  planId?: unknown;
  amount?: unknown;
  phone?: unknown;
}

export async function POST(req: NextRequest) {
  let body: AgentBuyBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { firebaseIdToken, type, network, planId, amount, phone } = body;

  if (
    typeof firebaseIdToken !== "string" ||
    !firebaseIdToken ||
    (type !== "data" && type !== "airtime") ||
    typeof network !== "string" ||
    !network ||
    typeof phone !== "string" ||
    !phone
  ) {
    return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
  }

  let userId: string;
  try {
    userId = await verifyFirebaseIdToken(firebaseIdToken);
  } catch (err) {
    console.error("[/api/vtu/agent-buy] token verification failed:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited(`vtu-agent-buy:${userId}`)) {
    return NextResponse.json({ error: "Too many requests, please wait" }, { status: 429 });
  }

  let isSubAgent: boolean;
  try {
    isSubAgent = await getUserIsSubAgent(userId);
  } catch (err) {
    console.error("[/api/vtu/agent-buy] failed to load user:", err);
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!isSubAgent) {
    return NextResponse.json({ error: "This endpoint is for sub-agents only" }, { status: 403 });
  }

  const txType = type as VtuTransactionType;
  let price: number;
  let resolvedPlanId: string | null = null;
  let resolvedPlanName: string | null = null;

  if (txType === "data") {
    if (typeof planId !== "string" || !planId) {
      return NextResponse.json({ error: "Missing 'planId' for data purchase" }, { status: 400 });
    }
    const plan = await loadDataPlan(planId);
    if (!plan || !plan.isActive || plan.network !== network) {
      return NextResponse.json({ error: "Data plan not found" }, { status: 404 });
    }
    // Agents pay at the active primary provider's cost — zero markup.
    const cost = getProviderCost(plan, getPrimaryDataProvider().name);
    if (cost === null) {
      return NextResponse.json({ error: "Agent pricing is not configured for this plan" }, { status: 500 });
    }
    price = cost;
    resolvedPlanId = planId;
    resolvedPlanName = plan.planName;
  } else {
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Missing or invalid 'amount' for airtime purchase" }, { status: 400 });
    }
    price = Math.round(amount * (1 - agentAirtimeDiscountRate()) * 100) / 100;
  }

  try {
    await chargeWallet(userId, price);
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 402 });
    }
    console.error("[/api/vtu/agent-buy] wallet charge failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const { transactionId } = await createTransaction({
    userId,
    type: txType,
    network,
    phone,
    planId: resolvedPlanId,
    planName: resolvedPlanName,
    paymentMethod: "wallet",
    amountPaid: price,
  });

  try {
    const outcome = await deliverData(transactionId);
    return NextResponse.json({
      transactionId,
      success: outcome.delivered,
      status: outcome.status,
      providerUsed: outcome.providerUsed,
      providerRef: outcome.providerRef,
      needsManualReview: outcome.needsManualReview,
    });
  } catch (err) {
    // deliverData() failed before it could resolve/refund the transaction at
    // all (a bug, not a provider failure) — the wallet was already charged,
    // so refund it here rather than leaving the agent's money stuck.
    console.error(`[/api/vtu/agent-buy] delivery failed for ${transactionId}:`, err);
    await refundWallet(userId, price);
    return NextResponse.json({ error: "Internal server error, your wallet has been refunded" }, { status: 500 });
  }
}
