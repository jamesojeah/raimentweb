import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { PROMO_CODE, getPromoDiscount } from "@/lib/promo";
import { NIGERIAN_STATES, getShippingFee, isDigitalProduct } from "@/lib/shipping";

// Website orders are written to the shared `orders` collection. Each document carries BOTH
// formats found there so every reader can use it:
//  - the website's own shape (userId / cartItems / state / shippingFee / total / orderstatus /
//    createdAt), and
//  - the iOS/Android apps' shape (user_id / items / address object / string amounts /
//    order_status / order_datetime), so the order appears in the customer's order history in
//    the apps.
// Documents are written server-side only, after Flutterwave has confirmed the payment.

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
  address: string;
  additionalNote: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

const MIN_ADDRESS_LENGTH = 5;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Returns null when the client-supplied order details are missing or malformed.
export function parseOrderPayload(raw: unknown): WebOrderPayload | null {
  if (!isRecord(raw)) return null;
  const { items, state, address, additionalNote, customerName, customerEmail, customerPhone } = raw;

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
    address: typeof address === "string" ? address.trim().slice(0, 300) : "",
    additionalNote: typeof additionalNote === "string" ? additionalNote.trim().slice(0, 300) : "",
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim(),
    customerPhone: customerPhone.trim(),
  };
}

// Mobile apps store money as strings in Dart double format ("15000.0").
function money(n: number): string {
  return n.toFixed(1);
}

interface ProductInfo {
  ownerId: string;
  stockQuantity: string;
}

// The apps' order items carry the product's owner and stock level. Best-effort: if a product
// can't be read the fields are left blank rather than failing the order.
async function loadProductInfo(ids: string[]): Promise<Map<string, ProductInfo>> {
  const info = new Map<string, ProductInfo>();
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return info;
  try {
    const db = getAdminDb();
    const snaps = await db.getAll(...unique.map((id) => db.collection("products").doc(id)));
    for (const snap of snaps) {
      if (!snap.exists) continue;
      const data = snap.data() ?? {};
      info.set(snap.id, {
        ownerId: typeof data.user_id === "string" ? data.user_id : "",
        stockQuantity: data.stock_quantity !== undefined ? String(data.stock_quantity) : "",
      });
    }
  } catch (err) {
    console.error("[orders] could not load product details for the order items", err);
  }
  return info;
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
  const subtotalAfterDiscount = subtotal - discount;

  const needsDelivery = items.length > 0 && !items.every((i) => isDigitalProduct(i.name));
  const addressMissing = needsDelivery && (payload?.address.length ?? 0) < MIN_ADDRESS_LENGTH;

  // The payment endpoint can't price the cart itself, so flag for manual review any order
  // whose items don't add up to what was charged, or whose details are missing.
  const needsReview = !payload || expectedTotal !== paidAmount || addressMissing;

  const products = await loadProductInfo(items.map((i) => i.id));
  const orderedAt = Date.now();
  const userId = uid ?? "";
  const firstImage = items[0]?.image ?? "";

  const order = {
    // --- the website's own shape ---
    userId: uid,
    cartItems: items.map((i) => ({
      id: i.id,
      image: i.image,
      name: i.name,
      price: i.price,
      salePrice: i.price,
      quantity: i.quantity,
    })),
    state: payload?.state ?? "",
    phoneNumber: payload?.customerPhone ?? "",
    shippingFee,
    total: paidAmount,
    orderstatus: "pending",
    createdAt: FieldValue.serverTimestamp(),

    // --- the iOS/Android apps' shape ---
    user_id: userId,
    id: "",
    title: `My order ${orderedAt}`,
    image: firstImage,
    order_datetime: orderedAt,
    order_status: "Pending",
    sub_total_amount: money(subtotalAfterDiscount),
    shipping_charge: money(shippingFee),
    total_amount: money(paidAmount),
    stability: 0,
    address: {
      id: "",
      type: "Home",
      name: payload?.customerName ?? "",
      mobileNumber: payload?.customerPhone ?? "",
      address: [payload?.address, payload?.state].filter(Boolean).join(", "),
      zipCode: "",
      additionalNote: payload?.additionalNote ?? "",
      otherDetails: "",
      user_id: userId,
    },
    items: items.map((i) => {
      const product = products.get(i.id);
      return {
        id: i.id,
        product_id: i.id,
        product_owner_id: product?.ownerId ?? "",
        user_id: userId,
        title: i.name,
        image: i.image,
        price: String(i.price),
        sale_price: "",
        sale_status: "",
        cart_quantity: String(i.quantity),
        stock_quantity: product?.stockQuantity ?? "",
        chosen_size: "",
        chosen_color: "Default",
        stability: 0,
      };
    }),

    // --- website-only details ---
    customerName: payload?.customerName ?? "",
    customerEmail: payload?.customerEmail ?? "",
    deliveryAddress: payload?.address ?? "",
    subtotal,
    discount,
    promoCode: promoRedeemed ? PROMO_CODE : null,
    paymentStatus: "paid",
    source: "web",
    txRef,
    transactionId,
    needsReview,
  };

  try {
    // The doc id is derived from the payment reference, so a retried verify call can't create
    // a duplicate order.
    await getAdminDb().collection("orders").doc(txRef).create(order);
    if (needsReview) {
      console.error(
        `[orders] ALERT: order ${txRef} saved but flagged for review (charged ${paidAmount}, cart computes to ${expectedTotal}, details ${payload ? "present" : "missing"}, address ${addressMissing ? "missing" : "ok"})`
      );
    }
    return true;
  } catch (err) {
    if ((err as { code?: number }).code === 6) return true; // ALREADY_EXISTS
    console.error(
      `[orders] ALERT: payment ${txRef} (transaction ${transactionId}, NGN ${paidAmount}) succeeded but the order could not be saved`,
      err
    );
    return false;
  }
}
