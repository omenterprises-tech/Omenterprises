"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, AlertCircle, Printer, CheckCircle2, Building2, QrCode, CreditCard, Phone, Mail } from "lucide-react";
import { formatDisplayDate } from "@/lib/crmCurrencyData";

interface ItemRow {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  total: number;
}

interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (quotation: any) => void;
  business: any;
  caller: { name: string; role: string };
  customers: any[];
}

export function CreateQuotationModal({
  isOpen,
  onClose,
  onCreated,
  business,
  caller,
  customers,
}: CreateQuotationModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [quotationDate, setQuotationDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [items, setItems] = useState<ItemRow[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, taxPercent: 0, total: 0 },
  ]);
  const [paymentDisplayOption, setPaymentDisplayOption] = useState<"both" | "bank" | "upi">("both");

  const allBusinessPhones: string[] = React.useMemo(() => {
    if (!business) return [];
    if (Array.isArray(business.phoneNumbers) && business.phoneNumbers.length > 0) {
      return business.phoneNumbers;
    }
    if (typeof business.phoneNumbers === "string") {
      try {
        const parsed = JSON.parse(business.phoneNumbers);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (business.mobileNumber) return [business.mobileNumber];
    return [];
  }, [business]);

  const [selectedHeaderPhones, setSelectedHeaderPhones] = useState<string[]>([]);
  useEffect(() => {
    if (allBusinessPhones.length > 0) {
      setSelectedHeaderPhones(allBusinessPhones);
    }
  }, [allBusinessPhones]);

  const [notes, setNotes] = useState("Thank you for your business. Please contact us if you have any questions.");
  const [terms, setTerms] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) {
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setCustomerAddress("");
      setCustomerGstin("");
      return;
    }
    const found = customers.find((c) => String(c.id) === String(custId));
    if (found) {
      setCustomerName(found.name + (found.companyName ? " (" + found.companyName + ")" : ""));
      setCustomerEmail(found.email || "");
      setCustomerPhone(found.phone || "");
      setCustomerAddress([found.addressLine1, found.addressLine2, found.address, found.city, found.state, found.pincode].filter(Boolean).join(", "));
      setCustomerGstin(found.gstin || "");
    }
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const tax = Number(item.taxPercent) || 0;
      const base = qty * price;
      item.total = Math.round((base + (base * tax) / 100) * 100) / 100;
      updated[index] = item;
      return updated;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), description: "", quantity: 1, unitPrice: 0, taxPercent: 0, total: 0 },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const totalWithTax = items.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
  const taxTotal = Math.round((totalWithTax - subtotal) * 100) / 100;
  const grandTotal = Math.round(totalWithTax * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError("Customer name is required.");
      return;
    }

    if (items.some((it) => !it.description.trim())) {
      setError("All item descriptions must be filled.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/crm/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId || null,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim() || null,
          customerPhone: customerPhone.trim() || null,
          customerAddress: customerAddress.trim() || null,
          customerGstin: customerGstin.trim() || null,
          quotationDate: formatDisplayDate(quotationDate, business?.dateFormat),
          validUntil: validUntil ? formatDisplayDate(validUntil, business?.dateFormat) : null,
          items,
          subtotal,
          taxTotal,
          grandTotal,
          notes,
          termsConditions: terms,
          paymentDisplayOption,
          headerPhoneNumbers: selectedHeaderPhones.length > 0 ? selectedHeaderPhones : allBusinessPhones,
          status: "Draft",
        }),
      });

      const data = await res.json();
      if (data.success && data.quotation) {
        onCreated(data.quotation);
        onClose();
      } else {
        setError(data.error || "Failed to create quotation.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create quotation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Create New Quotation</h3>
            <p className="text-xs text-gray-500">Draft a formal quotation for your client</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Official Admin Business Header Badge */}
        <div className="mb-5 p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <Building2 size={16} className="text-brand shrink-0" />
            <span className="text-gray-700">
              Company Header: <strong className="text-brand font-bold">{business?.businessName || "Your Business"}</strong> (Admin Registered)
            </span>
          </div>
          <div className="text-gray-500">
            Author: <strong className="text-gray-800 font-semibold">{caller.name}</strong> ({caller.role})
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection & Details */}
          <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-800">Customer Details</span>
              {customers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Select Existing:</span>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white font-medium"
                  >
                    <option value="">-- Quick Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.companyName ? "• " + c.companyName : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Customer / Company Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Client Name or Company"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Contact Mobile"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Billing Address
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Complete Address, City, State"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Customer GSTIN
                </label>
                <input
                  type="text"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value)}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                />
              </div>
            </div>
          </div>

          {/* Quotation Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Quotation Date *
              </label>
              <input
                type="date"
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-800">Quotation Line Items</span>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand text-xs font-bold cursor-pointer transition-all"
              >
                <Plus size={14} />
                <span>Add Item</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Item Description *</th>
                    <th className="p-3 w-20">Qty</th>
                    <th className="p-3 w-28">Rate (₹)</th>
                    <th className="p-3 w-24">GST %</th>
                    <th className="p-3 w-28 text-right">Total (₹)</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="p-2">
                        <input
                          type="text"
                          value={it.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          placeholder="Product / Service description"
                          required
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-brand"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-brand text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.unitPrice}
                          onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-brand text-right"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={it.taxPercent}
                          onChange={(e) => handleItemChange(idx, "taxPercent", Number(e.target.value))}
                          className="w-full px-1.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-brand bg-white"
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </td>
                      <td className="p-2 text-right font-bold text-gray-900 pr-3">
                        ₹{(Number(it.total) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-72 bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (GST):</span>
                  <span className="font-semibold">₹{taxTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm text-gray-900">
                  <span>Grand Total:</span>
                  <span className="text-brand font-black">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Client Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Terms & Conditions (Points)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTerms((prev) => {
                      const lines = prev.split("\n").filter((l) => l.trim());
                      const nextNum = lines.length + 1;
                      const newLine = `${nextNum}. `;
                      return prev ? `${prev.trim()}\n${newLine}` : newLine;
                    });
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  + Add Point
                </button>
              </div>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                placeholder="1. Validity: 30 days...&#10;2. Payment: 100% advance..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand font-medium leading-relaxed"
              />
            </div>
          </div>

          {/* Payment Instructions Selector */}
          <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-2">
              Payment Instructions on Quotation
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentDisplayOption("both")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  paymentDisplayOption === "both"
                    ? "bg-brand text-white border-brand shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-1">
                  <CreditCard size={13} />
                  <span>+</span>
                  <QrCode size={13} />
                </div>
                <span>Both (Default)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentDisplayOption("bank")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  paymentDisplayOption === "bank"
                    ? "bg-brand text-white border-brand shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                <CreditCard size={13} />
                <span>Bank Only</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentDisplayOption("upi")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  paymentDisplayOption === "upi"
                    ? "bg-brand text-white border-brand shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                <QrCode size={13} />
                <span>UPI Only</span>
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold uppercase tracking-wider text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving Quotation...</span>
                </>
              ) : (
                <span>Create Quotation</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ViewQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: any;
  business: any;
  onStatusChange?: (newStatus: string) => void;
}

