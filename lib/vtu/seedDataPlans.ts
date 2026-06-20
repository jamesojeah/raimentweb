// Seeds/refreshes the Firestore `dataPlans` catalog from the hardcoded
// starter list below. Re-runnable: each plan's Firestore doc id is derived
// deterministically from network+dataAmount+planType, so re-running this
// always updates the SAME docs instead of creating duplicates.
//
// CheapDataHub's `bundle_id` (an integer on their side) is stored in the
// pre-existing `cheapdatahubPlanId` field (as a string) so the rest of the
// app — getProviderPlanId(), CheapDataHubProvider.buyData(), the admin
// pricing route — keeps working against one field name instead of two.
//
// Fill in the // PLACEHOLDER values below from cheapdatahub.ng/api/plan-ids
// and your Peyflex data plans, then re-run this (via the admin route or the
// CLI script) to pick up the changes.

import { getAdminDb } from "@/lib/firebaseAdmin";

const FLUTTERWAVE_FEE_RATE = 0.02; // 2% of sellingPrice
const VAT_RATE_ON_FEE = 0.075; // 7.5% VAT on the Flutterwave fee
const DEFAULT_MARGIN_BUFFER = 20; // ₦20 minimum profit over worst-case cost

interface DataPlanSeed {
  network: "MTN" | "GLO" | "AIRTEL";
  dataAmount: string;
  planType: string;
  planName: string;
  cheapdatahubCost: number;
  // PLACEHOLDER — fill from cheapdatahub.ng/api/plan-ids and your Peyflex
  // data plans, then re-seed. A plan stays isActive=false until all three
  // are filled in.
  cheapdatahubBundleId: number | null;
  peyflexPlanId: string | null;
  peyflexCost: number | null;
}

const STARTER_DATA_PLANS: DataPlanSeed[] = [
  // MTN — cheapdatahubCost defaulted to the SME/399 route; CheapDataHub
  // lists MTN 1GB SME at 280/399/450/570 across different routes — test
  // which one delivers reliably and adjust here.
  {
    network: "MTN",
    dataAmount: "1GB",
    planType: "SME",
    planName: "1GB SME",
    cheapdatahubCost: 399,
    cheapdatahubBundleId: null,
    peyflexPlanId: null,
    peyflexCost: null,
  },
  {
    network: "MTN",
    dataAmount: "2GB",
    planType: "SME",
    planName: "2GB SME",
    cheapdatahubCost: 930,
    cheapdatahubBundleId: null,
    peyflexPlanId: null,
    peyflexCost: null,
  },
  {
    network: "MTN",
    dataAmount: "3GB",
    planType: "SME",
    planName: "3GB SME",
    cheapdatahubCost: 1370,
    cheapdatahubBundleId: null,
    peyflexPlanId: null,
    peyflexCost: null,
  },
  {
    network: "MTN",
    dataAmount: "5GB",
    planType: "SME",
    planName: "5GB SME",
    cheapdatahubCost: 2050,
    cheapdatahubBundleId: null,
    peyflexPlanId: null,
    peyflexCost: null,
  },
  // GLO
  {
    network: "GLO",
    dataAmount: "1GB",
    planType: "Corporate Gifting",
    planName: "1GB Corporate Gifting",
    cheapdatahubCost: 300,
    cheapdatahubBundleId: null,
    peyflexPlanId: null,
    peyflexCost: null,
  },
  {
    network: "GLO",
    dataAmount: "2GB",
    planType: "Corporate Gifting",
    planName: "2GB Corporate Gifting",
    cheapdatahubCost: 850,
    cheapdatahubBundleId: null,
    peyflexPlanId: null,
    peyflexCost: null,
  },
  {
    network: "GLO",
    dataAmount: "5GB",
    planType: "Corporate Gifting",
    planName: "5GB Corporate Gifting",
    cheapdatahubCost: 1699,
    cheapdatahubBundleId: null,
    peyflexPlanId: null,
    peyflexCost: null,
  },
  // AIRTEL
  {
    network: "AIRTEL",
    dataAmount: "1GB",
    planType: "Gifting",
    planName: "1GB Social/Gifting",
    cheapdatahubCost: 295,
    cheapdatahubBundleId: null,
    peyflexPlanId: null,
    peyflexCost: null,
  },
  {
    network: "AIRTEL",
    dataAmount: "2GB",
    planType: "Gifting",
    planName: "2GB Gifting",
    cheapdatahubCost: 1470,
    cheapdatahubBundleId: null,
    peyflexPlanId: null,
    peyflexCost: null,
  },
  {
    network: "AIRTEL",
    dataAmount: "5GB",
    planType: "Gifting",
    planName: "5GB Gifting",
    cheapdatahubCost: 1570,
    cheapdatahubBundleId: null,
    peyflexPlanId: null,
    peyflexCost: null,
  },
  // 9mobile: skipped — CheapDataHub has no 9mobile bundles.
];

