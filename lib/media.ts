import type { ProductMedia } from "@/types/product";

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".ogg", ".m4v", ".avi"];

export function isVideoUrl(url: string): boolean {
  const path = url.split("?")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext));
}

export function isPdfUrl(url: string): boolean {
  const path = url.split("?")[0].toLowerCase();
  return path.endsWith(".pdf");
}

export function isPdfMedia(media: ProductMedia): boolean {
  return media.type === "pdf" || media.type === "document" || isPdfUrl(media.url);
}
