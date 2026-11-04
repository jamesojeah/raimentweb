import { NextRequest, NextResponse } from "next/server";
import { getAdminBucket } from "@/lib/firebaseAdmin";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB per image
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    for (const file of files) {
      if (!ALLOWED_TYPES[file.type]) {
        return NextResponse.json(
          { error: `Unsupported image type: ${file.type || file.name}` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `${file.name} is too large (max 8MB)` },
          { status: 400 }
        );
      }
    }

    const bucket = getAdminBucket();

    const urls = await Promise.all(
      files.map(async (file, i) => {
        const ext = ALLOWED_TYPES[file.type];
        const objectName = `PRODUCT_IMAGE_${Date.now()}_${i}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        await bucket.file(objectName).save(buffer, {
          contentType: file.type,
          metadata: { cacheControl: "public, max-age=31536000" },
        });

        return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectName)}?alt=media`;
      })
    );

    return NextResponse.json({ success: true, urls });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
