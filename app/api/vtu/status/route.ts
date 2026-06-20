import { NextRequest, NextResponse } from "next/server";
import { getTransactionForUser } from "@/lib/vtu/orders";
import { verifyFirebaseIdToken } from "@/lib/vtuWallet";

export async function GET(req: NextRequest) {
  const transactionId = req.nextUrl.searchParams.get("transactionId");
  const firebaseIdToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!transactionId || !firebaseIdToken) {
    return NextResponse.json({ error: "Missing 'transactionId' or Authorization header" }, { status: 400 });
  }

  let userId: string;
  try {
    userId = await verifyFirebaseIdToken(firebaseIdToken);
  } catch (err) {
    console.error("[/api/vtu/status] token verification failed:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transaction = await getTransactionForUser(transactionId, userId);
  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  return NextResponse.json({
    transactionId: transaction.id,
    type: transaction.type,
    status: transaction.status,
    amountPaid: transaction.amountPaid,
    network: transaction.network,
    phone: transaction.phone,
    planName: transaction.planName,
    providerUsed: transaction.providerUsed,
    providerRef: transaction.providerRef,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  });
}
