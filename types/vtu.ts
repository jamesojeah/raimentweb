export type VtuTransactionType = "data" | "airtime";

// awaiting_payment -> created, waiting for the customer to pay
// successful       -> payment verified and data/airtime delivered
// delivery_failed   -> payment verified but both providers failed to deliver (refunded)
// refunded          -> customer refunded (delivery_failed implies a refund already happened,
//                      but agent wallet refunds also land here so admins have one status to filter on)
export type VtuTransactionStatus =
  | "awaiting_payment"
  | "processing"
  | "successful"
  | "delivery_failed"
  | "refunded";

export type VtuPaymentMethod = "flutterwave" | "wallet";

export type DataProviderName = "peyflex" | "cheapdatahub";

export interface VtuTransaction {
  id: string;
  userId: string;
  type: VtuTransactionType;
  network: string;
  phone: string;
  planId: string | null;
  planName: string | null;
  requestId: string;
  paymentMethod: VtuPaymentMethod;
  amountPaid: number;
  providerUsed: DataProviderName | null;
  providerCost: number | null;
  flutterwaveFee: number | null;
  vat: number | null;
  profit: number | null;
  status: VtuTransactionStatus;
  flutterwaveRef: string | null;
  providerRef: string | null;
  failureReason: string | null;
  createdAt: number;
  updatedAt: number;
}

// Firestore `dataPlans/{planId}` — pricing/catalog source of truth.
export interface DataPlan {
  id: string;
  network: string;
  planName: string;
  dataAmount: string;
  planType: string;
  peyflexPlanId: string | null;
  cheapdatahubPlanId: string | null;
  peyflexCost: number | null;
  cheapdatahubCost: number | null;
  sellingPrice: number;
  isActive: boolean;
}

// What /api/vtu/data-plans returns to the client — never expose provider costs.
export interface PublicDataPlan {
  id: string;
  network: string;
  planName: string;
  dataAmount: string;
  planType: string;
  sellingPrice: number;
}

// Firestore `reconciliation/{id}` — stuck provider charges that need manual follow-up.
export type ReconciliationStatus = "refund_pending" | "manual_review_required" | "recovered";

export interface ReconciliationEntry {
  id: string;
  transactionId: string;
  failedProvider: DataProviderName;
  requestId: string;
  amountStuck: number;
  status: ReconciliationStatus;
  reason: string;
  createdAt: number;
  resolvedAt: number | null;
}

export interface VtuNetwork {
  id: string;
  name: string;
}
