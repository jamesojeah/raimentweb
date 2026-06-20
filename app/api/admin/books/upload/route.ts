import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminBucket, getAdminDb } from "@/lib/firebaseAdmin";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const productId = form.get("productId");

    if (!(file instanceof File) || typeof productId !== "string" || !productId) {
      return NextResponse.json({ error: "Missing file or productId" }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    const bucket = getAdminBucket();
    const objectName = `PRODUCT_MEDIA_${Date.now()}.pdf`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await bucket.file(objectName).save(buffer, {
      contentType: "application/pdf",
      metadata: { cacheControl: "public, max-age=31536000" },
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectName)}?alt=media`;

    const db = getAdminDb();
    await db
      .collection("products")
      .doc(productId)
      .update({
        additional_media: FieldValue.arrayUnion({ type: "pdf", url }),
      });

    return NextResponse.json({ success: true, url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
