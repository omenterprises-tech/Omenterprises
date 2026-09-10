"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AddProductPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [gst, setGst] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [hsn, setHsn] = useState("");

  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; price?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Product Name is required";
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
          name: name.trim(),
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-start items-center font-inter">
      {/* Container */}
      <div className="w-full max-w-md min-h-screen bg-white flex flex-col shadow-xl">
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
          <h1 className="text-base font-bold tracking-tight text-white">
            Add Product
          </h1>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 flex-1 overflow-y-auto">
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

          {/* 1. Product Name (Mandatory) */}
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              placeholder="Product Name"
              className={`w-full bg-[#F4F5F7] px-4 py-3.5 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                errors.name
                  ? "border border-rose-500 ring-1 ring-rose-500/20 bg-rose-50/20"
                  : "border border-transparent focus:ring-brand/30"
              }`}
            />
            {errors.name && (
              <p className="text-xs text-rose-600 font-medium mt-1 pl-1 flex items-center gap-1">
                <AlertCircle size={12} className="shrink-0" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* 2. Price (Mandatory) */}
          <div>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                if (errors.price) {
                  setErrors((prev) => ({ ...prev, price: undefined }));
                }
              }}
              placeholder="Price"
              className={`w-full bg-[#F4F5F7] px-4 py-3.5 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
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

          {/* 3. GST (Optional, with % on the right) */}
          <div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={gst}
                onChange={(e) => setGst(e.target.value)}
                placeholder="GST"
                className="w-full bg-[#F4F5F7] px-4 py-3.5 pr-10 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 border border-transparent transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-800 font-bold text-sm pointer-events-none">
                %
              </span>
            </div>
          </div>

          {/* 4. Description (Optional, with 0/2000 character counter) */}
          <div>
            <div className="bg-[#F4F5F7] rounded-2xl p-4 border border-transparent focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/30 transition-all">
              <textarea
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none resize-none"
              />
            </div>
            <div className="text-right text-xs text-gray-400 mt-1 font-medium pr-1">
              {description.length}/2000
            </div>
          </div>

          {/* 5. Unit Of Measure (Optional) */}
          <div>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Unit Of Measure(SET, KG etc.)"
              className="w-full bg-[#F4F5F7] px-4 py-3.5 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 border border-transparent transition-all"
            />
          </div>

          {/* 6. HSN (Optional) */}
          <div>
            <input
              type="text"
              value={hsn}
              onChange={(e) => setHsn(e.target.value)}
              placeholder="HSN"
              className="w-full bg-[#F4F5F7] px-4 py-3.5 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/30 border border-transparent transition-all"
            />
          </div>

          {/* Action Button */}
          <div className="pt-3 pb-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand hover:bg-brand-hover text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Add Product</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
