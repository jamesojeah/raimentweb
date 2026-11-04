"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Product, QualityTier } from "@/types/product";
import { QUALITY_TIERS } from "@/types/product";

const LOW_STOCK_THRESHOLD = 3;
const RECENT_DAYS = 7;

type StatusFilter = "active" | "archived" | "all";

interface ProductFormState {
  name: string;
  price: string;
  brand: string;
  qualityTier: QualityTier | "";
  category: string;
  description: string;
  stockQuantity: string;
  inStock: boolean;
}

const EMPTY_FORM: ProductFormState = {
  name: "",
  price: "",
  brand: "",
  qualityTier: "",
  category: "",
  description: "",
  stockQuantity: "",
  inStock: true,
};

function formatDate(ms?: number): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const loadProducts = useCallback(async () => {
    setLoadError("");
    try {
      const res = await fetch("/api/admin/products");
      if (!res.ok) throw new Error("Failed to load products");
      const data = (await res.json()) as { products: Product[] };
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

  const stats = useMemo(() => {
    const active = products.filter((p) => !p.archived);
    const soldOut = active.filter((p) => !p.inStock || p.stockQuantity === 0).length;
    const lowStock = active.filter(
      (p) => p.inStock && p.stockQuantity !== undefined && p.stockQuantity > 0 && p.stockQuantity <= LOW_STOCK_THRESHOLD
    ).length;
    const recentCutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
    const recentlyAdded = active.filter((p) => (p.createdAt ?? 0) >= recentCutoff).length;
    return { total: active.length, soldOut, lowStock, recentlyAdded };
  }, [products]);

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => {
        if (statusFilter === "active") return !p.archived;
        if (statusFilter === "archived") return !!p.archived;
        return true;
      })
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          (p.brand ?? "").toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      });
  }, [products, statusFilter, search]);

  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setExistingImages([]);
    setNewImageFiles([]);
    setFormError("");
    setFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: String(product.price),
      brand: product.brand ?? "",
      qualityTier: product.qualityTier ?? "",
      category: product.category,
      description: product.description,
      stockQuantity: product.stockQuantity !== undefined ? String(product.stockQuantity) : "",
      inStock: product.inStock,
    });
    setExistingImages(product.images);
    setNewImageFiles([]);
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const price = Number(form.price);
    if (!name) {
      setFormError("Name is required");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setFormError("Enter a valid price");
      return;
    }

    setSaving(true);
    try {
      let uploadedUrls: string[] = [];
      if (newImageFiles.length > 0) {
        const uploadForm = new FormData();
        newImageFiles.forEach((f) => uploadForm.append("files", f));
        const uploadRes = await fetch("/api/admin/products/upload", {
          method: "POST",
          body: uploadForm,
        });
        if (!uploadRes.ok) {
          const data = (await uploadRes.json()) as { error?: string };
          throw new Error(data.error ?? "Image upload failed");
        }
        const uploadData = (await uploadRes.json()) as { urls: string[] };
        uploadedUrls = uploadData.urls;
      }

      const payload = {
        name,
        price,
        brand: form.brand.trim(),
        qualityTier: form.qualityTier || null,
        category: form.category.trim(),
        description: form.description,
        stockQuantity: form.stockQuantity === "" ? null : Number(form.stockQuantity),
        inStock: form.inStock,
        images: [...existingImages, ...uploadedUrls],
      };

      const res = editingId
        ? await fetch(`/api/admin/products/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Save failed");
      }

      closeForm();
      await loadProducts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const patchProduct = async (id: string, updates: Record<string, unknown>) => {
    setRowBusyId(id);
    setRowError((e) => ({ ...e, [id]: "" }));
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Update failed");
      }
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } as Product : p)));
    } catch (err) {
      setRowError((e) => ({ ...e, [id]: err instanceof Error ? err.message : "Update failed" }));
    } finally {
      setRowBusyId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      <div className="pt-[62px] pb-5 px-4" style={{ background: "linear-gradient(180deg, #0d0d0d 0%, #1a0a2e 100%)" }}>
        <div className="max-w-5xl mx-auto pt-4">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-white text-xl font-bold">Product Catalog</h1>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              Log out
            </button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-purple-300 text-xs">Manage what&apos;s live on the site</p>
            <Link href="/admin/books" className="text-xs text-white/50 hover:text-white/80 transition-colors">
              Book uploads →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Products", value: stats.total },
            { label: "Sold out", value: stats.soldOut },
            { label: "Low stock", value: stats.lowStock },
            { label: "Added this week", value: stats.recentlyAdded },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="flex gap-1.5">
            {(["active", "archived", "all"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer capitalize ${
                  statusFilter === f ? "text-white" : "text-gray-500 bg-white"
                }`}
                style={statusFilter === f ? { background: "linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)" } : undefined}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by name, brand, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 sm:w-64 px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 outline-none focus:border-[#7C3AED]"
            />
            <button
              onClick={openAddForm}
              className="text-xs font-bold text-white px-4 py-2 rounded-full whitespace-nowrap cursor-pointer"
              style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)" }}
            >
              + Add product
            </button>
          </div>
        </div>

        {loading && <p className="text-sm text-gray-400">Loading…</p>}
        {loadError && <p className="text-sm text-red-500">{loadError}</p>}
        {!loading && !loadError && visibleProducts.length === 0 && (
          <p className="text-sm text-gray-400">No products to show.</p>
        )}

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-xl bg-purple-50 flex-shrink-0 overflow-hidden">
                  {product.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-800 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {[product.brand, product.qualityTier].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="text-sm font-bold text-[#7C3AED] mt-0.5">₦{product.price.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 text-[11px] text-gray-400">
                <span>Added {formatDate(product.createdAt)}</span>
                {product.archived && (
                  <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">Archived</span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => patchProduct(product.id, { inStock: !product.inStock })}
                  disabled={rowBusyId === product.id}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-full cursor-pointer disabled:opacity-50 ${
                    product.inStock ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {product.inStock ? "In stock" : "Sold out"}
                </button>
                <button
                  onClick={() => openEditForm(product)}
                  className="text-xs font-semibold text-[#7C3AED] bg-purple-50 px-3 py-1.5 rounded-full cursor-pointer hover:bg-purple-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => patchProduct(product.id, { archived: !product.archived })}
                  disabled={rowBusyId === product.id}
                  className="text-xs font-semibold text-gray-400 hover:text-red-500 px-2 py-1.5 rounded-full cursor-pointer disabled:opacity-50"
                >
                  {product.archived ? "Restore" : "Archive"}
                </button>
              </div>
              {rowError[product.id] && <p className="text-[11px] text-red-500 mt-1.5">{rowError[product.id]}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Add / edit modal */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-md my-8 space-y-3"
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-gray-800">{editingId ? "Edit product" : "Add product"}</h2>
              <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
                required
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#7C3AED] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Price (₦) *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#7C3AED] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Brand</label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#7C3AED] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Quality</label>
                <select
                  value={form.qualityTier}
                  onChange={(e) => setForm((f) => ({ ...f, qualityTier: e.target.value as QualityTier | "" }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#7C3AED] focus:bg-white"
                >
                  <option value="">—</option>
                  {QUALITY_TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Tote Bags"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#7C3AED] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#7C3AED] focus:bg-white resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Stock qty</label>
                <input
                  type="number"
                  min={0}
                  value={form.stockQuantity}
                  onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#7C3AED] focus:bg-white"
                />
              </div>
              <label className="flex items-center gap-2 pb-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.inStock}
                  onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))}
                  className="w-4 h-4 accent-[#7C3AED]"
                />
                <span className="text-xs font-semibold text-gray-600">In stock</span>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Photos</label>
              {existingImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {existingImages.map((url) => (
                    <div key={url} className="relative w-14 h-14 rounded-lg overflow-hidden bg-purple-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setExistingImages((imgs) => imgs.filter((u) => u !== url))}
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] cursor-pointer"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setNewImageFiles(Array.from(e.target.files ?? []))}
                className="text-xs text-gray-500 w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-[#7C3AED] hover:file:bg-purple-100 cursor-pointer"
              />
            </div>

            {formError && <p className="text-xs text-red-500">{formError}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)" }}
              >
                {saving ? "Saving…" : editingId ? "Save changes" : "Publish"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
