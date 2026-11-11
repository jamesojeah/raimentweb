import type { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { PROMO_CODE } from "@/lib/promo";

// The promo is for a customer's first order only. "First order" is decided from Firestore:
//  1. any document in the shared `orders` collection for this user (the iOS/Android apps write
//     `user_id`; some documents use `userId`), or
//  2. a previous redemption of the code on the website, recorded in `promoRedemptions`.
// Both checks fail closed - if Firestore can't be read the code is NOT applied.

const REDEMPTIONS = "promoRedemptions";

export type PromoCheck =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function getRequestUid(req: NextRequest): Promise<string | null> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

function redemptionRef(uid: string) {
  return getAdminDb().collection(REDEMPTIONS).doc(`${PROMO_CODE}_${uid}`);
}

export async function checkPromoEligibility(uid: string): Promise<PromoCheck> {
  try {
    const db = getAdminDb();
    const [snakeCase, camelCase, redemption] = await Promise.all([
      db.collection("orders").where("user_id", "==", uid).limit(1).get(),
      db.collection("orders").where("userId", "==", uid).limit(1).get(),
      redemptionRef(uid).get(),
    ]);

    if (!snakeCase.empty || !camelCase.empty) {
      return {
        ok: false,
        status: 409,
        error: `${PROMO_CODE} is for first orders only — you've already placed an order with us.`,
      };
    }
    if (redemption.exists && redemption.data()?.status === "redeemed") {
      return { ok: false, status: 409, error: `You've already used ${PROMO_CODE}.` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[promo] eligibility check failed", err);
    return {
      ok: false,
      status: 503,
      error: "We couldn't verify your promo code right now. Please try again.",
    };
  }
}

// Called at payment initiation: ties the discount to this transaction so it can only be
// redeemed by a payment that was actually started with the code applied.
export async function reservePromo(uid: string, txRef: string): Promise<PromoCheck> {
  try {
    const ref = redemptionRef(uid);
    return await getAdminDb().runTransaction(async (tx): Promise<PromoCheck> => {
      const snap = await tx.get(ref);
      if (snap.exists && snap.data()?.status === "redeemed") {
        return { ok: false, status: 409, error: `You've already used ${PROMO_CODE}.` };
      }
      tx.set(ref, {
        code: PROMO_CODE,
        uid,
        status: "reserved",
        txRef,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { ok: true };
    });
  } catch (err) {
    console.error("[promo] reserve failed", err);
    return {
      ok: false,
      status: 503,
      error: "We couldn't verify your promo code right now. Please try again.",
    };
  }
}

// Called after Flutterwave confirms the payment. Only a reservation made for this exact
// transaction is redeemed, so the client cannot claim or skip a redemption.
export async function redeemPromoForTransaction(uid: string, txRef: string): Promise<boolean> {
  try {
    const ref = redemptionRef(uid);
    return await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data();
      if (!snap.exists || data?.status !== "reserved" || data.txRef !== txRef) return false;
      tx.update(ref, {
        status: "redeemed",
        redeemedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return true;
    });
  } catch (err) {
    console.error(`[promo] ALERT: could not record redemption for ${txRef}`, err);
    return false;
  }
}
