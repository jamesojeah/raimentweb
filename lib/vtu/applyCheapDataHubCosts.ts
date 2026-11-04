// One-time data fix: matches the real CheapDataHub bundle catalog (pulled
// from https://www.cheapdatahub.ng/api/plan-ids/, which requires no API
// auth - the reseller API itself has no endpoint that lists bundles) against
// the existing Firestore `dataPlans` docs, by network + dataAmount +
// validity period - not amount alone, since e.g. MTN's "data share" and
// "gifting" 1GB/7Days plans have different Peyflex costs for the same
// nominal size, meaning they're different underlying products. Only
// unambiguous, unique matches are included here; "Night Plan" / bonus-data
// variants and sizes/validities CheapDataHub doesn't offer are deliberately
// left out rather than guessed, since a wrong bundle id would deliver the
// wrong plan to a paying customer.
//
// Re-running this is safe: it only ever writes these two fields, and
// syncPeyflexDataPlans() now preserves them on every subsequent Peyflex
// resync instead of nulling them back out.

import { getAdminDb } from "@/lib/firebaseAdmin";

interface CheapDataHubMatch {
  docId: string;
  cheapdatahubPlanId: string;
  cheapdatahubCost: number;
}

const MATCHES: CheapDataHubMatch[] = [
  // AIRTEL
  { docId: "peyflex-airtel-data-a10gb", cheapdatahubPlanId: "21", cheapdatahubCost: 4070 },
  { docId: "peyflex-airtel-data-a1gbs", cheapdatahubPlanId: "70", cheapdatahubCost: 295 },
  { docId: "peyflex-airtel-data-a1gb", cheapdatahubPlanId: "15", cheapdatahubCost: 785 },
  { docId: "peyflex-airtel-data-a2gb2", cheapdatahubPlanId: "17", cheapdatahubCost: 1470 },
  { docId: "peyflex-airtel-data-a3gb", cheapdatahubPlanId: "18", cheapdatahubCost: 1960 },
  { docId: "peyflex-airtel-data-a4gb", cheapdatahubPlanId: "19", cheapdatahubCost: 2570 },
  { docId: "peyflex-airtel-data-a6gb", cheapdatahubPlanId: "22", cheapdatahubCost: 2455 },
  { docId: "peyflex-airtel-data-a8gb", cheapdatahubPlanId: "20", cheapdatahubCost: 2999 },
  // GLO
  { docId: "peyflex-glo-data-g10gb2", cheapdatahubPlanId: "39", cheapdatahubCost: 4390 },
  { docId: "peyflex-glo-data-g1gb1", cheapdatahubPlanId: "68", cheapdatahubCost: 300 },
  { docId: "peyflex-glo-data-g1gb4", cheapdatahubPlanId: "36", cheapdatahubCost: 425 },
  { docId: "peyflex-glo-data-g2gb4", cheapdatahubPlanId: "40", cheapdatahubCost: 850 },
  { docId: "peyflex-glo-data-g3gb4", cheapdatahubPlanId: "37", cheapdatahubCost: 1300 },
  { docId: "peyflex-glo-data-g500mb", cheapdatahubPlanId: "35", cheapdatahubCost: 225 },
  { docId: "peyflex-glo-data-g5gb4", cheapdatahubPlanId: "38", cheapdatahubCost: 2250 },
  { docId: "peyflex-glo-data-g5gb2", cheapdatahubPlanId: "54", cheapdatahubCost: 1699 },
  // MTN (data share network maps to CheapDataHub's "SME" category)
  { docId: "peyflex-mtn-data-share-m1gbs2", cheapdatahubPlanId: "46", cheapdatahubCost: 570 },
  { docId: "peyflex-mtn-data-share-m1gbs", cheapdatahubPlanId: "45", cheapdatahubCost: 450 },
  { docId: "peyflex-mtn-data-share-m2gbs2", cheapdatahubPlanId: "48", cheapdatahubCost: 1150 },
  { docId: "peyflex-mtn-data-share-m2gbs", cheapdatahubPlanId: "47", cheapdatahubCost: 930 },
  { docId: "peyflex-mtn-data-share-m3gbs2", cheapdatahubPlanId: "49", cheapdatahubCost: 1370 },
  { docId: "peyflex-mtn-data-share-m5gbs", cheapdatahubPlanId: "50", cheapdatahubCost: 2050 },
  // MTN (gifting data network maps to CheapDataHub's "Gifting" category)
  { docId: "peyflex-mtn-gifting-data-m110mbs", cheapdatahubPlanId: "70", cheapdatahubCost: 99 },
  { docId: "peyflex-mtn-gifting-data-m11gbs", cheapdatahubPlanId: "55", cheapdatahubCost: 3430 },
  { docId: "peyflex-mtn-gifting-data-m6gbs", cheapdatahubPlanId: "53", cheapdatahubCost: 2495 },
  { docId: "peyflex-mtn-gifting-data-m36gbs", cheapdatahubPlanId: "57", cheapdatahubCost: 10800 },
  { docId: "peyflex-mtn-gifting-data-m75gbs", cheapdatahubPlanId: "51", cheapdatahubCost: 17990 },
];

export interface ApplyCheapDataHubCostsResult {
  matched: number;
  skippedMissing: string[];
}

export async function applyCheapDataHubCosts(): Promise<ApplyCheapDataHubCostsResult> {
  const db = getAdminDb();
  const batch = db.batch();
  const skippedMissing: string[] = [];
  let matched = 0;

  for (const match of MATCHES) {
    const ref = db.collection("dataPlans").doc(match.docId);
    const snap = await ref.get();
    if (!snap.exists) {
      skippedMissing.push(match.docId);
      continue;
    }
    batch.set(
      ref,
      { cheapdatahubPlanId: match.cheapdatahubPlanId, cheapdatahubCost: match.cheapdatahubCost },
      { merge: true }
    );
    matched++;
  }

  await batch.commit();
  return { matched, skippedMissing };
}
