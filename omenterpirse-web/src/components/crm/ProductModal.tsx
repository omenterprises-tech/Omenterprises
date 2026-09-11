"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Check,
  Package,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  SlidersHorizontal,
  X,
  CheckSquare,
  Square,
  Copy,
} from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated?: (product: any) => void;
  onProductsCreated?: (products: any[]) => void;
  onProductSaved?: (product: any) => void;
  initialProduct?: any | null;
}

interface BatchSizeItem {
  id: string;
  size: string;
  price: string;
}

interface BatchMatrixRow {
  id: string;
  name: string;
  hierarchy: string[];
  size: string;
  color?: string;
  price: string;
  included: boolean;
}

const COMMON_ELECTRICAL_COLORS = [
  "RED",
  "BLACK",
  "BLUE",
  "YELLOW",
  "GREEN",
  "WHITE",
  "GREY",
];

const PRESETS = {
  wireSizes: [
    { size: "0.75 SQ MM", price: "" },
    { size: "1.0 SQ MM", price: "" },
    { size: "1.5 SQ MM", price: "" },
    { size: "2.5 SQ MM", price: "" },
    { size: "4.0 SQ MM", price: "" },
    { size: "6.0 SQ MM", price: "" },
    { size: "10.0 SQ MM", price: "" },
  ],
  mcbRatings: [
    { size: "6A", price: "" },
    { size: "10A", price: "" },
    { size: "16A", price: "" },
    { size: "20A", price: "" },
    { size: "25A", price: "" },
    { size: "32A", price: "" },
    { size: "40A", price: "" },
    { size: "63A", price: "" },
  ],
  pipeSizes: [
    { size: "20 MM", price: "" },
    { size: "25 MM", price: "" },
    { size: "32 MM", price: "" },
    { size: "40 MM", price: "" },
    { size: "50 MM", price: "" },
  ],
};

