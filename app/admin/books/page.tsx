"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductMedia } from "@/types/product";

interface BookProduct {
  id: string;
  name: string;
  price: number;
  pdfs: ProductMedia[];
}

function fileNameFromUrl(url: string): string {
  const last = url.split("/").pop()?.split("?")[0] ?? "PDF";
  return decodeURIComponent(last);
}

export default function AdminBooksPage() {
  const router = useRouter();
  const [products, setProducts] = useState<BookProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const [inputKeys, setInputKeys] = useState<Record<string, number>>({});

  const loadProducts = useCallback(async () => {
    setLoadError("");
    try {
      const res = await fetch("/api/admin/books");
      if (!res.ok) throw new Error("Failed to load products");
      const data = (await res.json()) as { products: BookProduct[] };
      setProducts(data.products);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleUpload = async (productId: string) => {
    const file = files[productId];
    if (!file) return;

    setBusyId(productId);
    setActionErrors((e) => ({ ...e, [productId]: "" }));

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("productId", productId);

      const res = await fetch("/api/admin/books/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Upload failed");
      }

      setFiles((f) => ({ ...f, [productId]: null }));
      setInputKeys((k) => ({ ...k, [productId]: (k[productId] ?? 0) + 1 }));
      await loadProducts();
    } catch (err) {
      setActionErrors((e) => ({
        ...e,
        [productId]: err instanceof Error ? err.message : "Upload failed",
      }));
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (productId: string, url: string) => {
    setBusyId(productId);
    setActionErrors((e) => ({ ...e, [productId]: "" }));

    try {
      const res = await fetch("/api/admin/books/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, url }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Remove failed");
      }
      await loadProducts();
    } catch (err) {
      setActionErrors((e) => ({
        ...e,
        [productId]: err instanceof Error ? err.message : "Remove failed",
      }));
    } finally {
      setBusyId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      <div
        className="pt-[62px] pb-5 px-4"
        style={{ background: "linear-gradient(180deg, #0d0d0d 0%, #1a0a2e 100%)" }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between pt-4">
          <div>
            <h1 className="text-white text-xl font-bold">Book Uploads</h1>
            <p className="text-purple-300 text-xs mt-0.5">Attach PDFs to digital products</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {loading && <p className="text-sm text-gray-400">Loading…</p>}
        {loadError && <p className="text-sm text-red-500">{loadError}</p>}

        {!loading && !loadError && products.length === 0 && (
          <p className="text-sm text-gray-400">
            No products with &quot;Book&quot; or &quot;Worksheet&quot; in their name found.
          </p>
        )}

        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="mb-3">
              <p className="text-sm font-bold text-gray-800 truncate">{product.name}</p>
              <p className="text-xs text-gray-400">₦{product.price.toLocaleString()}</p>
            </div>

            {product.pdfs.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {product.pdfs.map((pdf) => (
                  <div
                    key={pdf.url}
                    className="flex items-center gap-2 text-xs bg-purple-50 text-[#7C3AED] rounded-full pl-3 pr-2 py-1.5"
                  >
                    <a
                      href={pdf.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:underline truncate max-w-[180px]"
                    >
                      {fileNameFromUrl(pdf.url)}
                    </a>
                    <button
                      onClick={() => handleRemove(product.id, pdf.url)}
                      disabled={busyId === product.id}
                      className="text-red-400 hover:text-red-500 cursor-pointer disabled:opacity-50"
                      aria-label="Remove PDF"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                key={inputKeys[product.id] ?? 0}
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  setFiles((f) => ({ ...f, [product.id]: e.target.files?.[0] ?? null }))
                }
                className="text-xs text-gray-500 flex-1 min-w-0 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-[#7C3AED] hover:file:bg-purple-100 cursor-pointer"
              />
              <button
                onClick={() => handleUpload(product.id)}
                disabled={!files[product.id] || busyId === product.id}
                className="text-xs font-bold text-white px-4 py-2 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)" }}
              >
                {busyId === product.id ? "Uploading…" : "Upload PDF"}
              </button>
            </div>

            {actionErrors[product.id] && (
              <p className="text-xs text-red-500 mt-2">{actionErrors[product.id]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
