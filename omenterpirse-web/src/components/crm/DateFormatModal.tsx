"use client";

import React from "react";
import { X, Check } from "lucide-react";
import { DATE_FORMAT_PATTERNS, formatDateWithPattern } from "@/lib/crmCurrencyData";

interface DateFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFormat: string;
  onSelect: (format: string) => void;
}

export default function DateFormatModal({
  isOpen,
  onClose,
  selectedFormat,
  onSelect,
}: DateFormatModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
      >
        {/* Mobile drag handle bar */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Select Date Format</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formats List */}
        <div className="overflow-y-auto divide-y divide-gray-100 py-2">
          {DATE_FORMAT_PATTERNS.map((pattern) => {
            const formatted = formatDateWithPattern(pattern);
            const isSelected = selectedFormat === pattern;

            return (
              <button
                key={pattern}
                type="button"
                onClick={() => {
                  onSelect(pattern);
                  onClose();
                }}
                className={`w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors ${
                  isSelected ? "bg-brand/5 text-brand font-semibold" : "text-gray-800"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm sm:text-base font-medium">
                    {pattern} ({formatted})
                  </span>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center flex-shrink-0">
                    <Check size={14} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
