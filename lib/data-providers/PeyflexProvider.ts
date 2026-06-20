import {
  PeyflexError,
  getDataPlans,
  purchaseData,
  topupAirtime,
  type PeyflexPurchaseResult,
} from "@/lib/peyflex";
import type {
  BuyAirtimeParams,
  BuyDataParams,
  DataProvider,
  ProviderPlan,
  ProviderPurchaseResult,
  ProviderStatusResult,
} from "./DataProvider";

function extractCost(result: PeyflexPurchaseResult): number | null {
  return typeof result.cost === "number" ? result.cost : null;
}

function interpretResult(result: PeyflexPurchaseResult): ProviderPurchaseResult {
  const status = String(result.status ?? "").toLowerCase();

  if (status === "success" || status === "successful" || status === "completed") {
    return {
      status: "success",
      providerRef: result.reference ?? null,
      cost: extractCost(result),
      message: result.message ?? null,
      raw: result,
    };
  }

  if (status === "failed" || status === "declined" || status === "rejected") {
    return {
      status: "failed",
      providerRef: result.reference ?? null,
      cost: null,
      message: result.message ?? null,
      raw: result,
    };
  }

  // A 2xx response with an unrecognized/missing status string — don't assume
  // success or failure, treat as ambiguous and let deliver.ts requery.
  return {
    status: "ambiguous",
    providerRef: result.reference ?? null,
    cost: null,
    message: result.message ?? null,
    raw: result,
  };
}

function interpretError(err: unknown): ProviderPurchaseResult {
  if (err instanceof PeyflexError) {
    // A 4xx (other than rate-limit/timeout-flavored ones) means Peyflex
    // rejected the request outright — it was never charged or delivered, so
    // it's safe to treat as a definitive failure and fail over immediately.
    const definitivelyRejected = err.status >= 400 && err.status < 500 && err.status !== 408 && err.status !== 429;
    return {
      status: definitivelyRejected ? "failed" : "ambiguous",
      providerRef: null,
      cost: null,
      message: err.message,
      raw: err.body,
    };
  }

  // Network error / timeout / abort — we genuinely don't know if Peyflex
  // received and processed the request.
  return {
    status: "ambiguous",
    providerRef: null,
    cost: null,
    message: err instanceof Error ? err.message : String(err),
    raw: null,
  };
}

export class PeyflexProvider implements DataProvider {
  readonly name = "peyflex" as const;

  async getPlans(network: string): Promise<ProviderPlan[]> {
    const plans = await getDataPlans(network);
    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      validity: p.validity ?? null,
    }));
  }

  async buyData({ network, planId, phone }: BuyDataParams): Promise<ProviderPurchaseResult> {
    try {
      const result = await purchaseData({ network, plan: planId, mobile_number: phone });
      return interpretResult(result);
    } catch (err) {
      return interpretError(err);
    }
  }

  async buyAirtime({ network, amount, phone }: BuyAirtimeParams): Promise<ProviderPurchaseResult> {
    try {
      const result = await topupAirtime({ network, amount, mobile_number: phone });
      return interpretResult(result);
    } catch (err) {
      return interpretError(err);
    }
  }

  // TODO: Peyflex's exact transaction-status/requery endpoint path is not
  // confirmed from their docs yet. Until it is, always report "pending" so
  // deliver.ts never wrongly assumes success or failure here — an incorrect
  // "failed" would risk double delivery via the fallback provider, and an
  // incorrect "success" would risk silently swallowing a real failure.
  async getStatus(_requestId: string): Promise<ProviderStatusResult> {
    return { status: "pending", providerRef: null, cost: null, raw: null };
  }
}
