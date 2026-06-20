import type { PaymentProvider, PaymentVerificationResult } from "./PaymentProvider";

export class FlutterwaveVerificationError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "FlutterwaveVerificationError";
  }
}

interface FlutterwaveVerifyResponse {
  status: string;
  data?: {
    status: string;
    currency: string;
    amount: number;
    app_fee: number;
    tx_ref: string;
    flw_ref: string;
  };
}

export class FlutterwaveProvider implements PaymentProvider {
  readonly name = "flutterwave";

  async verifyPayment(reference: string, expectedAmount: number): Promise<PaymentVerificationResult> {
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("FLUTTERWAVE_SECRET_KEY is not set");
    }

    const res = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new FlutterwaveVerificationError(
        `Flutterwave verify request failed: ${res.status}`,
        res.status
      );
    }

    const body = (await res.json()) as FlutterwaveVerifyResponse;
    const data = body.data;

    if (body.status !== "success" || !data || data.status !== "successful") {
      return { success: false, amountPaid: 0, currency: "", fee: null, raw: body };
    }

    const success = data.currency === "NGN" && data.amount >= expectedAmount;

    return {
      success,
      amountPaid: data.amount,
      currency: data.currency,
      fee: typeof data.app_fee === "number" ? data.app_fee : null,
      raw: body,
    };
  }
}
