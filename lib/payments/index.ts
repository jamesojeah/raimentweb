import type { PaymentProvider } from "./PaymentProvider";
import { FlutterwaveProvider } from "./FlutterwaveProvider";

export type { PaymentProvider, PaymentVerificationResult } from "./PaymentProvider";
export { MonnifyProvider } from "./MonnifyProvider";

// Change this one line to swap the active payment provider.
const ACTIVE_PROVIDER: PaymentProvider = new FlutterwaveProvider();

export function getPaymentProvider(): PaymentProvider {
  return ACTIVE_PROVIDER;
}
