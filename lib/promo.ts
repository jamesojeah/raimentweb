export const PROMO_CODE = "RAIMENT20";
export const PROMO_PERCENT = 20;

export function normalisePromoCode(input: string): string {
  return input.trim().toUpperCase();
}

export function isValidPromoCode(input: string): boolean {
  return normalisePromoCode(input) === PROMO_CODE;
}

// Discount applies to the product subtotal only (never delivery), in whole naira.
export function getPromoDiscount(subtotal: number): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  return Math.round((subtotal * PROMO_PERCENT) / 100);
}
