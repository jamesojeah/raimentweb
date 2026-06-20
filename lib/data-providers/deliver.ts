import type { DataProviderName, VtuTransaction } from "@/types/vtu";
import {
  claimForDelivery,
  finalizeTransactionFailure,
  finalizeTransactionSuccess,
  getProviderCost,
  getProviderPlanId,
  loadDataPlan,
  writeReconciliation,
} from "@/lib/vtu/orders";
import { refundWallet } from "@/lib/vtuWallet";
import { getFallbackDataProvider, getPrimaryDataProvider } from "./index";
import type { DataProvider, ProviderPurchaseResult, ProviderStatusResult } from "./DataProvider";

export interface DeliverOutcome {
  delivered: boolean;
  status: "successful" | "delivery_failed" | "refunded";
  providerUsed: DataProviderName | null;
  providerRef: string | null;
  needsManualReview: boolean;
}

function providerNameOf(provider: DataProvider): DataProviderName {
  return provider.name;
}

async function attempt(
  provider: DataProvider,
  transaction: VtuTransaction,
  providerPlanId: string | null
): Promise<ProviderPurchaseResult> {
  try {
    if (transaction.type === "data") {
      if (!providerPlanId) {
        return {
          status: "failed",
          providerRef: null,
          cost: null,
          message: `No ${provider.name} plan id mapped for this data plan`,
          raw: null,
        };
      }
      return await provider.buyData({
        requestId: transaction.requestId,
        network: transaction.network,
        planId: providerPlanId,
        phone: transaction.phone,
      });
    }

    return await provider.buyAirtime({
      requestId: transaction.requestId,
      network: transaction.network,
      amount: transaction.amountPaid,
      phone: transaction.phone,
    });
  } catch (err) {
    // A provider implementation throwing (e.g. an unwired stub) is treated
    // the same as a network failure: we don't know what happened, so it's
    // ambiguous, never a silent failure or success.
    return {
      status: "ambiguous",
      providerRef: null,
      cost: null,
      message: err instanceof Error ? err.message : String(err),
      raw: null,
    };
  }
}

async function safeGetStatus(provider: DataProvider, requestId: string): Promise<ProviderStatusResult> {
  try {
    return await provider.getStatus(requestId);
  } catch {
    return { status: "pending", providerRef: null, cost: null, raw: null };
  }
}

// Resolves an "ambiguous" purchase result by requerying the provider.
// Returns null if the requery itself is inconclusive — caller must NOT fail
// over in that case, since the original attempt may still succeed.
async function resolveAmbiguous(
  provider: DataProvider,
  transaction: VtuTransaction
): Promise<ProviderPurchaseResult | null> {
  const statusCheck = await safeGetStatus(provider, transaction.requestId);

  if (statusCheck.status === "success") {
    return { status: "success", providerRef: statusCheck.providerRef, cost: statusCheck.cost, message: null, raw: statusCheck.raw };
  }
  if (statusCheck.status === "failed") {
    return { status: "failed", providerRef: statusCheck.providerRef, cost: null, message: "Requery confirmed failure", raw: statusCheck.raw };
  }
  return null;
}

function vatFor(fee: number | null): number | null {
  const percent = Number(process.env.VAT_PERCENT ?? "");
  if (fee === null || !Number.isFinite(percent) || percent <= 0) return null;
  return Math.round(fee * (percent / 100) * 100) / 100;
}

function profitFor(amountPaid: number, providerCost: number | null, fee: number | null, vat: number | null): number | null {
  if (providerCost === null) return null;
  return Math.round((amountPaid - providerCost - (fee ?? 0) - (vat ?? 0)) * 100) / 100;
}

async function refundForTransaction(transaction: VtuTransaction, reason: string): Promise<void> {
  if (transaction.paymentMethod === "wallet") {
    await refundWallet(transaction.userId, transaction.amountPaid);
    await finalizeTransactionFailure(transaction.id, "refunded", reason);
    return;
  }

  // Direct Flutterwave payments are not auto-refunded here — there is no
  // confirmed Flutterwave refund endpoint wired in yet, and reversing a real
  // charge automatically is too risky to guess at. Flag it clearly instead.
  await finalizeTransactionFailure(transaction.id, "delivery_failed", reason);
  console.error(`[vtu] ALERT: customer refund required (Flutterwave) for transaction ${transaction.id}: ${reason}`);
}

