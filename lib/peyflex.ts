// Server-only client for the Peyflex VTU API. Never import this from a
// client component — PEYFLEX_TOKEN must never reach the browser.

export class PeyflexError extends Error {
  constructor(message: string, public status: number, public body: unknown) {
    super(message);
    this.name = "PeyflexError";
  }
}

function getConfig() {
  const token = process.env.PEYFLEX_TOKEN;
  const baseUrl = process.env.PEYFLEX_BASE_URL;
  if (!token || !baseUrl) {
    throw new Error("PEYFLEX_TOKEN or PEYFLEX_BASE_URL is not set");
  }
  return { token, baseUrl };
}

async function peyflexFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const { token, baseUrl } = getConfig();

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    throw new PeyflexError(`Peyflex request failed: ${res.status}`, res.status, body);
  }

  return body as T;
}

// Airtime networks come back as { networks: [{ id, name }] }.
export interface PeyflexAirtimeNetwork {
  id: string;
  name: string;
}

// Data networks (carrier + product variant) come back as
// { networks: [{ identifier, name }] } — note the different key name from
// airtime networks above, this is a real quirk of Peyflex's API, not a typo.
export interface PeyflexDataNetwork {
  identifier: string;
  name: string;
}

// { plans: { network, plans: [{ plan_code, amount, label }] } }.
export interface PeyflexDataPlan {
  plan_code: string;
  amount: number;
  label: string;
}

export function getAirtimeNetworks(): Promise<{ networks: PeyflexAirtimeNetwork[] }> {
  return peyflexFetch<{ networks: PeyflexAirtimeNetwork[] }>("/api/airtime/networks/");
}

export function getDataNetworks(): Promise<{ networks: PeyflexDataNetwork[] }> {
  return peyflexFetch<{ networks: PeyflexDataNetwork[] }>("/api/data/networks/");
}

export function getDataPlans(network: string): Promise<{ network: string; plans: PeyflexDataPlan[] }> {
  return peyflexFetch<{ network: string; plans: PeyflexDataPlan[] }>(
    `/api/data/plans/?network=${encodeURIComponent(network)}`
  );
}

export interface PeyflexDataPurchasePayload {
  network: string;
  plan: string;
  mobile_number: string;
}

export interface PeyflexPurchaseResult {
  reference?: string;
  status?: string;
  message?: string;
  [key: string]: unknown;
}

export function purchaseData(
  payload: PeyflexDataPurchasePayload
): Promise<PeyflexPurchaseResult> {
  return peyflexFetch<PeyflexPurchaseResult>("/api/data/purchase/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface PeyflexAirtimeTopupPayload {
  network: string;
  amount: number;
  mobile_number: string;
}

export function topupAirtime(
  payload: PeyflexAirtimeTopupPayload
): Promise<PeyflexPurchaseResult> {
  return peyflexFetch<PeyflexPurchaseResult>("/api/airtime/topup/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
