import type { DataProviderName } from "@/types/vtu";

// Server-only. Every VTU upstream (Peyflex, CheapDataHub, ...) implements this
// same shape so deliver.ts and the API routes never call a provider directly.

export interface ProviderPlan {
  id: string;
  name: string;
  price: number;
  validity: string | null;
}

// "success"  -> delivered, providerRef/cost are trustworthy.
// "failed"   -> the provider definitively rejected/declined the request
//               (e.g. invalid number, provider said no) — safe to fail over.
// "ambiguous"-> we don't know if it went through (timeout, 5xx, network
//               error) — caller MUST call getStatus() before failing over,
//               since failing over blindly risks double delivery.
export type ProviderResultStatus = "success" | "failed" | "ambiguous";

export interface ProviderPurchaseResult {
  status: ProviderResultStatus;
  providerRef: string | null;
  cost: number | null;
  message: string | null;
  raw: unknown;
}

// "pending" means the provider could not confirm either way — treat as
// "still don't know", never as failure. Never fail over on "pending".
export type ProviderStatusCheckStatus = "success" | "failed" | "pending";

export interface ProviderStatusResult {
  status: ProviderStatusCheckStatus;
  providerRef: string | null;
  cost: number | null;
  raw: unknown;
}

export interface BuyDataParams {
  requestId: string;
  network: string;
  planId: string;
  phone: string;
}

export interface BuyAirtimeParams {
  requestId: string;
  network: string;
  amount: number;
  phone: string;
}

export interface DataProvider {
  readonly name: DataProviderName;
  getPlans(network: string): Promise<ProviderPlan[]>;
  buyData(params: BuyDataParams): Promise<ProviderPurchaseResult>;
  buyAirtime(params: BuyAirtimeParams): Promise<ProviderPurchaseResult>;
  getStatus(requestId: string): Promise<ProviderStatusResult>;
}
