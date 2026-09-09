"use client";

import React, { useState, useMemo, useEffect } from "react";
import { X, Search, Check, Plus, Loader2 } from "lucide-react";
import { DEFAULT_BUSINESS_CATEGORIES } from "@/lib/crmCategoriesData";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  onSelect: (category: string) => void;
}

export default function CategoryModal({
  isOpen,
  onClose,
  selectedCategory,
  onSelect,
}: CategoryModalProps) {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>(DEFAULT_BUSINESS_CATEGORIES);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [addError, setAddError] = useState("");

  // Fetch custom categories for user
  useEffect(() => {
    if (!isOpen) return;
    setIsAddingCustom(false);
    setSearch("");
    setAddError("");

    fetch("/api/crm/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const defaults = data.defaultCategories || DEFAULT_BUSINESS_CATEGORIES;
          const custom = data.customCategories || [];
          // Combine and deduplicate
          const combined = Array.from(new Set([...custom, ...defaults]));
          setCategories(combined);
        }
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, [isOpen]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase().trim();
    return categories.filter((c) => c.toLowerCase().includes(q));
  }, [categories, search]);

  const handleAddCustomCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customCategoryInput.trim();
    if (!trimmed) {
      setAddError("Please enter a category name.");
      return;
    }

    setIsSavingCustom(true);
    setAddError("");

    try {
      const res = await fetch("/api/crm/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add category.");
      }

      // Add to list and select it
      setCategories((prev) => [trimmed, ...prev.filter((c) => c.toLowerCase() !== trimmed.toLowerCase())]);
      onSelect(trimmed);
      setCustomCategoryInput("");
      setIsAddingCustom(false);
      onClose();
    } catch (err: any) {
      setAddError(err.message || "Failed to add category.");
    } finally {
      setIsSavingCustom(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[80vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Mobile drag handle */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Select Category</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/60">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Custom Category Input Form (shown when 'Not found?' is clicked) */}
        {isAddingCustom && (
          <div className="p-4 bg-gray-50 border-b border-gray-200 animate-in fade-in duration-150">
            <form onSubmit={handleAddCustomCategory} className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Add Custom Category
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCustom(false);
                    setAddError("");
                  }}
                  className="text-gray-400 hover:text-gray-600 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>

              {addError && (
                <p className="text-xs text-rose-600 font-medium">{addError}</p>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  placeholder="Enter custom category name"
                  className="flex-1 px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
                <button
                  type="submit"
                  disabled={isSavingCustom || !customCategoryInput.trim()}
                  className="px-4 py-2.5 bg-[#18181B] hover:bg-black text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  {isSavingCustom ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  <span>Add</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 py-1">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => {
              const isSelected = selectedCategory.toLowerCase() === category.toLowerCase();
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    onSelect(category);
                    onClose();
                  }}
                  className={`w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                    isSelected ? "bg-brand/5 text-brand font-semibold" : "text-gray-800"
                  }`}
                >
                  <span className="text-sm">{category}</span>
                  {isSelected && <Check size={18} className="text-brand shrink-0" />}
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center text-gray-500">
              <p className="text-sm font-medium">No category matching "{search}"</p>
              <button
                type="button"
                onClick={() => {
                  setCustomCategoryInput(search);
                  setIsAddingCustom(true);
                }}
                className="mt-3 text-xs font-bold text-brand hover:underline"
              >
                Add "{search}" as custom category
              </button>
            </div>
          )}
        </div>

        {/* Bottom Not Found? Button (matching Image 5) */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <button
            type="button"
            onClick={() => setIsAddingCustom(true)}
            className="w-full py-3.5 bg-[#2B2B2B] hover:bg-[#18181B] text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Not found?</span>
          </button>
        </div>
      </div>
    </div>
  );
}