export default function ProductModal({
  isOpen,
  onClose,
  onProductCreated,
  onProductsCreated,
  onProductSaved,
  initialProduct,
}: ProductModalProps) {
  const isEditing = Boolean(initialProduct?.id && !initialProduct?._isClone);

  // Mode: "single" or "batch"
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");

  // ================= SINGLE MODE STATE =================
  const [categories, setCategories] = useState<string[]>(["", "", ""]);
  const [name, setName] = useState("");
  const [isManualName, setIsManualName] = useState(false);
  const [price, setPrice] = useState("");
  const [gst, setGst] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [hsn, setHsn] = useState("");

  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});
  const [loading, setLoading] = useState(false);
  const [isSavingSimilar, setIsSavingSimilar] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ================= BATCH MATRIX GENERATOR STATE =================
  const [batchMainCategory, setBatchMainCategory] = useState("");
  const [batchSubCategory, setBatchSubCategory] = useState("");
  const [batchUnit, setBatchUnit] = useState("COILS");
  const [batchHsn, setBatchHsn] = useState("");
  const [batchGst, setBatchGst] = useState("18");
  const [batchDescription, setBatchDescription] = useState("");

  const [batchSizes, setBatchSizes] = useState<BatchSizeItem[]>([
    { id: "s-1", size: "1.0 SQ MM", price: "" },
    { id: "s-2", size: "1.5 SQ MM", price: "" },
    { id: "s-3", size: "2.5 SQ MM", price: "" },
  ]);

  const [hasColors, setHasColors] = useState(true);
  const [batchColors, setBatchColors] = useState<string[]>([
    "RED",
    "BLACK",
    "BLUE",
    "YELLOW",
    "GREEN",
  ]);
  const [customColorInput, setCustomColorInput] = useState("");

  // Overridden prices or exclusions in matrix
  const [rowOverrides, setRowOverrides] = useState<
    Record<string, { price?: string; excluded?: boolean }>
  >({});
  const [batchErrors, setBatchErrors] = useState<string>("");

  const showLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Compile reverse hierarchical name for single mode: c b a / d c b a
  const compiledName = useMemo(() => {
    return [...categories]
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
      .reverse()
      .join(" ");
  }, [categories]);

  // Keep name synced to compiled reverse name if not manually edited
  useEffect(() => {
    if (!isManualName) {
      setName(compiledName);
    }
  }, [compiledName, isManualName]);

  // Load initial product on edit or clone
  useEffect(() => {
    if (initialProduct) {
      let loadedHierarchy: string[] = [];
      if (initialProduct.specifications) {
        try {
          const parsed =
            typeof initialProduct.specifications === "string"
              ? JSON.parse(initialProduct.specifications)
              : initialProduct.specifications;
          if (Array.isArray(parsed?.hierarchy) && parsed.hierarchy.length > 0) {
            loadedHierarchy = [...parsed.hierarchy];
          }
        } catch {
          // ignore
        }
      }

      if (loadedHierarchy.length > 0) {
        while (loadedHierarchy.length < 3) {
          loadedHierarchy.push("");
        }
        setCategories(loadedHierarchy);
        setIsManualName(false);
      } else {
        const cat =
          initialProduct.category && initialProduct.category !== "General"
            ? initialProduct.category
            : "";
        setCategories([cat, "", ""]);
        setIsManualName(true);
      }

      setName(initialProduct.name || "");
      setPrice(
        initialProduct.basePrice !== undefined && initialProduct.basePrice !== null
          ? String(initialProduct.basePrice)
          : initialProduct.price !== undefined
          ? String(initialProduct.price)
          : ""
      );
      setGst(
        initialProduct.gst !== undefined && initialProduct.gst !== null
          ? String(initialProduct.gst)
          : ""
      );
      setDescription(initialProduct.description || "");
      setUnit(initialProduct.unit || "");
      setHsn(initialProduct.hsn || "");

      // Prepopulate batch tab with same common details
      setBatchMainCategory(loadedHierarchy[0] || initialProduct.category || "");
      setBatchSubCategory(loadedHierarchy[1] || "");
      setBatchUnit(initialProduct.unit || "COILS");
      setBatchHsn(initialProduct.hsn || "");
      setBatchGst(
        initialProduct.gst !== undefined && initialProduct.gst !== null
          ? String(initialProduct.gst)
          : "18"
      );
      setBatchDescription(initialProduct.description || "");

      setActiveTab("single");
    } else {
      setCategories(["", "", ""]);
      setName("");
      setIsManualName(false);
      setPrice("");
      setGst("");
      setDescription("");
      setUnit("");
      setHsn("");
      setActiveTab("single");
    }
    setErrors({});
    setGeneralError("");
    setBatchErrors("");
    setToastMessage(null);
  }, [initialProduct, isOpen]);

  // Single mode category updater
  const updateCategoryLevel = (index: number, val: string) => {
    setCategories((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const addCategoryLevel = () => {
    setCategories((prev) => [...prev, ""]);
  };

  const removeCategoryLevel = (index: number) => {
    setCategories((prev) => prev.filter((_, idx) => idx !== index));
  };

  // ================= BATCH MATRIX CALCULATION =================
  const matrixRows = useMemo<BatchMatrixRow[]>(() => {
    const validSizes = batchSizes.filter((s) => s.size.trim().length > 0);
    const validColors = hasColors
      ? batchColors.filter((c) => c.trim().length > 0)
      : [""];

    const mainCat = batchMainCategory.trim();
    const subCat = batchSubCategory.trim();

    const rows: BatchMatrixRow[] = [];

    validSizes.forEach((szObj) => {
      const sizeVal = szObj.size.trim();
      const defaultPrice = szObj.price.trim();

      validColors.forEach((colorVal) => {
        const rowKey = `${sizeVal}__${colorVal}`;
        const override = rowOverrides[rowKey];

        // Compile reverse name: Color (d) + Size (c) + Sub-Category (b) + Main Category (a)
        const parts = [colorVal, sizeVal, subCat, mainCat]
          .map((p) => p.trim())
          .filter(Boolean);
        const compiled = parts.join(" ");

        const hierarchy = [mainCat, subCat, sizeVal, colorVal].filter(Boolean);

        rows.push({
          id: rowKey,
          name: compiled,
          hierarchy,
          size: sizeVal,
          color: colorVal || undefined,
          price: override?.price !== undefined ? override.price : defaultPrice,
          included: override?.excluded ? false : true,
        });
      });
    });

    return rows;
  }, [
    batchMainCategory,
    batchSubCategory,
    batchSizes,
    hasColors,
    batchColors,
    rowOverrides,
  ]);

  const includedCount = matrixRows.filter((r) => r.included).length;

  // Toggle all row inclusion
  const handleToggleSelectAll = () => {
    const allSelected = includedCount === matrixRows.length;
    const next: Record<string, { price?: string; excluded?: boolean }> = { ...rowOverrides };
    matrixRows.forEach((r) => {
      next[r.id] = { ...next[r.id], excluded: allSelected };
    });
    setRowOverrides(next);
  };

  // Preset loaders for batch sizes
  const applyPreset = (presetList: { size: string; price: string }[]) => {
    setBatchSizes(
      presetList.map((item, idx) => ({
        id: `sz-${idx}-${Date.now()}`,
        size: item.size,
        price: item.price,
      }))
    );
  };

  // Color chips helpers
  const toggleColorChip = (c: string) => {
    if (batchColors.includes(c)) {
      setBatchColors((prev) => prev.filter((item) => item !== c));
    } else {
      setBatchColors((prev) => [...prev, c]);
    }
  };

  const addCustomColor = () => {
    const trimmed = customColorInput.trim().toUpperCase();
    if (!trimmed) return;
    if (!batchColors.includes(trimmed)) {
      setBatchColors((prev) => [...prev, trimmed]);
    }
    setCustomColorInput("");
  };

  if (!isOpen) return null;

  // ================= SUBMIT SINGLE PRODUCT =================
  const handleSingleSubmit = async (keepCommonDetails: boolean = false) => {
    const newErrors: { name?: string; price?: string } = {};

    const finalName = name.trim() || compiledName.trim();
    if (!finalName) {
      newErrors.name = "Main Category is required to build product name";
    }

    if (!price || String(price).trim() === "") {
      newErrors.price = "Price is required";
    } else if (isNaN(Number(price)) || Number(price) < 0) {
      newErrors.price = "Please enter a valid price";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setGeneralError("");
    if (keepCommonDetails) {
      setIsSavingSimilar(true);
    } else {
      setLoading(true);
    }

    try {
      const url = "/api/crm/products";
      const method = isEditing ? "PUT" : "POST";
      const payload: any = {
        name: finalName,
        category: categories[0]?.trim() || "General",
        specifications: {
          hierarchy: categories.map((c) => c.trim()).filter(Boolean),
          notes: description.trim(),
        },
        price: parseFloat(price),
        gst: gst.trim() !== "" ? parseFloat(gst) : null,
        description: description.trim() || null,
        unit: unit.trim() || null,
        hsn: hsn.trim() || null,
      };
      if (isEditing && initialProduct?.id) {
        payload.id = initialProduct.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.product) {
        if (isEditing) {
          if (onProductSaved) onProductSaved(data.product);
          onClose();
        } else {
          if (onProductCreated) onProductCreated(data.product);

          if (keepCommonDetails) {
            // Keep Brand, Sub-Category, GST, Unit, HSN, Description intact
            // Clear only Size/Color and Price for rapid next entry
            setCategories((prev) => [prev[0] || "", prev[1] || "", ""]);
            setPrice("");
            setName("");
            setIsManualName(false);
            showLocalToast(`Added "${data.product.name}"! Common details kept.`);
          } else {
            onClose();
          }
        }
      } else {
        if (data.field === "name") {
          setErrors((prev) => ({ ...prev, name: data.error }));
        } else if (data.field === "price") {
          setErrors((prev) => ({ ...prev, price: data.error }));
        } else {
          setGeneralError(data.error || "Failed to save product.");
        }
      }
    } catch (err: any) {
      setGeneralError(err.message || "Failed to save product.");
    } finally {
      setLoading(false);
      setIsSavingSimilar(false);
    }
  };

  // ================= SUBMIT BATCH PRODUCTS =================
  const handleBatchSubmit = async () => {
    setBatchErrors("");

    if (!batchMainCategory.trim()) {
      setBatchErrors("Main Category (Brand) is required for all variants.");
      return;
    }

    const activeRows = matrixRows.filter((r) => r.included);
    if (activeRows.length === 0) {
      setBatchErrors("Please include at least one variant combination to create.");
      return;
    }

    // Check that all included rows have a valid price
    for (const r of activeRows) {
      if (!r.price || isNaN(Number(r.price)) || Number(r.price) < 0) {
        setBatchErrors(
          `Please enter a valid price for "${r.name}" or uncheck it from the list.`
        );
        return;
      }
    }

    setLoading(true);

    try {
      const parsedGst =
        batchGst.trim() !== "" ? parseFloat(batchGst) : null;

      const productsPayload = activeRows.map((r) => ({
        name: r.name,
        category: batchMainCategory.trim() || "General",
        price: parseFloat(r.price),
        gst: parsedGst,
        unit: batchUnit.trim() || null,
        hsn: batchHsn.trim() || null,
        description: batchDescription.trim() || null,
        specifications: {
          hierarchy: r.hierarchy,
          size: r.size,
          color: r.color || null,
          notes: batchDescription.trim(),
        },
      }));

      const res = await fetch("/api/crm/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: productsPayload }),
      });

      const data = await res.json();
      if (data.success && data.products) {
        if (onProductsCreated) {
          onProductsCreated(data.products);
        } else if (onProductCreated) {
          data.products.forEach((p: any) => onProductCreated(p));
        }
        onClose();
      } else {
        setBatchErrors(data.error || "Failed to create variant products.");
      }
    } catch (err: any) {
      setBatchErrors(err.message || "Network error while saving products.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col overflow-y-auto font-inter text-gray-900 animate-in fade-in duration-150">
      {/* Full-Screen Sticky Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-gray-500 hover:text-brand hover:bg-brand/5 transition-colors cursor-pointer mr-1"
                title="Back / Close"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                  {isEditing ? "Edit Product" : "Add Products to Catalog"}
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  {isEditing
                    ? "Update catalog product specifications"
                    : activeTab === "batch"
                    ? "Enter common brand & category details once, then auto-generate all sizes & colors"
                    : "Add single product or save and repeat with shared common details"}
                </p>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center space-x-2">
              {activeTab === "single" ? (
                <>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => handleSingleSubmit(true)}
                      disabled={loading || isSavingSimilar}
                      className="hidden sm:inline-flex px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-brand border border-blue-200 rounded-xl text-xs font-bold transition-all items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      title="Saves this item and keeps Brand, Sub-Category, GST, HSN & Unit for the next size/color"
                    >
                      {isSavingSimilar ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Copy size={14} />
                      )}
                      <span>Save & Add Similar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSingleSubmit(false)}
                    disabled={loading || isSavingSimilar}
                    className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        <span>{isEditing ? "Update Product" : "Save Product"}</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleBatchSubmit}
                  disabled={loading || includedCount === 0}
                  className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Create All ({includedCount}) Products</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Toast feedback */}
        {toastMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center space-x-2">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-emerald-600 hover:text-emerald-800 p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Tab Switcher (Only in create mode) */}
        {!isEditing && (
          <div className="bg-white p-1.5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab("single")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === "single"
                  ? "bg-brand text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Package size={15} />
              <span>Single Product Entry</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("batch")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer relative ${
                activeTab === "batch"
                  ? "bg-brand text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Sparkles size={15} className="text-amber-400" />
              <span>Batch Variant Generator</span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  activeTab === "batch"
                    ? "bg-white/20 text-white"
                    : "bg-blue-50 text-brand border border-blue-100"
                }`}
              >
                Fast Matrix
              </span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ==================== TAB 1: SINGLE PRODUCT FORM ========================= */}
        {/* ========================================================================= */}
        {activeTab === "single" && (
          <div className="space-y-6">
            {generalError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{generalError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSingleSubmit(false);
              }}
              className="space-y-6"
            >
              {/* Card 1: Category Hierarchy (Reverse Order Display) */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                      <Layers size={14} className="text-brand" />
                      <span>Category Hierarchy (Reverse Order Display)</span>
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Main Category (a) → Sub-Category (b) → Sub-Category (c)... Shown in documents as{" "}
                      <strong className="text-brand font-black">c b a</strong>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-brand border border-blue-100 uppercase tracking-wider">
                    Electrical Trade
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Level 1: Main Category (a) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                      <span>
                        Main Category (a) <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">e.g. FINOLEX, POLYCAB, HAVELLS</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={categories[0] || ""}
                        onChange={(e) => updateCategoryLevel(0, e.target.value)}
                        placeholder="e.g. FINOLEX, POLYCAB, HAVELLS"
                        className={`w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                          errors.name
                            ? "border border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
                            : "border border-gray-200 focus:ring-brand/30 focus:border-brand"
                        }`}
                      />
                      <Package
                        size={16}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-xs text-rose-600 font-medium mt-1 pl-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Level 2: Sub-Category (b) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                      <span>Sub-Category (b)</span>
                      <span className="text-[10px] text-gray-400 font-normal">e.g. WIRES, CABLES, PIPES, MCB</span>
                    </label>
                    <input
                      type="text"
                      value={categories[1] || ""}
                      onChange={(e) => updateCategoryLevel(1, e.target.value)}
                      placeholder="e.g. WIRES, CABLES, PIPES, MCB"
                      className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    />
                  </div>

                  {/* Level 3: Sub-Category (c - Size / Spec) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                      <span>Sub-Category (c - Size / Spec / Rating)</span>
                      <span className="text-[10px] text-gray-400 font-normal">e.g. 1.0 SQ MM, 2.5 SQ MM, 32A</span>
                    </label>
                    <input
                      type="text"
                      value={categories[2] || ""}
                      onChange={(e) => updateCategoryLevel(2, e.target.value)}
                      placeholder="e.g. 1.0 SQ MM, 2.5 SQ MM, 32A"
                      className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    />
                  </div>

                  {/* Optional Further Sub-Categories (Level 4, 5... Color, etc.) */}
                  {categories.slice(3).map((cat, idx) => {
                    const realIdx = idx + 3;
                    const letter = String.fromCharCode(100 + idx); // d, e, f...
                    return (
                      <div key={realIdx} className="flex items-center space-x-2">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Sub-Category ({letter} - Level {realIdx + 1} e.g. Color)
                          </label>
                          <input
                            type="text"
                            value={cat}
                            onChange={(e) => updateCategoryLevel(realIdx, e.target.value)}
                            placeholder={`e.g. RED, BLACK, BLUE (Level ${letter})`}
                            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCategoryLevel(realIdx)}
                          className="mt-5 p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Remove Level"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}

                  {/* Add Sub-Category Button */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={addCategoryLevel}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-brand hover:text-brand-hover bg-brand/5 hover:bg-brand/10 rounded-xl transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Add Level (e.g. Color / Grade)</span>
                    </button>
                  </div>

                  {/* Live Preview Box (c b a) */}
                  <div className="mt-3 p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      <span>Document Display Name (Reverse Order: c b a)</span>
                      <span className="text-brand font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {compiledName ? "Auto-Compiled" : "Awaiting Input"}
                      </span>
                    </div>
                    <div className="text-sm font-black text-gray-900 tracking-tight break-words">
                      {compiledName || (
                        <span className="text-gray-400 font-normal italic text-xs">
                          e.g. RED 1.0 SQ MM WIRES FINOLEX
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Manual Name Fine-Tune Expander */}
                  <div className="pt-1">
                    <details className="group">
                      <summary className="text-[11px] font-bold text-gray-500 hover:text-brand cursor-pointer select-none">
                        ▸ Fine-tune compiled product name manually
                      </summary>
                      <div className="pt-2 space-y-1.5">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            setIsManualName(true);
                          }}
                          placeholder="Product name"
                          className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-semibold text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                        />
                        {isManualName && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsManualName(false);
                              setName(compiledName);
                            }}
                            className="text-[10px] font-bold text-brand hover:underline cursor-pointer"
                          >
                            Reset to auto-compiled name ({compiledName})
                          </button>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
              </div>

              {/* Card 2: Pricing & GST */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2.5">
                  Pricing & Tax
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Base Price (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value);
                        if (errors.price) setErrors((prev) => ({ ...prev, price: undefined }));
                      }}
                      placeholder="0.00"
                      className={`w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                        errors.price
                          ? "border border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
                          : "border border-gray-200 focus:ring-brand/30 focus:border-brand"
                      }`}
                    />
                    {errors.price && (
                      <p className="text-xs text-rose-600 font-medium mt-1 pl-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{errors.price}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">GST Rate (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={gst}
                        onChange={(e) => setGst(e.target.value)}
                        placeholder="18"
                        className="w-full px-4 py-2.5 pr-10 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm pointer-events-none">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Classification & Unit */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2.5">
                  Classification & Measurement
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Unit of Measure
                    </label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="e.g. COILS, METERS, PCS, SET"
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm uppercase text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">HSN / SAC Code</label>
                    <input
                      type="text"
                      value={hsn}
                      onChange={(e) => setHsn(e.target.value)}
                      placeholder="e.g. 8544"
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-700">Specifications / Description</label>
                    <span className="text-[11px] text-gray-400 font-medium">{description.length}/2000</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Technical specifications, grade, manufacturer remarks, insulation properties..."
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all resize-none"
                  />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 pb-12">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => handleSingleSubmit(true)}
                      disabled={loading || isSavingSimilar}
                      className="flex-1 sm:flex-initial px-5 py-3.5 bg-blue-50 hover:bg-blue-100 text-brand border border-blue-200 rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingSimilar ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Copy size={15} />
                      )}
                      <span>Save & Add Similar</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={loading || isSavingSimilar}
                    className="flex-1 sm:flex-initial px-7 py-3.5 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>{isEditing ? "Update Product" : "Save Product"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ==================== TAB 2: BATCH MATRIX GENERATOR ======================= */}
        {/* ========================================================================= */}
        {activeTab === "batch" && (
          <div className="space-y-6">
            {batchErrors && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{batchErrors}</span>
              </div>
            )}

            {/* Step 1: Shared Common Details */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                    <SlidersHorizontal size={14} className="text-brand" />
                    <span>1. Common Details (Entered Once for All Variants)</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    All sizes and colors below will automatically inherit these specifications.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                  Inherited
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Main Category / Brand */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Main Category (a - Brand / Group) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={batchMainCategory}
                    onChange={(e) => setBatchMainCategory(e.target.value)}
                    placeholder="e.g. FINOLEX, POLYCAB, HAVELLS"
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                  />
                </div>

                {/* Sub-Category */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Sub-Category (b - Product Line)
                  </label>
                  <input
                    type="text"
                    value={batchSubCategory}
                    onChange={(e) => setBatchSubCategory(e.target.value)}
                    placeholder="e.g. WIRES, CABLES, PIPES, MCB"
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                  />
                </div>

                {/* Common Unit */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Common Unit of Measure
                  </label>
                  <input
                    type="text"
                    value={batchUnit}
                    onChange={(e) => setBatchUnit(e.target.value)}
                    placeholder="e.g. COILS, METERS, PCS"
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm uppercase text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                  />
                </div>

                {/* Common HSN */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Common HSN / SAC Code
                  </label>
                  <input
                    type="text"
                    value={batchHsn}
                    onChange={(e) => setBatchHsn(e.target.value)}
                    placeholder="e.g. 8544"
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                  />
                </div>

                {/* Common GST */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Common GST Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={batchGst}
                      onChange={(e) => setBatchGst(e.target.value)}
                      placeholder="18"
                      className="w-full px-4 py-2.5 pr-10 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm pointer-events-none">
                      %
                    </span>
                  </div>
                </div>

                {/* Common Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Common Description / Remarks
                  </label>
                  <input
                    type="text"
                    value={batchDescription}
                    onChange={(e) => setBatchDescription(e.target.value)}
                    placeholder="e.g. FR PVC Insulated Copper Flexible 1100V"
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Sizes / Ratings with Pricing */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                    <Layers size={14} className="text-brand" />
                    <span>2. Sizes, Specs & Base Rates (Level c)</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Enter each size or spec and its base price. Colors will automatically inherit this price.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Presets:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset(PRESETS.wireSizes)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-brand border border-blue-100 cursor-pointer"
                  >
                    + Wires
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(PRESETS.mcbRatings)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-brand border border-blue-100 cursor-pointer"
                  >
                    + MCBs
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(PRESETS.pipeSizes)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-brand border border-blue-100 cursor-pointer"
                  >
                    + Pipes
                  </button>
                </div>
              </div>

              {/* Sizes List Table */}
              <div className="space-y-2.5">
                {batchSizes.map((sz, idx) => (
                  <div
                    key={sz.id}
                    className="flex items-center space-x-2.5 p-2 bg-gray-50/70 rounded-2xl border border-gray-200/70"
                  >
                    <span className="text-xs font-bold text-gray-400 w-6 text-center">
                      #{idx + 1}
                    </span>

                    <div className="flex-1">
                      <input
                        type="text"
                        value={sz.size}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBatchSizes((prev) =>
                            prev.map((item) => (item.id === sz.id ? { ...item, size: val } : item))
                          );
                        }}
                        placeholder="e.g. 1.0 SQ MM or 16A"
                        className="w-full px-3 py-2 bg-white rounded-xl text-xs font-bold text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                      />
                    </div>

                    <div className="w-36 relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={sz.price}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBatchSizes((prev) =>
                            prev.map((item) =>
                              item.id === sz.id ? { ...item, price: val } : item
                            )
                          );
                        }}
                        placeholder="Rate (₹)"
                        className="w-full pl-6 pr-3 py-2 bg-white rounded-xl text-xs font-bold text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                        ₹
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (batchSizes.length <= 1) return;
                        setBatchSizes((prev) => prev.filter((item) => item.id !== sz.id));
                      }}
                      disabled={batchSizes.length <= 1}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer disabled:opacity-30"
                      title="Remove Size"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setBatchSizes((prev) => [
                      ...prev,
                      { id: `sz-${Date.now()}-${prev.length}`, size: "", price: "" },
                    ])
                  }
                  className="mt-1 inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-brand hover:text-brand-hover bg-brand/5 hover:bg-brand/10 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Size Row</span>
                </button>
              </div>
            </div>

            {/* Step 3: Colors / Secondary Attribute (Optional) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="has-colors-toggle"
                    checked={hasColors}
                    onChange={(e) => setHasColors(e.target.checked)}
                    className="w-4 h-4 rounded-md accent-brand cursor-pointer"
                  />
                  <div>
                    <label
                      htmlFor="has-colors-toggle"
                      className="text-xs font-bold uppercase tracking-wider text-gray-800 cursor-pointer select-none"
                    >
                      3. Colors / Extra Attribute (Level d)
                    </label>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Enable if each size is available in multiple colors (e.g. Red, Black, Blue wires).
                    </p>
                  </div>
                </div>

                {hasColors && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-brand border border-blue-100">
                    {batchColors.length} Colors Active
                  </span>
                )}
              </div>

              {hasColors && (
                <div className="space-y-3 pt-1">
                  {/* Quick Electrical Color Chips */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 block">
                      Quick Standard Electrical Colors:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_ELECTRICAL_COLORS.map((color) => {
                        const isSelected = batchColors.includes(color);
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => toggleColorChip(color)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                              isSelected
                                ? "bg-brand text-white border-brand shadow-xs"
                                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <span>{color}</span>
                            {isSelected ? <Check size={12} /> : <Plus size={12} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Custom Color Input */}
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="text"
                      value={customColorInput}
                      onChange={(e) => setCustomColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomColor();
                        }
                      }}
                      placeholder="Add custom color / tag (e.g. IVORY, 3-PIN, DP) and press Enter"
                      className="flex-1 px-3.5 py-2 bg-gray-50 rounded-xl text-xs text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={addCustomColor}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Selected Colors List */}
                  {batchColors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {batchColors.map((col) => (
                        <span
                          key={col}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-semibold"
                        >
                          <span>{col}</span>
                          <button
                            type="button"
                            onClick={() => toggleColorChip(col)}
                            className="hover:text-rose-600 cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 4: Live Combinations Matrix Table (c b a / d c b a) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand" />
                    <span>4. Generated Products Matrix ({includedCount} Ready)</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Each product is compiled in reverse hierarchy (
                    <strong className="text-brand font-black">c b a</strong> or{" "}
                    <strong className="text-brand font-black">d c b a</strong>). Review or adjust prices below.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-xs font-bold text-gray-600 hover:text-brand flex items-center space-x-1 py-1 px-2.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    {includedCount === matrixRows.length ? (
                      <>
                        <CheckSquare size={14} className="text-brand" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <Square size={14} />
                        <span>Select All</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Combinations List */}
              {matrixRows.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Enter a Main Category and at least one size above to generate product combinations.
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {matrixRows.map((row) => (
                    <div
                      key={row.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        row.included
                          ? "bg-white border-gray-200 hover:border-brand/40 shadow-xs"
                          : "bg-gray-50/70 border-gray-150 opacity-50"
                      }`}
                    >
                      {/* Checkbox & Product Name */}
                      <div className="flex items-center space-x-3 flex-1 min-w-0 pr-3">
                        <input
                          type="checkbox"
                          checked={row.included}
                          onChange={(e) => {
                            const val = !e.target.checked;
                            setRowOverrides((prev) => ({
                              ...prev,
                              [row.id]: { ...prev[row.id], excluded: val },
                            }));
                          }}
                          className="w-4 h-4 rounded-md accent-brand cursor-pointer shrink-0"
                        />

                        <div className="min-w-0">
                          <p className="text-xs font-black text-gray-900 tracking-tight truncate">
                            {row.name || (
                              <span className="text-gray-400 italic font-normal">
                                Incomplete combination
                              </span>
                            )}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-medium mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-gray-100 font-mono">
                              Unit: {batchUnit || "COILS"}
                            </span>
                            {batchHsn && (
                              <span className="px-1.5 py-0.2 rounded bg-gray-100 font-mono">
                                HSN: {batchHsn}
                              </span>
                            )}
                            <span className="px-1.5 py-0.2 rounded bg-blue-50 text-brand font-bold">
                              GST: {batchGst || 18}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Editable Price for this combination */}
                      <div className="w-28 shrink-0 relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={!row.included}
                          value={row.price}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRowOverrides((prev) => ({
                              ...prev,
                              [row.id]: { ...prev[row.id], price: val },
                            }));
                          }}
                          placeholder="Rate"
                          className="w-full pl-5 pr-2.5 py-1.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:bg-gray-100"
                        />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                          ₹
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Matrix Summary & Action */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-gray-500 font-medium">
                  Ready to create <strong className="text-brand font-bold">{includedCount}</strong> products in catalog with shared HSN, GST & Unit.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchSubmit}
                    disabled={loading || includedCount === 0}
                    className="px-6 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        <span>Create All ({includedCount}) Products</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
