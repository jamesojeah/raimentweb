import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rateLimit";
import { createTransaction, loadDataPlan } from "@/lib/vtu/orders";
import { verifyFirebaseIdToken } from "@/lib/vtuWallet";
import type { VtuTransactionType } from "@/types/vtu";

const MIN_DIRECT_PAY_AMOUNT = 200;

interface InitiateBody {
  firebaseIdToken?: unknown;
  type?: unknown;
  network?: unknown;
  planId?: unknown;
  amount?: unknown;
  phone?: unknown;
}

export async function POST(req: NextRequest) {
  let body: InitiateBody;
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
    console.error("[/api/vtu/initiate] token verification failed:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited(`vtu-initiate:${userId}`)) {
    return NextResponse.json({ error: "Too many requests, please wait" }, { status: 429 });
  }

  const txType = type as VtuTransactionType;
  let amountToPay: number;
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
    amountToPay = plan.sellingPrice;
    resolvedPlanId = planId;
    resolvedPlanName = plan.planName;
  } else {
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Missing or invalid 'amount' for airtime purchase" }, { status: 400 });
    }
    amountToPay = amount;
  }

  if (amountToPay < MIN_DIRECT_PAY_AMOUNT) {
    return NextResponse.json(
      { error: `Minimum amount for direct payment is ₦${MIN_DIRECT_PAY_AMOUNT}` },
      { status: 400 }
    );
  }

  const { transactionId } = await createTransaction({
    userId,
    type: txType,
    network,
    phone,
    planId: resolvedPlanId,
    planName: resolvedPlanName,
    paymentMethod: "flutterwave",
    amountPaid: amountToPay,
  });

  return NextResponse.json({ transactionId, amountToPay });
}
