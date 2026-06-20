import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { normaliseProduct } from "@/lib/normaliseProduct";
import { isDigitalProduct } from "@/lib/shipping";
import { isPdfMedia } from "@/lib/media";

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection("products").get();

    const products = snap.docs
      .map((d) => normaliseProduct(d.id, d.data()))
      .filter((p) => isDigitalProduct(p.name))
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        pdfs: p.additionalMedia.filter(isPdfMedia),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load products" },
      { status: 500 }
    );
  }
}
