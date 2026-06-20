import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseAdmin } from "@/lib/adminClaim";
import { seedDataPlans } from "@/lib/vtu/seedDataPlans";

// Re-runnable: re-seeds/refreshes the `dataPlans` catalog from the starter
// list in lib/vtu/seedDataPlans.ts. Safe to call repeatedly — upserts by a
// stable network+dataAmount+planType key, never creates duplicates.
export async function POST(req: NextRequest) {
  const admin = await requireFirebaseAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await seedDataPlans();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[/api/admin/seed-data-plans] failed:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 }
    );
  }
}