// The higher of the two provider costs — a sale that fails over to the
// pricier provider must still not be a loss, so pricing is always validated
// against this, never against the (cheaper) primary cost alone.
export function worstCaseCost(
  cheapdatahubCost: number | null,
  peyflexCost: number | null
): number | null {
  const costs = [cheapdatahubCost, peyflexCost].filter(
    (c): c is number => typeof c === "number"
  );
  if (costs.length === 0) return null;
  return Math.max(...costs);
}

// Solves sellingPrice >= worstCase + marginBuffer + fee + vat(fee) for the
// smallest sellingPrice that satisfies it, where fee = sellingPrice * 2% and
// vat = fee * 7.5%.
export function suggestSellingPrice(
  worstCase: number,
  marginBuffer = DEFAULT_MARGIN_BUFFER
): number {
  const denominator = 1 - FLUTTERWAVE_FEE_RATE - FLUTTERWAVE_FEE_RATE * VAT_RATE_ON_FEE;
  return Math.ceil((worstCase + marginBuffer) / denominator);
}

export function isProfitableAtWorstCase(sellingPrice: number, worstCase: number): boolean {
  const fee = sellingPrice * FLUTTERWAVE_FEE_RATE;
  const vat = fee * VAT_RATE_ON_FEE;
  return sellingPrice >= worstCase + fee + vat;
}

function planDocId(seed: DataPlanSeed): string {
  return [seed.network, seed.dataAmount, seed.planType]
    .join("_")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface SeedDataPlansResult {
  plansWritten: number;
  activePlans: number;
  inactivePlans: { id: string; planName: string; reason: string }[];
}

export async function seedDataPlans(
  marginBuffer = DEFAULT_MARGIN_BUFFER
): Promise<SeedDataPlansResult> {
  const db = getAdminDb();
  const batch = db.batch();
  const inactivePlans: SeedDataPlansResult["inactivePlans"] = [];
  let activePlans = 0;

  for (const seed of STARTER_DATA_PLANS) {
    const id = planDocId(seed);
    const hasBothProviderIds =
      seed.cheapdatahubBundleId !== null && seed.peyflexPlanId !== null && seed.peyflexCost !== null;
    const worstCase = worstCaseCost(seed.cheapdatahubCost, seed.peyflexCost);
    const sellingPrice =
      worstCase !== null ? suggestSellingPrice(worstCase, marginBuffer) : seed.cheapdatahubCost;
    const profitable = worstCase !== null && isProfitableAtWorstCase(sellingPrice, worstCase);
    const isActive = hasBothProviderIds && profitable;

    if (isActive) {
      activePlans++;
    } else {
      inactivePlans.push({
        id,
        planName: seed.planName,
        reason: !hasBothProviderIds
          ? "Missing cheapdatahubBundleId, peyflexPlanId, or peyflexCost — fill the placeholders and re-seed"
          : "Not profitable against the worst-case provider cost",
      });
    }

    batch.set(
      db.collection("dataPlans").doc(id),
      {
        network: seed.network,
        planName: seed.planName,
        dataAmount: seed.dataAmount,
        planType: seed.planType,
        cheapdatahubPlanId:
          seed.cheapdatahubBundleId !== null ? String(seed.cheapdatahubBundleId) : null,
        cheapdatahubCost: seed.cheapdatahubCost,
        peyflexPlanId: seed.peyflexPlanId,
        peyflexCost: seed.peyflexCost,
        sellingPrice,
        isActive,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  }

  await batch.commit();

  return { plansWritten: STARTER_DATA_PLANS.length, activePlans, inactivePlans };
}
