"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Loader2, AlertCircle, Check, Package, Plus, Trash2, Layers } from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated?: (product: any) => void;
  onProductSaved?: (product: any) => void;
  initialProduct?: any | null;
}

export default function ProductModal({
  isOpen,
  onClose,
  onProductCreated,
  onProductSaved,
  initialProduct,
}: ProductModalProps) {
  // Hierarchical categories: Level 0 = Main Category (a), Level 1 = Sub-Category (b), Level 2 = Sub-Category (c)...
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
  const [generalError, setGeneralError] = useState("");

  const isEditing = Boolean(initialProduct?.id);

  // Compile reverse hierarchical name: c b a
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
        const cat = initialProduct.category && initialProduct.category !== "General" ? initialProduct.category : "";
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
      setGst(initialProduct.gst !== undefined && initialProduct.gst !== null ? String(initialProduct.gst) : "");
      setDescription(initialProduct.description || "");
      setUnit(initialProduct.unit || "");
      setHsn(initialProduct.hsn || "");
    } else {
      setCategories(["", "", ""]);
      setName("");
      setIsManualName(false);
      setPrice("");
      setGst("");
      setDescription("");
      setUnit("");
      setHsn("");
    }
    setErrors({});
    setGeneralError("");
  }, [initialProduct, isOpen]);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; price?: string } = {};

    const finalName = (name.trim() || compiledName.trim());
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
    setLoading(true);

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
        } else {
          if (onProductCreated) onProductCreated(data.product);
        }
        onClose();
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
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col overflow-y-auto font-inter text-gray-900 animate-in fade-in duration-150">
      {/* Full-Screen Sticky Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  {isEditing ? "Edit Product" : "Add Product"}
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  {isEditing ? "Update catalog product specifications" : "Register a new product in commercial catalog"}
                </p>
              </div>
            </div>

            <button
              type="submit"
              form="product-modal-form"
              disabled={loading}
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
          </div>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {generalError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        <form id="product-modal-form" onSubmit={handleSubmit} className="space-y-6">
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
                  <span className="text-[10px] text-gray-400 font-normal">e.g. Brand / Main Group</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={categories[0] || ""}
                    onChange={(e) => updateCategoryLevel(0, e.target.value)}
                    placeholder="e.g. POLYCAB, HAVELLS, WIRES & CABLES"
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
                  <span>
                    Sub-Category (b)
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">e.g. Cable Type / Series</span>
                </label>
                <input
                  type="text"
                  value={categories[1] || ""}
                  onChange={(e) => updateCategoryLevel(1, e.target.value)}
                  placeholder="e.g. 4 CORE ARMOURED, COPPER FLEXIBLE, MCB DP"
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
              </div>

              {/* Level 3: Sub-Category (c - Size / Spec) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span>
                    Sub-Category (c - Size / Spec / Rating)
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">e.g. Size, Gauge, Amperage</span>
                </label>
                <input
                  type="text"
                  value={categories[2] || ""}
                  onChange={(e) => updateCategoryLevel(2, e.target.value)}
                  placeholder="e.g. 16 SQ MM, 2.5 SQ MM, 32A C-CURVE"
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
              </div>

              {/* Optional Further Sub-Categories (Level 4, 5...) */}
              {categories.slice(3).map((cat, idx) => {
                const realIdx = idx + 3;
                const letter = String.fromCharCode(100 + idx); // d, e, f...
                return (
                  <div key={realIdx} className="flex items-center space-x-2">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Sub-Category ({letter} - Level {realIdx + 1})
                      </label>
                      <input
                        type="text"
                        value={cat}
                        onChange={(e) => updateCategoryLevel(realIdx, e.target.value)}
                        placeholder={`e.g. Color, Voltage, Grade (Level ${letter})`}
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
                  <span>+ Add Sub-Category Level</span>
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
                      e.g. 16 SQ MM 4 CORE ARMOURED POLYCAB
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
                    placeholder="0"
                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm pointer-events-none">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Commercial Code & Unit */}
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
                  placeholder="e.g. HSN / SAC code"
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

          {/* Form Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 pb-12">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Update Product" : "Save Product"}</span>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
