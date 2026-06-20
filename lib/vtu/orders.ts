import { randomUUID } from "node:crypto";
import type { DocumentData } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type {
  DataPlan,
  DataProviderName,
  PublicDataPlan,
  ReconciliationEntry,
  ReconciliationStatus,
  VtuPaymentMethod,
  VtuTransaction,
  VtuTransactionStatus,
  VtuTransactionType,
} from "@/types/vtu";

const TRANSACTIONS = "vtuTransactions";
const DATA_PLANS = "dataPlans";
const RECONCILIATION = "reconciliation";

export class TransactionNotFoundError extends Error {
  constructor() {
    super("Transaction not found");
  }
}

export class TransactionAlreadyProcessingError extends Error {
  constructor() {
    super("This transaction is already being processed");
  }
}

function docToDataPlan(id: string, data: DocumentData): DataPlan {
  return {
    id,
    network: data.network,
    planName: data.planName,
    dataAmount: data.dataAmount,
    planType: data.planType,
    peyflexPlanId: data.peyflexPlanId ?? null,
    cheapdatahubPlanId: data.cheapdatahubPlanId ?? null,
    peyflexCost: typeof data.peyflexCost === "number" ? data.peyflexCost : null,
    cheapdatahubCost: typeof data.cheapdatahubCost === "number" ? data.cheapdatahubCost : null,
    sellingPrice: data.sellingPrice,
    isActive: data.isActive === true,
  };
}

function docToTransaction(id: string, data: DocumentData): VtuTransaction {
  return {
    id,
    userId: data.userId,
    type: data.type,
    network: data.network,
    phone: data.phone,
    planId: data.planId ?? null,
    planName: data.planName ?? null,
    requestId: data.requestId,
    paymentMethod: data.paymentMethod,
    amountPaid: data.amountPaid,
    providerUsed: data.providerUsed ?? null,
    providerCost: data.providerCost ?? null,
    flutterwaveFee: data.flutterwaveFee ?? null,
    vat: data.vat ?? null,
    profit: data.profit ?? null,
    status: data.status,
    flutterwaveRef: data.flutterwaveRef ?? null,
    providerRef: data.providerRef ?? null,
    failureReason: data.failureReason ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function loadDataPlan(planId: string): Promise<DataPlan | null> {
  const snap = await getAdminDb().collection(DATA_PLANS).doc(planId).get();
  if (!snap.exists) return null;
  return docToDataPlan(snap.id, snap.data()!);
}

export function getProviderCost(plan: DataPlan, provider: DataProviderName): number | null {
  return provider === "peyflex" ? plan.peyflexCost : plan.cheapdatahubCost;
}

export function getProviderPlanId(plan: DataPlan, provider: DataProviderName): string | null {
  return provider === "peyflex" ? plan.peyflexPlanId : plan.cheapdatahubPlanId;
}

export async function loadPublicDataPlans(network: string): Promise<PublicDataPlan[]> {
  const snap = await getAdminDb()
    .collection(DATA_PLANS)
    .where("network", "==", network)
    .where("isActive", "==", true)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      network: data.network,
      planName: data.planName,
      dataAmount: data.dataAmount,
      planType: data.planType,
      sellingPrice: data.sellingPrice,
    };
  });
}