export async function deliverData(transactionId: string): Promise<DeliverOutcome> {
  const transaction = await claimForDelivery(transactionId);

  if (transaction.status !== "processing") {
    // Already a terminal state — short-circuit, never deliver twice.
    return {
      delivered: transaction.status === "successful",
      status: transaction.status as DeliverOutcome["status"],
      providerUsed: transaction.providerUsed,
      providerRef: transaction.providerRef,
      needsManualReview: false,
    };
  }

  const dataPlan = transaction.type === "data" && transaction.planId ? await loadDataPlan(transaction.planId) : null;

  const primary = getPrimaryDataProvider();
  const fallback = getFallbackDataProvider();
  const primaryName = providerNameOf(primary);
  const fallbackName = providerNameOf(fallback);

  const primaryPlanId = dataPlan ? getProviderPlanId(dataPlan, primaryName) : null;
  let primaryResult = await attempt(primary, transaction, primaryPlanId);

  if (primaryResult.status === "ambiguous") {
    const resolved = await resolveAmbiguous(primary, transaction);
    if (resolved === null) {
      await writeReconciliation({
        transactionId: transaction.id,
        failedProvider: primaryName,
        requestId: transaction.requestId,
        amountStuck: dataPlan ? getProviderCost(dataPlan, primaryName) ?? transaction.amountPaid : transaction.amountPaid,
        reason: "Primary provider result was ambiguous and could not be confirmed via requery — held to avoid risking double delivery",
        status: "manual_review_required",
      });
      await finalizeTransactionFailure(
        transaction.id,
        "delivery_failed",
        "Primary provider result could not be confirmed; flagged for manual review"
      );
      console.error(`[vtu] ALERT: transaction ${transaction.id} needs manual review (unconfirmed primary result)`);
      return { delivered: false, status: "delivery_failed", providerUsed: null, providerRef: null, needsManualReview: true };
    }
    primaryResult = resolved;
  }

  if (primaryResult.status === "success") {
    const fee = transaction.paymentMethod === "flutterwave" ? transaction.flutterwaveFee : 0;
    const vat = vatFor(fee);
    await finalizeTransactionSuccess(transaction.id, {
      providerUsed: primaryName,
      providerRef: primaryResult.providerRef,
      providerCost: primaryResult.cost ?? (dataPlan ? getProviderCost(dataPlan, primaryName) : null),
      flutterwaveFee: fee,
      vat,
      profit: profitFor(transaction.amountPaid, primaryResult.cost ?? (dataPlan ? getProviderCost(dataPlan, primaryName) : null), fee, vat),
    });
    return { delivered: true, status: "successful", providerUsed: primaryName, providerRef: primaryResult.providerRef, needsManualReview: false };
  }

  // Primary definitively failed — fail over to the fallback with the SAME requestId.
  const fallbackPlanId = dataPlan ? getProviderPlanId(dataPlan, fallbackName) : null;
  let fallbackResult = await attempt(fallback, transaction, fallbackPlanId);

  if (fallbackResult.status === "ambiguous") {
    const resolved = await resolveAmbiguous(fallback, transaction);
    if (resolved === null) {
      await writeReconciliation({
        transactionId: transaction.id,
        failedProvider: fallbackName,
        requestId: transaction.requestId,
        amountStuck: dataPlan ? getProviderCost(dataPlan, fallbackName) ?? transaction.amountPaid : transaction.amountPaid,
        reason: "Fallback provider result was ambiguous and could not be confirmed via requery",
        status: "manual_review_required",
      });
      await finalizeTransactionFailure(
        transaction.id,
        "delivery_failed",
        "Fallback provider result could not be confirmed; flagged for manual review"
      );
      console.error(`[vtu] ALERT: transaction ${transaction.id} needs manual review (unconfirmed fallback result)`);
      return { delivered: false, status: "delivery_failed", providerUsed: null, providerRef: null, needsManualReview: true };
    }
    fallbackResult = resolved;
  }

  if (fallbackResult.status === "success") {
    const fee = transaction.paymentMethod === "flutterwave" ? transaction.flutterwaveFee : 0;
    const vat = vatFor(fee);
    const cost = fallbackResult.cost ?? (dataPlan ? getProviderCost(dataPlan, fallbackName) : null);

    await finalizeTransactionSuccess(transaction.id, {
      providerUsed: fallbackName,
      providerRef: fallbackResult.providerRef,
      providerCost: cost,
      flutterwaveFee: fee,
      vat,
      profit: profitFor(transaction.amountPaid, cost, fee, vat),
    });

    // Customer is served — chase the primary provider for a refund separately.
    await writeReconciliation({
      transactionId: transaction.id,
      failedProvider: primaryName,
      requestId: transaction.requestId,
      amountStuck: dataPlan ? getProviderCost(dataPlan, primaryName) ?? transaction.amountPaid : transaction.amountPaid,
      reason: `Primary (${primaryName}) failed: ${primaryResult.message ?? "unknown reason"}; delivered via fallback (${fallbackName})`,
      status: "refund_pending",
    });

    return { delivered: true, status: "successful", providerUsed: fallbackName, providerRef: fallbackResult.providerRef, needsManualReview: false };
  }

  // Both providers failed — refund the customer and log an alert.
  await refundForTransaction(
    transaction,
    `Both providers failed. Primary (${primaryName}): ${primaryResult.message ?? "unknown"}. Fallback (${fallbackName}): ${fallbackResult.message ?? "unknown"}.`
  );
  console.error(`[vtu] ALERT: transaction ${transaction.id} failed on both providers`);

  return {
    delivered: false,
    status: transaction.paymentMethod === "wallet" ? "refunded" : "delivery_failed",
    providerUsed: null,
    providerRef: null,
    needsManualReview: false,
  };
}
