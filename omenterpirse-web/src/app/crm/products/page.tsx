"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Search,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function CrmProductsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Products data & search
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Product modal state (Add/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodCategory, setProdCategory] = useState("General");
  const [prodPrice, setProdPrice] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const loadProducts = async () => {
    try {
      const res = await fetch("/api/crm/products");
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/crm/auth/session");
        const data = await res.json();
        if (!data.authenticated) {
          router.replace("/crm");
          return;
        }
        if (!data.isOnboardingCompleted) {
          router.replace("/crm/onboarding");
          return;
        }
        setUser(data.user);
        setBusiness(data.business);
        await loadProducts();
      } catch (err) {
        console.error("Failed to load CRM session:", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [router]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const openAddProduct = () => {
    setEditingProduct(null);
    setProdName("");
    setProdCategory("General");
    setProdPrice("");
    setProdDesc("");
    setModalError("");
    setIsModalOpen(true);
  };

  const openEditProduct = (prod: any) => {
    setEditingProduct(prod);
    setProdName(prod.name || "");
    setProdCategory(prod.category || "General");
    setProdPrice(prod.basePrice !== undefined ? String(prod.basePrice) : "");
    setProdDesc(prod.description || "");
    setModalError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setModalError("");
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      setModalError("Product name is required.");
      return;
    }
    if (!prodPrice || isNaN(Number(prodPrice)) || Number(prodPrice) < 0) {
      setModalError("Please enter a valid price.");
      return;
    }

    setIsSubmitting(true);
    setModalError("");

    try {
      const isEditing = Boolean(editingProduct?.id);
      const res = await fetch("/api/crm/products", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { id: editingProduct.id } : {}),
          name: prodName.trim(),
          category: prodCategory.trim() || "General",
          basePrice: parseFloat(prodPrice),
          description: prodDesc.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        if (isEditing) {
          setProducts((prev) =>
            prev.map((p) => (p.id === data.product.id ? data.product : p))
          );
          showToast("Product updated successfully!");
        } else {
          setProducts((prev) => [data.product, ...prev]);
          showToast("Product added successfully!");
        }
        closeModal();
      } else {
        setModalError(data.error || `Failed to ${isEditing ? "update" : "create"} product.`);
      }
    } catch (err: any) {
      setModalError(err.message || "Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;
    try {
      const res = await fetch(`/api/crm/products?id=${productId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        showToast("Product deleted successfully.");
      } else {
        alert(data.error || "Failed to delete product.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete product.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-gray-500 font-medium text-sm">Loading Product Catalog...</p>
      </div>
    );
  }

  const businessName = business?.businessName || "Your Business";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-inter">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => router.push("/crm/dashboard")}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer mr-1"
                title="Back to Dashboard"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md">
                <Package size={18} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-gray-900 tracking-tight text-base">
                    Products & Catalog
                  </span>
                  <span className="text-[10px] bg-amber-50 text-amber-800 font-bold uppercase px-2 py-0.5 rounded-full border border-amber-200">
                    {products.length} Items
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium truncate max-w-xs">
                  {businessName}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => router.push("/crm/dashboard")}
                className="px-3.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
          {/* Controls Bar: Search & Add */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-playfair">
                Catalog Items & Pricing
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Standard parts, equipment, and labor rates for your quotation generator
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search item, category, specs..."
                  className="w-full sm:w-64 pl-9 pr-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>

              {/* Add Product Button */}
              <button
                type="button"
                onClick={openAddProduct}
                className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Plus size={15} />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Products Table */}
          {filteredProducts.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-center text-amber-500">
                <Package size={28} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">
                  {searchQuery ? "No Matching Items Found" : "No Products Added Yet"}
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  {searchQuery
                    ? `No products matched your search "${searchQuery}". Try a different keyword.`
                    : "Build your standard catalog with base prices to quickly insert them into customer quotations."}
                </p>
              </div>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={openAddProduct}
                  className="mt-2 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow hover:bg-brand-hover transition-all cursor-pointer"
                >
                  + Add First Product
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Description / Specs</th>
                    <th className="pb-3">Base Price</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 font-bold text-gray-900 text-xs sm:text-sm">
                        {prod.name}
                      </td>
                      <td className="py-4 text-xs">
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                          {prod.category || "General"}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-gray-500 max-w-xs truncate">
                        {prod.description || "—"}
                      </td>
                      <td className="py-4 font-bold text-gray-900 text-xs sm:text-sm">
                        ₹{Number(prod.basePrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => openEditProduct(prod)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit product rates & specs"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Product Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <p className="text-xs text-gray-500">
                  {editingProduct
                    ? "Update item rates, category, and specifications"
                    : "Save items, parts, or services for quotations"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Product / Item Name *
                </label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. 33kV Switchgear Panel"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    placeholder="e.g. Electrical"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Description / Specifications
                </label>
                <textarea
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Technical specs, model numbers, warranty..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand font-normal"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center justify-center space-x-1.5 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? "Save Changes" : "Add Product"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
