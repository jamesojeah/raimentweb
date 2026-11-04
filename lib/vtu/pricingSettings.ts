// Single editable home for the payment-processor fee % and VAT % used in
// every margin calculation (admin pricing screen, future margin checks).
// Stored as plain percentages (e.g. 2 for 2%, not 0.02) since that's what an
// admin types into a settings field - convert to a fraction at the call site.

import { getAdminDb } from "@/lib/firebaseAdmin";

const SETTINGS_DOC = "settings/pricing";

export interface PricingSettings {
  feePercent: number;
  vatPercent: number;
}

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  feePercent: 2, // Flutterwave, 2%. e.g. 1.5 for Monnify.
  vatPercent: 7.5, // VAT on the processor fee itself, not the full selling price.
};

export async function getPricingSettings(): Promise<PricingSettings> {
  const snap = await getAdminDb().doc(SETTINGS_DOC).get();
  const data = snap.data();
  const feePercent = typeof data?.feePercent === "number" ? data.feePercent : DEFAULT_PRICING_SETTINGS.feePercent;
  const vatPercent = typeof data?.vatPercent === "number" ? data.vatPercent : DEFAULT_PRICING_SETTINGS.vatPercent;
  return { feePercent, vatPercent };
}

export async function updatePricingSettings(input: Partial<PricingSettings>): Promise<PricingSettings> {
  const current = await getPricingSettings();
  const next: PricingSettings = {
    feePercent: typeof input.feePercent === "number" && Number.isFinite(input.feePercent) ? input.feePercent : current.feePercent,
    vatPercent: typeof input.vatPercent === "number" && Number.isFinite(input.vatPercent) ? input.vatPercent : current.vatPercent,
  };
  await getAdminDb().doc(SETTINGS_DOC).set(next, { merge: true });
  return next;
}

/**
 * worstCaseCost = max(cheapdatahubCost, peyflexCost) if Peyflex is filled in,
 * else just cheapdatahubCost - so margin reflects what happens if a sale
 * fails over to the pricier provider, not just the optimistic primary cost.
 */
export function computeWorstCaseCost(cheapdatahubCost: number | null, peyflexCost: number | null): number | null {
  if (peyflexCost !== null) {
    return cheapdatahubCost !== null ? Math.max(cheapdatahubCost, peyflexCost) : peyflexCost;
  }
  return cheapdatahubCost;
}

/** A plan can only actually fail over to Peyflex once both its plan id and cost are filled in. */
export function isFailoverReady(peyflexPlanId: string | null, peyflexCost: number | null): boolean {
  return peyflexPlanId !== null && peyflexCost !== null;
}

/** margin = sellingPrice − worstCaseCost − fee − VAT(on the fee). */
export function computeMargin(sellingPrice: number, worstCaseCost: number | null, settings: PricingSettings): number | null {
  if (worstCaseCost === null) return null;
  const fee = sellingPrice * (settings.feePercent / 100);
  const vat = fee * (settings.vatPercent / 100);
  return Math.round((sellingPrice - worstCaseCost - fee - vat) * 100) / 100;
}
