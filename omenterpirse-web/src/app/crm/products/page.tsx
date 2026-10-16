"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCrmSessionStore } from "@/store/useCrmSessionStore";
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
  ChevronDown,
  Layers,
  LayoutGrid,
  List,
  X,
  Folder,
  FolderOpen,
  FolderPlus,
  Settings,
  Sliders,
  Check,
  Tag,
  CornerDownRight,
  ArrowUp,
  Sparkles,
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

export interface FolderTreeItem {
  id: string; // full path joined by '__'
  name: string; // folder name
  fullPath: string[];
  depth: number;
  subFolders: FolderTreeItem[];
  leafProducts: any[];
  totalProductsCount: number;
}

// Build hierarchical recursive folder tree down to unlimited levels
function buildCatalogHierarchyTree(productList: any[]): FolderTreeItem[] {
  const rootMap: Record<string, any[]> = {};
  for (const prod of productList) {
    const hier = getProductHierarchy(prod);
    const rootCat = hier[0] || "General";
    if (!rootMap[rootCat]) rootMap[rootCat] = [];
    rootMap[rootCat].push(prod);
  }

  function buildNode(name: string, path: string[], prods: any[]): FolderTreeItem {
    const depth = path.length;
    const subCatMap: Record<string, any[]> = {};
    const directLeaves: any[] = [];

    for (const p of prods) {
      const hier = getProductHierarchy(p);
      if (hier.length <= depth) {
        directLeaves.push(p);
      } else {
        const nextSeg = hier[depth];
        if (!subCatMap[nextSeg]) subCatMap[nextSeg] = [];
        subCatMap[nextSeg].push(p);
      }
    }

    const subFolders: FolderTreeItem[] = [];
    const leafProducts = [...directLeaves];

    for (const [subName, subProds] of Object.entries(subCatMap)) {
      const hasDeeper = subProds.some((p) => getProductHierarchy(p).length > depth + 1);
      if (hasDeeper) {
        subFolders.push(buildNode(subName, [...path, subName], subProds));
      } else {
        for (const p of subProds) {
          if (!leafProducts.some((lp) => lp.id === p.id)) {
            leafProducts.push(p);
          }
        }
      }
    }

    subFolders.sort((a, b) => alphabeticalCompare(a.name, b.name));
    leafProducts.sort((a, b) => alphabeticalCompare(a.name || "", b.name || ""));

    return {
      id: path.join("__"),
      name,
      fullPath: path,
      depth: path.length,
      subFolders,
      leafProducts,
      totalProductsCount: prods.length,
    };
  }

  const rootNodes: FolderTreeItem[] = [];
  for (const [rootName, prods] of Object.entries(rootMap)) {
    rootNodes.push(buildNode(rootName, [rootName], prods));
  }

  rootNodes.sort((a, b) => alphabeticalCompare(a.name, b.name));
  return rootNodes;
}

