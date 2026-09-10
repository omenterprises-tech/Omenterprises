"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

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
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [gst, setGst] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [hsn, setHsn] = useState("");

  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const isEditing = Boolean(initialProduct?.id);

  useEffect(() => {
    if (initialProduct) {
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
      setName("");
      setPrice("");
      setGst("");
      setDescription("");
      setUnit("");
      setHsn("");
    }
    setErrors({});
    setGeneralError("");
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

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
      const url = "/api/crm/products";
      const method = isEditing ? "PUT" : "POST";
      const payload: any = {
        name: name.trim(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Blue Theme Header */}
        <div className="bg-brand text-white px-5 py-4 flex items-center space-x-3 shrink-0 shadow-sm">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            title="Back / Close"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-base font-bold tracking-tight text-white">
            {isEditing ? "Edit Product" : "Add Product"}
          </h2>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {generalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{generalError}</span>
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

          {/* 4. Description (Optional, with 0/2000 counter) */}
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
          <div className="pt-2 pb-1">
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
                <span>{isEditing ? "Save Changes" : "Add"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
