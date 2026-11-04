import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { QUALITY_TIERS, type QualityTier } from "@/types/product";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
      archived?: unknown;
    };

    // Partial update: only fields present in the request body are touched, so this
    // route serves both the full edit form and one-field actions (stock toggle, archive).
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updates.name = name;
    }

    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: "A valid price is required" }, { status: 400 });
      }
      updates.price = price;
    }

    if (body.description !== undefined) {
      updates.description = typeof body.description === "string" ? body.description : "";
    }

    if (body.brand !== undefined) {
      updates.brand =
        typeof body.brand === "string" && body.brand.trim() ? body.brand.trim() : null;
    }

    if (body.qualityTier !== undefined) {
      const qualityTier: QualityTier | null =
        typeof body.qualityTier === "string" && QUALITY_TIERS.includes(body.qualityTier as QualityTier)
          ? (body.qualityTier as QualityTier)
          : null;
      updates.qualityTier = qualityTier;
    }

    if (body.category !== undefined) {
      updates.category = typeof body.category === "string" ? body.category.trim() : "";
    }

    if (body.inStock !== undefined) {
      updates.inStock = Boolean(body.inStock);
    }

    if (body.stockQuantity !== undefined) {
      updates.stockQuantity =
        body.stockQuantity === null || body.stockQuantity === ""
          ? null
          : Number(body.stockQuantity);
    }

    if (body.images !== undefined) {
      updates.images = Array.isArray(body.images)
        ? body.images.filter((u): u is string => typeof u === "string")
        : [];
    }

    if (body.tags !== undefined) {
      updates.tags = Array.isArray(body.tags)
        ? body.tags.filter((t): t is string => typeof t === "string")
        : [];
    }

    if (body.archived !== undefined) {
      updates.archived = Boolean(body.archived);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection("products").doc(id).update(updates);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update product" },
      { status: 500 }
    );
  }
}
