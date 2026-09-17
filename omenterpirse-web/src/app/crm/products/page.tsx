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
  ChevronRight,
  Layers,
  LayoutGrid,
  List,
  X,
} from "lucide-react";
import ProductModal from "@/components/crm/ProductModal";
import { alphabeticalCompare } from "@/lib/utils";

// Helper to safely extract full category hierarchy path from product specifications
function getProductHierarchy(prod: any): string[] {
  try {
    let specs = prod.specifications;
    if (typeof specs === "string") {
      specs = JSON.parse(specs);
    }
    if (specs && Array.isArray(specs.hierarchy) && specs.hierarchy.length > 0) {
      const clean = specs.hierarchy.map((h: any) => String(h).trim()).filter(Boolean);
      if (clean.length > 0) return clean;
    }
  } catch (e) {}

  const cat = (prod.category || "General").trim() || "General";
  return [cat];
}

export default function CrmProductsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Products data & search
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [productCategoryPath, setProductCategoryPath] = useState<string[]>([]);

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

  // 1. All products matching the current category drill-down path
  const currentLevelProducts = useMemo(() => {
    if (productCategoryPath.length === 0) return products;
    return products.filter((prod) => {
      const hier = getProductHierarchy(prod);
      if (hier.length < productCategoryPath.length) return false;
      for (let i = 0; i < productCategoryPath.length; i++) {
        if (hier[i].toLowerCase() !== productCategoryPath[i].toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [products, productCategoryPath]);

  // 2. Next-level sub-category groups and leaf products for drill-down navigation
  const { subCategoryGroups, leafProducts } = useMemo(() => {
    const depth = productCategoryPath.length;
    const subCatMap: Record<string, any[]> = {};
    const directLeaves: any[] = [];

    for (const prod of currentLevelProducts) {
      const hier = getProductHierarchy(prod);
      if (hier.length <= depth) {
        directLeaves.push(prod);
      } else {
        const nextSegment = hier[depth];
        if (!subCatMap[nextSegment]) {
          subCatMap[nextSegment] = [];
        }
        subCatMap[nextSegment].push(prod);
      }
    }

    const groups: Array<{
      name: string;
      count: number;
      products: any[];
    }> = [];

    const finalLeaves = [...directLeaves];

    for (const [name, prods] of Object.entries(subCatMap)) {
      if (depth === 0) {
        // Main categories level: always display as category cards
        groups.push({
          name,
          count: prods.length,
          products: prods,
        });
      } else {
        // Check if any product in this group has deeper hierarchy levels beyond depth + 1
        const hasDeeper = prods.some((p) => getProductHierarchy(p).length > depth + 1);
        if (hasDeeper) {
          groups.push({
            name,
            count: prods.length,
            products: prods,
          });
        } else {
          // Hierarchy has ended for this branch! Each product is a selectable final leaf
          for (const p of prods) {
            if (!finalLeaves.some((fl) => fl.id === p.id)) {
              finalLeaves.push(p);
            }
          }
        }
      }
    }

    groups.sort((a, b) => alphabeticalCompare(a.name, b.name));
    finalLeaves.sort((a, b) => alphabeticalCompare(a.name || "", b.name || ""));

    return { subCategoryGroups: groups, leafProducts: finalLeaves };
  }, [currentLevelProducts, productCategoryPath]);

  // 3. Search results across all products when searchQuery is active
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return products
      .filter((p) => {
        const hier = getProductHierarchy(p);
        const hierMatch = hier.some((h) => h.toLowerCase().includes(q));
        const nameMatch = p.name?.toLowerCase().includes(q);
        const catMatch = p.category?.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const hsnMatch = p.hsn?.toLowerCase().includes(q);
        const unitMatch = p.unit?.toLowerCase().includes(q);
        return hierMatch || nameMatch || catMatch || descMatch || hsnMatch || unitMatch;
      })
      .sort((a, b) => alphabeticalCompare(a.name || "", b.name || ""));
  }, [products, searchQuery]);

  // Filtered products sorted alphabetically (A → Z) for Table View
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

  // Group products by main category for Table View
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
          {/* Controls Bar: Search, View Switcher & Add */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-playfair">
                Inventory & Catalog Parts
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Standard parts, equipment, and items for customer commercial quotations
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* View Switcher: Hierarchical Cards vs Flat Table */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "cards"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  title="Hierarchical Category Cards View"
                >
                  <LayoutGrid size={14} />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "table"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  title="Full Catalog Table View"
                >
                  <List size={14} />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 sm:flex-initial">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, HSN, category..."
                  className="w-full sm:w-64 pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Add Product Button */}
              <button
                type="button"
                onClick={openAddProduct}
                className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
              >
                <Plus size={15} />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Catalog Content Area */}
          {products.length === 0 ? (
            /* Catalog Empty State */
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-center text-amber-500">
                <Package size={28} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">No Products Added Yet</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  Build your standard catalog with base prices to quickly insert them into customer quotations.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddProduct}
                className="mt-2 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow hover:bg-brand-hover transition-all cursor-pointer"
              >
                + Add First Product
              </button>
            </div>
          ) : searchQuery.trim() ? (
            /* Search Results View */
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand"></span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 font-inter">
                    Search Results
                  </h3>
                  <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {searchResults.length} {searchResults.length === 1 ? "Product" : "Products"} found
                  </span>
                </div>
              </div>

              {searchResults.length === 0 ? (
                <div className="py-12 border border-gray-200/80 rounded-2xl text-center space-y-3 bg-gray-50/40">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                    <Search size={22} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">
                    No products match &ldquo;{searchQuery}&rdquo;
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Try searching with another keyword or clear the search bar.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              ) : viewMode === "cards" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((prod) => {
                    const hier = getProductHierarchy(prod);
                    const leafLabel = hier.length > 0 ? hier[hier.length - 1] : prod.name;
                    return (
                      <div
                        key={prod.id}
                        className="p-5 rounded-2xl sm:rounded-3xl bg-white border border-gray-200/90 hover:border-brand/50 hover:shadow-md transition-all flex flex-col justify-between group"
                      >
                        <div className="space-y-3">
                          {/* Breadcrumb path chips */}
                          {hier.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 text-[11px] text-gray-500 font-medium">
                              {hier.map((step, sIdx) => (
                                <React.Fragment key={sIdx}>
                                  {sIdx > 0 && <span className="text-gray-300">›</span>}
                                  <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md text-[10px]">
                                    {step}
                                  </span>
                                </React.Fragment>
                              ))}
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors">
                                {leafLabel}
                              </h4>
                              {prod.name && prod.name !== leafLabel && (
                                <p className="text-xs text-gray-500 font-medium line-clamp-2 mt-0.5">
                                  {prod.name}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-base font-black text-brand">
                                ₹{Number(prod.basePrice || prod.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                              {prod.unit && (
                                <span className="text-[10px] text-gray-500 block uppercase font-bold">
                                  per {prod.unit}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-xs pt-2 border-t border-gray-100">
                            {prod.hsn && prod.hsn.trim() !== "" && prod.hsn !== "-" && (
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold text-[10px] border border-gray-200">
                                HSN: {prod.hsn}
                              </span>
                            )}
                            {prod.gst !== null && prod.gst !== undefined && prod.gst > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-100">
                                GST: {prod.gst}%
                              </span>
                            )}
                            {prod.unit && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold text-[10px] border border-amber-200">
                                Unit: {prod.unit}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-3 mt-4 border-t border-gray-100 text-xs">
                          <button
                            type="button"
                            onClick={() => openDuplicateAsVariant(prod)}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-brand hover:bg-brand/10 transition-colors font-medium cursor-pointer"
                            title="Duplicate as new variant (keeps common category & specs)"
                          >
                            <Copy size={13} />
                            <span>Clone</span>
                          </button>
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => openEditProduct(prod)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors font-bold cursor-pointer border border-amber-200"
                              title="Edit product"
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Table view for search results */
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
                      {searchResults.map((prod) => (
                        <tr key={prod.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-4 font-bold text-gray-900 text-xs sm:text-sm pl-2">
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
                              ₹{Number(prod.basePrice || prod.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              {prod.unit ? <span className="text-gray-500 text-xs font-normal"> / {prod.unit}</span> : ""}
                            </div>
                            {prod.gst !== null && prod.gst !== undefined && (
                              <div className="text-[11px] text-gray-400 font-normal">
                                GST: {prod.gst}%
                              </div>
                            )}
                          </td>
                          <td className="py-4 text-right pr-2">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => openDuplicateAsVariant(prod)}
                                className="p-1.5 text-gray-400 hover:text-brand hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Duplicate as new variant"
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
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : viewMode === "cards" ? (
            /* Hierarchical Card Drill-Down View */
            <div className="space-y-6">
              {/* Breadcrumb Navigation Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 rounded-2xl p-3 sm:p-4 border border-gray-200/80 shadow-xs">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {productCategoryPath.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setProductCategoryPath((prev) => prev.slice(0, -1))}
                      className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer mr-1 shadow-xs"
                      title="Go back one level"
                    >
                      <ArrowLeft size={14} />
                      <span>Back</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setProductCategoryPath([])}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      productCategoryPath.length === 0
                        ? "bg-brand text-white shadow-xs"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    All Categories
                  </button>

                  {productCategoryPath.map((cat, idx) => {
                    const isCurrent = idx === productCategoryPath.length - 1;
                    return (
                      <React.Fragment key={idx}>
                        <ChevronRight size={14} className="text-gray-400 shrink-0" />
                        <button
                          type="button"
                          onClick={() => setProductCategoryPath(productCategoryPath.slice(0, idx + 1))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-brand text-white shadow-xs"
                              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                          }`}
                        >
                          {cat}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>

                <div className="text-xs text-gray-500 font-medium">
                  {currentLevelProducts.length} {currentLevelProducts.length === 1 ? "Product" : "Products"} available
                </div>
              </div>

              {/* 1. Sub-Category Cards Grid */}
              {subCategoryGroups.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 px-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand"></span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 font-inter">
                      {productCategoryPath.length === 0
                        ? "Main Categories"
                        : `Sub-Categories in ${productCategoryPath[productCategoryPath.length - 1]}`}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                      {subCategoryGroups.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {subCategoryGroups.map((group) => (
                      <div
                        key={group.name}
                        onClick={() => setProductCategoryPath([...productCategoryPath, group.name])}
                        className="p-5 rounded-2xl sm:rounded-3xl bg-white border border-gray-200/90 hover:border-brand hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-xs">
                            {productCategoryPath.length === 0 ? <Layers size={22} /> : <FolderTree size={22} />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors truncate">
                              {group.name}
                            </h4>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              {group.count} {group.count === 1 ? "product" : "products"}
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-gray-50 group-hover:bg-brand/10 text-gray-400 group-hover:text-brand flex items-center justify-center transition-colors shrink-0">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Leaf Products / Final Level Cards */}
              {leafProducts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 px-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 font-inter">
                      {subCategoryGroups.length > 0 ? "Products / Variants" : `Products in ${productCategoryPath[productCategoryPath.length - 1] || "Catalog"}`}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                      {leafProducts.length} {leafProducts.length === 1 ? "Product" : "Products"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leafProducts.map((prod) => {
                      const hier = getProductHierarchy(prod);
                      const leafLabel = hier.length > 0 ? hier[hier.length - 1] : prod.name;

                      return (
                        <div
                          key={prod.id}
                          className="p-5 rounded-2xl sm:rounded-3xl bg-white border border-gray-200/90 hover:border-brand/50 hover:shadow-md transition-all flex flex-col justify-between group"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors">
                                  {leafLabel}
                                </h4>
                                {prod.name && prod.name !== leafLabel && (
                                  <p className="text-xs text-gray-500 font-medium line-clamp-2 mt-0.5">
                                    {prod.name}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-base font-black text-brand">
                                  ₹{Number(prod.basePrice || prod.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </span>
                                {prod.unit && (
                                  <span className="text-[10px] text-gray-500 block uppercase font-bold">
                                    per {prod.unit}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 text-xs pt-2 border-t border-gray-100">
                              {prod.hsn && prod.hsn.trim() !== "" && prod.hsn !== "-" && (
                                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold text-[10px] border border-gray-200">
                                  HSN: {prod.hsn}
                                </span>
                              )}
                              {prod.gst !== null && prod.gst !== undefined && prod.gst > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-100">
                                  GST: {prod.gst}%
                                </span>
                              )}
                              {prod.unit && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold text-[10px] border border-amber-200">
                                  Unit: {prod.unit}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-3 mt-4 border-t border-gray-100 text-xs">
                            <button
                              type="button"
                              onClick={() => openDuplicateAsVariant(prod)}
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-brand hover:bg-brand/10 transition-colors font-medium cursor-pointer"
                              title="Duplicate as new variant (keeps common brand & category details)"
                            >
                              <Copy size={13} />
                              <span>Clone</span>
                            </button>
                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => openEditProduct(prod)}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors font-bold cursor-pointer border border-amber-200"
                                title="Edit product"
                              >
                                <Edit3 size={13} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete product"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state at drilled level */}
              {subCategoryGroups.length === 0 && leafProducts.length === 0 && (
                <div className="py-12 border border-gray-200/80 rounded-2xl text-center space-y-3 bg-gray-50/40">
                  <p className="text-sm text-gray-600 font-medium">No products found in this category.</p>
                  <button
                    type="button"
                    onClick={() => setProductCategoryPath([])}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Back to All Categories
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Preserved Table View */
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
