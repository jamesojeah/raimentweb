// CheapDataHub VTU upstream. Same DataProvider shape as PeyflexProvider so
// deliver.ts can fail over to/from this provider without any other code
// changing. Auth is `Authorization: Bearer <CHEAPDATAHUB_TOKEN>` (Peyflex
// uses the "Token" scheme instead — do not mix these up).

import type {
  BuyAirtimeParams,
  BuyDataParams,
  DataProvider,
  ProviderPlan,
  ProviderPurchaseResult,
  ProviderStatusResult,
} from "./DataProvider";

function getConfig() {
  const token = process.env.CHEAPDATAHUB_TOKEN;
  const baseUrl = process.env.CHEAPDATAHUB_BASE_URL;
  if (!token || !baseUrl) {
    throw new Error("CHEAPDATAHUB_TOKEN or CHEAPDATAHUB_BASE_URL is not set");
  }
  return { token, baseUrl: baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/` };
}

// CheapDataHub's airtime endpoint wants a numeric `provider_id` per network,
// not a network name — there is no live lookup for this, so it's configured
// per-network via env (fill these in from your CheapDataHub dashboard).
function getAirtimeProviderId(network: string): string {
  const envKey = `CHEAPDATAHUB_PROVIDER_ID_${network.toUpperCase()}`;
  const providerId = process.env[envKey];
  if (!providerId) {
    throw new Error(
      `${envKey} is not set — CheapDataHub airtime provider id is not configured for network "${network}"`
    );
  }
  return providerId;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface CheapDataHubResponse {
  status?: string; // "true" | "false"
  message?: string;
  reference?: string;
  transaction_id?: string;
  cost?: number;
  data?: { status?: string; balance?: number; [key: string]: unknown };
  [key: string]: unknown;
}

interface CheapDataHubHttpResult {
  status: number;
  ok: boolean;
  body: CheapDataHubResponse | null;
}

async function cheapDataHubFetch(
  path: string,
  init?: RequestInit,
  retryOn5xx = false
): Promise<CheapDataHubHttpResult> {
  const { token, baseUrl } = getConfig();
  const url = `${baseUrl}${path}`;

  const doFetch = async (): Promise<CheapDataHubHttpResult> => {
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
    const text = await res.text();
    let body: CheapDataHubResponse | null = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    return { status: res.status, ok: res.ok, body };
  };

  let result = await doFetch();

  // Per CheapDataHub's guidance: a 500 is worth one short-backoff retry
  // before treating it as a definitive failure and failing over.
  if (retryOn5xx && result.status >= 500) {
    await sleep(500);
    result = await doFetch();
  }

  return result;
}

function isSuccessStatus(body: CheapDataHubResponse | null): boolean {
  return String(body?.status ?? "").toLowerCase() === "true";
}

function extractRef(body: CheapDataHubResponse | null): string | null {
  return body?.reference ?? body?.transaction_id ?? null;
}

function extractCost(body: CheapDataHubResponse | null): number | null {
  return typeof body?.cost === "number" ? body.cost : null;
}

function interpretPurchaseResponse(http: CheapDataHubHttpResult): ProviderPurchaseResult {
  const { status, body } = http;

  if (status === 401) {
    // Auth failure is a config problem (bad/expired token), never a delivery
    // failure — must not trigger a blind failover, only a loud alert.
    console.error(`[cheapdatahub] ALERT: 401 Unauthorized — check CHEAPDATAHUB_TOKEN. ${body?.message ?? ""}`);
    return {
      status: "ambiguous",
      providerRef: null,
      cost: null,
      message: body?.message ?? "CheapDataHub authentication failed (401)",
      raw: body,
    };
  }

  if (status === 402) {
    // Insufficient CheapDataHub wallet float — nothing was delivered, so this
    // is a real delivery failure (safe to fail over), but the float is empty
    // and needs topping up, so alert loudly too.
    console.error(`[cheapdatahub] ALERT: CheapDataHub wallet balance is insufficient (402). ${body?.message ?? ""}`);
    return {
      status: "failed",
      providerRef: extractRef(body),
      cost: null,
      message: body?.message ?? "CheapDataHub wallet balance insufficient (402)",
      raw: body,
    };
  }

  if (status === 409) {
    // Duplicate request — never resend. Surface as "ambiguous" so deliver.ts's
    // existing requery-before-failover safeguard (resolveAmbiguous ->
    // getStatus) determines the real outcome instead of us guessing.
    return {
      status: "ambiguous",
      providerRef: extractRef(body),
      cost: null,
      message: body?.message ?? "Duplicate request (409) — requery required",
      raw: body,
    };
  }

  if (status === 422) {
    // Validation error — our payload was rejected outright, nothing was ever
    // attempted on their side. The same bad input would also fail at
    // Peyflex, so we deliberately avoid "failed" (which deliver.ts would
    // fail over on) — "ambiguous" routes this to manual review instead of a
    // pointless retry against the fallback with the same bad data.
    console.error(`[cheapdatahub] Validation error (422), payload rejected: ${body?.message ?? JSON.stringify(body)}`);
    return {
      status: "ambiguous",
      providerRef: null,
      cost: null,
      message: body?.message ?? "CheapDataHub rejected the request payload (422)",
      raw: body,
    };
  }

  if (!http.ok) {
    // Any other non-2xx (including a 5xx that survived the one retry) —
    // provider definitively did not deliver, safe to fail over.
    return {
      status: "failed",
      providerRef: extractRef(body),
      cost: null,
      message: body?.message ?? `CheapDataHub request failed: ${status}`,
      raw: body,
    };
  }

  if (isSuccessStatus(body)) {
    return {
      status: "success",
      providerRef: extractRef(body),
      cost: extractCost(body),
      message: body?.message ?? null,
      raw: body,
    };
  }

  // 2xx but status:"false" — CheapDataHub explicitly declined the request.
  return {
    status: "failed",
    providerRef: extractRef(body),
    cost: null,
    message: body?.message ?? "CheapDataHub declined the request",
    raw: body,
  };
}

function interpretPurchaseError(err: unknown): ProviderPurchaseResult {
  // Network error / timeout / abort — we don't know if CheapDataHub received
  // and processed the request.
  return {
    status: "ambiguous",
    providerRef: null,
    cost: null,
    message: err instanceof Error ? err.message : String(err),
    raw: null,
  };
}

function interpretStatusResponse(http: CheapDataHubHttpResult): ProviderStatusResult {
  if (!http.ok) {
    // A failed status lookup tells us nothing — stay "pending" so the caller
    // never wrongly assumes success or failure off of this.
    return { status: "pending", providerRef: null, cost: null, raw: http.body };
  }

  const state = String(http.body?.status ?? http.body?.data?.status ?? "").toLowerCase();
  const providerRef = extractRef(http.body);
  const cost = extractCost(http.body);

  if (state === "successful") {
    return { status: "success", providerRef, cost, raw: http.body };
  }
  if (state === "failed") {
    return { status: "failed", providerRef, cost: null, raw: http.body };
  }
  if (state === "refunded") {
    // Already refunded on CheapDataHub's side — no double-delivery risk, so
    // it's safe to treat as a definitive failure and let the failover engine
    // proceed to the fallback provider.
    return { status: "failed", providerRef, cost: null, raw: http.body };
  }
  // "initiated" | "processing" | anything unrecognized — still in flight.
  return { status: "pending", providerRef, cost: null, raw: http.body };
}

export class CheapDataHubProvider implements DataProvider {
  readonly name = "cheapdatahub" as const;

  async getPlans(_network: string): Promise<ProviderPlan[]> {
    // CheapDataHub does not expose a live bundles endpoint we use yet — plan
    // IDs/prices come from cheapdatahub.ng/api/plan-ids and are seeded into
    // Firestore `dataPlans` instead (see lib/vtu/seedDataPlans.ts).
    // TODO: switch to a live bundles endpoint if CheapDataHub exposes one.
    return [];
  }

  async buyData({ requestId, planId, phone }: BuyDataParams): Promise<ProviderPurchaseResult> {
    const bundleId = Number(planId);
    if (!Number.isFinite(bundleId)) {
      return {
        status: "failed",
        providerRef: null,
        cost: null,
        message: `Invalid CheapDataHub bundle id "${planId}"`,
        raw: null,
      };
    }

    try {
      const http = await cheapDataHubFetch(
        "data/purchase/",
        {
          method: "POST",
          body: JSON.stringify({ bundle_id: bundleId, phone_number: phone, reference: requestId }),
        },
        true
      );
      return interpretPurchaseResponse(http);
    } catch (err) {
      return interpretPurchaseError(err);
    }
  }

  async buyAirtime({ requestId, network, amount, phone }: BuyAirtimeParams): Promise<ProviderPurchaseResult> {
    let providerId: string;
    try {
      providerId = getAirtimeProviderId(network);
    } catch (err) {
      // Missing provider-id mapping is a config problem, not a delivery
      // failure — same treatment as a 401, must not trigger a blind failover.
      console.error(`[cheapdatahub] ALERT: ${err instanceof Error ? err.message : err}`);
      return {
        status: "ambiguous",
        providerRef: null,
        cost: null,
        message: err instanceof Error ? err.message : String(err),
        raw: null,
      };
    }

    try {
      const http = await cheapDataHubFetch(
        "airtime/purchase/",
        {
          method: "POST",
          body: JSON.stringify({ provider_id: providerId, phone_number: phone, amount, reference: requestId }),
        },
        true
      );
      return interpretPurchaseResponse(http);
    } catch (err) {
      return interpretPurchaseError(err);
    }
  }

  // CheapDataHub looks up transactions by the `reference` we pass on the way
  // in, which is always our requestId (see buyData/buyAirtime above) — this
  // is what lets deliver.ts requery the SAME attempt instead of guessing.
  async getStatus(requestId: string): Promise<ProviderStatusResult> {
    try {
      const http = await cheapDataHubFetch(`transactions/${encodeURIComponent(requestId)}/`);
      return interpretStatusResponse(http);
    } catch {
      return { status: "pending", providerRef: null, cost: null, raw: null };
    }
  }
}
