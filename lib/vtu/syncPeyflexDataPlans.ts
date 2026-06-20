// Populates the Firestore `dataPlans` catalog from Peyflex's live plan list,
// so the app has real, purchasable plans without hand-curating
// lib/vtu/seedDataPlans.ts (which stays around for CheapDataHub-backed
// plans once their bundle ids are filled in). Re-runnable: each plan's doc
// id is derived deterministically from network+plan_code, so re-running
// this always refreshes the SAME docs instead of creating duplicates.

import { getAdminDb } from "@/lib/firebaseAdmin";
import { getDataNetworks, getDataPlans } from "@/lib/peyflex";
import { suggestSellingPrice } from "./seedDataPlans";

function docId(network: string, peyflexPlanId: string): string {
  return ["peyflex", network, peyflexPlanId]
    .join("_")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Pulls a short "2.5GB" style amount out of Peyflex's free-text label (e.g.
// "2.5GB = N650 (2 Days)") for display; falls back to the full label.
function dataAmountFromLabel(label: string): string {
  const match = label.match(/^([\d.]+\s?(?:MB|GB))/i);
  return match ? match[1].replace(/\s+/g, "") : label;
}

// Strips Peyflex's own cost ("= N650") out of the label so the UI doesn't
// show their wholesale price next to our actual sellingPrice, e.g.
// "2.5GB = N650 (2 Days)" -> "2.5GB (2 Days)".
function planNameFromLabel(label: string): string {
  return label.replace(/\s*=\s*N(?:GN)?[\d.]+\s*/i, " ").replace(/\s+/g, " ").trim();
}

export interface SyncPeyflexDataPlansResult {
  networksProcessed: number;
  plansWritten: number;
}

export async function syncPeyflexDataPlans(): Promise<SyncPeyflexDataPlansResult> {
  const db = getAdminDb();
  const { networks } = await getDataNetworks();

  let plansWritten = 0;
  for (const network of networks) {
    const response = await getDataPlans(network.identifier);
    const plans = response.plans;
    if (!Array.isArray(plans)) {
      console.error(
        `[syncPeyflexDataPlans] unexpected response for network "${network.identifier}": ${JSON.stringify(response)}`
      );
      continue;
    }

    // An admin may have hand-set sellingPrice via /api/admin/pricing — never
    // clobber that on a re-sync, only refresh cost/catalog fields for it.
    const existingSnap = await db.collection("dataPlans").where("network", "==", network.identifier).get();
    const overridden = new Set(
      existingSnap.docs.filter((doc) => doc.data().priceOverridden === true).map((doc) => doc.id)
    );

    const batch = db.batch();

    for (const plan of plans) {
      const id = docId(network.identifier, plan.plan_code);
      const fields: Record<string, unknown> = {
        network: network.identifier,
        planName: planNameFromLabel(plan.label),
        dataAmount: dataAmountFromLabel(plan.label),
        planType: "Peyflex",
        peyflexPlanId: plan.plan_code,
        peyflexCost: plan.amount,
        cheapdatahubPlanId: null,
        cheapdatahubCost: null,
        isActive: true,
        updatedAt: Date.now(),
      };
      if (!overridden.has(id)) {
        fields.sellingPrice = suggestSellingPrice(plan.amount);
      }
      batch.set(db.collection("dataPlans").doc(id), fields, { merge: true });
      plansWritten++;
    }

    await batch.commit();
  }

  return { networksProcessed: networks.length, plansWritten };
}
