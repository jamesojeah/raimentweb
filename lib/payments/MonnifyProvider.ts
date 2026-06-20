import type { PaymentProvider, PaymentVerificationResult } from "./PaymentProvider";

// TODO: implement once we swap to Monnify. Needs:
// - MONNIFY_API_KEY / MONNIFY_SECRET_KEY / MONNIFY_CONTRACT_CODE env vars
// - OAuth token fetch (Monnify access tokens expire ~1hr, cache + refresh)
// - GET /api/v2/transactions/{reference} to verify, mapping their
//   paymentStatus "PAID" -> success
export class MonnifyProvider implements PaymentProvider {
  readonly name = "monnify";

  async verifyPayment(_reference: string, _expectedAmount: number): Promise<PaymentVerificationResult> {
    throw new Error("MonnifyProvider is not implemented yet");
  }
}
