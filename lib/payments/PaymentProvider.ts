// Server-only. Every payment provider implements this same shape so the rest
// of the VTU backend never talks to Flutterwave (or any future provider)
// directly — it only calls getPaymentProvider().

export interface PaymentVerificationResult {
  success: boolean;
  amountPaid: number;
  currency: string;
  fee: number | null;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  verifyPayment(reference: string, expectedAmount: number): Promise<PaymentVerificationResult>;
}
