import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseAdmin } from "@/lib/adminClaim";
import { syncPeyflexDataPlans } from "@/lib/vtu/syncPeyflexDataPlans";

// Re-runnable: refreshes the `dataPlans` catalog from Peyflex's live plan
// list (real-time prices/availability, no manual bundle-id curation needed).
export async function POST(req: NextRequest) {
  const admin = await requireFirebaseAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await syncPeyflexDataPlans();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[/api/admin/sync-peyflex-data-plans] failed:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
