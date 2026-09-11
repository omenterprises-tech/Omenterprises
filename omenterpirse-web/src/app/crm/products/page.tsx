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
  CheckCircle2,
  Copy,
  FolderTree,
} from "lucide-react";
import ProductModal from "@/components/crm/ProductModal";
import { alphabeticalCompare } from "@/lib/utils";

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

  // Filtered products sorted alphabetically (A → Z)
  const filteredProducts = useMemo(() => {
    let list = products;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = products.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.hsn?.toLowerCase().includes(q) ||
          p.unit?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) =>
      alphabeticalCompare(a.name || "", b.name || "")
    );
  }, [products, searchQuery]);

  // Group products by main category and sort each group alphabetically by product name (A → Z)
  const groupedProducts = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const prod of filteredProducts) {
      const cat = (prod.category || "General").trim() || "General";
      if (!map[cat]) map[cat] = [];
      map[cat].push(prod);
    }

    const sortedCategories = Object.keys(map).sort((a, b) =>
      alphabeticalCompare(a, b)
    );

    return sortedCategories.map((category) => ({
      category,
      products: [...map[category]].sort((a, b) =>
        alphabeticalCompare(a.name || "", b.name || "")
      ),
    }));
  }, [filteredProducts]);

  const openAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditProduct = (prod: any) => {
    setEditingProduct(prod);
    setIsModalOpen(true);
  };

  const openDuplicateAsVariant = (prod: any) => {
    setEditingProduct({
      ...prod,
      _isClone: true,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!confirm(`Are you sure you want to delete product "${productName}"?`)) return;
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
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                <Package size={18} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-gray-900 tracking-tight text-base">
                    Product Catalog
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
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-amber-600 shrink-0" />
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
                Inventory & Catalog Parts
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Standard parts, equipment, and items for customer commercial quotations
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
                  placeholder="Search name, HSN, category..."
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
                    <th className="pb-3">HSN / Code</th>
                    <th className="pb-3">Base Price</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {groupedProducts.map((group) => (
                    <React.Fragment key={group.category}>
                      {/* Main Category Header Row */}
                      <tr className="bg-slate-50/90 border-t-2 border-b border-slate-200/80">
                        <td colSpan={4} className="py-2.5 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-brand"></span>
                              <span className="text-xs font-black uppercase tracking-wider text-gray-900 font-inter">
                                {group.category}
                              </span>
                              <span className="text-[10px] font-bold text-gray-500 bg-white px-2.5 py-0.5 rounded-full border border-gray-200">
                                {group.products.length} {group.products.length === 1 ? "Product" : "Products"}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Products under Main Category */}
                      {group.products.map((prod) => (
                        <tr key={prod.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-4 font-bold text-gray-900 text-xs sm:text-sm pl-4">
                            <div>{prod.name}</div>
                            {prod.unit && (
                              <div className="text-[11px] text-gray-400 font-normal mt-0.5">
                                Unit: {prod.unit}
                              </div>
                            )}
                          </td>
                          <td className="py-4 text-xs">
                            {prod.hsn ? (
                              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold border border-gray-200">
                                {prod.hsn}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-normal">—</span>
                            )}
                          </td>
                          <td className="py-4 font-bold text-gray-900 text-xs sm:text-sm">
                            <div>
                              ₹{Number(prod.basePrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              {prod.unit ? <span className="text-gray-500 text-xs font-normal"> / {prod.unit}</span> : ""}
                            </div>
                            {prod.gst !== null && prod.gst !== undefined && (
                              <div className="text-[11px] text-gray-400 font-normal">
                                GST: {prod.gst}%
                              </div>
                            )}
                          </td>
                          <td className="py-4 text-right pr-4">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => openDuplicateAsVariant(prod)}
                                className="p-1.5 text-gray-400 hover:text-brand hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Duplicate as new variant (keeps common brand & category details)"
                              >
                                <Copy size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditProduct(prod)}
                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit product"
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
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Product Create / Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        initialProduct={editingProduct}
        onClose={closeModal}
        onProductCreated={(newProd) => {
          setProducts((prev) => [newProd, ...prev]);
          showToast("Product added successfully!");
        }}
        onProductsCreated={(newProds) => {
          setProducts((prev) => [...newProds, ...prev]);
          showToast(`${newProds.length} products created successfully!`);
        }}
        onProductSaved={(updatedProd) => {
          setProducts((prev) =>
            prev.map((p) => (p.id === updatedProd.id ? updatedProd : p))
          );
          showToast("Product updated successfully!");
        }}
      />
    </div>
  );
}
