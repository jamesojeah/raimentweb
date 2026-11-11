import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getPromoDiscount } from "@/lib/promo";
import { NIGERIAN_STATES, getShippingFee } from "@/lib/shipping";

// Website orders are written to the shared `orders` collection in the same shape the website
// has always used there (userId / cartItems / state / shippingFee / total / orderstatus /
// createdAt), so they sit alongside the mobile apps' documents. They are written server-side
// only, after Flutterwave has confirmed the payment.

export interface WebOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface WebOrderPayload {
  items: WebOrderItem[];
  state: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Returns null when the client-supplied order details are missing or malformed.
export function parseOrderPayload(raw: unknown): WebOrderPayload | null {
  if (!isRecord(raw)) return null;
  const { items, state, customerName, customerEmail, customerPhone } = raw;

  if (!Array.isArray(items) || items.length === 0 || items.length > 100) return null;
  if (typeof state !== "string" || !(NIGERIAN_STATES as readonly string[]).includes(state)) return null;
  if (typeof customerName !== "string" || typeof customerEmail !== "string" || typeof customerPhone !== "string") {
    return null;
  }

  const parsed: WebOrderItem[] = [];
  for (const item of items) {
    if (!isRecord(item)) return null;
    const { id, name, price, quantity, image } = item;
    if (
      typeof id !== "string" ||
      typeof name !== "string" ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return null;
    }
    parsed.push({ id, name, price, quantity, image: typeof image === "string" ? image : "" });
  }

  return {
    items: parsed,
    state,
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim(),
    customerPhone: customerPhone.trim(),
  };
}

interface SaveWebOrderParams {
  uid: string | null;
  txRef: string;
  transactionId: string;
  paidAmount: number;
  payload: WebOrderPayload | null;
  promoRedeemed: boolean;
}

// Returns true when the order is stored (including when it was already stored by an earlier
// call for the same payment). Never throws: the customer has already paid, so a storage
// failure must not turn a successful payment into an error - it is logged loudly instead.
export async function saveWebOrder(params: SaveWebOrderParams): Promise<boolean> {
  const { uid, txRef, transactionId, paidAmount, payload, promoRedeemed } = params;

  const items = payload?.items ?? [];
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = promoRedeemed ? getPromoDiscount(subtotal) : 0;
  const shippingFee = payload ? getShippingFee(payload.state, items) : 0;
  const expectedTotal = subtotal - discount + shippingFee;

  // The payment endpoint can't price the cart itself, so flag any order whose items don't add
  // up to what was actually charged, or whose details were missing, for manual review.
  const needsReview = !payload || expectedTotal !== paidAmount;

  const order = {
    userId: uid,
    cartItems: items.map((i) => ({
      id: i.id,
      image: i.image,
      name: i.name,
      price: i.price,
      salePrice: i.price,
      quantity: i.quantity,
    })),
    address: payload?.state ?? "",
    state: payload?.state ?? "",
    phoneNumber: payload?.customerPhone ?? "",
    customerName: payload?.customerName ?? "",
    customerEmail: payload?.customerEmail ?? "",
    subtotal,
    discount,
    promoCode: promoRedeemed ? "RAIMENT20" : null,
    shippingFee,
    total: paidAmount,
    orderstatus: "pending",
    paymentStatus: "paid",
    source: "web",
    txRef,
    transactionId,
    needsReview,
    createdAt: FieldValue.serverTimestamp(),
  };

  try {
    // The doc id is derived from the payment reference, so a retried verify call can't create
    // a duplicate order.
    await getAdminDb().collection("orders").doc(txRef).create(order);
    if (needsReview) {
      console.error(`[orders] ALERT: order ${txRef} saved but flagged for review (charged ${paidAmount}, cart computes to ${expectedTotal}, details ${payload ? "present" : "missing"})`);
    }
    return true;
  } catch (err) {
    if ((err as { code?: number }).code === 6) return true; // ALREADY_EXISTS
    console.error(`[orders] ALERT: payment ${txRef} (transaction ${transactionId}, NGN ${paidAmount}) succeeded but the order could not be saved`, err);
    return false;
  }
}
