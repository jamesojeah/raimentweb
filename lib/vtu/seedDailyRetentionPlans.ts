// One-time/occasional seed for the daily-retention focus: ensures the
// real CheapDataHub 1/2/3-day plans listed below exist in Firestore
// `dataPlans`, and backfills `validityGroup`/`featured` across the whole
// collection (everything pre-existing defaults to "standard"/false).
//
// peyflexPlanId/peyflexCost are left as PLACEHOLDER (null) for brand-new
// docs - fill them in from the Peyflex dashboard, then re-run this (it only
// ever touches validityGroup/featured/cheapdatahub* fields on existing
// docs, via merge, so it never clobbers a manually-filled-in Peyflex
// mapping or an admin-edited sellingPrice).
//
// Re-runnable: every doc id is deterministic.

import { getAdminDb } from "@/lib/firebaseAdmin";
import type { ValidityGroup } from "@/types/vtu";
import { suggestSellingPrice } from "./seedDataPlans";

interface RetentionPlanSeed {
  docId: string;
  network: string;
  planName: string;
  dataAmount: string;
  planType: string;
  cheapdatahubPlanId: string;
  cheapdatahubCost: number;
  validityGroup: ValidityGroup;
  featured?: boolean;
}

// Updates to plans that already exist (created by syncPeyflexDataPlans or
// the earlier CheapDataHub cost match) - only validityGroup/featured (and,
// for m110mbs, a corrected cheapdatahub id) change here.
const EXISTING_PLAN_UPDATES: RetentionPlanSeed[] = [
  {
    // Was mismapped to CheapDataHub id 70 (that's actually AIRTEL's 1GB/3Days
    // plan) in the first cost-matching pass - 43 is the real MTN 110MB/1Day id.
    docId: "peyflex-mtn-gifting-data-m110mbs",
    network: "mtn_gifting_data",
    planName: "110MB (1 Day)",
    dataAmount: "110MB",
    planType: "Gifting",
    cheapdatahubPlanId: "43",
    cheapdatahubCost: 99,
    validityGroup: "daily",
  },
  {
    docId: "peyflex-mtn-gifting-data-m2m5gbs",
    network: "mtn_gifting_data",
    planName: "2.5GB (2 Days)",
    dataAmount: "2.5GB",
    planType: "Gifting",
    cheapdatahubPlanId: "27",
    cheapdatahubCost: 900,
    validityGroup: "twoDay",
  },
  {
    docId: "peyflex-airtel-data-a1gbs",
    network: "airtel_data",
    planName: "1GB (3Days) social plan",
    dataAmount: "1GB",
    planType: "Gifting",
    cheapdatahubPlanId: "70",
    cheapdatahubCost: 295,
    validityGroup: "threeDay",
  },
  {
    docId: "peyflex-glo-data-g1gb1",
    network: "glo_data",
    planName: "1GB ( 3 DAYS)",
    dataAmount: "1GB",
    planType: "Corporate Gifting",
    cheapdatahubPlanId: "68",
    cheapdatahubCost: 300,
    validityGroup: "threeDay",
  },
];

