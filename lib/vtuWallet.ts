import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

// Generic wallet primitives shared by the agent-buy VTU flow. Transaction
// document CRUD lives in lib/vtu/orders.ts — this file only knows about
// users/{userId}.walletBalance.

export class InsufficientBalanceError extends Error {
  constructor() {
    super("Insufficient wallet balance");
  }
}

export async function verifyFirebaseIdToken(idToken: string): Promise<string> {
  const decoded = await getAdminAuth().verifyIdToken(idToken);
  return decoded.uid;
}

export async function getUserIsSubAgent(userId: string): Promise<boolean> {
  const db = getAdminDb();
  const snap = await db.collection("users").doc(userId).get();
  if (!snap.exists) {
    throw new Error("User not found");
  }
  return snap.data()?.isSubAgent === true;
}

// Atomically checks the wallet balance and deducts `amount` in the same
// transaction, so two concurrent purchase requests for the same user can
// never both succeed against a balance that only covers one of them.
export async function chargeWallet(userId: string, amount: number): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(userId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) {
      throw new Error("User not found");
    }
    const walletBalance = (snap.data()?.walletBalance as number) ?? 0;
    if (walletBalance < amount) {
      throw new InsufficientBalanceError();
    }
    tx.update(userRef, { walletBalance: FieldValue.increment(-amount) });
  });
}

export async function refundWallet(userId: string, amount: number): Promise<void> {
  const db = getAdminDb();
  await db
    .collection("users")
    .doc(userId)
    .update({ walletBalance: FieldValue.increment(amount) });
}