export default function CrmProductsPage() {
  const router = useRouter();
  const storeUser = useCrmSessionStore((s) => s.user);
  const storeBusiness = useCrmSessionStore((s) => s.business);
  const fetchSession = useCrmSessionStore((s) => s.fetchSession);

  const [user, setUser] = useState<any>(storeUser);
  const [business, setBusiness] = useState<any>(storeBusiness);
  const [isLoadingSession, setIsLoadingSession] = useState(!storeUser);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Products data & search
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [productCategoryPath, setProductCategoryPath] = useState<string[]>([]);

  // Accordion expanded state for list view
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Product modal state (Add/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Notification Toast
  const [notification, setNotification] = useState<string | null>(null);

  // Rename Category Modal State
  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    categoryPath: string[];
    currentName: string;
    newName: string;
    count: number;
    loading: boolean;
    error?: string;
  }>({
    isOpen: false,
    categoryPath: [],
    currentName: "",
    newName: "",
    count: 0,
    loading: false,
  });

  // Edit Category Details Modal State (GST, Base Price, Unit, HSN)
  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean;
    categoryPath: string[];
    currentName: string;
    count: number;
    gst: string;
    basePrice: string;
    unit: string;
    hsn: string;
    loading: boolean;
    error?: string;
  }>({
    isOpen: false,
    categoryPath: [],
    currentName: "",
    count: 0,
    gst: "",
    basePrice: "",
    unit: "",
    hsn: "",
    loading: false,
  });

  // Add Sub-Category Modal State
  const [addSubCategoryModal, setAddSubCategoryModal] = useState<{
    isOpen: boolean;
    parentPath: string[];
    subCategoryName: string;
    loading: boolean;
    error?: string;
  }>({
    isOpen: false,
    parentPath: [],
    subCategoryName: "",
    loading: false,
  });

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
    router.prefetch("/crm/dashboard");

    async function init() {
      try {
        const [sessionData, prodData] = await Promise.all([
          fetchSession(),
          fetch("/api/crm/products").then((r) => r.json()).catch(() => ({ success: false })),
        ]);

        if (!sessionData.authenticated) {
          router.replace("/crm");
          return;
        }
        if (!sessionData.isOnboardingCompleted) {
          router.replace("/crm/onboarding");
          return;
        }
        setUser(sessionData.user);
        setBusiness(sessionData.business);

        if (prodData?.success && prodData.products) {
          setProducts(prodData.products);
        }
      } catch (err) {
        console.error("Failed to load CRM session or products:", err);
      } finally {
        setIsLoadingSession(false);
        setIsLoadingProducts(false);
      }
    }
    init();
  }, [router, fetchSession]);

  // Hierarchical Catalog Tree
  const catalogHierarchyTree = useMemo(() => {
    return buildCatalogHierarchyTree(products);
  }, [products]);

  // Initialize top-level folders to expanded in list mode
  useEffect(() => {
    if (catalogHierarchyTree.length > 0) {
      setExpandedFolders((prev) => {
        const next = { ...prev };
        catalogHierarchyTree.forEach((item) => {
          if (next[item.id] === undefined) {
            next[item.id] = true;
          }
        });
        return next;
      });
    }
  }, [catalogHierarchyTree]);

  // Toggle single accordion folder
  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Expand / Collapse all accordion folders
  const handleToggleExpandAll = (expand: boolean) => {
    if (!expand) {
      setExpandedFolders({});
    } else {
      const all: Record<string, boolean> = {};
      const traverse = (items: FolderTreeItem[]) => {
        for (const item of items) {
          all[item.id] = true;
          if (item.subFolders.length > 0) {
            traverse(item.subFolders);
          }
        }
      };
      traverse(catalogHierarchyTree);
      setExpandedFolders(all);
    }
  };

  // 1. All products matching current category drill-down path in Cards view
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

  // 2. Next-level sub-category groups and leaf products for drill-down cards view
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
      fullPath: string[];
    }> = [];

    const finalLeaves = [...directLeaves];

    for (const [name, prods] of Object.entries(subCatMap)) {
      const fullPath = [...productCategoryPath, name];
      if (depth === 0) {
        // Main categories level: always display as category cards
        groups.push({
          name,
          count: prods.length,
          products: prods,
          fullPath,
        });
      } else {
        // Check if any product in this group has deeper hierarchy levels beyond depth + 1
        const hasDeeper = prods.some((p) => getProductHierarchy(p).length > depth + 1);
        if (hasDeeper) {
          groups.push({
            name,
            count: prods.length,
            products: prods,
            fullPath,
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

  // Product Actions
  const openAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openAddProductUnderCategory = (categoryPath: string[], mode: "single" | "batch" = "single") => {
    setEditingProduct({
      category: categoryPath[0] || "General",
      specifications: {
        hierarchy: categoryPath,
      },
      name: "",
      price: "",
      basePrice: "",
      _mode: mode,
    });
    setIsModalOpen(true);
  };

  const openAddSubCategoryModal = (parentPath: string[]) => {
    setAddSubCategoryModal({
      isOpen: true,
      parentPath,
      subCategoryName: "",
      loading: false,
    });
  };

  const handleCreateSubCategoryWithSingle = () => {
    const name = addSubCategoryModal.subCategoryName.trim();
    if (!name) {
      setAddSubCategoryModal((prev) => ({ ...prev, error: "Please enter a sub-category name." }));
      return;
    }
    const fullPath = [...addSubCategoryModal.parentPath, name];
    setAddSubCategoryModal((prev) => ({ ...prev, isOpen: false }));
    openAddProductUnderCategory(fullPath, "single");
  };

  const handleCreateSubCategoryWithBatch = () => {
    const name = addSubCategoryModal.subCategoryName.trim();
    if (!name) {
      setAddSubCategoryModal((prev) => ({ ...prev, error: "Please enter a sub-category name." }));
      return;
    }
    const fullPath = [...addSubCategoryModal.parentPath, name];
    setAddSubCategoryModal((prev) => ({ ...prev, isOpen: false }));
    openAddProductUnderCategory(fullPath, "batch");
  };

  const handleQuickCreateSubCategoryFolder = async () => {
    const name = addSubCategoryModal.subCategoryName.trim();
    if (!name) {
      setAddSubCategoryModal((prev) => ({ ...prev, error: "Please enter a sub-category name." }));
      return;
    }
    setAddSubCategoryModal((prev) => ({ ...prev, loading: true, error: undefined }));
    try {
      const fullPath = [...addSubCategoryModal.parentPath, name];
      const mainCat = fullPath[0] || "General";
      const res = await fetch("/api/crm/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${name} ${addSubCategoryModal.parentPath.join(" ")}`.trim(),
          price: 0,
          category: mainCat,
          specifications: {
            hierarchy: fullPath,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Created sub-category "${name}".`);
        setAddSubCategoryModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        await loadProducts();
      } else {
        setAddSubCategoryModal((prev) => ({
          ...prev,
          error: data.error || "Failed to create sub-category.",
          loading: false,
        }));
      }
    } catch (err: any) {
      setAddSubCategoryModal((prev) => ({
        ...prev,
        error: err.message || "Failed to create sub-category.",
        loading: false,
      }));
    }
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

  // Category Actions: Rename Category
  const openRenameCategoryModal = (categoryPath: string[], currentName: string, count: number) => {
    setRenameModal({
      isOpen: true,
      categoryPath,
      currentName,
      newName: currentName,
      count,
      loading: false,
    });
  };

  const handleConfirmRenameCategory = async () => {
    const { categoryPath, newName } = renameModal;
    const trimmed = newName.trim();
    if (!trimmed) {
      setRenameModal((prev) => ({ ...prev, error: "Category name cannot be empty." }));
      return;
    }
    setRenameModal((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      const res = await fetch("/api/crm/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rename_category",
          categoryPath,
          newName: trimmed,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Renamed category to "${trimmed}" across ${data.updatedCount} products.`);
        const targetIdx = categoryPath.length - 1;
        setProductCategoryPath((prev) => {
          if (
            prev.length > targetIdx &&
            prev[targetIdx]?.toLowerCase() === categoryPath[targetIdx]?.toLowerCase()
          ) {
            const next = [...prev];
            next[targetIdx] = trimmed;
            return next;
          }
          return prev;
        });
        setRenameModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        await loadProducts();
      } else {
        setRenameModal((prev) => ({
          ...prev,
          error: data.error || "Failed to rename category.",
          loading: false,
        }));
      }
    } catch (err: any) {
      setRenameModal((prev) => ({
        ...prev,
        error: err.message || "Failed to rename category.",
        loading: false,
      }));
    }
  };

  // Category Actions: Edit Details (GST, Base Price, Unit, HSN)
  const openEditCategoryDetailsModal = (categoryPath: string[], currentName: string, count: number) => {
    // Look up sample product under this path for existing defaults
    const sample = products.find((p) => {
      const hier = getProductHierarchy(p);
      return categoryPath.every((seg, idx) => hier[idx]?.toLowerCase() === seg.toLowerCase());
    });

    setDetailsModal({
      isOpen: true,
      categoryPath,
      currentName,
      count,
      gst: sample?.gst !== undefined && sample?.gst !== null ? String(sample.gst) : "",
      basePrice: "", // empty so it doesn't accidentally overwrite unless user specifies
      unit: sample?.unit || "",
      hsn: sample?.hsn || "",
      loading: false,
    });
  };

  const handleConfirmEditCategoryDetails = async () => {
    const { categoryPath, gst, basePrice, unit, hsn } = detailsModal;
    setDetailsModal((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      const payload: any = {
        action: "update_category_details",
        categoryPath,
      };
      if (gst.trim() !== "") payload.gst = gst.trim();
      if (basePrice.trim() !== "") payload.basePrice = basePrice.trim();
      if (unit.trim() !== "") payload.unit = unit.trim();
      if (hsn.trim() !== "") payload.hsn = hsn.trim();

      const res = await fetch("/api/crm/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          `Updated details across ${data.updatedCount} products in "${detailsModal.currentName}".`
        );
        setDetailsModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        await loadProducts();
      } else {
        setDetailsModal((prev) => ({
          ...prev,
          error: data.error || "Failed to update category details.",
          loading: false,
        }));
      }
    } catch (err: any) {
      setDetailsModal((prev) => ({
        ...prev,
        error: err.message || "Failed to update category details.",
        loading: false,
      }));
    }
  };

  if (isLoadingSession && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-gray-500 font-medium text-sm">Loading Product Catalog...</p>
      </div>
    );
  }

  const businessName = business?.businessName || "Your Business";

  // Recursive Accordion Component for List View
  const renderAccordionFolder = (node: FolderTreeItem) => {
    const isExpanded = Boolean(expandedFolders[node.id]);
    const hasChildren = node.subFolders.length > 0 || node.leafProducts.length > 0;
    const isRootLevel = node.depth === 1;

    return (
      <div
        key={node.id}
        className={`border rounded-2xl overflow-hidden transition-all duration-150 ${
          isRootLevel
            ? "border-gray-200/90 bg-white shadow-xs mb-3"
            : "border-gray-100 bg-gray-50/50 my-2 ml-4 sm:ml-6"
        }`}
      >
        {/* Folder Header Row */}
        <div
          onClick={() => toggleFolder(node.id)}
          className={`flex flex-wrap items-center justify-between p-3.5 sm:p-4 cursor-pointer select-none transition-colors group ${
            isExpanded
              ? isRootLevel
                ? "bg-slate-50/90 border-b border-gray-200/80"
                : "bg-blue-50/40 border-b border-blue-100/60"
              : "hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <button
              type="button"
              className="p-1 rounded-lg text-gray-400 group-hover:text-gray-700 transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isRootLevel
                  ? "bg-brand/10 text-brand"
                  : "bg-amber-500/10 text-amber-600"
              }`}
            >
              {isExpanded ? <FolderOpen size={17} /> : <Folder size={17} />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-900 truncate">
                  {node.name}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-gray-500 border border-gray-200 shrink-0">
                  {isRootLevel ? "Main Category" : `Sub-Level ${node.depth}`}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">
                {node.totalProductsCount} {node.totalProductsCount === 1 ? "Product" : "Products"}
                {node.subFolders.length > 0 && ` • ${node.subFolders.length} sub-categories`}
              </p>
            </div>
          </div>

          {/* Action buttons on Folder */}
          <div
            className="flex items-center space-x-1.5 shrink-0 mt-2 sm:mt-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => openRenameCategoryModal(node.fullPath, node.name, node.totalProductsCount)}
              className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:text-brand hover:bg-white bg-gray-100/80 border border-gray-200 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
              title={`Rename category "${node.name}"`}
            >
              <Edit3 size={12} />
              <span className="hidden sm:inline">Rename</span>
            </button>

            <button
              type="button"
              onClick={() => openEditCategoryDetailsModal(node.fullPath, node.name, node.totalProductsCount)}
              className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:text-amber-700 hover:bg-amber-50 bg-gray-100/80 border border-gray-200 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
              title={`Edit category details (GST, Base Price) for "${node.name}"`}
            >
              <Sliders size={12} />
              <span className="hidden sm:inline">Details</span>
            </button>

            <button
              type="button"
              onClick={() => openAddProductUnderCategory(node.fullPath)}
              className="p-1.5 text-brand hover:bg-brand/10 rounded-lg transition-colors cursor-pointer"
              title={`Add product inside "${node.name}"`}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Folder Content (Nested Sub-Folders & Leaf Products) */}
        {isExpanded && hasChildren && (
          <div className="p-2 sm:p-4 space-y-3">
            {/* 1. Nested Sub-Folders */}
            {node.subFolders.length > 0 && (
              <div className="space-y-1">
                {node.subFolders.map((sub) => renderAccordionFolder(sub))}
              </div>
            )}

            {/* 2. Direct Leaf Products */}
            {node.leafProducts.length > 0 && (
              <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200/80 bg-white">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-black uppercase tracking-wider text-gray-400">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">HSN Code</th>
                      <th className="py-2.5 px-3">Rate / Price</th>
                      <th className="py-2.5 px-3">GST %</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {node.leafProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-gray-900">
                          <div>{prod.name}</div>
                          {prod.unit && (
                            <span className="text-[10px] font-normal text-gray-400">
                              Unit: {prod.unit}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-600">
                          {prod.hsn ? (
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] border border-gray-200">
                              {prod.hsn}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-black text-brand text-xs sm:text-sm">
                          ₹{Number(prod.basePrice || prod.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          {prod.unit && <span className="text-[10px] font-normal text-gray-400"> / {prod.unit}</span>}
                        </td>
                        <td className="py-2.5 px-3">
                          {prod.gst !== null && prod.gst !== undefined ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-100">
                              {prod.gst}%
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              type="button"
                              onClick={() => openDuplicateAsVariant(prod)}
                              className="p-1.5 text-gray-400 hover:text-brand hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Duplicate as new variant"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditProduct(prod)}
                              className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit product"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 size={13} />
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
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-inter">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link
                href="/crm/dashboard"
                prefetch={true}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer mr-1"
                title="Back to Dashboard"
              >
                <ArrowLeft size={18} />
              </Link>
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
              <Link
                href="/crm/dashboard"
                prefetch={true}
                className="px-3.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
              >
                ← Back to Dashboard
              </Link>
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
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
          {/* Controls Bar: Search, View Switcher & Add */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-playfair">
                Inventory & Catalog Parts
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Multi-level hierarchical categories with folder management and instant combinations
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* View Switcher: File Manager Cards vs Hierarchical Accordion List */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "cards"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  title="File Manager Cards View"
                >
                  <LayoutGrid size={14} />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "table"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  title="Folder Hierarchical Accordions List View"
                >
                  <List size={14} />
                  <span>List</span>
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
                className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0"
              >
                <Plus size={15} />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Catalog Content Area */}
          {isLoadingProducts ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs text-gray-500 font-medium">Loading product catalog...</p>
            </div>
          ) : products.length === 0 ? (
            /* Catalog Empty State */
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-center text-amber-500">
                <Package size={28} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">No Products Added Yet</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  Build your standard catalog with hierarchical categories and combinations.
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
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
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
              ) : (
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

                        <div className="flex items-center justify-between pt-3 mt-4 border-t border-gray-100 text-xs">
                          <button
                            type="button"
                            onClick={() => openDuplicateAsVariant(prod)}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-brand hover:bg-brand/10 transition-colors font-medium cursor-pointer"
                            title="Duplicate as new variant"
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
              )}
            </div>
          ) : viewMode === "cards" ? (
            /* ================= MODE A: FILE MANAGER CARDS VIEW ================= */
            <div className="space-y-6">
              {/* File Manager Breadcrumb & Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/90 rounded-2xl p-3 sm:p-4 border border-gray-200/80 shadow-xs">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {productCategoryPath.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setProductCategoryPath((prev) => prev.slice(0, -1))}
                      className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer mr-1 shadow-xs"
                      title="Go up one folder"
                    >
                      <ArrowUp size={14} />
                      <span>Up</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setProductCategoryPath([])}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      productCategoryPath.length === 0
                        ? "bg-brand text-white shadow-xs"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <Folder size={13} />
                    <span>All Categories</span>
                  </button>

                  {productCategoryPath.map((cat, idx) => {
                    const isCurrent = idx === productCategoryPath.length - 1;
                    return (
                      <React.Fragment key={idx}>
                        <ChevronRight size={14} className="text-gray-400 shrink-0" />
                        <button
                          type="button"
                          onClick={() => setProductCategoryPath(productCategoryPath.slice(0, idx + 1))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                            isCurrent
                              ? "bg-brand text-white shadow-xs"
                              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                          }`}
                        >
                          <Folder size={13} />
                          <span>{cat}</span>
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Current Folder Action Buttons if inside a category */}
                <div className="flex items-center space-x-2">
                  {productCategoryPath.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          openRenameCategoryModal(
                            productCategoryPath,
                            productCategoryPath[productCategoryPath.length - 1],
                            currentLevelProducts.length
                          )
                        }
                        className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                        title="Rename this active folder"
                      >
                        <Edit3 size={13} />
                        <span>Rename Folder</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openEditCategoryDetailsModal(
                            productCategoryPath,
                            productCategoryPath[productCategoryPath.length - 1],
                            currentLevelProducts.length
                          )
                        }
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                        title="Edit GST, Base Price, etc. for all items in this folder"
                      >
                        <Sliders size={13} />
                        <span>Category Details</span>
                      </button>
                    </>
                  )}

                  <div className="text-xs text-gray-500 font-medium ml-2">
                    {currentLevelProducts.length} {currentLevelProducts.length === 1 ? "Product" : "Products"}
                  </div>
                </div>
              </div>

              {/* 1. Sub-Category Folders Grid (File Manager Style) */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 px-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand"></span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 font-inter">
                    {productCategoryPath.length === 0
                      ? "Folders / Main Categories"
                      : `Sub-Folders in "${productCategoryPath[productCategoryPath.length - 1]}"`}
                  </h3>
                  <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {subCategoryGroups.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {subCategoryGroups.map((group) => (
                    <div
                      key={group.name}
                      onClick={() => setProductCategoryPath([...productCategoryPath, group.name])}
                      className="p-4 rounded-2xl bg-white border border-gray-200/90 hover:border-brand hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-xs">
                          <Folder size={22} />
                        </div>

                        <div
                          className="flex items-center space-x-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => openRenameCategoryModal(group.fullPath, group.name, group.count)}
                            className="p-1 text-gray-400 hover:text-brand hover:bg-brand/10 rounded transition-colors cursor-pointer"
                            title={`Rename "${group.name}"`}
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditCategoryDetailsModal(group.fullPath, group.name, group.count)}
                            className="p-1 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                            title={`Edit details for "${group.name}"`}
                          >
                            <Sliders size={13} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors truncate">
                          {group.name}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {group.count} {group.count === 1 ? "item" : "items"}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* + New Sub-Category Card (As requested by user) */}
                  <button
                    type="button"
                    onClick={() => openAddSubCategoryModal(productCategoryPath)}
                    className="p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-brand hover:bg-brand/5 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[120px] text-center group"
                    title={
                      productCategoryPath.length === 0
                        ? "Add new Main Category"
                        : `Add new Sub-Category in "${productCategoryPath[productCategoryPath.length - 1]}"`
                    }
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-brand group-hover:text-white text-gray-400 group-hover:shadow-sm flex items-center justify-center transition-all mb-1.5">
                      <Plus size={20} />
                    </div>
                    <span className="text-xs font-bold text-gray-700 group-hover:text-brand transition-colors">
                      {productCategoryPath.length === 0 ? "+ Add Category" : "+ Add Sub-Category"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {productCategoryPath.length === 0
                        ? "New main branch"
                        : `In "${productCategoryPath[productCategoryPath.length - 1]}"`}
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Leaf Products / Final Level Files in this folder */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 px-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 font-inter">
                    {subCategoryGroups.length > 0
                      ? "Products / Items"
                      : `Products in "${productCategoryPath[productCategoryPath.length - 1] || "Catalog"}"`}
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
                            title="Duplicate as new variant"
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

                  {/* + New Sub-Product Card (As requested by user) */}
                  <button
                    type="button"
                    onClick={() => openAddProductUnderCategory(productCategoryPath)}
                    className="p-5 rounded-2xl sm:rounded-3xl border-2 border-dashed border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px] text-center group"
                    title={`Add new product in "${productCategoryPath[productCategoryPath.length - 1] || "Catalog"}"`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-gray-100 group-hover:bg-emerald-500 group-hover:text-white text-gray-400 group-hover:shadow-sm flex items-center justify-center transition-all mb-2">
                      <Plus size={22} />
                    </div>
                    <span className="text-xs font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">
                      + Add Sub-Product
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      {productCategoryPath.length === 0
                        ? "New catalog item"
                        : `In "${productCategoryPath[productCategoryPath.length - 1]}"`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================= MODE B: FOLDER HIERARCHICAL ACCORDIONS LIST VIEW ================= */
            <div className="space-y-4">
              {/* Accordion Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 rounded-2xl p-3 sm:p-4 border border-gray-200/80">
                <div className="flex items-center space-x-2 text-xs font-bold text-gray-700">
                  <FolderTree size={16} className="text-brand" />
                  <span>Folder Hierarchical Structure ({catalogHierarchyTree.length} Main Categories)</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleToggleExpandAll(true)}
                    className="px-3 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleExpandAll(false)}
                    className="px-3 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {/* Render Multi-level Recursive Accordions */}
              <div className="space-y-2">
                {catalogHierarchyTree.map((rootNode) => renderAccordionFolder(rootNode))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ================= CATEGORY RENAME MODAL ================= */}
      {renameModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                  <Edit3 size={16} />
                </div>
                <h3 className="text-base font-bold text-gray-900">Rename Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setRenameModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">
                  Category Path:
                </label>
                <div className="flex items-center flex-wrap gap-1 text-xs font-bold text-brand bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
                  {renameModal.categoryPath.map((seg, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="text-gray-300">›</span>}
                      <span className={i === renameModal.categoryPath.length - 1 ? "text-brand underline" : "text-gray-600"}>
                        {seg}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  New Category Name: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={renameModal.newName}
                  onChange={(e) => setRenameModal((prev) => ({ ...prev, newName: e.target.value }))}
                  placeholder="Enter new name"
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>

              <p className="text-[11px] text-gray-500">
                ⚡ This will safely rename the category and update product names across{" "}
                <span className="font-bold text-gray-900">{renameModal.count}</span> matching products without deleting any nested levels.
              </p>

              {renameModal.error && (
                <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                  {renameModal.error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRenameModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRenameCategory}
                disabled={renameModal.loading}
                className="px-5 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
              >
                {renameModal.loading && <Loader2 size={13} className="animate-spin" />}
                <span>Save New Name</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT CATEGORY DETAILS MODAL (GST, Base Price, Unit, HSN) ================= */}
      {detailsModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Sliders size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Category Details</h3>
                  <p className="text-[11px] text-gray-500 font-medium truncate max-w-xs">
                    Apply to {detailsModal.count} products in &quot;{detailsModal.currentName}&quot;
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    GST %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={detailsModal.gst}
                    onChange={(e) => setDetailsModal((prev) => ({ ...prev, gst: e.target.value }))}
                    placeholder="e.g. 18"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={detailsModal.hsn}
                    onChange={(e) => setDetailsModal((prev) => ({ ...prev, hsn: e.target.value }))}
                    placeholder="e.g. 8544"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Base Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={detailsModal.basePrice}
                    onChange={(e) => setDetailsModal((prev) => ({ ...prev, basePrice: e.target.value }))}
                    placeholder="Leave blank to keep existing"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={detailsModal.unit}
                    onChange={(e) => setDetailsModal((prev) => ({ ...prev, unit: e.target.value }))}
                    placeholder="e.g. PCS, COILS"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </div>
              </div>

              <p className="text-[11px] text-gray-500">
                💡 Only filled fields will be updated across all {detailsModal.count} products under this category branch. Blank fields will keep their current individual product values.
              </p>

              {detailsModal.error && (
                <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                  {detailsModal.error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDetailsModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEditCategoryDetails}
                disabled={detailsModal.loading}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
              >
                {detailsModal.loading && <Loader2 size={13} className="animate-spin" />}
                <span>Update Category Products</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sub-Category Modal */}
      {addSubCategoryModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FolderPlus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Add New Sub-Category</h3>
                  <p className="text-[11px] text-gray-500">
                    Inside: <span className="font-semibold text-gray-700">{addSubCategoryModal.parentPath.join(" › ") || "Root"}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddSubCategoryModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Sub-Category / Folder Name *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={addSubCategoryModal.subCategoryName}
                  onChange={(e) => setAddSubCategoryModal((prev) => ({ ...prev, subCategoryName: e.target.value, error: undefined }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateSubCategoryWithSingle();
                    }
                  }}
                  placeholder="e.g. 0.40 MM, Premium Grade, Mumbai"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>

              {addSubCategoryModal.error && (
                <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                  {addSubCategoryModal.error}
                </p>
              )}

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/60 space-y-2">
                <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                  Choose how to create items inside this sub-category:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCreateSubCategoryWithSingle}
                    className="p-2.5 bg-white hover:bg-brand/5 border border-gray-200 hover:border-brand/40 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-900 group-hover:text-brand">
                      <Plus size={14} className="text-brand" />
                      <span>Single Product</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Open product form with this category pre-selected
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateSubCategoryWithBatch}
                    className="p-2.5 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700 group-hover:text-indigo-900">
                      <Sparkles size={14} className="text-indigo-600" />
                      <span>Generator</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Batch generate multi-level variant combinations
                    </p>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleQuickCreateSubCategoryFolder}
                disabled={addSubCategoryModal.loading}
                className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 underline underline-offset-2 cursor-pointer disabled:opacity-50"
              >
                {addSubCategoryModal.loading ? "Creating..." : "Quick Create Folder Only"}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setAddSubCategoryModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateSubCategoryWithSingle}
                  className="px-5 py-2 bg-brand hover:bg-brand/90 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center space-x-1.5"
                >
                  <span>Continue</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
