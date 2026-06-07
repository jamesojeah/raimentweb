import { collection, getDocs, doc, getDoc, query, where, limit } from "firebase/firestore";
import { db } from "./firebase";
import type { Product } from "@/types/product";

// Handles the most common Firestore field name variants from Android/iOS apps.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseProduct(id: string, data: Record<string, any>): Product {
  // Name: try name → title → productName → itemName
  const name: string =
    data.name ?? data.title ?? data.productName ?? data.itemName ?? "";

  // Images: try images[] → imageUrls[] → imageUrl (string) → image (string) → photos[]
  let images: string[] = [];
  if (Array.isArray(data.images) && data.images.length > 0) {
    images = data.images;
  } else if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
    images = data.imageUrls;
  } else if (Array.isArray(data.photos) && data.photos.length > 0) {
    images = data.photos;
  } else if (typeof data.imageUrl === "string" && data.imageUrl) {
    images = [data.imageUrl];
  } else if (typeof data.image === "string" && data.image) {
    images = [data.image];
  }

  // inStock: treat missing/undefined as true (assume in stock unless explicitly false or qty = 0)
  const inStock: boolean =
    data.inStock !== undefined
      ? Boolean(data.inStock)
      : data.stockQuantity !== undefined
      ? data.stockQuantity > 0
      : data.available !== undefined
      ? Boolean(data.available)
      : true;

  return {
    id,
    name,
    price: Number(data.price ?? 0),
    description: data.description ?? data.desc ?? "",
    images,
    category: data.category ?? data.productCategory ?? "",
    inStock,
    stockQuantity: data.stockQuantity ?? data.stock ?? data.quantity,
    tags: Array.isArray(data.tags) ? data.tags : [],
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const snap = await getDocs(collection(db, "products"));
  if (snap.docs.length > 0) {
    console.log("[Raiment] Raw Firestore fields:", Object.keys(snap.docs[0].data()));
    console.log("[Raiment] First product raw data:", snap.docs[0].data());
  }
  return snap.docs.map((d) => normaliseProduct(d.id, d.data()));
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, "products", id));
  if (!snap.exists()) return null;
  return normaliseProduct(snap.id, snap.data() as Record<string, unknown>);
}

export async function fetchProductsByCategory(
  category: string,
  excludeId: string,
  maxCount = 4
): Promise<Product[]> {
  const q = query(
    collection(db, "products"),
    where("category", "==", category),
    limit(maxCount + 1)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => normaliseProduct(d.id, d.data()))
    .filter((p) => p.id !== excludeId)
    .slice(0, maxCount);
}
