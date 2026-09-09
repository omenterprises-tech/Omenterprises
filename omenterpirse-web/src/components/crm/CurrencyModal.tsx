"use client";

import React, { useState, useMemo } from "react";
import { X, Search, Check } from "lucide-react";
import { CURRENCIES, CurrencyOption } from "@/lib/crmCurrencyData";

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCode: string;
  onSelect: (currency: CurrencyOption) => void;
}

export default function CurrencyModal({
  isOpen,
  onClose,
  selectedCode,
  onSelect,
}: CurrencyModalProps) {
  const [search, setSearch] = useState("");

  const filteredCurrencies = useMemo(() => {
    if (!search.trim()) return CURRENCIES;
    const q = search.toLowerCase().trim();
    return CURRENCIES.filter(
      (c) =>
        c.country.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[80vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Mobile drag handle */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Select Currency</h3>
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
              placeholder="Search by Name or Currency"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all placeholder:text-gray-400"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 text-xs text-gray-400 hover:text-gray-600 p-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Currency Cards List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {filteredCurrencies.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No currencies found matching &quot;{search}&quot;
            </div>
          ) : (
            filteredCurrencies.map((c) => {
              const isSelected = selectedCode === c.code;

              return (
                <button
                  key={`${c.country}-${c.code}`}
                  type="button"
                  onClick={() => {
                    onSelect(c);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 shadow-sm flex items-center justify-between group ${
                    isSelected
                      ? "border-brand bg-brand/5 ring-1 ring-brand shadow-md"
                      : "border-gray-200/80 bg-white hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-gray-900 text-base">{c.country}</div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {c.code}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      {c.priceFormatted}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center flex-shrink-0">
                      <Check size={14} />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
