import type { Product, ProductMedia } from "@/types/product";

// Handles the most common Firestore field name variants from Android/iOS apps.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normaliseProduct(id: string, data: Record<string, any>): Product {
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

  // Additional media: try additionalMedia[] → additional_media[] (mobile app field)
  const rawMedia = data.additionalMedia ?? data.additional_media;
  const additionalMedia: ProductMedia[] = Array.isArray(rawMedia)
    ? rawMedia
        .filter((m): m is Record<string, unknown> => typeof m === "object" && m !== null)
        .map((m) => ({
          type: typeof m.type === "string" ? m.type : "image",
          url: typeof m.url === "string" ? m.url : "",
        }))
        .filter((m) => m.url.length > 0)
    : [];

  return {
    id,
    name,
    price: Number(data.price ?? 0),
    description: data.description ?? data.desc ?? "",
    images,
    additionalMedia,
    category: data.category ?? data.productCategory ?? "",
    inStock,
    stockQuantity: data.stockQuantity ?? data.stock ?? data.quantity,
    tags: Array.isArray(data.tags) ? data.tags : [],
  };
}