interface CreateTransactionInput {
  userId: string;
  type: VtuTransactionType;
  network: string;
  phone: string;
  planId: string | null;
  planName: string | null;
  paymentMethod: VtuPaymentMethod;
  amountPaid: number;
  flutterwaveRef?: string | null;
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<{ transactionId: string; requestId: string }> {
  const db = getAdminDb();
  const now = Date.now();
  const requestId = randomUUID();

  const ref = await db.collection(TRANSACTIONS).add({
    userId: input.userId,
    type: input.type,
    network: input.network,
    phone: input.phone,
    planId: input.planId,
    planName: input.planName,
    requestId,
    paymentMethod: input.paymentMethod,
    amountPaid: input.amountPaid,
    providerUsed: null,
    providerCost: null,
    flutterwaveFee: null,
    vat: null,
    profit: null,
    status: "awaiting_payment" as VtuTransactionStatus,
    flutterwaveRef: input.flutterwaveRef ?? null,
    providerRef: null,
    failureReason: null,
    createdAt: now,
    updatedAt: now,
  });

  return { transactionId: ref.id, requestId };
}

// Records the verified Flutterwave reference + fee onto the transaction
// before delivery starts, so deliverData() can read them off the claimed
// transaction doc when computing profit.
export async function recordPaymentVerification(
  transactionId: string,
  flutterwaveRef: string,
  flutterwaveFee: number | null
): Promise<void> {
  await getAdminDb().collection(TRANSACTIONS).doc(transactionId).update({
    flutterwaveRef,
    flutterwaveFee,
    updatedAt: Date.now(),
  });
}

export async function getTransactionForUser(
  transactionId: string,
  userId: string
): Promise<VtuTransaction | null> {
  const snap = await getAdminDb().collection(TRANSACTIONS).doc(transactionId).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  if (data.userId !== userId) return null;
  return docToTransaction(snap.id, data);
}

// Atomically moves a transaction from "awaiting_payment" to "processing" so
// two concurrent calls to deliver against the same transaction (e.g. a
// network retry hitting confirm-and-deliver twice) can never both proceed
// to call a provider. This is the idempotency guard the failover engine
// relies on — same requestId must never be delivered twice.
export async function claimForDelivery(transactionId: string): Promise<VtuTransaction> {
  const db = getAdminDb();
  const ref = db.collection(TRANSACTIONS).doc(transactionId);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new TransactionNotFoundError();

    const data = snap.data()!;
    if (data.status === "processing") {
      throw new TransactionAlreadyProcessingError();
    }
    if (data.status !== "awaiting_payment") {
      // Already a terminal state (successful / delivery_failed / refunded) —
      // return it as-is so the caller can short-circuit instead of
      // re-delivering.
      return docToTransaction(snap.id, data);
    }

    tx.update(ref, { status: "processing", updatedAt: Date.now() });
    return docToTransaction(snap.id, { ...data, status: "processing" });
  });
}

interface FinalizeSuccessInput {
  providerUsed: DataProviderName;
  providerRef: string | null;
  providerCost: number | null;
  flutterwaveFee: number | null;
  vat: number | null;
  profit: number | null;
}

export async function finalizeTransactionSuccess(
  transactionId: string,
  input: FinalizeSuccessInput
): Promise<void> {
  await getAdminDb()
    .collection(TRANSACTIONS)
    .doc(transactionId)
    .update({
      status: "successful" as VtuTransactionStatus,
      providerUsed: input.providerUsed,
      providerRef: input.providerRef,
      providerCost: input.providerCost,
      flutterwaveFee: input.flutterwaveFee,
      vat: input.vat,
      profit: input.profit,
      failureReason: null,
      updatedAt: Date.now(),
    });
}

export async function finalizeTransactionFailure(
  transactionId: string,
  status: "delivery_failed" | "refunded",
  failureReason: string
): Promise<void> {
  await getAdminDb()
    .collection(TRANSACTIONS)
    .doc(transactionId)
    .update({
      status,
      failureReason,
      updatedAt: Date.now(),
    });
}

export async function writeReconciliation(entry: {
  transactionId: string;
  failedProvider: DataProviderName;
  requestId: string;
  amountStuck: number;
  reason: string;
  status?: ReconciliationStatus;
}): Promise<void> {
  await getAdminDb().collection(RECONCILIATION).add({
    transactionId: entry.transactionId,
    failedProvider: entry.failedProvider,
    requestId: entry.requestId,
    amountStuck: entry.amountStuck,
    status: entry.status ?? "refund_pending",
    reason: entry.reason,
    createdAt: Date.now(),
    resolvedAt: null,
  });
}

export async function listReconciliation(): Promise<ReconciliationEntry[]> {
  const snap = await getAdminDb()
    .collection(RECONCILIATION)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      transactionId: data.transactionId,
      failedProvider: data.failedProvider,
      requestId: data.requestId,
      amountStuck: data.amountStuck,
      status: data.status,
      reason: data.reason,
      createdAt: data.createdAt,
      resolvedAt: data.resolvedAt ?? null,
    };
  });
}

export async function listAllDataPlans(): Promise<DataPlan[]> {
  const snap = await getAdminDb().collection(DATA_PLANS).get();
  return snap.docs.map((doc) => docToDataPlan(doc.id, doc.data()));
}

// Marks the plan as price-overridden so syncPeyflexDataPlans() never
// clobbers a manually-set price on its next run.
export async function updateDataPlanSellingPrice(planId: string, sellingPrice: number): Promise<void> {
  await getAdminDb().collection(DATA_PLANS).doc(planId).update({ sellingPrice, priceOverridden: true });
}

export async function markReconciliationRecovered(id: string): Promise<void> {
  await getAdminDb().collection(RECONCILIATION).doc(id).update({
    status: "recovered" satisfies ReconciliationStatus,
    resolvedAt: Date.now(),
  });
}
