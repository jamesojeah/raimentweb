import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import {
  TransactionAlreadyProcessingError,
  TransactionNotFoundError,
  getTransactionForUser,
  recordPaymentVerification,
} from "@/lib/vtu/orders";
import { verifyFirebaseIdToken } from "@/lib/vtuWallet";
import { deliverData } from "@/lib/data-providers/deliver";

interface ConfirmBody {
  firebaseIdToken?: unknown;
  transactionId?: unknown;
  flutterwaveRef?: unknown;
}

export async function POST(req: NextRequest) {
  let body: ConfirmBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { firebaseIdToken, transactionId, flutterwaveRef } = body;
  if (
    typeof firebaseIdToken !== "string" ||
    typeof transactionId !== "string" ||
    typeof flutterwaveRef !== "string" ||
    !firebaseIdToken ||
    !transactionId ||
    !flutterwaveRef
  ) {
    return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
  }

  let userId: string;
  try {
    userId = await verifyFirebaseIdToken(firebaseIdToken);
  } catch (err) {
    console.error("[/api/vtu/confirm-and-deliver] token verification failed:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transaction = await getTransactionForUser(transactionId, userId);
  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }
  if (transaction.paymentMethod !== "flutterwave") {
    return NextResponse.json({ error: "This transaction is not a direct-pay transaction" }, { status: 400 });
  }
  if (transaction.status !== "awaiting_payment") {
    // Already verified/delivered or being processed — return the current
    // state instead of re-verifying/re-delivering.
    return NextResponse.json({ transactionId: transaction.id, status: transaction.status });
  }

  let verification;
  try {
    verification = await getPaymentProvider().verifyPayment(flutterwaveRef, transaction.amountPaid);
  } catch (err) {
    console.error("[/api/vtu/confirm-and-deliver] payment verification failed:", err);
    return NextResponse.json({ error: "Could not verify payment" }, { status: 502 });
  }

  if (!verification.success) {
    return NextResponse.json({ error: "Payment was not successful" }, { status: 402 });
  }

  await recordPaymentVerification(transactionId, flutterwaveRef, verification.fee);

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
    if (err instanceof TransactionAlreadyProcessingError) {
      return NextResponse.json({ error: "This transaction is already being processed" }, { status: 409 });
    }
    if (err instanceof TransactionNotFoundError) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    console.error(`[/api/vtu/confirm-and-deliver] delivery failed for ${transactionId}:`, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