export function ViewQuotationModal({
  isOpen,
  onClose,
  quotation,
  business,
  onStatusChange,
}: ViewQuotationModalProps) {
  if (!isOpen || !quotation) return null;

  let parsedItems: any[] = [];
  try {
    parsedItems = typeof quotation.items === "string" ? JSON.parse(quotation.items) : quotation.items || [];
  } catch (e) {
    parsedItems = [];
  }

  let parsedOtherCharges: { label?: string; amount?: number; isTaxable?: boolean } | null = null;
  if (quotation.otherCharges) {
    try {
      parsedOtherCharges = typeof quotation.otherCharges === "string" ? JSON.parse(quotation.otherCharges) : quotation.otherCharges;
    } catch (e) {
      parsedOtherCharges = null;
    }
  }

  let modalHeaderPhones: string[] = [];
  if (quotation.headerPhoneNumbers) {
    try {
      const parsed =
        typeof quotation.headerPhoneNumbers === "string"
          ? JSON.parse(quotation.headerPhoneNumbers)
          : quotation.headerPhoneNumbers;
      if (Array.isArray(parsed) && parsed.length > 0) modalHeaderPhones = parsed;
    } catch (e) {}
  }
  if (modalHeaderPhones.length === 0) {
    if (business?.phoneNumbers) {
      try {
        const parsed =
          typeof business.phoneNumbers === "string"
            ? JSON.parse(business.phoneNumbers)
            : business.phoneNumbers;
        if (Array.isArray(parsed) && parsed.length > 0) modalHeaderPhones = parsed;
      } catch (e) {}
    }
  }
  if (modalHeaderPhones.length === 0 && business?.mobileNumber) {
    modalHeaderPhones = [business.mobileNumber];
  }

  const handlePrint = () => {
    const prevTitle = document.title;
    if (quotation?.quotationNumber) {
      document.title = `Quotation_${quotation.quotationNumber}`;
    }
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0mm !important;
        }
      `}</style>
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl p-6 sm:p-10 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:p-0 print:border-none">
        {/* Modal Controls (Hidden when printing) */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase text-gray-500">Status:</span>
            <select
              value={quotation.status}
              onChange={(e) => onStatusChange && onStatusChange(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 font-bold"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Declined">Declined</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover shadow cursor-pointer transition-all"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PRINTABLE QUOTATION SHEET */}
        <div className="space-y-6 text-gray-900 font-inter">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-brand/20 pb-6">
            <div className="space-y-1.5 max-w-sm">
              {business?.logoUrl ? (
                <img src={business.logoUrl} alt="Logo" className="h-12 object-contain mb-2" />
              ) : (
                <div className="text-2xl font-black text-brand tracking-tight font-playfair">
                  {business?.businessName || "BUSINESS NAME"}
                </div>
              )}
              <h2 className="text-lg font-bold text-gray-900">{business?.businessName}</h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                {[business?.addressLine1, business?.addressLine2, business?.addressLine3, business?.state].filter(Boolean).join(", ")}
              </p>
              {modalHeaderPhones.length > 0 && (
                <p className="text-xs text-gray-700 font-medium flex items-center gap-1.5">
                  <Phone size={12} className="text-brand shrink-0" />
                  <span className="text-gray-900 font-semibold">{modalHeaderPhones.join(", ")}</span>
                </p>
              )}
              {business?.email && (
                <p className="text-xs text-gray-700 font-medium flex items-center gap-1.5">
                  <Mail size={12} className="text-brand shrink-0" />
                  <span className="text-gray-900">{business.email}</span>
                </p>
              )}
              {business?.taxNumber && (
                <p className="text-xs font-semibold text-brand">
                  {business?.taxLabel || "GSTIN"}: {business?.taxNumber}
                </p>
              )}
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-3 py-1 bg-brand text-white text-xs font-extrabold uppercase tracking-widest rounded-md">
                QUOTATION
              </span>
              <p className="text-sm font-black text-gray-900 pt-1">{quotation.quotationNumber}</p>
              <p className="text-xs text-gray-500">Date: {formatDisplayDate(quotation.quotationDate, business?.dateFormat)}</p>
              {quotation.validUntil && (
                <p className="text-xs text-gray-500">Valid Until: {formatDisplayDate(quotation.validUntil, business?.dateFormat)}</p>
              )}
            </div>
          </div>

          {/* Customer / Quotation To */}
          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/70 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Quotation Prepared For
              </span>
              <h4 className="text-sm font-bold text-gray-900">{quotation.customerName}</h4>
              {quotation.customerAddress && (
                <p className="text-gray-600 mt-0.5">{quotation.customerAddress}</p>
              )}
              {quotation.customerPhone && (
                <p className="text-gray-600 mt-0.5">Phone: {quotation.customerPhone}</p>
              )}
              {quotation.customerEmail && (
                <p className="text-gray-600 mt-0.5">Email: {quotation.customerEmail}</p>
              )}
            </div>

            <div className="sm:text-right">
              {quotation.customerGstin && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    Customer GSTIN
                  </span>
                  <span className="font-bold text-gray-800 uppercase">{quotation.customerGstin}</span>
                </div>
              )}
              <div className="mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Author / Created By
                </span>
                <span className="font-semibold text-brand">
                  {quotation.createdByName} ({quotation.createdByRole})
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          {(() => {
            return (
              <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 border-b border-gray-200 font-bold uppercase tracking-wider text-gray-700 text-[10px]">
                    <tr>
                      <th className="p-2.5 w-8 text-center">
                        <div>Sl</div>
                        <div className="text-[9px] font-bold">No</div>
                      </th>
                      <th className="p-2.5">Description of Goods</th>
                      <th className="p-2.5 text-center w-20">HSN/SAC</th>
                      <th className="p-2.5 text-center w-14">
                        <div>GST</div>
                        <div className="text-[9px] font-bold">Rate</div>
                      </th>
                      <th className="p-2.5 text-center w-20">Quantity</th>
                      <th className="p-2.5 text-right w-24">Rate (₹)</th>
                      <th className="p-2.5 text-center w-14 lowercase font-bold">per</th>
                      <th className="p-2.5 text-right w-16">Disc %</th>
                      <th className="p-2.5 text-right w-24">
                        <div>Landed</div>
                        <div className="text-[9px] font-bold">Rate (₹)</div>
                      </th>
                      <th className="p-2.5 text-right w-28">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedItems.map((it: any, idx: number) => {
                      const qty = Number(it.quantity) || 1;
                      const price = Number(it.unitPrice) || 0;
                      const discPercent = Number(it.discountPercent) || 0;
                      const discPerUnit =
                        it.discountPerUnit !== undefined && it.discountPerUnit !== null
                          ? Number(it.discountPerUnit)
                          : Math.round(((price * discPercent) / 100) * 100) / 100;
                      const effectiveUnitPrice = price - discPerUnit;
                      const taxableBase = Math.round((qty * effectiveUnitPrice) * 100) / 100;
                      const unitName = it.unit || "COILS";

                      return (
                        <tr key={idx}>
                          <td className="p-2.5 text-center text-gray-400">{idx + 1}</td>
                          <td className="p-2.5 font-semibold text-gray-900">{it.name || it.description}</td>
                          <td className="p-2.5 text-center text-gray-600">
                            {it.hsn && it.hsn.trim() !== "-" ? it.hsn.trim() : "-"}
                          </td>
                          <td className="p-2.5 text-center text-gray-700 font-semibold">{it.taxPercent || 0}%</td>
                          <td className="p-2.5 text-center font-bold text-gray-800">
                            {qty} <span className="text-[10px] text-gray-500 uppercase">{unitName}</span>
                          </td>
                          <td className="p-2.5 text-right">
                            ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-center font-bold text-gray-700 uppercase text-[11px]">
                            {unitName}
                          </td>
                          <td className="p-2.5 text-right font-semibold text-emerald-700">
                            {discPercent > 0 ? `${discPercent}%` : "-"}
                          </td>
                          <td className="p-2.5 text-right font-semibold text-gray-900">
                            ₹{effectiveUnitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-right font-bold text-gray-900">
                            ₹{taxableBase.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Summary & Signatory Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            {/* Notes & Terms */}
            <div className="flex-1 space-y-3 text-xs text-gray-600">
              {quotation.notes && (
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-800 block mb-0.5">Notes:</span>
                  <p className="whitespace-pre-line">{quotation.notes}</p>
                </div>
              )}
              {quotation.termsConditions && (
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-800 block mb-0.5">Terms & Conditions:</span>
                  <p className="whitespace-pre-line">{quotation.termsConditions}</p>
                </div>
              )}

              {/* Payment Instructions / Bank & UPI Details */}
              {(() => {
                const bankName = business?.bankName || "";
                const bankAccount = business?.bankAccount || "";
                const bankIfsc = business?.bankIfsc || "";
                const bankBranch = business?.bankBranch || "";
                const upiId = business?.upiId || "";
                const upiQrCodeUrl = business?.upiQrCodeUrl || "";

                const paymentOption = quotation?.paymentDisplayOption || "both";
                const hasBankDetails = Boolean(bankName || bankAccount || bankIfsc);
                const hasUpiDetails = Boolean(upiId || upiQrCodeUrl);
                const showBank = (paymentOption === "bank" || paymentOption === "both") && hasBankDetails;
                const showUpi = (paymentOption === "upi" || paymentOption === "both") && hasUpiDetails;

                if (!showBank && !showUpi) return null;

                return (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] print:p-2">
                    <div className="font-bold text-gray-800 uppercase tracking-wider mb-2 text-[10px] border-b border-gray-200 pb-1">
                      Payment Instructions
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 items-start justify-between">
                      {/* Bank Details */}
                      {showBank && (
                        <div className="space-y-0.5 text-gray-600 flex-1">
                          <p className="font-semibold text-gray-800 text-[11px]">Direct Bank Transfer</p>
                          {bankName && (
                            <p>
                              <span className="text-gray-400">Bank:</span>{" "}
                              <strong className="text-gray-700">{bankName}</strong>
                            </p>
                          )}
                          {bankAccount && (
                            <p>
                              <span className="text-gray-400">A/C No:</span>{" "}
                              <strong className="font-mono text-gray-900">{bankAccount}</strong>
                            </p>
                          )}
                          {bankIfsc && (
                            <p>
                              <span className="text-gray-400">IFSC:</span>{" "}
                              <strong className="font-mono text-gray-900">{bankIfsc}</strong>
                            </p>
                          )}
                          {bankBranch && (
                            <p>
                              <span className="text-gray-400">Branch:</span> {bankBranch}
                            </p>
                          )}
                        </div>
                      )}

                      {/* UPI QR & ID */}
                      {showUpi && (
                        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-200 shrink-0">
                          {upiQrCodeUrl && (
                            <div className="w-28 h-28 rounded-lg border border-gray-200 p-1 overflow-hidden flex items-center justify-center bg-gray-50 shrink-0">
                              <img
                                src={upiQrCodeUrl}
                                alt="UPI QR Code"
                                crossOrigin="anonymous"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          <div className="space-y-1 text-[11px]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                              UPI Payment
                            </span>
                            {upiId && (
                              <div>
                                <span className="text-gray-400 block text-[9px]">UPI ID:</span>
                                <span className="font-mono font-bold text-gray-800 text-xs select-all">
                                  {upiId}
                                </span>
                              </div>
                            )}
                            <span className="text-[10px] text-gray-500 block">Scan to Pay via any UPI App</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {quotation.createdByName && (
                <div className="pt-2 text-[11px] text-gray-500 flex items-center gap-1.5">
                  <span className="font-semibold text-gray-700">Prepared by:</span>
                  <span className="font-medium text-gray-900">{quotation.createdByName}</span>
                  <span className="text-gray-400">({quotation.createdByRole || "Staff"})</span>
                </div>
              )}
            </div>

            {/* Financial Totals & Signatory */}
            <div className="w-full sm:w-72 space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
                {(() => {
                  const totalDiscountAmount = parsedItems.reduce((acc: number, it: any) => {
                    const qty = Number(it.quantity) || 1;
                    const price = Number(it.unitPrice) || 0;
                    const discPct = Number(it.discountPercent) || 0;
                    const discPerUnit =
                      it.discountPerUnit !== undefined && it.discountPerUnit !== null
                        ? Number(it.discountPerUnit)
                        : Math.round(((price * discPct) / 100) * 100) / 100;
                    return acc + qty * discPerUnit;
                  }, 0);

                  if (totalDiscountAmount > 0) {
                    return (
                      <>
                        <div className="flex justify-between text-gray-600">
                          <span>Gross Subtotal:</span>
                          <span className="font-semibold">
                            ₹{Number(quotation.subtotal + totalDiscountAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between text-emerald-700">
                          <span>Total Discount:</span>
                          <span className="font-bold">
                            -₹{totalDiscountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Taxable Subtotal:</span>
                          <span className="font-semibold">
                            ₹{Number(quotation.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </>
                    );
                  }

                  return (
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span className="font-semibold">
                        ₹{Number(quotation.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })()}
                {parsedOtherCharges && Number(parsedOtherCharges.amount) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>{parsedOtherCharges.label || "Other Charges"}:</span>
                    <span className="font-semibold">
                      ₹{Number(parsedOtherCharges.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Tax Amount:</span>
                  <span className="font-semibold">
                    ₹{Number(quotation.taxTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm text-gray-900">
                  <span>Grand Total:</span>
                  <span className="text-brand font-black">
                    ₹{Number(quotation.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Authorized Signatory of the Business */}
              <div className="border border-gray-200 rounded-2xl p-3 text-center space-y-1">
                {business?.signatureUrl ? (
                  <div className="h-16 flex items-center justify-center">
                    <img src={business.signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="h-14 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-[11px] text-gray-400">
                    Authorized Signatory
                  </div>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  For {business?.businessName || "OM Enterprises"}
                </span>
                <span className="text-[10px] text-gray-400">Authorized Signatory</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
