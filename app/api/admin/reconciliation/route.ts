import { NextRequest, NextResponse } from "next/server";
import { listReconciliation, markReconciliationRecovered } from "@/lib/vtu/orders";
import { requireFirebaseAdmin } from "@/lib/adminClaim";

export async function GET(req: NextRequest) {
  const admin = await requireFirebaseAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const entries = await listReconciliation();
    const items = entries.map((entry) => ({
      id: entry.id,
      failedProvider: entry.failedProvider,
      amountStuck: entry.amountStuck,
      requestId: entry.requestId,
      status: entry.status,
      createdAt: entry.createdAt,
      resolvedAt: entry.resolvedAt,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load reconciliation queue" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireFirebaseAdmin(req);
  if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const { itemId } = (await req.json()) as { itemId?: unknown };
    if (typeof itemId !== "string" || !itemId) {
      return NextResponse.json({ success: false, error: "Invalid itemId" }, { status: 400 });
    }

    await markReconciliationRecovered(itemId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to mark recovered" },
      { status: 500 }
    );
  }
}
