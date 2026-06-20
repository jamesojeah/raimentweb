import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { productId, url } = (await req.json()) as {
      productId?: unknown;
      url?: unknown;
    };

    if (typeof productId !== "string" || !productId || typeof url !== "string" || !url) {
      return NextResponse.json({ error: "Missing productId or url" }, { status: 400 });
    }

    const db = getAdminDb();
    await db
      .collection("products")
      .doc(productId)
      .update({
        additional_media: FieldValue.arrayRemove({ type: "pdf", url }),
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Remove failed" },
      { status: 500 }
    );
  }
}
