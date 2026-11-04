import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { normaliseProduct } from "@/lib/normaliseProduct";
import { QUALITY_TIERS, type QualityTier } from "@/types/product";

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection("products").get();
    const products = snap.docs
      .map((d) => normaliseProduct(d.id, d.data()))
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: unknown;
      price?: unknown;
      description?: unknown;
      brand?: unknown;
      qualityTier?: unknown;
      category?: unknown;
      inStock?: unknown;
      stockQuantity?: unknown;
      images?: unknown;
      tags?: unknown;
    };

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const price = Number(body.price);

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "A valid price is required" }, { status: 400 });
    }

    const qualityTier: QualityTier | null =
      typeof body.qualityTier === "string" && QUALITY_TIERS.includes(body.qualityTier as QualityTier)
        ? (body.qualityTier as QualityTier)
        : null;

    const images = Array.isArray(body.images)
      ? body.images.filter((u): u is string => typeof u === "string")
      : [];
    const tags = Array.isArray(body.tags)
      ? body.tags.filter((t): t is string => typeof t === "string")
      : [];

    const db = getAdminDb();
    const docRef = await db.collection("products").add({
      name,
      price,
      description: typeof body.description === "string" ? body.description : "",
      brand: typeof body.brand === "string" && body.brand.trim() ? body.brand.trim() : null,
      qualityTier,
      category: typeof body.category === "string" ? body.category.trim() : "",
      inStock: body.inStock === undefined ? true : Boolean(body.inStock),
      stockQuantity:
        body.stockQuantity === undefined || body.stockQuantity === null || body.stockQuantity === ""
          ? null
          : Number(body.stockQuantity),
      images,
      additionalMedia: [],
      tags,
      archived: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create product" },
      { status: 500 }
    );
  }
}
