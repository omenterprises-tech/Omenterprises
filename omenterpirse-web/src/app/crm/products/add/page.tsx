"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Package,
  Plus,
  Trash2,
  Layers,
} from "lucide-react";

export default function AddProductPage() {
  const router = useRouter();

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
  const [successMsg, setSuccessMsg] = useState("");

  // Compile reverse hierarchical name: c b a
  const compiledName = useMemo(() => {
    return [...categories]
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
      .reverse()
      .join(" ");
  }, [categories]);

  // Sync name with auto-compiled reverse name
  useEffect(() => {
    if (!isManualName) {
      setName(compiledName);
    }
  }, [compiledName, isManualName]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setLoading(true);

    try {
      const res = await fetch("/api/crm/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        setSuccessMsg("Product added successfully!");
        setTimeout(() => {
          router.push("/crm/products");
        }, 1000);
      } else {
        if (data.field === "name") {
          setErrors((prev) => ({ ...prev, name: data.error }));
        } else if (data.field === "price") {
          setErrors((prev) => ({ ...prev, price: data.error }));
        } else {
          setGeneralError(data.error || "Failed to add product.");
        }
      }
    } catch (err: any) {
      setGeneralError(err.message || "Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-start items-center font-inter text-gray-900">
      <div className="w-full max-w-xl min-h-screen bg-white flex flex-col shadow-xl">
        {/* Blue Theme Header */}
        <div className="bg-brand text-white px-5 py-4 flex items-center space-x-3 sticky top-0 z-30 shadow-xs">
          <button
            type="button"
            onClick={() => router.push("/crm/products")}
            className="p-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            title="Back to Products"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">Add Product</h1>
            <p className="text-[11px] text-blue-100">Electrical Multi-Category Hierarchy</p>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto">
          {generalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{generalError}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 font-medium flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Electrical Category Hierarchy */}
          <div className="bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-200/80 space-y-3.5">
            <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
              <div className="flex items-center space-x-2">
                <Layers size={16} className="text-brand" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                  Category Hierarchy
                </h3>
              </div>
              <span className="text-[10px] font-bold text-brand bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                Reverse Order (c b a)
              </span>
            </div>
            <p className="text-[11px] text-gray-500 leading-tight">
              Enter categories in order. The document will automatically assemble them in reverse:{" "}
              <strong className="text-brand font-bold">Sub-Category c → Sub-Category b → Main Category a</strong>.
            </p>

            {/* Level 1: Main Category (a) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                <span>
                  Main Category (a) <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-gray-400 font-normal">e.g. Brand / Type</span>
              </label>
              <input
                type="text"
                value={categories[0] || ""}
                onChange={(e) => updateCategoryLevel(0, e.target.value)}
                placeholder="e.g. POLYCAB, HAVELLS, WIRES & CABLES"
                className={`w-full bg-white px-4 py-3 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? "border border-rose-500 ring-1 ring-rose-500/20"
                    : "border border-gray-200 focus:ring-brand/30 focus:border-brand"
                }`}
              />
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
                <span className="text-[10px] text-gray-400 font-normal">e.g. Series / Core Type</span>
              </label>
              <input
                type="text"
                value={categories[1] || ""}
                onChange={(e) => updateCategoryLevel(1, e.target.value)}
                placeholder="e.g. 4 CORE ARMOURED, COPPER FLEXIBLE"
                className="w-full bg-white px-4 py-3 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
              />
            </div>

            {/* Level 3: Sub-Category (c - Size / Spec) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                <span>Sub-Category (c - Size / Spec / Rating)</span>
                <span className="text-[10px] text-gray-400 font-normal">e.g. Dimension, Gauge, Amps</span>
              </label>
              <input
                type="text"
                value={categories[2] || ""}
                onChange={(e) => updateCategoryLevel(2, e.target.value)}
                placeholder="e.g. 16 SQ MM, 2.5 SQ MM, 32A C-CURVE"
                className="w-full bg-white px-4 py-3 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
              />
            </div>

            {/* Further nested levels (Level 4, 5...) */}
            {categories.slice(3).map((cat, idx) => {
              const realIdx = idx + 3;
              const letter = String.fromCharCode(100 + idx);
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
                      placeholder={`e.g. Color, Voltage, Grade`}
                      className="w-full bg-white px-4 py-3 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCategoryLevel(realIdx)}
                    className="mt-6 p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Remove level"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}

            {/* Add Level Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={addCategoryLevel}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-brand hover:text-brand-hover bg-brand/5 hover:bg-brand/10 rounded-xl transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>+ Add Sub-Category Level</span>
              </button>
            </div>

            {/* Live Reverse Preview Box */}
            <div className="mt-3 p-3.5 bg-white rounded-xl border border-gray-200 space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <span>Document Display Name (Reverse: c b a)</span>
                <span className="text-brand font-bold bg-blue-50 px-2 py-0.5 rounded-full">
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

            {/* Optional Manual Name Fine-Tune */}
            <details className="pt-1">
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
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl text-sm font-semibold text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
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
                    Reset to auto-compiled ({compiledName})
                  </button>
                )}
              </div>
            </details>
          </div>

          {/* Section 2: Pricing & GST */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                className={`w-full bg-[#F4F5F7] px-4 py-3 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                  errors.price
                    ? "border border-rose-500 ring-1 ring-rose-500/20 bg-rose-50/20"
                    : "border border-transparent focus:ring-brand/30"
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
                  className="w-full bg-[#F4F5F7] px-4 py-3 pr-10 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 border border-transparent transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-sm pointer-events-none">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Unit & HSN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Unit of Measure</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. COILS, METERS, PCS"
                className="w-full bg-[#F4F5F7] px-4 py-3 rounded-xl text-sm uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 border border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">HSN / SAC Code</label>
              <input
                type="text"
                value={hsn}
                onChange={(e) => setHsn(e.target.value)}
                placeholder="e.g. HSN code"
                className="w-full bg-[#F4F5F7] px-4 py-3 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 border border-transparent transition-all"
              />
            </div>
          </div>

          {/* Section 4: Specifications / Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Specifications / Remarks
            </label>
            <div className="bg-[#F4F5F7] rounded-xl p-3.5 border border-transparent focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/30 transition-all">
              <textarea
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Technical specifications, insulation, core remarks..."
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none resize-none"
              />
            </div>
            <div className="text-right text-[11px] text-gray-400 mt-1 font-medium pr-1">
              {description.length}/2000
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 pb-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Product</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
