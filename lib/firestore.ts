import { collection, getDocs, doc, getDoc, query, where, limit } from "firebase/firestore";
import { db } from "./firebase";
import { normaliseProduct } from "./normaliseProduct";
import type { Product } from "@/types/product";

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