// Brand-new plans - none of these existed in the Peyflex-sourced catalog at
// this exact network+dataAmount+validity, so peyflexPlanId/peyflexCost stay
// null placeholders until filled in from the Peyflex dashboard.
const NEW_PLANS: RetentionPlanSeed[] = [
  // Daily
  {
    docId: "cdh-mtn-gifting-data-230mb1d",
    network: "mtn_gifting_data",
    planName: "230MB (1 Day)",
    dataAmount: "230MB",
    planType: "Gifting",
    cheapdatahubPlanId: "74",
    cheapdatahubCost: 200,
    validityGroup: "daily",
  },
  {
    docId: "cdh-mtn-data-share-1gbsme1d",
    network: "mtn_data_share",
    planName: "1GB (1 Day)",
    dataAmount: "1GB",
    planType: "SME",
    cheapdatahubPlanId: "78",
    cheapdatahubCost: 280,
    validityGroup: "daily",
    featured: true,
  },
  {
    docId: "cdh-mtn-data-share-2a5gbsme1d",
    network: "mtn_data_share",
    planName: "2.5GB (1 Day)",
    dataAmount: "2.5GB",
    planType: "SME",
    cheapdatahubPlanId: "79",
    cheapdatahubCost: 600,
    validityGroup: "daily",
  },
  {
    docId: "cdh-mtn-gifting-data-3a5gb1d",
    network: "mtn_gifting_data",
    planName: "3.5GB (1 Day)",
    dataAmount: "3.5GB",
    planType: "Gifting",
    cheapdatahubPlanId: "60",
    cheapdatahubCost: 980,
    validityGroup: "daily",
  },
  {
    docId: "cdh-glo-data-200mb1d",
    network: "glo_data",
    planName: "200MB (1 Day)",
    dataAmount: "200MB",
    planType: "Corporate Gifting",
    cheapdatahubPlanId: "42",
    cheapdatahubCost: 92,
    validityGroup: "daily",
  },
  {
    docId: "cdh-airtel-data-1a5gb1d",
    network: "airtel_data",
    planName: "1.5GB (1 Day)",
    dataAmount: "1.5GB",
    planType: "Gifting",
    cheapdatahubPlanId: "69",
    cheapdatahubCost: 500,
    validityGroup: "daily",
  },
  // Two-day
  {
    docId: "cdh-mtn-data-share-500mbsme2d",
    network: "mtn_data_share",
    planName: "500MB (2 Days)",
    dataAmount: "500MB",
    planType: "SME",
    cheapdatahubPlanId: "76",
    cheapdatahubCost: 250,
    validityGroup: "twoDay",
  },
  {
    docId: "cdh-mtn-data-share-1gbsme2d",
    network: "mtn_data_share",
    planName: "1GB (2 Days)",
    dataAmount: "1GB",
    planType: "SME",
    cheapdatahubPlanId: "77",
    cheapdatahubCost: 399,
    validityGroup: "twoDay",
  },
  {
    docId: "cdh-mtn-gifting-data-4gb2d",
    network: "mtn_gifting_data",
    planName: "4GB (2 Days)",
    dataAmount: "4GB",
    planType: "Gifting",
    cheapdatahubPlanId: "61",
    cheapdatahubCost: 1175,
    validityGroup: "twoDay",
  },
  {
    docId: "cdh-airtel-data-1a5gb2d",
    network: "airtel_data",
    planName: "1.5GB (2 Days)",
    dataAmount: "1.5GB",
    planType: "Gifting",
    cheapdatahubPlanId: "66",
    cheapdatahubCost: 599,
    validityGroup: "twoDay",
  },
];

export interface SeedDailyRetentionPlansResult {
  updatedExisting: number;
  createdNew: number;
  backfilled: number;
}

export async function seedDailyRetentionPlans(): Promise<SeedDailyRetentionPlansResult> {
  const db = getAdminDb();

  // 1. Backfill validityGroup/featured on every doc that doesn't have them yet.
  const allSnap = await db.collection("dataPlans").get();
  const backfillBatch = db.batch();
  let backfilled = 0;
  for (const doc of allSnap.docs) {
    if (doc.data().validityGroup === undefined) {
      backfillBatch.set(doc.ref, { validityGroup: "standard", featured: doc.data().featured === true }, { merge: true });
      backfilled++;
    }
  }
  if (backfilled > 0) await backfillBatch.commit();

  // 2. Update existing daily/twoDay/threeDay plans.
  const updateBatch = db.batch();
  for (const plan of EXISTING_PLAN_UPDATES) {
    updateBatch.set(
      db.collection("dataPlans").doc(plan.docId),
      {
        cheapdatahubPlanId: plan.cheapdatahubPlanId,
        cheapdatahubCost: plan.cheapdatahubCost,
        validityGroup: plan.validityGroup,
        featured: plan.featured === true,
      },
      { merge: true }
    );
  }
  await updateBatch.commit();

  // 3. Create brand-new daily/twoDay plans.
  const createBatch = db.batch();
  for (const plan of NEW_PLANS) {
    createBatch.set(
      db.collection("dataPlans").doc(plan.docId),
      {
        network: plan.network,
        planName: plan.planName,
        dataAmount: plan.dataAmount,
        planType: plan.planType,
        peyflexPlanId: null,
        peyflexCost: null,
        cheapdatahubPlanId: plan.cheapdatahubPlanId,
        cheapdatahubCost: plan.cheapdatahubCost,
        sellingPrice: suggestSellingPrice(plan.cheapdatahubCost),
        isActive: true,
        validityGroup: plan.validityGroup,
        featured: plan.featured === true,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  }
  await createBatch.commit();

  return { updatedExisting: EXISTING_PLAN_UPDATES.length, createdNew: NEW_PLANS.length, backfilled };
}
